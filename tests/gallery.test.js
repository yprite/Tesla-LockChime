import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    GalleryHandler,
    GALLERY_COLLECTION,
    MAX_UPLOAD_SIZE,
    SOUNDS_PER_PAGE,
    CATEGORIES
} from '../src/gallery.js';

describe('Gallery Constants', () => {
    it('should have correct collection name', () => {
        expect(GALLERY_COLLECTION).toBe('sounds');
    });

    it('should have 1MB max upload size', () => {
        expect(MAX_UPLOAD_SIZE).toBe(1024 * 1024);
    });

    it('should have 12 sounds per page', () => {
        expect(SOUNDS_PER_PAGE).toBe(12);
    });

    it('should have correct categories', () => {
        expect(CATEGORIES).toContain('classic');
        expect(CATEGORIES).toContain('modern');
        expect(CATEGORIES).toContain('futuristic');
        expect(CATEGORIES).toContain('custom');
        expect(CATEGORIES).toContain('funny');
        expect(CATEGORIES).toContain('musical');
        expect(CATEGORIES).toHaveLength(6);
    });
});

describe('GalleryHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new GalleryHandler();
        // Clear localStorage
        localStorage.clear();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(handler.db).toBeNull();
            expect(handler.storage).toBeNull();
            expect(handler.isInitialized).toBe(false);
            expect(handler.currentPage).toBe(0);
            expect(handler.lastDoc).toBeNull();
            expect(handler.sortBy).toBe('createdAt');
        });
    });

    describe('isAvailable()', () => {
        it('should return false when not initialized', () => {
            expect(handler.isAvailable()).toBe(false);
        });

        it('should return true after initialization', () => {
            handler.isInitialized = true;
            expect(handler.isAvailable()).toBe(true);
        });
    });

    describe('generateId()', () => {
        it('should generate unique IDs', () => {
            const id1 = handler.generateId();
            const id2 = handler.generateId();

            expect(id1).not.toBe(id2);
        });

        it('should start with "sound_" prefix', () => {
            const id = handler.generateId();
            expect(id.startsWith('sound_')).toBe(true);
        });

        it('should have reasonable length', () => {
            const id = handler.generateId();
            expect(id.length).toBeGreaterThan(10);
            expect(id.length).toBeLessThan(50);
        });
    });

    describe('getAnonymousId()', () => {
        it('should generate ID starting with "anon_"', () => {
            const id = handler.getAnonymousId();
            expect(id.startsWith('anon_')).toBe(true);
        });

        it('should persist ID in localStorage', () => {
            const id1 = handler.getAnonymousId();
            const id2 = handler.getAnonymousId();

            expect(id1).toBe(id2);
        });

        it('should return same ID across instances', () => {
            const id1 = handler.getAnonymousId();
            const handler2 = new GalleryHandler();
            const id2 = handler2.getAnonymousId();

            expect(id1).toBe(id2);
        });
    });

    describe('Liked Sounds Management', () => {
        describe('getLikedSounds()', () => {
            it('should return empty array initially', () => {
                const liked = handler.getLikedSounds();
                expect(liked).toEqual([]);
            });
        });

        describe('addLikedSound()', () => {
            it('should add sound to liked list', () => {
                handler.addLikedSound('sound_123');
                const liked = handler.getLikedSounds();

                expect(liked).toContain('sound_123');
            });

            it('should not add duplicates', () => {
                handler.addLikedSound('sound_123');
                handler.addLikedSound('sound_123');
                const liked = handler.getLikedSounds();

                expect(liked.filter(id => id === 'sound_123')).toHaveLength(1);
            });

            it('should allow multiple different sounds', () => {
                handler.addLikedSound('sound_123');
                handler.addLikedSound('sound_456');
                const liked = handler.getLikedSounds();

                expect(liked).toContain('sound_123');
                expect(liked).toContain('sound_456');
                expect(liked).toHaveLength(2);
            });
        });

        describe('removeLikedSound()', () => {
            it('should remove sound from liked list', () => {
                handler.addLikedSound('sound_123');
                handler.addLikedSound('sound_456');
                handler.removeLikedSound('sound_123');
                const liked = handler.getLikedSounds();

                expect(liked).not.toContain('sound_123');
                expect(liked).toContain('sound_456');
            });

            it('should handle removing non-existent sound', () => {
                handler.addLikedSound('sound_123');
                handler.removeLikedSound('sound_nonexistent');
                const liked = handler.getLikedSounds();

                expect(liked).toContain('sound_123');
            });
        });

        describe('isLiked()', () => {
            it('should return true for liked sound', () => {
                handler.addLikedSound('sound_123');
                expect(handler.isLiked('sound_123')).toBe(true);
            });

            it('should return false for non-liked sound', () => {
                expect(handler.isLiked('sound_123')).toBe(false);
            });

            it('should return false after removing like', () => {
                handler.addLikedSound('sound_123');
                handler.removeLikedSound('sound_123');
                expect(handler.isLiked('sound_123')).toBe(false);
            });
        });
    });

    describe('validateMetadata()', () => {
        it('should pass valid metadata', () => {
            const result = handler.validateMetadata({
                name: 'My Sound',
                description: 'A cool sound',
                category: 'custom'
            });

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require name', () => {
            const result = handler.validateMetadata({
                description: 'A cool sound'
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Sound name is required');
        });

        it('should reject empty name', () => {
            const result = handler.validateMetadata({
                name: '   ',
                description: 'A cool sound'
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Sound name is required');
        });

        it('should reject name over 50 characters', () => {
            const result = handler.validateMetadata({
                name: 'A'.repeat(51)
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Sound name must be 50 characters or less');
        });

        it('should reject description over 200 characters', () => {
            const result = handler.validateMetadata({
                name: 'Valid Name',
                description: 'A'.repeat(201)
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Description must be 200 characters or less');
        });

        it('should reject invalid category', () => {
            const result = handler.validateMetadata({
                name: 'Valid Name',
                category: 'invalid_category'
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid category');
        });

        it('should accept all valid categories', () => {
            CATEGORIES.forEach(category => {
                const result = handler.validateMetadata({
                    name: 'Valid Name',
                    category: category
                });
                expect(result.valid).toBe(true);
            });
        });

        it('should collect multiple errors', () => {
            const result = handler.validateMetadata({
                name: '',
                description: 'A'.repeat(201),
                category: 'invalid'
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
});

describe('GalleryHandler - Initialization', () => {
    let handler;

    beforeEach(() => {
        handler = new GalleryHandler();
    });

    afterEach(() => {
        // Clean up global firebase mock
        if (global.firebase) {
            delete global.firebase;
        }
    });

    describe('init()', () => {
        it('should return false when Firebase is not loaded', async () => {
            const result = await handler.init({});

            expect(result).toBe(false);
            expect(handler.isInitialized).toBe(false);
        });

        it('should return true if already initialized', async () => {
            handler.isInitialized = true;

            const result = await handler.init({});

            expect(result).toBe(true);
        });
    });
});

describe('GalleryHandler - Operations Without Init', () => {
    let handler;

    beforeEach(() => {
        handler = new GalleryHandler();
    });

    describe('uploadSound()', () => {
        it('should throw when not initialized', async () => {
            const blob = new Blob(['test'], { type: 'audio/wav' });

            await expect(handler.uploadSound(blob, { name: 'Test' }))
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('getSounds()', () => {
        it('should throw when not initialized', async () => {
            await expect(handler.getSounds())
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('getSound()', () => {
        it('should throw when not initialized', async () => {
            await expect(handler.getSound('sound_123'))
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('downloadSound()', () => {
        it('should throw when not initialized', async () => {
            await expect(handler.downloadSound('sound_123'))
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('likeSound()', () => {
        it('should throw when not initialized', async () => {
            await expect(handler.likeSound('sound_123'))
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('searchSounds()', () => {
        it('should throw when not initialized', async () => {
            await expect(handler.searchSounds('query'))
                .rejects.toThrow('Gallery not initialized');
        });
    });

    describe('getStats()', () => {
        it('should return zero stats when not initialized', async () => {
            const stats = await handler.getStats();

            expect(stats.totalSounds).toBe(0);
            expect(stats.totalDownloads).toBe(0);
        });
    });
});

describe('GalleryHandler - Upload Validation', () => {
    let handler;

    beforeEach(() => {
        handler = new GalleryHandler();
        handler.isInitialized = true;
        handler.storage = {
            ref: vi.fn()
        };
        handler.db = {
            collection: vi.fn()
        };
    });

    describe('File size validation', () => {
        it('should reject files over 1MB', async () => {
            // Create a blob larger than 1MB
            const largeBlob = new Blob([new ArrayBuffer(MAX_UPLOAD_SIZE + 1)], {
                type: 'audio/wav'
            });

            await expect(handler.uploadSound(largeBlob, { name: 'Test' }))
                .rejects.toThrow('File too large');
        });

        it('should accept files at exactly 1MB', async () => {
            const exactBlob = new Blob([new ArrayBuffer(MAX_UPLOAD_SIZE)], {
                type: 'audio/wav'
            });

            // Mock Firebase methods
            const mockUploadTask = {
                ref: {
                    getDownloadURL: vi.fn().mockResolvedValue('https://example.com/sound.wav')
                }
            };
            const mockStorageRef = {
                put: vi.fn().mockResolvedValue(mockUploadTask)
            };
            handler.storage.ref = vi.fn().mockReturnValue(mockStorageRef);

            const mockDocRef = {
                set: vi.fn().mockResolvedValue()
            };
            const mockCollection = {
                doc: vi.fn().mockReturnValue(mockDocRef)
            };
            handler.db.collection = vi.fn().mockReturnValue(mockCollection);

            // Mock firebase.firestore.FieldValue
            global.firebase = {
                firestore: {
                    FieldValue: {
                        serverTimestamp: vi.fn().mockReturnValue('timestamp')
                    }
                }
            };

            const result = await handler.uploadSound(exactBlob, { name: 'Test' });

            expect(result.success).toBe(true);
        });
    });
});

describe('GalleryHandler - Mocked Firebase Operations', () => {
    let handler;
    let mockDb;
    let mockStorage;

    beforeEach(() => {
        handler = new GalleryHandler();

        // Mock Firestore
        mockDb = {
            collection: vi.fn()
        };

        // Mock Storage
        mockStorage = {
            ref: vi.fn()
        };

        handler.db = mockDb;
        handler.storage = mockStorage;
        handler.isInitialized = true;

        // Mock firebase global
        global.firebase = {
            firestore: {
                FieldValue: {
                    serverTimestamp: vi.fn().mockReturnValue('mock_timestamp'),
                    increment: vi.fn((n) => `increment_${n}`)
                }
            }
        };
    });

    afterEach(() => {
        delete global.firebase;
    });

    describe('getSounds()', () => {
        it('should return sounds with pagination info', async () => {
            const mockDocs = [
                { id: 'sound_1', data: () => ({ name: 'Sound 1' }) },
                { id: 'sound_2', data: () => ({ name: 'Sound 2' }) }
            ];

            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                startAfter: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            mockDb.collection.mockReturnValue(mockQuery);

            const result = await handler.getSounds();

            expect(result.sounds).toHaveLength(2);
            expect(result.hasMore).toBe(false); // 2 < 12
            expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
            expect(mockQuery.limit).toHaveBeenCalledWith(SOUNDS_PER_PAGE);
        });

        it('should filter by category', async () => {
            const mockDocs = [];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            mockDb.collection.mockReturnValue(mockQuery);

            await handler.getSounds({ category: 'funny' });

            expect(mockQuery.where).toHaveBeenCalledWith('category', '==', 'funny');
        });

        it('should handle "all" category without filter', async () => {
            const mockDocs = [];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            mockDb.collection.mockReturnValue(mockQuery);

            await handler.getSounds({ category: 'all' });

            expect(mockQuery.where).not.toHaveBeenCalled();
        });
    });

    describe('getSound()', () => {
        it('should return sound data', async () => {
            const mockDoc = {
                exists: true,
                id: 'sound_123',
                data: () => ({ name: 'Test Sound', likes: 5 })
            };

            const mockDocRef = {
                get: vi.fn().mockResolvedValue(mockDoc)
            };

            mockDb.collection.mockReturnValue({
                doc: vi.fn().mockReturnValue(mockDocRef)
            });

            const result = await handler.getSound('sound_123');

            expect(result.id).toBe('sound_123');
            expect(result.name).toBe('Test Sound');
            expect(result.likes).toBe(5);
        });

        it('should throw when sound not found', async () => {
            const mockDoc = {
                exists: false
            };

            const mockDocRef = {
                get: vi.fn().mockResolvedValue(mockDoc)
            };

            mockDb.collection.mockReturnValue({
                doc: vi.fn().mockReturnValue(mockDocRef)
            });

            await expect(handler.getSound('nonexistent'))
                .rejects.toThrow('Sound not found');
        });
    });

    describe('likeSound()', () => {
        it('should increment likes for new like', async () => {
            const mockUpdate = vi.fn().mockResolvedValue();
            const mockDocRef = {
                update: mockUpdate
            };

            mockDb.collection.mockReturnValue({
                doc: vi.fn().mockReturnValue(mockDocRef)
            });

            const result = await handler.likeSound('sound_123');

            expect(result.liked).toBe(true);
            expect(mockUpdate).toHaveBeenCalled();
            expect(handler.isLiked('sound_123')).toBe(true);
        });

        it('should decrement likes for unlike', async () => {
            // First, like the sound
            handler.addLikedSound('sound_123');

            const mockUpdate = vi.fn().mockResolvedValue();
            const mockDocRef = {
                update: mockUpdate
            };

            mockDb.collection.mockReturnValue({
                doc: vi.fn().mockReturnValue(mockDocRef)
            });

            const result = await handler.likeSound('sound_123');

            expect(result.liked).toBe(false);
            expect(mockUpdate).toHaveBeenCalled();
            expect(handler.isLiked('sound_123')).toBe(false);
        });
    });

    describe('getStats()', () => {
        it('should calculate total sounds and downloads', async () => {
            const mockDocs = [
                { data: () => ({ downloads: 10 }) },
                { data: () => ({ downloads: 20 }) },
                { data: () => ({ downloads: 5 }) }
            ];

            const mockSnapshot = {
                size: 3,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            mockDb.collection.mockReturnValue({
                get: vi.fn().mockResolvedValue(mockSnapshot)
            });

            const stats = await handler.getStats();

            expect(stats.totalSounds).toBe(3);
            expect(stats.totalDownloads).toBe(35);
        });

        it('should handle sounds without downloads', async () => {
            const mockDocs = [
                { data: () => ({ downloads: 10 }) },
                { data: () => ({}) }, // No downloads property
                { data: () => ({ downloads: 5 }) }
            ];

            const mockSnapshot = {
                size: 3,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            mockDb.collection.mockReturnValue({
                get: vi.fn().mockResolvedValue(mockSnapshot)
            });

            const stats = await handler.getStats();

            expect(stats.totalSounds).toBe(3);
            expect(stats.totalDownloads).toBe(15);
        });

        it('should return zeros on error', async () => {
            mockDb.collection.mockReturnValue({
                get: vi.fn().mockRejectedValue(new Error('Network error'))
            });

            const stats = await handler.getStats();

            expect(stats.totalSounds).toBe(0);
            expect(stats.totalDownloads).toBe(0);
        });
    });
});

describe('GalleryHandler - Helper Methods', () => {
    let handler;

    beforeEach(() => {
        handler = new GalleryHandler();
        handler.isInitialized = true;

        handler.db = {
            collection: vi.fn()
        };

        global.firebase = {
            firestore: {
                FieldValue: {
                    increment: vi.fn()
                }
            }
        };
    });

    afterEach(() => {
        delete global.firebase;
    });

    describe('getPopularSounds()', () => {
        it('should call getSounds with likes sort', async () => {
            const mockDocs = [];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            handler.db.collection.mockReturnValue(mockQuery);

            await handler.getPopularSounds();

            expect(mockQuery.orderBy).toHaveBeenCalledWith('likes', 'desc');
        });
    });

    describe('getRecentSounds()', () => {
        it('should call getSounds with createdAt sort', async () => {
            const mockDocs = [];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            handler.db.collection.mockReturnValue(mockQuery);

            await handler.getRecentSounds();

            expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });
    });

    describe('getMostDownloaded()', () => {
        it('should call getSounds with downloads sort', async () => {
            const mockDocs = [];
            const mockSnapshot = {
                docs: mockDocs,
                forEach: (cb) => mockDocs.forEach(cb)
            };

            const mockQuery = {
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockSnapshot)
            };

            handler.db.collection.mockReturnValue(mockQuery);

            await handler.getMostDownloaded();

            expect(mockQuery.orderBy).toHaveBeenCalledWith('downloads', 'desc');
        });
    });
});
