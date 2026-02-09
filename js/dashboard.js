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
const SIZE_PRESETS = {
  small: { w: 2, h: 2 },
  medium: { w: 3, h: 2 },
  large: { w: 4, h: 3 }
};

function isLayoutInBounds(layout) {
  if (!layout) return false;
  return layout.x >= 0
    && layout.y >= 0
    && layout.w >= 1
    && layout.h >= 1
    && layout.x + layout.w <= GRID_SPEC.cols
    && layout.y + layout.h <= GRID_SPEC.rows;
}

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function canPlaceLayout(widgetId, layout, activeLayouts) {
  if (!isLayoutInBounds(layout)) return false;
  return Object.entries(activeLayouts || {}).every(([otherId, otherLayout]) => {
    if (!otherLayout || otherId === widgetId) return true;
    return !rectsOverlap(layout, otherLayout);
  });
}

function findFirstFit(widgetId, preferredLayout, activeLayouts) {
  const base = preferredLayout || SIZE_PRESETS.small;
  for (let y = 0; y <= GRID_SPEC.rows - base.h; y += 1) {
    for (let x = 0; x <= GRID_SPEC.cols - base.w; x += 1) {
      const candidate = { x, y, w: base.w, h: base.h };
      if (canPlaceLayout(widgetId, candidate, activeLayouts)) return candidate;
    }
  }
  return null;
}

function sanitizeSizeVariants(layout) {
  const medium = {
    w: Math.max(1, Math.min(GRID_SPEC.cols, layout?.w || SIZE_PRESETS.medium.w)),
    h: Math.max(1, Math.min(GRID_SPEC.rows, layout?.h || SIZE_PRESETS.medium.h))
  };
  const small = {
    w: Math.max(1, Math.min(medium.w, SIZE_PRESETS.small.w)),
    h: Math.max(1, Math.min(medium.h, SIZE_PRESETS.small.h))
  };
  const large = {
    w: Math.max(medium.w, Math.min(GRID_SPEC.cols, medium.w + 1)),
    h: Math.max(medium.h, Math.min(GRID_SPEC.rows, medium.h + 1))
  };
  return { small, medium, large };
}

