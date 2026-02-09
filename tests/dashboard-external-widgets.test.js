import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mountDashboardHtml() {
  const html = fs.readFileSync('dashboard.html', 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  document.body.innerHTML = match ? match[1] : '';
}

function mockFirebaseWithUser() {
  const manifestsDocApi = { set: vi.fn(async () => {}) };
  const manifestsCollectionApi = {
    get: vi.fn(async () => ({ forEach: () => {} })),
    doc: vi.fn(() => manifestsDocApi)
  };
  const userDocApi = { collection: vi.fn(() => manifestsCollectionApi) };
  const userWidgetsCollectionApi = { doc: vi.fn(() => userDocApi) };

  const genericDocApi = { get: vi.fn(async () => ({ exists: false, data: () => ({}) })), set: vi.fn(async () => {}) };
  const genericCollectionApi = { doc: vi.fn(() => genericDocApi) };

  const db = {
    collection: vi.fn((name) => {
      if (name === 'userWidgets') return userWidgetsCollectionApi;
      return genericCollectionApi;
    })
  };

  const authApi = {
    onAuthStateChanged: vi.fn((cb) => cb({ uid: 'u1', email: 'a@b.com' })),
    signInWithPopup: vi.fn(async () => ({})),
    signOut: vi.fn(async () => {})
  };

  const authFn = () => authApi;
  authFn.GoogleAuthProvider = class {};
  authFn.OAuthProvider = class {};
  const firestoreFn = () => db;
  firestoreFn.FieldValue = { serverTimestamp: () => ({}) };

  global.firebase = { apps: [], initializeApp: vi.fn(() => global.firebase.apps.push({})), auth: authFn, firestore: firestoreFn };
  return { manifestsDocApi };
}

describe('Dashboard external widget manifests', () => {
  let handles;

  beforeEach(async () => {
    localStorage.clear();
    mountDashboardHtml();
    handles = mockFirebaseWithUser();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'fuel-monitor', name: 'Fuel Monitor', category: 'vehicle', style: 'data', skin: 'charcoal' })
    }));
    global.alert = vi.fn();
    vi.resetModules();
    await import('../js/i18n.js');
    await import('../js/dashboard.js');
    window.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    delete global.firebase;
    delete global.fetch;
    delete global.alert;
    delete window.__dashboardBuilder;
    document.body.innerHTML = '';
  });

  it('normalizes and stores external manifests', async () => {
    const builder = window.__dashboardBuilder;
    document.getElementById('external-widget-url').value = 'https://example.com/fuel.json';
    await builder.handleAddExternalWidget();

    expect(handles.manifestsDocApi.set).toHaveBeenCalledTimes(1);
    expect(builder.externalWidgets.some((widget) => widget.id === 'ext_fuel-monitor')).toBe(true);
  });
});
