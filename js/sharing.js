/**
 * Sharing Module - Handle audio sharing via URL and Web Share API
 *
 * Features:
 * - Encode audio to base64 URL for sharing
 * - Decode shared URLs to import audio
 * - Web Share API for native sharing
 * - Copy to clipboard functionality
 */

const SHARE_URL_PARAM = 'sound';
const SHARE_NAME_PARAM = 'name';
const MAX_SHARE_SIZE = 500 * 1024; // 500KB max for URL sharing

class SharingHandler {
    constructor() {
        this.isWebShareSupported = typeof navigator !== 'undefined' &&
                                   'share' in navigator;
        this.isClipboardSupported = typeof navigator !== 'undefined' &&
                                    'clipboard' in navigator;
    }

    /**
     * Check if Web Share API is available
     */
    canWebShare() {
        return this.isWebShareSupported;
    }

    /**
     * Check if Clipboard API is available
     */
    canCopyToClipboard() {
        return this.isClipboardSupported;
    }

    /**
     * Convert audio blob to base64 string
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert base64 string to audio blob
     */
    base64ToBlob(base64, mimeType = 'audio/wav') {
        try {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new Blob([bytes], { type: mimeType });
        } catch (error) {
            throw new Error('Invalid audio data in URL');
        }
    }

    /**
     * Compress base64 using LZ-string style compression
     * Simple RLE for repeated characters
     */
    compressBase64(base64) {
        // Use URL-safe base64 encoding
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    /**
     * Decompress base64
     */
    decompressBase64(compressed) {
        // Restore standard base64
        let base64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        return base64;
    }

    /**
     * Generate a shareable URL for the audio
     */
    async generateShareUrl(blob, soundName = 'Custom Sound') {
        if (blob.size > MAX_SHARE_SIZE) {
            throw new Error(`Audio file too large for URL sharing. Maximum size is ${MAX_SHARE_SIZE / 1024}KB.`);
        }

        const base64 = await this.blobToBase64(blob);
        const compressed = this.compressBase64(base64);
        const encodedName = encodeURIComponent(soundName);

        const baseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : 'https://example.com/';

        const shareUrl = `${baseUrl}?${SHARE_NAME_PARAM}=${encodedName}&${SHARE_URL_PARAM}=${compressed}`;

        return {
            url: shareUrl,
            size: shareUrl.length,
            isLarge: shareUrl.length > 2000 // URLs > 2000 chars may have issues
        };
    }

    /**
     * Check if current URL contains shared audio
     */
    hasSharedAudio() {
        if (typeof window === 'undefined') return false;
        const params = new URLSearchParams(window.location.search);
        return params.has(SHARE_URL_PARAM);
    }

    /**
     * Get shared audio name from URL
     */
    getSharedAudioName() {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const name = params.get(SHARE_NAME_PARAM);
        return name ? decodeURIComponent(name) : 'Shared Sound';
    }

    /**
     * Extract and decode shared audio from URL
     */
    getSharedAudio() {
        if (typeof window === 'undefined') return null;

        const params = new URLSearchParams(window.location.search);
        const compressed = params.get(SHARE_URL_PARAM);

        if (!compressed) return null;

        try {
            const base64 = this.decompressBase64(compressed);
            const blob = this.base64ToBlob(base64);
            const name = this.getSharedAudioName();

            return {
                blob,
                name,
                size: blob.size
            };
        } catch (error) {
            console.error('Failed to decode shared audio:', error);
            return null;
        }
    }

    /**
     * Clear shared audio from URL (clean up after import)
     */
    clearSharedAudioFromUrl() {
        if (typeof window === 'undefined') return;

        const url = new URL(window.location.href);
        url.searchParams.delete(SHARE_URL_PARAM);
        url.searchParams.delete(SHARE_NAME_PARAM);

        window.history.replaceState({}, '', url.toString());
    }

    /**
     * Share using Web Share API (native sharing)
     */
    async shareNative(blob, title = 'Tesla Lock Sound', text = 'Check out this custom Tesla lock sound!') {
        if (!this.isWebShareSupported) {
            throw new Error('Web Share API is not supported in this browser');
        }

        const file = new File([blob], 'LockChime.wav', { type: 'audio/wav' });

        // Check if files can be shared
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title,
                    text,
                    files: [file]
                });
                return { success: true, method: 'file' };
            } catch (error) {
                if (error.name === 'AbortError') {
                    return { success: false, cancelled: true };
                }
                // Fall through to URL sharing
            }
        }

        // Fallback to URL sharing
        try {
            const { url } = await this.generateShareUrl(blob, title);
            await navigator.share({
                title,
                text,
                url
            });
            return { success: true, method: 'url' };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, cancelled: true };
            }
            throw error;
        }
    }

    /**
     * Copy share URL to clipboard
     */
    async copyShareUrl(blob, soundName = 'Custom Sound') {
        const { url, isLarge } = await this.generateShareUrl(blob, soundName);

        if (this.isClipboardSupported) {
            await navigator.clipboard.writeText(url);
            return {
                success: true,
                url,
                warning: isLarge ? 'URL is very long and may not work in all browsers.' : null
            };
        }

        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            return {
                success: true,
                url,
                warning: isLarge ? 'URL is very long and may not work in all browsers.' : null
            };
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * Generate a QR code data URL for the share link
     * Returns null if URL is too long for QR code
     */
    async generateQRCode(blob, soundName = 'Custom Sound') {
        try {
            const { url, isLarge } = await this.generateShareUrl(blob, soundName);

            // QR codes have practical limits around 2-3KB of data
            if (url.length > 2500) {
                return {
                    success: false,
                    error: 'Audio file is too large for QR code sharing. Try trimming or compressing the audio.'
                };
            }

            // We'll use a simple QR code library or return the URL for external generation
            return {
                success: true,
                url,
                qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Browser global export
if (typeof window !== 'undefined') {
    window.SharingHandler = SharingHandler;
    window.SHARE_URL_PARAM = SHARE_URL_PARAM;
    window.MAX_SHARE_SIZE = MAX_SHARE_SIZE;
}
