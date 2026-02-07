/**
 * Tesla Fleet + Growth Features Module
 *
 * - Fleet API connection and compatibility checks
 * - Release note change detection + recommendation mapping
 * - Weekly challenge progress helpers
 * - Personal workspace draft/version storage
 */

class TeslaFleetClient {
    constructor() {
        this.tokenKey = 'tesla_fleet_token';
        this.baseUrlKey = 'tesla_fleet_base_url';
        this.defaultBaseUrl = 'https://fleet-api.prd.na.vn.cloud.tesla.com';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey) || '';
    }

    setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token.trim());
        } else {
            localStorage.removeItem(this.tokenKey);
        }
    }

    getBaseUrl() {
        return localStorage.getItem(this.baseUrlKey) || this.defaultBaseUrl;
    }

    setBaseUrl(url) {
        if (url) {
            localStorage.setItem(this.baseUrlKey, url.trim().replace(/\/$/, ''));
        } else {
            localStorage.removeItem(this.baseUrlKey);
        }
    }

    async request(path, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('Missing Tesla access token');
        }

        const baseUrl = this.getBaseUrl();
        const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Fleet API ${response.status}: ${text.slice(0, 200)}`);
        }

        return response.json();
    }

    async getVehicles() {
        const json = await this.request('/api/1/vehicles');
        const response = json?.response;
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    }

    async getFleetStatus(vin) {
        if (!vin) {
            return null;
        }

        try {
            const json = await this.request('/api/1/vehicles/fleet_status', {
                method: 'POST',
                body: JSON.stringify({ vins: [vin] })
            });
            return json?.response || null;
        } catch (error) {
            return null;
        }
    }

    async getReleaseNotes(vin) {
        const json = await this.request(`/api/1/vehicles/${encodeURIComponent(vin)}/release_notes`);
        return json?.response || null;
    }
}

function normalizeVehicle(vehicle) {
    return {
        vin: vehicle?.vin || vehicle?.id_s || '',
        displayName: vehicle?.display_name || vehicle?.vehicle_name || 'Tesla',
        state: vehicle?.state || 'unknown',
        apiVersion: vehicle?.api_version || null,
        vehicleConfig: vehicle?.vehicle_config || null,
        optionCodes: vehicle?.option_codes || ''
    };
}

function evaluateCompatibility(vehicle, fleetStatus = null) {
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

function detectReleaseUpdate(vin, currentVersion) {
    if (!vin || !currentVersion) {
        return { updated: false, previous: null };
    }

    const key = `fleet_last_release_${vin}`;
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, currentVersion);

    return {
        updated: Boolean(previous && previous !== currentVersion),
        previous: previous || null,
        current: currentVersion
    };
}

function deriveRecommendationsFromRelease(releaseNotesText, weeklyTopSounds = []) {
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

function getWeeklyActionStats() {
    const raw = localStorage.getItem('weekly_growth_stats');
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function addWeeklyAction(actionType) {
    const today = new Date().toISOString().slice(0, 10);
    const stats = getWeeklyActionStats() || {
        weekStart: today,
        saves: 0,
        uploads: 0,
        shares: 0
    };

    const weekStartDate = new Date(stats.weekStart);
    const diffDays = (Date.now() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000);

    if (diffDays >= 7 || Number.isNaN(diffDays)) {
        stats.weekStart = today;
        stats.saves = 0;
        stats.uploads = 0;
        stats.shares = 0;
    }

    if (actionType === 'save') stats.saves += 1;
    if (actionType === 'upload') stats.uploads += 1;
    if (actionType === 'share') stats.shares += 1;

    localStorage.setItem('weekly_growth_stats', JSON.stringify(stats));
    return stats;
}

function getChallengeProgress(stats, target = { saves: 2, uploads: 1, shares: 1 }) {
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

class WorkspaceStore {
    constructor() {
        this.storageKey = 'workspace_drafts_v1';
    }

    listDrafts() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            const drafts = raw ? JSON.parse(raw) : [];
            return Array.isArray(drafts) ? drafts : [];
        } catch (error) {
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

        localStorage.setItem(this.storageKey, JSON.stringify(drafts.slice(0, 30)));
        return version;
    }

    deleteDraft(draftId) {
        const drafts = this.listDrafts().filter(d => d.id !== draftId);
        localStorage.setItem(this.storageKey, JSON.stringify(drafts));
    }
}

if (typeof window !== 'undefined') {
    window.TeslaFleetClient = TeslaFleetClient;
    window.TeslaFeatureUtils = {
        normalizeVehicle,
        evaluateCompatibility,
        detectReleaseUpdate,
        deriveRecommendationsFromRelease,
        addWeeklyAction,
        getWeeklyActionStats,
        getChallengeProgress
    };
    window.WorkspaceStore = WorkspaceStore;
}
