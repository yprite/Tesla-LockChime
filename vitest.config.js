import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    environmentMatchGlobs: [
      ['tests/sound-prompts.test.js', 'node'],
      ['tests/wav-converter.test.js', 'node'],
      ['tests/generate-sounds.test.js', 'node']
    ],
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/**/*.js', 'scripts/**/*.js'],
      exclude: ['js/app.js']
    }
  }
});
