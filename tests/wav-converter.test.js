import { describe, it, expect } from 'vitest';
import { validateWav, TESLA_REQUIREMENTS } from '../scripts/wav-converter.js';

describe('WAV Converter', () => {
  describe('TESLA_REQUIREMENTS', () => {
    it('should have correct sample rate', () => {
      expect(TESLA_REQUIREMENTS.SAMPLE_RATE).toBe(44100);
    });

    it('should have mono channel', () => {
      expect(TESLA_REQUIREMENTS.CHANNELS).toBe(1);
    });

    it('should have 16-bit depth', () => {
      expect(TESLA_REQUIREMENTS.BIT_DEPTH).toBe(16);
    });

    it('should have 2-5 second duration range', () => {
      expect(TESLA_REQUIREMENTS.MIN_DURATION).toBe(2.0);
      expect(TESLA_REQUIREMENTS.MAX_DURATION).toBe(5.0);
    });

    it('should have 1MB max file size', () => {
      expect(TESLA_REQUIREMENTS.MAX_FILE_SIZE).toBe(1024 * 1024);
    });
  });

  describe('validateWav', () => {
    it('should pass valid WAV parameters', () => {
      const result = validateWav({
        duration: 3.0,
        fileSize: 264600
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass at minimum duration boundary', () => {
      const result = validateWav({
        duration: 2.0,
        fileSize: 176400
      });
      expect(result.valid).toBe(true);
    });

    it('should pass at maximum duration boundary', () => {
      const result = validateWav({
        duration: 5.0,
        fileSize: 441000
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when duration is too short', () => {
      const result = validateWav({
        duration: 1.5,
        fileSize: 132300
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('below minimum');
    });

    it('should fail when duration is too long', () => {
      const result = validateWav({
        duration: 6.0,
        fileSize: 529200
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should fail when file size exceeds limit', () => {
      const result = validateWav({
        duration: 3.0,
        fileSize: 1024 * 1024 + 1
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should fail when file is empty', () => {
      const result = validateWav({
        duration: 3.0,
        fileSize: 0
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('empty'))).toBe(true);
    });

    it('should collect multiple errors', () => {
      const result = validateWav({
        duration: 0.5,
        fileSize: 2 * 1024 * 1024
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should pass at exact max file size', () => {
      const result = validateWav({
        duration: 3.0,
        fileSize: 1024 * 1024
      });
      expect(result.valid).toBe(true);
    });
  });
});
