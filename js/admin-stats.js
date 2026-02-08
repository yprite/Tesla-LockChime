/**
 * Admin Statistics Module
 * Dashboard statistics and Chart.js visualizations
 */

const GALLERY_COLLECTION = 'sounds';
const EVENTS_COLLECTION = 'events';
const CATEGORIES = ['classic', 'modern', 'futuristic', 'custom', 'funny', 'musical'];
class AdminStats {
    constructor() {
        this.db = null;
        this.sounds = [];
        this.events = [];
        this.filteredEvents = [];
        this.categoryChart = null;
        this.trendChart = null;
        this.funnelChart = null;
        this.retentionChart = null;
        this.elements = {};
        this.filters = {
            rangeDays: 30,
            language: 'all',
            entryChannel: 'all',
            device: 'all'
        };
    }

    init(db) {
        this.db = db;
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            range: document.getElementById('analytics-range'),
            language: document.getElementById('analytics-language'),
            entryChannel: document.getElementById('analytics-entry-channel'),
            device: document.getElementById('analytics-device'),
            refreshBtn: document.getElementById('btn-analytics-refresh')
        };
    }

    bindEvents() {
        if (this.elements.range) {
            this.elements.range.addEventListener('change', () => {
                this.filters.rangeDays = Number(this.elements.range.value) || 30;
                this.refresh();
            });
        }

        if (this.elements.language) {
            this.elements.language.addEventListener('change', () => {
                this.filters.language = this.elements.language.value || 'all';
                this.applyEventFilters();
                this.renderEventMetrics();
            });
        }

        if (this.elements.entryChannel) {
            this.elements.entryChannel.addEventListener('change', () => {
                this.filters.entryChannel = this.elements.entryChannel.value || 'all';
                this.applyEventFilters();
                this.renderEventMetrics();
            });
        }

        if (this.elements.device) {
            this.elements.device.addEventListener('change', () => {
                this.filters.device = this.elements.device.value || 'all';
                this.applyEventFilters();
                this.renderEventMetrics();
            });
        }

        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => this.refresh());
        }

        window.addEventListener('languageChanged', () => {
            this.renderAll();
        });
    }

    t(key, fallback, params = {}) {
        if (typeof i18n !== 'undefined' && i18n && typeof i18n.t === 'function') {
            return i18n.t(key, params);
        }
        return fallback;
    }

    getPeriodStartMs(days) {
        return Date.now() - (days * 24 * 60 * 60 * 1000);
    }

    async loadSounds() {
        const snapshot = await this.db.collection(GALLERY_COLLECTION)
            .orderBy('createdAt', 'desc')
            .get();

        this.sounds = [];
        snapshot.forEach(doc => {
            this.sounds.push({ id: doc.id, ...doc.data() });
        });
    }

    async loadEvents() {
        const queryDays = Math.max(this.filters.rangeDays, 30, 14);
        const startMs = this.getPeriodStartMs(queryDays);

        const snapshot = await this.db.collection(EVENTS_COLLECTION)
            .where('occurredAtMs', '>=', startMs)
            .orderBy('occurredAtMs', 'asc')
            .limit(8000)
            .get();

        this.events = [];
        snapshot.forEach(doc => {
            this.events.push({ id: doc.id, ...doc.data() });
        });
    }

    getEventValue(event, key) {
        if (event[key] !== undefined && event[key] !== null && event[key] !== '') {
            return event[key];
        }
        if (event.properties && event.properties[key] !== undefined && event.properties[key] !== null && event.properties[key] !== '') {
            return event.properties[key];
        }
        return null;
    }

    applyEventFilters() {
        const rangeStartMs = this.getPeriodStartMs(this.filters.rangeDays);

        this.filteredEvents = this.events.filter(event => {
            const ts = Number(event.occurredAtMs || 0);
            if (!ts || ts < rangeStartMs) return false;

            const language = String(this.getEventValue(event, 'language') || '').toLowerCase();
            const entryChannel = String(this.getEventValue(event, 'entryChannel') || '').toLowerCase();
            const device = String(this.getEventValue(event, 'device') || '').toLowerCase();

            if (this.filters.language !== 'all' && language !== this.filters.language) {
                return false;
            }
            if (this.filters.entryChannel !== 'all' && entryChannel !== this.filters.entryChannel) {
                return false;
            }
            if (this.filters.device !== 'all' && device !== this.filters.device) {
                return false;
            }

            return true;
        });
    }

    updateEntryChannelOptions() {
        if (!this.elements.entryChannel) return;

        const channelSet = new Set();
        this.events.forEach(event => {
            const channel = String(this.getEventValue(event, 'entryChannel') || '').toLowerCase();
            if (channel) channelSet.add(channel);
        });

        const current = this.filters.entryChannel;
        const options = [`<option value="all">${this.escapeHtml(this.t('cat.all', 'All'))}</option>`];
        Array.from(channelSet).sort().forEach(channel => {
            const selected = channel === current ? ' selected' : '';
            options.push(`<option value="${this.escapeHtml(channel)}"${selected}>${this.escapeHtml(channel)}</option>`);
        });

        this.elements.entryChannel.innerHTML = options.join('');
    }

    calculateOverviewStats() {
        const totalSounds = this.sounds.length;
        const totalDownloads = this.sounds.reduce((sum, s) => sum + (s.downloads || 0), 0);
        const totalLikes = this.sounds.reduce((sum, s) => sum + (s.likes || 0), 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyUploads = this.sounds.filter(s => {
            if (!s.createdAt) return false;
            const createdAt = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
            return createdAt >= weekAgo;
        }).length;

        return {
            totalSounds,
            totalDownloads,
            totalLikes,
            weeklyUploads
        };
    }

    calculateCategoryStats() {
        const categoryCount = {};
        CATEGORIES.forEach(cat => {
            categoryCount[cat] = 0;
        });

        this.sounds.forEach(sound => {
            const category = sound.category || 'custom';
            if (categoryCount[category] !== undefined) {
                categoryCount[category] += 1;
            } else {
                categoryCount.custom += 1;
            }
        });

        return categoryCount;
    }

    calculateTrendData(days = 30) {
        const dateCount = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dateCount[date.toISOString().slice(0, 10)] = 0;
        }

        this.sounds.forEach(sound => {
            if (!sound.createdAt) return;
            const createdAt = sound.createdAt.toDate ? sound.createdAt.toDate() : new Date(sound.createdAt);
            const key = createdAt.toISOString().slice(0, 10);
            if (dateCount[key] !== undefined) {
                dateCount[key] += 1;
            }
        });

        return {
            labels: Object.keys(dateCount).map(date => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            }),
            data: Object.values(dateCount)
        };
    }

    getTopSounds(limit = 10, sortBy = 'downloads') {
        const sorted = [...this.sounds].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
        return sorted.slice(0, limit);
    }

    getUsersByEvent(events, eventName, minTs = 0) {
        const users = new Set();
        events.forEach(event => {
            const ts = Number(event.occurredAtMs || 0);
            if (event.eventName === eventName && ts >= minTs && event.userId) {
                users.add(event.userId);
            }
        });
        return users;
    }

    calculateLifecycleStats() {
        const now = Date.now();
        const mauStart = this.getPeriodStartMs(30);
        const dauStart = this.getPeriodStartMs(1);

        const mauUsers = new Set();
        const dauUsers = new Set();

        this.filteredEvents.forEach(event => {
            const ts = Number(event.occurredAtMs || 0);
            const userId = event.userId;
            if (!userId || !ts) return;

            if (ts >= mauStart) mauUsers.add(userId);
            if (ts >= dauStart) dauUsers.add(userId);
        });

        const landingUsers = this.getUsersByEvent(this.filteredEvents, 'landing_view', mauStart);
        const activatedUsers = new Set([
            ...this.getUsersByEvent(this.filteredEvents, 'trim_complete', mauStart),
            ...this.getUsersByEvent(this.filteredEvents, 'save_usb_success', mauStart),
            ...this.getUsersByEvent(this.filteredEvents, 'share_gallery_success', mauStart)
        ]);

        let activationRate = 0;
        if (landingUsers.size > 0) {
            let activatedCount = 0;
            landingUsers.forEach(userId => {
                if (activatedUsers.has(userId)) activatedCount += 1;
            });
            activationRate = (activatedCount / landingUsers.size) * 100;
        }

        const d7 = this.calculateD7Retention(this.filteredEvents);

        return {
            mau: mauUsers.size,
            dau: dauUsers.size,
            activationRate,
            d7RetentionRate: d7.rate
        };
    }

    calculateFunnelData() {
        const funnelSteps = [
            { key: 'landing_view', label: this.t('admin.funnelLanding', 'Landing') },
            { key: 'sound_open', label: this.t('admin.funnelSoundOpen', 'Sound Open') },
            { key: 'trim_complete', label: this.t('admin.funnelTrimComplete', 'Trim Complete') },
            { key: 'save_usb_success', label: this.t('admin.funnelSaveUsb', 'Save USB') },
            { key: 'share_gallery_success', label: this.t('admin.funnelShareGallery', 'Share Gallery') }
        ];

        const data = funnelSteps.map(step => {
            const users = this.getUsersByEvent(this.filteredEvents, step.key);
            return {
                ...step,
                count: users.size
            };
        });

        const base = data[0]?.count || 0;
        return data.map(item => ({
            ...item,
            conversion: base > 0 ? (item.count / base) * 100 : 0
        }));
    }

    calculateD7Retention(events) {
        const firstSeen = new Map();
        const userEvents = new Map();

        events.forEach(event => {
            const userId = event.userId;
            const ts = Number(event.occurredAtMs || 0);
            if (!userId || !ts) return;

            if (!firstSeen.has(userId) || ts < firstSeen.get(userId)) {
                firstSeen.set(userId, ts);
            }

            if (!userEvents.has(userId)) {
                userEvents.set(userId, []);
            }
            userEvents.get(userId).push(ts);
        });

        const now = Date.now();
        let cohort = 0;
        let retained = 0;

        firstSeen.forEach((firstTs, userId) => {
            if (firstTs > now - (7 * 24 * 60 * 60 * 1000)) {
                return;
            }
            cohort += 1;
            const targetTs = firstTs + (7 * 24 * 60 * 60 * 1000);
            const sessions = userEvents.get(userId) || [];
            if (sessions.some(ts => ts >= targetTs)) {
                retained += 1;
            }
        });

        const rate = cohort > 0 ? (retained / cohort) * 100 : 0;
        return { cohort, retained, rate };
    }

    calculateRetentionTrend(days = 14) {
        const firstSeen = new Map();
        const userEvents = new Map();

        this.filteredEvents.forEach(event => {
            const userId = event.userId;
            const ts = Number(event.occurredAtMs || 0);
            if (!userId || !ts) return;

            if (!firstSeen.has(userId) || ts < firstSeen.get(userId)) {
                firstSeen.set(userId, ts);
            }

            if (!userEvents.has(userId)) {
                userEvents.set(userId, []);
            }
            userEvents.get(userId).push(ts);
        });

        const labels = [];
        const rates = [];

        for (let i = days - 1; i >= 0; i -= 1) {
            const cohortDay = new Date();
            cohortDay.setHours(0, 0, 0, 0);
            cohortDay.setDate(cohortDay.getDate() - i - 7);

            const dayStart = cohortDay.getTime();
            const dayEnd = dayStart + (24 * 60 * 60 * 1000);

            let cohort = 0;
            let retained = 0;

            firstSeen.forEach((firstTs, userId) => {
                if (firstTs >= dayStart && firstTs < dayEnd) {
                    cohort += 1;
                    const target = firstTs + (7 * 24 * 60 * 60 * 1000);
                    const sessions = userEvents.get(userId) || [];
                    if (sessions.some(ts => ts >= target)) {
                        retained += 1;
                    }
                }
            });

            const rate = cohort > 0 ? (retained / cohort) * 100 : 0;
            labels.push(`${cohortDay.getMonth() + 1}/${cohortDay.getDate()}`);
            rates.push(Number(rate.toFixed(2)));
        }

        return { labels, rates };
    }

    renderCategoryChart(canvasId) {
        try {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            const categoryData = this.calculateCategoryStats();
            const labels = Object.keys(categoryData).map(cat => this.getCategoryLabel(cat));
            const data = Object.values(categoryData);

            if (this.categoryChart) this.categoryChart.destroy();

            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: ['#e82127', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
                        borderColor: '#1a1a1a',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#a0a0a0',
                                padding: 15,
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to render category chart:', error);
        }
    }

    renderTrendChart(canvasId) {
        try {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            const trendData = this.calculateTrendData(30);
            if (this.trendChart) this.trendChart.destroy();

            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendData.labels,
                    datasets: [{
                        label: this.t('admin.chartUploads', 'Uploads'),
                        data: trendData.data,
                        borderColor: '#e82127',
                        backgroundColor: 'rgba(232, 33, 39, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { color: '#333' },
                            ticks: { color: '#a0a0a0', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: '#333' },
                            ticks: { color: '#a0a0a0', stepSize: 1 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to render trend chart:', error);
        }
    }

    renderFunnelChart(canvasId) {
        try {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            const funnel = this.calculateFunnelData();
            if (this.funnelChart) this.funnelChart.destroy();

            this.funnelChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: funnel.map(step => step.label),
                    datasets: [{
                        label: this.t('admin.chartUsers', 'Users'),
                        data: funnel.map(step => step.count),
                        backgroundColor: '#e82127'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterBody: (items) => {
                                    const index = items?.[0]?.dataIndex ?? 0;
                                    const conversion = funnel[index]?.conversion || 0;
                                    return `Conversion: ${conversion.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#333' },
                            ticks: { color: '#a0a0a0' }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: '#333' },
                            ticks: { color: '#a0a0a0', stepSize: 1 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to render funnel chart:', error);
        }
    }

    renderRetentionChart(canvasId) {
        try {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            const retention = this.calculateRetentionTrend(14);
            if (this.retentionChart) this.retentionChart.destroy();

            this.retentionChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: retention.labels,
                    datasets: [{
                        label: this.t('admin.chartD7RetentionPct', 'D7 Retention %'),
                        data: retention.rates,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { color: '#333' },
                            ticks: { color: '#a0a0a0' }
                        },
                        y: {
                            beginAtZero: true,
                            suggestedMax: 100,
                            grid: { color: '#333' },
                            ticks: {
                                color: '#a0a0a0',
                                callback: (value) => `${value}%`
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to render retention chart:', error);
        }
    }

    getCategoryLabel(category) {
        const labels = {
            classic: i18n ? i18n.t('cat.classic') : 'Classic',
            modern: i18n ? i18n.t('cat.modern') : 'Modern',
            futuristic: i18n ? i18n.t('cat.futuristic') : 'Futuristic',
            custom: i18n ? i18n.t('cat.custom') : 'Custom',
            funny: i18n ? i18n.t('cat.funny') : 'Funny',
            musical: i18n ? i18n.t('cat.musical') : 'Musical'
        };
        return labels[category] || category;
    }

    updateStatsDisplay() {
        const stats = this.calculateOverviewStats();
        const elements = {
            'stat-total-sounds': stats.totalSounds,
            'stat-total-downloads': this.formatNumber(stats.totalDownloads),
            'stat-total-likes': this.formatNumber(stats.totalLikes),
            'stat-weekly-uploads': stats.weeklyUploads
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    updateGrowthKpiDisplay() {
        const lifecycle = this.calculateLifecycleStats();
        const items = {
            'stat-mau': this.formatNumber(lifecycle.mau),
            'stat-dau': this.formatNumber(lifecycle.dau),
            'stat-activation-rate': `${lifecycle.activationRate.toFixed(1)}%`,
            'stat-d7-retention': `${lifecycle.d7RetentionRate.toFixed(1)}%`
        };

        Object.entries(items).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    renderTopSoundsTable(tableId) {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;

        const topSounds = this.getTopSounds(10, 'downloads');
        if (topSounds.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-text-secondary);">${this.escapeHtml(this.t('admin.noSoundsAvailable', 'No sounds available'))}</td></tr>`;
            return;
        }

        tbody.innerHTML = topSounds.map((sound, index) => `
            <tr>
                <td class="rank">${index + 1}</td>
                <td>${this.escapeHtml(sound.name || 'Untitled')}</td>
                <td><span class="category-badge">${this.getCategoryLabel(sound.category || 'custom')}</span></td>
                <td>${this.formatNumber(sound.downloads || 0)}</td>
                <td>${this.formatNumber(sound.likes || 0)}</td>
            </tr>
        `).join('');
    }

    renderEventMetrics() {
        this.updateGrowthKpiDisplay();
        this.renderFunnelChart('funnel-chart');
        this.renderRetentionChart('retention-chart');
    }

    formatNumber(num) {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return String(num);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderAll() {
        this.updateStatsDisplay();
        this.renderCategoryChart('category-chart');
        this.renderTrendChart('trend-chart');
        this.renderTopSoundsTable('top-sounds-table');
        this.renderEventMetrics();
    }

    async refresh() {
        await Promise.all([this.loadSounds(), this.loadEvents()]);
        this.applyEventFilters();
        this.updateEntryChannelOptions();
        this.renderAll();
    }
}

let adminStats = null;

window.addEventListener('adminAuthenticated', async () => {
    if (!window.adminAuth) return;

    const db = window.adminAuth.getFirestore();
    if (!db) return;

    adminStats = new AdminStats();
    adminStats.init(db);

    try {
        await adminStats.refresh();
    } catch (error) {
        console.error('Failed to load statistics:', error);
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            statsSection.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Failed to load statistics. Please refresh the page.';
            statsSection.appendChild(errorDiv);
        }
    }

    window.adminStats = adminStats;
});
