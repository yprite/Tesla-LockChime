import { describe, it, expect } from 'vitest';
import {
  isRetryableError,
  estimateCredits,
  generateSoundId,
  getRetryDelay,
  CREDITS_PER_SECOND
} from '../scripts/generate-sounds.js';

describe('Generate Sounds', () => {
  describe('generateSoundId', () => {
    it('should start with "sound_"', () => {
      const id = generateSoundId();
      expect(id.startsWith('sound_')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i += 1) {
        ids.add(generateSoundId());
      }
      expect(ids.size).toBe(100);
    });

    it('should contain timestamp and random portion', () => {
      const id = generateSoundId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('sound');
      expect(Number(parts[1])).toBeGreaterThan(0);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for 429 rate limit', () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('should return true for 500 server error', () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
    });

    it('should return true for 502 bad gateway', () => {
      expect(isRetryableError({ status: 502 })).toBe(true);
    });

    it('should return true for 503 service unavailable', () => {
      expect(isRetryableError({ status: 503 })).toBe(true);
    });

    it('should return false for 400 bad request', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
    });

    it('should return false for 401 unauthorized', () => {
      expect(isRetryableError({ status: 401 })).toBe(false);
    });

    it('should return false for 403 forbidden', () => {
      expect(isRetryableError({ status: 403 })).toBe(false);
    });

    it('should return true for ETIMEDOUT', () => {
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should return true for ECONNRESET', () => {
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('should return true for ECONNREFUSED', () => {
      expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should return false for null error', () => {
      expect(isRetryableError(null)).toBe(false);
    });

    it('should return false for undefined error', () => {
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for generic error without status or code', () => {
      expect(isRetryableError({ message: 'something went wrong' })).toBe(false);
    });
  });

  describe('estimateCredits', () => {
    it('should use CREDITS_PER_SECOND constant', () => {
      expect(CREDITS_PER_SECOND).toBe(20);
    });

    it('should calculate credits based on total duration', () => {
      const prompts = [
        { duration: 3.0 },
        { duration: 2.5 },
        { duration: 4.0 }
      ];
      expect(estimateCredits(prompts)).toBe(9.5 * CREDITS_PER_SECOND);
    });

    it('should return 0 for empty array', () => {
      expect(estimateCredits([])).toBe(0);
    });

    it('should handle single prompt', () => {
      const prompts = [{ duration: 3.0 }];
      expect(estimateCredits(prompts)).toBe(3.0 * CREDITS_PER_SECOND);
    });

    it('should calculate typical batch of 5 prompts at 3s', () => {
      const prompts = Array.from({ length: 5 }, () => ({ duration: 3.0 }));
      expect(estimateCredits(prompts)).toBe(15 * CREDITS_PER_SECOND);
    });
  });

  describe('getRetryDelay', () => {
    it('should return 1000ms for first attempt', () => {
      expect(getRetryDelay(0)).toBe(1000);
    });

    it('should return 3000ms for second attempt', () => {
      expect(getRetryDelay(1)).toBe(3000);
    });

    it('should return 9000ms for third attempt', () => {
      expect(getRetryDelay(2)).toBe(9000);
    });

    it('should follow exponential backoff pattern', () => {
      const delay0 = getRetryDelay(0);
      const delay1 = getRetryDelay(1);
      const delay2 = getRetryDelay(2);
      expect(delay1 / delay0).toBe(3);
      expect(delay2 / delay1).toBe(3);
    });
  });
});
