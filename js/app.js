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
        this.waveform = null;

        // State
        this.selectedSound = null;
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

            // Buttons
            btnPreview: document.getElementById('btn-preview'),
            btnPreviewTrimmed: document.getElementById('btn-preview-trimmed'),
            btnChangeSound: document.getElementById('btn-change-sound'),
            btnSaveUsb: document.getElementById('btn-save-usb'),
            btnCreateAnother: document.getElementById('btn-create-another'),

            // File info
            fileDetails: document.getElementById('file-details'),

            // Loading
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            // Modals
            unsupportedModal: document.getElementById('unsupported-modal'),
            compatibilityNotice: document.getElementById('compatibility-notice')
        };

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

        // Populate sound grid
        this.populateSoundGrid();

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Check browser compatibility and show warnings
     */
    checkCompatibility() {
        const status = this.fileSystem.getCompatibilityStatus();

        if (!status.compatible) {
            // Show modal for unsupported browsers
            this.elements.unsupportedModal.style.display = 'flex';
            return;
        }

        // Hide compatibility notice for supported browsers (optional - keep it visible as a reminder)
        // this.elements.compatibilityNotice.style.display = 'none';
    }

    /**
     * Populate the sound selection grid
     */
    populateSoundGrid() {
        const grid = this.elements.soundGrid;
        grid.innerHTML = '';

        AUDIO_SAMPLES.forEach(sound => {
            const card = document.createElement('div');
            card.className = 'sound-card';
            card.dataset.soundId = sound.id;

            card.innerHTML = `
                <div class="sound-card-icon">${sound.icon}</div>
                <div class="sound-card-name">${sound.name}</div>
                <div class="sound-card-duration">${sound.duration.toFixed(1)}s</div>
                <button class="sound-card-preview" data-sound-id="${sound.id}">
                    ▶ Preview
                </button>
            `;

            // Card click selects the sound
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('sound-card-preview')) return;
                this.selectSound(sound.id);
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

        // Waveform trim change
        document.getElementById('waveform-container').addEventListener('trimchange', (e) => {
            this.trimStart = e.detail.startTime;
            this.trimEnd = e.detail.endTime;
            this.updateTimeInputs();
            this.validateAndUpdateUI();
        });

        // Save button
        this.elements.btnSaveUsb.addEventListener('click', () => this.saveToUsb());

        // Create another button
        this.elements.btnCreateAnother.addEventListener('click', () => this.reset());
    }

    /**
     * Preview a sound from the selection grid
     */
    async previewSoundInGrid(soundId, button) {
        const originalText = button.textContent;
        button.textContent = '⏹ Stop';

        try {
            await this.audioProcessor.init();
            await this.audioProcessor.loadSound(soundId);
            await this.audioProcessor.play(0, null, () => {
                button.textContent = originalText;
            });
        } catch (error) {
            console.error('Preview error:', error);
            button.textContent = originalText;
        }
    }

    /**
     * Select a sound and proceed to trim step
     */
    async selectSound(soundId) {
        this.selectedSound = soundId;

        // Update UI to show selected
        document.querySelectorAll('.sound-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.soundId === soundId);
        });

        // Show loading
        this.showLoading('Loading sound...');

        try {
            // Load the sound
            await this.audioProcessor.loadSound(soundId);

            // Load waveform
            const { startTime, endTime } = this.waveform.loadWaveform(this.audioProcessor);
            this.trimStart = startTime;
            this.trimEnd = endTime;

            // Update UI
            this.updateTimeInputs();
            this.validateAndUpdateUI();

            // Go to trim step
            this.goToStep('trim');
        } catch (error) {
            console.error('Error loading sound:', error);
            alert('Error loading sound. Please try again.');
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

        // Update waveform
        this.waveform.setTrimTimes(this.trimStart, this.trimEnd);

        // Update inputs to reflect clamped values
        this.updateTimeInputs();
        this.validateAndUpdateUI();
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
        const validation = this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);
        const messageEl = this.elements.validationMessage;

        if (validation.valid) {
            messageEl.className = 'validation-message success';
            messageEl.textContent = validation.message;
            this.elements.stepSave.style.display = 'block';
        } else {
            messageEl.className = 'validation-message error';
            messageEl.textContent = validation.message;
            this.elements.stepSave.style.display = 'none';
        }

        // Update file details
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

        const playInfo = await this.audioProcessor.play(0, null, () => {
            this.waveform.hidePlayhead();
            this.elements.btnPreview.innerHTML = '<span class="btn-icon">▶</span> Preview';
        });

        this.elements.btnPreview.innerHTML = '<span class="btn-icon">⏹</span> Stop';
        this.waveform.animatePlayhead(0, duration);
    }

    /**
     * Play the trimmed portion
     */
    async playTrimmed() {
        this.audioProcessor.stop();
        this.waveform.stopPlayheadAnimation();

        const duration = this.trimEnd - this.trimStart;

        const playInfo = await this.audioProcessor.play(this.trimStart, this.trimEnd, () => {
            this.waveform.hidePlayhead();
            this.elements.btnPreviewTrimmed.innerHTML = '<span class="btn-icon">▶</span> Preview Trimmed';
        });

        this.elements.btnPreviewTrimmed.innerHTML = '<span class="btn-icon">⏹</span> Stop';
        this.waveform.animatePlayhead(this.trimStart, duration);
    }

    /**
     * Save the trimmed audio to USB
     */
    async saveToUsb() {
        // Validate one more time
        const validation = this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        this.showLoading('Processing audio...');

        try {
            // Export to WAV
            const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd);

            this.showLoading('Saving to USB...');

            // Use save file picker (simpler UX than directory picker)
            const result = await this.fileSystem.saveFile(wavBlob, 'LockChime.wav');

            if (result.success) {
                this.goToStep('success');
            } else if (result.cancelled) {
                // User cancelled - do nothing
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save error:', error);

            // Offer fallback download
            if (confirm(`Could not save directly: ${error.message}\n\nWould you like to download the file instead? You can then manually copy it to your USB drive.`)) {
                const wavBlob = this.audioProcessor.exportToWav(this.trimStart, this.trimEnd);
                this.fileSystem.downloadFile(wavBlob, 'LockChime.wav');
                this.goToStep('success');
            }
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Navigate to a step
     */
    goToStep(step) {
        // Stop any playback
        this.audioProcessor.stop();
        this.waveform?.stopPlayheadAnimation();

        // Hide all steps
        this.elements.stepSelect.style.display = 'none';
        this.elements.stepTrim.style.display = 'none';
        this.elements.stepSave.style.display = 'none';
        this.elements.stepSuccess.style.display = 'none';

        // Show requested step
        switch (step) {
            case 'select':
                this.elements.stepSelect.style.display = 'block';
                break;
            case 'trim':
                this.elements.stepSelect.style.display = 'block';
                this.elements.stepTrim.style.display = 'block';
                // Show save step if valid
                const validation = this.audioProcessor.validateDuration(this.trimStart, this.trimEnd);
                if (validation.valid) {
                    this.elements.stepSave.style.display = 'block';
                }
                break;
            case 'success':
                this.elements.stepSuccess.style.display = 'block';
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

        // Clear selection
        document.querySelectorAll('.sound-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset validation message
        this.elements.validationMessage.className = 'validation-message';
        this.elements.validationMessage.textContent = '';

        // Go to select step
        this.goToStep('select');
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Processing...') {
        this.elements.loadingText.textContent = message;
        this.elements.loadingOverlay.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TeslaLockSoundApp();
});
