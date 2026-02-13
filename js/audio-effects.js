/**
 * AudioEffects - DSP module for audio effect processing
 *
 * Pure audio processing functions using Web Audio API's OfflineAudioContext.
 * Each effect takes a buffer + audioContext and returns a new processed buffer.
 */

class AudioEffects {
    /**
     * Shift pitch by semitones using playbackRate resampling.
     * Returns a new AudioBuffer with adjusted pitch.
     *
     * @param {AudioBuffer} buffer - Source audio buffer
     * @param {BaseAudioContext} audioContext - Live audio context (for creating output buffer)
     * @param {number} semitones - Semitones to shift (-12 to +12)
     * @returns {Promise<AudioBuffer>} Pitch-shifted buffer
     */
    static async pitchShift(buffer, audioContext, semitones) {
        const clamped = Math.max(-24, Math.min(24, semitones));
        if (clamped === 0) return buffer;

        const rate = Math.pow(2, clamped / 12);
        const newLength = Math.max(1, Math.round(buffer.length / rate));
        const sampleRate = buffer.sampleRate;

        const offlineCtx = new OfflineAudioContext(1, newLength, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.connect(offlineCtx.destination);
        source.start(0);

        return offlineCtx.startRendering();
    }

    /**
     * Apply reverb using a synthetic impulse response and ConvolverNode.
     *
     * @param {AudioBuffer} buffer - Source audio buffer
     * @param {BaseAudioContext} audioContext - Live audio context
     * @param {number} wetAmount - Wet/dry mix ratio (0 = fully dry, 1 = fully wet)
     * @returns {Promise<AudioBuffer>} Buffer with reverb applied
     */
    static async applyReverb(buffer, audioContext, wetAmount) {
        if (wetAmount <= 0) return buffer;

        const sampleRate = buffer.sampleRate;
        const reverbDuration = 1.5;
        const tailSamples = Math.round(reverbDuration * sampleRate);
        const outputLength = buffer.length + tailSamples;

        const offlineCtx = new OfflineAudioContext(1, outputLength, sampleRate);

        const impulse = AudioEffects.generateImpulseResponse(offlineCtx, reverbDuration, 2.0);
        const convolver = offlineCtx.createConvolver();
        convolver.buffer = impulse;

        const dryGain = offlineCtx.createGain();
        dryGain.gain.value = 1 - wetAmount;

        const wetGain = offlineCtx.createGain();
        wetGain.gain.value = wetAmount;

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        source.connect(dryGain);
        source.connect(convolver);
        convolver.connect(wetGain);

        dryGain.connect(offlineCtx.destination);
        wetGain.connect(offlineCtx.destination);

        source.start(0);

        const rendered = await offlineCtx.startRendering();

        const trimmedBuffer = audioContext.createBuffer(1, buffer.length, sampleRate);
        const srcData = rendered.getChannelData(0);
        const destData = trimmedBuffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            destData[i] = srcData[i];
        }

        return trimmedBuffer;
    }

    /**
     * Apply bass boost/cut using a low-shelf BiquadFilter at 200Hz.
     *
     * @param {AudioBuffer} buffer - Source audio buffer
     * @param {BaseAudioContext} audioContext - Live audio context
     * @param {number} bassGainDb - Gain in dB (-12 to +12)
     * @returns {Promise<AudioBuffer>} EQ-processed buffer
     */
    static async applyEQ(buffer, audioContext, bassGainDb) {
        if (bassGainDb === 0) return buffer;

        const sampleRate = buffer.sampleRate;

        const offlineCtx = new OfflineAudioContext(1, buffer.length, sampleRate);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 200;
        filter.gain.value = bassGainDb;

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        source.connect(filter);
        filter.connect(offlineCtx.destination);

        source.start(0);

        return offlineCtx.startRendering();
    }

    /**
     * Generate a synthetic impulse response for reverb.
     * Uses exponentially decaying white noise.
     *
     * @param {BaseAudioContext} audioContext - Audio context to create buffer in
     * @param {number} duration - Impulse duration in seconds
     * @param {number} decay - Decay rate (higher = faster decay)
     * @returns {AudioBuffer} Synthetic impulse response
     */
    static generateImpulseResponse(audioContext, duration, decay) {
        const sampleRate = audioContext.sampleRate;
        const length = Math.round(sampleRate * duration);
        const impulse = audioContext.createBuffer(1, length, sampleRate);
        const data = impulse.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const envelope = Math.exp(-decay * i / length);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        return impulse;
    }
}

if (typeof window !== 'undefined') {
    window.AudioEffects = AudioEffects;
}
