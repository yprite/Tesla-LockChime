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

const DEFAULT_STATE = {
  vehicleModel: "modely",
  backgroundTheme: "tesla-red",
  backgroundImageUrl: "",
  widgets: {
    clock: true,
    greeting: true,
    weekly: true,
    badges: true,
    quickchat: true,
    battery: true,
    media: false
  }
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
    this.els = this.cacheElements();
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
      widgetClock: document.getElementById("widget-clock"),
      widgetGreeting: document.getElementById("widget-greeting"),
      widgetWeekly: document.getElementById("widget-weekly"),
      widgetBadges: document.getElementById("widget-badges"),
      widgetQuickChat: document.getElementById("widget-quickchat"),
      widgetBattery: document.getElementById("widget-battery"),
      widgetMedia: document.getElementById("widget-media"),
      preview: document.getElementById("dashboard-preview"),
      greetingView: document.getElementById("widget-greeting-view"),
      clockView: document.getElementById("widget-clock-view"),
      weeklyView: document.getElementById("widget-weekly-view"),
      badgesView: document.getElementById("widget-badges-view"),
      quickChatView: document.getElementById("widget-quickchat-view"),
      batteryView: document.getElementById("widget-battery-view"),
      mediaView: document.getElementById("widget-media-view"),
      btnPreview: document.getElementById("btn-preview"),
      btnSave: document.getElementById("btn-save"),
      btnSaveCopy: document.getElementById("btn-save-copy"),
      publicId: document.getElementById("public-id"),
      btnCopyLink: document.getElementById("btn-copy-link"),
      ownerQuery: document.getElementById("owner-query"),
      btnLoadOwner: document.getElementById("btn-load-owner")
    };
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
    this.state.widgets = {
      clock: this.els.widgetClock.checked,
      greeting: this.els.widgetGreeting.checked,
      weekly: this.els.widgetWeekly.checked,
      badges: this.els.widgetBadges.checked,
      quickchat: this.els.widgetQuickChat.checked,
      battery: this.els.widgetBattery.checked,
      media: this.els.widgetMedia.checked
    };
    this.renderPreview();
  }

  syncEditorFromState() {
    this.els.vehicleModel.value = this.state.vehicleModel || DEFAULT_STATE.vehicleModel;
    this.els.bgTheme.value = this.state.backgroundTheme;
    this.els.bgImageUrl.value = this.state.backgroundImageUrl || "";
    this.els.widgetClock.checked = Boolean(this.state.widgets.clock);
    this.els.widgetGreeting.checked = Boolean(this.state.widgets.greeting);
    this.els.widgetWeekly.checked = Boolean(this.state.widgets.weekly);
    this.els.widgetBadges.checked = Boolean(this.state.widgets.badges);
    this.els.widgetQuickChat.checked = Boolean(this.state.widgets.quickchat);
    this.els.widgetBattery.checked = Boolean(this.state.widgets.battery);
    this.els.widgetMedia.checked = Boolean(this.state.widgets.media);
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

    this.toggleWidget(this.els.greetingView, this.state.widgets.greeting);
    this.toggleWidget(this.els.clockView, this.state.widgets.clock);
    this.toggleWidget(this.els.weeklyView, this.state.widgets.weekly);
    this.toggleWidget(this.els.badgesView, this.state.widgets.badges);
    this.toggleWidget(this.els.quickChatView, this.state.widgets.quickchat);
    this.toggleWidget(this.els.batteryView, this.state.widgets.battery);
    this.toggleWidget(this.els.mediaView, this.state.widgets.media);

    const ownerName = this.user?.displayName || this.user?.email?.split("@")[0] || "Tesla owner";
    this.els.greetingView.textContent = `Welcome, ${ownerName}.`;
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

  toggleWidget(el, on) {
    if (!el) return;
    el.style.display = on ? "block" : "none";
  }

  escapeCssUrl(url) {
    return String(url || "").replace(/['")\\]/g, "");
  }

  startClock() {
    const tick = () => {
      if (!this.els.clockView) return;
      const now = new Date();
      this.els.clockView.textContent = `Local Time: ${now.toLocaleString()}`;
    };
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
