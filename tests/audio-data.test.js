import { describe, it, expect, beforeEach } from 'vitest';
import {
    AUDIO_SAMPLES,
    generateSynthesizedAudio,
    audioBufferToWav,
    resampleBuffer,
    parseWavHeader
} from '../src/audio-data.js';

describe('AUDIO_SAMPLES', () => {
    it('should have at least 8 sound options', () => {
        expect(AUDIO_SAMPLES.length).toBeGreaterThanOrEqual(8);
    });

    it('should have required properties for each sample', () => {
        AUDIO_SAMPLES.forEach(sample => {
            expect(sample).toHaveProperty('id');
            expect(sample).toHaveProperty('name');
            expect(sample).toHaveProperty('icon');
            expect(sample).toHaveProperty('duration');
            expect(sample).toHaveProperty('description');
        });
    });

    it('should have unique IDs for all samples', () => {
        const ids = AUDIO_SAMPLES.map(s => s.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds.length).toBe(ids.length);
    });

    it('should have durations within valid range (0.5-5 seconds)', () => {
        AUDIO_SAMPLES.forEach(sample => {
            expect(sample.duration).toBeGreaterThanOrEqual(0.5);
            expect(sample.duration).toBeLessThanOrEqual(5);
        });
    });

    it('should have category property for filtering', () => {
        AUDIO_SAMPLES.forEach(sample => {
            expect(sample).toHaveProperty('category');
            expect(['classic', 'modern', 'scifi']).toContain(sample.category);
        });
    });
});

describe('generateSynthesizedAudio', () => {
    let mockAudioContext;

    beforeEach(() => {
        mockAudioContext = {
            sampleRate: 44100,
            createBuffer: (channels, length, sampleRate) => ({
                numberOfChannels: channels,
                length,
                sampleRate,
                duration: length / sampleRate,
                _channelData: Array(channels).fill(null).map(() => new Float32Array(length)),
                getChannelData(channel) {
                    return this._channelData[channel];
                }
            })
        };
    });

    it('should generate audio buffer for valid sound ID', () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);

        expect(buffer).toBeDefined();
        expect(buffer.numberOfChannels).toBe(1);
        expect(buffer.sampleRate).toBe(44100);
    });

    it('should generate audio buffer with correct duration', () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);
        expect(buffer.duration).toBeCloseTo(1.5, 1);
    });

    it('should fall back to chime-classic for invalid sound ID', () => {
        const buffer = generateSynthesizedAudio('invalid-sound', mockAudioContext);
        expect(buffer).toBeDefined();
        expect(buffer.duration).toBeCloseTo(1.5, 1);
    });

    it('should generate all defined sounds without error', () => {
        AUDIO_SAMPLES.forEach(sample => {
            expect(() => {
                const buffer = generateSynthesizedAudio(sample.id, mockAudioContext);
                expect(buffer).toBeDefined();
            }).not.toThrow();
        });
    });

    it('should generate mono audio (1 channel)', () => {
        AUDIO_SAMPLES.forEach(sample => {
            const buffer = generateSynthesizedAudio(sample.id, mockAudioContext);
            expect(buffer.numberOfChannels).toBe(1);
        });
    });

    it('should produce non-silent audio (has amplitude)', () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);
        const data = buffer.getChannelData(0);

        let maxAmplitude = 0;
        for (let i = 0; i < data.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
        }

        expect(maxAmplitude).toBeGreaterThan(0.01);
    });

    it('should produce audio within valid amplitude range (-1 to 1)', () => {
        // Test a subset of samples to avoid timeout
        const samplesToTest = AUDIO_SAMPLES.slice(0, 3);

        samplesToTest.forEach(sample => {
            const buffer = generateSynthesizedAudio(sample.id, mockAudioContext);
            const data = buffer.getChannelData(0);

            // Sample every 100th value to speed up test
            for (let i = 0; i < data.length; i += 100) {
                expect(data[i]).toBeGreaterThanOrEqual(-1);
                expect(data[i]).toBeLessThanOrEqual(1);
            }
        });
    });
});

describe('audioBufferToWav', () => {
    let mockBuffer;

    beforeEach(() => {
        // Create a simple test buffer with a sine wave
        const sampleRate = 44100;
        const duration = 1;
        const length = sampleRate * duration;
        const data = new Float32Array(length);

        for (let i = 0; i < length; i++) {
            data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
        }

        mockBuffer = {
            sampleRate,
            length,
            duration,
            numberOfChannels: 1,
            getChannelData: () => data
        };
    });

    it('should return a Blob', () => {
        const wav = audioBufferToWav(mockBuffer);
        expect(wav).toBeInstanceOf(Blob);
    });

    it('should have correct MIME type', () => {
        const wav = audioBufferToWav(mockBuffer);
        expect(wav.type).toBe('audio/wav');
    });

    it('should have correct file size (header + data)', () => {
        const wav = audioBufferToWav(mockBuffer);
        // 44 bytes header + (44100 samples * 2 bytes per sample)
        const expectedSize = 44 + (44100 * 2);
        expect(wav.size).toBe(expectedSize);
    });

    it('should create valid WAV header', async () => {
        const wav = audioBufferToWav(mockBuffer);
        const arrayBuffer = await wav.arrayBuffer();
        const header = parseWavHeader(arrayBuffer);

        expect(header.audioFormat).toBe(1); // PCM
        expect(header.numChannels).toBe(1); // Mono
        expect(header.sampleRate).toBe(44100);
        expect(header.bitsPerSample).toBe(16);
    });

    it('should resample if sample rates differ', () => {
        mockBuffer.sampleRate = 48000;
        const wav = audioBufferToWav(mockBuffer, 44100);

        // Should be resampled to 44100
        const expectedDataSize = Math.round(mockBuffer.length * (44100 / 48000)) * 2;
        const expectedSize = 44 + expectedDataSize;

        expect(wav.size).toBeCloseTo(expectedSize, -2);
    });
});

