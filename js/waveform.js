/**
 * Waveform Visualizer - Canvas-based audio waveform display with trim handles
 */

class WaveformVisualizer {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        this.ctx = this.canvas.getContext('2d');

        this.waveformData = null;
        this.duration = 0;

        // Trim state
        this.trimStart = 0;
        this.trimEnd = 1;

        // Playhead
        this.playheadPosition = 0;
        this.isShowingPlayhead = false;

        // Interaction state
        this.isDragging = null; // 'start', 'end', or null
        this.dragStartX = 0;

        // Colors
        this.colors = {
            background: '#252525',
            waveform: '#666666',
            waveformSelected: '#e82127',
            playhead: '#ffffff'
        };

        this.setupCanvas();
        this.setupEventListeners();
    }

    /**
     * Set up canvas for high-DPI displays
     */
    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Set up mouse/touch event listeners for trim handles
     */
    setupEventListeners() {
        const startHandle = document.getElementById('trim-start');
        const endHandle = document.getElementById('trim-end');

        // Start handle
        startHandle.addEventListener('mousedown', (e) => {
            this.isDragging = 'start';
            this.dragStartX = e.clientX;
            e.preventDefault();
        });

        // End handle
        endHandle.addEventListener('mousedown', (e) => {
            this.isDragging = 'end';
            this.dragStartX = e.clientX;
            e.preventDefault();
        });

        // Global mouse move
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const position = Math.max(0, Math.min(1, x / rect.width));

            if (this.isDragging === 'start') {
                this.setTrimStart(Math.min(position, this.trimEnd - 0.05));
            } else if (this.isDragging === 'end') {
                this.setTrimEnd(Math.max(position, this.trimStart + 0.05));
            }

            this.updateTrimHandles();
            this.draw();

            // Dispatch custom event for UI updates
            this.container.dispatchEvent(new CustomEvent('trimchange', {
                detail: {
                    startTime: this.trimStart * this.duration,
                    endTime: this.trimEnd * this.duration
                }
            }));
        });

        // Global mouse up
        document.addEventListener('mouseup', () => {
            this.isDragging = null;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updateTrimHandles();
            this.draw();
        });
    }

    /**
     * Load waveform data from audio processor
     */
    loadWaveform(audioProcessor) {
        this.waveformData = audioProcessor.getWaveformData(this.width);
        this.duration = audioProcessor.getDuration();

        // Reset trim to full duration, clamped to max 5 seconds
        this.trimStart = 0;
        this.trimEnd = Math.min(1, 5 / this.duration);

        this.updateTrimHandles();
        this.draw();

        return {
            startTime: this.trimStart * this.duration,
            endTime: this.trimEnd * this.duration
        };
    }

    /**
     * Set trim start position (0-1)
     */
    setTrimStart(position) {
        this.trimStart = Math.max(0, Math.min(position, this.trimEnd - 0.01));
    }

    /**
     * Set trim end position (0-1)
     */
    setTrimEnd(position) {
        this.trimEnd = Math.max(this.trimStart + 0.01, Math.min(1, position));
    }

    /**
     * Set trim times in seconds
     */
    setTrimTimes(startTime, endTime) {
        if (this.duration > 0) {
            this.trimStart = startTime / this.duration;
            this.trimEnd = endTime / this.duration;
            this.updateTrimHandles();
            this.draw();
        }
    }

    /**
     * Get current trim times in seconds
     */
    getTrimTimes() {
        return {
            startTime: this.trimStart * this.duration,
            endTime: this.trimEnd * this.duration
        };
    }

    /**
     * Update the visual position of trim handles
     */
    updateTrimHandles() {
        const startHandle = document.getElementById('trim-start');
        const endHandle = document.getElementById('trim-end');
        const selection = document.getElementById('trim-selection');

        const startPercent = this.trimStart * 100;
        const endPercent = this.trimEnd * 100;

        startHandle.style.left = startPercent + '%';
        endHandle.style.left = endPercent + '%';

        selection.style.left = startPercent + '%';
        selection.style.width = (endPercent - startPercent) + '%';
    }

    /**
     * Show playhead at position
     */
    showPlayhead(position) {
        this.playheadPosition = position;
        this.isShowingPlayhead = true;

        const playhead = document.getElementById('playhead');
        playhead.style.display = 'block';
        playhead.style.left = (position * 100) + '%';
    }

    /**
     * Hide playhead
     */
    hidePlayhead() {
        this.isShowingPlayhead = false;
        const playhead = document.getElementById('playhead');
        playhead.style.display = 'none';
    }

    /**
     * Animate playhead during playback
     */
    animatePlayhead(startTime, duration, onComplete) {
        const startPosition = startTime / this.duration;
        const endPosition = (startTime + duration) / this.duration;
        const animationDuration = duration * 1000; // Convert to ms

        let startTimestamp = null;

        const animate = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;

            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / animationDuration, 1);
            const position = startPosition + (endPosition - startPosition) * progress;

            this.showPlayhead(position);

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.hidePlayhead();
                if (onComplete) onComplete();
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * Stop playhead animation
     */
    stopPlayheadAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.hidePlayhead();
    }

    /**
     * Draw the waveform
     */
    draw() {
        if (!this.waveformData) return;

        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const centerY = height / 2;
        const maxAmplitude = height / 2 - 10;

        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, width, height);

        // Draw waveform
        const barWidth = width / this.waveformData.length;

        for (let i = 0; i < this.waveformData.length; i++) {
            const x = i * barWidth;
            const amplitude = this.waveformData[i] * maxAmplitude;
            const position = i / this.waveformData.length;

            // Determine if this position is within the selected range
            const isSelected = position >= this.trimStart && position <= this.trimEnd;
            ctx.fillStyle = isSelected ? this.colors.waveformSelected : this.colors.waveform;

            // Draw mirrored bar
            ctx.fillRect(x, centerY - amplitude, barWidth - 1, amplitude * 2);
        }
    }
}

// Export for use in other modules
window.WaveformVisualizer = WaveformVisualizer;
