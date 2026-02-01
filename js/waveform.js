/**
 * Waveform Visualizer - Canvas-based audio waveform display with trim handles
 */

class WaveformVisualizer {
    constructor(canvas, container) {
        this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
        this.container = typeof container === 'string' ? document.getElementById(container) : container;

        if (!this.canvas || !this.container) {
            throw new Error('Canvas and container elements are required');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Could not get 2D context from canvas');
        }

        this.waveformData = null;
        this.duration = 0;

        // Trim state (0-1 normalized)
        this.trimStart = 0;
        this.trimEnd = 1;

        // Playhead
        this.playheadPosition = 0;
        this.isShowingPlayhead = false;
        this.animationFrame = null;

        // Interaction state
        this.isDragging = null;
        this.lastMouseX = 0;

        // Visual options
        this.colors = {
            background: '#252525',
            waveform: '#666666',
            waveformSelected: '#e82127',
            playhead: '#ffffff',
            trimHandle: '#e82127'
        };

        // Dimensions
        this.width = 0;
        this.height = 0;
        this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

        // Callbacks
        this.onTrimChange = null;

        this.setupCanvas();
    }

    /**
     * Set up canvas for high-DPI displays
     */
    setupCanvas() {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 800;
        this.height = rect.height || 120;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.scale(this.dpr, this.dpr);
    }

