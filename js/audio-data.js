/**
 * Audio Data - Sample sounds available for selection
 *
 * These are royalty-free sounds that can be used as Tesla lock chimes.
 */

const AUDIO_SAMPLES = [
    {
        id: 'chime-classic',
        name: 'Classic Chime',
        icon: '🔔',
        duration: 1.5,
        description: 'Simple classic chime sound',
        category: 'classic'
    },
    {
        id: 'beep-confirm',
        name: 'Confirmation Beep',
        icon: '✓',
        duration: 0.8,
        description: 'Short confirmation beep',
        category: 'modern'
    },
    {
        id: 'futuristic',
        name: 'Futuristic',
        icon: '🚀',
        duration: 2.0,
        description: 'Sci-fi style lock sound',
        category: 'scifi'
    },
    {
        id: 'gentle-tone',
        name: 'Gentle Tone',
        icon: '🎵',
        duration: 1.2,
        description: 'Soft pleasant tone',
        category: 'classic'
    },
    {
        id: 'electric',
        name: 'Electric Pulse',
        icon: '⚡',
        duration: 1.0,
        description: 'Electric charging sound',
        category: 'modern'
    },
    {
        id: 'notification',
        name: 'Notification',
        icon: '📱',
        duration: 0.9,
        description: 'Modern notification sound',
        category: 'modern'
    },
    {
        id: 'doorbell',
        name: 'Door Bell',
        icon: '🚪',
        duration: 1.8,
        description: 'Traditional doorbell chime',
        category: 'classic'
    },
    {
        id: 'success',
        name: 'Success',
        icon: '🎯',
        duration: 1.1,
        description: 'Achievement unlock sound',
        category: 'modern'
    },
    {
        id: 'tesla-inspired',
        name: 'Tesla Inspired',
        icon: '🚗',
        duration: 1.3,
        description: 'EV-style futuristic beep',
        category: 'scifi'
    },
    {
        id: 'musical-chord',
        name: 'Musical Chord',
        icon: '🎹',
        duration: 1.5,
        description: 'Pleasant major chord',
        category: 'classic'
    },
    {
        id: 'cyber-lock',
        name: 'Cyber Lock',
        icon: '🔐',
        duration: 1.0,
        description: 'Digital security sound',
        category: 'scifi'
    },
    {
        id: 'gentle-bells',
        name: 'Gentle Bells',
        icon: '🔔',
        duration: 2.0,
        description: 'Soft bell sequence',
        category: 'classic'
    }
];

/**
 * Sound generator functions for each sound ID
 */
const soundGenerators = {
    'chime-classic': (sampleRate, createBuffer) => {
        const duration = 1.5;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        const freq1 = 880, freq2 = 1108.73;

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-3 * t);
            const tone1 = Math.sin(2 * Math.PI * freq1 * t) * envelope;
            const tone2 = Math.sin(2 * Math.PI * freq2 * t) * envelope * (t > 0.15 ? 1 : 0);
            data[i] = (tone1 + tone2) * 0.3;
        }
        return buffer;
    },

    'beep-confirm': (sampleRate, createBuffer) => {
        const duration = 0.8;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = t < 0.1 ? t * 10 : Math.exp(-5 * (t - 0.1));
            data[i] = Math.sin(2 * Math.PI * 1200 * t) * envelope * 0.4;
        }
        return buffer;
    },

    'futuristic': (sampleRate, createBuffer) => {
        const duration = 2.0;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-2 * t);
            const freq = 300 + 1200 * (1 - Math.exp(-3 * t));
            const tone = Math.sin(2 * Math.PI * freq * t);
            const harmonic = Math.sin(4 * Math.PI * freq * t) * 0.3;
            data[i] = (tone + harmonic) * envelope * 0.3;
        }
        return buffer;
    },

    'gentle-tone': (sampleRate, createBuffer) => {
        const duration = 1.2;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * t / duration);
            const freq = 523.25;
            data[i] = (Math.sin(2 * Math.PI * freq * t) + Math.sin(4 * Math.PI * freq * t) * 0.2) * envelope * 0.35;
        }
        return buffer;
    },

    'electric': (sampleRate, createBuffer) => {
        const duration = 1.0;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-4 * t);
            let sample = 0;
            for (let h = 1; h <= 8; h++) {
                sample += Math.sin(2 * Math.PI * 440 * h * t) / h;
            }
            data[i] = sample * envelope * 0.15;
        }
        return buffer;
    },

    'notification': (sampleRate, createBuffer) => {
        const duration = 0.9;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [784, 988, 1175];
        const noteLength = duration / 3;

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.min(Math.floor(t / noteLength), 2);
            const noteTime = t - noteIndex * noteLength;
            const envelope = Math.exp(-6 * noteTime);
            data[i] = Math.sin(2 * Math.PI * notes[noteIndex] * t) * envelope * 0.35;
        }
        return buffer;
    },

    'doorbell': (sampleRate, createBuffer) => {
        const duration = 1.8;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        const freq1 = 659.25, freq2 = 523.25;

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            if (t < 0.9) sample = Math.sin(2 * Math.PI * freq1 * t) * Math.exp(-3 * t);
            if (t > 0.4) sample += Math.sin(2 * Math.PI * freq2 * t) * Math.exp(-2.5 * (t - 0.4));
            data[i] = sample * 0.35;
        }
        return buffer;
    },

    'success': (sampleRate, createBuffer) => {
        const duration = 1.1;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const noteLength = duration / 5;

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            for (let n = 0; n < notes.length; n++) {
                const noteStart = n * noteLength * 0.8;
                if (t >= noteStart) {
                    sample += Math.sin(2 * Math.PI * notes[n] * t) * Math.exp(-3 * (t - noteStart)) * 0.25;
                }
            }
            data[i] = sample;
        }
        return buffer;
    },

    'tesla-inspired': (sampleRate, createBuffer) => {
        const duration = 1.3;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-2.5 * t);
            // Dual sweep creating a "whoosh-beep" effect
            const freq1 = 400 + 800 * Math.min(t * 3, 1);
            const freq2 = 1200 - 400 * Math.min(t * 2, 1);
            const mix = t < 0.3 ? t / 0.3 : 1;
            data[i] = (Math.sin(2 * Math.PI * freq1 * t) * (1 - mix * 0.5) +
                       Math.sin(2 * Math.PI * freq2 * t) * mix * 0.5) * envelope * 0.35;
        }
        return buffer;
    },

    'musical-chord': (sampleRate, createBuffer) => {
        const duration = 1.5;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        // C major chord: C4, E4, G4
        const freqs = [261.63, 329.63, 392.00];

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-2 * t);
            let sample = 0;
            for (const freq of freqs) {
                sample += Math.sin(2 * Math.PI * freq * t);
            }
            data[i] = sample * envelope * 0.2;
        }
        return buffer;
    },

    'cyber-lock': (sampleRate, createBuffer) => {
        const duration = 1.0;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Digital-style stepped frequencies
            const step = Math.floor(t * 8) / 8;
            const freq = 600 + step * 600;
            const envelope = Math.exp(-3 * t);
            // Add some "digital" character with square wave blend
            const sine = Math.sin(2 * Math.PI * freq * t);
            const square = Math.sign(sine) * 0.3;
            data[i] = (sine * 0.7 + square) * envelope * 0.3;
        }
        return buffer;
    },

    'gentle-bells': (sampleRate, createBuffer) => {
        const duration = 2.0;
        const buffer = createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        // Bell-like frequencies with inharmonic partials
        const bellTimes = [0, 0.5, 1.0];
        const bellFreqs = [880, 1100, 880];

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            for (let b = 0; b < bellTimes.length; b++) {
                if (t >= bellTimes[b]) {
                    const bt = t - bellTimes[b];
                    const env = Math.exp(-3 * bt);
                    const freq = bellFreqs[b];
                    // Bell-like: fundamental + slightly inharmonic partials
                    sample += Math.sin(2 * Math.PI * freq * bt) * env;
                    sample += Math.sin(2 * Math.PI * freq * 2.4 * bt) * env * 0.3;
                    sample += Math.sin(2 * Math.PI * freq * 3.2 * bt) * env * 0.1;
                }
            }
            data[i] = sample * 0.2;
        }
        return buffer;
    }
};

