/*
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
import { EventEmitter } from 'events';
import { DigitalInput, PULL_UP, PULL_DOWN, PULL_NONE } from 'raspi-gpio';
import { getPins } from 'raspi-board';
import { Gpio } from 'onoff';

function resolveWiringPiToGPIO(wiringPiPin) {
  try {
    return getPins()[wiringPiPin].pins.find( p => /GPIO/.test(p) ).replace('GPIO', '')
  } catch (e) {
    console.error('Cannot find GPIO number for pin: ', wiringPiPin);
    throw e;
  }
}

function pullResistorValueForString(str=null) {
  switch (str) {
    case 'up'  : return PULL_UP;
    case 'down': return PULL_DOWN;
    case 'none': return PULL_NONE;
    default:     return null;
  }
}

const INPUT = 'in';
const EDGE_BOTH = 'both';

export class RotaryEncoder extends EventEmitter {
  constructor(config={ pins: null }) {
    super();

    if (config.pins === null || config.pins.a == null || config.pins.b == null) {
      throw new Error('RotaryEncoder requires pins.a and pins.b to be specified in config');
    }

    // Bind update method to class so it is always
    // called in the correct context
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleInterrupt = this.handleInterrupt.bind(this);

    const pullResistorConfig = config.pullResistors || {};

    const aConfig = {
      pin: config.pins.a,
      pullResistor: pullResistorValueForString(pullResistorConfig.a)
    };

    const bConfig = {
      pin: config.pins.b,
      pullResistor: pullResistorValueForString(pullResistorConfig.b)
    };

    // Use this to set pin mode and pull resistor state
    const a = new DigitalInput(aConfig);
    const b = new DigitalInput(bConfig);

    const aGpioNum = resolveWiringPiToGPIO(a.pins[0]);
    const bGpioNum = resolveWiringPiToGPIO(b.pins[0]);

    this.aPin = new Gpio(aGpioNum, INPUT, EDGE_BOTH);
    this.bPin = new Gpio(bGpioNum, INPUT, EDGE_BOTH);

    this.value = 0;
    this.lastEncoded = 0;

    this.aPin.watch(this.handleInterrupt);
    this.bPin.watch(this.handleInterrupt);
  }
  handleInterrupt() {
    this.handleUpdate(this.aPin.readSync(), this.bPin.readSync());
  }
  handleUpdate(aValue, bValue) {
    const MSB = aValue;
    const LSB = bValue;
    const lastValue = this.value;

    const encoded = (MSB << 1) | LSB;
    const sum = (this.lastEncoded << 2) | encoded;

    if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
      this.value++;
    }
    if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
      this.value--;
    }

    this.lastEncoded = encoded;

    if (lastValue !== this.value) {
      this.emit('change', { value: this.value });
    }
  }
}
