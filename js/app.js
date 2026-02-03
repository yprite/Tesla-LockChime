/**
 * Tesla Lock Sound Creator - Main Application
 *
 * Orchestrates the UI flow, audio processing, and file saving.
 */

class TeslaLockSoundApp {
    constructor() {
        // Initialize modules
        this.audioProcessor = new AudioProcessor();
        this.fileSystem = new FileSystemHandler();
        this.gallery = new GalleryHandler();
        this.waveform = null;

        // State
        this.selectedSound = null;
        this.customAudioBlob = null;
        this.customAudioName = null;
        this.trimStart = 0;
        this.trimEnd = 3;

        // DOM elements
        this.elements = {
            // Sections
            stepSelect: document.getElementById('step-select'),
            stepTrim: document.getElementById('step-trim'),
            stepSave: document.getElementById('step-save'),
            stepSuccess: document.getElementById('step-success'),

            // Sound grid
            soundGrid: document.getElementById('sound-grid'),

            // Trim controls
            startTimeInput: document.getElementById('start-time'),
            endTimeInput: document.getElementById('end-time'),
            durationValue: document.getElementById('duration-value'),
            validationMessage: document.getElementById('validation-message'),

            // Volume & Fade controls
            volumeSlider: document.getElementById('volume-slider'),
            volumeValue: document.getElementById('volume-value'),
            fadeInInput: document.getElementById('fade-in'),
            fadeOutInput: document.getElementById('fade-out'),

            // Buttons
            btnPreview: document.getElementById('btn-preview'),
            btnPreviewTrimmed: document.getElementById('btn-preview-trimmed'),
            btnChangeSound: document.getElementById('btn-change-sound'),
            btnSaveUsb: document.getElementById('btn-save-usb'),
            btnCreateAnother: document.getElementById('btn-create-another'),
            btnDownload: document.getElementById('btn-download'),
            btnUploadToGallery: document.getElementById('btn-upload-gallery'),

            // File info
            fileDetails: document.getElementById('file-details'),

            // Loading
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            // Modals
            unsupportedModal: document.getElementById('unsupported-modal'),
            compatibilityNotice: document.getElementById('compatibility-notice'),

            // Trim handles for keyboard nav
            trimStart: document.getElementById('trim-start'),
            trimEnd: document.getElementById('trim-end'),

            // Upload elements
            uploadZone: document.getElementById('upload-zone'),
            fileUpload: document.getElementById('file-upload'),

            // Gallery elements
            gallerySection: document.getElementById('gallery-section'),
            galleryGrid: document.getElementById('gallery-grid'),
            gallerySort: document.getElementById('gallery-sort-select'),
            galleryCategory: document.getElementById('gallery-category-select'),
            gallerySearch: document.getElementById('gallery-search'),
            gallerySearchBtn: document.getElementById('btn-gallery-search'),
            galleryLoadMore: document.getElementById('btn-gallery-load-more'),
            galleryStats: document.getElementById('gallery-stats'),
            galleryEmpty: document.getElementById('gallery-empty'),
            statTotalSounds: document.getElementById('stat-total-sounds'),
            statTotalDownloads: document.getElementById('stat-total-downloads'),

            // Tab navigation
            tabCreate: document.getElementById('tab-create'),
            tabCommunity: document.getElementById('tab-community'),
            panelCreate: document.getElementById('panel-create'),
            panelCommunity: document.getElementById('panel-community'),
            communityCount: document.getElementById('community-count'),

            // Community CTA
            btnBrowseCommunity: document.getElementById('btn-browse-community'),
            featuredSounds: document.getElementById('featured-sounds'),
            btnUploadSoundHero: document.getElementById('btn-upload-sound-hero')
        };

        // Current tab
        this.currentTab = 'create';

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Check browser compatibility
        this.checkCompatibility();

        // Initialize waveform visualizer
        this.waveform = new WaveformVisualizer('waveform-canvas', 'waveform-container');

        // Attach trim handle listeners
        this.waveform.attachEventListeners(
            this.elements.trimStart,
            this.elements.trimEnd,
            document.getElementById('trim-selection')
        );

        // Set up trim change callback
        this.waveform.onTrimChange = (data) => {
            this.trimStart = data.startTime;
            this.trimEnd = data.endTime;
            this.updateTimeInputs();
            this.validateAndUpdateUI();
        };

        // Populate sound grid
        this.populateSoundGrid();

        // Set up event listeners
        this.setupEventListeners();

        // Set up upload functionality
        this.setupUpload();

        // Set up tab navigation
        this.setupTabs();

        // Initialize gallery
        await this.initGallery();

        // Track page view
        this.trackEvent('page_view', { page: 'home' });
    }

