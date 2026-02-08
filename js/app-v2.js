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
        this.workspaceStore = (typeof WorkspaceStore !== 'undefined') ? new WorkspaceStore() : {
            listDrafts: () => [],
            saveDraftVersion: () => { throw new Error('Workspace unavailable'); },
            deleteDraft: () => {}
        };
        this.analytics = (typeof window !== 'undefined' && window.AnalyticsTracker)
            ? new window.AnalyticsTracker()
            : {
                setDatabaseFromGallery: () => {},
                trackReturnSession7d: () => {},
                shouldTrackTrimComplete: () => false,
                track: () => {}
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
            ownerProfile: this.getDefaultOwnerProfile(),
            challengeModel: 'modely',
            signaturePack: [],
            badgeState: this.loadBadgeState(),
            authUser: null
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
            uploadModel: document.getElementById('upload-model-v2'),
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
            badgeCard: document.getElementById('badge-card'),
            headerProfileText: document.getElementById('header-profile-text'),
            btnAuthLogin: document.getElementById('btn-auth-login'),
            btnAuthLogout: document.getElementById('btn-auth-logout'),
            challengeModelSelect: document.getElementById('challenge-model-select'),
            challengeTargetText: document.getElementById('challenge-target-text'),
            challengeProgress: document.getElementById('challenge-progress'),
            weeklyRankingList: document.getElementById('weekly-ranking-list'),
            badgeAuthHint: document.getElementById('badge-auth-hint'),
            badgeSummary: document.getElementById('badge-summary'),
            badgeGrid: document.getElementById('badge-grid'),
            chatUrlInput: document.getElementById('chat-url-input'),
            btnChatConnect: document.getElementById('btn-chat-connect'),
            chatStatus: document.getElementById('chat-status'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            btnChatSend: document.getElementById('btn-chat-send'),
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
        this.initAuth();
        this.initChat();
        this.initGrowthFeatures();
        this.setupEventListeners();
        this.populatePresets();
        this.resizeWaveformCanvas();
        this.analytics.setDatabaseFromGallery(this.gallery);
        this.analytics.trackReturnSession7d();
        this.trackEvent('landing_view', { page: 'home_v2' });

        window.addEventListener('resize', () => this.resizeWaveformCanvas());
    }

    t(key, params = {}, fallback = key) {
        const i18nApi = window.i18n;
        if (i18nApi && typeof i18nApi.t === 'function') {
            return i18nApi.t(key, params);
        }
        return fallback;
    }

    getDefaultOwnerProfile() {
        return {
            nickname: '',
            model: 'modely',
            color: 'white',
            trim: 'long_range'
        };
    }

    getStorageJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    setStorageJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    normalizeModel(modelCode) {
        const allowed = ['model3', 'modely', 'models', 'modelx', 'cybertruck', 'roadster'];
        return allowed.includes(modelCode) ? modelCode : 'modely';
    }

    getModelLabel(modelCode) {
        const labels = {
            model3: 'Model 3',
            modely: 'Model Y',
            models: 'Model S',
            modelx: 'Model X',
            cybertruck: 'Cybertruck',
            roadster: 'Roadster'
        };
        return labels[this.normalizeModel(modelCode)] || 'Model Y';
    }

    getCurrentWeekKey() {
        const now = new Date();
        const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = utcDate.getUTCDay() || 7;
        utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
        return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    getChallengeTargets(modelCode) {
        const model = this.normalizeModel(modelCode);
        const mapping = {
            model3: { saves: 2, uploads: 1, shares: 1 },
            modely: { saves: 2, uploads: 1, shares: 1 },
            models: { saves: 1, uploads: 1, shares: 1 },
            modelx: { saves: 1, uploads: 2, shares: 1 },
            cybertruck: { saves: 2, uploads: 1, shares: 2 },
            roadster: { saves: 1, uploads: 1, shares: 1 }
        };
        return mapping[model] || mapping.modely;
    }

    getChallengeProgress(stats, targets) {
        const safeStats = stats || { saves: 0, uploads: 0, shares: 0 };
        const safeTargets = targets || this.getChallengeTargets(this.state.challengeModel);
        const saveProgress = Math.min(100, Math.round(((safeStats.saves || 0) / safeTargets.saves) * 100));
        const uploadProgress = Math.min(100, Math.round(((safeStats.uploads || 0) / safeTargets.uploads) * 100));
        const shareProgress = Math.min(100, Math.round(((safeStats.shares || 0) / safeTargets.shares) * 100));
        return {
            saveProgress,
            uploadProgress,
            shareProgress,
            completed: saveProgress >= 100 && uploadProgress >= 100 && shareProgress >= 100
        };
    }

    loadOwnerProfile() {
        const saved = this.getStorageJson('owner_profile_v1', this.getDefaultOwnerProfile());
        const profile = {
            nickname: String(saved.nickname || '').slice(0, 30),
            model: this.normalizeModel(saved.model),
            color: String(saved.color || 'white'),
            trim: String(saved.trim || 'long_range')
        };
        this.state.ownerProfile = profile;
        this.state.challengeModel = profile.model;
    }

    persistOwnerProfile(profile) {
        this.state.ownerProfile = {
            nickname: String(profile.nickname || '').slice(0, 30),
            model: this.normalizeModel(profile.model),
            color: profile.color || 'white',
            trim: profile.trim || 'long_range'
        };
        this.state.challengeModel = this.state.ownerProfile.model;
        this.setStorageJson('owner_profile_v1', this.state.ownerProfile);
    }

    hydrateGrowthInputs() {
        if (this.elements.ownerNicknameInput) this.elements.ownerNicknameInput.value = this.state.ownerProfile.nickname;
        if (this.elements.ownerModelSelect) this.elements.ownerModelSelect.value = this.state.ownerProfile.model;
        if (this.elements.ownerColorSelect) this.elements.ownerColorSelect.value = this.state.ownerProfile.color;
        if (this.elements.ownerTrimSelect) this.elements.ownerTrimSelect.value = this.state.ownerProfile.trim;
        if (this.elements.challengeModelSelect) this.elements.challengeModelSelect.value = this.state.challengeModel;
        if (this.elements.uploadModel) this.elements.uploadModel.value = this.state.challengeModel;
    }

    readOwnerProfileFromInputs() {
        return {
            nickname: this.elements.ownerNicknameInput?.value?.trim() || '',
            model: this.elements.ownerModelSelect?.value || this.state.ownerProfile.model,
            color: this.elements.ownerColorSelect?.value || this.state.ownerProfile.color,
            trim: this.elements.ownerTrimSelect?.value || this.state.ownerProfile.trim
        };
    }

    handleOwnerProfileSave() {
        this.persistOwnerProfile(this.readOwnerProfileFromInputs());
        this.hydrateGrowthInputs();
        this.generateSignaturePack(false);
        this.renderSignaturePack();
        this.renderChallengeProgress();
        this.loadWeeklyRanking();
        this.showToast(this.t('v2.signature.profileSaved', {}, 'Profile saved.'), 'success');
    }

    handleChallengeModelChanged() {
        const nextModel = this.normalizeModel(this.elements.challengeModelSelect?.value || this.state.challengeModel);
        this.state.challengeModel = nextModel;
        this.state.ownerProfile.model = nextModel;
        if (this.elements.ownerModelSelect) this.elements.ownerModelSelect.value = nextModel;
        if (this.elements.uploadModel) this.elements.uploadModel.value = nextModel;
        this.setStorageJson('owner_profile_v1', this.state.ownerProfile);
        this.renderChallengeProgress();
        this.loadWeeklyRanking();
    }

    handleGeneratePack() {
        this.persistOwnerProfile(this.readOwnerProfileFromInputs());
        this.generateSignaturePack(true);
        this.renderSignaturePack();
        this.renderBadges();
    }

    generateSignaturePack(trackUnlock = false) {
        const profile = this.state.ownerProfile;
        const allSounds = (typeof AUDIO_SAMPLES !== 'undefined' && Array.isArray(AUDIO_SAMPLES)) ? AUDIO_SAMPLES : [];
        const preferred = new Set();

        const colorBias = {
            red: ['futuristic', 'modern'],
            black: ['classic', 'modern'],
            white: ['classic', 'futuristic'],
            blue: ['futuristic', 'classic'],
            silver: ['modern', 'classic'],
            gray: ['modern', 'classic']
        };

        const trimBias = {
            performance: ['futuristic', 'modern'],
            plaid: ['futuristic', 'modern'],
            long_range: ['modern', 'classic'],
            foundation: ['futuristic', 'classic'],
            standard: ['classic', 'modern']
        };

        (colorBias[profile.color] || ['modern', 'classic']).forEach(value => preferred.add(value));
        (trimBias[profile.trim] || ['classic']).forEach(value => preferred.add(value));

        const scored = allSounds.map(sound => {
            let score = 0;
            if (preferred.has(sound.category)) score += 4;
            if (profile.trim === 'performance' || profile.trim === 'plaid') {
                if (sound.id.includes('tesla') || sound.id.includes('cyber') || sound.id.includes('futur')) score += 2;
            }
            if (profile.color === 'white' && sound.id.includes('gentle')) score += 1;
            if (profile.color === 'red' && sound.id.includes('electric')) score += 1;
            if (profile.model === 'cybertruck' && sound.id.includes('cyber')) score += 2;
            if (profile.model === 'roadster' && sound.category === 'modern') score += 1;
            return { ...sound, score };
        });

        scored.sort((a, b) => b.score - a.score);
        this.state.signaturePack = scored.slice(0, 3).map((sound, index) => ({
            ...sound,
            rank: index + 1,
            packId: `sig-${profile.model}-${profile.color}-${profile.trim}`
        }));

        if (trackUnlock) {
            this.state.badgeState.packsGenerated = (this.state.badgeState.packsGenerated || 0) + 1;
            this.unlockBadge('signature_stylist');
            this.evaluateBadges();
            this.setStorageJson('owner_badges_v1', this.state.badgeState);
            this.trackEvent('signature_pack_generated', {
                model: profile.model,
                color: profile.color,
                trim: profile.trim
            });
        }
    }

    renderSignaturePack() {
        if (!this.elements.signaturePackList || !this.elements.signaturePackTitle) return;

        const ownerName = this.state.ownerProfile.nickname || this.getModelLabel(this.state.ownerProfile.model);
        this.elements.signaturePackTitle.textContent = this.t(
            'v2.signature.packTitle',
            { owner: ownerName },
            `${ownerName} Signature Sound Pack`
        );

        this.elements.signaturePackList.innerHTML = '';
        this.state.signaturePack.forEach(sound => {
            const li = document.createElement('li');
            const applyLabel = this.t('v2.signature.apply', {}, 'Use');
            li.innerHTML = `
                <strong>${this.escapeHtml(sound.icon)} ${this.escapeHtml(sound.name)}</strong>
                <button class="btn-secondary" type="button" data-sound-id="${this.escapeHtml(sound.id)}">${this.escapeHtml(applyLabel)}</button>
            `;
            li.querySelector('button')?.addEventListener('click', () => {
                this.selectPreset(sound.id);
                this.trackEvent('signature_pack_applied', { sound_id: sound.id });
            });
            this.elements.signaturePackList.appendChild(li);
        });
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
        this.trackEvent('language_changed', {
            language: (window.i18n && typeof window.i18n.getLanguage === 'function') ? window.i18n.getLanguage() : document.documentElement.lang || 'en'
        });
        this.validateDuration();
        this.updateTrimUI();
        this.renderBadges();
        this.renderWorkspaceDrafts();
        this.loadWeeklyRanking();
        this.renderChallengeProgress();
        this.loadGallerySounds();
        this.setChatConnectedUi(Boolean(this.chatSocket && this.chatSocket.readyState === 1));
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
        this.renderChallengeProgress();
        this.renderBadges();
        this.renderWorkspaceDrafts();
        this.loadWeeklyRanking();
    }

    setupEventListeners() {
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
        this.elements.btnSaveDraft?.addEventListener('click', () => this.saveWorkspaceDraft());
        this.elements.btnAuthLogin?.addEventListener('click', () => this.signInWithGoogle());
        this.elements.btnAuthLogout?.addEventListener('click', () => this.signOutAuth());
        this.elements.challengeModelSelect?.addEventListener('change', () => this.handleChallengeModelChanged());
        this.elements.btnChatConnect?.addEventListener('click', () => this.connectChat());
        this.elements.btnChatSend?.addEventListener('click', () => this.sendChatMessage());
        this.elements.chatInput?.addEventListener('compositionstart', () => {
            this.chatInputComposing = true;
        });
        this.elements.chatInput?.addEventListener('compositionend', () => {
            this.chatInputComposing = false;
        });
        this.elements.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.isComposing || this.chatInputComposing || e.keyCode === 229) {
                    return;
                }
                e.preventDefault();
                this.sendChatMessage();
            }
        });
    }

    initAuth() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            if (this.elements.headerProfileText) {
                this.elements.headerProfileText.textContent = this.t('v2.auth.unavailable', {}, 'Auth unavailable in this environment.');
            }
            this.setAuthVisibility(false);
            return;
        }

        firebase.auth().onAuthStateChanged((user) => {
            this.state.authUser = user || null;
            this.renderAuthStatus();
        });
    }

    renderAuthStatus() {
        if (!this.elements.headerProfileText) return;

        if (this.state.authUser) {
            const name = this.state.authUser.displayName || this.state.authUser.email || this.state.authUser.uid;
            this.elements.headerProfileText.textContent = this.t(
                'v2.auth.signedInAs',
                { name },
                `Signed in as ${name}`
            );
            this.setAuthVisibility(true);
        } else {
            this.elements.headerProfileText.textContent = this.t('v2.auth.signedOut', {}, 'Sign in to sync profile across devices.');
            this.setAuthVisibility(false);
        }
    }

    setAuthVisibility(isSignedIn) {
        if (this.elements.btnAuthLogin) this.elements.btnAuthLogin.style.display = isSignedIn ? 'none' : 'inline-flex';
        if (this.elements.btnAuthLogout) this.elements.btnAuthLogout.style.display = isSignedIn ? 'inline-flex' : 'none';

        if (this.elements.badgeAuthHint) this.elements.badgeAuthHint.style.display = isSignedIn ? 'none' : 'block';
        if (this.elements.badgeSummary) this.elements.badgeSummary.style.display = isSignedIn ? 'block' : 'none';
        if (this.elements.badgeGrid) this.elements.badgeGrid.style.display = isSignedIn ? 'grid' : 'none';
    }

    async signInWithGoogle() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            this.showToast(this.t('v2.auth.unavailable', {}, 'Auth unavailable in this environment.'), 'error');
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();

        try {
            await firebase.auth().signInWithPopup(provider);
            this.showToast(this.t('v2.auth.loginSuccess', {}, 'Signed in successfully.'), 'success');
            this.trackEvent('oauth_login_success', { provider: 'google' });
        } catch (error) {
            const popupFallbackCodes = new Set([
                'auth/popup-blocked',
                'auth/popup-closed-by-user',
                'auth/operation-not-supported-in-this-environment'
            ]);
            if (popupFallbackCodes.has(error?.code) && typeof firebase.auth().signInWithRedirect === 'function') {
                try {
                    await firebase.auth().signInWithRedirect(provider);
                    this.trackEvent('oauth_login_redirect_started', { provider: 'google', from: error.code });
                    return;
                } catch (redirectError) {
                    console.error('OAuth redirect login failed:', redirectError);
                    this.trackEvent('oauth_login_failed', { provider: 'google', error: redirectError.code || 'unknown' });
                }
            } else {
                console.error('OAuth login failed:', error);
                this.trackEvent('oauth_login_failed', { provider: 'google', error: error.code || 'unknown' });
            }

            this.showToast(this.t('v2.auth.loginFailed', {}, 'Could not sign in. Check OAuth provider setup.'), 'error');
        }
    }

    async signOutAuth() {
        if (typeof firebase === 'undefined' || !firebase.auth) return;
        try {
            await firebase.auth().signOut();
            this.showToast(this.t('v2.auth.loggedOut', {}, 'Logged out.'), 'success');
            this.trackEvent('oauth_logout', {});
        } catch (error) {
            this.showToast(this.t('v2.auth.logoutFailed', {}, 'Could not log out.'), 'error');
        }
    }

    initChat() {
        this.chatSocket = null;
        this.chatInputComposing = false;
        if (!this.elements.chatUrlInput || !this.elements.chatStatus || !this.elements.chatMessages) return;

        const configured = (typeof window !== 'undefined' && typeof window.CHAT_WS_ENDPOINT === 'string')
            ? window.CHAT_WS_ENDPOINT.trim()
            : '';
        let storedUrl = localStorage.getItem('chat_ws_url') || '';
        storedUrl = this.normalizeChatUrl(storedUrl);
        const currentHost = window.location.hostname;
        const isLocalPage = currentHost === 'localhost' || currentHost === '127.0.0.1';
        const isStoredLocalSocketUrl = /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(storedUrl);
        const shouldIgnoreStoredUrl = !storedUrl
            || !/^wss?:\/\//i.test(storedUrl)
            || (!isLocalPage && isStoredLocalSocketUrl);

        const initialUrl = shouldIgnoreStoredUrl ? configured : storedUrl;
        if (shouldIgnoreStoredUrl && configured) {
            localStorage.setItem('chat_ws_url', configured);
        }

        this.elements.chatUrlInput.value = initialUrl;
        this.setChatStatus(this.t('v2.chat.disconnected', {}, 'Disconnected'));
        this.setChatConnectedUi(false);
        this.appendChatMessage(this.t('v2.chat.welcome', {}, 'Welcome. Connect to start chatting.'), { type: 'system' });
        if (initialUrl) {
            this.connectChat({ silent: true, auto: true });
        }
    }

    normalizeChatUrl(rawUrl) {
        const url = String(rawUrl || '').trim();
        if (!url) return '';
        if (/^https:\/\//i.test(url)) {
            return url.replace(/^https:\/\//i, 'wss://');
        }
        if (/^http:\/\//i.test(url)) {
            return url.replace(/^http:\/\//i, 'ws://');
        }
        return url;
    }

    getChatDisplayName() {
        if (this.state.authUser?.displayName) return this.state.authUser.displayName;
        if (this.state.authUser?.email) return this.state.authUser.email.split('@')[0];
        let guestId = localStorage.getItem('chat_guest_id');
        if (!guestId) {
            guestId = `guest-${Math.floor(Math.random() * 1000)}`;
            localStorage.setItem('chat_guest_id', guestId);
        }
        return guestId;
    }

    setChatStatus(text) {
        if (this.elements.chatStatus) {
            this.elements.chatStatus.textContent = text;
        }
    }

    setChatConnectedUi(isConnected) {
        if (this.elements.chatInput) {
            this.elements.chatInput.disabled = !isConnected;
        }
        if (this.elements.btnChatSend) {
            this.elements.btnChatSend.disabled = !isConnected;
        }
        if (this.elements.btnChatConnect) {
            this.elements.btnChatConnect.textContent = isConnected
                ? this.t('v2.chat.reconnect', {}, 'Reconnect')
                : this.t('v2.chat.connect', {}, 'Connect');
        }
    }

    appendChatMessage(text, options = {}) {
        if (!this.elements.chatMessages) return;
        const row = document.createElement('div');
        const sender = options.sender ? `${options.sender}: ` : '';
        row.className = `chat-msg ${options.type || ''}`.trim();
        row.innerHTML = sender
            ? `<strong>${this.escapeHtml(sender)}</strong>${this.escapeHtml(text)}`
            : this.escapeHtml(text);
        this.elements.chatMessages.appendChild(row);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    connectChat(options = {}) {
        const silent = Boolean(options.silent);
        if (!this.elements.chatUrlInput) return;
        const url = this.normalizeChatUrl(this.elements.chatUrlInput.value);
        this.elements.chatUrlInput.value = url;
        if (!url) {
            if (!silent) this.showToast(this.t('v2.chat.urlRequired', {}, 'Enter a WebSocket URL first.'), 'error');
            return;
        }
        if (!/^wss?:\/\//i.test(url)) {
            if (!silent) this.showToast(this.t('v2.chat.urlInvalid', {}, 'Use a valid WebSocket URL starting with ws:// or wss://.'), 'error');
            return;
        }
        if (typeof WebSocket === 'undefined') {
            if (!silent) this.showToast(this.t('v2.chat.notSupported', {}, 'WebSocket is not supported in this browser.'), 'error');
            return;
        }
        const currentHost = window.location.hostname;
        const isLocalPage = currentHost === 'localhost' || currentHost === '127.0.0.1';
        const isLocalSocketUrl = /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);
        if (!isLocalPage && isLocalSocketUrl) {
            if (!silent) this.showToast(this.t('v2.chat.localhostBlocked', {}, 'localhost chat server is available only in local development.'), 'error');
            return;
        }

        localStorage.setItem('chat_ws_url', url);

        if (this.chatSocket) {
            try {
                this.chatSocket.close();
            } catch (error) {
            }
            this.chatSocket = null;
        }

        this.setChatStatus(this.t('v2.chat.connecting', {}, 'Connecting...'));
        this.setChatConnectedUi(false);

        try {
            const socket = new WebSocket(url);
            this.chatSocket = socket;

            socket.onopen = () => {
                this.setChatStatus(this.t('v2.chat.connected', {}, 'Connected'));
                this.setChatConnectedUi(true);
                this.appendChatMessage(this.t('v2.chat.connectedNotice', {}, 'Connected to chat server.'), { type: 'system' });
            };

            socket.onclose = () => {
                this.setChatStatus(this.t('v2.chat.disconnected', {}, 'Disconnected'));
                this.setChatConnectedUi(false);
                this.appendChatMessage(this.t('v2.chat.disconnectedNotice', {}, 'Connection closed.'), { type: 'system' });
            };

            socket.onerror = () => {
                this.setChatStatus(this.t('v2.chat.error', {}, 'Connection error'));
                this.setChatConnectedUi(false);
                this.appendChatMessage(this.t('v2.chat.connectFail', {}, 'Failed to connect.'), { type: 'system' });
            };

            socket.onmessage = (event) => {
                let sender = 'user';
                let message = '';
                let messageType = 'chat';
                try {
                    const parsed = JSON.parse(event.data);
                    sender = parsed.user || parsed.sender || 'user';
                    message = parsed.text || parsed.message || '';
                    messageType = parsed.type || 'chat';
                } catch (error) {
                    message = String(event.data || '');
                }
                if (message) {
                    if (messageType === 'system') {
                        this.appendChatMessage(message, { type: 'system' });
                    } else {
                        this.appendChatMessage(message, { sender });
                    }
                }
            };
        } catch (error) {
            this.setChatStatus(this.t('v2.chat.error', {}, 'Connection error'));
            this.setChatConnectedUi(false);
            if (!silent) this.showToast(this.t('v2.chat.connectFail', {}, 'Failed to connect.'), 'error');
        }
    }

    sendChatMessage() {
        if (!this.elements.chatInput) return;
        if (this.chatInputComposing) return;
        const text = this.elements.chatInput.value.trim();
        if (!text) return;

        if (!this.chatSocket || this.chatSocket.readyState !== 1) {
            this.showToast(this.t('v2.chat.sendWhileOffline', {}, 'Connect chat first.'), 'error');
            return;
        }

        const payload = {
            type: 'chat',
            user: this.getChatDisplayName(),
            text,
            sentAt: new Date().toISOString()
        };

        try {
            this.chatSocket.send(JSON.stringify(payload));
            this.trackEvent('chat_message_sent', {
                chars: text.length
            });
            this.elements.chatInput.value = '';
        } catch (error) {
            this.showToast(this.t('v2.chat.sendFail', {}, 'Failed to send message.'), 'error');
        }
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

        if (!append) {
            this.trackEvent('gallery_browse', {
                category: this.state.currentCategory,
                has_search_query: Boolean(this.state.searchQuery)
            });
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
            this.trackEvent('sound_open', { source: 'gallery', sound_id: sound.id });

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

        if (this.analytics.shouldTrackTrimComplete(this.state.selectedSoundId, this.state.trimStart, this.state.trimEnd, isValid)) {
            this.trackEvent('trim_complete', {
                sound_id: this.state.selectedSoundId || 'unknown',
                duration: Number(duration.toFixed(2))
            });
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
            this.trackEvent('sound_downloaded', {
                sound_id: this.state.selectedSoundId || 'unknown',
                duration: Number((this.state.trimEnd - this.state.trimStart).toFixed(2))
            });
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

            const result = await this.fileSystem.saveToDirectory(wavBlob, 'LockChime.wav');

            if (result.success) {
                this.hideLoading();
                this.incrementWeeklyAction('save');
                this.trackEvent('save_usb_success', {
                    sound_id: this.state.selectedSoundId || 'unknown',
                    duration: Number((this.state.trimEnd - this.state.trimStart).toFixed(2))
                });
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
                duration: this.state.trimEnd - this.state.trimStart,
                vehicleModel: this.normalizeModel(this.state.challengeModel),
                ownerNickname: this.state.authUser?.displayName || '',
                creatorAuthUid: this.state.authUser?.uid || '',
                creatorAuthProvider: this.state.authUser?.providerData?.[0]?.providerId || ''
            });

            this.hideLoading();
            this.trackEvent('share_gallery_success', {
                sound_id: this.state.selectedSoundId || 'unknown',
                source: 'editor_share'
            });
            this.showToast(this.t('success.uploaded', {}, 'Sound uploaded to gallery!'), 'success');
            this.incrementWeeklyAction('share');
            await this.loadGallerySounds();
            await this.loadWeeklyRanking();
        } catch (error) {
            this.hideLoading();
            this.showToast(this.t('v2.uploadFailed', {}, 'Upload failed'), 'error');
        }
    }

    incrementWeeklyAction(type) {
        const model = this.normalizeModel(this.state.challengeModel);
        const weekKey = this.getCurrentWeekKey();
        const weeklyActions = this.getStorageJson('owner_weekly_actions_v1', {});
        const emptyStats = { saves: 0, uploads: 0, shares: 0 };

        if (!weeklyActions[weekKey]) weeklyActions[weekKey] = {};
        if (!weeklyActions[weekKey][model]) weeklyActions[weekKey][model] = { ...emptyStats };

        if (type === 'save') weeklyActions[weekKey][model].saves += 1;
        if (type === 'upload') weeklyActions[weekKey][model].uploads += 1;
        if (type === 'share') weeklyActions[weekKey][model].shares += 1;

        this.setStorageJson('owner_weekly_actions_v1', weeklyActions);

        this.state.badgeState.actions = this.state.badgeState.actions || { save: 0, upload: 0, share: 0 };
        if (type === 'save') this.state.badgeState.actions.save += 1;
        if (type === 'upload') this.state.badgeState.actions.upload += 1;
        if (type === 'share') this.state.badgeState.actions.share += 1;

        const stats = weeklyActions[weekKey][model];
        const progress = this.getChallengeProgress(stats, this.getChallengeTargets(model));
        if (progress.completed) {
            const completionKey = `${weekKey}:${model}`;
            this.state.badgeState.completedChallenges = this.state.badgeState.completedChallenges || [];
            if (!this.state.badgeState.completedChallenges.includes(completionKey)) {
                this.state.badgeState.completedChallenges.push(completionKey);
            }
            this.unlockBadge('model_champion');
        }

        this.evaluateBadges();
        this.setStorageJson('owner_badges_v1', this.state.badgeState);
        this.renderChallengeProgress();
        this.renderBadges();
    }

    renderChallengeProgress() {
        if (!this.elements.challengeProgress) return;
        const model = this.normalizeModel(this.state.challengeModel);
        const targets = this.getChallengeTargets(model);
        const weeklyActions = this.getStorageJson('owner_weekly_actions_v1', {});
        const weekKey = this.getCurrentWeekKey();
        const stats = weeklyActions?.[weekKey]?.[model] || { saves: 0, uploads: 0, shares: 0 };
        const progress = this.getChallengeProgress(stats, targets);

        if (this.elements.challengeTargetText) {
            this.elements.challengeTargetText.textContent = this.t(
                'v2.challenge.modelTarget',
                {
                    model: this.getModelLabel(model),
                    saves: targets.saves,
                    uploads: targets.uploads,
                    shares: targets.shares
                },
                `${this.getModelLabel(model)} target: Save ${targets.saves}, Upload ${targets.uploads}, Share ${targets.shares}`
            );
        }

        this.elements.challengeProgress.innerHTML = [
            this.t('v2.challenge.saveProgress', { current: stats.saves || 0, target: targets.saves, percent: progress.saveProgress }, `Save to USB: ${stats.saves || 0}/${targets.saves} (${progress.saveProgress}%)`),
            this.t('v2.challenge.uploadProgress', { current: stats.uploads || 0, target: targets.uploads, percent: progress.uploadProgress }, `Upload to Gallery: ${stats.uploads || 0}/${targets.uploads} (${progress.uploadProgress}%)`),
            this.t('v2.challenge.shareProgress', { current: stats.shares || 0, target: targets.shares, percent: progress.shareProgress }, `Share to Gallery: ${stats.shares || 0}/${targets.shares} (${progress.shareProgress}%)`),
            progress.completed
                ? this.t('v2.challenge.completed', {}, 'Challenge complete. Weekly creator badge unlocked.')
                : this.t('v2.challenge.incomplete', {}, 'Complete all 3 to finish this week.')
        ].map(text => `<div>${this.escapeHtml(text)}</div>`).join('');
    }

    async loadWeeklyRanking() {
        if (!this.elements.weeklyRankingList || !this.gallery.isAvailable()) return;

        try {
            const model = this.normalizeModel(this.state.challengeModel);
            const result = await this.gallery.getWeeklyPopular(5, { model });
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

    loadBadgeState() {
        const saved = this.getStorageJson('owner_badges_v1', null);
        if (saved && typeof saved === 'object') {
            return {
                unlocked: Array.isArray(saved.unlocked) ? saved.unlocked : [],
                actions: saved.actions || { save: 0, upload: 0, share: 0 },
                completedChallenges: Array.isArray(saved.completedChallenges) ? saved.completedChallenges : []
            };
        }
        return {
            unlocked: [],
            actions: { save: 0, upload: 0, share: 0 },
            completedChallenges: []
        };
    }

    getBadgeCatalog() {
        return [
            { id: 'first_lock', icon: '🔒', title: this.t('v2.badges.firstLock', {}, 'First Lock Save'), desc: this.t('v2.badges.firstLockDesc', {}, 'Saved your first lock sound to USB') },
            { id: 'gallery_rookie', icon: '📡', title: this.t('v2.badges.galleryRookie', {}, 'Gallery Rookie'), desc: this.t('v2.badges.galleryRookieDesc', {}, 'Uploaded your first community sound') },
            { id: 'model_champion', icon: '🏁', title: this.t('v2.badges.modelChampion', {}, 'Model Champion'), desc: this.t('v2.badges.modelChampionDesc', {}, 'Completed a model challenge') },
            { id: 'community_crafter', icon: '🛠️', title: this.t('v2.badges.communityCrafter', {}, 'Community Crafter'), desc: this.t('v2.badges.communityCrafterDesc', {}, 'Shared 5 sounds with the community') },
            { id: 'garage_legend', icon: '👑', title: this.t('v2.badges.garageLegend', {}, 'Garage Legend'), desc: this.t('v2.badges.garageLegendDesc', {}, 'Unlocked 4 badges') }
        ];
    }

    unlockBadge(badgeId) {
        if (!this.state.badgeState.unlocked.includes(badgeId)) {
            this.state.badgeState.unlocked.push(badgeId);
            this.showToast(this.t('v2.badges.unlocked', { badge: badgeId }, `Badge unlocked: ${badgeId}`), 'success');
        }
    }

    evaluateBadges() {
        const actions = this.state.badgeState.actions || { save: 0, upload: 0, share: 0 };
        if ((actions.save || 0) >= 1) this.unlockBadge('first_lock');
        if ((actions.upload || 0) >= 1) this.unlockBadge('gallery_rookie');
        if ((actions.upload || 0) + (actions.share || 0) >= 5) this.unlockBadge('community_crafter');
        if ((this.state.badgeState.completedChallenges || []).length >= 1) this.unlockBadge('model_champion');
        if ((this.state.badgeState.unlocked || []).length >= 4) this.unlockBadge('garage_legend');
    }

    renderBadges() {
        if (!this.elements.badgeGrid || !this.elements.badgeSummary) return;
        if (!this.state.authUser) return;
        this.evaluateBadges();
        this.setStorageJson('owner_badges_v1', this.state.badgeState);

        const catalog = this.getBadgeCatalog();
        const unlocked = new Set(this.state.badgeState.unlocked || []);
        const unlockedCount = catalog.filter(badge => unlocked.has(badge.id)).length;

        this.elements.badgeSummary.textContent = this.t(
            'v2.badges.summary',
            { unlocked: unlockedCount, total: catalog.length },
            `${unlockedCount}/${catalog.length} badges unlocked`
        );

        this.elements.badgeGrid.innerHTML = '';
        catalog.forEach(badge => {
            const isUnlocked = unlocked.has(badge.id);
            const item = document.createElement('div');
            item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="badge-item-title">${this.escapeHtml(badge.icon)} ${this.escapeHtml(badge.title)}</div>
                <div class="badge-item-meta">${this.escapeHtml(isUnlocked ? this.t('v2.badges.unlockedState', {}, 'Unlocked') : this.t('v2.badges.lockedState', {}, 'Locked'))}</div>
                <div class="badge-item-meta">${this.escapeHtml(badge.desc)}</div>
            `;
            this.elements.badgeGrid.appendChild(item);
        });
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
        if (this.elements.uploadModel) {
            this.elements.uploadModel.value = this.normalizeModel(this.state.challengeModel);
        }
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
            this.trackEvent('sound_open', { source: 'upload', sound_id: this.state.selectedSoundId });

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
        const model = this.normalizeModel(this.elements.uploadModel?.value || this.state.challengeModel);
        this.state.challengeModel = model;
        if (this.elements.challengeModelSelect) this.elements.challengeModelSelect.value = model;

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
                duration: this.state.trimEnd - this.state.trimStart,
                vehicleModel: model,
                ownerNickname: this.state.authUser?.displayName || '',
                creatorAuthUid: this.state.authUser?.uid || '',
                creatorAuthProvider: this.state.authUser?.providerData?.[0]?.providerId || ''
            });

            this.hideLoading();
            this.trackEvent('share_gallery_success', {
                sound_id: this.state.selectedSoundId || 'unknown',
                source: 'upload_modal'
            });
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
            this.trackEvent('sound_open', { source: 'preset', sound_id: soundId });

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

    trackEvent(eventName, params = {}) {
        this.analytics.track(eventName, params);
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
