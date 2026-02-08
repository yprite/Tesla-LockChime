const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAsrRsJVRCF-2nDCGNucE9FT_25OenDSrQ",
  authDomain: "tesla-lock-sounds.firebaseapp.com",
  projectId: "tesla-lock-sounds",
  storageBucket: "tesla-lock-sounds.firebasestorage.app",
  messagingSenderId: "1067424699027",
  appId: "1:1067424699027:web:3c7105f523f26c3005f366"
};

const MODEL_PRESETS = {
  model3: { label: "Model 3", width: 1920, height: 1200, maxWidth: 1100 },
  modely: { label: "Model Y", width: 1920, height: 1200, maxWidth: 1100 },
  models: { label: "Model S", width: 2200, height: 1300, maxWidth: 1160 },
  modelx: { label: "Model X", width: 2200, height: 1300, maxWidth: 1160 },
  cybertruck: { label: "Cybertruck", width: 2560, height: 1600, maxWidth: 1220 }
};

const WIDGET_LIBRARY = [
  { id: "clock", label: "Clock", size: "m", tone: "neutral", defaultOn: true },
  { id: "greeting", label: "Greeting", size: "m", tone: "cyan", defaultOn: true },
  { id: "weekly", label: "Weekly Challenge", size: "m", tone: "orange", defaultOn: true },
  { id: "badges", label: "Badge Shelf", size: "m", tone: "violet", defaultOn: true },
  { id: "quickchat", label: "Quick Chat", size: "s", tone: "green", defaultOn: true },
  { id: "battery", label: "Battery", size: "s", tone: "green", defaultOn: true },
  { id: "range", label: "Range", size: "s", tone: "cyan", defaultOn: true },
  { id: "media", label: "Media Shortcut", size: "m", tone: "red", defaultOn: true },
  { id: "weather", label: "Weather", size: "s", tone: "neutral", defaultOn: true },
  { id: "calendar", label: "Calendar", size: "s", tone: "violet", defaultOn: false },
  { id: "alerts", label: "Alerts", size: "s", tone: "red", defaultOn: false },
  { id: "energy", label: "Energy Efficiency", size: "m", tone: "green", defaultOn: false },
  { id: "cost", label: "Monthly Cost", size: "s", tone: "orange", defaultOn: false },
  { id: "charging", label: "Charging ETA", size: "m", tone: "cyan", defaultOn: false },
  { id: "tires", label: "Tire Pressure", size: "m", tone: "neutral", defaultOn: false },
  { id: "navigation", label: "Next Route", size: "l", tone: "violet", defaultOn: false },
  { id: "notes", label: "Driver Notes", size: "m", tone: "neutral", defaultOn: false },
  { id: "shortcut", label: "One-Tap Actions", size: "l", tone: "orange", defaultOn: false },
  { id: "quote", label: "Daily Quote", size: "s", tone: "cyan", defaultOn: false }
];

function createDefaultWidgetState() {
  return WIDGET_LIBRARY.reduce((acc, widget) => {
    acc[widget.id] = Boolean(widget.defaultOn);
    return acc;
  }, {});
}

const DEFAULT_STATE = {
  vehicleModel: "modely",
  backgroundTheme: "tesla-red",
  backgroundImageUrl: "",
  widgets: createDefaultWidgetState()
};

class DashboardBuilder {
  constructor() {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.user = null;
    this.dashboardId = localStorage.getItem("dashboard_id") || "";
    this.publicId = localStorage.getItem("dashboard_public_id") || "";
    this.viewedOwnerUid = "";
    this.state = this.createState(DEFAULT_STATE);
    this.widgetElements = {};
    this.clockMainEl = null;
    this.els = this.cacheElements();
    this.renderWidgetControls();
    this.bindEvents();
    this.startClock();
    this.init();
  }

  createState(base) {
    return {
      ...DEFAULT_STATE,
      ...(base || {}),
      widgets: {
        ...DEFAULT_STATE.widgets,
        ...((base && base.widgets) || {})
      }
    };
  }

