/**
 * Admin Statistics Module
 * Dashboard statistics and Chart.js visualizations
 */

const GALLERY_COLLECTION = 'sounds';
const CATEGORIES = ['classic', 'modern', 'futuristic', 'custom', 'funny', 'musical'];

class AdminStats {
    constructor() {
        this.db = null;
        this.sounds = [];
        this.categoryChart = null;
        this.trendChart = null;
    }

    init(db) {
        this.db = db;
    }

    async loadAllStats() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            const snapshot = await this.db.collection(GALLERY_COLLECTION)
                .orderBy('createdAt', 'desc')
                .get();

            this.sounds = [];
            snapshot.forEach(doc => {
                this.sounds.push({ id: doc.id, ...doc.data() });
            });

            return this.sounds;
        } catch (error) {
            throw new Error('Failed to load sounds: ' + error.message);
        }
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
                categoryCount[category]++;
            } else {
                categoryCount['custom']++;
            }
        });

        return categoryCount;
    }

    calculateTrendData(days = 30) {
        const dateCount = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dateCount[dateStr] = 0;
        }

        this.sounds.forEach(sound => {
            if (!sound.createdAt) return;
            const createdAt = sound.createdAt.toDate ? sound.createdAt.toDate() : new Date(sound.createdAt);
            const dateStr = createdAt.toISOString().split('T')[0];
            if (dateCount[dateStr] !== undefined) {
                dateCount[dateStr]++;
            }
        });

        const labels = Object.keys(dateCount).map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });

        const data = Object.values(dateCount);

        return { labels, data };
    }

    getTopSounds(limit = 10, sortBy = 'downloads') {
        const sorted = [...this.sounds].sort((a, b) => {
            const valueA = (a[sortBy] || 0);
            const valueB = (b[sortBy] || 0);
            return valueB - valueA;
        });

        return sorted.slice(0, limit);
    }

    renderCategoryChart(canvasId) {
        try {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

        const categoryData = this.calculateCategoryStats();
        const labels = Object.keys(categoryData).map(cat => this.getCategoryLabel(cat));
        const data = Object.values(categoryData);

        const colors = [
            '#e82127',
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899'
        ];

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
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
                            font: {
                                size: 12
                            }
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

            if (this.trendChart) {
                this.trendChart.destroy();
            }

            this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Uploads',
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
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#333'
                        },
                        ticks: {
                            color: '#a0a0a0',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#333'
                        },
                        ticks: {
                            color: '#a0a0a0',
                            stepSize: 1
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Failed to render trend chart:', error);
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
            if (el) {
                el.textContent = value;
            }
        });
    }

    renderTopSoundsTable(tableId) {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;

        const topSounds = this.getTopSounds(10, 'downloads');

        if (topSounds.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary);">No sounds available</td></tr>`;
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

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async refresh() {
        await this.loadAllStats();
        this.updateStatsDisplay();
        this.renderCategoryChart('category-chart');
        this.renderTrendChart('trend-chart');
        this.renderTopSoundsTable('top-sounds-table');
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
