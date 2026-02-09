import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mountDashboardHtml() {
  const html = fs.readFileSync('dashboard.html', 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  document.body.innerHTML = match ? match[1] : '';
}

function mockFirebase() {
  const docApi = { get: vi.fn(async () => ({ exists: false, data: () => ({}) })), set: vi.fn(async () => {}) };
  const collectionApi = { doc: vi.fn(() => docApi) };
  const db = { collection: vi.fn(() => collectionApi) };
  const authApi = { onAuthStateChanged: vi.fn((cb) => cb(null)), signInWithPopup: vi.fn(async () => ({})), signOut: vi.fn(async () => {}) };

  const authFn = () => authApi;
  authFn.GoogleAuthProvider = class {};
  authFn.OAuthProvider = class {};
  const firestoreFn = () => db;
  firestoreFn.FieldValue = { serverTimestamp: () => ({}) };

  global.firebase = { apps: [], initializeApp: vi.fn(() => global.firebase.apps.push({})), auth: authFn, firestore: firestoreFn };
}

describe('Dashboard widget catalog UX', () => {
  beforeEach(async () => {
    localStorage.clear();
    mountDashboardHtml();
    mockFirebase();
    vi.resetModules();
    await import('../js/i18n.js');
    await import('../js/dashboard.js');
    window.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    delete global.firebase;
    delete window.__dashboardBuilder;
    document.body.innerHTML = '';
  });

  it('renders preview cards in catalog', () => {
    const cards = document.querySelectorAll('.widget-item .widget-item-preview');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('disables add when no free grid space remains', () => {
    const builder = window.__dashboardBuilder;
    Object.keys(builder.state.widgets).forEach((id) => {
      builder.state.widgets[id] = false;
    });
    builder.state.widgets.clock = true;
    builder.state.layouts.clock = { x: 0, y: 0, w: 12, h: 8 };
    builder.renderWidgetControls();

    const addWeather = document.querySelector('button[data-action="add"][data-widget-id="weather"]');
    expect(addWeather).not.toBeNull();
    expect(addWeather.disabled).toBe(true);
  });
});
