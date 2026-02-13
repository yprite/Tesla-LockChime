/**
 * Community Gallery Module - Firebase-based sound sharing
 *
 * Features:
 * - Upload sounds to community gallery
 * - Browse and search community sounds
 * - Download sounds from gallery
 * - Like/favorite sounds
 */

// Firebase configuration - Replace with your Firebase project config
const FIREBASE_CONFIG = {                                                                                         
      apiKey: "AIzaSyAsrRsJVRCF-2nDCGNucE9FT_25OenDSrQ",                                                            
      authDomain: "tesla-lock-sounds.firebaseapp.com",                                                              
      projectId: "tesla-lock-sounds",                                                                               
      storageBucket: "tesla-lock-sounds.firebasestorage.app",                                                       
      messagingSenderId: "1067424699027",                                                                           
      appId: "1:1067424699027:web:3c7105f523f26c3005f366"                                                           
  }; 

// Gallery constants
const GALLERY_COLLECTION = 'sounds';
const MAX_UPLOAD_SIZE = 1024 * 1024; // 1MB (Tesla limit)
const SOUNDS_PER_PAGE = 12;

class GalleryHandler {
    constructor() {
        this.db = null;
        this.storage = null;
        this.isInitialized = false;
        this.currentPage = 0;
        this.lastDoc = null;
        this.sortBy = 'createdAt'; // 'createdAt', 'likes', 'downloads'
    }

    /**
     * Initialize Firebase
     */
    async init() {
        if (this.isInitialized) return true;

        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded. Gallery features disabled.');
            return false;
        }

        try {
            // Initialize Firebase app if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            this.db = firebase.firestore();
            this.storage = firebase.storage();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    /**
     * Check if gallery is available
     */
    isAvailable() {
        return this.isInitialized;
    }

    /**
     * Upload a sound to the gallery
     */
    async uploadSound(wavBlob, metadata) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        if (wavBlob.size > MAX_UPLOAD_SIZE) {
            throw new Error(`File too large. Maximum size is ${MAX_UPLOAD_SIZE / 1024}KB`);
        }

        const soundId = this.generateId();
        const fileName = `${soundId}.wav`;

        try {
            // Upload to Firebase Storage
            const storageRef = this.storage.ref(`sounds/${fileName}`);
            const uploadTask = await storageRef.put(wavBlob, {
                contentType: 'audio/wav',
                customMetadata: {
                    originalName: metadata.name || 'Untitled'
                }
            });

            const downloadUrl = await uploadTask.ref.getDownloadURL();

            // Create Firestore document
            const soundDoc = {
                id: soundId,
                name: metadata.name || 'Untitled',
                description: metadata.description || '',
                category: metadata.category || 'custom',
                duration: metadata.duration || 0,
                vehicleModel: metadata.vehicleModel || '',
                ownerNickname: metadata.ownerNickname || '',
                signaturePackId: metadata.signaturePackId || '',
                creatorAuthUid: metadata.creatorAuthUid || '',
                creatorAuthProvider: metadata.creatorAuthProvider || '',
                fileSize: wavBlob.size,
                downloadUrl: downloadUrl,
                fileName: fileName,
                likes: 0,
                downloads: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                creatorId: this.getAnonymousId()
            };

            await this.db.collection(GALLERY_COLLECTION).doc(soundId).set(soundDoc);

            return {
                success: true,
                soundId: soundId,
                downloadUrl: downloadUrl
            };
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Failed to upload sound: ' + error.message);
        }
    }

    /**
     * Get sounds from gallery
     */
    async getSounds(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        const {
            sortBy = 'createdAt',
            sortOrder = 'desc',
            category = null,
            limit = SOUNDS_PER_PAGE,
            startAfter = null
        } = options;

        try {
            let query = this.db.collection(GALLERY_COLLECTION)
                .orderBy(sortBy, sortOrder)
                .limit(limit);

            if (category && category !== 'all') {
                query = query.where('category', '==', category);
            }

            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            const snapshot = await query.get();

            const sounds = [];
            snapshot.forEach(doc => {
                sounds.push({ id: doc.id, ...doc.data() });
            });

            this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

            return {
                sounds: sounds,
                hasMore: sounds.length === limit,
                lastDoc: this.lastDoc
            };
        } catch (error) {
            console.error('Failed to fetch sounds:', error);
            throw new Error('Failed to load gallery');
        }
    }

