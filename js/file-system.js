/**
 * File System Handler - Uses File System Access API to save to USB
 *
 * The File System Access API allows web apps to read and write files
 * directly to the user's file system (with permission).
 *
 * Browser Support:
 * - Chrome 86+ ✓
 * - Edge 86+ ✓
 * - Safari ✗
 * - Firefox ✗
 */

class FileSystemHandler {
    constructor() {
        this.isSupported = this.checkSupport();
    }

    /**
     * Check if File System Access API is supported
     */
    checkSupport() {
        return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window;
    }

    /**
     * Detect if the user is on a mobile device
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * Detect if the browser is Chrome or Edge (Chromium-based)
     */
    isChromiumBrowser() {
        const ua = navigator.userAgent;
        const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
        const isEdge = ua.includes('Edg');
        return isChrome || isEdge;
    }

    /**
     * Get browser compatibility status
     */
    getCompatibilityStatus() {
        if (this.isMobileDevice()) {
            return {
                compatible: false,
                reason: 'mobile',
                message: 'This tool requires a desktop computer. Mobile devices are not supported.'
            };
        }

        if (!this.isChromiumBrowser()) {
            return {
                compatible: false,
                reason: 'browser',
                message: 'This tool requires Chrome or Edge browser. Safari and Firefox are not supported.'
            };
        }

        if (!this.isSupported) {
            return {
                compatible: false,
                reason: 'api',
                message: 'Your browser does not support the File System Access API. Please update to the latest version of Chrome or Edge.'
            };
        }

        return {
            compatible: true,
            reason: null,
            message: 'Your browser is compatible!'
        };
    }

    /**
     * Save a file using the File System Access API (save file picker)
     *
     * This method uses showSaveFilePicker which is the recommended approach
     * for saving a single file. The user can choose where to save.
     */
    async saveFile(blob, suggestedName = 'LockChime.wav') {
        if (!this.isSupported) {
            throw new Error('File System Access API is not supported in this browser');
        }

        try {
            // Show the file save picker
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

            // Create a writable stream
            const writable = await fileHandle.createWritable();

            // Write the blob
            await writable.write(blob);

            // Close the stream
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
     *
     * This method lets the user select a directory (like USB root),
     * then saves the file with the exact name required.
     */
    async saveToDirectory(blob, fileName = 'LockChime.wav') {
        if (!this.isSupported) {
            throw new Error('File System Access API is not supported in this browser');
        }

        try {
            // Show directory picker
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'desktop'
            });

            // Check if file already exists and warn user
            let existingFile = null;
            try {
                existingFile = await directoryHandle.getFileHandle(fileName);
            } catch (e) {
                // File doesn't exist, which is fine
            }

            // Create or overwrite the file
            const fileHandle = await directoryHandle.getFileHandle(fileName, {
                create: true
            });

            // Create a writable stream
            const writable = await fileHandle.createWritable();

            // Write the blob
            await writable.write(blob);

            // Close the stream
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
     * This won't save directly to USB but lets user download the file
     */
    downloadFile(blob, fileName = 'LockChime.wav') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return {
            success: true,
            fallback: true,
            message: `${fileName} downloaded. Please manually copy it to the root of your USB drive.`
        };
    }
}

// Export for use in other modules
window.FileSystemHandler = FileSystemHandler;
