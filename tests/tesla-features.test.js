import { describe, it, expect, beforeEach } from 'vitest';
import {
    evaluateCompatibility,
    detectReleaseUpdate,
    deriveRecommendationsFromRelease,
    getChallengeProgress,
    WorkspaceStore
} from '../src/tesla-features.js';

describe('evaluateCompatibility', () => {
    it('marks compatible vehicle ready when external speaker signal is present', () => {
        const result = evaluateCompatibility({
            vehicleConfig: { car_type: 'MODEL3' },
            optionCodes: 'P3WS,XX',
            state: 'online'
        });

        expect(result.ready).toBe(true);
        expect(result.canUseBoombox).toBe(true);
    });

    it('adds reasons when vehicle is offline and speaker cannot be confirmed', () => {
        const result = evaluateCompatibility({
            vehicleConfig: { car_type: 'MODEL3' },
            optionCodes: '',
            state: 'asleep'
        });

        expect(result.ready).toBe(false);
        expect(result.reasons.length).toBeGreaterThan(0);
    });
});

describe('detectReleaseUpdate', () => {
    const mockStorage = {
        data: {},
        getItem(key) {
            return this.data[key] || null;
        },
        setItem(key, value) {
            this.data[key] = value;
        }
    };

    beforeEach(() => {
        mockStorage.data = {};
    });

    it('does not mark first seen version as updated', () => {
        const result = detectReleaseUpdate(mockStorage, 'VIN123', '2025.2.1');
        expect(result.updated).toBe(false);
    });

    it('marks update when version changes', () => {
        detectReleaseUpdate(mockStorage, 'VIN123', '2025.2.1');
        const result = detectReleaseUpdate(mockStorage, 'VIN123', '2025.8.2');

        expect(result.updated).toBe(true);
        expect(result.previous).toBe('2025.2.1');
    });
});

describe('deriveRecommendationsFromRelease', () => {
    it('returns keyword-based recommendations', () => {
        const result = deriveRecommendationsFromRelease('Holiday audio improvements for Boombox');
        const categories = result.map(x => x.category);

        expect(categories).toContain('funny');
        expect(categories).toContain('musical');
    });

    it('falls back to weekly top category when no keyword match', () => {
        const result = deriveRecommendationsFromRelease('Minor bug fixes', [{ category: 'modern' }]);
        expect(result[0].category).toBe('modern');
    });
});

describe('getChallengeProgress', () => {
    it('calculates percentages and incomplete status', () => {
        const progress = getChallengeProgress({ saves: 1, uploads: 0, shares: 0 });

        expect(progress.saveProgress).toBe(50);
        expect(progress.completed).toBe(false);
    });

    it('marks complete when all thresholds met', () => {
        const progress = getChallengeProgress({ saves: 3, uploads: 1, shares: 2 });

        expect(progress.completed).toBe(true);
        expect(progress.saveProgress).toBe(100);
    });
});

describe('WorkspaceStore', () => {
    let storage;
    let store;

    beforeEach(() => {
        storage = {
            data: {},
            getItem(key) {
                return this.data[key] || null;
            },
            setItem(key, value) {
                this.data[key] = value;
            }
        };
        store = new WorkspaceStore(storage);
    });

    it('saves new draft and keeps first version', () => {
        store.saveDraftVersion({ name: 'Morning chime', trimStart: 0, trimEnd: 3, volume: 90 });

        const drafts = store.listDrafts();
        expect(drafts).toHaveLength(1);
        expect(drafts[0].versions).toHaveLength(1);
    });

    it('adds a new version when draft name already exists', () => {
        store.saveDraftVersion({ name: 'Morning chime', trimStart: 0, trimEnd: 3, volume: 90 });
        store.saveDraftVersion({ name: 'Morning chime', trimStart: 1, trimEnd: 4, volume: 70 });

        const drafts = store.listDrafts();
        expect(drafts[0].versions).toHaveLength(2);
    });

    it('deletes draft by id', () => {
        store.saveDraftVersion({ name: 'Morning chime', trimStart: 0, trimEnd: 3, volume: 90 });
        const drafts = store.listDrafts();

        store.deleteDraft(drafts[0].id);
        expect(store.listDrafts()).toHaveLength(0);
    });
});