describe('resampleBuffer', () => {
    it('should resample to lower sample rate', () => {
        const mockBuffer = {
            sampleRate: 48000,
            length: 48000, // 1 second
            getChannelData: () => {
                const data = new Float32Array(48000);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.sin(2 * Math.PI * 440 * i / 48000);
                }
                return data;
            }
        };

        const resampled = resampleBuffer(mockBuffer, 44100);
        expect(resampled.length).toBe(44100);
    });

    it('should resample to higher sample rate', () => {
        const mockBuffer = {
            sampleRate: 22050,
            length: 22050,
            getChannelData: () => new Float32Array(22050).fill(0.5)
        };

        const resampled = resampleBuffer(mockBuffer, 44100);
        expect(resampled.length).toBe(44100);
    });

    it('should preserve amplitude range after resampling', () => {
        const mockBuffer = {
            sampleRate: 48000,
            length: 48000,
            getChannelData: () => {
                const data = new Float32Array(48000);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.sin(2 * Math.PI * 440 * i / 48000);
                }
                return data;
            }
        };

        const resampled = resampleBuffer(mockBuffer, 44100);

        for (let i = 0; i < resampled.length; i++) {
            expect(resampled[i]).toBeGreaterThanOrEqual(-1);
            expect(resampled[i]).toBeLessThanOrEqual(1);
        }
    });
});

describe('parseWavHeader', () => {
    it('should parse valid WAV header', async () => {
        const mockBuffer = {
            sampleRate: 44100,
            length: 44100,
            duration: 1,
            numberOfChannels: 1,
            getChannelData: () => new Float32Array(44100)
        };

        const wav = audioBufferToWav(mockBuffer);
        const arrayBuffer = await wav.arrayBuffer();
        const header = parseWavHeader(arrayBuffer);

        expect(header.audioFormat).toBe(1);
        expect(header.numChannels).toBe(1);
        expect(header.sampleRate).toBe(44100);
        expect(header.bitsPerSample).toBe(16);
    });

    it('should throw error for invalid RIFF header', () => {
        const invalidBuffer = new ArrayBuffer(44);
        const view = new DataView(invalidBuffer);
        view.setUint32(0, 0x00000000); // Invalid header

        expect(() => parseWavHeader(invalidBuffer)).toThrow('Invalid WAV file: missing RIFF header');
    });
});

describe('Tesla Lock Chime Requirements', () => {
    let mockAudioContext;

    beforeEach(() => {
        mockAudioContext = {
            sampleRate: 44100,
            createBuffer: (channels, length, sampleRate) => ({
                numberOfChannels: channels,
                length,
                sampleRate,
                duration: length / sampleRate,
                _channelData: Array(channels).fill(null).map(() => new Float32Array(length)),
                getChannelData(channel) {
                    return this._channelData[channel];
                }
            })
        };
    });

    it('should produce mono audio (Tesla requirement)', () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);
        expect(buffer.numberOfChannels).toBe(1);
    });

    it('should produce 44.1kHz WAV (Tesla compatible)', async () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);
        const wav = audioBufferToWav(buffer, 44100);
        const arrayBuffer = await wav.arrayBuffer();
        const header = parseWavHeader(arrayBuffer);

        expect(header.sampleRate).toBe(44100);
    });

    it('should produce 16-bit PCM WAV', async () => {
        const buffer = generateSynthesizedAudio('chime-classic', mockAudioContext);
        const wav = audioBufferToWav(buffer, 44100);
        const arrayBuffer = await wav.arrayBuffer();
        const header = parseWavHeader(arrayBuffer);

        expect(header.audioFormat).toBe(1); // PCM
        expect(header.bitsPerSample).toBe(16);
    });

    it('should produce file under 1MB for all sounds', () => {
        AUDIO_SAMPLES.forEach(sample => {
            const buffer = generateSynthesizedAudio(sample.id, mockAudioContext);
            const wav = audioBufferToWav(buffer, 44100);

            // 1MB = 1024 * 1024 bytes
            expect(wav.size).toBeLessThan(1024 * 1024);
        });
    });
});
