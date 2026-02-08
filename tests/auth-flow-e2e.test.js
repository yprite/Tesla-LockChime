import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function flushUi() {
    await new Promise(resolve => setTimeout(resolve, 0));
}

function mountAuthUi() {
    document.body.innerHTML = `
        <header>
            <div class="header-auth">
                <span id="header-profile-text">Sign in to sync profile across devices.</span>
                <div class="header-auth-buttons">
                    <button id="btn-auth-login">Log in</button>
                    <div id="auth-provider-options" style="display:none;">
                        <button id="btn-auth-google">Continue with Google</button>
                        <button id="btn-auth-kakao">Continue with Kakao</button>
                        <button id="btn-auth-naver">Continue with Naver</button>
                    </div>
                    <button id="btn-auth-logout" style="display:none;">Log out</button>
                </div>
            </div>
            <select id="language-select">
                <option value="en">EN</option>
                <option value="ko">KO</option>
                <option value="ja">JA</option>
                <option value="zh">ZH</option>
            </select>
        </header>
        <div id="badge-auth-hint"></div>
        <div id="badge-summary"></div>
        <div id="badge-grid"></div>
        <select id="challenge-model-select">
            <option value="modely" selected>Model Y</option>
        </select>
    `;
}

function createFirebaseMock() {
    let currentUser = null;
    let authListener = () => {};

    const authApi = {
        onAuthStateChanged: vi.fn((cb) => {
            authListener = cb;
            cb(currentUser);
        }),
        signInWithPopup: vi.fn(async (provider) => {
            currentUser = {
                uid: 'uid_test_1',
                displayName: 'Test Driver',
                providerData: [{ providerId: provider?.providerId || 'google.com' }]
            };
            authListener(currentUser);
            return { user: currentUser };
        }),
        signOut: vi.fn(async () => {
            currentUser = null;
            authListener(currentUser);
        })
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

    return {
        firebase: { auth: authFn },
        authApi
    };
}

describe('Auth flow E2E', () => {
    beforeEach(() => {
        localStorage.clear();
        mountAuthUi();

        global.AudioProcessor = class {
            stop() {}
        };
        global.FileSystemHandler = class {};
        global.GalleryHandler = class {
            async init() {
                return false;
            }

            isAvailable() {
                return false;
            }
        };

        const { firebase } = createFirebaseMock();
        global.firebase = firebase;
    });

    afterEach(() => {
        delete window.appV2;
        delete window.i18n;
        delete global.AudioProcessor;
        delete global.FileSystemHandler;
        delete global.GalleryHandler;
        delete global.firebase;
        document.body.innerHTML = '';
    });

    it('shows staged auth sequence: login -> providers -> logout', async () => {
        vi.resetModules();
        await import('../js/app-v2.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await flushUi();
        await flushUi();

        const loginBtn = document.getElementById('btn-auth-login');
        const providerOptions = document.getElementById('auth-provider-options');
        const googleBtn = document.getElementById('btn-auth-google');
        const kakaoBtn = document.getElementById('btn-auth-kakao');
        const naverBtn = document.getElementById('btn-auth-naver');
        const logoutBtn = document.getElementById('btn-auth-logout');
        const profileText = document.getElementById('header-profile-text');

        expect(loginBtn.style.display).toBe('inline-flex');
        expect(providerOptions.style.display).toBe('none');
        expect(logoutBtn.style.display).toBe('none');

        loginBtn.dispatchEvent(new Event('click'));
        expect(loginBtn.style.display).toBe('none');
        expect(providerOptions.style.display).toBe('flex');
        expect(googleBtn).toBeTruthy();
        expect(kakaoBtn).toBeTruthy();
        expect(naverBtn).toBeTruthy();

        googleBtn.dispatchEvent(new Event('click'));
        await flushUi();
        await flushUi();

        expect(loginBtn.style.display).toBe('none');
        expect(providerOptions.style.display).toBe('none');
        expect(logoutBtn.style.display).toBe('inline-flex');
        expect(profileText.textContent).toContain('Test Driver');
    });

    it('returns to initial state after logout', async () => {
        vi.resetModules();
        await import('../js/app-v2.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await flushUi();
        await flushUi();

        const loginBtn = document.getElementById('btn-auth-login');
        const providerOptions = document.getElementById('auth-provider-options');
        const googleBtn = document.getElementById('btn-auth-google');
        const logoutBtn = document.getElementById('btn-auth-logout');

        loginBtn.dispatchEvent(new Event('click'));
        googleBtn.dispatchEvent(new Event('click'));
        await flushUi();
        await flushUi();

        expect(logoutBtn.style.display).toBe('inline-flex');

        logoutBtn.dispatchEvent(new Event('click'));
        await flushUi();
        await flushUi();

        expect(loginBtn.style.display).toBe('inline-flex');
        expect(providerOptions.style.display).toBe('none');
        expect(logoutBtn.style.display).toBe('none');
    });
});
