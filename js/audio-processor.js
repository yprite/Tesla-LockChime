/**
 * Audio Processor - Handles audio loading, trimming, and conversion
 *
 * Uses Web Audio API for all processing - no server required.
 * For Tesla lock chimes, outputs mono WAV at 44.1kHz.
 */

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.currentBuffer = null;
        this.currentSource = null;
        this.isPlaying = false;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume if suspended (browser autoplay policies)
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
     * Play the current buffer (full or trimmed)
     */
    async play(startTime = 0, endTime = null, onEnded = null) {
        if (!this.currentBuffer) {
            throw new Error('No audio loaded');
        }

        await this.init();
        this.stop();

        const duration = endTime !== null ? endTime - startTime : this.currentBuffer.duration - startTime;

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.currentBuffer;
        this.currentSource.connect(this.audioContext.destination);

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
            destData[i] = sourceData[startSample + i] || 0;
        }

        return trimmedBuffer;
    }

    /**
     * Export the audio as a WAV blob
     */
    exportToWav(startTime = 0, endTime = null) {
        if (!this.currentBuffer) {
            throw new Error('No audio loaded');
        }

        const actualEnd = endTime !== null ? endTime : this.currentBuffer.duration;
        const trimmedBuffer = this.trimBuffer(startTime, actualEnd);

        // Convert to WAV at 44.1kHz mono
        return audioBufferToWav(trimmedBuffer, 44100);
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
        const MIN_DURATION = 2.0;
        const MAX_DURATION = 5.0;

        if (duration < MIN_DURATION) {
            return {
                valid: false,
                message: `Duration too short. Minimum is ${MIN_DURATION} seconds. Current: ${duration.toFixed(1)}s`
            };
        }

        if (duration > MAX_DURATION) {
            return {
                valid: false,
                message: `Duration too long. Maximum is ${MAX_DURATION} seconds. Current: ${duration.toFixed(1)}s`
            };
        }

        return {
            valid: true,
            message: `Duration: ${duration.toFixed(1)} seconds ✓`
        };
    }

    /**
     * Estimate file size of the exported WAV
     */
    estimateFileSize(startTime, endTime) {
        const duration = endTime - startTime;
        const sampleRate = 44100;
        const bitsPerSample = 16;
        const numChannels = 1;

        // WAV size = header (44 bytes) + samples
        const dataSize = duration * sampleRate * numChannels * (bitsPerSample / 8);
        const totalSize = 44 + dataSize;

        return totalSize;
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
}

// Export for use in other modules
window.AudioProcessor = AudioProcessor;
