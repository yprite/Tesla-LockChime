import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mountDashboardHtml() {
    const html = fs.readFileSync('dashboard.html', 'utf8');
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    document.body.innerHTML = match ? match[1] : '';
}

function mockFirebase() {
    const docApi = {
        get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
        set: vi.fn(async () => {})
    };
    const collectionApi = {
        doc: vi.fn(() => docApi)
    };
    const db = {
        collection: vi.fn(() => collectionApi)
    };

    const authApi = {
        onAuthStateChanged: vi.fn((cb) => cb(null)),
        signInWithPopup: vi.fn(async () => ({})),
        signOut: vi.fn(async () => {})
    };
    const authFn = () => authApi;
    authFn.GoogleAuthProvider = class GoogleAuthProvider {
        constructor() {
            this.providerId = 'google.com';
        }
    };
    authFn.OAuthProvider = class OAuthProvider {
        constructor(providerId) {
            this.providerId = providerId;
        }
    };

    const firestoreFn = () => db;
    firestoreFn.FieldValue = { serverTimestamp: () => ({}) };

    global.firebase = {
        apps: [],
        initializeApp: vi.fn(() => {
            global.firebase.apps.push({});
        }),
        auth: authFn,
        firestore: firestoreFn
    };
}

async function flushUi() {
    await Promise.resolve();
    await Promise.resolve();
}

describe('Dashboard i18n integration', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = 'en';
        mountDashboardHtml();
        mockFirebase();
    });

    afterEach(() => {
        delete window.i18n;
        delete window.t;
        delete global.firebase;
        document.body.innerHTML = '';
    });

    it('loads i18n script before dashboard.js in dashboard.html', () => {
        const html = fs.readFileSync('dashboard.html', 'utf8');
        const i18nIndex = html.indexOf('js/i18n.js');
        const dashboardIndex = html.indexOf('js/dashboard.js');

        expect(i18nIndex).toBeGreaterThan(-1);
        expect(dashboardIndex).toBeGreaterThan(-1);
        expect(i18nIndex).toBeLessThan(dashboardIndex);
    });

    it('updates dashboard UI text when switching language from EN to KO', async () => {
        localStorage.setItem('app_language', 'en');
        vi.resetModules();

        await import('../js/i18n.js');
        await import('../js/dashboard.js');
        window.dispatchEvent(new Event('DOMContentLoaded'));
        await flushUi();

        const languageSelect = document.getElementById('language-select');
        const title = document.querySelector('.dash-header h1');
        const saveBtn = document.getElementById('btn-save');
        const widgetSearch = document.getElementById('widget-search');

        expect(title.textContent).toBe('My Tesla Dashboard');
        expect(saveBtn.textContent).toBe('Save Dashboard');
        expect(widgetSearch.placeholder).toBe('Search widget name...');

        const setLanguageSpy = vi.spyOn(window.i18n, 'setLanguage');
        languageSelect.value = 'ko';
        languageSelect.dispatchEvent(new Event('change'));
        expect(setLanguageSpy).toHaveBeenCalledWith('ko');
        window.i18n.setLanguage('ko');
        await flushUi();

        expect(document.documentElement.lang).toBe('ko');
        expect(title.textContent).toBe('내 Tesla 대시보드');
        expect(saveBtn.textContent).toBe('대시보드 저장');
        expect(widgetSearch.placeholder).toBe('위젯 이름 검색...');
    });
});
