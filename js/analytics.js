/**
 * Analytics Tracker
 *
 * Tracks product analytics events to Firestore `events` collection
 * while preserving existing GA usage.
 */

const ANALYTICS_EVENTS_COLLECTION = 'events';

class AnalyticsTracker {
    constructor() {
        this.db = null;
        this.userIdKey = 'analytics_user_id';
        this.sessionIdKey = 'analytics_session_id';
        this.lastSeenKey = 'analytics_last_seen_at_ms';
        this.lastTrimSignature = '';
    }

    setDatabase(db) {
        this.db = db || null;
    }

    setDatabaseFromGallery(galleryHandler) {
        if (galleryHandler && galleryHandler.db) {
            this.setDatabase(galleryHandler.db);
        }
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem(this.userIdKey);
        if (!userId) {
            userId = `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem(this.userIdKey, userId);
        }
        return userId;
    }

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem(this.sessionIdKey);
        if (!sessionId) {
            sessionId = `ses_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
            sessionStorage.setItem(this.sessionIdKey, sessionId);
        }
        return sessionId;
    }

    getLanguage() {
        const i18nApi = window.i18n;
        if (i18nApi && typeof i18nApi.getLanguage === 'function') {
            return i18nApi.getLanguage();
        }
        return document.documentElement.lang || 'en';
    }

    getEntryChannel() {
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source');
        if (utmSource) return utmSource.toLowerCase();
        if (document.referrer) {
            try {
                return new URL(document.referrer).hostname.toLowerCase();
            } catch (error) {
                return 'referrer';
            }
        }
        return 'direct';
    }

    getDeviceType() {
        const ua = navigator.userAgent.toLowerCase();
        if (/mobile|iphone|android/.test(ua)) {
            return 'mobile';
        }
        if (/ipad|tablet/.test(ua)) {
            return 'tablet';
        }
        return 'desktop';
    }

    sanitizeProperties(properties) {
        const clean = {};
        Object.entries(properties || {}).forEach(([key, value]) => {
            if (value === undefined) return;
            if (value === null) {
                clean[key] = null;
                return;
            }
            if (typeof value === 'string') {
                clean[key] = value.slice(0, 300);
                return;
            }
            if (typeof value === 'number' || typeof value === 'boolean') {
                clean[key] = value;
                return;
            }
            clean[key] = JSON.stringify(value).slice(0, 300);
        });
        return clean;
    }

    shouldTrackTrimComplete(soundId, trimStart, trimEnd, isValid) {
        if (!isValid) return false;
        const signature = `${soundId || 'unknown'}:${Number(trimStart).toFixed(1)}:${Number(trimEnd).toFixed(1)}`;
        if (signature === this.lastTrimSignature) {
            return false;
        }
        this.lastTrimSignature = signature;
        return true;
    }

    trackReturnSession7d() {
        const nowMs = Date.now();
        const lastSeenAtRaw = localStorage.getItem(this.lastSeenKey);
        const lastSeenAtMs = Number(lastSeenAtRaw || 0);

        if (lastSeenAtMs > 0) {
            const daysSinceLast = (nowMs - lastSeenAtMs) / (24 * 60 * 60 * 1000);
            if (daysSinceLast >= 7) {
                this.track('return_session_7d', {
                    days_since_last_session: Number(daysSinceLast.toFixed(2))
                });
            }
        }

        localStorage.setItem(this.lastSeenKey, String(nowMs));
    }

    async track(eventName, properties = {}) {
        if (!eventName) return false;

        if (typeof gtag === 'function') {
            gtag('event', eventName, properties);
        }

        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Analytics:', eventName, properties);
        }

        if (!this.db || typeof firebase === 'undefined' || !firebase.firestore?.FieldValue?.serverTimestamp) {
            return false;
        }

        const now = new Date();
        const payload = {
            eventName: String(eventName),
            eventDate: now.toISOString().slice(0, 10),
            occurredAtMs: now.getTime(),
            occurredAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: this.getOrCreateUserId(),
            sessionId: this.getOrCreateSessionId(),
            language: this.getLanguage(),
            entryChannel: this.getEntryChannel(),
            device: this.getDeviceType(),
            path: window.location.pathname,
            referrer: document.referrer || '',
            properties: this.sanitizeProperties(properties)
        };

        try {
            await this.db.collection(ANALYTICS_EVENTS_COLLECTION).add(payload);
            return true;
        } catch (error) {
            console.warn('Analytics event write failed:', error);
            return false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AnalyticsTracker = AnalyticsTracker;
}