/**
 * Generate a synthesized sound based on the sound ID
 */
function generateSynthesizedAudio(soundId, audioContext) {
    const sampleRate = audioContext.sampleRate;
    const createBuffer = (channels, length, sr) => audioContext.createBuffer(channels, length, sr);

    const generator = soundGenerators[soundId] || soundGenerators['chime-classic'];
    return generator(sampleRate, createBuffer);
}

/**
 * Write a string to a DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Resample audio buffer to target sample rate using linear interpolation
 */
function resampleBuffer(buffer, targetSampleRate) {
    const sourceSampleRate = buffer.sampleRate;
    const sourceData = buffer.getChannelData(0);
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(sourceData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, sourceData.length - 1);
        const t = srcIndex - srcIndexFloor;
        result[i] = sourceData[srcIndexFloor] * (1 - t) + sourceData[srcIndexCeil] * t;
    }

    return result;
}

/**
 * Convert AudioBuffer to WAV file blob
 */
function audioBufferToWav(buffer, targetSampleRate = 44100) {
    const numChannels = 1;
    const sampleRate = targetSampleRate;
    const bitsPerSample = 16;

    let samples;
    if (buffer.sampleRate !== targetSampleRate) {
        samples = resampleBuffer(buffer, targetSampleRate);
    } else {
        samples = buffer.getChannelData(0);
    }

    const dataLength = samples.length * 2;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Parse WAV file header and validate format
 */
function parseWavHeader(arrayBuffer) {
    const view = new DataView(arrayBuffer);

    // Check RIFF header
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (riff !== 'RIFF') {
        throw new Error('Invalid WAV file: missing RIFF header');
    }

    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    if (wave !== 'WAVE') {
        throw new Error('Invalid WAV file: missing WAVE format');
    }

    const audioFormat = view.getUint16(20, true);
    const numChannels = view.getUint16(22, true);
    const sampleRate = view.getUint32(24, true);
    const bitsPerSample = view.getUint16(34, true);
    const dataSize = view.getUint32(40, true);

    return {
        audioFormat,
        numChannels,
        sampleRate,
        bitsPerSample,
        dataSize,
        duration: dataSize / (sampleRate * numChannels * (bitsPerSample / 8))
    };
}

// Browser global exports
if (typeof window !== 'undefined') {
    window.AUDIO_SAMPLES = AUDIO_SAMPLES;
    window.generateSynthesizedAudio = generateSynthesizedAudio;
    window.audioBufferToWav = audioBufferToWav;
    window.resampleBuffer = resampleBuffer;
    window.parseWavHeader = parseWavHeader;
}