    /**
     * Get a single sound by ID
     */
    async getSound(soundId) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        try {
            const doc = await this.db.collection(GALLERY_COLLECTION).doc(soundId).get();

            if (!doc.exists) {
                throw new Error('Sound not found');
            }

            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Failed to get sound:', error);
            throw error;
        }
    }

    isLegacyStorageUrl(url) {
        return /^https?:\/\/storage\.googleapis\.com\//i.test(String(url || ''));
    }

    extractStoragePathFromLegacyUrl(url) {
        try {
            const parsed = new URL(url);
            if (!/^storage\.googleapis\.com$/i.test(parsed.hostname)) return null;
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length < 2) return null;
            return parts.slice(1).join('/');
        } catch (error) {
            return null;
        }
    }

    async resolveDownloadUrl(sound) {
        const currentUrl = String(sound?.downloadUrl || '').trim();
        if (currentUrl && !this.isLegacyStorageUrl(currentUrl)) {
            return currentUrl;
        }

        let ref = null;
        if (sound?.fileName) {
            ref = this.storage.ref(`sounds/${sound.fileName}`);
        } else if (currentUrl) {
            try {
                ref = this.storage.refFromURL(currentUrl);
            } catch (error) {
                const path = this.extractStoragePathFromLegacyUrl(currentUrl);
                if (path) {
                    ref = this.storage.ref(path);
                }
            }
        }

        if (!ref) return currentUrl;

        try {
            return await ref.getDownloadURL();
        } catch (error) {
            return currentUrl;
        }
    }

    async fetchBlobWithFallback(downloadUrl) {
        let response = null;
        try {
            response = await fetch(downloadUrl, { mode: 'cors' });
        } catch (error) {
        }
        if (!response || !response.ok) {
            const proxyUrl = this.getMediaProxyUrl(downloadUrl);
            if (proxyUrl) {
                response = await fetch(proxyUrl, { mode: 'cors' });
            }
        }
        if (!response || !response.ok) {
            throw new Error(`Download request failed: ${response ? response.status : 'network'}`);
        }
        return response.blob();
    }

    async getSoundBlobForPreview(sound) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        const resolvedDownloadUrl = await this.resolveDownloadUrl(sound);
        return this.fetchBlobWithFallback(resolvedDownloadUrl);
    }

    getMediaProxyUrl(originalUrl) {
        const configured = (typeof window !== 'undefined' && typeof window.CHAT_WS_ENDPOINT === 'string')
            ? String(window.CHAT_WS_ENDPOINT).trim()
            : '';
        if (!configured || !originalUrl) return null;

        let base = configured
            .replace(/^wss:\/\//i, 'https://')
            .replace(/^ws:\/\//i, 'http://');

        base = base.replace(/\/chat\/.*$/i, '');
        if (!/^https?:\/\//i.test(base)) return null;
        return `${base}/proxy-media?url=${encodeURIComponent(originalUrl)}`;
    }

    /**
     * Download a sound (increment counter and return blob)
     */
    async downloadSound(soundId) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        try {
            const sound = await this.getSound(soundId);

            // Increment download counter
            await this.db.collection(GALLERY_COLLECTION).doc(soundId).update({
                downloads: firebase.firestore.FieldValue.increment(1)
            });

            // Resolve legacy URLs to Firebase SDK URLs (avoids CORS issues on storage.googleapis.com)
            const resolvedDownloadUrl = await this.resolveDownloadUrl(sound);

            // Persist upgraded URL for old records when possible
            if (resolvedDownloadUrl && resolvedDownloadUrl !== sound.downloadUrl) {
                this.db.collection(GALLERY_COLLECTION).doc(soundId).update({
                    downloadUrl: resolvedDownloadUrl
                }).catch(() => {});
            }

            const blob = await this.fetchBlobWithFallback(resolvedDownloadUrl);

            return {
                blob: blob,
                sound: sound
            };
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error('Failed to download sound');
        }
    }

    /**
     * Like a sound
     */
    async likeSound(soundId) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        const likedSounds = this.getLikedSounds();

        if (likedSounds.includes(soundId)) {
            // Unlike
            await this.db.collection(GALLERY_COLLECTION).doc(soundId).update({
                likes: firebase.firestore.FieldValue.increment(-1)
            });
            this.removeLikedSound(soundId);
            return { liked: false };
        } else {
            // Like
            await this.db.collection(GALLERY_COLLECTION).doc(soundId).update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            this.addLikedSound(soundId);
            return { liked: true };
        }
    }

    /**
     * Search sounds by name
     */
    async searchSounds(query, limit = SOUNDS_PER_PAGE) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        // Simple client-side search (for small collections)
        // For production, use Algolia or Firebase Extensions
        const { sounds } = await this.getSounds({ limit: 100 });

        const lowerQuery = query.toLowerCase();
        const filtered = sounds.filter(sound =>
            sound.name.toLowerCase().includes(lowerQuery) ||
            (sound.description && sound.description.toLowerCase().includes(lowerQuery))
        );

        return {
            sounds: filtered.slice(0, limit),
            total: filtered.length
        };
    }

    /**
     * Get popular sounds
     */
    async getPopularSounds(limit = SOUNDS_PER_PAGE) {
        return this.getSounds({ sortBy: 'likes', limit });
    }

    /**
     * Get recent sounds
     */
    async getRecentSounds(limit = SOUNDS_PER_PAGE) {
        return this.getSounds({ sortBy: 'createdAt', limit });
    }

    /**
     * Get most downloaded sounds
     */
    async getMostDownloaded(limit = SOUNDS_PER_PAGE) {
        return this.getSounds({ sortBy: 'downloads', limit });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'sound_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get anonymous user ID (stored in localStorage)
     */
    getAnonymousId() {
        let id = localStorage.getItem('gallery_user_id');
        if (!id) {
            id = 'anon_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gallery_user_id', id);
        }
        return id;
    }

    /**
     * Get liked sounds from localStorage
     */
    getLikedSounds() {
        const liked = localStorage.getItem('gallery_liked_sounds');
        return liked ? JSON.parse(liked) : [];
    }

    /**
     * Add to liked sounds
     */
    addLikedSound(soundId) {
        const liked = this.getLikedSounds();
        if (!liked.includes(soundId)) {
            liked.push(soundId);
            localStorage.setItem('gallery_liked_sounds', JSON.stringify(liked));
        }
    }

    /**
     * Remove from liked sounds
     */
    removeLikedSound(soundId) {
        const liked = this.getLikedSounds().filter(id => id !== soundId);
        localStorage.setItem('gallery_liked_sounds', JSON.stringify(liked));
    }

    /**
     * Check if sound is liked
     */
    isLiked(soundId) {
        return this.getLikedSounds().includes(soundId);
    }

    /**
     * Validate upload metadata
     */
    validateMetadata(metadata) {
        const errors = [];

        if (!metadata.name || metadata.name.trim().length === 0) {
            errors.push('Sound name is required');
        }

        if (metadata.name && metadata.name.length > 50) {
            errors.push('Sound name must be 50 characters or less');
        }

        if (metadata.description && metadata.description.length > 200) {
            errors.push('Description must be 200 characters or less');
        }

        const validCategories = ['classic', 'modern', 'futuristic', 'custom', 'funny', 'musical'];
        if (metadata.category && !validCategories.includes(metadata.category)) {
            errors.push('Invalid category');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get gallery statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            return { totalSounds: 0, totalDownloads: 0 };
        }

        try {
            const statsDoc = await this.db.collection('meta').doc('gallery_stats').get();
            if (statsDoc.exists) {
                const data = statsDoc.data();
                return {
                    totalSounds: data.totalSounds || 0,
                    totalDownloads: data.totalDownloads || 0
                };
            }

            const snapshot = await this.db.collection(GALLERY_COLLECTION)
                .orderBy('downloads', 'desc')
                .limit(200)
                .get();

            let totalDownloads = 0;
            snapshot.forEach(doc => {
                totalDownloads += doc.data().downloads || 0;
            });

            return {
                totalSounds: snapshot.size,
                totalDownloads: totalDownloads
            };
        } catch (error) {
            return { totalSounds: 0, totalDownloads: 0 };
        }
    }

    /**
     * Get sounds uploaded by current user
     */
    async getMySounds() {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        const myId = this.getAnonymousId();

        try {
            const snapshot = await this.db.collection(GALLERY_COLLECTION)
                .where('creatorId', '==', myId)
                .orderBy('createdAt', 'desc')
                .get();

            const sounds = [];
            let totalLikes = 0;
            let totalDownloads = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                sounds.push({ id: doc.id, ...data });
                totalLikes += data.likes || 0;
                totalDownloads += data.downloads || 0;
            });

            return {
                sounds,
                stats: {
                    totalUploads: sounds.length,
                    totalLikes,
                    totalDownloads
                }
            };
        } catch (error) {
            console.error('Failed to get my sounds:', error);
            throw new Error('Failed to load your sounds');
        }
    }

    /**
     * Get weekly popular sounds (last 7 days)
     */
    async getWeeklyPopular(limit = 5, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Gallery not initialized');
        }

        try {
            const modelFilter = options?.model || null;
            // Use single-field indexed query only, then filter/sort in memory.
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const fetchLimit = modelFilter ? 200 : 50;
            const snapshot = await this.db.collection(GALLERY_COLLECTION)
                .where('createdAt', '>=', weekAgo)
                .orderBy('createdAt', 'desc')
                .limit(fetchLimit)
                .get();

            let sounds = [];
            snapshot.forEach(doc => {
                sounds.push({ id: doc.id, ...doc.data() });
            });

            if (modelFilter) {
                sounds = sounds.filter(sound => sound.vehicleModel === modelFilter);
            }

            // Sort by combined score (likes + downloads)
            sounds.sort((a, b) => {
                const scoreA = (a.likes || 0) * 2 + (a.downloads || 0);
                const scoreB = (b.likes || 0) * 2 + (b.downloads || 0);
                return scoreB - scoreA;
            });

            return {
                sounds: sounds.slice(0, limit),
                period: 'weekly',
                model: modelFilter || null
            };
        } catch (error) {
            // Fallback to all-time popular if weekly query fails.
            if (options?.model) {
                const allTime = await this.getPopularSounds(50);
                return {
                    sounds: (allTime?.sounds || []).filter(sound => sound.vehicleModel === options.model).slice(0, limit),
                    period: 'all-time',
                    model: options.model
                };
            }
            return this.getPopularSounds(limit);
        }
    }

    /**
     * Generate shareable URL for a sound
     */
    generateShareUrl(soundId) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?sound=${soundId}`;
    }

    /**
     * Generate QR code data URL
     */
    async generateQRCode(soundId, size = 200) {
        const shareUrl = this.generateShareUrl(soundId);

        // Use QR code API (no external library needed)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shareUrl)}`;

        return {
            url: shareUrl,
            qrCodeUrl: qrApiUrl
        };
    }

    /**
     * Share sound to social media
     */
    shareToSocial(sound, platform) {
        const shareUrl = this.generateShareUrl(sound.id);
        const text = `🔔 Check out this Tesla lock sound: "${sound.name}" - Create your own custom lock chime!`;

        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
            return true;
        }

        return false;
    }

    /**
     * Copy share link to clipboard
     */
    async copyShareLink(soundId) {
        const shareUrl = this.generateShareUrl(soundId);

        try {
            await navigator.clipboard.writeText(shareUrl);
            return { success: true, url: shareUrl };
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return { success: true, url: shareUrl };
        }
    }

    /**
     * Use native share API if available
     */
    async nativeShare(sound) {
        const shareUrl = this.generateShareUrl(sound.id);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Tesla Lock Sound: ${sound.name}`,
                    text: `Check out this custom Tesla lock chime!`,
                    url: shareUrl
                });
                return { success: true, method: 'native' };
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Native share failed:', error);
                }
                return { success: false, error };
            }
        }

        return { success: false, error: 'Native share not supported' };
    }

    /**
     * Check for shared sound in URL
     */
    getSharedSoundId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('sound');
    }

    /**
     * Get uploaded sounds IDs from localStorage
     */
    getMyUploadedSoundIds() {
        const uploaded = localStorage.getItem('gallery_my_uploads');
        return uploaded ? JSON.parse(uploaded) : [];
    }

    /**
     * Add to my uploaded sounds
     */
    addToMyUploads(soundId) {
        const uploaded = this.getMyUploadedSoundIds();
        if (!uploaded.includes(soundId)) {
            uploaded.push(soundId);
            localStorage.setItem('gallery_my_uploads', JSON.stringify(uploaded));
        }
    }
}

// Browser global export
if (typeof window !== 'undefined') {
    window.GalleryHandler = GalleryHandler;
    window.GALLERY_CONFIG = {
        SOUNDS_PER_PAGE,
        MAX_UPLOAD_SIZE,
        CATEGORIES: ['classic', 'modern', 'futuristic', 'custom', 'funny', 'musical']
    };
}
