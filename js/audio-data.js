/**
 * Audio Data - Sample sounds available for selection
 *
 * These are royalty-free sounds that can be used as Tesla lock chimes.
 * The sounds are stored as base64-encoded data URIs to avoid server requirements.
 */

const AUDIO_SAMPLES = [
    {
        id: 'chime-classic',
        name: 'Classic Chime',
        icon: '🔔',
        duration: 1.5,
        description: 'Simple classic chime sound'
    },
    {
        id: 'beep-confirm',
        name: 'Confirmation Beep',
        icon: '✓',
        duration: 0.8,
        description: 'Short confirmation beep'
    },
    {
        id: 'futuristic',
        name: 'Futuristic',
        icon: '🚀',
        duration: 2.0,
        description: 'Sci-fi style lock sound'
    },
    {
        id: 'gentle-tone',
        name: 'Gentle Tone',
        icon: '🎵',
        duration: 1.2,
        description: 'Soft pleasant tone'
    },
    {
        id: 'electric',
        name: 'Electric Pulse',
        icon: '⚡',
        duration: 1.0,
        description: 'Electric charging sound'
    },
    {
        id: 'notification',
        name: 'Notification',
        icon: '📱',
        duration: 0.9,
        description: 'Modern notification sound'
    },
    {
        id: 'doorbell',
        name: 'Door Bell',
        icon: '🚪',
        duration: 1.8,
        description: 'Traditional doorbell chime'
    },
    {
        id: 'success',
        name: 'Success',
        icon: '🎯',
        duration: 1.1,
        description: 'Achievement unlock sound'
    }
];

/**
 * Generate a simple synthesized sound based on the sound ID
 * This creates audio programmatically using Web Audio API
 */
function generateSynthesizedAudio(soundId, audioContext) {
    const sampleRate = audioContext.sampleRate;
    const sounds = {
        'chime-classic': () => {
            const duration = 1.5;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Two-tone chime
            const freq1 = 880; // A5
            const freq2 = 1108.73; // C#6

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-3 * t);
                const tone1 = Math.sin(2 * Math.PI * freq1 * t) * envelope;
                const tone2 = Math.sin(2 * Math.PI * freq2 * t) * envelope * (t > 0.15 ? 1 : 0);
                data[i] = (tone1 + tone2) * 0.3;
            }
            return buffer;
        },

        'beep-confirm': () => {
            const duration = 0.8;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const envelope = t < 0.1 ? t * 10 : Math.exp(-5 * (t - 0.1));
                const freq = 1200;
                data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
            }
            return buffer;
        },

        'futuristic': () => {
            const duration = 2.0;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-2 * t);
                // Frequency sweep
                const freqStart = 300;
                const freqEnd = 1500;
                const freq = freqStart + (freqEnd - freqStart) * (1 - Math.exp(-3 * t));
                const tone = Math.sin(2 * Math.PI * freq * t);
                // Add harmonics
                const harmonic = Math.sin(4 * Math.PI * freq * t) * 0.3;
                data[i] = (tone + harmonic) * envelope * 0.3;
            }
            return buffer;
        },

        'gentle-tone': () => {
            const duration = 1.2;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const envelope = Math.sin(Math.PI * t / duration);
                const freq = 523.25; // C5
                const tone = Math.sin(2 * Math.PI * freq * t);
                const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
                data[i] = (tone + harmonic) * envelope * 0.35;
            }
            return buffer;
        },

        'electric': () => {
            const duration = 1.0;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-4 * t);
                // Electric buzzy sound
                const freq = 440;
                let sample = 0;
                for (let h = 1; h <= 8; h++) {
                    sample += Math.sin(2 * Math.PI * freq * h * t) / h;
                }
                data[i] = sample * envelope * 0.15;
            }
            return buffer;
        },

        'notification': () => {
            const duration = 0.9;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            const notes = [784, 988, 1175]; // G5, B5, D6
            const noteLength = duration / 3;

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                const noteIndex = Math.min(Math.floor(t / noteLength), 2);
                const noteTime = t - noteIndex * noteLength;
                const envelope = Math.exp(-6 * noteTime);
                const freq = notes[noteIndex];
                data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.35;
            }
            return buffer;
        },

        'doorbell': () => {
            const duration = 1.8;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Classic ding-dong
            const freq1 = 659.25; // E5
            const freq2 = 523.25; // C5

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                let sample = 0;

                if (t < 0.9) {
                    const env1 = Math.exp(-3 * t);
                    sample = Math.sin(2 * Math.PI * freq1 * t) * env1;
                }
                if (t > 0.4) {
                    const t2 = t - 0.4;
                    const env2 = Math.exp(-2.5 * t2);
                    sample += Math.sin(2 * Math.PI * freq2 * t) * env2;
                }

                data[i] = sample * 0.35;
            }
            return buffer;
        },

        'success': () => {
            const duration = 1.1;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Triumphant arpeggio
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            const noteLength = duration / 5;

            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                let sample = 0;

                for (let n = 0; n < notes.length; n++) {
                    const noteStart = n * noteLength * 0.8;
                    if (t >= noteStart) {
                        const noteTime = t - noteStart;
                        const envelope = Math.exp(-3 * noteTime);
                        sample += Math.sin(2 * Math.PI * notes[n] * t) * envelope * 0.25;
                    }
                }

                data[i] = sample;
            }
            return buffer;
        }
    };

    return sounds[soundId] ? sounds[soundId]() : sounds['chime-classic']();
}

/**
 * Convert AudioBuffer to WAV file data
 */
function audioBufferToWav(buffer, targetSampleRate = 44100) {
    const numChannels = 1; // Mono for Tesla
    const sampleRate = targetSampleRate;
    const bitsPerSample = 16;

    // Resample if necessary
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

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
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

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

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

// Export for use in other modules
window.AUDIO_SAMPLES = AUDIO_SAMPLES;
window.generateSynthesizedAudio = generateSynthesizedAudio;
window.audioBufferToWav = audioBufferToWav;
