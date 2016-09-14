'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RotaryEncoder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _raspiGpio = require('raspi-gpio');

var _raspiBoard = require('raspi-board');

var _onoff = require('onoff');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               The MIT License (MIT)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               Copyright (c) 2016 Andrew Nicolaou <me@andrewnicolaou.co.uk>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               Permission is hereby granted, free of charge, to any person obtaining a copy
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               of this software and associated documentation files (the "Software"), to deal
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               in the Software without restriction, including without limitation the rights
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               copies of the Software, and to permit persons to whom the Software is
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               furnished to do so, subject to the following conditions:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               The above copyright notice and this permission notice shall be included in
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               all copies or substantial portions of the Software.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               THE SOFTWARE.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */


function resolveWiringPiToGPIO(wiringPiPin) {
  try {
    return (0, _raspiBoard.getPins)()[wiringPiPin].pins.find(function (p) {
      return (/GPIO/.test(p)
      );
    }).replace('GPIO', '');
  } catch (e) {
    console.error('Cannot find GPIO number for pin: ', wiringPiPin);
    throw e;
  }
}

var INPUT = 'in';
var EDGE_BOTH = 'both';

var RotaryEncoder = exports.RotaryEncoder = function (_EventEmitter) {
  _inherits(RotaryEncoder, _EventEmitter);

  function RotaryEncoder(aConfig, bConfig) {
    _classCallCheck(this, RotaryEncoder);

    // Bind update method to class so it is always
    // called in the correct context
    var _this = _possibleConstructorReturn(this, (RotaryEncoder.__proto__ || Object.getPrototypeOf(RotaryEncoder)).call(this));

    _this.handleUpdate = _this.handleUpdate.bind(_this);
    _this.handleInterrupt = _this.handleInterrupt.bind(_this);

    // Use this to set pin mode and pull resistor state
    var a = new _raspiGpio.DigitalInput(aConfig);
    var b = new _raspiGpio.DigitalInput(bConfig);

    var aGpioNum = resolveWiringPiToGPIO(a.pins[0]);
    var bGpioNum = resolveWiringPiToGPIO(b.pins[0]);

    _this.aPin = new _onoff.Gpio(aGpioNum, INPUT, EDGE_BOTH);
    _this.bPin = new _onoff.Gpio(bGpioNum, INPUT, EDGE_BOTH);

    _this.value = 0;
    _this.lastEncoded = 0;

    _this.aPin.watch(_this.handleInterrupt);
    _this.bPin.watch(_this.handleInterrupt);
    return _this;
  }

  _createClass(RotaryEncoder, [{
    key: 'handleInterrupt',
    value: function handleInterrupt() {
      this.handleUpdate(this.aPin.readSync(), this.bPin.readSync());
    }
  }, {
    key: 'handleUpdate',
    value: function handleUpdate(aValue, bValue) {
      var MSB = aValue;
      var LSB = bValue;
      var lastValue = this.value;

      var encoded = MSB << 1 | LSB;
      var sum = this.lastEncoded << 2 | encoded;

      if (sum == 13 || sum == 4 || sum == 2 || sum == 11) {
        this.value++;
      }
      if (sum == 14 || sum == 7 || sum == 1 || sum == 8) {
        this.value--;
      }

      this.lastEncoded = encoded;

      if (lastValue !== this.value) {
        this.emit('change', { value: this.value });
      }
    }
  }]);

  return RotaryEncoder;
}(_events.EventEmitter);

// Expose these constants for clients to set resistors


RotaryEncoder.PULL_NONE = _raspiGpio.PULL_NONE;
RotaryEncoder.PULL_UP = _raspiGpio.PULL_UP;
RotaryEncoder.PULL_DOWN = _raspiGpio.PULL_DOWN;

