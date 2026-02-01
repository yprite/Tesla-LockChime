import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveformVisualizer } from '../src/waveform.js';

describe('WaveformVisualizer', () => {
    let canvas;
    let container;
    let visualizer;

    beforeEach(() => {
        // Create mock canvas and container
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '120px';
        document.body.appendChild(container);

        canvas = document.createElement('canvas');
        container.appendChild(canvas);

        visualizer = new WaveformVisualizer(canvas, container);
    });

    afterEach(() => {
        if (visualizer) {
            visualizer.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should throw error without canvas', () => {
            expect(() => new WaveformVisualizer(null, container)).toThrow();
        });

        it('should throw error without container', () => {
            expect(() => new WaveformVisualizer(canvas, null)).toThrow();
        });

        it('should accept string IDs', () => {
            canvas.id = 'test-canvas';
            container.id = 'test-container';
            document.body.appendChild(container);

            const viz = new WaveformVisualizer('test-canvas', 'test-container');
            expect(viz.canvas).toBe(canvas);
            viz.destroy();
        });

        it('should initialize with default values', () => {
            expect(visualizer.trimStart).toBe(0);
            expect(visualizer.trimEnd).toBe(1);
            expect(visualizer.duration).toBe(0);
            expect(visualizer.waveformData).toBeNull();
        });

        it('should have default colors', () => {
            expect(visualizer.colors.background).toBe('#252525');
            expect(visualizer.colors.waveform).toBe('#666666');
            expect(visualizer.colors.waveformSelected).toBe('#e82127');
        });
    });

    describe('setupCanvas()', () => {
        it('should set canvas dimensions', () => {
            visualizer.setupCanvas();
            expect(visualizer.width).toBeGreaterThan(0);
            expect(visualizer.height).toBeGreaterThan(0);
        });

        it('should scale for device pixel ratio', () => {
            visualizer.dpr = 2;
            visualizer.setupCanvas();

            expect(visualizer.canvas.width).toBe(visualizer.width * 2);
            expect(visualizer.canvas.height).toBe(visualizer.height * 2);
        });
    });

    describe('trim control', () => {
        beforeEach(() => {
            visualizer.duration = 10; // 10 seconds
        });

        it('should set trim start', () => {
            visualizer.setTrimStart(0.25);
            expect(visualizer.trimStart).toBe(0.25);
        });

        it('should clamp trim start to minimum 0', () => {
            visualizer.setTrimStart(-0.5);
            expect(visualizer.trimStart).toBe(0);
        });

        it('should not allow trim start past trim end', () => {
            visualizer.trimEnd = 0.5;
            visualizer.setTrimStart(0.6);
            expect(visualizer.trimStart).toBeLessThan(visualizer.trimEnd);
        });

        it('should set trim end', () => {
            visualizer.setTrimEnd(0.75);
            expect(visualizer.trimEnd).toBe(0.75);
        });

        it('should clamp trim end to maximum 1', () => {
            visualizer.setTrimEnd(1.5);
            expect(visualizer.trimEnd).toBe(1);
        });

        it('should not allow trim end before trim start', () => {
            visualizer.trimStart = 0.5;
            visualizer.setTrimEnd(0.3);
            expect(visualizer.trimEnd).toBeGreaterThan(visualizer.trimStart);
        });
    });

    describe('setTrimTimes()', () => {
        beforeEach(() => {
            visualizer.duration = 10;
        });

        it('should set trim times in seconds', () => {
            visualizer.setTrimTimes(2, 5);

            expect(visualizer.trimStart).toBe(0.2);
            expect(visualizer.trimEnd).toBe(0.5);
        });

        it('should not modify if duration is 0', () => {
            visualizer.duration = 0;
            visualizer.setTrimTimes(2, 5);

            expect(visualizer.trimStart).toBe(0);
            expect(visualizer.trimEnd).toBe(1);
        });
    });

    describe('getTrimTimes()', () => {
        it('should return trim times in seconds', () => {
            visualizer.duration = 10;
            visualizer.trimStart = 0.2;
            visualizer.trimEnd = 0.7;

            const times = visualizer.getTrimTimes();

            expect(times.startTime).toBeCloseTo(2, 5);
            expect(times.endTime).toBeCloseTo(7, 5);
            expect(times.duration).toBeCloseTo(5, 5);
        });
    });

    describe('getTrimPositions()', () => {
        it('should return normalized positions', () => {
            visualizer.trimStart = 0.3;
            visualizer.trimEnd = 0.8;

            const positions = visualizer.getTrimPositions();

            expect(positions.start).toBe(0.3);
            expect(positions.end).toBe(0.8);
        });
    });

    describe('loadWaveform()', () => {
        it('should throw without audio processor', () => {
            expect(() => visualizer.loadWaveform(null)).toThrow('Audio processor is required');
        });

        it('should load waveform data from processor', () => {
            const mockProcessor = {
                getWaveformData: vi.fn().mockReturnValue(new Float32Array(100).fill(0.5)),
                getDuration: vi.fn().mockReturnValue(3)
            };

            const result = visualizer.loadWaveform(mockProcessor);

            expect(visualizer.waveformData).toBeInstanceOf(Float32Array);
            expect(visualizer.duration).toBe(3);
            expect(result).toHaveProperty('startTime');
            expect(result).toHaveProperty('endTime');
        });

        it('should limit initial trim end to 5 seconds', () => {
            const mockProcessor = {
                getWaveformData: vi.fn().mockReturnValue(new Float32Array(100)),
                getDuration: vi.fn().mockReturnValue(10)
            };

            visualizer.loadWaveform(mockProcessor);

            expect(visualizer.trimEnd).toBe(0.5); // 5/10
        });
    });

    describe('loadWaveformData()', () => {
        it('should load data directly', () => {
            const data = new Float32Array([0.1, 0.5, 0.3]);
            visualizer.loadWaveformData(data, 2);

            expect(visualizer.waveformData).toBe(data);
            expect(visualizer.duration).toBe(2);
        });
    });

    describe('playhead', () => {
        it('should show playhead at position', () => {
            visualizer.showPlayhead(0.5);

            expect(visualizer.isShowingPlayhead).toBe(true);
            expect(visualizer.playheadPosition).toBe(0.5);
        });

        it('should clamp playhead position', () => {
            visualizer.showPlayhead(1.5);
            expect(visualizer.playheadPosition).toBe(1);

            visualizer.showPlayhead(-0.5);
            expect(visualizer.playheadPosition).toBe(0);
        });

        it('should hide playhead', () => {
            visualizer.showPlayhead(0.5);
            visualizer.hidePlayhead();

            expect(visualizer.isShowingPlayhead).toBe(false);
        });

        it('should stop animation', () => {
            visualizer.animationFrame = 123;
            visualizer.stopPlayheadAnimation();

            expect(visualizer.animationFrame).toBeNull();
            expect(visualizer.isShowingPlayhead).toBe(false);
        });
    });

    describe('draw()', () => {
        it('should not throw without waveform data', () => {
            expect(() => visualizer.draw()).not.toThrow();
        });

        it('should draw waveform when data exists', () => {
            visualizer.waveformData = new Float32Array([0.5, 0.8, 0.3, 0.6]);
            visualizer.duration = 1;

            expect(() => visualizer.draw()).not.toThrow();
        });
    });

    describe('setColors()', () => {
        it('should update colors', () => {
            visualizer.setColors({ background: '#000000' });

            expect(visualizer.colors.background).toBe('#000000');
            // Other colors should remain
            expect(visualizer.colors.waveform).toBe('#666666');
        });
    });

    describe('event listeners', () => {
        let startHandle;
        let endHandle;
        let selection;

        beforeEach(() => {
            startHandle = document.createElement('div');
            endHandle = document.createElement('div');
            selection = document.createElement('div');
            container.appendChild(startHandle);
            container.appendChild(endHandle);
            container.appendChild(selection);

            visualizer.duration = 10;
        });

        it('should attach event listeners', () => {
            expect(() => {
                visualizer.attachEventListeners(startHandle, endHandle, selection);
            }).not.toThrow();
        });

        it('should not throw with missing handles', () => {
            expect(() => {
                visualizer.attachEventListeners(null, null, null);
            }).not.toThrow();
        });

        it('should emit trim change events', () => {
            visualizer.attachEventListeners(startHandle, endHandle, selection);

            const callback = vi.fn();
            visualizer.onTrimChange = callback;

            visualizer.emitTrimChange();

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    startTime: expect.any(Number),
                    endTime: expect.any(Number)
                })
            );
        });

        it('should dispatch DOM events', () => {
            const listener = vi.fn();
            container.addEventListener('trimchange', listener);

            visualizer.attachEventListeners(startHandle, endHandle, selection);
            visualizer.emitTrimChange();

            expect(listener).toHaveBeenCalled();
        });
    });

    describe('updateTrimHandles()', () => {
        it('should not throw without handles', () => {
            expect(() => visualizer.updateTrimHandles()).not.toThrow();
        });

        it('should update handle positions', () => {
            const startHandle = document.createElement('div');
            const endHandle = document.createElement('div');
            const selection = document.createElement('div');

            visualizer.attachEventListeners(startHandle, endHandle, selection);
            visualizer.trimStart = 0.2;
            visualizer.trimEnd = 0.8;

            visualizer.updateTrimHandles();

            expect(startHandle.style.left).toBe('20%');
            expect(endHandle.style.left).toBe('80%');
            expect(selection.style.left).toBe('20%');
            expect(selection.style.width).toBe('60%');
        });
    });

    describe('destroy()', () => {
        it('should clean up without error', () => {
            const startHandle = document.createElement('div');
            const endHandle = document.createElement('div');

            visualizer.attachEventListeners(startHandle, endHandle, null);

            expect(() => visualizer.destroy()).not.toThrow();
        });

        it('should stop animations', () => {
            visualizer.animationFrame = 123;
            visualizer.destroy();

            expect(visualizer.animationFrame).toBeNull();
        });
    });
});

