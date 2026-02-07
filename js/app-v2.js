/**
 * Tesla Lock Sound Creator v2 - Gallery-First Application
 *
 * Features:
 * - Gallery-First UX: Browse sounds first, then edit
 * - Slide Panel Editor: No scrolling, edit in side panel
 * - Tesla Animation: Car door closing with sound on success
 */

class TeslaLockSoundAppV2 {
    constructor() {
        this.audioProcessor = new AudioProcessor();
        this.fileSystem = new FileSystemHandler();
        this.gallery = new GalleryHandler();
        this.featureUtils = (typeof window !== 'undefined' && window.TeslaFeatureUtils) ? window.TeslaFeatureUtils : {
            normalizeVehicle: (vehicle) => ({
                vin: vehicle?.vin || '',
                displayName: vehicle?.display_name || 'Tesla',
                state: vehicle?.state || 'unknown',
                vehicleConfig: vehicle?.vehicle_config || null,
                optionCodes: vehicle?.option_codes || ''
            }),
            evaluateCompatibility: () => ({ ready: false, reasons: ['Fleet utility unavailable.'] }),
            detectReleaseUpdate: () => ({ updated: false, previous: null, current: null }),
            deriveRecommendationsFromRelease: () => [{ category: 'custom', reason: 'Fleet utility unavailable.' }],
            addWeeklyAction: () => ({}),
            getWeeklyActionStats: () => ({ saves: 0, uploads: 0, shares: 0 }),
            getChallengeProgress: () => ({ saveProgress: 0, uploadProgress: 0, shareProgress: 0, completed: false })
        };
        this.fleetClient = (typeof TeslaFleetClient !== 'undefined') ? new TeslaFleetClient() : {
            getToken: () => '',
            getBaseUrl: () => '',
            setToken: () => {},
            setBaseUrl: () => {},
            getVehicles: async () => [],
            getFleetStatus: async () => null,
            getReleaseNotes: async () => null
        };
        this.workspaceStore = (typeof WorkspaceStore !== 'undefined') ? new WorkspaceStore() : {
            listDrafts: () => [],
            saveDraftVersion: () => { throw new Error('Workspace unavailable'); },
            deleteDraft: () => {}
        };

        this.state = {
            selectedSoundId: null,
            selectedSoundName: '',
            selectedSoundUrl: null,
            trimStart: 0,
            trimEnd: 3,
            duration: 0,
            isPlaying: false,
            volume: 100,
            isEditorOpen: false,
            currentCategory: 'all',
            searchQuery: '',
            fleetVehicles: [],
            currentVehicleVin: null
        };

        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.animationFrameId = null;
        this.audioData = null;

        this.elements = this.cacheElements();
        this.init();
    }

