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

const GRID_SPEC = { cols: 12, rows: 8 };

const WIDGET_LIBRARY = [
  { id: "clock", label: "Clock", category: "utility", style: "minimal", skin: "charcoal", defaultOn: true, layout: { x: 0, y: 0, w: 2, h: 2 } },
  { id: "greeting", label: "Greeting", category: "social", style: "editorial", skin: "noir", defaultOn: true, layout: { x: 2, y: 0, w: 3, h: 2 } },
  { id: "weekly", label: "Weekly Challenge", category: "goal", style: "vivid", skin: "lime", defaultOn: true, layout: { x: 5, y: 0, w: 2, h: 2 } },
  { id: "badges", label: "Badge Shelf", category: "goal", style: "neon", skin: "indigo", defaultOn: true, layout: { x: 7, y: 0, w: 2, h: 2 } },
  { id: "quickchat", label: "Quick Chat", category: "social", style: "card", skin: "paper", defaultOn: true, layout: { x: 9, y: 0, w: 2, h: 2 } },
  { id: "battery", label: "Battery", category: "vehicle", style: "minimal", skin: "charcoal", defaultOn: true, layout: { x: 0, y: 2, w: 2, h: 2 } },
  { id: "range", label: "Range", category: "vehicle", style: "graph", skin: "forest", defaultOn: true, layout: { x: 2, y: 2, w: 2, h: 2 } },
  { id: "media", label: "Media Shortcut", category: "media", style: "vivid", skin: "coral", defaultOn: true, layout: { x: 4, y: 2, w: 3, h: 2 } },
  { id: "weather", label: "Weather", category: "utility", style: "minimal", skin: "noir", defaultOn: true, layout: { x: 7, y: 2, w: 2, h: 2 } },
  { id: "calendar", label: "Calendar", category: "utility", style: "card", skin: "paper", defaultOn: false, layout: { x: 9, y: 2, w: 2, h: 2 } },
  { id: "alerts", label: "Alerts", category: "vehicle", style: "vivid", skin: "coral", defaultOn: false, layout: { x: 0, y: 4, w: 2, h: 2 } },
  { id: "energy", label: "Energy Efficiency", category: "vehicle", style: "graph", skin: "forest", defaultOn: false, layout: { x: 2, y: 4, w: 2, h: 2 } },
  { id: "cost", label: "Monthly Cost", category: "finance", style: "vivid", skin: "lime", defaultOn: false, layout: { x: 4, y: 4, w: 2, h: 2 } },
  { id: "charging", label: "Charging ETA", category: "vehicle", style: "minimal", skin: "slate", defaultOn: false, layout: { x: 6, y: 4, w: 2, h: 2 } },
  { id: "tires", label: "Tire Pressure", category: "vehicle", style: "graph", skin: "noir", defaultOn: false, layout: { x: 8, y: 4, w: 2, h: 2 } },
  { id: "navigation", label: "Next Route", category: "navigation", style: "neon", skin: "indigo", defaultOn: false, layout: { x: 0, y: 6, w: 3, h: 2 } },
  { id: "notes", label: "Driver Notes", category: "utility", style: "card", skin: "paper", defaultOn: false, layout: { x: 3, y: 6, w: 2, h: 2 } },
  { id: "shortcut", label: "One-Tap Actions", category: "control", style: "minimal", skin: "charcoal", defaultOn: false, layout: { x: 5, y: 6, w: 3, h: 2 } },
  { id: "quote", label: "Daily Quote", category: "social", style: "neon", skin: "violet", defaultOn: false, layout: { x: 8, y: 6, w: 2, h: 2 } }
];

function createDefaultWidgetState() {
  return WIDGET_LIBRARY.reduce((acc, widget) => {
    acc[widget.id] = Boolean(widget.defaultOn);
    return acc;
  }, {});
}

function createDefaultLayouts() {
  return WIDGET_LIBRARY.reduce((acc, widget) => {
    acc[widget.id] = { ...widget.layout };
    return acc;
  }, {});
}