describe('WaveformVisualizer - Mouse Interaction', () => {
    let canvas;
    let container;
    let visualizer;
    let startHandle;
    let endHandle;

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '120px';
        document.body.appendChild(container);

        canvas = document.createElement('canvas');
        container.appendChild(canvas);

        startHandle = document.createElement('div');
        endHandle = document.createElement('div');
        container.appendChild(startHandle);
        container.appendChild(endHandle);

        visualizer = new WaveformVisualizer(canvas, container);
        visualizer.duration = 10;
        visualizer.attachEventListeners(startHandle, endHandle, null);
    });

    afterEach(() => {
        visualizer.destroy();
        document.body.innerHTML = '';
    });

    it('should start dragging on mousedown', () => {
        const event = new MouseEvent('mousedown', { clientX: 100 });
        startHandle.dispatchEvent(event);

        expect(visualizer.isDragging).toBe('start');
    });

    it('should stop dragging on mouseup', () => {
        visualizer.isDragging = 'start';

        document.dispatchEvent(new MouseEvent('mouseup'));

        expect(visualizer.isDragging).toBeNull();
    });

    it('should maintain minimum gap between handles', () => {
        visualizer.trimStart = 0;
        visualizer.trimEnd = 0.1;

        // Try to move end handle before start
        visualizer.isDragging = 'end';
        visualizer.handleMouseMove({ clientX: 0 });

        expect(visualizer.trimEnd).toBeGreaterThan(visualizer.trimStart);
    });
});