    /**
     * Set up tab navigation
     */
    setupTabs() {
        // Tab click handlers
        if (this.elements.tabCreate) {
            this.elements.tabCreate.addEventListener('click', () => this.switchTab('create'));
        }
        if (this.elements.tabCommunity) {
            this.elements.tabCommunity.addEventListener('click', () => this.switchTab('community'));
        }

        // Browse community button in Step 1
        if (this.elements.btnBrowseCommunity) {
            this.elements.btnBrowseCommunity.addEventListener('click', () => this.switchTab('community'));
        }

        // Upload sound button in gallery hero
        if (this.elements.btnUploadSoundHero) {
            this.elements.btnUploadSoundHero.addEventListener('click', () => {
                if (this.selectedSound && this.audioProcessor.getDuration() > 0) {
                    this.uploadToGallery();
                } else {
                    this.switchTab('create');
                    this.showToast('Create a sound first, then upload it to the gallery!', 'info');
                }
            });
        }
    }

    /**
     * Switch between tabs
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        if (this.elements.tabCreate) {
            this.elements.tabCreate.classList.toggle('active', tab === 'create');
            this.elements.tabCreate.setAttribute('aria-selected', tab === 'create');
        }
        if (this.elements.tabCommunity) {
            this.elements.tabCommunity.classList.toggle('active', tab === 'community');
            this.elements.tabCommunity.setAttribute('aria-selected', tab === 'community');
        }

        // Update panels
        if (this.elements.panelCreate) {
            this.elements.panelCreate.classList.toggle('active', tab === 'create');
            this.elements.panelCreate.style.display = tab === 'create' ? 'block' : 'none';
        }
        if (this.elements.panelCommunity) {
            this.elements.panelCommunity.classList.toggle('active', tab === 'community');
            this.elements.panelCommunity.style.display = tab === 'community' ? 'block' : 'none';
        }

        // Load gallery if switching to community tab
        if (tab === 'community' && this.gallery.isAvailable()) {
            this.loadGallerySounds(false);
        }

        this.trackEvent('tab_switch', { tab });
    }

    /**
     * Initialize gallery functionality
     */
    async initGallery() {
        const initialized = await this.gallery.init();

        if (initialized) {
            // Load featured sounds for the CTA
            await this.loadFeaturedSounds();

            // Setup gallery event listeners
            this.setupGalleryListeners();

            // Update community count badge
            await this.updateCommunityBadge();
        } else {
            // Hide community elements if gallery not available
            if (this.elements.tabCommunity) {
                this.elements.tabCommunity.style.display = 'none';
            }
            const communityCta = document.getElementById('community-cta');
            if (communityCta) {
                communityCta.style.display = 'none';
            }
        }
    }