  cacheElements() {
    return {
      user: document.getElementById("dash-user"),
      btnLogin: document.getElementById("btn-login"),
      providerMenu: document.getElementById("dash-provider-menu"),
      btnLoginGoogle: document.getElementById("btn-login-google"),
      btnLoginKakao: document.getElementById("btn-login-kakao"),
      btnLoginNaver: document.getElementById("btn-login-naver"),
      btnLogout: document.getElementById("btn-logout"),
      vehicleModel: document.getElementById("vehicle-model"),
      modelSize: document.getElementById("model-size"),
      bgTheme: document.getElementById("bg-theme"),
      bgImageUrl: document.getElementById("bg-image-url"),
      widgetControls: document.getElementById("widget-controls"),
      widgetGrid: document.getElementById("widget-grid"),
      preview: document.getElementById("dashboard-preview"),
      btnPreview: document.getElementById("btn-preview"),
      btnSave: document.getElementById("btn-save"),
      btnSaveCopy: document.getElementById("btn-save-copy"),
      publicId: document.getElementById("public-id"),
      btnCopyLink: document.getElementById("btn-copy-link"),
      ownerQuery: document.getElementById("owner-query"),
      btnLoadOwner: document.getElementById("btn-load-owner")
    };
  }

  renderWidgetControls() {
    if (!this.els.widgetControls) return;
    this.els.widgetControls.innerHTML = "";

    for (const widget of WIDGET_LIBRARY) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.widgetId = widget.id;
      input.checked = Boolean(this.state.widgets[widget.id]);
      label.appendChild(input);
      label.appendChild(document.createTextNode(widget.label));
      this.els.widgetControls.appendChild(label);
    }
  }

  bindEvents() {
    this.els.btnLogin?.addEventListener("click", () => {
      this.els.providerMenu.style.display = this.els.providerMenu.style.display === "flex" ? "none" : "flex";
    });
    this.els.btnLoginGoogle?.addEventListener("click", () => this.signIn("google"));
    this.els.btnLoginKakao?.addEventListener("click", () => this.signIn("kakao"));
    this.els.btnLoginNaver?.addEventListener("click", () => this.signIn("naver"));
    this.els.btnLogout?.addEventListener("click", () => this.auth.signOut());
    this.els.btnPreview?.addEventListener("click", () => this.applyFromEditor());
    this.els.btnSave?.addEventListener("click", () => this.saveDashboard({ asCopy: false }));
    this.els.btnSaveCopy?.addEventListener("click", () => this.saveDashboard({ asCopy: true }));
    this.els.btnCopyLink?.addEventListener("click", () => this.copyShareLink());
    this.els.btnLoadOwner?.addEventListener("click", () => this.openOwnerFromInput());

    this.els.ownerQuery?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.openOwnerFromInput();
      }
    });

    this.els.vehicleModel?.addEventListener("change", () => {
      this.applyFromEditor();
      this.updateModelBadge();
    });

    this.els.bgTheme?.addEventListener("change", () => this.applyFromEditor());
    this.els.bgImageUrl?.addEventListener("change", () => this.applyFromEditor());

    this.els.widgetControls?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.dataset.widgetId) return;
      this.applyFromEditor();
    });
  }

  async init() {
    this.auth.onAuthStateChanged(async (user) => {
      this.user = user || null;
      this.updateAuthUi();
      await this.loadDashboardFromRouteOrOwner();
    });
    this.updateAuthUi();
    await this.loadDashboardFromRouteOrOwner();
  }

  updateAuthUi() {
    const signedIn = Boolean(this.user);
    this.els.btnLogin.style.display = signedIn ? "none" : "inline-flex";
    this.els.providerMenu.style.display = "none";
    this.els.btnLogout.style.display = signedIn ? "inline-flex" : "none";
    this.els.btnSave.disabled = !signedIn;
    if (this.user) {
      this.els.user.textContent = this.user.email || this.user.uid;
    } else {
      this.els.user.textContent = "Not signed in";
    }
    this.updateSaveCopyVisibility();
  }

  updateSaveCopyVisibility() {
    if (!this.els.btnSaveCopy) return;
    const canCopy = Boolean(this.user && this.viewedOwnerUid && this.viewedOwnerUid !== this.user.uid);
    this.els.btnSaveCopy.style.display = canCopy ? "inline-flex" : "none";
  }

  async signIn(providerType) {
    let provider = null;
    if (providerType === "google") provider = new firebase.auth.GoogleAuthProvider();
    if (providerType === "kakao") provider = new firebase.auth.OAuthProvider("oidc.kakao");
    if (providerType === "naver") provider = new firebase.auth.OAuthProvider("oidc.naver");
    if (!provider) return;
    try {
      await this.auth.signInWithPopup(provider);
    } catch (error) {
      alert("Login failed. Check OAuth provider setup.");
    }
  }

  makePublicId() {
    return `dash-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  }

  encodeKey(raw) {
    return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  emailAliasKey(email) {
    return `email_${this.encodeKey(String(email || "").trim().toLowerCase())}`;
  }

  publicAliasKey(id) {
    return `id_${String(id || "").trim().toLowerCase()}`;
  }

  async resolveOwnerToDashboardId(ownerParam) {
    if (!ownerParam) return null;
    const raw = String(ownerParam).trim();
    const aliasKey = raw.includes("@") ? this.emailAliasKey(raw) : this.publicAliasKey(raw);
    const aliasDoc = await this.db.collection("dashboardAliases").doc(aliasKey).get();
    if (!aliasDoc.exists) return null;
    const data = aliasDoc.data() || {};
    return data.dashboardId || null;
  }

  async fetchDashboardById(dashboardId) {
    if (!dashboardId) return false;
    const doc = await this.db.collection("dashboards").doc(dashboardId).get();
    if (!doc.exists) return false;

    const data = doc.data() || {};
    this.dashboardId = doc.id;
    this.publicId = data.publicId || "";
    this.viewedOwnerUid = data.ownerUid || "";
    this.state = this.createState(data.config || DEFAULT_STATE);
    localStorage.setItem("dashboard_id", this.dashboardId);
    if (this.publicId) localStorage.setItem("dashboard_public_id", this.publicId);
    return true;
  }

  async loadDashboardFromRouteOrOwner() {
    const params = new URLSearchParams(location.search);
    const owner = params.get("owner");
    let found = false;

    if (owner) {
      const dashboardId = await this.resolveOwnerToDashboardId(owner);
      found = await this.fetchDashboardById(dashboardId);
      if (this.els.ownerQuery) this.els.ownerQuery.value = owner;
    }

    if (!found && this.user?.email) {
      const ownDashboardId = await this.resolveOwnerToDashboardId(this.user.email);
      found = await this.fetchDashboardById(ownDashboardId);
    }

    if (!found && this.publicId) {
      const dashboardId = await this.resolveOwnerToDashboardId(this.publicId);
      found = await this.fetchDashboardById(dashboardId);
    }

    if (!found) {
      this.state = this.createState(DEFAULT_STATE);
      this.viewedOwnerUid = "";
    }

    this.syncEditorFromState();
    this.renderPreview();
    this.updateSaveCopyVisibility();
  }

  applyFromEditor() {
    this.state.vehicleModel = this.els.vehicleModel.value;
    this.state.backgroundTheme = this.els.bgTheme.value;
    this.state.backgroundImageUrl = this.els.bgImageUrl.value.trim();

    const nextWidgets = { ...DEFAULT_STATE.widgets };
    const checks = this.els.widgetControls?.querySelectorAll('input[type="checkbox"][data-widget-id]') || [];
    checks.forEach((check) => {
      const id = check.dataset.widgetId;
      if (!id) return;
      nextWidgets[id] = check.checked;
    });

    this.state.widgets = nextWidgets;
    this.renderPreview();
  }

  syncEditorFromState() {
    this.els.vehicleModel.value = this.state.vehicleModel || DEFAULT_STATE.vehicleModel;
    this.els.bgTheme.value = this.state.backgroundTheme;
    this.els.bgImageUrl.value = this.state.backgroundImageUrl || "";

    const checks = this.els.widgetControls?.querySelectorAll('input[type="checkbox"][data-widget-id]') || [];
    checks.forEach((check) => {
      const id = check.dataset.widgetId;
      check.checked = Boolean(this.state.widgets[id]);
    });

    this.els.publicId.value = this.publicId || "";
    this.updateModelBadge();
  }

  renderPreview() {
    this.els.preview.className = `dashboard-preview theme-${this.state.backgroundTheme}`;
    this.applyModelPreset(this.state.vehicleModel || DEFAULT_STATE.vehicleModel);

    if (this.state.backgroundImageUrl) {
      this.els.preview.style.backgroundImage = `linear-gradient(120deg, rgba(0,0,0,.56), rgba(0,0,0,.36)), url('${this.escapeCssUrl(this.state.backgroundImageUrl)}')`;
    } else {
      this.els.preview.style.backgroundImage = "";
    }

    this.widgetElements = {};
    this.clockMainEl = null;
    this.els.widgetGrid.innerHTML = "";

    const ownerName = this.user?.displayName || this.user?.email?.split("@")[0] || "Tesla owner";

    for (const widget of WIDGET_LIBRARY) {
      if (!this.state.widgets[widget.id]) continue;
      const card = this.createWidgetCard(widget, ownerName);
      card.style.setProperty("--index", String(this.els.widgetGrid.children.length));
      this.widgetElements[widget.id] = card;
      this.els.widgetGrid.appendChild(card);
    }

    if (!this.els.widgetGrid.children.length) {
      const empty = document.createElement("div");
      empty.className = "dash-widget widget-size-l tone-neutral";
      empty.innerHTML = '<p class="widget-title">Empty</p><div class="widget-main">No widgets selected</div><div class="widget-sub">Enable widgets from the left panel.</div>';
      this.els.widgetGrid.appendChild(empty);
    }

    this.updateClockWidget();
  }

  createWidgetCard(widget, ownerName) {
    const card = document.createElement("article");
    card.className = `dash-widget widget-size-${widget.size} tone-${widget.tone}`;

    const content = this.getWidgetContent(widget.id, ownerName);
    if (content.accentClass) card.classList.add(content.accentClass);
    const topHtml = `<div class="widget-top"><p class="widget-title">${this.escapeHtml(content.title)}</p><span class="widget-badge">${this.escapeHtml(content.badge || "Live")}</span></div>`;
    const mainClass = content.mainMono ? "widget-main widget-mono" : "widget-main";
    const subClass = content.subMono ? "widget-sub widget-mono" : "widget-sub";
    const subLines = Array.isArray(content.subLines) ? content.subLines : [content.sub || ""];
    const subHtml = subLines.map((line) => `<div class="${subClass}">${this.escapeHtml(line)}</div>`).join("");
    const meterHtml = Number.isFinite(content.meter) ? `<div class="widget-meter"><i style="--meter:${Math.max(0, Math.min(100, content.meter))}%"></i></div>` : "";
    const barsHtml = Array.isArray(content.bars) ? this.buildBarsHtml(content.bars) : "";
    const pillsHtml = Array.isArray(content.pills) ? this.buildPillsHtml(content.pills) : "";
    const orbHtml = content.orb ? '<div class="widget-orb"></div><div class="widget-orb widget-orb-small"></div>' : "";
    card.innerHTML = `${topHtml}<div class="${mainClass}">${this.escapeHtml(content.main)}</div><div>${subHtml}${meterHtml}${barsHtml}${pillsHtml}</div>${orbHtml}`;

    if (widget.id === "clock") {
      this.clockMainEl = card.querySelector(".widget-main");
    }

    return card;
  }

  getWidgetContent(widgetId, ownerName) {
    const hour = new Date().getHours();
    const dayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    const map = {
      clock: { title: "Local Time", badge: "Now", main: "--:--", subLines: [dayLabel, "Dashboard sync active"], mainMono: true, subMono: true, accentClass: "widget-accent-cool", orb: true },
      greeting: { title: "Welcome", badge: "Driver", main: `Hi, ${ownerName}`, subLines: ["Ready for your next drive.", "Set your favorite shortcut cards"], pills: ["Open Trunk", "Preheat"], accentClass: "widget-accent-cool", orb: true },
      weekly: { title: "Weekly Challenge", badge: "Goal", main: "2 / 3", subLines: ["Finish 1 more eco-drive today."], meter: 66, pills: ["Eco", "Smooth", "No hard brake"], accentClass: "widget-accent-energy" },
      badges: { title: "Badge Shelf", badge: "Collection", main: "8 unlocked", subLines: ["Road Warrior, Night Owl, Safe Stop"], pills: ["+1 this week", "Streak 4d"] },
      quickchat: { title: "Quick Chat", badge: "Live", main: "4 msgs", subLines: ["Owners channel is active."], pills: ["Family", "Trip plan"] },
      battery: { title: "Battery", badge: "Pack", main: "82%", subLines: ["Health 96%", "Pack temp normal"], meter: 82, accentClass: "widget-accent-energy" },
      range: { title: "Estimated Range", badge: "Prediction", main: "351 km", subLines: ["Based on recent 7-day driving"], bars: [28, 36, 41, 33, 47, 58, 44], accentClass: "widget-accent-cool" },
      media: { title: "Now Playing", badge: "Audio", main: "Drive Playlist", subLines: ["Tap to open favorite mix"], bars: [8, 19, 32, 24, 38, 26, 17, 29], pills: ["Shuffle", "Repeat"], accentClass: "widget-accent-hot" },
      weather: { title: "Weather", badge: "Local", main: "11 C", subLines: ["Cloudy", "Rain chance 30%"], orb: true },
      calendar: { title: "Today", badge: "Agenda", main: dayLabel, subLines: ["Service check at 16:30"], pills: ["Garage", "Downtown"] },
      alerts: { title: "Vehicle Alerts", badge: "Attention", main: "1 active", subLines: ["Rear-left tire low pressure"], pills: ["Check now"], accentClass: "widget-accent-hot" },
      energy: { title: "Efficiency", badge: "Trend", main: "138 Wh/km", subLines: ["Better than 73% of peers"], bars: [24, 32, 26, 41, 37, 45, 49, 43], accentClass: "widget-accent-energy" },
      cost: { title: "Charging Cost", badge: "Monthly", main: "$42.80", subLines: ["-12% vs last month"], bars: [18, 21, 20, 17, 15, 13, 12], accentClass: "widget-accent-hot" },
      charging: { title: "Charging ETA", badge: "Supercharger", main: "00:28", subLines: ["To 90% at current speed"], mainMono: true, subMono: true, meter: 64, accentClass: "widget-accent-cool" },
      tires: { title: "Tire PSI", badge: "Pressure", main: "41 40 40 39", subLines: ["Front left trending low"], mainMono: true, subMono: true, bars: [39, 40, 40, 41] },
      navigation: { title: "Next Route", badge: "Nav", main: "Home to Office", subLines: ["27 min, light traffic"], pills: ["Avoid tolls", "Depart now", "Fast lane"], orb: true },
      notes: { title: "Driver Notes", badge: "Memo", main: "Wash reminder", subLines: ["Booked tomorrow 09:20"], pills: ["Family trip", "Charge to 90"] },
      shortcut: { title: "One-Tap Actions", badge: "Actions", main: "Preheat  Trunk  Sentry", subLines: ["Frequently used controls"], pills: ["Front defrost", "Dog mode", "Find car"], mainMono: true, subMono: true, accentClass: "widget-accent-hot" },
      quote: { title: "Drive Mindset", badge: "Daily", main: hour < 12 ? "Smooth inputs, long range." : "Charge smart, drive calm.", subLines: ["Small habits compound."], orb: true }
    };

    return map[widgetId] || { title: "Widget", main: "Ready", sub: "Configure from the left panel" };
  }

  buildBarsHtml(values) {
    const spans = values.map((value) => {
      const clamped = Math.max(8, Math.min(100, Number(value) || 8));
      return `<span style="height:${clamped}%"></span>`;
    }).join("");
    return `<div class="widget-mini-bars">${spans}</div>`;
  }

  buildPillsHtml(pills) {
    const items = pills.map((pill) => `<span class="widget-pill">${this.escapeHtml(pill)}</span>`).join("");
    return `<div class="widget-pill-row">${items}</div>`;
  }

  applyModelPreset(model) {
    const preset = MODEL_PRESETS[model] || MODEL_PRESETS.modely;
    this.els.preview.style.setProperty("--dash-ratio", `${preset.width} / ${preset.height}`);
    this.els.preview.style.setProperty("--dash-max-width", `${preset.maxWidth}px`);
  }

  updateModelBadge() {
    const preset = MODEL_PRESETS[this.els.vehicleModel.value] || MODEL_PRESETS.modely;
    if (this.els.modelSize) {
      this.els.modelSize.textContent = `Display: ${preset.width} x ${preset.height} (${preset.label})`;
    }
  }

  escapeCssUrl(url) {
    return String(url || "").replace(/['")\\]/g, "");
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  updateClockWidget() {
    if (!this.clockMainEl) return;
    const now = new Date();
    this.clockMainEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  startClock() {
    const tick = () => this.updateClockWidget();
    tick();
    setInterval(tick, 1000);
  }

  async saveDashboard(options = {}) {
    if (!this.user) {
      alert("Login required to save dashboard.");
      return;
    }

    const asCopy = Boolean(options.asCopy);
    this.applyFromEditor();

    let targetDashboardId = this.dashboardId;
    let targetPublicId = this.publicId;

    if (asCopy || !targetDashboardId || (this.viewedOwnerUid && this.viewedOwnerUid !== this.user.uid)) {
      targetDashboardId = `db_${this.user.uid}`;
      targetPublicId = this.makePublicId();
    } else if (!targetPublicId) {
      targetPublicId = this.makePublicId();
    }

    const ownerEmailLower = (this.user.email || "").toLowerCase();
    const payload = {
      ownerUid: this.user.uid,
      ownerEmailLower,
      publicId: targetPublicId,
      config: this.state,
      updatedAtMs: Date.now(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await this.db.collection("dashboards").doc(targetDashboardId).set(payload, { merge: true });

    await this.db.collection("dashboardAliases").doc(this.publicAliasKey(targetPublicId)).set({
      ownerUid: this.user.uid,
      dashboardId: targetDashboardId
    }, { merge: true });

    if (ownerEmailLower) {
      await this.db.collection("dashboardAliases").doc(this.emailAliasKey(ownerEmailLower)).set({
        ownerUid: this.user.uid,
        dashboardId: targetDashboardId
      }, { merge: true });
    }

    this.dashboardId = targetDashboardId;
    this.publicId = targetPublicId;
    this.viewedOwnerUid = this.user.uid;
    localStorage.setItem("dashboard_id", this.dashboardId);
    localStorage.setItem("dashboard_public_id", this.publicId);
    this.els.publicId.value = this.publicId;
    this.updateSaveCopyVisibility();
    alert(asCopy ? "Copied and saved to your account." : "Dashboard saved.");
  }

  copyShareLink() {
    const owner = this.publicId || "";
    if (!owner) {
      alert("Save once to generate public ID.");
      return;
    }
    const link = `${location.origin}/dashboard.html?owner=${encodeURIComponent(owner)}`;
    navigator.clipboard.writeText(link).then(
      () => alert("Share link copied."),
      () => alert(link)
    );
  }

  openOwnerFromInput() {
    const owner = (this.els.ownerQuery.value || "").trim();
    if (!owner) return;
    const target = `${location.origin}${location.pathname}?owner=${encodeURIComponent(owner)}`;
    location.assign(target);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new DashboardBuilder();
});
