import { describe, it, expect } from 'vitest';
import {
  PROMPT_TEMPLATES,
  VALID_CATEGORIES,
  selectBatchPrompts
} from '../scripts/sound-prompts.js';

describe('Sound Prompts', () => {
  describe('PROMPT_TEMPLATES', () => {
    it('should have 120 prompt templates', () => {
      expect(PROMPT_TEMPLATES.length).toBe(120);
    });

    it('should have 20 prompts per category', () => {
      for (const category of VALID_CATEGORIES) {
        const count = PROMPT_TEMPLATES.filter(p => p.category === category).length;
        expect(count, `Category "${category}" should have 20 prompts`).toBe(20);
      }
    });

    it('should have unique IDs across all prompts', () => {
      const ids = PROMPT_TEMPLATES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields on every prompt', () => {
      const requiredFields = ['id', 'category', 'name', 'description', 'prompt', 'duration'];

      for (const template of PROMPT_TEMPLATES) {
        for (const field of requiredFields) {
          expect(
            template[field],
            `Prompt "${template.id}" missing field "${field}"`
          ).toBeDefined();
        }
      }
    });

    it('should have name length <= 50 characters', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          template.name.length,
          `Prompt "${template.id}" name "${template.name}" exceeds 50 chars`
        ).toBeLessThanOrEqual(50);
      }
    });

    it('should have description length <= 200 characters', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          template.description.length,
          `Prompt "${template.id}" description exceeds 200 chars`
        ).toBeLessThanOrEqual(200);
      }
    });

    it('should have valid categories', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          VALID_CATEGORIES,
          `Prompt "${template.id}" has invalid category "${template.category}"`
        ).toContain(template.category);
      }
    });

    it('should have duration between 2.0 and 5.0 seconds', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          template.duration,
          `Prompt "${template.id}" duration ${template.duration} out of range`
        ).toBeGreaterThanOrEqual(2.0);
        expect(
          template.duration,
          `Prompt "${template.id}" duration ${template.duration} out of range`
        ).toBeLessThanOrEqual(5.0);
      }
    });

    it('should have non-empty prompt text', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          template.prompt.length,
          `Prompt "${template.id}" has empty prompt text`
        ).toBeGreaterThan(10);
      }
    });

    it('should have ID format matching category prefix', () => {
      for (const template of PROMPT_TEMPLATES) {
        expect(
          template.id.startsWith(template.category),
          `Prompt "${template.id}" should start with "${template.category}"`
        ).toBe(true);
      }
    });
  });

  describe('VALID_CATEGORIES', () => {
    it('should have 6 categories', () => {
      expect(VALID_CATEGORIES.length).toBe(6);
    });

    it('should contain expected categories', () => {
      expect(VALID_CATEGORIES).toEqual([
        'classic', 'modern', 'futuristic', 'custom', 'funny', 'musical'
      ]);
    });
  });

  describe('selectBatchPrompts', () => {
    it('should return requested number of prompts', () => {
      const result = selectBatchPrompts(5, []);
      expect(result.length).toBe(5);
    });

    it('should distribute prompts across categories', () => {
      const result = selectBatchPrompts(6, []);
      const categories = result.map(p => p.category);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBe(6);
    });

    it('should exclude existing prompt IDs', () => {
      const existingIds = ['classic_001', 'modern_001', 'futuristic_001'];
      const result = selectBatchPrompts(6, existingIds);

      for (const prompt of result) {
        expect(existingIds).not.toContain(prompt.id);
      }
    });

    it('should return empty array when all prompts are exhausted', () => {
      const allIds = PROMPT_TEMPLATES.map(p => p.id);
      const result = selectBatchPrompts(5, allIds);
      expect(result.length).toBe(0);
    });

    it('should return fewer prompts if not enough available', () => {
      const allButThree = PROMPT_TEMPLATES.slice(3).map(p => p.id);
      const result = selectBatchPrompts(10, allButThree);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty existingPromptIds', () => {
      const result = selectBatchPrompts(3, []);
      expect(result.length).toBe(3);
    });

    it('should handle default existingPromptIds parameter', () => {
      const result = selectBatchPrompts(3);
      expect(result.length).toBe(3);
    });

    it('should not return duplicate prompts', () => {
      const result = selectBatchPrompts(20, []);
      const ids = result.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should prioritize round-robin across categories', () => {
      const result = selectBatchPrompts(12, []);
      const categoryCounts = {};
      for (const prompt of result) {
        categoryCounts[prompt.category] = (categoryCounts[prompt.category] || 0) + 1;
      }
      for (const count of Object.values(categoryCounts)) {
        expect(count).toBe(2);
      }
    });
  });
});