function normalizeWidgetDefinition(widget) {
  const sizeVariants = sanitizeSizeVariants(widget.layout);
  return {
    ...widget,
    sizeVariants,
    source: widget.source || "builtin"
  };
}

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
  { id: "quote", label: "Daily Quote", category: "social", style: "neon", skin: "violet", defaultOn: false, layout: { x: 8, y: 6, w: 2, h: 2 } },
  { id: "streamDeck", label: "Stream Deck", category: "media", style: "data", skin: "noir", defaultOn: false, layout: { x: 0, y: 0, w: 4, h: 2 } },
  { id: "lifeTracker", label: "Life Tracker", category: "goal", style: "card", skin: "paper", defaultOn: false, layout: { x: 4, y: 0, w: 3, h: 2 } },
  { id: "weatherTiles", label: "Weather Tiles", category: "utility", style: "tile", skin: "lime", defaultOn: false, layout: { x: 7, y: 0, w: 3, h: 2 } },
  { id: "clockGrid", label: "Clock Grid", category: "utility", style: "tile", skin: "coral", defaultOn: false, layout: { x: 0, y: 2, w: 3, h: 2 } },
  { id: "sleepSuite", label: "Sleep Suite", category: "health", style: "minimal", skin: "charcoal", defaultOn: false, layout: { x: 3, y: 2, w: 4, h: 2 } },
  { id: "raceLap", label: "Race Lap", category: "performance", style: "neon", skin: "coral", defaultOn: false, layout: { x: 7, y: 2, w: 3, h: 2 } },
  { id: "wavePulse", label: "Wave Pulse", category: "health", style: "neon", skin: "noir", defaultOn: false, layout: { x: 0, y: 4, w: 3, h: 2 } },
  { id: "phoneStack", label: "Phone Stack", category: "social", style: "minimal", skin: "violet", defaultOn: false, layout: { x: 3, y: 4, w: 3, h: 2 } },
  { id: "flightBoard", label: "Flight Board", category: "travel", style: "data", skin: "paper", defaultOn: false, layout: { x: 6, y: 4, w: 4, h: 2 } },
  { id: "cityHop", label: "City Hop", category: "travel", style: "vivid", skin: "noir", defaultOn: false, layout: { x: 0, y: 6, w: 3, h: 2 } },
  { id: "chargeCard", label: "Charge Card", category: "vehicle", style: "vivid", skin: "forest", defaultOn: false, layout: { x: 3, y: 6, w: 3, h: 2 } },
  { id: "eventCard", label: "Event Card", category: "social", style: "card", skin: "paper", defaultOn: false, layout: { x: 6, y: 6, w: 2, h: 2 } },
  { id: "pricePicker", label: "Price Picker", category: "finance", style: "card", skin: "paper", defaultOn: false, layout: { x: 8, y: 6, w: 2, h: 2 } },
  { id: "callPanel", label: "Call Panel", category: "social", style: "minimal", skin: "charcoal", defaultOn: false, layout: { x: 10, y: 0, w: 2, h: 2 } }
].map(normalizeWidgetDefinition);

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
  layouts: createDefaultLayouts(),
  widgetSettings: {},
  externalWidgetIds: []
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
    this.externalWidgets = [];
    this.state = this.createState(DEFAULT_STATE);
    this.clockMainEl = null;
    this.dragState = null;
    this.selectedWidgetId = "";
    this.liveData = {
      battery: null,
      network: null,
      storage: null,
      weather: null
    };
    this.weatherDisabled = false;
    this.weatherLastFetchMs = 0;
    this.dataRefreshTimer = null;
    this.weatherSearchTimer = null;
    this.els = this.cacheElements();
    this.initLanguageSettings();
    this.populateFilterOptions();
    this.renderWidgetControls();
    this.bindEvents();
    this.startClock();
    this.startDataPipeline();
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
      layouts: mergedLayouts,
      widgetSettings: {
        ...(DEFAULT_STATE.widgetSettings || {}),
        ...((input.widgetSettings && typeof input.widgetSettings === "object") ? input.widgetSettings : {})
      },
      externalWidgetIds: Array.isArray(input.externalWidgetIds) ? [...new Set(input.externalWidgetIds.map((id) => String(id)))] : []
    };
  }

  getWidgetSettings(widgetId) {
    const all = this.state.widgetSettings || {};
    const settings = all[widgetId];
    if (!settings || typeof settings !== "object") return {};
    return settings;
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
      languageSelect: document.getElementById("language-select"),
      vehicleModel: document.getElementById("vehicle-model"),
      modelSize: document.getElementById("model-size"),
      bgTheme: document.getElementById("bg-theme"),
      bgImageUrl: document.getElementById("bg-image-url"),
      widgetSearch: document.getElementById("widget-search"),
      widgetFilterCategory: document.getElementById("widget-filter-category"),
      widgetFilterStyle: document.getElementById("widget-filter-style"),
      btnResetLayout: document.getElementById("btn-reset-layout"),
      widgetPlacementMessage: document.getElementById("widget-placement-message"),
      widgetControls: document.getElementById("widget-controls"),
      widgetGrid: document.getElementById("widget-grid"),
      preview: document.getElementById("dashboard-preview"),
      btnPreview: document.getElementById("btn-preview"),
      btnSave: document.getElementById("btn-save"),
      btnSaveCopy: document.getElementById("btn-save-copy"),
      publicId: document.getElementById("public-id"),
      btnCopyLink: document.getElementById("btn-copy-link"),
      ownerQuery: document.getElementById("owner-query"),
      btnLoadOwner: document.getElementById("btn-load-owner"),
      externalWidgetUrl: document.getElementById("external-widget-url"),
      btnAddExternalWidget: document.getElementById("btn-add-external-widget"),
      inspector: document.getElementById("widget-inspector"),
      inspectorEmpty: document.getElementById("inspector-empty"),
      inspectorContent: document.getElementById("inspector-content"),
      inspectorWidgetName: document.getElementById("inspector-widget-name"),
      inspectorSize: document.getElementById("inspector-size"),
      inspectorTitle: document.getElementById("inspector-title"),
      inspectorWeatherWrap: document.getElementById("inspector-weather"),
      inspectorWeatherMode: document.getElementById("inspector-weather-mode"),
      inspectorWeatherQuery: document.getElementById("inspector-weather-query"),
      inspectorWeatherResults: document.getElementById("inspector-weather-results"),
      inspectorDistanceWrap: document.getElementById("inspector-distance"),
      inspectorDistanceUnit: document.getElementById("inspector-distance-unit"),
      inspectorTempWrap: document.getElementById("inspector-temp"),
      inspectorTempUnit: document.getElementById("inspector-temp-unit"),
      inspectorTimeWrap: document.getElementById("inspector-time"),
      inspectorTimeFormat: document.getElementById("inspector-time-format"),
      btnRemoveWidget: document.getElementById("btn-remove-widget")
    };
  }

  t(key, params = {}, fallback = key) {
    const i18nApi = window.i18n;
    if (i18nApi && typeof i18nApi.t === "function") {
      return i18nApi.t(key, params);
    }
    return fallback;
  }

  initLanguageSettings() {
    const i18nApi = window.i18n;
    const languageSelect = this.els.languageSelect;
    if (!i18nApi || !languageSelect) return;

    if (typeof i18nApi.getLanguage === "function") {
      const currentLang = i18nApi.getLanguage();
      languageSelect.value = currentLang;
      document.documentElement.lang = currentLang;
    }

    if (typeof i18nApi.updatePage === "function") {
      i18nApi.updatePage();
    }

    languageSelect.addEventListener("change", (event) => {
      if (typeof i18nApi.setLanguage === "function") {
        i18nApi.setLanguage(event.target.value);
      }
    });

    window.addEventListener("languageChanged", (event) => {
      const changedLanguage = event?.detail?.language;
      if (changedLanguage && languageSelect.value !== changedLanguage) {
        languageSelect.value = changedLanguage;
      }
      this.handleLanguageChanged();
    });
  }

  handleLanguageChanged() {
    this.populateFilterOptions();
    this.renderWidgetControls();
    this.updateModelBadge();
    this.renderPreview();
    this.renderInspector();
    this.updateAuthUi();
  }

  getWidgetLabel(widget) {
    return this.t(`dash.widget.${widget.id}`, {}, widget.label);
  }

  getWidgetCategoryLabel(category) {
    return this.t(`dash.category.${category}`, {}, this.toTitle(category));
  }

  getWidgetStyleLabel(style) {
    return this.t(`dash.style.${style}`, {}, this.toTitle(style));
  }

  populateFilterOptions() {
    if (!this.els.widgetFilterCategory || !this.els.widgetFilterStyle) return;
    const prevCategory = this.els.widgetFilterCategory.value || "all";
    const prevStyle = this.els.widgetFilterStyle.value || "all";
    this.els.widgetFilterCategory.innerHTML = "";
    this.els.widgetFilterStyle.innerHTML = "";

    const allCategoryOption = document.createElement("option");
    allCategoryOption.value = "all";
    allCategoryOption.textContent = this.t("dash.filter.allCategories", {}, "All categories");
    this.els.widgetFilterCategory.appendChild(allCategoryOption);

    const allStyleOption = document.createElement("option");
    allStyleOption.value = "all";
    allStyleOption.textContent = this.t("dash.filter.allStyles", {}, "All styles");
    this.els.widgetFilterStyle.appendChild(allStyleOption);

    const widgets = this.getAllWidgets();
    const categories = [...new Set(widgets.map((widget) => widget.category))];
    const styles = [...new Set(widgets.map((widget) => widget.style))];

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = this.getWidgetCategoryLabel(category);
      this.els.widgetFilterCategory.appendChild(option);
    });

    styles.forEach((style) => {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = this.getWidgetStyleLabel(style);
      this.els.widgetFilterStyle.appendChild(option);
    });

    this.els.widgetFilterCategory.value = prevCategory;
    this.els.widgetFilterStyle.value = prevStyle;
  }

  toTitle(value) {
    return String(value || "")
      .split(/[_\s-]+/)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  }

  getAllWidgets() {
    return [...WIDGET_LIBRARY, ...this.externalWidgets];
  }

  getWidgetById(widgetId) {
    return this.getAllWidgets().find((widget) => widget.id === widgetId) || null;
  }

  getActiveLayouts(exceptWidgetId = "") {
    const active = {};
    Object.keys(this.state.widgets || {}).forEach((id) => {
      if (!this.state.widgets[id]) return;
      if (exceptWidgetId && id === exceptWidgetId) return;
      active[id] = this.state.layouts[id];
    });
    return active;
  }

  setPlacementMessage(message = "") {
    if (this.els.widgetPlacementMessage) this.els.widgetPlacementMessage.textContent = message;
  }

  getFilteredWidgets() {
    const query = (this.els.widgetSearch.value || "").trim().toLowerCase();
    const category = this.els.widgetFilterCategory.value || "all";
    const style = this.els.widgetFilterStyle.value || "all";

    return this.getAllWidgets().filter((widget) => {
      if (category !== "all" && widget.category !== category) return false;
      if (style !== "all" && widget.style !== style) return false;
      if (!query) return true;
      return (`${this.getWidgetLabel(widget)} ${this.getWidgetCategoryLabel(widget.category)} ${this.getWidgetStyleLabel(widget.style)}`).toLowerCase().includes(query);
    });
  }

  renderWidgetControls() {
    if (!this.els.widgetControls) return;
    const widgets = this.getFilteredWidgets();
    this.els.widgetControls.innerHTML = "";

    if (!widgets.length) {
      const empty = document.createElement("div");
      empty.className = "dash-subtext";
      empty.textContent = this.t("dash.widgets.noMatch", {}, "No widgets match this filter.");
      this.els.widgetControls.appendChild(empty);
      return;
    }

    widgets.forEach((widget) => {
      const activeLayouts = this.getActiveLayouts();
      const preferred = this.normalizeLayout(this.state.layouts[widget.id] || widget.layout, widget.layout);
      const hasSpace = Boolean(findFirstFit(widget.id, preferred, activeLayouts));

      const item = document.createElement("article");
      item.className = "widget-item";
      item.dataset.widgetId = widget.id;

      const preview = document.createElement("div");
      preview.className = `widget-item-preview skin-${widget.skin}`;
      preview.innerHTML = `<p class="widget-title">${this.escapeHtml(this.getWidgetLabel(widget))}</p><p class="widget-item-preview-main">${this.escapeHtml(this.t("dash.widget.preview", {}, "Preview"))}</p>`;

      const textWrap = document.createElement("div");
      textWrap.className = "widget-item-text";
      const title = document.createElement("span");
      title.className = "widget-item-title";
      title.textContent = this.getWidgetLabel(widget);
      const meta = document.createElement("span");
      meta.className = "widget-item-meta";
      meta.textContent = `${this.getWidgetCategoryLabel(widget.category)} · ${this.getWidgetStyleLabel(widget.style)}`;
      textWrap.appendChild(title);
      textWrap.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "widget-item-actions";
      const btnAdd = document.createElement("button");
      btnAdd.type = "button";
      btnAdd.dataset.action = "add";
      btnAdd.dataset.widgetId = widget.id;
      btnAdd.textContent = this.t("dash.widget.add", {}, "Add");
      btnAdd.disabled = !this.state.widgets[widget.id] && !hasSpace;
      const btnSelect = document.createElement("button");
      btnSelect.type = "button";
      btnSelect.dataset.action = "select";
      btnSelect.dataset.widgetId = widget.id;
      btnSelect.textContent = this.state.widgets[widget.id] ? this.t("dash.widget.edit", {}, "Edit") : this.t("dash.widget.inspect", {}, "Inspect");
      actions.append(btnAdd, btnSelect);

      item.append(preview, textWrap, actions);
      this.els.widgetControls.appendChild(item);
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

    this.els.widgetControls?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const widgetId = target.dataset.widgetId;
      if (!widgetId) return;

      if (target.dataset.action === "select") {
        this.selectWidget(widgetId);
        return;
      }
      if (target.dataset.action !== "add") return;

      if (this.state.widgets[widgetId]) {
        this.selectWidget(widgetId);
        return;
      }

      const widget = this.getWidgetById(widgetId);
      const layoutBase = this.normalizeLayout(this.state.layouts[widgetId] || widget?.layout, widget?.layout);
      const firstFit = findFirstFit(widgetId, layoutBase, this.getActiveLayouts());
      if (!firstFit) {
        this.setPlacementMessage(this.t("dash.widget.noSpace", {}, "No space left in this grid. Move or remove another widget."));
        this.renderWidgetControls();
        return;
      }

      this.state.widgets[widgetId] = true;
      this.state.layouts[widgetId] = firstFit;
      this.setPlacementMessage("");
      this.selectWidget(widgetId);
      this.renderPreview();
      this.renderWidgetControls();
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
    this.els.btnAddExternalWidget?.addEventListener("click", () => this.handleAddExternalWidget());
    this.els.inspectorSize?.addEventListener("change", () => this.handleInspectorSizeChange());
    this.els.inspectorTitle?.addEventListener("input", () => this.handleInspectorTextChange());
    this.els.inspectorWeatherMode?.addEventListener("change", () => this.handleInspectorWeatherModeChange());
    this.els.inspectorWeatherQuery?.addEventListener("input", () => this.handleInspectorWeatherSearch());
    this.els.inspectorWeatherResults?.addEventListener("change", () => this.handleInspectorWeatherResultChange());
    this.els.inspectorDistanceUnit?.addEventListener("change", () => this.handleInspectorDistanceUnitChange());
    this.els.inspectorTempUnit?.addEventListener("change", () => this.handleInspectorTempUnitChange());
    this.els.inspectorTimeFormat?.addEventListener("change", () => this.handleInspectorTimeFormatChange());
    this.els.btnRemoveWidget?.addEventListener("click", () => this.removeSelectedWidget());

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
      this.selectWidget(widgetId);

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
      const activeLayouts = this.getActiveLayouts(this.dragState.widgetId);
      const valid = canPlaceLayout(this.dragState.widgetId, next, activeLayouts);
      this.applyCardLayout(this.dragState.card, valid ? next : this.dragState.initial);
      this.dragState.card.classList.toggle("invalid", !valid);
      this.dragState.next = valid ? next : this.dragState.initial;
      this.dragState.isValid = valid;
    });

    const releaseDrag = (event) => {
      if (!this.dragState) return;
      if (event && this.dragState.pointerId !== event.pointerId) return;
      this.state.layouts[this.dragState.widgetId] = this.dragState.next || this.dragState.initial;
      this.dragState.card.classList.remove("dragging", "resizing");
      this.dragState.card.classList.remove("invalid");
      this.dragState = null;
      this.renderPreview();
      this.renderWidgetControls();
    };

    grid.addEventListener("pointerup", releaseDrag);
    grid.addEventListener("pointercancel", releaseDrag);

    grid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest(".dash-widget");
      if (!card) return;
      const widgetId = card.getAttribute("data-widget-id");
      if (!widgetId) return;
      this.selectWidget(widgetId);
    });
  }

  selectWidget(widgetId) {
    this.selectedWidgetId = widgetId || "";
    this.renderInspector();
    this.renderPreview();
    this.renderWidgetControls();
  }

  renderInspector() {
    const widgetId = this.selectedWidgetId;
    const widget = widgetId ? this.getWidgetById(widgetId) : null;
    const hasSelection = Boolean(widget && this.state.widgets[widgetId]);
    this.els.inspectorEmpty?.classList.toggle("hidden", hasSelection);
    this.els.inspectorContent?.classList.toggle("hidden", !hasSelection);
    if (!hasSelection) return;

    const settings = this.getWidgetSettings(widgetId);
    const sizeVariants = widget.sizeVariants || sanitizeSizeVariants(widget.layout);
    const layout = this.state.layouts[widgetId] || widget.layout;
    let size = "small";
    if (layout.w >= sizeVariants.large.w && layout.h >= sizeVariants.large.h) size = "large";
    else if (layout.w >= sizeVariants.medium.w && layout.h >= sizeVariants.medium.h) size = "medium";

    if (this.els.inspectorWidgetName) this.els.inspectorWidgetName.textContent = this.getWidgetLabel(widget);
    if (this.els.inspectorSize) this.els.inspectorSize.value = size;
    if (this.els.inspectorTitle) this.els.inspectorTitle.value = settings.title || "";

    const weatherVisible = widgetId === "weather" || widgetId === "weatherTiles";
    const distanceVisible = widgetId === "range" || widgetId === "cityHop" || widgetId === "navigation";
    const tempVisible = weatherVisible;
    const timeVisible = widgetId === "clock" || widgetId === "clockGrid";
    this.els.inspectorWeatherWrap?.classList.toggle("hidden", !weatherVisible);
    this.els.inspectorDistanceWrap?.classList.toggle("hidden", !distanceVisible);
    this.els.inspectorTempWrap?.classList.toggle("hidden", !tempVisible);
    this.els.inspectorTimeWrap?.classList.toggle("hidden", !timeVisible);

    if (this.els.inspectorWeatherMode) this.els.inspectorWeatherMode.value = settings.locationMode || "auto";
    if (this.els.inspectorDistanceUnit) this.els.inspectorDistanceUnit.value = settings.distanceUnit || "km";
    if (this.els.inspectorTempUnit) this.els.inspectorTempUnit.value = settings.tempUnit || "c";
    if (this.els.inspectorTimeFormat) this.els.inspectorTimeFormat.value = settings.timeFormat || "auto";

    if (this.els.inspectorWeatherQuery) {
      this.els.inspectorWeatherQuery.disabled = (settings.locationMode || "auto") !== "manual";
      this.els.inspectorWeatherQuery.value = settings.locationName || "";
    }
    if (this.els.inspectorWeatherResults) {
      this.els.inspectorWeatherResults.disabled = (settings.locationMode || "auto") !== "manual";
      if (!this.els.inspectorWeatherResults.options.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = this.t("dash.weather.searchHint", {}, "Search and select a city.");
        this.els.inspectorWeatherResults.appendChild(option);
      }
    }
  }

  handleInspectorSizeChange() {
    const widgetId = this.selectedWidgetId;
    const widget = this.getWidgetById(widgetId);
    if (!widget || !this.els.inspectorSize) return;
    const size = this.els.inspectorSize.value || "small";
    const target = widget.sizeVariants?.[size] || widget.layout;
    const existing = this.state.layouts[widgetId] || widget.layout;
    const candidate = this.normalizeLayout({ ...existing, w: target.w, h: target.h }, existing);
    const fitted = canPlaceLayout(widgetId, candidate, this.getActiveLayouts(widgetId))
      ? candidate
      : findFirstFit(widgetId, candidate, this.getActiveLayouts(widgetId));
    if (!fitted) {
      this.setPlacementMessage(this.t("dash.widget.noSpaceForSize", {}, "Not enough space for this size."));
      this.renderInspector();
      return;
    }
    this.state.layouts[widgetId] = fitted;
    this.updateWidgetSetting(widgetId, { sizeVariant: size });
    this.setPlacementMessage("");
    this.renderPreview();
    this.renderWidgetControls();
  }

  handleInspectorTextChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorTitle) return;
    const title = this.els.inspectorTitle.value.trim();
    this.updateWidgetSetting(widgetId, { title });
    this.renderPreview();
  }

  handleInspectorWeatherModeChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorWeatherMode) return;
    const locationMode = this.els.inspectorWeatherMode.value === "manual" ? "manual" : "auto";
    this.updateWidgetSetting(widgetId, { locationMode });
    this.renderInspector();
    this.renderPreview();
  }

  async handleInspectorWeatherSearch() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorWeatherQuery || !this.els.inspectorWeatherResults) return;
    const query = this.els.inspectorWeatherQuery.value.trim();
    if (this.weatherSearchTimer) clearTimeout(this.weatherSearchTimer);
    this.weatherSearchTimer = setTimeout(async () => {
      if (query.length < 2) return;
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", query);
        url.searchParams.set("count", "5");
        url.searchParams.set("language", "en");
        const response = await fetch(url.toString());
        if (!response.ok) return;
        const payload = await response.json();
        const results = Array.isArray(payload.results) ? payload.results : [];
        this.els.inspectorWeatherResults.innerHTML = "";
        if (!results.length) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = this.t("dash.weather.noResults", {}, "No locations found.");
          this.els.inspectorWeatherResults.appendChild(option);
          return;
        }
        results.forEach((item) => {
          const option = document.createElement("option");
          option.value = JSON.stringify({
            name: item.name,
            country: item.country,
            latitude: item.latitude,
            longitude: item.longitude
          });
          option.textContent = `${item.name}${item.country ? `, ${item.country}` : ""}`;
          this.els.inspectorWeatherResults.appendChild(option);
        });
      } catch (error) {
      }
    }, 250);
  }

  handleInspectorWeatherResultChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorWeatherResults) return;
    try {
      const selected = JSON.parse(this.els.inspectorWeatherResults.value || "{}");
      if (!Number.isFinite(selected.latitude) || !Number.isFinite(selected.longitude)) return;
      this.updateWidgetSetting(widgetId, {
        locationMode: "manual",
        locationName: `${selected.name}${selected.country ? `, ${selected.country}` : ""}`,
        latitude: Number(selected.latitude),
        longitude: Number(selected.longitude)
      });
      this.renderInspector();
      this.renderPreview();
    } catch (error) {
    }
  }

  handleInspectorDistanceUnitChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorDistanceUnit) return;
    this.updateWidgetSetting(widgetId, { distanceUnit: this.els.inspectorDistanceUnit.value === "mi" ? "mi" : "km" });
    this.renderPreview();
  }

  handleInspectorTempUnitChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorTempUnit) return;
    this.updateWidgetSetting(widgetId, { tempUnit: this.els.inspectorTempUnit.value === "f" ? "f" : "c" });
    this.renderPreview();
  }

  handleInspectorTimeFormatChange() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId || !this.els.inspectorTimeFormat) return;
    this.updateWidgetSetting(widgetId, { timeFormat: this.els.inspectorTimeFormat.value || "auto" });
    this.renderPreview();
  }

  removeSelectedWidget() {
    const widgetId = this.selectedWidgetId;
    if (!widgetId) return;
    this.state.widgets[widgetId] = false;
    this.selectedWidgetId = "";
    this.setPlacementMessage("");
    this.renderInspector();
    this.renderPreview();
    this.renderWidgetControls();
  }

  updateWidgetSetting(widgetId, patch) {
    const current = this.getWidgetSettings(widgetId);
    const merged = { ...current, ...patch };
    if (!merged.title) delete merged.title;
    this.state.widgetSettings = {
      ...(this.state.widgetSettings || {}),
      [widgetId]: merged
    };
  }

  normalizeExternalManifest(rawManifest, url) {
    const raw = rawManifest && typeof rawManifest === "object" ? rawManifest : {};
    const idBase = String(raw.id || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (!idBase) throw new Error("invalid_manifest");
    const id = `ext_${idBase}`;
    const layout = this.normalizeLayout(raw.defaultLayout || SIZE_PRESETS.medium, SIZE_PRESETS.medium);
    const widget = normalizeWidgetDefinition({
      id,
      label: String(raw.name || raw.id || "External Widget"),
      category: String(raw.category || "custom"),
      style: String(raw.style || "card"),
      skin: String(raw.skin || "paper"),
      defaultOn: false,
      layout,
      source: "external",
      manifestUrl: url
    });
    return { id, manifest: raw, widget };
  }

  getUserManifestCollection() {
    const root = this.db?.collection?.("userWidgets");
    const userDoc = root?.doc?.(this.user?.uid || "");
    const manifests = userDoc?.collection?.("manifests");
    return manifests || null;
  }

  async handleAddExternalWidget() {
    if (!this.user) {
      alert(this.t("dash.toast.loginRequired", {}, "Login required to save dashboard."));
      return;
    }
    const url = (this.els.externalWidgetUrl?.value || "").trim();
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("manifest_fetch_failed");
      const payload = await response.json();
      const normalized = this.normalizeExternalManifest(payload, url);
      const manifests = this.getUserManifestCollection();
      if (!manifests) throw new Error("manifest_store_unavailable");
      await manifests.doc(normalized.id).set({
        ownerUid: this.user.uid,
        manifestUrl: url,
        manifest: normalized.manifest,
        widget: normalized.widget,
        updatedAtMs: Date.now(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      this.externalWidgets = this.externalWidgets.filter((item) => item.id !== normalized.widget.id).concat(normalized.widget);
      if (!this.state.externalWidgetIds.includes(normalized.widget.id)) {
        this.state.externalWidgetIds.push(normalized.widget.id);
      }
      this.populateFilterOptions();
      this.renderWidgetControls();
      this.renderPreview();
      this.els.externalWidgetUrl.value = "";
      alert(this.t("dash.toast.externalAdded", {}, "External widget registered."));
    } catch (error) {
      alert(this.t("dash.toast.externalFailed", {}, "Failed to add external widget."));
    }
  }

  async loadExternalWidgetsForUser() {
    if (!this.user) {
      this.externalWidgets = [];
      this.populateFilterOptions();
      return;
    }
    try {
      const manifests = this.getUserManifestCollection();
      if (!manifests) return;
      const snap = await manifests.get();
      const loaded = [];
      snap.forEach((doc) => {
        const data = doc.data() || {};
        if (data.widget && typeof data.widget === "object") {
          loaded.push(normalizeWidgetDefinition(data.widget));
        }
      });
      this.externalWidgets = loaded;
      const ids = new Set(loaded.map((item) => item.id));
      this.state.externalWidgetIds = this.state.externalWidgetIds.filter((id) => ids.has(id));
      this.populateFilterOptions();
      this.renderWidgetControls();
      this.renderPreview();
    } catch (error) {
      this.externalWidgets = [];
    }
  }

  initWidgetSettingsModal() {
    const backdrop = document.createElement("div");
    backdrop.className = "widget-settings-backdrop";
    backdrop.innerHTML = `
      <div class="widget-settings-modal" role="dialog" aria-modal="true" aria-label="Widget settings">
        <div class="widget-settings-head">
          <h3 class="widget-settings-title">Widget Settings</h3>
          <button type="button" class="widget-settings-close" data-close>×</button>
        </div>
        <form class="widget-settings-form">
          <label class="widget-settings-field">
            <span>Title</span>
            <input name="title" type="text" maxlength="48" placeholder="Custom title (optional)">
          </label>
          <label class="widget-settings-field widget-settings-time">
            <span>Clock Format</span>
            <select name="timeFormat">
              <option value="auto">Auto</option>
              <option value="12">12-hour</option>
              <option value="24">24-hour</option>
            </select>
          </label>
          <label class="widget-settings-field widget-settings-temp">
            <span>Temperature Unit</span>
            <select name="tempUnit">
              <option value="c">Celsius</option>
              <option value="f">Fahrenheit</option>
            </select>
          </label>
          <label class="widget-settings-field widget-settings-distance">
            <span>Distance Unit</span>
            <select name="distanceUnit">
              <option value="km">Kilometer</option>
              <option value="mi">Mile</option>
            </select>
          </label>
          <div class="widget-settings-actions">
            <button type="button" data-close>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);
    this.settingsModal = backdrop;
    this.settingsForm = backdrop.querySelector(".widget-settings-form");

    backdrop.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target === backdrop || target.hasAttribute("data-close")) {
        this.closeWidgetSettings();
      }
    });

    this.settingsForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.saveWidgetSettingsFromForm();
    });
  }

  openWidgetSettings(widgetId) {
    if (!this.settingsModal || !this.settingsForm) return;
    this.modalWidgetId = widgetId;
    const widget = this.getWidgetById(widgetId);
    const settings = this.getWidgetSettings(widgetId);

    const titleEl = this.settingsForm.elements.namedItem("title");
    const timeEl = this.settingsForm.elements.namedItem("timeFormat");
    const tempEl = this.settingsForm.elements.namedItem("tempUnit");
    const distanceEl = this.settingsForm.elements.namedItem("distanceUnit");

    if (titleEl instanceof HTMLInputElement) {
      titleEl.value = settings.title || "";
    }
    if (timeEl instanceof HTMLSelectElement) {
      timeEl.value = settings.timeFormat || "auto";
    }
    if (tempEl instanceof HTMLSelectElement) {
      tempEl.value = settings.tempUnit || "c";
    }
    if (distanceEl instanceof HTMLSelectElement) {
      distanceEl.value = settings.distanceUnit || "km";
    }

    const showClockFormat = widgetId === "clock" || widgetId === "clockGrid";
    const showTempUnit = widgetId === "weather" || widgetId === "weatherTiles";
    const showDistance = widgetId === "range" || widgetId === "cityHop" || widgetId === "navigation";

    this.settingsForm.querySelector(".widget-settings-time")?.classList.toggle("hidden", !showClockFormat);
    this.settingsForm.querySelector(".widget-settings-temp")?.classList.toggle("hidden", !showTempUnit);
    this.settingsForm.querySelector(".widget-settings-distance")?.classList.toggle("hidden", !showDistance);

    const titleNode = this.settingsModal.querySelector(".widget-settings-title");
    if (titleNode) {
      titleNode.textContent = `Widget Settings - ${widget ? this.getWidgetLabel(widget) : widgetId}`;
    }

    this.settingsModal.classList.add("open");
  }

  closeWidgetSettings() {
    if (!this.settingsModal) return;
    this.settingsModal.classList.remove("open");
    this.modalWidgetId = "";
  }

  saveWidgetSettingsFromForm() {
    if (!this.modalWidgetId || !this.settingsForm) return;
    const widgetId = this.modalWidgetId;
    const current = this.getWidgetSettings(widgetId);
    const next = { ...current };

    const titleEl = this.settingsForm.elements.namedItem("title");
    const timeEl = this.settingsForm.elements.namedItem("timeFormat");
    const tempEl = this.settingsForm.elements.namedItem("tempUnit");
    const distanceEl = this.settingsForm.elements.namedItem("distanceUnit");

    if (titleEl instanceof HTMLInputElement) {
      const value = titleEl.value.trim();
      if (value) next.title = value;
      else delete next.title;
    }
    if (timeEl instanceof HTMLSelectElement) {
      next.timeFormat = timeEl.value || "auto";
    }
    if (tempEl instanceof HTMLSelectElement) {
      next.tempUnit = tempEl.value === "f" ? "f" : "c";
    }
    if (distanceEl instanceof HTMLSelectElement) {
      next.distanceUnit = distanceEl.value === "mi" ? "mi" : "km";
    }

    this.state.widgetSettings = {
      ...(this.state.widgetSettings || {}),
      [widgetId]: next
    };
    this.closeWidgetSettings();
    this.renderPreview();
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
    const item = this.getWidgetById(widgetId);
    return item?.layout || { x: 0, y: 0, w: 2, h: 2 };
  }

  validateDashboardLayout() {
    const errors = [];
    const active = this.getActiveLayouts();
    const entries = Object.entries(active);
    entries.forEach(([id, layout]) => {
      if (!isLayoutInBounds(layout)) {
        errors.push(`${id}:out_of_bounds`);
      }
    });
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        if (rectsOverlap(entries[i][1], entries[j][1])) {
          errors.push(`${entries[i][0]}:${entries[j][0]}:overlap`);
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }

  resetGridLayout() {
    const next = {};
    this.getAllWidgets().forEach((widget) => {
      next[widget.id] = this.normalizeLayout(widget.layout, widget.layout);
    });
    this.state.layouts = next;
    this.setPlacementMessage("");
    this.renderPreview();
    this.renderWidgetControls();
  }

  startDataPipeline() {
    this.refreshLiveData();
    this.dataRefreshTimer = setInterval(() => this.refreshLiveData(), 60 * 1000);
  }

  async refreshLiveData() {
    await Promise.allSettled([
      this.refreshBatteryData(),
      this.refreshStorageData(),
      this.refreshWeatherData()
    ]);
    this.refreshNetworkData();
    if (!this.dragState) {
      this.renderPreview();
    }
  }

  async refreshBatteryData() {
    if (!("getBattery" in navigator)) return;
    try {
      if (!this.batteryManager) {
        this.batteryManager = await navigator.getBattery();
        const update = () => {
          this.liveData.battery = {
            levelPct: Math.round((this.batteryManager.level || 0) * 100),
            charging: Boolean(this.batteryManager.charging)
          };
        };
        this.batteryManager.addEventListener("chargingchange", update);
        this.batteryManager.addEventListener("levelchange", update);
        update();
      } else {
        this.liveData.battery = {
          levelPct: Math.round((this.batteryManager.level || 0) * 100),
          charging: Boolean(this.batteryManager.charging)
        };
      }
    } catch (error) {
    }
  }

  refreshNetworkData() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return;
    this.liveData.network = {
      downlink: Number(connection.downlink || 0),
      rtt: Number(connection.rtt || 0),
      type: String(connection.effectiveType || connection.type || "")
    };
  }

  async refreshStorageData() {
    if (!navigator.storage || typeof navigator.storage.estimate !== "function") return;
    try {
      const estimate = await navigator.storage.estimate();
      const usage = Number(estimate.usage || 0);
      const quota = Number(estimate.quota || 0);
      this.liveData.storage = {
        usageMb: usage / (1024 * 1024),
        quotaMb: quota / (1024 * 1024),
        usedPct: quota > 0 ? Math.round((usage / quota) * 100) : null
      };
    } catch (error) {
    }
  }

  async refreshWeatherData() {
    if (this.weatherDisabled) return;
    if (Date.now() - this.weatherLastFetchMs < 10 * 60 * 1000) return;
    if (typeof fetch !== "function") return;
    try {
      const weatherWidgetIds = ["weather", "weatherTiles"];
      const manual = weatherWidgetIds
        .map((id) => this.getWidgetSettings(id))
        .find((settings) => settings.locationMode === "manual" && Number.isFinite(settings.latitude) && Number.isFinite(settings.longitude));
      let latitude;
      let longitude;
      if (manual) {
        latitude = Number(manual.latitude);
        longitude = Number(manual.longitude);
      } else {
        if (!("geolocation" in navigator)) return;
        const position = await this.getCurrentPosition();
        latitude = Number(position.coords.latitude);
        longitude = Number(position.coords.longitude);
      }
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(latitude));
      url.searchParams.set("longitude", String(longitude));
      url.searchParams.set("current", "temperature_2m,weather_code");
      url.searchParams.set("timezone", "auto");

      const response = await fetch(url.toString());
      if (!response.ok) return;
      const payload = await response.json();
      const current = payload?.current || {};
      if (!Number.isFinite(current.temperature_2m)) return;

      this.weatherLastFetchMs = Date.now();
      this.liveData.weather = {
        tempC: Number(current.temperature_2m),
        code: Number(current.weather_code),
        label: this.describeWeatherCode(Number(current.weather_code))
      };
    } catch (error) {
      this.weatherDisabled = true;
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 10 * 60 * 1000
      });
    });
  }

  describeWeatherCode(code) {
    const map = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Fog",
      51: "Drizzle",
      53: "Drizzle",
      55: "Drizzle",
      61: "Rain",
      63: "Rain",
      65: "Heavy rain",
      71: "Snow",
      73: "Snow",
      75: "Heavy snow",
      80: "Rain showers",
      81: "Rain showers",
      82: "Heavy showers",
      95: "Thunderstorm"
    };
    return map[code] || "Weather";
  }

  formatTemp(tempC, unit) {
    if (!Number.isFinite(tempC)) return null;
    if (unit === "f") {
      const tempF = (tempC * 9) / 5 + 32;
      return `${Math.round(tempF)} F`;
    }
    return `${Math.round(tempC)} C`;
  }

  formatDistance(km, unit) {
    if (!Number.isFinite(km)) return null;
    if (unit === "mi") return `${(km * 0.621371).toFixed(1)} mi`;
    return `${Math.round(km)} km`;
  }

  async init() {
    this.auth.onAuthStateChanged(async (user) => {
      this.user = user || null;
      this.updateAuthUi();
      await this.loadExternalWidgetsForUser();
      await this.loadDashboardFromRouteOrOwner();
    });
    this.updateAuthUi();
    await this.loadExternalWidgetsForUser();
    await this.loadDashboardFromRouteOrOwner();
  }

  updateAuthUi() {
    const signedIn = Boolean(this.user);
    this.els.btnLogin.style.display = signedIn ? "none" : "inline-flex";
    this.els.providerMenu.style.display = "none";
    this.els.btnLogout.style.display = signedIn ? "inline-flex" : "none";
    this.els.btnSave.disabled = !signedIn;
    this.els.user.textContent = this.user ? (this.user.email || this.user.uid) : this.t("dash.auth.signedOut", {}, "Not signed in");
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
      alert(this.t("dash.toast.loginFailed", {}, "Login failed. Check OAuth provider setup."));
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
    this.selectedWidgetId = "";

    this.syncEditorFromState();
    this.renderWidgetControls();
    this.renderPreview();
    this.renderInspector();
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

    const ownerName = this.user?.displayName || this.user?.email?.split("@")[0] || this.t("dash.ownerFallback", {}, "Tesla owner");

    this.getAllWidgets().forEach((widget) => {
      if (!this.state.widgets[widget.id]) return;
      const card = this.createWidgetCard(widget, ownerName);
      const layout = this.normalizeLayout(this.state.layouts[widget.id], widget.layout);
      const activeLayouts = this.getActiveLayouts(widget.id);
      const finalLayout = canPlaceLayout(widget.id, layout, activeLayouts)
        ? layout
        : findFirstFit(widget.id, widget.layout, activeLayouts) || null;
      if (!finalLayout) return;
      this.state.layouts[widget.id] = finalLayout;
      this.applyCardLayout(card, finalLayout);
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
      empty.innerHTML = `
        <div class="widget-top">
          <p class="widget-title">${this.escapeHtml(this.t("dash.widgets.emptyTitle", {}, "Empty"))}</p>
          <span class="widget-badge">${this.escapeHtml(this.t("dash.widgets.emptyBadge", {}, "Info"))}</span>
        </div>
        <div class="widget-main">${this.escapeHtml(this.t("dash.widgets.emptyMain", {}, "No widgets selected"))}</div>
        <div class="widget-sub">${this.escapeHtml(this.t("dash.widgets.emptySub", {}, "Enable widgets from the left panel."))}</div>
      `;
      this.els.widgetGrid.appendChild(empty);
    }

    if (this.selectedWidgetId && !this.state.widgets[this.selectedWidgetId]) {
      this.selectedWidgetId = "";
      this.renderInspector();
    }

    this.updateClockWidget();
  }

  createWidgetCard(widget, ownerName) {
    const card = document.createElement("article");
    card.className = `dash-widget skin-${widget.skin}`;
    card.setAttribute("data-widget-id", widget.id);
    if (this.selectedWidgetId === widget.id) {
      card.classList.add("selected");
    }

    const content = this.getWidgetContent(widget.id, ownerName);
    const topHtml = `<div class="widget-top"><p class="widget-title">${this.escapeHtml(content.title)}</p><span class="widget-badge">${this.escapeHtml(content.badge || this.t("dash.widget.badgeLive", {}, "Live"))}</span></div>`;
    const mainClass = content.mainMono ? "widget-main widget-mono" : "widget-main";
    const subClass = content.subMono ? "widget-sub widget-mono" : "widget-sub";
    const subLines = Array.isArray(content.subLines) ? content.subLines : [content.sub || ""];
    const subHtml = subLines.map((line) => `<div class="${subClass}">${this.escapeHtml(line)}</div>`).join("");
    const meterHtml = Number.isFinite(content.meter) ? `<div class="widget-meter"><i style="--meter:${Math.max(0, Math.min(100, content.meter))}%"></i></div>` : "";
    const barsHtml = Array.isArray(content.bars) ? this.buildBarsHtml(content.bars) : "";
    const pillsHtml = Array.isArray(content.pills) ? this.buildPillsHtml(content.pills) : "";

    card.innerHTML = `${topHtml}<div class="${mainClass}">${this.escapeHtml(content.main)}</div><div>${subHtml}${meterHtml}${barsHtml}${pillsHtml}</div><span class="widget-resize" title="${this.escapeHtml(this.t("dash.widget.resize", {}, "Resize"))}"></span>`;

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
      quote: { title: "Quote", badge: "Daily", main: hour < 12 ? "No rain in 2 hours." : "In the middle lies opportunity.", subLines: ["Tesla owner mood"] },
      streamDeck: { title: "Stream", badge: "Live", main: "6500 Kbps", subLines: ["Viewers 11784 · Loss 0"], bars: [14, 23, 31, 28, 35, 42, 39, 50, 43], pills: ["Twitch", "Climbing Today 1587 LP"] },
      lifeTracker: { title: "Progress", badge: "Life", main: "71.23%", subLines: ["Work from home · 239 days"], meter: 71, pills: ["Olivia 29d", "Will 0.46y"] },
      weatherTiles: { title: "Weather Set", badge: "Tile", main: "28 C", subLines: ["NYC · clear sky"], pills: ["LA 24 C", "HK 23 C", "Bogota 16 C"] },
      clockGrid: { title: "City Clock", badge: "Pack", main: "22:06", subLines: ["Mon 26 · 18 C"], mainMono: true, subMono: true, pills: ["AMS", "NYC", "UTC"] },
      sleepSuite: { title: "Sleep", badge: "Health", main: "6h 20m", subLines: ["Sleep quality 80/100"], meter: 80, pills: ["Bed 00:20-09:00", "Heart 55 bpm"] },
      raceLap: { title: "Race", badge: "Lap 5", main: "1:16:36", subLines: ["Sector 2 · Track mode"], bars: [12, 18, 25, 35, 39, 44, 36, 30, 22], pills: ["Best line"] },
      wavePulse: { title: "Pulse", badge: "82 bpm", main: "24:15", subLines: ["Wave monitor · 1.8 mi"], bars: [14, 22, 29, 26, 31, 36, 28, 34, 39, 32, 27, 22], pills: ["Live"] },
      phoneStack: { title: "Phone", badge: "Stack", main: "12:46", subLines: ["Calls, reminders, media"], pills: ["Homekit", "Meteo", "Batteries"] },
      flightBoard: { title: "Flight", badge: "FL 288", main: "Land in 1h 15m", subLines: ["SIN 11:30 PM · LHR 05:55 AM"], bars: [14, 22, 34, 27, 39, 31, 24], pills: ["On Time", "A350F"] },
      cityHop: { title: "City Hop", badge: "Trip", main: "300M", subLines: ["Elizabeth Street · ETA 10:21"], mainMono: true, subMono: true, pills: ["Speed 18.4", "Distance 12.4"] },
      chargeCard: { title: "Mercedes", badge: "Charge", main: "68%", subLines: ["15m left · Supercharging 250kW"], meter: 68, pills: ["365 km"] },
      eventCard: { title: "Miami", badge: "Event", main: "Art Deco Walk", subLines: ["in 30m · Miami, FL"], pills: ["Upcoming"] },
      pricePicker: { title: "Price", badge: "Select", main: "$56.00", subLines: ["Set fare quickly"], pills: ["-", "+"] },
      callPanel: { title: "Call", badge: "Live", main: "Michael Fox", subLines: ["Work contact · 8:06"], pills: ["Accept", "Decline"] }
    };

    if (!map[widgetId]) {
      return {
        title: this.t("dash.widget.defaultTitle", {}, "Widget"),
        main: this.t("dash.widget.defaultMain", {}, "Ready"),
        subLines: [this.t("dash.widget.defaultSub", {}, "Configure from left panel")]
      };
    }

    const result = {
      ...map[widgetId],
      title: this.t(`dash.widget.${widgetId}`, {}, map[widgetId].title)
    };
    const settings = this.getWidgetSettings(widgetId);
    if (settings.title) {
      result.title = settings.title;
    }

    if (widgetId === "battery" || widgetId === "chargeCard") {
      const battery = this.liveData.battery;
      if (battery && Number.isFinite(battery.levelPct)) {
        result.main = `${battery.levelPct}%`;
        result.meter = battery.levelPct;
        result.subLines = [battery.charging ? "Charging now" : "On battery"];
      }
    }

    if (widgetId === "streamDeck") {
      const network = this.liveData.network;
      if (network && Number.isFinite(network.downlink) && network.downlink > 0) {
        result.main = `${Math.round(network.downlink * 1000)} Kbps`;
        result.subLines = [`RTT ${network.rtt || "--"} ms · ${network.type || "network"}`];
      }
    }

    if (widgetId === "weather" || widgetId === "weatherTiles") {
      const weather = this.liveData.weather;
      const tempUnit = settings.tempUnit === "f" ? "f" : "c";
      const temp = this.formatTemp(weather?.tempC, tempUnit);
      if (temp) {
        result.main = temp;
        result.subLines = [weather?.label || "Weather"];
      }
    }

    if (widgetId === "range" || widgetId === "cityHop" || widgetId === "navigation") {
      const unit = settings.distanceUnit === "mi" ? "mi" : "km";
      const numeric = Number(String(result.main).replace(/[^\d.]/g, ""));
      const converted = this.formatDistance(numeric, unit);
      if (converted) result.main = converted;
    }

    if (widgetId === "cost" && this.liveData.storage?.usedPct != null) {
      const usage = this.liveData.storage;
      result.subLines = [`Storage ${usage.usedPct}% used`];
      result.meter = Math.max(0, Math.min(100, usage.usedPct));
    }

    const sizeVariant = settings.sizeVariant || "small";
    if (sizeVariant === "small") {
      result.subLines = (result.subLines || []).slice(0, 1);
      if (Array.isArray(result.pills)) result.pills = result.pills.slice(0, 1);
      delete result.bars;
    } else if (sizeVariant === "medium") {
      result.subLines = (result.subLines || []).slice(0, 2);
      if (Array.isArray(result.pills)) result.pills = result.pills.slice(0, 2);
    }

    return result;
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
      const modelName = this.t(`dash.model.${this.els.vehicleModel.value}`, {}, preset.label);
      this.els.modelSize.textContent = this.t(
        "dash.display.format",
        { width: preset.width, height: preset.height, model: modelName },
        `Display: ${preset.width} x ${preset.height} (${modelName})`
      );
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
    const settings = this.getWidgetSettings("clock");
    const mode = settings.timeFormat || "auto";
    const hour12 = mode === "12" ? true : mode === "24" ? false : undefined;
    const now = new Date();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    if (typeof hour12 === "boolean") options.hour12 = hour12;
    this.clockMainEl.textContent = now.toLocaleTimeString([], options);
  }

  startClock() {
    const tick = () => this.updateClockWidget();
    tick();
    setInterval(tick, 1000);
  }

  async saveDashboard(options = {}) {
    if (!this.user) {
      alert(this.t("dash.toast.loginRequired", {}, "Login required to save dashboard."));
      return;
    }

    const asCopy = Boolean(options.asCopy);
    this.applyFromEditor();
    const layoutCheck = this.validateDashboardLayout();
    if (!layoutCheck.ok) {
      alert(this.t("dash.toast.layoutInvalid", {}, "Layout has overlapping or out-of-bound widgets."));
      return;
    }

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
    alert(
      asCopy
        ? this.t("dash.toast.savedCopy", {}, "Copied and saved to your account.")
        : this.t("dash.toast.saved", {}, "Dashboard saved.")
    );
  }

  copyShareLink() {
    const owner = this.publicId || "";
    if (!owner) {
      alert(this.t("dash.toast.saveFirst", {}, "Save once to generate public ID."));
      return;
    }
    const link = `${location.origin}/dashboard.html?owner=${encodeURIComponent(owner)}`;
    navigator.clipboard.writeText(link).then(
      () => alert(this.t("dash.toast.shareCopied", {}, "Share link copied.")),
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

window.__dashboardLayoutUtils = {
  isLayoutInBounds,
  rectsOverlap,
  canPlaceLayout,
  findFirstFit
};

window.addEventListener("DOMContentLoaded", () => {
  window.__dashboardBuilder = new DashboardBuilder();
});