//# sourceMappingURL=data:application/json;base64,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cHlyaWdodCAoYykgMjAxNiBBbmRyZXcgTmljb2xhb3UgPG1lQGFuZHJld25pY29sYW91LmNvLnVrPlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG4qL1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IERpZ2l0YWxJbnB1dCwgUFVMTF9VUCwgUFVMTF9ET1dOLCBQVUxMX05PTkUgfSBmcm9tICdyYXNwaS1ncGlvJztcbmltcG9ydCB7IGdldFBpbnMgfSBmcm9tICdyYXNwaS1ib2FyZCc7XG5pbXBvcnQgeyBHcGlvIH0gZnJvbSAnb25vZmYnO1xuXG5mdW5jdGlvbiByZXNvbHZlV2lyaW5nUGlUb0dQSU8od2lyaW5nUGlQaW4pIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZ2V0UGlucygpW3dpcmluZ1BpUGluXS5waW5zLmZpbmQoIHAgPT4gL0dQSU8vLnRlc3QocCkgKS5yZXBsYWNlKCdHUElPJywgJycpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDYW5ub3QgZmluZCBHUElPIG51bWJlciBmb3IgcGluOiAnLCB3aXJpbmdQaVBpbik7XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5jb25zdCBJTlBVVCA9ICdpbic7XG5jb25zdCBFREdFX0JPVEggPSAnYm90aCc7XG5cbmV4cG9ydCBjbGFzcyBSb3RhcnlFbmNvZGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoYUNvbmZpZywgYkNvbmZpZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBCaW5kIHVwZGF0ZSBtZXRob2QgdG8gY2xhc3Mgc28gaXQgaXMgYWx3YXlzXG4gICAgLy8gY2FsbGVkIGluIHRoZSBjb3JyZWN0IGNvbnRleHRcbiAgICB0aGlzLmhhbmRsZVVwZGF0ZSA9IHRoaXMuaGFuZGxlVXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVJbnRlcnJ1cHQgPSB0aGlzLmhhbmRsZUludGVycnVwdC5iaW5kKHRoaXMpO1xuXG4gICAgLy8gVXNlIHRoaXMgdG8gc2V0IHBpbiBtb2RlIGFuZCBwdWxsIHJlc2lzdG9yIHN0YXRlXG4gICAgY29uc3QgYSA9IG5ldyBEaWdpdGFsSW5wdXQoYUNvbmZpZyk7XG4gICAgY29uc3QgYiA9IG5ldyBEaWdpdGFsSW5wdXQoYkNvbmZpZyk7XG5cbiAgICBjb25zdCBhR3Bpb051bSA9IHJlc29sdmVXaXJpbmdQaVRvR1BJTyhhLnBpbnNbMF0pO1xuICAgIGNvbnN0IGJHcGlvTnVtID0gcmVzb2x2ZVdpcmluZ1BpVG9HUElPKGIucGluc1swXSk7XG5cbiAgICB0aGlzLmFQaW4gPSBuZXcgR3BpbyhhR3Bpb051bSwgSU5QVVQsIEVER0VfQk9USCk7XG4gICAgdGhpcy5iUGluID0gbmV3IEdwaW8oYkdwaW9OdW0sIElOUFVULCBFREdFX0JPVEgpO1xuXG4gICAgdGhpcy52YWx1ZSA9IDA7XG4gICAgdGhpcy5sYXN0RW5jb2RlZCA9IDA7XG5cbiAgICB0aGlzLmFQaW4ud2F0Y2godGhpcy5oYW5kbGVJbnRlcnJ1cHQpO1xuICAgIHRoaXMuYlBpbi53YXRjaCh0aGlzLmhhbmRsZUludGVycnVwdCk7XG4gIH1cbiAgaGFuZGxlSW50ZXJydXB0KCkge1xuICAgIHRoaXMuaGFuZGxlVXBkYXRlKHRoaXMuYVBpbi5yZWFkU3luYygpLCB0aGlzLmJQaW4ucmVhZFN5bmMoKSk7XG4gIH1cbiAgaGFuZGxlVXBkYXRlKGFWYWx1ZSwgYlZhbHVlKSB7XG4gICAgY29uc3QgTVNCID0gYVZhbHVlO1xuICAgIGNvbnN0IExTQiA9IGJWYWx1ZTtcbiAgICBjb25zdCBsYXN0VmFsdWUgPSB0aGlzLnZhbHVlO1xuXG4gICAgY29uc3QgZW5jb2RlZCA9IChNU0IgPDwgMSkgfCBMU0I7XG4gICAgY29uc3Qgc3VtID0gKHRoaXMubGFzdEVuY29kZWQgPDwgMikgfCBlbmNvZGVkO1xuXG4gICAgaWYgKHN1bSA9PSAwYjExMDEgfHwgc3VtID09IDBiMDEwMCB8fCBzdW0gPT0gMGIwMDEwIHx8IHN1bSA9PSAwYjEwMTEpIHtcbiAgICAgIHRoaXMudmFsdWUrKztcbiAgICB9XG4gICAgaWYgKHN1bSA9PSAwYjExMTAgfHwgc3VtID09IDBiMDExMSB8fCBzdW0gPT0gMGIwMDAxIHx8IHN1bSA9PSAwYjEwMDApIHtcbiAgICAgIHRoaXMudmFsdWUtLTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RFbmNvZGVkID0gZW5jb2RlZDtcblxuICAgIGlmIChsYXN0VmFsdWUgIT09IHRoaXMudmFsdWUpIHtcbiAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgeyB2YWx1ZTogdGhpcy52YWx1ZSB9KTtcbiAgICB9XG4gIH1cbn1cblxuLy8gRXhwb3NlIHRoZXNlIGNvbnN0YW50cyBmb3IgY2xpZW50cyB0byBzZXQgcmVzaXN0b3JzXG5Sb3RhcnlFbmNvZGVyLlBVTExfTk9ORSA9IFBVTExfTk9ORTtcblJvdGFyeUVuY29kZXIuUFVMTF9VUCA9IFBVTExfVVA7XG5Sb3RhcnlFbmNvZGVyLlBVTExfRE9XTiA9IFBVTExfRE9XTjtcbiJdfQ==