    /**
     * Load featured sounds for the CTA section
     */
    async loadFeaturedSounds() {
        if (!this.gallery.isAvailable() || !this.elements.featuredSounds) return;

        try {
            const { sounds } = await this.gallery.getPopularSounds(3);

            if (sounds.length === 0) {
                this.elements.featuredSounds.innerHTML = '<p class="featured-empty">No community sounds yet. Be the first to share!</p>';
                return;
            }

            this.elements.featuredSounds.innerHTML = sounds.map(sound => `
                <div class="featured-sound-card" data-sound-id="${sound.id}">
                    <span class="featured-sound-icon">🎵</span>
                    <div class="featured-sound-info">
                        <div class="featured-sound-name">${this.escapeHtml(sound.name)}</div>
                        <div class="featured-sound-meta">❤️ ${sound.likes || 0} • ⬇️ ${sound.downloads || 0}</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            this.elements.featuredSounds.querySelectorAll('.featured-sound-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.handleGalleryUse(card.dataset.soundId);
                });
            });
        } catch (error) {
            console.error('Failed to load featured sounds:', error);
        }
    }

    /**
     * Update community count badge
     */
    async updateCommunityBadge() {
        if (!this.gallery.isAvailable()) return;

        try {
            const stats = await this.gallery.getStats();
            if (this.elements.communityCount && stats.totalSounds > 0) {
                this.elements.communityCount.textContent = stats.totalSounds;
            }
        } catch (error) {
            console.error('Failed to update community badge:', error);
        }
    }

    /**
     * Load gallery sounds
     */
    async loadGallerySounds(append = false) {
        if (!this.gallery.isAvailable()) return;

        try {
            const sortBy = this.elements.gallerySort?.value || 'createdAt';
            const category = this.elements.galleryCategory?.value || 'all';
            const searchQuery = this.elements.gallerySearch?.value?.trim() || '';

            // Show loading state
            if (!append && this.elements.galleryEmpty) {
                this.elements.galleryEmpty.innerHTML = '<p>Loading community sounds...</p>';
                this.elements.galleryEmpty.style.display = 'block';
            }

            let sounds, hasMore;

            if (searchQuery) {
                // Search mode
                const result = await this.gallery.searchSounds(searchQuery);
                sounds = result.sounds;
                hasMore = false;
            } else {
                // Normal browsing
                const options = {
                    sortBy: sortBy,
                    category: category,
                    startAfter: append ? this.gallery.lastDoc : null
                };

                const result = await this.gallery.getSounds(options);
                sounds = result.sounds;
                hasMore = result.hasMore;
            }

            if (!append) {
                this.elements.galleryGrid.innerHTML = '';
            }

            if (sounds.length === 0 && !append) {
                if (this.elements.galleryEmpty) {
                    this.elements.galleryEmpty.innerHTML = searchQuery
                        ? '<p>No sounds found matching your search.</p>'
                        : '<p>No sounds in this category yet. Be the first to share!</p>';
                    this.elements.galleryEmpty.style.display = 'block';
                }
            } else {
                if (this.elements.galleryEmpty) {
                    this.elements.galleryEmpty.style.display = 'none';
                }

                sounds.forEach(sound => {
                    this.elements.galleryGrid.appendChild(this.createGalleryCard(sound));
                });
            }

            if (this.elements.galleryLoadMore) {
                this.elements.galleryLoadMore.style.display = hasMore ? 'inline-block' : 'none';
            }

            // Update stats in hero section
            const stats = await this.gallery.getStats();
            if (this.elements.statTotalSounds) {
                this.elements.statTotalSounds.textContent = stats.totalSounds;
            }
            if (this.elements.statTotalDownloads) {
                this.elements.statTotalDownloads.textContent = stats.totalDownloads;
            }
            if (this.elements.communityCount && stats.totalSounds > 0) {
                this.elements.communityCount.textContent = stats.totalSounds;
            }
        } catch (error) {
            console.error('Failed to load gallery:', error);
            if (this.elements.galleryEmpty) {
                this.elements.galleryEmpty.innerHTML = '<p>Failed to load gallery. Please try again.</p>';
                this.elements.galleryEmpty.style.display = 'block';
            }
        }
    }

    /**
     * Create a gallery card element
     */
    createGalleryCard(sound) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.dataset.soundId = sound.id;

        const isLiked = this.gallery.isLiked(sound.id);

        card.innerHTML = `
            <div class="gallery-card-header">
                <span class="gallery-card-name">${this.escapeHtml(sound.name)}</span>
                <span class="gallery-card-category">${sound.category}</span>
            </div>
            <div class="gallery-card-meta">
                <span>${sound.duration?.toFixed(1) || '?'}s</span>
                <span>${this.formatFileSize(sound.fileSize)}</span>
            </div>
            <div class="gallery-card-stats">
                <button class="gallery-like-btn ${isLiked ? 'liked' : ''}" data-sound-id="${sound.id}">
                    ${isLiked ? '❤️' : '🤍'} ${sound.likes || 0}
                </button>
                <span>⬇️ ${sound.downloads || 0}</span>
            </div>
            <div class="gallery-card-actions">
                <button class="btn btn-small btn-secondary gallery-preview-btn" data-sound-id="${sound.id}" data-url="${sound.downloadUrl}">
                    ▶ Preview
                </button>
                <button class="btn btn-small btn-primary gallery-use-btn" data-sound-id="${sound.id}">
                    Use This
                </button>
            </div>
        `;

        // Event listeners
        card.querySelector('.gallery-like-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleGalleryLike(sound.id, e.target);
        });

        card.querySelector('.gallery-preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleGalleryPreview(sound.downloadUrl, e.target);
        });

        card.querySelector('.gallery-use-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleGalleryUse(sound.id);
        });

        return card;
    }

    /**
     * Set up gallery event listeners
     */
    setupGalleryListeners() {
        // Sort dropdown
        if (this.elements.gallerySort) {
            this.elements.gallerySort.addEventListener('change', () => {
                this.loadGallerySounds(false);
            });
        }

        // Category dropdown
        if (this.elements.galleryCategory) {
            this.elements.galleryCategory.addEventListener('change', () => {
                this.loadGallerySounds(false);
            });
        }

        // Search button
        if (this.elements.gallerySearchBtn) {
            this.elements.gallerySearchBtn.addEventListener('click', () => {
                this.loadGallerySounds(false);
            });
        }

        // Search input enter key
        if (this.elements.gallerySearch) {
            this.elements.gallerySearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.loadGallerySounds(false);
                }
            });
        }

        // Load more button
        if (this.elements.galleryLoadMore) {
            this.elements.galleryLoadMore.addEventListener('click', () => {
                this.loadGallerySounds(true);
            });
        }

        // Upload to gallery button (in Step 3)
        if (this.elements.btnUploadToGallery) {
            this.elements.btnUploadToGallery.addEventListener('click', () => {
                this.uploadToGallery();
            });
        }
    }

    /**
     * Handle gallery like
     */
    async handleGalleryLike(soundId, button) {
        try {
            const { liked } = await this.gallery.likeSound(soundId);
            button.classList.toggle('liked', liked);
            button.innerHTML = `${liked ? '❤️' : '🤍'} ${parseInt(button.textContent.match(/\d+/)?.[0] || 0) + (liked ? 1 : -1)}`;
        } catch (error) {
            console.error('Like failed:', error);
        }
    }

    /**
     * Handle gallery preview
     */
    async handleGalleryPreview(url, button) {
        const originalText = button.textContent;

        try {
            button.textContent = '⏹ Stop';
            await this.audioProcessor.init();

            const response = await fetch(url);
            const blob = await response.blob();
            await this.audioProcessor.loadFromBlob(blob);

            await this.audioProcessor.play(0, null, () => {
                button.textContent = originalText;
            });
        } catch (error) {
            console.error('Preview failed:', error);
            button.textContent = originalText;
        }
    }

    /**
     * Handle using a gallery sound
     */
    async handleGalleryUse(soundId) {
        this.showLoading('Loading sound from gallery...');

        try {
            const { blob, sound } = await this.gallery.downloadSound(soundId);

            await this.audioProcessor.init();
            await this.audioProcessor.loadFromBlob(blob);

            this.customAudioBlob = blob;
            this.customAudioName = sound.name;
            this.selectedSound = 'gallery-' + soundId;

            const { startTime, endTime } = this.waveform.loadWaveform(this.audioProcessor);
            this.trimStart = startTime;
            this.trimEnd = endTime;

            this.onVolumeChange();
            this.onFadeChange();

            this.updateTimeInputs();
            this.validateAndUpdateUI();
            this.updateAriaValues();

            this.goToStep('trim');
            this.showToast('Sound loaded from gallery!', 'success');
            this.trackEvent('gallery_sound_used', { sound_id: soundId });
        } catch (error) {
            console.error('Failed to use gallery sound:', error);
            this.showError('Failed to load sound from gallery.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Upload current sound to gallery
     */
    async uploadToGallery() {
        if (!this.gallery.isAvailable()) {
            this.showError('Gallery is not available. Please try again later.');
            return;
        }

        const name = prompt('Enter a name for your sound:', this.customAudioName || 'My Custom Sound');
        if (!name) return;

        const category = prompt('Category (classic, modern, futuristic, custom, funny, musical):', 'custom');

        this.showLoading('Uploading to gallery...');

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd, {
                normalize: true
            });

            const result = await this.gallery.uploadSound(wavBlob, {
                name: name,
                category: category || 'custom',
                duration: this.trimEnd - this.trimStart
            });

            this.showToast('Sound uploaded to gallery!', 'success');
            this.trackEvent('gallery_upload', { sound_id: result.soundId });

            // Refresh gallery
            await this.loadGallerySounds(false);
        } catch (error) {
            console.error('Upload failed:', error);
            this.showError('Failed to upload: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Check browser compatibility and show warnings
     */
    checkCompatibility() {
        const status = this.fileSystem.getCompatibilityStatus();

        if (!status.compatible) {
            this.elements.unsupportedModal.style.display = 'flex';
            this.trackEvent('incompatible_browser', { reason: status.reason, browser: status.browserName });
            return;
        }
    }

    /**
     * Populate the sound selection grid
     */
    populateSoundGrid() {
        const grid = this.elements.soundGrid;
        grid.innerHTML = '';

        AUDIO_SAMPLES.forEach((sound, index) => {
            const card = document.createElement('div');
            card.className = 'sound-card';
            card.dataset.soundId = sound.id;
            card.setAttribute('role', 'option');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `${sound.name}, ${sound.duration} seconds, ${sound.description}`);

            card.innerHTML = `
                <div class="sound-card-icon" aria-hidden="true">${sound.icon}</div>
                <div class="sound-card-name">${sound.name}</div>
                <div class="sound-card-duration">${sound.duration.toFixed(1)}s</div>
                <span class="sound-card-category">${sound.category}</span>
                <button class="sound-card-preview" data-sound-id="${sound.id}" aria-label="Preview ${sound.name}">
                    ▶ Preview
                </button>
            `;

            // Card click selects the sound
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('sound-card-preview')) return;
                this.selectSound(sound.id);
            });

            // Keyboard support for selection
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectSound(sound.id);
                }
            });

            // Preview button
            const previewBtn = card.querySelector('.sound-card-preview');
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previewSoundInGrid(sound.id, previewBtn);
            });

            grid.appendChild(card);
        });
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Preview buttons
        this.elements.btnPreview.addEventListener('click', () => this.playFull());
        this.elements.btnPreviewTrimmed.addEventListener('click', () => this.playTrimmed());

        // Change sound button
        this.elements.btnChangeSound.addEventListener('click', () => this.goToStep('select'));

        // Time inputs
        this.elements.startTimeInput.addEventListener('change', () => this.onTimeInputChange());
        this.elements.endTimeInput.addEventListener('change', () => this.onTimeInputChange());

        // Volume control
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', () => this.onVolumeChange());
        }

        // Fade controls
        if (this.elements.fadeInInput) {
            this.elements.fadeInInput.addEventListener('change', () => this.onFadeChange());
        }
        if (this.elements.fadeOutInput) {
            this.elements.fadeOutInput.addEventListener('change', () => this.onFadeChange());
        }

        // Keyboard navigation for trim handles
        this.setupTrimKeyboardNav();

        // Waveform trim change via DOM event
        document.getElementById('waveform-container').addEventListener('trimchange', (e) => {
            this.trimStart = e.detail.startTime;
            this.trimEnd = e.detail.endTime;
            this.updateTimeInputs();
            this.validateAndUpdateUI();
        });

        // Save button
        this.elements.btnSaveUsb.addEventListener('click', () => this.saveToUsb());

        // Download button
        if (this.elements.btnDownload) {
            this.elements.btnDownload.addEventListener('click', () => this.downloadFile());
        }

        // Create another button
        this.elements.btnCreateAnother.addEventListener('click', () => this.reset());

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Spacebar to play/stop when focused on main content
            if (e.key === ' ' && e.target === document.body) {
                e.preventDefault();
                if (this.audioProcessor.isPlaying) {
                    this.audioProcessor.stop();
                } else if (this.selectedSound) {
                    this.playTrimmed();
                }
            }
        });
    }

    /**
     * Set up keyboard navigation for trim handles
     */
    setupTrimKeyboardNav() {
        const handleKeydown = (handle, isStart) => {
            handle.addEventListener('keydown', (e) => {
                const step = e.shiftKey ? 0.5 : 0.1;
                const duration = this.audioProcessor.getDuration();

                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (isStart) {
                        this.trimStart = Math.max(0, this.trimStart - step);
                    } else {
                        this.trimEnd = Math.max(this.trimStart + 0.5, this.trimEnd - step);
                    }
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (isStart) {
                        this.trimStart = Math.min(this.trimEnd - 0.5, this.trimStart + step);
                    } else {
                        this.trimEnd = Math.min(duration, this.trimEnd + step);
                    }
                }

                this.waveform.setTrimTimes(this.trimStart, this.trimEnd);
                this.updateTimeInputs();
                this.validateAndUpdateUI();
                this.updateAriaValues();
            });
        };

        if (this.elements.trimStart) {
            handleKeydown(this.elements.trimStart, true);
        }
        if (this.elements.trimEnd) {
            handleKeydown(this.elements.trimEnd, false);
        }
    }

    /**
     * Update ARIA values for trim handles
     */
    updateAriaValues() {
        const duration = this.audioProcessor.getDuration() || 1;
        const startPercent = Math.round((this.trimStart / duration) * 100);
        const endPercent = Math.round((this.trimEnd / duration) * 100);

        if (this.elements.trimStart) {
            this.elements.trimStart.setAttribute('aria-valuenow', startPercent);
            this.elements.trimStart.setAttribute('aria-valuetext', `Start at ${this.trimStart.toFixed(1)} seconds`);
        }
        if (this.elements.trimEnd) {
            this.elements.trimEnd.setAttribute('aria-valuenow', endPercent);
            this.elements.trimEnd.setAttribute('aria-valuetext', `End at ${this.trimEnd.toFixed(1)} seconds`);
        }
    }

    /**
     * Set up file upload functionality
     */
    setupUpload() {
        const uploadZone = this.elements.uploadZone;
        const fileInput = this.elements.fileUpload;

        if (!uploadZone || !fileInput) return;

        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    /**
     * Handle uploaded file
     */
    async handleFileUpload(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/x-wav'];

        if (file.size > maxSize) {
            this.showError('File is too large. Maximum size is 10MB.');
            return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['wav', 'mp3', 'm4a', 'ogg'];

        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            this.showError('Invalid file type. Please upload a WAV, MP3, M4A, or OGG file.');
            return;
        }

        this.showLoading('Processing audio...');

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadFromFile(file);

            this.customAudioBlob = file;
            this.customAudioName = file.name.replace(/\.[^/.]+$/, '');
            this.selectedSound = 'custom-upload';

            const { startTime, endTime } = this.waveform.loadWaveform(this.audioProcessor);
            this.trimStart = startTime;
            this.trimEnd = endTime;

            this.onVolumeChange();
            this.onFadeChange();

            this.updateTimeInputs();
            this.validateAndUpdateUI();
            this.updateAriaValues();

            this.goToStep('trim');

            this.trackEvent('sound_uploaded', { file_type: ext, file_size: file.size });
            this.showToast('Audio uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Could not process audio file. Please try a different file.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Download the file
     */
    downloadFile() {
        try {
            const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd, {
                normalize: true
            });

            this.fileSystem.downloadFile(wavBlob, 'LockChime.wav');
            this.showToast('File downloaded!', 'success');
            this.trackEvent('sound_downloaded', { sound_id: this.selectedSound });
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Could not download file.');
        }
    }

    /**
     * Get display name for current sound
     */
    getSoundDisplayName() {
        if (this.customAudioName) return this.customAudioName;
        if (this.selectedSound) {
            const sound = AUDIO_SAMPLES.find(s => s.id === this.selectedSound);
            return sound ? sound.name : 'Custom Sound';
        }
        return 'Custom Sound';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Handle volume slider change
     */
    onVolumeChange() {
        if (!this.elements.volumeSlider) return;
        const volume = parseInt(this.elements.volumeSlider.value) / 100;
        this.audioProcessor.setVolume(volume);

        if (this.elements.volumeValue) {
            this.elements.volumeValue.textContent = `${this.elements.volumeSlider.value}%`;
        }
    }

    /**
     * Handle fade input changes
     */
    onFadeChange() {
        const fadeIn = parseFloat(this.elements.fadeInInput?.value) || 0;
        const fadeOut = parseFloat(this.elements.fadeOutInput?.value) || 0;

        this.audioProcessor.setFadeIn(fadeIn);
        this.audioProcessor.setFadeOut(fadeOut);
    }

    /**
     * Preview a sound from the selection grid
     */
    async previewSoundInGrid(soundId, button) {
        const originalText = button.textContent;
        button.textContent = '⏹ Stop';
        button.setAttribute('aria-label', 'Stop preview');

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadSound(soundId);
            await this.audioProcessor.play(0, null, () => {
                button.textContent = originalText;
                button.setAttribute('aria-label', `Preview ${soundId}`);
            });

            this.trackEvent('sound_preview', { sound_id: soundId });
        } catch (error) {
            console.error('Preview error:', error);
            button.textContent = originalText;
            this.showError('Could not play audio. Please check your audio settings.');
        }
    }

    /**
     * Select a sound and proceed to trim step
     */
    async selectSound(soundId) {
        this.selectedSound = soundId;

        document.querySelectorAll('.sound-card').forEach(card => {
            const isSelected = card.dataset.soundId === soundId;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-selected', isSelected);
        });

        this.showLoading('Loading sound...');

        try {
            await this.audioProcessor.loadSound(soundId);

            const { startTime, endTime } = this.waveform.loadWaveform(this.audioProcessor);
            this.trimStart = startTime;
            this.trimEnd = endTime;

            this.onVolumeChange();
            this.onFadeChange();

            this.updateTimeInputs();
            this.validateAndUpdateUI();
            this.updateAriaValues();

            this.goToStep('trim');

            this.trackEvent('sound_selected', { sound_id: soundId });
        } catch (error) {
            console.error('Error loading sound:', error);
            this.showError('Error loading sound. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle time input changes
     */
    onTimeInputChange() {
        const start = parseFloat(this.elements.startTimeInput.value) || 0;
        const end = parseFloat(this.elements.endTimeInput.value) || 0;

        this.trimStart = Math.max(0, Math.min(start, this.audioProcessor.getDuration()));
        this.trimEnd = Math.max(this.trimStart + 0.1, Math.min(end, this.audioProcessor.getDuration()));

        this.waveform.setTrimTimes(this.trimStart, this.trimEnd);
        this.updateTimeInputs();
        this.validateAndUpdateUI();
        this.updateAriaValues();
    }

    /**
     * Update time inputs to reflect current trim state
     */
    updateTimeInputs() {
        this.elements.startTimeInput.value = this.trimStart.toFixed(1);
        this.elements.endTimeInput.value = this.trimEnd.toFixed(1);

        const duration = this.trimEnd - this.trimStart;
        this.elements.durationValue.textContent = duration.toFixed(1);
    }

    /**
     * Validate duration and update UI
     */
    validateAndUpdateUI() {
        const validation = this.audioProcessor.validateForTesla
            ? this.audioProcessor.validateForTesla(this.trimStart, this.trimEnd)
            : this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);

        const messageEl = this.elements.validationMessage;

        const isValid = validation.valid !== undefined ? validation.valid : validation.duration?.valid;
        const message = validation.messages
            ? validation.messages.join(' | ')
            : validation.message;

        if (isValid) {
            messageEl.className = 'validation-message success';
            messageEl.textContent = message;
            this.elements.stepSave.style.display = 'block';
        } else {
            messageEl.className = 'validation-message error';
            messageEl.textContent = message;
            this.elements.stepSave.style.display = 'none';
        }

        const fileSize = this.audioProcessor.estimateFileSize(this.trimStart, this.trimEnd);
        this.elements.fileDetails.textContent = `WAV • Mono • ~${this.audioProcessor.formatFileSize(fileSize)}`;
    }

    /**
     * Play the full sound
     */
    async playFull() {
        this.audioProcessor.stop();
        this.waveform.stopPlayheadAnimation();

        const duration = this.audioProcessor.getDuration();

        try {
            await this.audioProcessor.play(0, null, () => {
                this.waveform.hidePlayhead();
                this.elements.btnPreview.innerHTML = '<span class="btn-icon" aria-hidden="true">▶</span> Preview';
            });

            this.elements.btnPreview.innerHTML = '<span class="btn-icon" aria-hidden="true">⏹</span> Stop';
            this.waveform.animatePlayhead(0, duration);
        } catch (error) {
            console.error('Playback error:', error);
            this.showError('Could not play audio.');
        }
    }

    /**
     * Play the trimmed portion
     */
    async playTrimmed() {
        this.audioProcessor.stop();
        this.waveform.stopPlayheadAnimation();

        const duration = this.trimEnd - this.trimStart;

        try {
            await this.audioProcessor.play(this.trimStart, this.trimEnd, () => {
                this.waveform.hidePlayhead();
                this.elements.btnPreviewTrimmed.innerHTML = '<span class="btn-icon" aria-hidden="true">▶</span> Preview Trimmed';
            });

            this.elements.btnPreviewTrimmed.innerHTML = '<span class="btn-icon" aria-hidden="true">⏹</span> Stop';
            this.waveform.animatePlayhead(this.trimStart, duration);
        } catch (error) {
            console.error('Playback error:', error);
            this.showError('Could not play audio.');
        }
    }

    /**
     * Save the trimmed audio to USB
     */
    async saveToUsb() {
        const validation = this.audioProcessor.validateForTesla
            ? this.audioProcessor.validateForTesla(this.trimStart, this.trimEnd)
            : this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);

        const isValid = validation.valid !== undefined ? validation.valid : true;

        if (!isValid) {
            this.showError(validation.messages?.join('\n') || validation.message);
            return;
        }

        this.showLoading('Processing audio...');

        try {
            const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd, {
                normalize: true
            });

            this.showLoading('Saving to USB...');

            const result = await this.fileSystem.saveFile(wavBlob, 'LockChime.wav');

            if (result.success) {
                this.goToStep('success');
                this.trackEvent('sound_saved', {
                    sound_id: this.selectedSound,
                    duration: (this.trimEnd - this.trimStart).toFixed(1)
                });
            } else if (result.cancelled) {
                // User cancelled
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save error:', error);

            if (confirm(`Could not save directly: ${error.message}\n\nWould you like to download the file instead?`)) {
                try {
                    const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd);
                    this.fileSystem.downloadFile(wavBlob, 'LockChime.wav');
                    this.goToStep('success');
                    this.trackEvent('sound_downloaded_fallback', { sound_id: this.selectedSound });
                } catch (downloadError) {
                    this.showError('Could not download file. Please try again.');
                }
            }
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Navigate to a step
     */
    goToStep(step) {
        this.audioProcessor.stop();
        this.waveform?.stopPlayheadAnimation();

        this.elements.stepSelect.style.display = 'none';
        this.elements.stepTrim.style.display = 'none';
        this.elements.stepSave.style.display = 'none';
        this.elements.stepSuccess.style.display = 'none';

        switch (step) {
            case 'select':
                this.elements.stepSelect.style.display = 'block';
                const firstCard = this.elements.soundGrid.querySelector('.sound-card');
                if (firstCard) firstCard.focus();
                break;
            case 'trim':
                this.elements.stepSelect.style.display = 'block';
                this.elements.stepTrim.style.display = 'block';
                const validation = this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);
                if (validation.valid) {
                    this.elements.stepSave.style.display = 'block';
                }
                break;
            case 'success':
                this.elements.stepSuccess.style.display = 'block';
                this.announceToScreenReader('Your custom lock sound has been saved successfully.');
                break;
        }
    }

    /**
     * Reset the app to initial state
     */
    reset() {
        this.selectedSound = null;
        this.trimStart = 0;
        this.trimEnd = 3;

        document.querySelectorAll('.sound-card').forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-selected', 'false');
        });

        this.elements.validationMessage.className = 'validation-message';
        this.elements.validationMessage.textContent = '';

        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = 100;
            this.onVolumeChange();
        }
        if (this.elements.fadeInInput) this.elements.fadeInInput.value = 0;
        if (this.elements.fadeOutInput) this.elements.fadeOutInput.value = 0;
        this.onFadeChange();

        this.goToStep('select');
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Processing...') {
        this.elements.loadingText.textContent = message;
        this.elements.loadingOverlay.style.display = 'flex';
        this.announceToScreenReader(message);
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
        this.trackEvent('error', { message });
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';

        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, params = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }

        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Analytics:', eventName, params);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TeslaLockSoundApp();
});
