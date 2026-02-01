/**
 * Audio Processor - Handles audio loading, trimming, and conversion
 *
 * Uses Web Audio API for all processing - no server required.
 * For Tesla lock chimes, outputs mono WAV at 44.1kHz.
 */


const TESLA_REQUIREMENTS = {
    MIN_DURATION: 2.0,
    MAX_DURATION: 5.0,
    SAMPLE_RATE: 44100,
    CHANNELS: 1,
    BIT_DEPTH: 16,
    MAX_FILE_SIZE: 1024 * 1024 // 1MB
};

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.currentBuffer = null;
        this.currentSource = null;
        this.isPlaying = false;
        this.volume = 1.0;
        this.fadeInDuration = 0;
        this.fadeOutDuration = 0;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async init() {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API is not supported in this browser');
            }
            this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        return this.audioContext;
    }

    /**
     * Load a sound by ID and generate the audio buffer
     */
    async loadSound(soundId) {
        await this.init();
        this.currentBuffer = generateSynthesizedAudio(soundId, this.audioContext);
        return this.currentBuffer;
    }

    /**
     * Load audio from a File or Blob
     */
    async loadFromFile(file) {
        await this.init();

        const arrayBuffer = await file.arrayBuffer();
        this.currentBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return this.currentBuffer;
    }

    /**
     * Load audio from a Blob
     */
    async loadFromBlob(blob) {
        return this.loadFromFile(blob);
    }

    /**
     * Get the current audio buffer
     */
    getBuffer() {
        return this.currentBuffer;
    }

    /**
     * Get the duration of the current buffer in seconds
     */
    getDuration() {
        return this.currentBuffer ? this.currentBuffer.duration : 0;
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Set fade in duration in seconds
     */
    setFadeIn(duration) {
        this.fadeInDuration = Math.max(0, duration);
    }

    /**
     * Set fade out duration in seconds
     */
    setFadeOut(duration) {
        this.fadeOutDuration = Math.max(0, duration);
    }

    /**
     * Play the current buffer (full or trimmed)
     */
    async play(startTime = 0, endTime = null, onEnded = null) {
        if (!this.currentBuffer) {
            throw new Error('No audio loaded');
        }

        await this.init();
        this.stop();

        const duration = endTime !== null ? endTime - startTime : this.currentBuffer.duration - startTime;

        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.volume;
        gainNode.connect(this.audioContext.destination);

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.currentBuffer;
        this.currentSource.connect(gainNode);

        this.currentSource.onended = () => {
            this.isPlaying = false;
            if (onEnded) onEnded();
        };

        this.isPlaying = true;
        this.currentSource.start(0, startTime, duration);

        return {
            startTime,
            duration,
            contextTime: this.audioContext.currentTime
        };
    }

    /**
     * Stop playback
     */
    stop() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Ignore - source may have already stopped
            }
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    /**
     * Trim the audio buffer to the specified range
     */
    trimBuffer(startTime, endTime) {
        if (!this.currentBuffer) {
            throw new Error('No audio loaded');
        }

        const sampleRate = this.currentBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const newLength = endSample - startSample;

        if (newLength <= 0) {
            throw new Error('Invalid trim range');
        }

        const trimmedBuffer = this.audioContext.createBuffer(
            1, // Mono for Tesla
            newLength,
            sampleRate
        );

        const sourceData = this.currentBuffer.getChannelData(0);
        const destData = trimmedBuffer.getChannelData(0);

        for (let i = 0; i < newLength; i++) {
            let sample = sourceData[startSample + i] || 0;

            // Apply volume
            sample *= this.volume;

            // Apply fade in
            if (this.fadeInDuration > 0) {
                const fadeInSamples = this.fadeInDuration * sampleRate;
                if (i < fadeInSamples) {
                    sample *= i / fadeInSamples;
                }
            }

            // Apply fade out
            if (this.fadeOutDuration > 0) {
                const fadeOutSamples = this.fadeOutDuration * sampleRate;
                const fadeOutStart = newLength - fadeOutSamples;
                if (i > fadeOutStart) {
                    sample *= (newLength - i) / fadeOutSamples;
                }
            }

            destData[i] = sample;
        }

        return trimmedBuffer;
    }

    /**
     * Apply normalization to maximize volume without clipping
     */
    normalizeBuffer(buffer) {
        const data = buffer.getChannelData(0);
        let maxAmplitude = 0;

        // Find max amplitude
        for (let i = 0; i < data.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
        }

        // Normalize if needed (target 0.95 to leave headroom)
        if (maxAmplitude > 0 && maxAmplitude < 0.95) {
            const gain = 0.95 / maxAmplitude;
            for (let i = 0; i < data.length; i++) {
                data[i] *= gain;
            }
        }

        return buffer;
    }

    /**
     * Export the audio as a WAV blob
     */
    exportToWav(startTime = 0, endTime = null, options = {}) {
        if (!this.currentBuffer) {
            throw new Error('No audio loaded');
        }

        const actualEnd = endTime !== null ? endTime : this.currentBuffer.duration;
        let trimmedBuffer = this.trimBuffer(startTime, actualEnd);

        // Apply normalization if requested
        if (options.normalize !== false) {
            trimmedBuffer = this.normalizeBuffer(trimmedBuffer);
        }

        return audioBufferToWav(trimmedBuffer, TESLA_REQUIREMENTS.SAMPLE_RATE);
    }

    /**
     * Get audio data for waveform visualization
     */
    getWaveformData(numSamples = 200) {
        if (!this.currentBuffer) {
            return null;
        }

        const channelData = this.currentBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / numSamples);
        const waveform = new Float32Array(numSamples);

        for (let i = 0; i < numSamples; i++) {
            const start = i * samplesPerPixel;
            const end = start + samplesPerPixel;

            let max = 0;
            for (let j = start; j < end && j < channelData.length; j++) {
                const abs = Math.abs(channelData[j]);
                if (abs > max) max = abs;
            }
            waveform[i] = max;
        }

        return waveform;
    }

    /**
     * Get the current playback time
     */
    getCurrentTime() {
        if (!this.audioContext) return 0;
        return this.audioContext.currentTime;
    }

    /**
     * Check if audio context is ready
     */
    isReady() {
        return this.audioContext && this.audioContext.state === 'running';
    }

    /**
     * Validate that the trimmed duration is within Tesla's requirements
     */
    validateDuration(startTime, endTime) {
        const duration = endTime - startTime;

        if (duration < TESLA_REQUIREMENTS.MIN_DURATION) {
            return {
                valid: false,
                message: `Duration too short. Minimum is ${TESLA_REQUIREMENTS.MIN_DURATION} seconds. Current: ${duration.toFixed(1)}s`
            };
        }

        if (duration > TESLA_REQUIREMENTS.MAX_DURATION) {
            return {
                valid: false,
                message: `Duration too long. Maximum is ${TESLA_REQUIREMENTS.MAX_DURATION} seconds. Current: ${duration.toFixed(1)}s`
            };
        }

        return {
            valid: true,
            message: `Duration: ${duration.toFixed(1)} seconds ✓`,
            duration
        };
    }

    /**
     * Estimate file size of the exported WAV
     */
    estimateFileSize(startTime, endTime) {
        const duration = endTime - startTime;
        const { SAMPLE_RATE, CHANNELS, BIT_DEPTH } = TESLA_REQUIREMENTS;
        const dataSize = duration * SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8);
        return 44 + dataSize; // 44 bytes header + data
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }

    /**
     * Check if estimated file size is within Tesla's limit
     */
    validateFileSize(startTime, endTime) {
        const size = this.estimateFileSize(startTime, endTime);
        return {
            valid: size <= TESLA_REQUIREMENTS.MAX_FILE_SIZE,
            size,
            message: size <= TESLA_REQUIREMENTS.MAX_FILE_SIZE
                ? `File size: ${this.formatFileSize(size)} ✓`
                : `File too large: ${this.formatFileSize(size)} (max ${this.formatFileSize(TESLA_REQUIREMENTS.MAX_FILE_SIZE)})`
        };
    }

    /**
     * Full validation for Tesla requirements
     */
    validateForTesla(startTime, endTime) {
        const durationResult = this.validateDuration(startTime, endTime);
        const sizeResult = this.validateFileSize(startTime, endTime);

        return {
            valid: durationResult.valid && sizeResult.valid,
            duration: durationResult,
            fileSize: sizeResult,
            messages: [durationResult.message, sizeResult.message].filter(m => m)
        };
    }
}

// Browser global export
if (typeof window !== 'undefined') {
    window.AudioProcessor = AudioProcessor;
    window.TESLA_REQUIREMENTS = TESLA_REQUIREMENTS;
}
