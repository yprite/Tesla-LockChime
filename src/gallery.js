/**
 * Community Gallery Module - Firebase-based sound sharing
 *
 * Features:
 * - Upload sounds to community gallery
 * - Browse and search community sounds
 * - Download sounds from gallery
 * - Like/favorite sounds
 */

// Gallery constants
export const GALLERY_COLLECTION = 'sounds';
export const MAX_UPLOAD_SIZE = 1024 * 1024; // 1MB (Tesla limit)
export const SOUNDS_PER_PAGE = 12;
export const CATEGORIES = ['classic', 'modern', 'futuristic', 'custom', 'funny', 'musical'];

export class GalleryHandler {
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
    async init(firebaseConfig) {
        if (this.isInitialized) return true;

        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded. Gallery features disabled.');
            return false;
        }

        try {
            // Initialize Firebase app if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
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

            // Fetch the audio file
            const response = await fetch(sound.downloadUrl);
            const blob = await response.blob();

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
        if (typeof localStorage === 'undefined') return 'anon_test';

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
        if (typeof localStorage === 'undefined') return [];

        const liked = localStorage.getItem('gallery_liked_sounds');
        return liked ? JSON.parse(liked) : [];
    }

    /**
     * Add to liked sounds
     */
    addLikedSound(soundId) {
        if (typeof localStorage === 'undefined') return;

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
        if (typeof localStorage === 'undefined') return;

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

        if (metadata.category && !CATEGORIES.includes(metadata.category)) {
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
            const snapshot = await this.db.collection(GALLERY_COLLECTION).get();
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
}

// Browser global export
if (typeof window !== 'undefined') {
    window.GalleryHandler = GalleryHandler;
    window.GALLERY_CONFIG = {
        SOUNDS_PER_PAGE,
        MAX_UPLOAD_SIZE,
        CATEGORIES
    };
}
