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
            searchQuery: ''
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

            languageSelect: document.getElementById('language-select')
        };
    }

    async init() {
        this.waveformCanvas = this.elements.waveformCanvas;
        this.waveformCtx = this.waveformCanvas?.getContext('2d');

        await this.initGallery();
        this.setupEventListeners();
        this.populatePresets();
        this.resizeWaveformCanvas();

        window.addEventListener('resize', () => this.resizeWaveformCanvas());
    }

    async initGallery() {
        const initialized = await this.gallery.init();
        if (initialized) {
            await this.loadGallerySounds();
            await this.updateStats();
        } else {
            this.showEmptyState();
        }
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
            this.showEmptyState();
            return;
        }

        try {
            if (!append) {
                this.elements.soundsGrid.innerHTML = '';
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
            this.showToast('Failed to load sounds', 'error');
        }
    }

    createSoundCard(sound) {
        const card = document.createElement('div');
        card.className = 'sound-card';
        card.dataset.soundId = sound.id;

        const isLiked = this.gallery.isLiked(sound.id);

        card.innerHTML = `
            <div class="sound-card-content">
                <div class="sound-card-header">
                    <div class="sound-card-info">
                        <div class="sound-card-name">${this.escapeHtml(sound.name)}</div>
                        <span class="sound-card-category">${sound.category || 'custom'}</span>
                    </div>
                    <button class="sound-card-play" data-url="${sound.downloadUrl}" title="Preview">
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
                        <button class="btn-use" data-sound-id="${sound.id}">Use</button>
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
            this.showToast('Failed to preview sound', 'error');
        }
    }

    async handleLike(soundId, element) {
        try {
            const { liked } = await this.gallery.likeSound(soundId);
            const count = parseInt(element.textContent.match(/\d+/)?.[0] || 0);
            element.classList.toggle('liked', liked);
            element.innerHTML = `${liked ? '❤️' : '🤍'} ${count + (liked ? 1 : -1)}`;
        } catch (error) {
            this.showToast('Failed to like sound', 'error');
        }
    }

    async useSound(sound) {
        this.showLoading('Loading sound...');

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
            this.showToast('Failed to load sound', 'error');
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

        const wrapper = this.elements.waveformWrapper;
        const width = wrapper.offsetWidth;

        const startPercent = (this.state.trimStart / this.state.duration) * 100;
        const endPercent = (this.state.trimEnd / this.state.duration) * 100;

        this.elements.trimRegion.style.left = `${startPercent}%`;
        this.elements.trimRegion.style.width = `${endPercent - startPercent}%`;

        this.elements.timeStart.textContent = `${this.state.trimStart.toFixed(1)}s`;
        this.elements.timeEnd.textContent = `${this.state.trimEnd.toFixed(1)}s`;

        const duration = this.state.trimEnd - this.state.trimStart;
        this.elements.timeDuration.textContent = `Duration: ${duration.toFixed(1)}s`;
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
                this.elements.statusText.textContent = 'Ready for Tesla (2-5 seconds)';
            } else if (duration < 2) {
                this.elements.statusText.textContent = `Too short (${duration.toFixed(1)}s) - minimum 2s`;
            } else {
                this.elements.statusText.textContent = `Too long (${duration.toFixed(1)}s) - maximum 5s`;
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
            this.showToast('Playback failed', 'error');
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
            this.showToast('Duration must be 2-5 seconds', 'error');
            return;
        }

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            this.fileSystem.downloadFile(wavBlob, 'LockChime.wav');
            this.showToast('Downloaded successfully!', 'success');
        } catch (error) {
            this.showToast('Download failed', 'error');
        }
    }

    async saveToUsb() {
        if (!this.validateDuration()) {
            this.showToast('Duration must be 2-5 seconds', 'error');
            return;
        }

        this.showLoading('Processing audio...');

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.state.trimStart, this.state.trimEnd, {
                normalize: true
            });

            this.showLoading('Saving to USB...');

            const result = await this.fileSystem.saveFile(wavBlob, 'LockChime.wav');

            if (result.success) {
                this.hideLoading();
                this.showSuccessModal();
            } else if (!result.cancelled) {
                throw new Error(result.message);
            } else {
                this.hideLoading();
            }
        } catch (error) {
            this.hideLoading();

            if (confirm(`Could not save directly: ${error.message}\n\nWould you like to download the file instead?`)) {
                this.downloadSound();
            }
        }
    }

    async shareToGallery() {
        if (!this.gallery.isAvailable()) {
            this.showToast('Gallery not available', 'error');
            return;
        }

        if (!this.validateDuration()) {
            this.showToast('Duration must be 2-5 seconds', 'error');
            return;
        }

        const name = prompt('Name your sound:', this.state.selectedSoundName);
        if (!name) return;

        this.showLoading('Uploading to gallery...');

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
            this.showToast('Shared to gallery!', 'success');
            await this.loadGallerySounds();
        } catch (error) {
            this.hideLoading();
            this.showToast('Upload failed', 'error');
        }
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
            this.showToast('File too large (max 10MB)', 'error');
            return;
        }

        if (!validExtensions.includes(ext)) {
            this.showToast('Invalid file type', 'error');
            return;
        }

        this.showLoading('Processing audio...');

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
            this.showToast('Audio loaded!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Could not process audio file', 'error');
        }
    }

    async submitUpload() {
        const name = this.elements.uploadName?.value?.trim();
        const category = this.elements.uploadCategory?.value || 'custom';

        if (!name) {
            this.showToast('Please enter a name', 'error');
            return;
        }

        this.closeUploadModal();
        this.showLoading('Uploading to gallery...');

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
            this.showToast('Uploaded to gallery!', 'success');
            await this.loadGallerySounds();
        } catch (error) {
            this.hideLoading();
            this.showToast('Upload failed', 'error');
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
        this.showLoading('Loading preset...');

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadSound(soundId);

            const sound = AUDIO_SAMPLES.find(s => s.id === soundId);

            this.state.selectedSoundId = soundId;
            this.state.selectedSoundName = sound?.name || 'Preset Sound';
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
            this.showToast('Failed to load preset', 'error');
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

    showLoading(message = 'Loading...') {
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
