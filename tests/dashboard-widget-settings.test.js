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

describe('Dashboard widget inspector settings', () => {
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

  it('shows inspector controls for selected weather widget and updates settings', () => {
    const builder = window.__dashboardBuilder;
    builder.state.widgets.weather = true;
    builder.selectWidget('weather');

    const weatherWrap = document.getElementById('inspector-weather');
    expect(weatherWrap.classList.contains('hidden')).toBe(false);

    const mode = document.getElementById('inspector-weather-mode');
    mode.value = 'manual';
    mode.dispatchEvent(new Event('change'));

    expect(builder.state.widgetSettings.weather.locationMode).toBe('manual');
  });

  it('applies size variant from inspector to widget layout', () => {
    const builder = window.__dashboardBuilder;
    builder.state.widgets.clock = true;
    builder.selectWidget('clock');

    const size = document.getElementById('inspector-size');
    size.value = 'large';
    size.dispatchEvent(new Event('change'));

    expect(builder.state.layouts.clock.w).toBeGreaterThanOrEqual(3);
    expect(builder.state.layouts.clock.h).toBeGreaterThanOrEqual(2);
  });
});
