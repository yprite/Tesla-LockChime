/**
 * WorkspaceStore - Manages draft sound versions in localStorage
 *
 * Each draft has a name, an id, and an array of versions.
 * Versions are prepended (newest first) and capped at MAX_VERSIONS.
 */

const WORKSPACE_STORAGE_KEY = 'workspace_drafts_v1';
const MAX_DRAFTS = 20;
const MAX_VERSIONS = 10;
const MAX_NAME_LENGTH = 60;
const DEFAULT_TRIM_END = 3;

class WorkspaceStore {
    constructor() {
        this.storageKey = WORKSPACE_STORAGE_KEY;
    }

    _readAll() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    _writeAll(drafts) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(drafts));
        } catch (error) {
            throw new Error('Unable to save draft. Storage may be full.');
        }
    }

    listDrafts() {
        return this._readAll();
    }

    saveDraftVersion(data) {
        if (!data || !data.name) {
            throw new Error('Draft name is required.');
        }

        const drafts = this._readAll();
        const name = String(data.name).trim().slice(0, MAX_NAME_LENGTH);
        const version = {
            source: data.source || null,
            trimStart: Number(data.trimStart) || 0,
            trimEnd: Number(data.trimEnd) || DEFAULT_TRIM_END,
            volume: Number(data.volume) || 100,
            effects: data.effects || null,
            savedAt: new Date().toISOString()
        };

        const existingIndex = drafts.findIndex(d => d.name === name);

        if (existingIndex >= 0) {
            const existing = drafts[existingIndex];
            const updatedVersions = [version, ...existing.versions].slice(0, MAX_VERSIONS);
            drafts[existingIndex] = {
                ...existing,
                versions: updatedVersions
            };
        } else {
            const trimmed = drafts.length >= MAX_DRAFTS
                ? drafts.slice(0, MAX_DRAFTS - 1)
                : drafts;
            trimmed.unshift({
                id: `draft_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
                name,
                versions: [version]
            });
            this._writeAll(trimmed);
            return { success: true };
        }

        this._writeAll(drafts);
        return { success: true };
    }

    deleteDraft(draftId) {
        if (!draftId) return;
        const drafts = this._readAll().filter(d => d.id !== draftId);
        this._writeAll(drafts);
    }
}

if (typeof window !== 'undefined') {
    window.WorkspaceStore = WorkspaceStore;
}
