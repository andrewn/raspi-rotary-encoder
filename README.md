Raspi Rotary Encoder
==========

Add Rotary Encoders to your Raspberry Pi with ease!

Rotary Encoder is inspired by, and designed to work with [@nebrius'](https://github.com/nebrius) [Raspi.js suite](https://github.com/nebrius/raspi). This README is heavily based on those tools.

If you have a bug report, feature request, or wish to contribute code, please be sure to check out the [Contributing Guide](blob/master/CONTRIBUTING.md).

## Installation

Install [raspi](https://github.com/nebrius/raspi) as this library uses that to set-up the Pi and configure the GPIO pins.

Install `raspi-rotary-encoder` with NPM:

```Shell
npm install raspi-rotary-encoder
```

**Warning**: this module's dependencies require GCC 4.8 or newer. This means that you should be running Raspbian Jessie or newer, released in September of 2015.


## Example Usage

```JavaScript
var raspi = require('raspi');
var RotaryEncoder = require('raspi-rotary-encoder').RotaryEncoder;

raspi.init(function() {
  var pinA = { pin: 4, pullResistor: RotaryEncoder.PULL_UP };
  var pinB = { pin: 5, pullResistor: RotaryEncoder.PULL_UP };
  var encoder = new RotaryEncoder(pinA, pinB);

  encoder.addListener('change', function (evt) {
    console.log('Count', evt.count);
  })
});
```

## Pin Naming

The pins on the Raspberry Pi are a little complicated. There are multiple headers on some Raspberry Pis with extra pins, and the pin numbers are not consistent between Raspberry Pi board versions.

To help make it easier, you can specify pins in three ways. The first is to specify the pin by function, e.g. ```'GPIO18'```. The second way is to specify by pin number, which is specified in the form "P[header]-[pin]", e.g. ```'P1-7'```. The final way is specify the [Wiring Pi virtual pin number](http://wiringpi.com/pins/), e.g. ```7```. If you specify a number instead of a string, it is assumed to be a Wiring Pi number.

## API

### new RotaryEncoder(pinAConfig, pinBConfig)

Instantiates a new RotaryEncoder instance using the given pins.

_Arguments_:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td>pinAConfig</td>
    <td>Number | String | Object</td>
    <td>The configuration for the A pin. If the config is a number or string, it is assumed to be the pin number for the peripheral. If it is an object, the following properties are supported:</td>
  </tr>
  <tr>
    <td></td>
    <td colspan="2">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tr>
          <td>pin</td>
          <td>Number | String</td>
          <td>The pin number for the peripheral</td>
        </tr>
        <tr>
          <td>pullResistor</td>
          <td>```RotaryEncoder.PULL_NONE``` | ```RotaryEncoder.PULL_DOWN``` | ```RotaryEncoder.PULL_UP```</td>
          <td>Which internal pull resistor to enable, if any. Defaults to ```RotaryEncoder.PULL_NONE```</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td>pinBConfig</td>
    <td>Number | String | Object</td>
    <td>The configuration for the B pin. If the config is a number or string, it is assumed to be the pin number for the peripheral. If it is an object, the following properties are supported:</td>
  </tr>
  <tr>
    <td></td>
    <td colspan="2">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tr>
          <td>pin</td>
          <td>Number | String</td>
          <td>The pin number for the peripheral</td>
        </tr>
        <tr>
          <td>pullResistor</td>
          <td>```RotaryEncoder.PULL_NONE``` | ```RotaryEncoder.PULL_DOWN``` | ```RotaryEncoder.PULL_UP```</td>
          <td>Which internal pull resistor to enable, if any. Defaults to ```RotaryEncoder.PULL_NONE```</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

### Instance Properties

None

### Instance Methods

#### addListener(eventName, callback)

Register an event listener function callback

_Arguments_:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td>eventName</td>
    <td>String</td>
    <td>A valid event name (see Events below)</td>
  </tr>
  <tr>
    <td>callback</td>
    <td>Function</td>
    <td>A function to be called whenever the event occurs</td>
  </tr>
</table>

_Returns_: A reference to this encoder instance

#### removeListener(eventName, callback)

Unregister an event listener function callback

_Arguments_:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td>eventName</td>
    <td>String</td>
    <td>A valid event name (see Events below)</td>
  </tr>
  <tr>
    <td>callback</td>
    <td>Function</td>
    <td>A listener function that was previously registered with addListener</td>
  </tr>
</table>

_Returns_: A reference to this encoder instance

## Events

Use `addListener` to listen for events. Listener callback functions will be passed an event object containing information about the event.

<table>
  <thead>
    <tr>
      <th>Event name</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td>change</td>
    <td>Fires when the rotary encoder is turned in either direction. The listener is passed a single object with the following property:</td>
  </tr>
  <tr>
    <td> </td>
    <td>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tr>
          <td>value</td>
          <td>Number</td>
          <td>An ever-increasing or decreasing number. Positive numbers indicate clockwise, negative indicate anticlockwise. These do not correspond to a full-rotation of the encoder.</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

License
=======

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
