/**
 * Tests for Sharing Module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SharingHandler, SHARE_URL_PARAM, SHARE_NAME_PARAM, MAX_SHARE_SIZE } from '../src/sharing.js';

describe('SharingHandler', () => {
    let sharingHandler;
    let originalLocation;

    beforeEach(() => {
        sharingHandler = new SharingHandler();

        // Store original location
        originalLocation = window.location;

        // Mock window.location
        delete window.location;
        window.location = {
            origin: 'https://example.com',
            pathname: '/',
            href: 'https://example.com/',
            search: ''
        };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    describe('constructor', () => {
        it('should detect Web Share API support', () => {
            expect(typeof sharingHandler.isWebShareSupported).toBe('boolean');
        });

        it('should detect Clipboard API support', () => {
            expect(typeof sharingHandler.isClipboardSupported).toBe('boolean');
        });
    });

    describe('canWebShare', () => {
        it('should return a boolean', () => {
            expect(typeof sharingHandler.canWebShare()).toBe('boolean');
        });
    });

    describe('canCopyToClipboard', () => {
        it('should return a boolean', () => {
            expect(typeof sharingHandler.canCopyToClipboard()).toBe('boolean');
        });
    });

    describe('blobToBase64', () => {
        it('should convert blob to base64 string', async () => {
            const blob = new Blob(['Hello World'], { type: 'text/plain' });
            const base64 = await sharingHandler.blobToBase64(blob);

            expect(typeof base64).toBe('string');
            expect(base64.length).toBeGreaterThan(0);
        });

        it('should convert audio blob to base64', async () => {
            const audioData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF header start
            const blob = new Blob([audioData], { type: 'audio/wav' });
            const base64 = await sharingHandler.blobToBase64(blob);

            expect(typeof base64).toBe('string');
        });
    });

    describe('base64ToBlob', () => {
        it('should convert base64 to blob', () => {
            const originalText = 'Hello World';
            const base64 = btoa(originalText);
            const blob = sharingHandler.base64ToBlob(base64, 'text/plain');

            expect(blob instanceof Blob).toBe(true);
            expect(blob.type).toBe('text/plain');
        });

        it('should throw error for invalid base64', () => {
            expect(() => {
                sharingHandler.base64ToBlob('!!!invalid!!!', 'text/plain');
            }).toThrow('Invalid audio data in URL');
        });
    });

    describe('compressBase64 / decompressBase64', () => {
        it('should make base64 URL-safe', () => {
            const base64 = 'a+b/c==';
            const compressed = sharingHandler.compressBase64(base64);

            expect(compressed).not.toContain('+');
            expect(compressed).not.toContain('/');
            expect(compressed).not.toContain('=');
            expect(compressed).toBe('a-b_c');
        });

        it('should decompress back to valid base64', () => {
            const original = 'a+b/c===';
            const compressed = sharingHandler.compressBase64(original);
            const decompressed = sharingHandler.decompressBase64(compressed);

            // Should be equivalent (padding may differ)
            expect(decompressed.replace(/=/g, '')).toBe(original.replace(/=/g, ''));
        });

        it('should handle round-trip encoding', () => {
            const text = 'Hello World! This is a test.';
            const base64 = btoa(text);
            const compressed = sharingHandler.compressBase64(base64);
            const decompressed = sharingHandler.decompressBase64(compressed);

            expect(atob(decompressed)).toBe(text);
        });
    });

    describe('generateShareUrl', () => {
        it('should generate a URL with sound parameter', async () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await sharingHandler.generateShareUrl(blob, 'Test Sound');

            expect(result.url).toContain('example.com');
            expect(result.url).toContain(SHARE_URL_PARAM);
            expect(result.url).toContain(SHARE_NAME_PARAM);
            expect(typeof result.size).toBe('number');
            expect(typeof result.isLarge).toBe('boolean');
        });

        it('should encode the sound name', async () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await sharingHandler.generateShareUrl(blob, 'Test Sound');

            expect(result.url).toContain('Test%20Sound');
        });

        it('should throw error if blob is too large', async () => {
            const largeData = new Uint8Array(MAX_SHARE_SIZE + 1);
            const blob = new Blob([largeData], { type: 'audio/wav' });

            await expect(sharingHandler.generateShareUrl(blob)).rejects.toThrow('too large');
        });

        it('should mark large URLs appropriately', async () => {
            // Create a medium-sized blob that creates a long URL
            const data = new Uint8Array(1500);
            const blob = new Blob([data], { type: 'audio/wav' });
            const result = await sharingHandler.generateShareUrl(blob);

            expect(result.isLarge).toBe(result.size > 2000);
        });
    });

    describe('hasSharedAudio', () => {
        it('should return false when no shared audio in URL', () => {
            window.location.search = '';
            expect(sharingHandler.hasSharedAudio()).toBe(false);
        });

        it('should return true when shared audio is in URL', () => {
            window.location.search = `?${SHARE_URL_PARAM}=abc123`;
            expect(sharingHandler.hasSharedAudio()).toBe(true);
        });
    });

    describe('getSharedAudioName', () => {
        it('should return default name when not provided', () => {
            window.location.search = `?${SHARE_URL_PARAM}=abc123`;
            expect(sharingHandler.getSharedAudioName()).toBe('Shared Sound');
        });

        it('should return decoded name when provided', () => {
            window.location.search = `?${SHARE_NAME_PARAM}=My%20Sound&${SHARE_URL_PARAM}=abc`;
            expect(sharingHandler.getSharedAudioName()).toBe('My Sound');
        });
    });

    describe('getSharedAudio', () => {
        it('should return null when no shared audio', () => {
            window.location.search = '';
            expect(sharingHandler.getSharedAudio()).toBeNull();
        });

        it('should decode shared audio from URL', () => {
            const text = 'test audio data';
            const base64 = btoa(text);
            const urlSafe = sharingHandler.compressBase64(base64);

            window.location.search = `?${SHARE_NAME_PARAM}=TestSound&${SHARE_URL_PARAM}=${urlSafe}`;

            const result = sharingHandler.getSharedAudio();

            expect(result).not.toBeNull();
            expect(result.name).toBe('TestSound');
            expect(result.blob instanceof Blob).toBe(true);
        });

        it('should return null for invalid base64', () => {
            window.location.search = `?${SHARE_URL_PARAM}=!!!invalid!!!`;

            // Should not throw, just return null
            const result = sharingHandler.getSharedAudio();
            expect(result).toBeNull();
        });
    });

    describe('clearSharedAudioFromUrl', () => {
        it('should call replaceState to remove share parameters', () => {
            // Mock replaceState to avoid jsdom security errors
            const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

            window.location.search = `?${SHARE_NAME_PARAM}=Test&${SHARE_URL_PARAM}=abc`;
            window.location.href = `https://example.com/?${SHARE_NAME_PARAM}=Test&${SHARE_URL_PARAM}=abc`;

            sharingHandler.clearSharedAudioFromUrl();

            expect(replaceStateSpy).toHaveBeenCalled();
            replaceStateSpy.mockRestore();
        });
    });

    describe('generateQRCode', () => {
        it('should return QR code URL for small audio', async () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await sharingHandler.generateQRCode(blob, 'Test');

            expect(result.success).toBe(true);
            expect(result.qrDataUrl).toContain('api.qrserver.com');
        });

        it('should fail for large audio', async () => {
            const largeData = new Uint8Array(10000);
            const blob = new Blob([largeData], { type: 'audio/wav' });
            const result = await sharingHandler.generateQRCode(blob, 'Test');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

describe('Constants', () => {
    it('should export SHARE_URL_PARAM', () => {
        expect(SHARE_URL_PARAM).toBe('sound');
    });

    it('should export SHARE_NAME_PARAM', () => {
        expect(SHARE_NAME_PARAM).toBe('name');
    });

    it('should export MAX_SHARE_SIZE', () => {
        expect(MAX_SHARE_SIZE).toBe(500 * 1024);
    });
});
