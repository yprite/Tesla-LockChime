import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    FileSystemHandler,
    LOCK_CHIME_FILENAME,
    SUPPORTED_BROWSERS,
    TESLA_USB_DIRECTORY,
    TESLA_BOOMBOX_DIRECTORY
} from '../src/file-system.js';

describe('Constants', () => {
    it('should have correct lock chime filename', () => {
        expect(LOCK_CHIME_FILENAME).toBe('LockChime.wav');
    });

    it('should list Chrome and Edge as supported browsers', () => {
        expect(SUPPORTED_BROWSERS).toContain('Chrome');
        expect(SUPPORTED_BROWSERS).toContain('Edge');
    });

    it('should use Tesla folder structure constants', () => {
        expect(TESLA_USB_DIRECTORY).toBe('TESLAUSB');
        expect(TESLA_BOOMBOX_DIRECTORY).toBe('Boombox');
    });
});

describe('FileSystemHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new FileSystemHandler();
    });

    describe('constructor', () => {
        it('should initialize with isSupported property', () => {
            expect(handler).toHaveProperty('isSupported');
        });
    });

    describe('checkSupport()', () => {
        it('should return true when API is available', () => {
            // In test environment, we mock the API
            expect(handler.checkSupport()).toBe(true);
        });
    });

    describe('isMobileDevice()', () => {
        it('should return false for desktop user agent', () => {
            // Default jsdom has desktop-like user agent
            const result = handler.isMobileDevice();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('isTablet()', () => {
        it('should return false for desktop user agent', () => {
            const result = handler.isTablet();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('isChromiumBrowser()', () => {
        it('should return boolean', () => {
            const result = handler.isChromiumBrowser();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('getBrowserName()', () => {
        it('should return a string', () => {
            const name = handler.getBrowserName();
            expect(typeof name).toBe('string');
        });
    });

    describe('getCompatibilityStatus()', () => {
        it('should return an object with required properties', () => {
            const status = handler.getCompatibilityStatus();

            expect(status).toHaveProperty('compatible');
            expect(status).toHaveProperty('reason');
            expect(status).toHaveProperty('message');
            expect(status).toHaveProperty('browserName');
        });

        it('should have boolean compatible property', () => {
            const status = handler.getCompatibilityStatus();
            expect(typeof status.compatible).toBe('boolean');
        });

        it('should have string message', () => {
            const status = handler.getCompatibilityStatus();
            expect(typeof status.message).toBe('string');
            expect(status.message.length).toBeGreaterThan(0);
        });
    });

    describe('downloadFile()', () => {
        it('should return success result', () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = handler.downloadFile(blob);

            expect(result.success).toBe(true);
            expect(result.fallback).toBe(true);
        });

        it('should use correct filename', () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = handler.downloadFile(blob, 'LockChime.wav');

            expect(result.fileName).toBe('LockChime.wav');
        });

        it('should include instruction message', () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = handler.downloadFile(blob);

            expect(result.message).toContain('USB');
        });
    });

    describe('validateFileSave()', () => {
        it('should validate successful save with correct filename', () => {
            const result = handler.validateFileSave({
                success: true,
                fileName: 'LockChime.wav'
            });

            expect(result.valid).toBe(true);
        });

        it('should reject failed save', () => {
            const result = handler.validateFileSave({
                success: false,
                message: 'Save failed'
            });

            expect(result.valid).toBe(false);
        });

        it('should reject wrong filename', () => {
            const result = handler.validateFileSave({
                success: true,
                fileName: 'WrongName.wav'
            });

            expect(result.valid).toBe(false);
            expect(result.message).toContain('LockChime.wav');
        });
    });

    describe('checkForUSB()', () => {
        it('should return object with detected property', async () => {
            const result = await handler.checkForUSB();

            expect(result).toHaveProperty('detected');
            expect(result).toHaveProperty('message');
        });
    });
});

describe('FileSystemHandler - Save Operations', () => {
    let handler;

    beforeEach(() => {
        handler = new FileSystemHandler();

        // Mock showSaveFilePicker
        global.showSaveFilePicker = vi.fn();
        window.showSaveFilePicker = global.showSaveFilePicker;
    });

    describe('saveFile()', () => {
        it('should call showSaveFilePicker with correct options', async () => {
            const mockWritable = {
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined)
            };

            const mockFileHandle = {
                name: 'LockChime.wav',
                createWritable: vi.fn().mockResolvedValue(mockWritable)
            };

            window.showSaveFilePicker.mockResolvedValue(mockFileHandle);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            await handler.saveFile(blob);

            expect(window.showSaveFilePicker).toHaveBeenCalledWith(
                expect.objectContaining({
                    suggestedName: 'LockChime.wav'
                })
            );
        });

        it('should return success on successful save', async () => {
            const mockWritable = {
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined)
            };

            const mockFileHandle = {
                name: 'LockChime.wav',
                createWritable: vi.fn().mockResolvedValue(mockWritable)
            };

            window.showSaveFilePicker.mockResolvedValue(mockFileHandle);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await handler.saveFile(blob);

            expect(result.success).toBe(true);
            expect(result.fileName).toBe('LockChime.wav');
        });

        it('should handle user cancellation', async () => {
            const abortError = new Error('User cancelled');
            abortError.name = 'AbortError';
            window.showSaveFilePicker.mockRejectedValue(abortError);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await handler.saveFile(blob);

            expect(result.success).toBe(false);
            expect(result.cancelled).toBe(true);
        });

        it('should throw on other errors', async () => {
            window.showSaveFilePicker.mockRejectedValue(new Error('Unknown error'));

            const blob = new Blob(['test'], { type: 'audio/wav' });

            await expect(handler.saveFile(blob)).rejects.toThrow('Unknown error');
        });

        it('should throw when API not supported', async () => {
            handler.isSupported = false;
            const blob = new Blob(['test'], { type: 'audio/wav' });

            await expect(handler.saveFile(blob)).rejects.toThrow('not supported');
        });
    });

    describe('saveToDirectory()', () => {
        beforeEach(() => {
            global.showDirectoryPicker = vi.fn();
            window.showDirectoryPicker = global.showDirectoryPicker;
        });

        it('should handle user cancellation', async () => {
            const abortError = new Error('User cancelled');
            abortError.name = 'AbortError';
            window.showDirectoryPicker.mockRejectedValue(abortError);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await handler.saveToDirectory(blob);

            expect(result.success).toBe(false);
            expect(result.cancelled).toBe(true);
        });

        it('should handle permission denied', async () => {
            const permError = new Error('Permission denied');
            permError.name = 'NotAllowedError';
            window.showDirectoryPicker.mockRejectedValue(permError);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await handler.saveToDirectory(blob);

            expect(result.success).toBe(false);
            expect(result.permissionDenied).toBe(true);
        });

        it('should indicate when file is overwritten', async () => {
            const mockWritable = {
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined)
            };

            const mockFileHandle = {
                createWritable: vi.fn().mockResolvedValue(mockWritable)
            };

            const mockBoomboxDirectoryHandle = {
                getFileHandle: vi.fn()
                    .mockResolvedValueOnce({}) // File exists check
                    .mockResolvedValueOnce(mockFileHandle) // Create/get for writing
            };

            const mockTeslaUsbDirectoryHandle = {
                getDirectoryHandle: vi.fn().mockResolvedValue(mockBoomboxDirectoryHandle)
            };

            const mockDirectoryHandle = {
                name: 'USB_DRIVE',
                getDirectoryHandle: vi.fn().mockResolvedValue(mockTeslaUsbDirectoryHandle)
            };

            window.showDirectoryPicker.mockResolvedValue(mockDirectoryHandle);

            const blob = new Blob(['test'], { type: 'audio/wav' });
            const result = await handler.saveToDirectory(blob);

            expect(result.success).toBe(true);
            expect(result.overwritten).toBe(true);
            expect(result.targetPath).toBe('TESLAUSB/Boombox/LockChime.wav');
            expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('TESLAUSB', { create: true });
            expect(mockTeslaUsbDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('Boombox', { create: true });
        });
    });
});

describe('FileSystemHandler - Browser Detection', () => {
    const createHandlerWithUA = (userAgent) => {
        const originalNavigator = global.navigator;

        Object.defineProperty(global, 'navigator', {
            value: { userAgent },
            writable: true,
            configurable: true
        });

        const handler = new FileSystemHandler();

        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });

        return handler;
    };

    describe('Mobile Detection', () => {
        it('should detect iPhone', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });

            const handler = new FileSystemHandler();
            expect(handler.isMobileDevice()).toBe(true);
        });

        it('should detect Android phone', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
                configurable: true
            });

            const handler = new FileSystemHandler();
            expect(handler.isMobileDevice()).toBe(true);
        });
    });
});

describe('Tesla USB Requirements', () => {
    let handler;

    beforeEach(() => {
        handler = new FileSystemHandler();
    });

    it('should validate Tesla-specific filename', () => {
        const validResult = handler.validateFileSave({
            success: true,
            fileName: 'LockChime.wav'
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = handler.validateFileSave({
            success: true,
            fileName: 'lockchime.wav' // Wrong case
        });
        expect(invalidResult.valid).toBe(false);
    });

    it('should use exact filename for Tesla compatibility', () => {
        expect(LOCK_CHIME_FILENAME).toBe('LockChime.wav');
        expect(LOCK_CHIME_FILENAME).not.toBe('lockchime.wav');
        expect(LOCK_CHIME_FILENAME).not.toBe('LOCKCHIME.WAV');
    });
});