const DEFAULT_STATE = {
  vehicleModel: "modely",
  backgroundTheme: "tesla-red",
  backgroundImageUrl: "",
  widgets: createDefaultWidgetState(),
  layouts: createDefaultLayouts()
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
    this.clockMainEl = null;
    this.dragState = null;
    this.els = this.cacheElements();
    this.populateFilterOptions();
    this.renderWidgetControls();
    this.bindEvents();
    this.startClock();
    this.init();
  }

  createState(base) {
    const defaultLayouts = createDefaultLayouts();
    const input = base || {};
    const mergedLayouts = { ...defaultLayouts, ...((input.layouts && typeof input.layouts === "object") ? input.layouts : {}) };

    Object.keys(mergedLayouts).forEach((key) => {
      mergedLayouts[key] = this.normalizeLayout(mergedLayouts[key], defaultLayouts[key]);
    });

    return {
      ...DEFAULT_STATE,
      ...input,
      widgets: {
        ...DEFAULT_STATE.widgets,
        ...((input.widgets && typeof input.widgets === "object") ? input.widgets : {})
      },
      layouts: mergedLayouts
    };
  }

  normalizeLayout(layout, fallback) {
    const base = fallback || { x: 0, y: 0, w: 2, h: 2 };
    const raw = layout || base;
    const normalized = {
      x: Number.isFinite(raw.x) ? Math.floor(raw.x) : base.x,
      y: Number.isFinite(raw.y) ? Math.floor(raw.y) : base.y,
      w: Number.isFinite(raw.w) ? Math.floor(raw.w) : base.w,
      h: Number.isFinite(raw.h) ? Math.floor(raw.h) : base.h
    };

    normalized.w = Math.max(1, Math.min(GRID_SPEC.cols, normalized.w));
    normalized.h = Math.max(1, Math.min(GRID_SPEC.rows, normalized.h));
    normalized.x = Math.max(0, Math.min(GRID_SPEC.cols - normalized.w, normalized.x));
    normalized.y = Math.max(0, Math.min(GRID_SPEC.rows - normalized.h, normalized.y));
    return normalized;
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
      widgetSearch: document.getElementById("widget-search"),
      widgetFilterCategory: document.getElementById("widget-filter-category"),
      widgetFilterStyle: document.getElementById("widget-filter-style"),
      btnResetLayout: document.getElementById("btn-reset-layout"),
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

  populateFilterOptions() {
    const categories = [...new Set(WIDGET_LIBRARY.map((widget) => widget.category))];
    const styles = [...new Set(WIDGET_LIBRARY.map((widget) => widget.style))];

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = this.toTitle(category);
      this.els.widgetFilterCategory.appendChild(option);
    });

    styles.forEach((style) => {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = this.toTitle(style);
      this.els.widgetFilterStyle.appendChild(option);
    });
  }

  toTitle(value) {
    return String(value || "")
      .split(/[_\s-]+/)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  }

  getFilteredWidgets() {
    const query = (this.els.widgetSearch.value || "").trim().toLowerCase();
    const category = this.els.widgetFilterCategory.value || "all";
    const style = this.els.widgetFilterStyle.value || "all";

    return WIDGET_LIBRARY.filter((widget) => {
      if (category !== "all" && widget.category !== category) return false;
      if (style !== "all" && widget.style !== style) return false;
      if (!query) return true;
      return (`${widget.label} ${widget.category} ${widget.style}`).toLowerCase().includes(query);
    });
  }

  renderWidgetControls() {
    if (!this.els.widgetControls) return;
    const widgets = this.getFilteredWidgets();
    this.els.widgetControls.innerHTML = "";

    if (!widgets.length) {
      const empty = document.createElement("div");
      empty.className = "dash-subtext";
      empty.textContent = "No widgets match this filter.";
      this.els.widgetControls.appendChild(empty);
      return;
    }

    widgets.forEach((widget) => {
      const label = document.createElement("label");
      label.className = "widget-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.widgetId = widget.id;
      input.checked = Boolean(this.state.widgets[widget.id]);

      const textWrap = document.createElement("span");
      textWrap.className = "widget-item-text";
      const title = document.createElement("span");
      title.className = "widget-item-title";
      title.textContent = widget.label;
      const meta = document.createElement("span");
      meta.className = "widget-item-meta";
      meta.textContent = `${widget.category} · ${widget.style}`;

      textWrap.appendChild(title);
      textWrap.appendChild(meta);
      label.appendChild(input);
      label.appendChild(textWrap);
      this.els.widgetControls.appendChild(label);
    });
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
    this.els.btnResetLayout?.addEventListener("click", () => this.resetGridLayout());

    this.els.widgetSearch?.addEventListener("input", () => this.renderWidgetControls());
    this.els.widgetFilterCategory?.addEventListener("change", () => this.renderWidgetControls());
    this.els.widgetFilterStyle?.addEventListener("change", () => this.renderWidgetControls());

    this.els.widgetControls?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const widgetId = target.dataset.widgetId;
      if (!widgetId) return;
      this.state.widgets[widgetId] = target.checked;
      if (!this.state.layouts[widgetId]) {
        const libraryEntry = WIDGET_LIBRARY.find((widget) => widget.id === widgetId);
        this.state.layouts[widgetId] = this.normalizeLayout(libraryEntry?.layout);
      }
      this.renderPreview();
    });

    this.els.ownerQuery?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.openOwnerFromInput();
      }
    });

    this.els.vehicleModel?.addEventListener("change", () => {
      this.applyFromEditor();
      this.updateModelBadge();
    });

    this.els.bgTheme?.addEventListener("change", () => this.applyFromEditor());
    this.els.bgImageUrl?.addEventListener("change", () => this.applyFromEditor());

    this.bindGridInteraction();
  }

  bindGridInteraction() {
    const grid = this.els.widgetGrid;
    if (!grid) return;

    grid.style.touchAction = "none";

    grid.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const resizeHandle = target.closest(".widget-resize");
      const card = target.closest(".dash-widget");
      if (!card) return;

      const widgetId = card.getAttribute("data-widget-id");
      if (!widgetId) return;

      const initial = this.normalizeLayout(this.state.layouts[widgetId], this.getWidgetDefaultLayout(widgetId));
      this.dragState = {
        widgetId,
        card,
        mode: resizeHandle ? "resize" : "drag",
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        initial
      };

      card.classList.add(resizeHandle ? "resizing" : "dragging");
      card.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    grid.addEventListener("pointermove", (event) => {
      if (!this.dragState) return;
      if (this.dragState.pointerId !== event.pointerId) return;

      const next = this.computeDragLayout(event.clientX, event.clientY);
      this.applyCardLayout(this.dragState.card, next);
      this.state.layouts[this.dragState.widgetId] = next;
    });

    const releaseDrag = (event) => {
      if (!this.dragState) return;
      if (event && this.dragState.pointerId !== event.pointerId) return;
      this.dragState.card.classList.remove("dragging", "resizing");
      this.dragState = null;
      this.renderPreview();
    };

    grid.addEventListener("pointerup", releaseDrag);
    grid.addEventListener("pointercancel", releaseDrag);
  }

  computeDragLayout(currentX, currentY) {
    const drag = this.dragState;
    const rect = this.els.widgetGrid.getBoundingClientRect();
    const cellW = rect.width / GRID_SPEC.cols;
    const cellH = rect.height / GRID_SPEC.rows;
    const dx = currentX - drag.startX;
    const dy = currentY - drag.startY;

    const deltaX = Math.round(dx / Math.max(cellW, 1));
    const deltaY = Math.round(dy / Math.max(cellH, 1));

    let next;
    if (drag.mode === "resize") {
      next = {
        x: drag.initial.x,
        y: drag.initial.y,
        w: drag.initial.w + deltaX,
        h: drag.initial.h + deltaY
      };
    } else {
      next = {
        x: drag.initial.x + deltaX,
        y: drag.initial.y + deltaY,
        w: drag.initial.w,
        h: drag.initial.h
      };
    }

    return this.normalizeLayout(next, drag.initial);
  }

  applyCardLayout(card, layout) {
    card.style.setProperty("--x", String(layout.x));
    card.style.setProperty("--y", String(layout.y));
    card.style.setProperty("--w", String(layout.w));
    card.style.setProperty("--h", String(layout.h));
  }

  getWidgetDefaultLayout(widgetId) {
    const item = WIDGET_LIBRARY.find((widget) => widget.id === widgetId);
    return item?.layout || { x: 0, y: 0, w: 2, h: 2 };
  }

  resetGridLayout() {
    this.state.layouts = createDefaultLayouts();
    this.renderPreview();
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
    this.els.user.textContent = this.user ? (this.user.email || this.user.uid) : "Not signed in";
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
    this.renderWidgetControls();
    this.renderPreview();
    this.updateSaveCopyVisibility();
  }

  applyFromEditor() {
    this.state.vehicleModel = this.els.vehicleModel.value;
    this.state.backgroundTheme = this.els.bgTheme.value;
    this.state.backgroundImageUrl = this.els.bgImageUrl.value.trim();
    this.renderPreview();
  }

  syncEditorFromState() {
    this.els.vehicleModel.value = this.state.vehicleModel || DEFAULT_STATE.vehicleModel;
    this.els.bgTheme.value = this.state.backgroundTheme;
    this.els.bgImageUrl.value = this.state.backgroundImageUrl || "";
    this.els.publicId.value = this.publicId || "";
    this.updateModelBadge();
  }

  renderPreview() {
    this.els.preview.className = `dashboard-preview theme-${this.state.backgroundTheme}`;
    this.applyModelPreset(this.state.vehicleModel || DEFAULT_STATE.vehicleModel);

    if (this.state.backgroundImageUrl) {
      this.els.preview.style.backgroundImage = `linear-gradient(120deg, rgba(0,0,0,.2), rgba(0,0,0,.1)), url('${this.escapeCssUrl(this.state.backgroundImageUrl)}')`;
    } else {
      this.els.preview.style.backgroundImage = "";
    }

    this.els.widgetGrid.style.setProperty("--grid-cols", String(GRID_SPEC.cols));
    this.els.widgetGrid.style.setProperty("--grid-rows", String(GRID_SPEC.rows));

    this.clockMainEl = null;
    this.els.widgetGrid.innerHTML = "";

    const ownerName = this.user?.displayName || this.user?.email?.split("@")[0] || "Tesla owner";

    WIDGET_LIBRARY.forEach((widget) => {
      if (!this.state.widgets[widget.id]) return;
      const card = this.createWidgetCard(widget, ownerName);
      const layout = this.normalizeLayout(this.state.layouts[widget.id], widget.layout);
      this.state.layouts[widget.id] = layout;
      this.applyCardLayout(card, layout);
      card.style.setProperty("--grid-cols", String(GRID_SPEC.cols));
      card.style.setProperty("--grid-rows", String(GRID_SPEC.rows));
      this.els.widgetGrid.appendChild(card);
    });

    if (!this.els.widgetGrid.children.length) {
      const empty = document.createElement("div");
      empty.className = "dash-widget skin-paper";
      empty.style.setProperty("--x", "4");
      empty.style.setProperty("--y", "3");
      empty.style.setProperty("--w", "4");
      empty.style.setProperty("--h", "2");
      empty.style.setProperty("--grid-cols", String(GRID_SPEC.cols));
      empty.style.setProperty("--grid-rows", String(GRID_SPEC.rows));
      empty.innerHTML = '<div class="widget-top"><p class="widget-title">Empty</p><span class="widget-badge">Info</span></div><div class="widget-main">No widgets selected</div><div class="widget-sub">Enable widgets from the left panel.</div>';
      this.els.widgetGrid.appendChild(empty);
    }

    this.updateClockWidget();
  }

  createWidgetCard(widget, ownerName) {
    const card = document.createElement("article");
    card.className = `dash-widget skin-${widget.skin}`;
    card.setAttribute("data-widget-id", widget.id);

    const content = this.getWidgetContent(widget.id, ownerName);
    const topHtml = `<div class="widget-top"><p class="widget-title">${this.escapeHtml(content.title)}</p><span class="widget-badge">${this.escapeHtml(content.badge || "Live")}</span></div>`;
    const mainClass = content.mainMono ? "widget-main widget-mono" : "widget-main";
    const subClass = content.subMono ? "widget-sub widget-mono" : "widget-sub";
    const subLines = Array.isArray(content.subLines) ? content.subLines : [content.sub || ""];
    const subHtml = subLines.map((line) => `<div class="${subClass}">${this.escapeHtml(line)}</div>`).join("");
    const meterHtml = Number.isFinite(content.meter) ? `<div class="widget-meter"><i style="--meter:${Math.max(0, Math.min(100, content.meter))}%"></i></div>` : "";
    const barsHtml = Array.isArray(content.bars) ? this.buildBarsHtml(content.bars) : "";
    const pillsHtml = Array.isArray(content.pills) ? this.buildPillsHtml(content.pills) : "";

    card.innerHTML = `${topHtml}<div class="${mainClass}">${this.escapeHtml(content.main)}</div><div>${subHtml}${meterHtml}${barsHtml}${pillsHtml}</div><span class="widget-resize" title="Resize"></span>`;

    if (widget.id === "clock") {
      this.clockMainEl = card.querySelector(".widget-main");
    }

    return card;
  }

  getWidgetContent(widgetId, ownerName) {
    const hour = new Date().getHours();
    const dayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    const map = {
      clock: { title: "Clock", badge: "Now", main: "--:--", subLines: [dayLabel], mainMono: true, subMono: true },
      greeting: { title: "Owner", badge: "Hello", main: ownerName, subLines: ["Will be rainy and cold."], pills: ["Tokyo", "3 C"] },
      weekly: { title: "Challenge", badge: "Week", main: "63%", subLines: ["of work-time goals"], meter: 63 },
      badges: { title: "Badges", badge: "New", main: "8", subLines: ["Road Warrior unlocked"], pills: ["+1 today"] },
      quickchat: { title: "Quick Chat", badge: "Live", main: "4", subLines: ["new messages"], pills: ["Open"] },
      battery: { title: "Battery", badge: "Pack", main: "82%", subLines: ["369 km"], meter: 82 },
      range: { title: "Range", badge: "7D", main: "351 km", subLines: ["best route"], bars: [24, 32, 47, 36, 42, 58, 44] },
      media: { title: "Now Playing", badge: "Audio", main: "Drive - The Cars", subLines: ["00:54 / 03:34"], bars: [8, 15, 25, 30, 24, 31, 17, 12], pills: ["Play", "Next"] },
      weather: { title: "Weather", badge: "Local", main: "10 C", subLines: ["too early for storms"] },
      calendar: { title: "Calendar", badge: "Today", main: dayLabel, subLines: ["Service check 16:30"] },
      alerts: { title: "Alerts", badge: "1", main: "Tire low", subLines: ["Rear-left pressure"], pills: ["Check"] },
      energy: { title: "Efficiency", badge: "Trend", main: "138 Wh/km", subLines: ["better than last week"], bars: [22, 31, 28, 39, 36, 41, 46, 43] },
      cost: { title: "Cost", badge: "Month", main: "$42.8", subLines: ["-12%"], bars: [18, 20, 22, 19, 16, 14, 11] },
      charging: { title: "Charge ETA", badge: "DC", main: "00:28", subLines: ["to 90%"], mainMono: true, subMono: true, meter: 64 },
      tires: { title: "Tire PSI", badge: "Live", main: "41 40 40 39", subLines: ["Front left low"], mainMono: true, subMono: true, bars: [39, 40, 40, 41] },
      navigation: { title: "Next Route", badge: "Trip", main: "TOKYO", subLines: ["15:30"], mainMono: true, subMono: true, pills: ["12 Jan"] },
      notes: { title: "Notes", badge: "Memo", main: "2 coffees", subLines: ["left to gift"] },
      shortcut: { title: "Actions", badge: "Quick", main: "Preheat Trunk", subLines: ["Sentry Find Car"], pills: ["Run"] },
      quote: { title: "Quote", badge: "Daily", main: hour < 12 ? "No rain in 2 hours." : "In the middle lies opportunity.", subLines: ["Tesla owner mood"] }
    };

    return map[widgetId] || { title: "Widget", main: "Ready", subLines: ["Configure from left panel"] };
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
