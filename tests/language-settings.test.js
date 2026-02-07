import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function bootstrapApp(initialLanguage = 'ko') {
    document.body.innerHTML = `
        <select id="language-select">
            <option value="en">EN</option>
            <option value="ko">KO</option>
            <option value="ja">JA</option>
            <option value="zh">ZH</option>
        </select>
    `;
    document.documentElement.lang = 'en';

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

    const i18n = {
        getLanguage: vi.fn(() => initialLanguage),
        updatePage: vi.fn(),
        setLanguage: vi.fn()
    };
    window.i18n = i18n;

    vi.resetModules();
    await import('../js/app-v2.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    return {
        i18n,
        languageSelect: document.getElementById('language-select')
    };
}

describe('Language settings integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        delete window.appV2;
        delete window.i18n;
        delete global.AudioProcessor;
        delete global.FileSystemHandler;
        delete global.GalleryHandler;
        document.body.innerHTML = '';
    });

    it('loads i18n script before app-v2 in index.html', () => {
        const html = fs.readFileSync('index.html', 'utf8');
        const i18nIndex = html.indexOf('js/i18n.js');
        const appIndex = html.indexOf('js/app-v2.js');

        expect(i18nIndex).toBeGreaterThan(-1);
        expect(appIndex).toBeGreaterThan(-1);
        expect(i18nIndex).toBeLessThan(appIndex);
    });

    it('syncs language selector and forwards language changes to i18n', async () => {
        const { i18n, languageSelect } = await bootstrapApp('ko');

        expect(languageSelect.value).toBe('ko');
        expect(document.documentElement.lang).toBe('ko');
        expect(i18n.updatePage).toHaveBeenCalledTimes(1);

        languageSelect.value = 'ja';
        languageSelect.dispatchEvent(new Event('change'));
        expect(i18n.setLanguage).toHaveBeenCalledWith('ja');

        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: 'zh' }
        }));
        expect(languageSelect.value).toBe('zh');
    });
});
