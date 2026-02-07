import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mountLanguageUi() {
    document.body.innerHTML = `
        <header>
            <select id="language-select">
                <option value="en">EN</option>
                <option value="ko">KO</option>
                <option value="ja">JA</option>
                <option value="zh">ZH</option>
            </select>
        </header>
        <h1 class="gallery-title" data-i18n="gallery.title">Community Gallery</h1>
        <p class="gallery-subtitle" data-i18n="gallery.subtitle">Discover and share custom Tesla lock sounds with owners worldwide</p>
        <input type="text" id="search-input" data-i18n-placeholder="form.searchPlaceholder" placeholder="Search sounds...">
        <div class="filter-pills">
            <button class="filter-pill active" data-category="all" data-i18n="cat.all">All</button>
            <button class="filter-pill" data-category="trending" data-i18n="gallery.trending">Trending This Week</button>
            <button class="filter-pill" data-category="classic" data-i18n="cat.classic">Classic</button>
            <button class="filter-pill" data-category="modern" data-i18n="cat.modern">Modern</button>
            <button class="filter-pill" data-category="funny" data-i18n="cat.funny">Funny</button>
        </div>
        <button class="btn-upload" id="btn-upload-sound">
            <span data-i18n="btn.upload">Upload</span>
        </button>
    `;
}

describe('Language switch E2E', () => {
    beforeEach(() => {
        localStorage.clear();
        mountLanguageUi();

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
    });

    afterEach(() => {
        delete window.appV2;
        delete window.i18n;
        delete window.t;
        delete global.AudioProcessor;
        delete global.FileSystemHandler;
        delete global.GalleryHandler;
        document.body.innerHTML = '';
    });

    it('updates key UI texts when changing language from EN to KO', async () => {
        localStorage.setItem('app_language', 'en');
        vi.resetModules();

        await import('../js/i18n.js');
        await import('../js/app-v2.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const langSelect = document.getElementById('language-select');
        const title = document.querySelector('.gallery-title');
        const subtitle = document.querySelector('.gallery-subtitle');
        const searchInput = document.getElementById('search-input');
        const allFilter = document.querySelector('.filter-pill[data-category="all"]');
        const uploadText = document.querySelector('#btn-upload-sound [data-i18n="btn.upload"]');

        expect(title.textContent).toBe('Community Gallery');
        expect(subtitle.textContent).toBe('Discover and share custom Tesla lock sounds with owners worldwide');
        expect(searchInput.placeholder).toBe('Search sounds...');
        expect(allFilter.textContent).toBe('All');
        expect(uploadText.textContent).toBe('Upload');

        langSelect.value = 'ko';
        langSelect.dispatchEvent(new Event('change'));

        expect(document.documentElement.lang).toBe('ko');
        expect(title.textContent).toBe('커뮤니티 갤러리');
        expect(subtitle.textContent).toBe('전 세계 테슬라 오너들과 커스텀 잠금 사운드를 공유하세요');
        expect(searchInput.placeholder).toBe('사운드 검색...');
        expect(allFilter.textContent).toBe('전체');
        expect(uploadText.textContent).toBe('업로드');
    });

    it('keeps i18n hooks on key main-page elements in index.html', () => {
        const html = fs.readFileSync('index.html', 'utf8');

        expect(html).toContain('class="gallery-title" data-i18n="gallery.title"');
        expect(html).toContain('class="gallery-subtitle" data-i18n="gallery.subtitle"');
        expect(html).toContain('id="search-input" data-i18n-placeholder="form.searchPlaceholder"');
        expect(html).toContain('data-category="all" data-i18n="cat.all"');
        expect(html).toContain('data-i18n="btn.upload"');
    });
});
