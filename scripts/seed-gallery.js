#!/usr/bin/env node
/**
 * Gallery Seed Script
 *
 * Generates and uploads sample sounds to populate the community gallery.
 * This helps create initial content for new users to discover.
 *
 * Usage:
 *   node scripts/seed-gallery.js
 *
 * Environment Variables:
 *   FIREBASE_PROJECT_ID - Firebase project ID
 *   FIREBASE_API_KEY - Firebase API key (optional, uses default if not set)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed data for gallery population
const SEED_SOUNDS = [
    // Classic Category
    {
        name: 'Classic Beep',
        description: 'Simple and clean beep sound, perfect for everyday use',
        category: 'classic',
        sourceSound: 'classic-beep'
    },
    {
        name: 'Gentle Chime',
        description: 'Soft melodic chime that\'s pleasant and not intrusive',
        category: 'classic',
        sourceSound: 'soft-chime'
    },
    {
        name: 'Double Beep',
        description: 'Two quick beeps for confirmation',
        category: 'classic',
        sourceSound: 'double-beep'
    },

    // Modern Category
    {
        name: 'Digital Confirmation',
        description: 'Modern digital sound with a tech feel',
        category: 'modern',
        sourceSound: 'digital-chirp'
    },
    {
        name: 'Smooth Lock',
        description: 'Sleek modern locking sound',
        category: 'modern',
        sourceSound: 'smooth-tone'
    },
    {
        name: 'Tech Pulse',
        description: 'Electronic pulse for the modern Tesla owner',
        category: 'modern',
        sourceSound: 'electronic-blip'
    },

    // Futuristic Category
    {
        name: 'Sci-Fi Chirp',
        description: 'Sound straight from a spaceship',
        category: 'futuristic',
        sourceSound: 'sci-fi-chirp'
    },
    {
        name: 'Cyber Lock',
        description: 'Cyberpunk-inspired locking sound',
        category: 'futuristic',
        sourceSound: 'futuristic-whoosh'
    },
    {
        name: 'Space Confirmation',
        description: 'Like locking your car on Mars',
        category: 'futuristic',
        sourceSound: 'space-blip'
    },

    // Funny Category
    {
        name: 'Cartoon Boing',
        description: 'Fun bouncy sound that makes people smile',
        category: 'funny',
        sourceSound: 'cartoon-boing'
    },
    {
        name: 'Video Game Power Up',
        description: 'Classic 8-bit power up sound',
        category: 'funny',
        sourceSound: 'retro-game'
    },
    {
        name: 'Duck Quack',
        description: 'Quack quack! Your car is now a duck',
        category: 'funny',
        sourceSound: 'animal-sound'
    },

    // Musical Category
    {
        name: 'Piano Note',
        description: 'Single elegant piano key press',
        category: 'musical',
        sourceSound: 'piano-note'
    },
    {
        name: 'Guitar Strum',
        description: 'Quick acoustic guitar strum',
        category: 'musical',
        sourceSound: 'guitar-chord'
    },
    {
        name: 'Orchestral Hit',
        description: 'Dramatic orchestral accent',
        category: 'musical',
        sourceSound: 'orchestra-hit'
    },

    // Custom Category - Creative variations
    {
        name: 'Minimalist Click',
        description: 'Ultra-minimal, barely-there click',
        category: 'custom',
        sourceSound: 'subtle-click'
    },
    {
        name: 'Luxury Tone',
        description: 'Premium feel for your premium car',
        category: 'custom',
        sourceSound: 'premium-tone'
    },
    {
        name: 'Nature Whisper',
        description: 'Gentle wind-like sound, organic and calming',
        category: 'custom',
        sourceSound: 'wind-chime'
    }
];

// Additional variations with creative names
const CREATIVE_VARIATIONS = [
    { name: 'Stealth Mode', description: 'Subtle confirmation for the discreet driver', category: 'modern' },
    { name: 'Arcade Classic', description: 'Nostalgic gaming vibes', category: 'funny' },
    { name: 'Symphony Snippet', description: 'A touch of classical elegance', category: 'musical' },
    { name: 'Robot Friend', description: 'Your car says hello in robot', category: 'futuristic' },
    { name: 'Zen Bell', description: 'Peaceful meditation bell tone', category: 'classic' },
    { name: 'Electric Dreams', description: 'Synthwave-inspired confirmation', category: 'futuristic' },
    { name: 'Pocket Watch', description: 'Vintage timepiece tick', category: 'classic' },
    { name: 'Neon Pulse', description: '80s inspired electronic sound', category: 'modern' },
    { name: 'Bird Song', description: 'Quick chirp from nature', category: 'custom' },
    { name: 'Coin Drop', description: 'Satisfying coin collection sound', category: 'funny' },
    { name: 'Harp Gliss', description: 'Angelic harp glissando', category: 'musical' },
    { name: 'Thunder Rumble', description: 'Dramatic low thunder for impact', category: 'custom' }
];

/**
 * Generate WAV file header
 */
function createWavHeader(dataLength, sampleRate = 44100, channels = 1, bitDepth = 16) {
    const buffer = Buffer.alloc(44);
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitDepth, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

/**
 * Generate a simple tone as WAV data
 */
function generateTone(frequency, duration, sampleRate = 44100) {
    const numSamples = Math.floor(sampleRate * duration);
    const data = Buffer.alloc(numSamples * 2); // 16-bit samples

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Apply envelope (fade in/out)
        const envelope = Math.min(1, t * 20) * Math.min(1, (duration - t) * 20);
        const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.8;
        const int16Sample = Math.floor(sample * 32767);
        data.writeInt16LE(int16Sample, i * 2);
    }

    const header = createWavHeader(data.length);
    return Buffer.concat([header, data]);
}

