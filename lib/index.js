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

//# sourceMappingURL=data:application/json;base64,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WSxLQUFLLEtBQXZCOztBQUVBLFVBQU0sVUFBVyxPQUFPLENBQVIsR0FBYSxHQUE3QjtBQUNBLFVBQU0sTUFBTyxLQUFLLFdBQUwsSUFBb0IsQ0FBckIsR0FBMEIsT0FBdEM7O0FBRUEsVUFBSSxPQUFPLEVBQVAsSUFBaUIsT0FBTyxDQUF4QixJQUFrQyxPQUFPLENBQXpDLElBQW1ELE9BQU8sRUFBOUQsRUFBc0U7QUFDcEUsYUFBSyxLQUFMO0FBQ0Q7QUFDRCxVQUFJLE9BQU8sRUFBUCxJQUFpQixPQUFPLENBQXhCLElBQWtDLE9BQU8sQ0FBekMsSUFBbUQsT0FBTyxDQUE5RCxFQUFzRTtBQUNwRSxhQUFLLEtBQUw7QUFDRDs7QUFFRCxXQUFLLFdBQUwsR0FBbUIsT0FBbkI7O0FBRUEsVUFBSSxjQUFjLEtBQUssS0FBdkIsRUFBOEI7QUFDNUIsYUFBSyxJQUFMLENBQVUsUUFBVixFQUFvQixFQUFFLE9BQU8sS0FBSyxLQUFkLEVBQXBCO0FBQ0Q7QUFDRiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5UaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuQ29weXJpZ2h0IChjKSAyMDE2IEFuZHJldyBOaWNvbGFvdSA8bWVAYW5kcmV3bmljb2xhb3UuY28udWs+XG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cbiovXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgRGlnaXRhbElucHV0LCBQVUxMX1VQLCBQVUxMX0RPV04sIFBVTExfTk9ORSB9IGZyb20gJ3Jhc3BpLWdwaW8nO1xuaW1wb3J0IHsgZ2V0UGlucyB9IGZyb20gJ3Jhc3BpLWJvYXJkJztcbmltcG9ydCB7IEdwaW8gfSBmcm9tICdvbm9mZic7XG5cbmZ1bmN0aW9uIHJlc29sdmVXaXJpbmdQaVRvR1BJTyh3aXJpbmdQaVBpbikge1xuICB0cnkge1xuICAgIHJldHVybiBnZXRQaW5zKClbd2lyaW5nUGlQaW5dLnBpbnMuZmluZCggcCA9PiAvR1BJTy8udGVzdChwKSApLnJlcGxhY2UoJ0dQSU8nLCAnJylcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Nhbm5vdCBmaW5kIEdQSU8gbnVtYmVyIGZvciBwaW46ICcsIHdpcmluZ1BpUGluKTtcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHB1bGxSZXNpc3RvclZhbHVlRm9yU3RyaW5nKHN0cj1udWxsKSB7XG4gIHN3aXRjaCAoc3RyKSB7XG4gICAgY2FzZSAndXAnICA6IHJldHVybiBQVUxMX1VQO1xuICAgIGNhc2UgJ2Rvd24nOiByZXR1cm4gUFVMTF9ET1dOO1xuICAgIGNhc2UgJ25vbmUnOiByZXR1cm4gUFVMTF9OT05FO1xuICAgIGRlZmF1bHQ6ICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5jb25zdCBJTlBVVCA9ICdpbic7XG5jb25zdCBFREdFX0JPVEggPSAnYm90aCc7XG5cbmV4cG9ydCBjbGFzcyBSb3RhcnlFbmNvZGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY29uZmlnPXsgcGluczogbnVsbCB9KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGlmIChjb25maWcucGlucyA9PT0gbnVsbCB8fCBjb25maWcucGlucy5hID09IG51bGwgfHwgY29uZmlnLnBpbnMuYiA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JvdGFyeUVuY29kZXIgcmVxdWlyZXMgcGlucy5hIGFuZCBwaW5zLmIgdG8gYmUgc3BlY2lmaWVkIGluIGNvbmZpZycpO1xuICAgIH1cblxuICAgIC8vIEJpbmQgdXBkYXRlIG1ldGhvZCB0byBjbGFzcyBzbyBpdCBpcyBhbHdheXNcbiAgICAvLyBjYWxsZWQgaW4gdGhlIGNvcnJlY3QgY29udGV4dFxuICAgIHRoaXMuaGFuZGxlVXBkYXRlID0gdGhpcy5oYW5kbGVVcGRhdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZUludGVycnVwdCA9IHRoaXMuaGFuZGxlSW50ZXJydXB0LmJpbmQodGhpcyk7XG5cbiAgICBjb25zdCBwdWxsUmVzaXN0b3JDb25maWcgPSBjb25maWcucHVsbFJlc2lzdG9ycyB8fCB7fTtcblxuICAgIGNvbnN0IGFDb25maWcgPSB7XG4gICAgICBwaW46IGNvbmZpZy5waW5zLmEsXG4gICAgICBwdWxsUmVzaXN0b3I6IHB1bGxSZXNpc3RvclZhbHVlRm9yU3RyaW5nKHB1bGxSZXNpc3RvckNvbmZpZy5hKVxuICAgIH07XG5cbiAgICBjb25zdCBiQ29uZmlnID0ge1xuICAgICAgcGluOiBjb25maWcucGlucy5iLFxuICAgICAgcHVsbFJlc2lzdG9yOiBwdWxsUmVzaXN0b3JWYWx1ZUZvclN0cmluZyhwdWxsUmVzaXN0b3JDb25maWcuYilcbiAgICB9O1xuXG4gICAgLy8gVXNlIHRoaXMgdG8gc2V0IHBpbiBtb2RlIGFuZCBwdWxsIHJlc2lzdG9yIHN0YXRlXG4gICAgY29uc3QgYSA9IG5ldyBEaWdpdGFsSW5wdXQoYUNvbmZpZyk7XG4gICAgY29uc3QgYiA9IG5ldyBEaWdpdGFsSW5wdXQoYkNvbmZpZyk7XG5cbiAgICBjb25zdCBhR3Bpb051bSA9IHJlc29sdmVXaXJpbmdQaVRvR1BJTyhhLnBpbnNbMF0pO1xuICAgIGNvbnN0IGJHcGlvTnVtID0gcmVzb2x2ZVdpcmluZ1BpVG9HUElPKGIucGluc1swXSk7XG5cbiAgICB0aGlzLmFQaW4gPSBuZXcgR3BpbyhhR3Bpb051bSwgSU5QVVQsIEVER0VfQk9USCk7XG4gICAgdGhpcy5iUGluID0gbmV3IEdwaW8oYkdwaW9OdW0sIElOUFVULCBFREdFX0JPVEgpO1xuXG4gICAgdGhpcy52YWx1ZSA9IDA7XG4gICAgdGhpcy5sYXN0RW5jb2RlZCA9IDA7XG5cbiAgICB0aGlzLmFQaW4ud2F0Y2godGhpcy5oYW5kbGVJbnRlcnJ1cHQpO1xuICAgIHRoaXMuYlBpbi53YXRjaCh0aGlzLmhhbmRsZUludGVycnVwdCk7XG4gIH1cbiAgaGFuZGxlSW50ZXJydXB0KCkge1xuICAgIHRoaXMuaGFuZGxlVXBkYXRlKHRoaXMuYVBpbi5yZWFkU3luYygpLCB0aGlzLmJQaW4ucmVhZFN5bmMoKSk7XG4gIH1cbiAgaGFuZGxlVXBkYXRlKGFWYWx1ZSwgYlZhbHVlKSB7XG4gICAgY29uc3QgTVNCID0gYVZhbHVlO1xuICAgIGNvbnN0IExTQiA9IGJWYWx1ZTtcbiAgICBjb25zdCBsYXN0VmFsdWUgPSB0aGlzLnZhbHVlO1xuXG4gICAgY29uc3QgZW5jb2RlZCA9IChNU0IgPDwgMSkgfCBMU0I7XG4gICAgY29uc3Qgc3VtID0gKHRoaXMubGFzdEVuY29kZWQgPDwgMikgfCBlbmNvZGVkO1xuXG4gICAgaWYgKHN1bSA9PSAwYjExMDEgfHwgc3VtID09IDBiMDEwMCB8fCBzdW0gPT0gMGIwMDEwIHx8IHN1bSA9PSAwYjEwMTEpIHtcbiAgICAgIHRoaXMudmFsdWUrKztcbiAgICB9XG4gICAgaWYgKHN1bSA9PSAwYjExMTAgfHwgc3VtID09IDBiMDExMSB8fCBzdW0gPT0gMGIwMDAxIHx8IHN1bSA9PSAwYjEwMDApIHtcbiAgICAgIHRoaXMudmFsdWUtLTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RFbmNvZGVkID0gZW5jb2RlZDtcblxuICAgIGlmIChsYXN0VmFsdWUgIT09IHRoaXMudmFsdWUpIHtcbiAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgeyB2YWx1ZTogdGhpcy52YWx1ZSB9KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==