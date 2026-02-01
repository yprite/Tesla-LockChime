import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = {};
    this.currentTime = 0;
  }

  createBuffer(channels, length, sampleRate) {
    const buffer = {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      _channelData: Array(channels).fill(null).map(() => new Float32Array(length)),
      getChannelData(channel) {
        return this._channelData[channel];
      }
    };
    return buffer;
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn()
    };
  }

  decodeAudioData(arrayBuffer) {
    return Promise.resolve(this.createBuffer(1, 44100, 44100));
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

class MockAudioBuffer {
  constructor(options) {
    this.numberOfChannels = options.numberOfChannels || 1;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = this.length / this.sampleRate;
    this._data = new Float32Array(this.length);
  }

  getChannelData(channel) {
    return this._data;
  }
}

// Set up global mocks
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
global.AudioBuffer = MockAudioBuffer;

// Mock canvas context
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn()
    };
  }
  return null;
};

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = function() {
  return {
    width: 800,
    height: 120,
    top: 0,
    left: 0,
    right: 800,
    bottom: 120
  };
};

// Mock window.showSaveFilePicker
global.showSaveFilePicker = vi.fn();
global.showDirectoryPicker = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Polyfill Blob.arrayBuffer for jsdom
if (!Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = function() {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsArrayBuffer(this);
        });
    };
}
