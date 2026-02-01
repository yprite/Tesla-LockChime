import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioProcessor, TESLA_REQUIREMENTS } from '../src/audio-processor.js';

describe('TESLA_REQUIREMENTS', () => {
    it('should have correct minimum duration', () => {
        expect(TESLA_REQUIREMENTS.MIN_DURATION).toBe(2.0);
    });

    it('should have correct maximum duration', () => {
        expect(TESLA_REQUIREMENTS.MAX_DURATION).toBe(5.0);
    });

    it('should have correct sample rate', () => {
        expect(TESLA_REQUIREMENTS.SAMPLE_RATE).toBe(44100);
    });

    it('should require mono audio', () => {
        expect(TESLA_REQUIREMENTS.CHANNELS).toBe(1);
    });

    it('should use 16-bit audio', () => {
        expect(TESLA_REQUIREMENTS.BIT_DEPTH).toBe(16);
    });

    it('should have 1MB max file size', () => {
        expect(TESLA_REQUIREMENTS.MAX_FILE_SIZE).toBe(1024 * 1024);
    });
});

describe('AudioProcessor', () => {
    let processor;

    beforeEach(() => {
        processor = new AudioProcessor();
    });

    describe('initialization', () => {
        it('should start with null audioContext', () => {
            expect(processor.audioContext).toBeNull();
        });

        it('should start with null currentBuffer', () => {
            expect(processor.currentBuffer).toBeNull();
        });

        it('should start with isPlaying = false', () => {
            expect(processor.isPlaying).toBe(false);
        });

        it('should start with default volume of 1.0', () => {
            expect(processor.getVolume()).toBe(1.0);
        });
    });

    describe('init()', () => {
        it('should create AudioContext on init', async () => {
            await processor.init();
            expect(processor.audioContext).toBeDefined();
        });

        it('should reuse existing AudioContext', async () => {
            await processor.init();
            const ctx1 = processor.audioContext;
            await processor.init();
            const ctx2 = processor.audioContext;
            expect(ctx1).toBe(ctx2);
        });
    });

    describe('loadSound()', () => {
        it('should load a sound by ID', async () => {
            const buffer = await processor.loadSound('chime-classic');
            expect(buffer).toBeDefined();
            expect(processor.currentBuffer).toBe(buffer);
        });

        it('should return buffer with correct properties', async () => {
            const buffer = await processor.loadSound('chime-classic');
            expect(buffer.numberOfChannels).toBe(1);
            expect(buffer.sampleRate).toBe(44100);
        });
    });

    describe('getDuration()', () => {
        it('should return 0 when no buffer loaded', () => {
            expect(processor.getDuration()).toBe(0);
        });

        it('should return buffer duration when loaded', async () => {
            await processor.loadSound('chime-classic');
            expect(processor.getDuration()).toBeGreaterThan(0);
        });
    });

    describe('volume control', () => {
        it('should set volume within valid range', () => {
            processor.setVolume(0.5);
            expect(processor.getVolume()).toBe(0.5);
        });

        it('should clamp volume to minimum 0', () => {
            processor.setVolume(-0.5);
            expect(processor.getVolume()).toBe(0);
        });

        it('should clamp volume to maximum 1', () => {
            processor.setVolume(1.5);
            expect(processor.getVolume()).toBe(1);
        });
    });

    describe('fade settings', () => {
        it('should set fade in duration', () => {
            processor.setFadeIn(0.5);
            expect(processor.fadeInDuration).toBe(0.5);
        });

        it('should not allow negative fade in', () => {
            processor.setFadeIn(-0.5);
            expect(processor.fadeInDuration).toBe(0);
        });

        it('should set fade out duration', () => {
            processor.setFadeOut(0.3);
            expect(processor.fadeOutDuration).toBe(0.3);
        });

        it('should not allow negative fade out', () => {
            processor.setFadeOut(-0.3);
            expect(processor.fadeOutDuration).toBe(0);
        });
    });

    describe('validateDuration()', () => {
        it('should reject duration below minimum', () => {
            const result = processor.validateDuration(0, 1.5);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('too short');
        });

        it('should reject duration above maximum', () => {
            const result = processor.validateDuration(0, 6);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('too long');
        });

        it('should accept valid duration', () => {
            const result = processor.validateDuration(0, 3);
            expect(result.valid).toBe(true);
            expect(result.duration).toBe(3);
        });

        it('should accept minimum valid duration', () => {
            const result = processor.validateDuration(0, 2);
            expect(result.valid).toBe(true);
        });

        it('should accept maximum valid duration', () => {
            const result = processor.validateDuration(0, 5);
            expect(result.valid).toBe(true);
        });
    });

    describe('estimateFileSize()', () => {
        it('should calculate correct file size for 1 second', () => {
            const size = processor.estimateFileSize(0, 1);
            // 44 header + (44100 * 1 * 2) = 44 + 88200 = 88244
            expect(size).toBe(88244);
        });

        it('should calculate correct file size for 3 seconds', () => {
            const size = processor.estimateFileSize(0, 3);
            // 44 header + (44100 * 3 * 2) = 44 + 264600 = 264644
            expect(size).toBe(264644);
        });

        it('should handle non-zero start time', () => {
            const size = processor.estimateFileSize(1, 3);
            // 2 seconds of audio
            expect(size).toBe(44 + (44100 * 2 * 2));
        });
    });

    describe('formatFileSize()', () => {
        it('should format bytes', () => {
            expect(processor.formatFileSize(500)).toBe('500 B');
        });

        it('should format kilobytes', () => {
            expect(processor.formatFileSize(2048)).toBe('2.0 KB');
        });

        it('should format megabytes', () => {
            expect(processor.formatFileSize(1048576)).toBe('1.00 MB');
        });
    });

    describe('validateFileSize()', () => {
        it('should accept files under 1MB', () => {
            const result = processor.validateFileSize(0, 3);
            expect(result.valid).toBe(true);
        });

        it('should reject files over 1MB', () => {
            // ~11.6 seconds would exceed 1MB at 44100Hz 16-bit mono
            const result = processor.validateFileSize(0, 15);
            expect(result.valid).toBe(false);
        });
    });

    describe('validateForTesla()', () => {
        it('should return combined validation result', () => {
            const result = processor.validateForTesla(0, 3);
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('fileSize');
            expect(result).toHaveProperty('messages');
        });

        it('should be valid for proper duration and size', () => {
            const result = processor.validateForTesla(0, 3);
            expect(result.valid).toBe(true);
        });

        it('should be invalid for improper duration', () => {
            const result = processor.validateForTesla(0, 1);
            expect(result.valid).toBe(false);
        });
    });

    describe('getWaveformData()', () => {
        it('should return null when no buffer loaded', () => {
            expect(processor.getWaveformData()).toBeNull();
        });

        it('should return waveform array when buffer loaded', async () => {
            await processor.loadSound('chime-classic');
            const waveform = processor.getWaveformData(100);

            expect(waveform).toBeInstanceOf(Float32Array);
            expect(waveform.length).toBe(100);
        });

        it('should contain values between 0 and 1', async () => {
            await processor.loadSound('chime-classic');
            const waveform = processor.getWaveformData(100);

            for (let i = 0; i < waveform.length; i++) {
                expect(waveform[i]).toBeGreaterThanOrEqual(0);
                expect(waveform[i]).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('trimBuffer()', () => {
        it('should throw error when no buffer loaded', () => {
            expect(() => processor.trimBuffer(0, 1)).toThrow('No audio loaded');
        });

        it('should throw error for invalid range', async () => {
            await processor.loadSound('chime-classic');
            expect(() => processor.trimBuffer(1, 0.5)).toThrow('Invalid trim range');
        });

        it('should create trimmed buffer with correct duration', async () => {
            await processor.loadSound('chime-classic');
            const trimmed = processor.trimBuffer(0, 1);

            expect(trimmed.duration).toBeCloseTo(1, 1);
        });

        it('should apply volume to trimmed buffer', async () => {
            await processor.loadSound('chime-classic');
            processor.setVolume(0.5);

            const trimmed = processor.trimBuffer(0, 0.5);
            const data = trimmed.getChannelData(0);

            // Check that samples are reduced
            let maxSample = 0;
            for (let i = 0; i < data.length; i++) {
                maxSample = Math.max(maxSample, Math.abs(data[i]));
            }

            // Should be less than full volume (accounting for original amplitude)
            expect(maxSample).toBeLessThan(0.6);
        });
    });

    describe('exportToWav()', () => {
        it('should throw error when no buffer loaded', () => {
            expect(() => processor.exportToWav(0, 1)).toThrow('No audio loaded');
        });

        it('should return a Blob', async () => {
            await processor.loadSound('chime-classic');
            const wav = processor.exportToWav(0, 1);
            expect(wav).toBeInstanceOf(Blob);
        });

        it('should have audio/wav MIME type', async () => {
            await processor.loadSound('chime-classic');
            const wav = processor.exportToWav(0, 1);
            expect(wav.type).toBe('audio/wav');
        });
    });

    describe('playback', () => {
        it('should throw error when playing without buffer', async () => {
            await expect(processor.play()).rejects.toThrow('No audio loaded');
        });

        it('should set isPlaying to true when playing', async () => {
            await processor.loadSound('chime-classic');
            await processor.play(0, 0.1);
            expect(processor.isPlaying).toBe(true);
        });

        it('should set isPlaying to false after stop', async () => {
            await processor.loadSound('chime-classic');
            await processor.play(0, 0.1);
            processor.stop();
            expect(processor.isPlaying).toBe(false);
        });
    });

    describe('isReady()', () => {
        it('should return falsy before init', () => {
            expect(processor.isReady()).toBeFalsy();
        });

        it('should return true after init', async () => {
            await processor.init();
            expect(processor.isReady()).toBe(true);
        });
    });
});

describe('AudioProcessor Integration', () => {
    let processor;

    beforeEach(() => {
        processor = new AudioProcessor();
    });

    it('should complete full workflow: load -> trim -> validate -> export', async () => {
        // Load sound
        await processor.loadSound('chime-classic');
        expect(processor.getBuffer()).toBeDefined();

        // Validate duration
        const validation = processor.validateForTesla(0, 3);
        expect(validation.valid).toBe(true);

        // Export to WAV
        const wav = processor.exportToWav(0, 3);
        expect(wav).toBeInstanceOf(Blob);
        expect(wav.size).toBeGreaterThan(0);
    });

    it('should apply effects during export', async () => {
        await processor.loadSound('chime-classic');

        processor.setVolume(0.8);
        processor.setFadeIn(0.1);
        processor.setFadeOut(0.1);

        const wav = processor.exportToWav(0, 2);
        expect(wav).toBeInstanceOf(Blob);
    });
});