    cacheElements() {
        return {
            galleryPanel: document.getElementById('gallery-panel'),
            editorPanel: document.getElementById('editor-panel'),
            soundsGrid: document.getElementById('sounds-grid'),
            searchInput: document.getElementById('search-input'),
            filterPills: document.querySelectorAll('.filter-pill'),

            btnCreateNew: document.getElementById('btn-create-new'),
            btnUploadSound: document.getElementById('btn-upload-sound'),
            btnCloseEditor: document.getElementById('btn-close-editor'),

            editorTitle: document.getElementById('editor-title'),
            editorSoundName: document.getElementById('editor-sound-name'),

            waveformWrapper: document.getElementById('waveform-wrapper'),
            waveformCanvas: document.getElementById('waveform-canvas-v2'),
            trimRegion: document.getElementById('trim-region'),
            trimHandleLeft: document.getElementById('trim-handle-left'),
            trimHandleRight: document.getElementById('trim-handle-right'),
            playhead: document.getElementById('playhead-v2'),

            timeStart: document.getElementById('time-start'),
            timeDuration: document.getElementById('time-duration'),
            timeEnd: document.getElementById('time-end'),

            btnPlay: document.getElementById('btn-play'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            volumeSlider: document.getElementById('volume-slider-v2'),
            volumeValue: document.getElementById('volume-value-v2'),

            validationStatus: document.getElementById('validation-status'),
            statusText: document.getElementById('status-text'),

            btnDownload: document.getElementById('btn-download-v2'),
            btnSaveUsb: document.getElementById('btn-save-usb-v2'),
            btnShareGallery: document.getElementById('btn-share-gallery'),

            uploadModal: document.getElementById('upload-modal'),
            uploadModalClose: document.getElementById('upload-modal-close'),
            uploadDropzone: document.getElementById('upload-dropzone'),
            fileInput: document.getElementById('file-input'),
            uploadForm: document.getElementById('upload-form'),
            uploadName: document.getElementById('upload-name-v2'),
            uploadCategory: document.getElementById('upload-category-v2'),
            btnUploadCancel: document.getElementById('btn-upload-cancel'),

            createModal: document.getElementById('create-modal'),
            createModalClose: document.getElementById('create-modal-close'),
            presetGrid: document.getElementById('preset-grid'),
            btnUploadOwn: document.getElementById('btn-upload-own'),

            successModal: document.getElementById('success-modal'),
            teslaAnimation: document.getElementById('tesla-animation'),
            btnDone: document.getElementById('btn-done'),

            loadMoreSection: document.getElementById('load-more-section'),
            btnLoadMore: document.getElementById('btn-load-more'),
            emptyState: document.getElementById('empty-state'),

            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            statSounds: document.getElementById('stat-sounds'),
            statDownloads: document.getElementById('stat-downloads'),

            languageSelect: document.getElementById('language-select'),

            fleetTokenInput: document.getElementById('fleet-token-input'),
            fleetBaseUrlInput: document.getElementById('fleet-base-url-input'),
            btnFleetConnect: document.getElementById('btn-fleet-connect'),
            fleetVehicleSelect: document.getElementById('fleet-vehicle-select'),
            btnFleetCheck: document.getElementById('btn-fleet-check'),
            fleetStatusMessage: document.getElementById('fleet-status-message'),
            btnReleaseCheck: document.getElementById('btn-release-check'),
            releaseUpdateMessage: document.getElementById('release-update-message'),
            releaseRecommendations: document.getElementById('release-recommendations'),
            challengeProgress: document.getElementById('challenge-progress'),
            weeklyRankingList: document.getElementById('weekly-ranking-list'),
            workspaceDraftName: document.getElementById('workspace-draft-name'),
            btnSaveDraft: document.getElementById('btn-save-draft'),
            workspaceDraftsList: document.getElementById('workspace-drafts-list')
        };
    }

    async init() {
        this.waveformCanvas = this.elements.waveformCanvas;
        this.waveformCtx = this.waveformCanvas?.getContext('2d');
        this.initLanguageSettings();

        await this.initGallery();
        this.initGrowthFeatures();
        this.setupEventListeners();
        this.populatePresets();
        this.resizeWaveformCanvas();

        window.addEventListener('resize', () => this.resizeWaveformCanvas());
    }

    t(key, params = {}, fallback = key) {
        const i18nApi = window.i18n;
        if (i18nApi && typeof i18nApi.t === 'function') {
            return i18nApi.t(key, params);
        }
        return fallback;
    }

    initLanguageSettings() {
        const i18nApi = window.i18n;
        const languageSelect = this.elements.languageSelect;

        if (!languageSelect || !i18nApi) {
            return;
        }

        if (typeof i18nApi.getLanguage === 'function') {
            const currentLang = i18nApi.getLanguage();
            languageSelect.value = currentLang;
            document.documentElement.lang = currentLang;
        }

        if (typeof i18nApi.updatePage === 'function') {
            i18nApi.updatePage();
        }

        languageSelect.addEventListener('change', (e) => {
            if (typeof i18nApi.setLanguage === 'function') {
                i18nApi.setLanguage(e.target.value);
            }
        });

        window.addEventListener('languageChanged', (e) => {
            const changedLanguage = e?.detail?.language;
            if (changedLanguage && languageSelect.value !== changedLanguage) {
                languageSelect.value = changedLanguage;
            }
            this.handleLanguageChanged();
        });
    }

    handleLanguageChanged() {
        this.validateDuration();
        this.updateTrimUI();
        this.renderWorkspaceDrafts();
        this.loadWeeklyRanking();
        this.loadGallerySounds();
    }

    async initGallery() {
        try {
            const initialized = await this.gallery.init();
            console.log('Gallery initialized:', initialized);
            if (initialized) {
                await this.loadGallerySounds();
                await this.updateStats();
            } else {
                console.warn('Gallery initialization failed');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Gallery init error:', error);
            this.showEmptyState();
        }
    }

    initGrowthFeatures() {
        if (this.elements.fleetTokenInput) {
            this.elements.fleetTokenInput.value = this.fleetClient.getToken();
        }

        if (this.elements.fleetBaseUrlInput) {
            this.elements.fleetBaseUrlInput.value = this.fleetClient.getBaseUrl();
        }

        this.renderChallengeProgress();
        this.renderWorkspaceDrafts();
        this.loadWeeklyRanking();
    }

    setupEventListeners() {
        this.elements.btnCreateNew?.addEventListener('click', () => this.openCreateModal());
        this.elements.btnUploadSound?.addEventListener('click', () => this.openUploadModal());
        this.elements.btnCloseEditor?.addEventListener('click', () => this.closeEditor());

        this.elements.searchInput?.addEventListener('input', this.debounce(() => {
            this.state.searchQuery = this.elements.searchInput.value;
            this.loadGallerySounds();
        }, 300));

        this.elements.filterPills.forEach(pill => {
            pill.addEventListener('click', () => this.handleFilterClick(pill));
        });

        this.elements.btnPlay?.addEventListener('click', () => this.togglePlayback());
        this.elements.progressBar?.addEventListener('click', (e) => this.seekTo(e));

        this.elements.volumeSlider?.addEventListener('input', () => this.handleVolumeChange());

        this.elements.btnDownload?.addEventListener('click', () => this.downloadSound());
        this.elements.btnSaveUsb?.addEventListener('click', () => this.saveToUsb());
        this.elements.btnShareGallery?.addEventListener('click', () => this.shareToGallery());

        this.setupTrimHandles();
        this.setupModals();

        this.elements.btnLoadMore?.addEventListener('click', () => this.loadGallerySounds(true));
        this.elements.btnFleetConnect?.addEventListener('click', () => this.connectFleetApi());
        this.elements.btnFleetCheck?.addEventListener('click', () => this.checkFleetCompatibility());
        this.elements.btnReleaseCheck?.addEventListener('click', () => this.checkReleaseUpdates());
        this.elements.btnSaveDraft?.addEventListener('click', () => this.saveWorkspaceDraft());
    }

    setupTrimHandles() {
        if (!this.elements.waveformWrapper) return;

        let isDragging = null;
        const wrapper = this.elements.waveformWrapper;

        const getPositionFromEvent = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        };

        const startDrag = (handle) => (e) => {
            e.preventDefault();
            isDragging = handle;
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const pos = getPositionFromEvent(e);
            const time = pos * this.state.duration;

            if (isDragging === 'left') {
                this.state.trimStart = Math.min(time, this.state.trimEnd - 0.5);
            } else {
                this.state.trimEnd = Math.max(time, this.state.trimStart + 0.5);
            }

            this.updateTrimUI();
            this.validateDuration();
        };

        const endDrag = () => {
            isDragging = null;
        };

        this.elements.trimHandleLeft?.addEventListener('mousedown', startDrag('left'));
        this.elements.trimHandleLeft?.addEventListener('touchstart', startDrag('left'));
        this.elements.trimHandleRight?.addEventListener('mousedown', startDrag('right'));
        this.elements.trimHandleRight?.addEventListener('touchstart', startDrag('right'));

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    setupModals() {
        this.elements.uploadModalClose?.addEventListener('click', () => this.closeUploadModal());
        this.elements.uploadModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeUploadModal());

        this.elements.uploadDropzone?.addEventListener('click', () => this.elements.fileInput?.click());
        this.elements.uploadDropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadDropzone.classList.add('dragover');
        });
        this.elements.uploadDropzone?.addEventListener('dragleave', () => {
            this.elements.uploadDropzone.classList.remove('dragover');
        });
        this.elements.uploadDropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadDropzone.classList.remove('dragover');
            if (e.dataTransfer.files?.[0]) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        this.elements.fileInput?.addEventListener('change', (e) => {
            if (e.target.files?.[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        this.elements.btnUploadCancel?.addEventListener('click', () => this.closeUploadModal());
        this.elements.uploadForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitUpload();
        });

        this.elements.createModalClose?.addEventListener('click', () => this.closeCreateModal());
        this.elements.createModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeCreateModal());
        this.elements.btnUploadOwn?.addEventListener('click', () => {
            this.closeCreateModal();
            this.openUploadModal();
        });

        this.elements.btnDone?.addEventListener('click', () => this.closeSuccessModal());
        this.elements.successModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeSuccessModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeEditor();
            }
        });
    }

    handleFilterClick(pill) {
        this.elements.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.state.currentCategory = pill.dataset.category;
        this.loadGallerySounds();
    }

    async loadGallerySounds(append = false) {
        if (!this.gallery.isAvailable()) {
            console.warn('Gallery not available');
            this.showEmptyState();
            return;
        }

        try {
            if (!append) {
                this.elements.soundsGrid.innerHTML = `<div class="loading-placeholder">${this.t('status.loading', {}, 'Loading...')}</div>`;
            }

            const options = {
                category: this.state.currentCategory === 'all' ? null : this.state.currentCategory,
                sortBy: this.state.currentCategory === 'trending' ? 'downloads' : 'createdAt',
                startAfter: append ? this.gallery.lastDoc : null
            };

            let result;
            if (this.state.searchQuery) {
                result = await this.gallery.searchSounds(this.state.searchQuery);
            } else {
                result = await this.gallery.getSounds(options);
            }

            if (!append) {
                this.elements.soundsGrid.innerHTML = '';
            }

            if (result.sounds.length === 0 && !append) {
                this.showEmptyState();
                return;
            }

            this.hideEmptyState();
            result.sounds.forEach(sound => {
                this.elements.soundsGrid.appendChild(this.createSoundCard(sound));
            });

            if (this.elements.loadMoreSection) {
                this.elements.loadMoreSection.style.display = result.hasMore ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Failed to load gallery sounds:', error);
            if (!append) {
                this.elements.soundsGrid.innerHTML = '';
            }
            this.showEmptyState();
            this.showToast(`${this.t('gallery.loadFailed', {}, 'Failed to load gallery. Please try again.')} ${error.message}`, 'error');
        }
    }

    createSoundCard(sound) {
        const card = document.createElement('div');
        card.className = 'sound-card';
        card.dataset.soundId = sound.id;

        const isLiked = this.gallery.isLiked(sound.id);

        const categoryCode = sound.category || 'custom';
        const categoryLabel = this.t(`cat.${categoryCode}`, {}, categoryCode);
        const previewLabel = this.t('btn.preview', {}, 'Preview');
        const useLabel = this.t('v2.use', {}, 'Use');

        card.innerHTML = `
            <div class="sound-card-content">
                <div class="sound-card-header">
                    <div class="sound-card-info">
                        <div class="sound-card-name">${this.escapeHtml(sound.name)}</div>
                        <span class="sound-card-category">${this.escapeHtml(categoryLabel)}</span>
                    </div>
                    <button class="sound-card-play" data-url="${sound.downloadUrl}" title="${this.escapeHtml(previewLabel)}">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    </button>
                </div>
                <div class="sound-card-meta">
                    <span>${(sound.duration || 3).toFixed(1)}s</span>
                    <span>${this.formatFileSize(sound.fileSize || 0)}</span>
                </div>
                <div class="sound-card-stats">
                    <span class="sound-card-stat likes ${isLiked ? 'liked' : ''}" data-sound-id="${sound.id}">
                        ${isLiked ? '❤️' : '🤍'} ${sound.likes || 0}
                    </span>
                    <span class="sound-card-stat">
                        ⬇️ ${sound.downloads || 0}
                    </span>
                    <div class="sound-card-actions">
                        <button class="btn-use" data-sound-id="${sound.id}">${this.escapeHtml(useLabel)}</button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector('.sound-card-play').addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewSound(sound.downloadUrl, e.currentTarget);
        });

        card.querySelector('.sound-card-stat.likes').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleLike(sound.id, e.currentTarget);
        });

        card.querySelector('.btn-use').addEventListener('click', (e) => {
            e.stopPropagation();
            this.useSound(sound);
        });

        return card;
    }

    async previewSound(url, button) {
        if (this.state.isPlaying) {
            this.audioProcessor.stop();
            this.state.isPlaying = false;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            `;
            return;
        }

        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
        `;

        try {
            await this.audioProcessor.init();
            const response = await fetch(url);
            const blob = await response.blob();
            await this.audioProcessor.loadFromBlob(blob);

            this.state.isPlaying = true;
            await this.audioProcessor.play(0, null, () => {
                this.state.isPlaying = false;
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                `;
            });
        } catch (error) {
            this.state.isPlaying = false;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            `;
            this.showToast(this.t('error.playFailed', {}, 'Could not play audio. Please check your audio settings.'), 'error');
        }
    }

    async handleLike(soundId, element) {
        try {
            const { liked } = await this.gallery.likeSound(soundId);
            const count = parseInt(element.textContent.match(/\d+/)?.[0] || 0);
            element.classList.toggle('liked', liked);
            element.innerHTML = `${liked ? '❤️' : '🤍'} ${count + (liked ? 1 : -1)}`;
        } catch (error) {
            this.showToast(this.t('v2.likeFailed', {}, 'Failed to like sound.'), 'error');
        }
    }

    async useSound(sound) {
        this.showLoading(this.t('status.loading', {}, 'Loading...'));

        try {
            const { blob } = await this.gallery.downloadSound(sound.id);

            await this.audioProcessor.init();
            await this.audioProcessor.loadFromBlob(blob);

            this.state.selectedSoundId = sound.id;
            this.state.selectedSoundName = sound.name;
            this.state.selectedSoundUrl = sound.downloadUrl;
            this.state.duration = this.audioProcessor.getDuration();
            this.state.trimStart = 0;
            this.state.trimEnd = Math.min(this.state.duration, 5);

            this.openEditor();
            this.drawWaveform();
            this.updateTrimUI();
            this.validateDuration();

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('error.loadFailed', {}, 'Error loading sound. Please try again.'), 'error');
        }
    }

    openEditor() {
        this.state.isEditorOpen = true;
        document.body.classList.add('editor-open');
        this.elements.editorPanel?.classList.add('open');
        this.elements.editorSoundName.textContent = this.state.selectedSoundName;
        this.resizeWaveformCanvas();
    }

    closeEditor() {
        this.state.isEditorOpen = false;
        document.body.classList.remove('editor-open');
        this.elements.editorPanel?.classList.remove('open');
        this.audioProcessor.stop();
        this.state.isPlaying = false;
        this.updatePlayButton(false);
    }

    resizeWaveformCanvas() {
        if (!this.waveformCanvas || !this.elements.waveformWrapper) return;

        const rect = this.elements.waveformWrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.waveformCanvas.width = rect.width * dpr;
        this.waveformCanvas.height = rect.height * dpr;
        this.waveformCanvas.style.width = `${rect.width}px`;
        this.waveformCanvas.style.height = `${rect.height}px`;

        this.waveformCtx?.scale(dpr, dpr);

        if (this.audioData) {
            this.drawWaveform();
        }
    }

    drawWaveform() {
        if (!this.waveformCtx || !this.audioProcessor.audioBuffer) return;

        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);

        const buffer = this.audioProcessor.audioBuffer;
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.fillStyle = 'rgba(142, 142, 147, 0.3)';

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const y = (1 + min) * amp;
            const h = Math.max(1, (max - min) * amp);

            ctx.fillRect(i, y, 1, h);
        }

        this.audioData = data;
    }

    updateTrimUI() {
        if (!this.elements.trimRegion || !this.elements.waveformWrapper) return;
        if (!this.state.duration || this.state.duration <= 0) return;

        const wrapper = this.elements.waveformWrapper;
        const width = wrapper.offsetWidth;

        const startPercent = (this.state.trimStart / this.state.duration) * 100;
        const endPercent = (this.state.trimEnd / this.state.duration) * 100;

        this.elements.trimRegion.style.left = `${startPercent}%`;
        this.elements.trimRegion.style.width = `${endPercent - startPercent}%`;

        this.elements.timeStart.textContent = `${this.state.trimStart.toFixed(1)}s`;
        this.elements.timeEnd.textContent = `${this.state.trimEnd.toFixed(1)}s`;

        const duration = this.state.trimEnd - this.state.trimStart;
        this.elements.timeDuration.textContent = this.t('v2.durationLabel', { duration: duration.toFixed(1) }, `Duration: ${duration.toFixed(1)}s`);
    }

    validateDuration() {
        const duration = this.state.trimEnd - this.state.trimStart;
        const isValid = duration >= 2 && duration <= 5;

        if (this.elements.validationStatus) {
            this.elements.validationStatus.classList.toggle('invalid', !isValid);

            const validIcon = this.elements.validationStatus.querySelector('.status-icon.valid');
            const invalidIcon = this.elements.validationStatus.querySelector('.status-icon.invalid');

            if (validIcon) validIcon.style.display = isValid ? 'block' : 'none';
            if (invalidIcon) invalidIcon.style.display = isValid ? 'none' : 'block';
        }

        if (this.elements.statusText) {
            if (isValid) {
                this.elements.statusText.textContent = this.t('v2.readyForTesla', {}, 'Ready for Tesla (2-5 seconds)');
            } else if (duration < 2) {
                this.elements.statusText.textContent = this.t('v2.tooShort', { duration: duration.toFixed(1) }, `Too short (${duration.toFixed(1)}s) - minimum 2s`);
            } else {
                this.elements.statusText.textContent = this.t('v2.tooLong', { duration: duration.toFixed(1) }, `Too long (${duration.toFixed(1)}s) - maximum 5s`);
            }
        }

        return isValid;
    }

    async togglePlayback() {
        if (this.state.isPlaying) {
            this.audioProcessor.stop();
            this.state.isPlaying = false;
            this.updatePlayButton(false);
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        try {
            this.state.isPlaying = true;
            this.updatePlayButton(true);

            const duration = this.state.trimEnd - this.state.trimStart;
            const startTime = performance.now();

            const updateProgress = () => {
                if (!this.state.isPlaying) return;

                const elapsed = (performance.now() - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);

                if (this.elements.progressFill) {
                    this.elements.progressFill.style.width = `${progress * 100}%`;
                }

                if (progress < 1) {
                    this.animationFrameId = requestAnimationFrame(updateProgress);
                }
            };

            this.animationFrameId = requestAnimationFrame(updateProgress);

            await this.audioProcessor.play(this.state.trimStart, this.state.trimEnd, () => {
                this.state.isPlaying = false;
                this.updatePlayButton(false);
                cancelAnimationFrame(this.animationFrameId);
                if (this.elements.progressFill) {
                    this.elements.progressFill.style.width = '0%';
                }
            });
        } catch (error) {
            this.state.isPlaying = false;
            this.updatePlayButton(false);
            this.showToast(this.t('error.playFailed', {}, 'Could not play audio. Please check your audio settings.'), 'error');
        }
    }

    updatePlayButton(isPlaying) {
        if (!this.elements.btnPlay) return;

        const iconPlay = this.elements.btnPlay.querySelector('.icon-play');
        const iconPause = this.elements.btnPlay.querySelector('.icon-pause');

        if (iconPlay) iconPlay.style.display = isPlaying ? 'none' : 'block';
        if (iconPause) iconPause.style.display = isPlaying ? 'block' : 'none';
    }

    seekTo(e) {
        if (!this.elements.progressBar) return;

        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const duration = this.state.trimEnd - this.state.trimStart;
        const seekTime = this.state.trimStart + (percent * duration);

        if (this.state.isPlaying) {
            this.audioProcessor.stop();
        }
    }

    handleVolumeChange() {
        const volume = parseInt(this.elements.volumeSlider?.value || 100);
        this.state.volume = volume;
        this.audioProcessor.setVolume(volume / 100);

        if (this.elements.volumeValue) {
            this.elements.volumeValue.textContent = `${volume}%`;
        }
    }

    downloadSound() {
        if (!this.validateDuration()) {
            this.showToast(this.t('step2.duration', {}, 'Duration must be 2-5 seconds'), 'error');
            return;
        }

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            this.fileSystem.downloadFile(wavBlob, 'LockChime.wav');
            this.showToast(this.t('success.downloaded', {}, 'File downloaded!'), 'success');
        } catch (error) {
            this.showToast(this.t('error.downloadFailed', {}, 'Could not download file.'), 'error');
        }
    }

    async saveToUsb() {
        if (!this.validateDuration()) {
            this.showToast(this.t('step2.duration', {}, 'Duration must be 2-5 seconds'), 'error');
            return;
        }

        this.showLoading(this.t('status.processing', {}, 'Processing audio...'));

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            this.showLoading(this.t('status.saving', {}, 'Saving to USB...'));

            const result = await this.fileSystem.saveFile(wavBlob, 'LockChime.wav');

            if (result.success) {
                this.hideLoading();
                this.incrementWeeklyAction('save');
                this.showSuccessModal();
            } else if (!result.cancelled) {
                throw new Error(result.message);
            } else {
                this.hideLoading();
            }
        } catch (error) {
            this.hideLoading();

            if (confirm(`${this.t('error.saveFailed', {}, 'Could not save directly')}: ${error.message}\n\n${this.t('prompt.downloadInstead', {}, 'Would you like to download the file instead?')}`)) {
                this.downloadSound();
            }
        }
    }

    async shareToGallery() {
        if (!this.gallery.isAvailable()) {
            this.showToast(this.t('error.galleryUnavailable', {}, 'Gallery is not available. Please try again later.'), 'error');
            return;
        }

        if (!this.validateDuration()) {
            this.showToast(this.t('step2.duration', {}, 'Duration must be 2-5 seconds'), 'error');
            return;
        }

        const name = prompt(this.t('v2.nameYourSound', {}, 'Name your sound:'), this.state.selectedSoundName);
        if (!name) return;

        this.showLoading(this.t('status.uploading', {}, 'Uploading to gallery...'));

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            await this.gallery.uploadSound(wavBlob, {
                name: name.trim(),
                category: 'custom',
                duration: this.state.trimEnd - this.state.trimStart
            });

            this.hideLoading();
            this.showToast(this.t('success.uploaded', {}, 'Sound uploaded to gallery!'), 'success');
            this.incrementWeeklyAction('share');
            await this.loadGallerySounds();
            await this.loadWeeklyRanking();
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('v2.uploadFailed', {}, 'Upload failed'), 'error');
        }
    }

    async connectFleetApi() {
        const token = this.elements.fleetTokenInput?.value?.trim() || '';
        const baseUrl = this.elements.fleetBaseUrlInput?.value?.trim();

        if (!token) {
            this.setFleetMessage(this.t('v2.fleet.enterToken', {}, 'Please enter a Tesla Fleet access token.'), true);
            return;
        }

        this.fleetClient.setToken(token);
        if (baseUrl) {
            this.fleetClient.setBaseUrl(baseUrl);
        }

        this.setFleetMessage(this.t('v2.fleet.connecting', {}, 'Connecting to Tesla Fleet API...'));

        try {
            const vehicles = await this.fleetClient.getVehicles();
            this.state.fleetVehicles = vehicles.map(v => this.featureUtils.normalizeVehicle(v));
            this.populateVehicleSelect();

            if (this.state.fleetVehicles.length === 0) {
                this.setFleetMessage(this.t('v2.fleet.noVehicles', {}, 'Connected, but no vehicles were returned for this account.'), true);
                return;
            }

            this.setFleetMessage(this.t('v2.fleet.connectedCount', { count: this.state.fleetVehicles.length }, `Connected: ${this.state.fleetVehicles.length} vehicle(s) loaded.`));
        } catch (error) {
            this.setFleetMessage(this.t('v2.fleet.connectionFailed', { error: error.message }, `Connection failed: ${error.message}`), true);
        }
    }

    populateVehicleSelect() {
        const select = this.elements.fleetVehicleSelect;
        if (!select) return;

        const vehicles = this.state.fleetVehicles || [];
        if (vehicles.length === 0) {
            select.innerHTML = `<option value=\"\">${this.escapeHtml(this.t('v2.fleet.noVehiclesOption', {}, 'No vehicles'))}</option>`;
            return;
        }

        select.innerHTML = vehicles.map(vehicle =>
            `<option value=\"${this.escapeHtml(vehicle.vin)}\">${this.escapeHtml(vehicle.displayName)} (${this.escapeHtml(vehicle.vin.slice(-6))})</option>`
        ).join('');

        this.state.currentVehicleVin = vehicles[0].vin;
        select.value = vehicles[0].vin;
        select.onchange = () => {
            this.state.currentVehicleVin = select.value;
        };
    }

    async checkFleetCompatibility() {
        const vin = this.elements.fleetVehicleSelect?.value || this.state.currentVehicleVin;
        if (!vin) {
            this.setFleetMessage(this.t('v2.fleet.selectVehicle', {}, 'Select a vehicle first.'), true);
            return;
        }

        const vehicle = (this.state.fleetVehicles || []).find(v => v.vin === vin);
        if (!vehicle) {
            this.setFleetMessage(this.t('v2.fleet.vehicleUnavailable', {}, 'Selected vehicle is not available.'), true);
            return;
        }

        this.setFleetMessage(this.t('v2.fleet.checking', {}, 'Checking compatibility...'));

        try {
            const status = await this.fleetClient.getFleetStatus(vin);
            const result = this.featureUtils.evaluateCompatibility(vehicle, status);
            const reasonText = result.reasons.length > 0
                ? ` ${this.t('v2.fleet.notesPrefix', {}, 'Notes')}: ${result.reasons.join(' ')}`
                : '';
            this.setFleetMessage(
                result.ready
                    ? this.t('v2.fleet.compatible', { name: vehicle.displayName, notes: reasonText }, `Compatible: ${vehicle.displayName} is likely ready for custom lock chimes.${reasonText}`)
                    : this.t('v2.fleet.needsAttention', { name: vehicle.displayName, notes: reasonText }, `Needs attention: ${vehicle.displayName} may need additional checks.${reasonText}`),
                !result.ready
            );
        } catch (error) {
            this.setFleetMessage(this.t('v2.fleet.checkFailed', { error: error.message }, `Compatibility check failed: ${error.message}`), true);
        }
    }

    async checkReleaseUpdates() {
        const vin = this.elements.fleetVehicleSelect?.value || this.state.currentVehicleVin;
        if (!vin) {
            this.elements.releaseUpdateMessage.textContent = this.t('v2.release.connectFirst', {}, 'Connect Tesla and select a vehicle first.');
            return;
        }

        try {
            const releaseResponse = await this.fleetClient.getReleaseNotes(vin);
            const latest = Array.isArray(releaseResponse) ? releaseResponse[0] : releaseResponse;
            const currentVersion = latest?.version || latest?.name || latest?.release_version || null;
            const noteText = latest?.notes || latest?.body || JSON.stringify(latest || {});

            const updateInfo = this.featureUtils.detectReleaseUpdate(vin, currentVersion);

            if (!currentVersion) {
                this.elements.releaseUpdateMessage.textContent = this.t('v2.release.noVersion', {}, 'No release version found in response.');
                return;
            }

            if (updateInfo.updated) {
                this.elements.releaseUpdateMessage.textContent = this.t('v2.release.updated', { previous: updateInfo.previous, current: currentVersion }, `Update detected: ${updateInfo.previous} -> ${currentVersion}`);
            } else {
                this.elements.releaseUpdateMessage.textContent = this.t('v2.release.noUpdate', { current: currentVersion }, `No new update detected. Current version: ${currentVersion}`);
            }

            const weekly = await this.gallery.getWeeklyPopular(5);
            const recommendations = this.featureUtils.deriveRecommendationsFromRelease(
                noteText,
                weekly?.sounds || []
            );
            this.renderReleaseRecommendations(recommendations);
        } catch (error) {
            this.elements.releaseUpdateMessage.textContent = this.t('v2.release.failed', { error: error.message }, `Release check failed: ${error.message}`);
        }
    }

    renderReleaseRecommendations(recommendations) {
        if (!this.elements.releaseRecommendations) return;
        this.elements.releaseRecommendations.innerHTML = '';

        recommendations.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.category}: ${item.reason}`;
            this.elements.releaseRecommendations.appendChild(li);
        });
    }

    setFleetMessage(message, isError = false) {
        if (!this.elements.fleetStatusMessage) return;
        this.elements.fleetStatusMessage.textContent = message;
        this.elements.fleetStatusMessage.style.color = isError ? 'var(--color-error)' : 'var(--color-text-secondary)';
    }

    incrementWeeklyAction(type) {
        this.featureUtils.addWeeklyAction(type);
        this.renderChallengeProgress();
    }

    renderChallengeProgress() {
        if (!this.elements.challengeProgress) return;

        const stats = this.featureUtils.getWeeklyActionStats() || { saves: 0, uploads: 0, shares: 0 };
        const progress = this.featureUtils.getChallengeProgress(stats);

        this.elements.challengeProgress.innerHTML = [
            this.t('v2.challenge.saveProgress', { current: stats.saves || 0, target: 2, percent: progress.saveProgress }, `Save to USB: ${stats.saves || 0}/2 (${progress.saveProgress}%)`),
            this.t('v2.challenge.uploadProgress', { current: stats.uploads || 0, target: 1, percent: progress.uploadProgress }, `Upload to Gallery: ${stats.uploads || 0}/1 (${progress.uploadProgress}%)`),
            this.t('v2.challenge.shareProgress', { current: stats.shares || 0, target: 1, percent: progress.shareProgress }, `Share to Gallery: ${stats.shares || 0}/1 (${progress.shareProgress}%)`),
            progress.completed
                ? this.t('v2.challenge.completed', {}, 'Challenge complete. Weekly creator badge unlocked.')
                : this.t('v2.challenge.incomplete', {}, 'Complete all 3 to finish this week.')
        ].map(text => `<div>${this.escapeHtml(text)}</div>`).join('');
    }

    async loadWeeklyRanking() {
        if (!this.elements.weeklyRankingList || !this.gallery.isAvailable()) return;

        try {
            const result = await this.gallery.getWeeklyPopular(5);
            const sounds = result?.sounds || [];

            if (sounds.length === 0) {
                this.elements.weeklyRankingList.innerHTML = `<li>${this.escapeHtml(this.t('v2.ranking.empty', {}, 'No ranking data yet.'))}</li>`;
                return;
            }

            this.elements.weeklyRankingList.innerHTML = sounds.map((sound, index) => {
                const score = ((sound.likes || 0) * 2) + (sound.downloads || 0);
                const label = this.t('v2.ranking.item', { rank: index + 1, name: sound.name, score }, `#${index + 1} ${sound.name} (${score} pts)`);
                return `<li>${this.escapeHtml(label)}</li>`;
            }).join('');
        } catch (error) {
            this.elements.weeklyRankingList.innerHTML = `<li>${this.escapeHtml(this.t('v2.ranking.unavailable', {}, 'Ranking unavailable right now.'))}</li>`;
        }
    }

    saveWorkspaceDraft() {
        const name = this.elements.workspaceDraftName?.value?.trim();
        if (!name) {
            this.showToast(this.t('v2.draft.enterName', {}, 'Enter a draft name first.'), 'error');
            return;
        }

        try {
            this.workspaceStore.saveDraftVersion({
                name,
                source: {
                    id: this.state.selectedSoundId,
                    name: this.state.selectedSoundName,
                    url: this.state.selectedSoundUrl
                },
                trimStart: this.state.trimStart,
                trimEnd: this.state.trimEnd,
                volume: this.state.volume
            });
            this.renderWorkspaceDrafts();
            this.showToast(this.t('v2.draft.saved', {}, 'Draft version saved.'), 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderWorkspaceDrafts() {
        if (!this.elements.workspaceDraftsList) return;
        const drafts = this.workspaceStore.listDrafts();

        if (drafts.length === 0) {
            this.elements.workspaceDraftsList.innerHTML = `<div class=\"workspace-draft-meta\">${this.escapeHtml(this.t('v2.draft.empty', {}, 'No drafts saved yet.'))}</div>`;
            return;
        }

        this.elements.workspaceDraftsList.innerHTML = '';

        drafts.forEach(draft => {
            const latest = draft.versions?.[0];
            const loadLabel = this.t('v2.draft.load', {}, 'Load');
            const deleteLabel = this.t('v2.draft.delete', {}, 'Delete');
            const metaLabel = this.t(
                'v2.draft.meta',
                {
                    versions: draft.versions?.length || 0,
                    start: (latest?.trimStart || 0).toFixed(1),
                    end: (latest?.trimEnd || 0).toFixed(1)
                },
                `Versions: ${draft.versions?.length || 0} | Latest trim: ${(latest?.trimStart || 0).toFixed(1)}s - ${(latest?.trimEnd || 0).toFixed(1)}s`
            );
            const container = document.createElement('div');
            container.className = 'workspace-draft-item';
            container.innerHTML = `
                <div class=\"workspace-draft-row\">
                    <strong>${this.escapeHtml(draft.name)}</strong>
                    <div>
                        <button class=\"btn-secondary\" data-action=\"load\">${this.escapeHtml(loadLabel)}</button>
                        <button class=\"btn-secondary\" data-action=\"delete\">${this.escapeHtml(deleteLabel)}</button>
                    </div>
                </div>
                <div class=\"workspace-draft-meta\">
                    ${this.escapeHtml(metaLabel)}
                </div>
            `;

            container.querySelector('[data-action=\"load\"]')?.addEventListener('click', () => this.applyDraftVersion(draft));
            container.querySelector('[data-action=\"delete\"]')?.addEventListener('click', () => {
                this.workspaceStore.deleteDraft(draft.id);
                this.renderWorkspaceDrafts();
            });

            this.elements.workspaceDraftsList.appendChild(container);
        });
    }

    async applyDraftVersion(draft) {
        const version = draft?.versions?.[0];
        if (!version) return;

        const sourceId = version.source?.id || '';
        if (sourceId && sourceId.startsWith('sound_') && this.gallery.isAvailable()) {
            try {
                const sound = await this.gallery.getSound(sourceId);
                await this.useSound(sound);
            } catch (error) {
                this.showToast(this.t('v2.draft.sourceMissing', {}, 'Could not load draft source from gallery.'), 'error');
                return;
            }
        } else if (sourceId && typeof AUDIO_SAMPLES !== 'undefined' && AUDIO_SAMPLES.some(s => s.id === sourceId)) {
            await this.selectPreset(sourceId);
        }

        this.state.trimStart = Math.max(0, version.trimStart || 0);
        this.state.trimEnd = Math.min(this.state.duration || 5, version.trimEnd || 3);
        this.state.volume = Math.min(100, Math.max(0, version.volume || 100));
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = String(this.state.volume);
            this.elements.volumeValue.textContent = `${this.state.volume}%`;
        }
        this.audioProcessor.setVolume(this.state.volume / 100);
        this.updateTrimUI();
        this.validateDuration();
        this.showToast(this.t('v2.draft.loaded', { name: draft.name }, `Loaded draft: ${draft.name}`), 'success');
    }

    openUploadModal() {
        this.elements.uploadModal?.classList.add('open');
        this.elements.uploadForm.style.display = 'none';
    }

    closeUploadModal() {
        this.elements.uploadModal?.classList.remove('open');
        this.elements.fileInput.value = '';
    }

    async handleFileUpload(file) {
        const maxSize = 10 * 1024 * 1024;
        const validExtensions = ['wav', 'mp3', 'm4a', 'ogg'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (file.size > maxSize) {
            this.showToast(this.t('error.fileTooLarge', {}, 'File is too large. Maximum size is 10MB.'), 'error');
            return;
        }

        if (!validExtensions.includes(ext)) {
            this.showToast(this.t('error.invalidType', {}, 'Invalid file type. Please upload a WAV, MP3, M4A, or OGG file.'), 'error');
            return;
        }

        this.showLoading(this.t('status.processing', {}, 'Processing audio...'));

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadFromFile(file);

            this.state.selectedSoundId = 'upload-' + Date.now();
            this.state.selectedSoundName = file.name.replace(/\.[^/.]+$/, '');
            this.state.selectedSoundUrl = null;
            this.state.duration = this.audioProcessor.getDuration();
            this.state.trimStart = 0;
            this.state.trimEnd = Math.min(this.state.duration, 5);

            this.closeUploadModal();
            this.openEditor();
            this.drawWaveform();
            this.updateTrimUI();
            this.validateDuration();

            this.hideLoading();
            this.showToast(this.t('success.audioUploaded', {}, 'Audio uploaded successfully!'), 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('error.processAudio', {}, 'Could not process audio file. Please try a different file.'), 'error');
        }
    }

    async submitUpload() {
        const name = this.elements.uploadName?.value?.trim();
        const category = this.elements.uploadCategory?.value || 'custom';

        if (!name) {
            this.showToast(this.t('v2.nameRequired', {}, 'Please enter a name'), 'error');
            return;
        }

        this.closeUploadModal();
        this.showLoading(this.t('status.uploading', {}, 'Uploading to gallery...'));

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            await this.gallery.uploadSound(wavBlob, {
                name,
                category,
                duration: this.state.trimEnd - this.state.trimStart
            });

            this.hideLoading();
            this.showToast(this.t('success.uploaded', {}, 'Sound uploaded to gallery!'), 'success');
            this.incrementWeeklyAction('upload');
            await this.loadGallerySounds();
            await this.loadWeeklyRanking();
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('v2.uploadFailed', {}, 'Upload failed'), 'error');
        }
    }

    openCreateModal() {
        this.elements.createModal?.classList.add('open');
    }

    closeCreateModal() {
        this.elements.createModal?.classList.remove('open');
    }

    populatePresets() {
        if (!this.elements.presetGrid || typeof AUDIO_SAMPLES === 'undefined') return;

        this.elements.presetGrid.innerHTML = AUDIO_SAMPLES.slice(0, 6).map(sound => `
            <div class="preset-card" data-sound-id="${sound.id}">
                <div class="preset-icon">${sound.icon}</div>
                <div class="preset-name">${sound.name}</div>
                <div class="preset-duration">${sound.duration.toFixed(1)}s</div>
            </div>
        `).join('');

        this.elements.presetGrid.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', () => this.selectPreset(card.dataset.soundId));
        });
    }

    async selectPreset(soundId) {
        this.showLoading(this.t('status.loading', {}, 'Loading...'));

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadSound(soundId);

            const sound = AUDIO_SAMPLES.find(s => s.id === soundId);

            this.state.selectedSoundId = soundId;
            this.state.selectedSoundName = sound?.name || this.t('v2.presetSound', {}, 'Preset Sound');
            this.state.selectedSoundUrl = null;
            this.state.duration = this.audioProcessor.getDuration();
            this.state.trimStart = 0;
            this.state.trimEnd = Math.min(this.state.duration, 5);

            this.closeCreateModal();
            this.openEditor();
            this.drawWaveform();
            this.updateTrimUI();
            this.validateDuration();

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('error.loadFailed', {}, 'Error loading sound. Please try again.'), 'error');
        }
    }

    showSuccessModal() {
        this.elements.successModal?.classList.add('open');
        this.playSuccessSound();
    }

    closeSuccessModal() {
        this.elements.successModal?.classList.remove('open');
    }

    playSuccessSound() {
        try {
            this.audioProcessor.play(this.state.trimStart, this.state.trimEnd);
        } catch (error) {
        }
    }

    closeAllModals() {
        this.closeUploadModal();
        this.closeCreateModal();
        this.closeSuccessModal();
    }

    async updateStats() {
        if (!this.gallery.isAvailable()) return;

        try {
            const stats = await this.gallery.getStats();
            if (this.elements.statSounds) {
                this.elements.statSounds.textContent = stats.totalSounds || 0;
            }
            if (this.elements.statDownloads) {
                this.elements.statDownloads.textContent = stats.totalDownloads || 0;
            }
        } catch (error) {
        }
    }

    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
        }
        if (this.elements.loadMoreSection) {
            this.elements.loadMoreSection.style.display = 'none';
        }
    }

    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    showLoading(message = this.t('status.loading', {}, 'Loading...')) {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = message;
        }
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appV2 = new TeslaLockSoundAppV2();
});
