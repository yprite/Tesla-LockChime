import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mountDashboardHtml() {
  const html = fs.readFileSync('dashboard.html', 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  document.body.innerHTML = match ? match[1] : '';
}

function mockFirebase() {
  const manifestsApi = { get: vi.fn(async () => ({ forEach: () => {} })), doc: vi.fn(() => ({ set: vi.fn(async () => {}) })) };
  const userDocApi = { collection: vi.fn(() => manifestsApi) };
  const rootCollectionApi = { doc: vi.fn(() => userDocApi) };
  const aliasDocApi = {
    get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
    set: vi.fn(async () => {})
  };
  const genericCollectionApi = { doc: vi.fn(() => aliasDocApi) };

  const db = {
    collection: vi.fn((name) => {
      if (name === 'userWidgets') return rootCollectionApi;
      return genericCollectionApi;
    })
  };

  const authApi = {
    onAuthStateChanged: vi.fn((cb) => cb(null)),
    signInWithPopup: vi.fn(async () => ({})),
    signOut: vi.fn(async () => {})
  };

  const authFn = () => authApi;
  authFn.GoogleAuthProvider = class {};
  authFn.OAuthProvider = class {};

  const firestoreFn = () => db;
  firestoreFn.FieldValue = { serverTimestamp: () => ({}) };

  global.firebase = {
    apps: [],
    initializeApp: vi.fn(() => global.firebase.apps.push({})),
    auth: authFn,
    firestore: firestoreFn
  };
}

async function bootDashboard() {
  localStorage.clear();
  mountDashboardHtml();
  mockFirebase();
  vi.resetModules();
  await import('../js/i18n.js');
  await import('../js/dashboard.js');
  window.dispatchEvent(new Event('DOMContentLoaded'));
  await Promise.resolve();
  await Promise.resolve();
}

describe('Dashboard layout constraints', () => {
  beforeEach(async () => {
    await bootDashboard();
  });

  afterEach(() => {
    delete global.firebase;
    delete window.__dashboardBuilder;
    delete window.__dashboardLayoutUtils;
    document.body.innerHTML = '';
  });

  it('exposes overlap and bounds helpers', () => {
    const utils = window.__dashboardLayoutUtils;
    expect(utils.isLayoutInBounds({ x: 0, y: 0, w: 2, h: 2 })).toBe(true);
    expect(utils.isLayoutInBounds({ x: 11, y: 7, w: 2, h: 2 })).toBe(false);
    expect(utils.rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 })).toBe(true);
    expect(utils.rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 2, w: 2, h: 2 })).toBe(false);
  });

  it('flags invalid dashboard layouts with overlaps', () => {
    const builder = window.__dashboardBuilder;
    builder.state.widgets.clock = true;
    builder.state.widgets.weather = true;
    builder.state.layouts.clock = { x: 0, y: 0, w: 3, h: 3 };
    builder.state.layouts.weather = { x: 1, y: 1, w: 3, h: 2 };

    const result = builder.validateDashboardLayout();
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes('overlap'))).toBe(true);
  });
});
