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

function pullResistorValueForString() {
  var str = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

  switch (str) {
    case 'up':
      return _raspiGpio.PULL_UP;
    case 'down':
      return _raspiGpio.PULL_DOWN;
    case 'none':
      return _raspiGpio.PULL_NONE;
    default:
      return null;
  }
}

var INPUT = 'in';
var EDGE_BOTH = 'both';

var RotaryEncoder = exports.RotaryEncoder = function (_EventEmitter) {
  _inherits(RotaryEncoder, _EventEmitter);

  function RotaryEncoder() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? { pins: null } : arguments[0];

    _classCallCheck(this, RotaryEncoder);

    var _this = _possibleConstructorReturn(this, (RotaryEncoder.__proto__ || Object.getPrototypeOf(RotaryEncoder)).call(this));

    if (config.pins === null || config.pins.a == null || config.pins.b == null) {
      throw new Error('RotaryEncoder requires pins.a and pins.b to be specified in config');
    }

    // Bind update method to class so it is always
    // called in the correct context
    _this.handleUpdate = _this.handleUpdate.bind(_this);
    _this.handleInterrupt = _this.handleInterrupt.bind(_this);

    var pullResistorConfig = config.pullResistors || {};

    var aConfig = {
      pin: config.pins.a,
      pullResistor: pullResistorValueForString(pullResistorConfig.a)
    };

    var bConfig = {
      pin: config.pins.b,
      pullResistor: pullResistorValueForString(pullResistorConfig.b)
    };

    console.log(aConfig, bConfig);

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

//# sourceMappingURL=data:application/json;base64,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TUFBWjtBQUNBLFVBQU0sTUFBTSxNQUFaO0FBQ0EsVUFBTSxZQUFZLEtBQUssS0FBdkI7O0FBRUEsVUFBTSxVQUFXLE9BQU8sQ0FBUixHQUFhLEdBQTdCO0FBQ0EsVUFBTSxNQUFPLEtBQUssV0FBTCxJQUFvQixDQUFyQixHQUEwQixPQUF0Qzs7QUFFQSxVQUFJLE9BQU8sRUFBUCxJQUFpQixPQUFPLENBQXhCLElBQWtDLE9BQU8sQ0FBekMsSUFBbUQsT0FBTyxFQUE5RCxFQUFzRTtBQUNwRSxhQUFLLEtBQUw7QUFDRDtBQUNELFVBQUksT0FBTyxFQUFQLElBQWlCLE9BQU8sQ0FBeEIsSUFBa0MsT0FBTyxDQUF6QyxJQUFtRCxPQUFPLENBQTlELEVBQXNFO0FBQ3BFLGFBQUssS0FBTDtBQUNEOztBQUVELFdBQUssV0FBTCxHQUFtQixPQUFuQjs7QUFFQSxVQUFJLGNBQWMsS0FBSyxLQUF2QixFQUE4QjtBQUM1QixhQUFLLElBQUwsQ0FBVSxRQUFWLEVBQW9CLEVBQUUsT0FBTyxLQUFLLEtBQWQsRUFBcEI7QUFDRDtBQUNGIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcblRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG5Db3B5cmlnaHQgKGMpIDIwMTYgQW5kcmV3IE5pY29sYW91IDxtZUBhbmRyZXduaWNvbGFvdS5jby51az5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuKi9cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBEaWdpdGFsSW5wdXQsIFBVTExfVVAsIFBVTExfRE9XTiwgUFVMTF9OT05FIH0gZnJvbSAncmFzcGktZ3Bpbyc7XG5pbXBvcnQgeyBnZXRQaW5zIH0gZnJvbSAncmFzcGktYm9hcmQnO1xuaW1wb3J0IHsgR3BpbyB9IGZyb20gJ29ub2ZmJztcblxuZnVuY3Rpb24gcmVzb2x2ZVdpcmluZ1BpVG9HUElPKHdpcmluZ1BpUGluKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGdldFBpbnMoKVt3aXJpbmdQaVBpbl0ucGlucy5maW5kKCBwID0+IC9HUElPLy50ZXN0KHApICkucmVwbGFjZSgnR1BJTycsICcnKVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcignQ2Fubm90IGZpbmQgR1BJTyBudW1iZXIgZm9yIHBpbjogJywgd2lyaW5nUGlQaW4pO1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVsbFJlc2lzdG9yVmFsdWVGb3JTdHJpbmcoc3RyPW51bGwpIHtcbiAgc3dpdGNoIChzdHIpIHtcbiAgICBjYXNlICd1cCcgIDogcmV0dXJuIFBVTExfVVA7XG4gICAgY2FzZSAnZG93bic6IHJldHVybiBQVUxMX0RPV047XG4gICAgY2FzZSAnbm9uZSc6IHJldHVybiBQVUxMX05PTkU7XG4gICAgZGVmYXVsdDogICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmNvbnN0IElOUFVUID0gJ2luJztcbmNvbnN0IEVER0VfQk9USCA9ICdib3RoJztcblxuZXhwb3J0IGNsYXNzIFJvdGFyeUVuY29kZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3Rvcihjb25maWc9eyBwaW5zOiBudWxsIH0pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKGNvbmZpZy5waW5zID09PSBudWxsIHx8IGNvbmZpZy5waW5zLmEgPT0gbnVsbCB8fCBjb25maWcucGlucy5iID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm90YXJ5RW5jb2RlciByZXF1aXJlcyBwaW5zLmEgYW5kIHBpbnMuYiB0byBiZSBzcGVjaWZpZWQgaW4gY29uZmlnJyk7XG4gICAgfVxuXG4gICAgLy8gQmluZCB1cGRhdGUgbWV0aG9kIHRvIGNsYXNzIHNvIGl0IGlzIGFsd2F5c1xuICAgIC8vIGNhbGxlZCBpbiB0aGUgY29ycmVjdCBjb250ZXh0XG4gICAgdGhpcy5oYW5kbGVVcGRhdGUgPSB0aGlzLmhhbmRsZVVwZGF0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlSW50ZXJydXB0ID0gdGhpcy5oYW5kbGVJbnRlcnJ1cHQuYmluZCh0aGlzKTtcblxuICAgIGNvbnN0IHB1bGxSZXNpc3RvckNvbmZpZyA9IGNvbmZpZy5wdWxsUmVzaXN0b3JzIHx8IHt9O1xuXG4gICAgY29uc3QgYUNvbmZpZyA9IHtcbiAgICAgIHBpbjogY29uZmlnLnBpbnMuYSxcbiAgICAgIHB1bGxSZXNpc3RvcjogcHVsbFJlc2lzdG9yVmFsdWVGb3JTdHJpbmcocHVsbFJlc2lzdG9yQ29uZmlnLmEpXG4gICAgfTtcblxuICAgIGNvbnN0IGJDb25maWcgPSB7XG4gICAgICBwaW46IGNvbmZpZy5waW5zLmIsXG4gICAgICBwdWxsUmVzaXN0b3I6IHB1bGxSZXNpc3RvclZhbHVlRm9yU3RyaW5nKHB1bGxSZXNpc3RvckNvbmZpZy5iKVxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZyhhQ29uZmlnLCBiQ29uZmlnKTtcblxuICAgIC8vIFVzZSB0aGlzIHRvIHNldCBwaW4gbW9kZSBhbmQgcHVsbCByZXNpc3RvciBzdGF0ZVxuICAgIGNvbnN0IGEgPSBuZXcgRGlnaXRhbElucHV0KGFDb25maWcpO1xuICAgIGNvbnN0IGIgPSBuZXcgRGlnaXRhbElucHV0KGJDb25maWcpO1xuXG4gICAgY29uc3QgYUdwaW9OdW0gPSByZXNvbHZlV2lyaW5nUGlUb0dQSU8oYS5waW5zWzBdKTtcbiAgICBjb25zdCBiR3Bpb051bSA9IHJlc29sdmVXaXJpbmdQaVRvR1BJTyhiLnBpbnNbMF0pO1xuXG4gICAgdGhpcy5hUGluID0gbmV3IEdwaW8oYUdwaW9OdW0sIElOUFVULCBFREdFX0JPVEgpO1xuICAgIHRoaXMuYlBpbiA9IG5ldyBHcGlvKGJHcGlvTnVtLCBJTlBVVCwgRURHRV9CT1RIKTtcblxuICAgIHRoaXMudmFsdWUgPSAwO1xuICAgIHRoaXMubGFzdEVuY29kZWQgPSAwO1xuXG4gICAgdGhpcy5hUGluLndhdGNoKHRoaXMuaGFuZGxlSW50ZXJydXB0KTtcbiAgICB0aGlzLmJQaW4ud2F0Y2godGhpcy5oYW5kbGVJbnRlcnJ1cHQpO1xuICB9XG4gIGhhbmRsZUludGVycnVwdCgpIHtcbiAgICB0aGlzLmhhbmRsZVVwZGF0ZSh0aGlzLmFQaW4ucmVhZFN5bmMoKSwgdGhpcy5iUGluLnJlYWRTeW5jKCkpO1xuICB9XG4gIGhhbmRsZVVwZGF0ZShhVmFsdWUsIGJWYWx1ZSkge1xuICAgIGNvbnN0IE1TQiA9IGFWYWx1ZTtcbiAgICBjb25zdCBMU0IgPSBiVmFsdWU7XG4gICAgY29uc3QgbGFzdFZhbHVlID0gdGhpcy52YWx1ZTtcblxuICAgIGNvbnN0IGVuY29kZWQgPSAoTVNCIDw8IDEpIHwgTFNCO1xuICAgIGNvbnN0IHN1bSA9ICh0aGlzLmxhc3RFbmNvZGVkIDw8IDIpIHwgZW5jb2RlZDtcblxuICAgIGlmIChzdW0gPT0gMGIxMTAxIHx8IHN1bSA9PSAwYjAxMDAgfHwgc3VtID09IDBiMDAxMCB8fCBzdW0gPT0gMGIxMDExKSB7XG4gICAgICB0aGlzLnZhbHVlKys7XG4gICAgfVxuICAgIGlmIChzdW0gPT0gMGIxMTEwIHx8IHN1bSA9PSAwYjAxMTEgfHwgc3VtID09IDBiMDAwMSB8fCBzdW0gPT0gMGIxMDAwKSB7XG4gICAgICB0aGlzLnZhbHVlLS07XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0RW5jb2RlZCA9IGVuY29kZWQ7XG5cbiAgICBpZiAobGFzdFZhbHVlICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScsIHsgdmFsdWU6IHRoaXMudmFsdWUgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=