/**
 * Generate different sound types
 */
function generateSound(type) {
    const sampleRate = 44100;
    const duration = 2.5; // Tesla requires 2-5 seconds

    switch (type) {
        case 'beep':
            return generateTone(880, duration);
        case 'chime':
            return generateChime(duration);
        case 'chirp':
            return generateChirp(duration);
        case 'boing':
            return generateBoing(duration);
        default:
            return generateTone(440, duration);
    }
}

/**
 * Generate a chime sound (multiple frequencies)
 */
function generateChime(duration, sampleRate = 44100) {
    const numSamples = Math.floor(sampleRate * duration);
    const data = Buffer.alloc(numSamples * 2);

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.min(1, t * 10) * Math.exp(-t * 2);

        let sample = 0;
        frequencies.forEach((freq, idx) => {
            const delay = idx * 0.1;
            if (t > delay) {
                sample += Math.sin(2 * Math.PI * freq * (t - delay)) * Math.exp(-(t - delay) * 3);
            }
        });

        sample = sample / frequencies.length * envelope * 0.7;
        const int16Sample = Math.floor(Math.max(-1, Math.min(1, sample)) * 32767);
        data.writeInt16LE(int16Sample, i * 2);
    }

    return Buffer.concat([createWavHeader(data.length), data]);
}

/**
 * Generate a chirp sound (frequency sweep)
 */
function generateChirp(duration, sampleRate = 44100) {
    const numSamples = Math.floor(sampleRate * duration);
    const data = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 400 + (t / duration) * 800; // Sweep from 400Hz to 1200Hz
        const envelope = Math.min(1, t * 20) * Math.exp(-t * 1.5);
        const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        const int16Sample = Math.floor(sample * 32767);
        data.writeInt16LE(int16Sample, i * 2);
    }

    return Buffer.concat([createWavHeader(data.length), data]);
}

/**
 * Generate a boing sound (bouncing frequency)
 */
function generateBoing(duration, sampleRate = 44100) {
    const numSamples = Math.floor(sampleRate * duration);
    const data = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Bouncing frequency with decay
        const bounce = Math.abs(Math.sin(t * 15)) * Math.exp(-t * 2);
        const freq = 200 + bounce * 600;
        const envelope = Math.exp(-t * 1.2);
        const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.7;
        const int16Sample = Math.floor(sample * 32767);
        data.writeInt16LE(int16Sample, i * 2);
    }

    return Buffer.concat([createWavHeader(data.length), data]);
}

/**
 * Get sound type based on category
 */
function getSoundTypeForCategory(category) {
    const typeMap = {
        'classic': ['beep', 'chime'],
        'modern': ['chirp', 'beep'],
        'futuristic': ['chirp', 'chime'],
        'funny': ['boing', 'chirp'],
        'musical': ['chime', 'beep'],
        'custom': ['beep', 'chime', 'chirp']
    };
    const types = typeMap[category] || ['beep'];
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Create seed data JSON file for browser-based upload
 */
function createSeedDataFile() {
    const allSounds = [...SEED_SOUNDS];

    // Add creative variations with random source sounds
    const sourceSounds = ['classic-beep', 'soft-chime', 'digital-chirp', 'sci-fi-chirp'];
    CREATIVE_VARIATIONS.forEach(variation => {
        allSounds.push({
            ...variation,
            sourceSound: sourceSounds[Math.floor(Math.random() * sourceSounds.length)]
        });
    });

    const seedData = {
        generated: new Date().toISOString(),
        totalSounds: allSounds.length,
        sounds: allSounds.map((sound, index) => ({
            id: `seed-${index + 1}`,
            ...sound,
            likes: Math.floor(Math.random() * 50) + 5,
            downloads: Math.floor(Math.random() * 100) + 10,
            duration: 2.5,
            creatorId: 'seed-bot',
            creatorName: 'Tesla Sound Bot'
        }))
    };

    const outputPath = path.join(__dirname, '..', 'data', 'seed-sounds.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));
    console.log(`Created seed data file: ${outputPath}`);
    console.log(`Total sounds: ${seedData.totalSounds}`);

    return seedData;
}

/**
 * Generate WAV files for testing
 */
function generateTestWavFiles() {
    const outputDir = path.join(__dirname, '..', 'data', 'generated-sounds');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const types = ['beep', 'chime', 'chirp', 'boing'];

    types.forEach(type => {
        const wavBuffer = generateSound(type);
        const outputPath = path.join(outputDir, `${type}.wav`);
        fs.writeFileSync(outputPath, wavBuffer);
        console.log(`Generated: ${outputPath}`);
    });

    console.log(`\nGenerated ${types.length} test WAV files in ${outputDir}`);
}

/**
 * Main execution
 */
function main() {
    console.log('=== Tesla Lock Sound Gallery Seeder ===\n');

    const args = process.argv.slice(2);

    if (args.includes('--generate-wav')) {
        console.log('Generating test WAV files...\n');
        generateTestWavFiles();
    }

    if (args.includes('--create-data') || args.length === 0) {
        console.log('Creating seed data file...\n');
        createSeedDataFile();
    }

    console.log('\n=== Done ===');
    console.log('\nTo upload to Firebase, use the browser-based upload or');
    console.log('configure Firebase Admin SDK with service account credentials.');
}

main();
