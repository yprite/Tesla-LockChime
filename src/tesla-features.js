export function evaluateCompatibility(vehicle, fleetStatus = null) {
    const model = (vehicle?.vehicleConfig?.car_type || vehicle?.model || '').toUpperCase();
    const optionCodes = String(vehicle?.optionCodes || '').toUpperCase();
    const reasons = [];

    const hasExternalSpeakerSignal = optionCodes.includes('P3WS') || optionCodes.includes('PEMS');
    const knownBoomboxModels = ['MODEL3', 'MODELY', 'MODELS', 'MODELX'];
    const modelLooksCompatible = knownBoomboxModels.includes(model) || !model;

    if (!modelLooksCompatible) {
        reasons.push('Model may not support custom lock chimes.');
    }

    if (!hasExternalSpeakerSignal) {
        reasons.push('External pedestrian speaker could not be confirmed from option codes.');
    }

    if (vehicle?.state !== 'online') {
        reasons.push('Vehicle is currently offline. Wake the vehicle to verify live status.');
    }

    const canUseBoombox = Boolean(
        fleetStatus?.boombox_available ||
        fleetStatus?.features?.boombox ||
        hasExternalSpeakerSignal
    );

    return {
        ready: modelLooksCompatible && canUseBoombox,
        reasons,
        model: model || 'unknown',
        canUseBoombox
    };
}

export function detectReleaseUpdate(storage, vin, currentVersion) {
    if (!vin || !currentVersion) {
        return { updated: false, previous: null };
    }

    const key = `fleet_last_release_${vin}`;
    const previous = storage.getItem(key);
    storage.setItem(key, currentVersion);

    return {
        updated: Boolean(previous && previous !== currentVersion),
        previous: previous || null,
        current: currentVersion
    };
}

export function deriveRecommendationsFromRelease(releaseNotesText, weeklyTopSounds = []) {
    const text = String(releaseNotesText || '').toLowerCase();
    const recommendations = [];

    if (text.includes('holiday') || text.includes('festive')) {
        recommendations.push({ category: 'funny', reason: 'Seasonal update signal detected.' });
    }
    if (text.includes('audio') || text.includes('boombox')) {
        recommendations.push({ category: 'musical', reason: 'Audio-related release note detected.' });
    }
    if (text.includes('autopilot') || text.includes('f sd')) {
        recommendations.push({ category: 'futuristic', reason: 'Autonomy-related update detected.' });
    }

    if (recommendations.length === 0 && Array.isArray(weeklyTopSounds) && weeklyTopSounds.length > 0) {
        recommendations.push({
            category: weeklyTopSounds[0].category || 'custom',
            reason: 'Top community trend this week.'
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({ category: 'custom', reason: 'Try a custom sound for your latest build.' });
    }

    return recommendations;
}

export function getChallengeProgress(stats, target = { saves: 2, uploads: 1, shares: 1 }) {
    const safeStats = stats || { saves: 0, uploads: 0, shares: 0 };
    const pct = (value, max) => Math.min(100, Math.round((value / max) * 100));

    return {
        saveProgress: pct(safeStats.saves || 0, target.saves),
        uploadProgress: pct(safeStats.uploads || 0, target.uploads),
        shareProgress: pct(safeStats.shares || 0, target.shares),
        completed:
            (safeStats.saves || 0) >= target.saves &&
            (safeStats.uploads || 0) >= target.uploads &&
            (safeStats.shares || 0) >= target.shares
    };
}

export class WorkspaceStore {
    constructor(storage) {
        this.storage = storage;
        this.storageKey = 'workspace_drafts_v1';
    }

    listDrafts() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            const drafts = raw ? JSON.parse(raw) : [];
            return Array.isArray(drafts) ? drafts : [];
        } catch {
            return [];
        }
    }

    saveDraftVersion(payload) {
        const drafts = this.listDrafts();
        const now = new Date().toISOString();
        const name = (payload?.name || '').trim();
        if (!name) {
            throw new Error('Draft name is required');
        }

        const existing = drafts.find(d => d.name.toLowerCase() === name.toLowerCase());
        const version = {
            id: `ver_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
            createdAt: now,
            source: payload.source || {},
            trimStart: Number(payload.trimStart || 0),
            trimEnd: Number(payload.trimEnd || 3),
            volume: Number(payload.volume || 100)
        };

        if (existing) {
            existing.updatedAt = now;
            existing.versions.unshift(version);
            existing.versions = existing.versions.slice(0, 20);
        } else {
            drafts.unshift({
                id: `draft_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
                name,
                updatedAt: now,
                versions: [version]
            });
        }

        this.storage.setItem(this.storageKey, JSON.stringify(drafts.slice(0, 30)));
        return version;
    }

    deleteDraft(draftId) {
        const drafts = this.listDrafts().filter(d => d.id !== draftId);
        this.storage.setItem(this.storageKey, JSON.stringify(drafts));
    }
}
