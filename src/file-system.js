/**
 * File System Handler - Uses File System Access API to save to USB
 *
 * Browser Support:
 * - Chrome 86+ ✓
 * - Edge 86+ ✓
 * - Safari ✗
 * - Firefox ✗
 */

export const SUPPORTED_BROWSERS = ['Chrome', 'Edge'];
export const LOCK_CHIME_FILENAME = 'LockChime.wav';

export class FileSystemHandler {
    constructor() {
        this.isSupported = this.checkSupport();
    }

    /**
     * Check if File System Access API is supported
     */
    checkSupport() {
        return typeof window !== 'undefined' &&
               'showDirectoryPicker' in window &&
               'showSaveFilePicker' in window;
    }

    /**
     * Detect if the user is on a mobile device
     */
    isMobileDevice() {
        if (typeof navigator === 'undefined') return false;

        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * Detect if running on a tablet
     */
    isTablet() {
        if (typeof navigator === 'undefined') return false;

        const ua = navigator.userAgent;
        return /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
    }

    /**
     * Detect if the browser is Chrome or Edge (Chromium-based)
     */
    isChromiumBrowser() {
        if (typeof navigator === 'undefined') return false;

        const ua = navigator.userAgent;
        const isChrome = ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR');
        const isEdge = ua.includes('Edg');
        return isChrome || isEdge;
    }

    /**
     * Get the browser name
     */
    getBrowserName() {
        if (typeof navigator === 'undefined') return 'Unknown';

        const ua = navigator.userAgent;

        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Edg')) return 'Edge';
        if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';

        return 'Unknown';
    }

    /**
     * Get browser compatibility status
     */
    getCompatibilityStatus() {
        if (this.isMobileDevice()) {
            return {
                compatible: false,
                reason: 'mobile',
                message: 'This tool requires a desktop computer. Mobile devices are not supported.',
                browserName: this.getBrowserName()
            };
        }

        if (this.isTablet()) {
            return {
                compatible: false,
                reason: 'tablet',
                message: 'This tool requires a desktop computer. Tablets are not supported.',
                browserName: this.getBrowserName()
            };
        }

        if (!this.isChromiumBrowser()) {
            return {
                compatible: false,
                reason: 'browser',
                message: `This tool requires Chrome or Edge browser. ${this.getBrowserName()} is not supported.`,
                browserName: this.getBrowserName()
            };
        }

        if (!this.isSupported) {
            return {
                compatible: false,
                reason: 'api',
                message: 'Your browser does not support the File System Access API. Please update to the latest version of Chrome or Edge.',
                browserName: this.getBrowserName()
            };
        }

        return {
            compatible: true,
            reason: null,
            message: 'Your browser is compatible!',
            browserName: this.getBrowserName()
        };
    }

    /**
     * Save a file using the File System Access API (save file picker)
     */
    async saveFile(blob, suggestedName = LOCK_CHIME_FILENAME) {
        if (!this.isSupported) {
            throw new Error('File System Access API is not supported in this browser');
        }

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [
                    {
                        description: 'WAV Audio File',
                        accept: {
                            'audio/wav': ['.wav']
                        }
                    }
                ]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            return {
                success: true,
                fileName: fileHandle.name,
                message: 'File saved successfully!'
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    cancelled: true,
                    message: 'Save cancelled by user'
                };
            }

            throw error;
        }
    }

    /**
     * Save a file to a directory (using directory picker)
     */
    async saveToDirectory(blob, fileName = LOCK_CHIME_FILENAME) {
        if (!this.isSupported) {
            throw new Error('File System Access API is not supported in this browser');
        }

        try {
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'desktop'
            });

            let existingFile = null;
            try {
                existingFile = await directoryHandle.getFileHandle(fileName);
            } catch (e) {
                // File doesn't exist, which is fine
            }

            const fileHandle = await directoryHandle.getFileHandle(fileName, {
                create: true
            });

            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            return {
                success: true,
                fileName: fileName,
                directoryName: directoryHandle.name,
                overwritten: existingFile !== null,
                message: existingFile
                    ? `${fileName} has been updated in ${directoryHandle.name}`
                    : `${fileName} has been saved to ${directoryHandle.name}`
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    cancelled: true,
                    message: 'Save cancelled by user'
                };
            }

            if (error.name === 'NotAllowedError') {
                return {
                    success: false,
                    permissionDenied: true,
                    message: 'Permission denied. Please allow access to the folder.'
                };
            }

            throw error;
        }
    }

    /**
     * Fallback download method for unsupported browsers
     */
    downloadFile(blob, fileName = LOCK_CHIME_FILENAME) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return {
            success: true,
            fallback: true,
            fileName,
            message: `${fileName} downloaded. Please manually copy it to the root of your USB drive.`
        };
    }

    /**
     * Check if a USB drive appears to be connected
     * Note: This is a heuristic check and may not be 100% accurate
     */
    async checkForUSB() {
        // This is a placeholder - actual USB detection is not possible
        // We can only prompt the user to select a directory
        return {
            detected: false,
            message: 'Please select your USB drive location manually.'
        };
    }

    /**
     * Validate that the file was saved correctly
     */
    validateFileSave(result) {
        if (!result.success) {
            return {
                valid: false,
                message: result.message || 'File save failed'
            };
        }

        if (result.fileName !== LOCK_CHIME_FILENAME) {
            return {
                valid: false,
                message: `File must be named exactly "${LOCK_CHIME_FILENAME}". The file was saved as "${result.fileName}".`
            };
        }

        return {
            valid: true,
            message: 'File saved correctly!'
        };
    }
}

// Browser global export
if (typeof window !== 'undefined') {
    window.FileSystemHandler = FileSystemHandler;
    window.LOCK_CHIME_FILENAME = LOCK_CHIME_FILENAME;
    window.SUPPORTED_BROWSERS = SUPPORTED_BROWSERS;
}