    /**
     * Attach event listeners for trim handle interaction
     */
    attachEventListeners(startHandle, endHandle, selection) {
        if (!startHandle || !endHandle) return;

        this.startHandle = startHandle;
        this.endHandle = endHandle;
        this.selection = selection;

        // Start handle
        startHandle.addEventListener('mousedown', (e) => {
            this.isDragging = 'start';
            this.lastMouseX = e.clientX;
            e.preventDefault();
        });

        // End handle
        endHandle.addEventListener('mousedown', (e) => {
            this.isDragging = 'end';
            this.lastMouseX = e.clientX;
            e.preventDefault();
        });

        // Global mouse events
        this._boundMouseMove = this.handleMouseMove.bind(this);
        this._boundMouseUp = this.handleMouseUp.bind(this);

        document.addEventListener('mousemove', this._boundMouseMove);
        document.addEventListener('mouseup', this._boundMouseUp);

        // Resize handler
        this._boundResize = () => {
            this.setupCanvas();
            this.updateTrimHandles();
            this.draw();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this._boundResize);
        }
    }

    /**
     * Handle mouse move for dragging
     */
    handleMouseMove(e) {
        if (!this.isDragging || !this.container) return;

        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = Math.max(0, Math.min(1, x / rect.width));

        const minGap = 0.05; // Minimum 5% gap between handles

        if (this.isDragging === 'start') {
            this.trimStart = Math.min(position, this.trimEnd - minGap);
        } else if (this.isDragging === 'end') {
            this.trimEnd = Math.max(position, this.trimStart + minGap);
        }

        this.updateTrimHandles();
        this.draw();
        this.emitTrimChange();
    }

    /**
     * Handle mouse up to stop dragging
     */
    handleMouseUp() {
        this.isDragging = null;
    }

    /**
     * Emit trim change event
     */
    emitTrimChange() {
        if (this.onTrimChange) {
            this.onTrimChange({
                startTime: this.trimStart * this.duration,
                endTime: this.trimEnd * this.duration,
                startPercent: this.trimStart,
                endPercent: this.trimEnd
            });
        }

        // Also dispatch DOM event
        if (this.container) {
            this.container.dispatchEvent(new CustomEvent('trimchange', {
                detail: {
                    startTime: this.trimStart * this.duration,
                    endTime: this.trimEnd * this.duration
                }
            }));
        }
    }

    /**
     * Load waveform data from audio processor
     */
    loadWaveform(audioProcessor) {
        if (!audioProcessor) {
            throw new Error('Audio processor is required');
        }

        this.waveformData = audioProcessor.getWaveformData(Math.floor(this.width));
        this.duration = audioProcessor.getDuration();

        // Reset trim to reasonable default (max 5 seconds)
        this.trimStart = 0;
        this.trimEnd = this.duration > 5 ? 5 / this.duration : 1;

        this.updateTrimHandles();
        this.draw();

        return this.getTrimTimes();
    }

    /**
     * Load waveform data directly
     */
    loadWaveformData(data, duration) {
        this.waveformData = data;
        this.duration = duration;
        this.draw();
    }

    /**
     * Set trim start position (0-1)
     */
    setTrimStart(position) {
        this.trimStart = Math.max(0, Math.min(position, this.trimEnd - 0.01));
        this.updateTrimHandles();
        this.draw();
    }

    /**
     * Set trim end position (0-1)
     */
    setTrimEnd(position) {
        this.trimEnd = Math.max(this.trimStart + 0.01, Math.min(1, position));
        this.updateTrimHandles();
        this.draw();
    }

    /**
     * Set trim times in seconds
     */
    setTrimTimes(startTime, endTime) {
        if (this.duration > 0) {
            this.trimStart = Math.max(0, startTime / this.duration);
            this.trimEnd = Math.min(1, endTime / this.duration);
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
            endTime: this.trimEnd * this.duration,
            duration: (this.trimEnd - this.trimStart) * this.duration
        };
    }

    /**
     * Get current trim positions (0-1)
     */
    getTrimPositions() {
        return {
            start: this.trimStart,
            end: this.trimEnd
        };
    }

    /**
     * Update the visual position of trim handles
     */
    updateTrimHandles() {
        if (!this.startHandle || !this.endHandle) return;

        const startPercent = this.trimStart * 100;
        const endPercent = this.trimEnd * 100;

        this.startHandle.style.left = startPercent + '%';
        this.endHandle.style.left = endPercent + '%';

        if (this.selection) {
            this.selection.style.left = startPercent + '%';
            this.selection.style.width = (endPercent - startPercent) + '%';
        }
    }

    /**
     * Show playhead at position (0-1)
     */
    showPlayhead(position) {
        this.playheadPosition = Math.max(0, Math.min(1, position));
        this.isShowingPlayhead = true;
        this.draw();
    }

    /**
     * Hide playhead
     */
    hidePlayhead() {
        this.isShowingPlayhead = false;
        this.draw();
    }

    /**
     * Animate playhead during playback
     */
    animatePlayhead(startTime, duration, onComplete) {
        const startPosition = startTime / this.duration;
        const endPosition = (startTime + duration) / this.duration;
        const animationDuration = duration * 1000;

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
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const centerY = height / 2;
        const maxAmplitude = height / 2 - 10;

        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, width, height);

        // Draw waveform
        if (this.waveformData && this.waveformData.length > 0) {
            const barWidth = width / this.waveformData.length;

            for (let i = 0; i < this.waveformData.length; i++) {
                const x = i * barWidth;
                const amplitude = this.waveformData[i] * maxAmplitude;
                const position = i / this.waveformData.length;

                // Determine if within selected range
                const isSelected = position >= this.trimStart && position <= this.trimEnd;
                ctx.fillStyle = isSelected ? this.colors.waveformSelected : this.colors.waveform;

                // Draw mirrored bar
                const barHeight = Math.max(1, amplitude * 2);
                ctx.fillRect(x, centerY - amplitude, Math.max(1, barWidth - 1), barHeight);
            }
        }

        // Draw playhead
        if (this.isShowingPlayhead) {
            ctx.fillStyle = this.colors.playhead;
            ctx.fillRect(this.playheadPosition * width - 1, 0, 2, height);
        }
    }

    /**
     * Set color scheme
     */
    setColors(colors) {
        this.colors = { ...this.colors, ...colors };
        this.draw();
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this._boundMouseMove) {
            document.removeEventListener('mousemove', this._boundMouseMove);
        }
        if (this._boundMouseUp) {
            document.removeEventListener('mouseup', this._boundMouseUp);
        }
        if (this._boundResize && typeof window !== 'undefined') {
            window.removeEventListener('resize', this._boundResize);
        }
        this.stopPlayheadAnimation();
    }
}

// Browser global export
if (typeof window !== 'undefined') {
    window.WaveformVisualizer = WaveformVisualizer;
}
