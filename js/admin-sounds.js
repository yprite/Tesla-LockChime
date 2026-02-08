/**
 * Admin Sound Management Module
 * List, filter, sort, and delete sounds
 */

const SOUNDS_PER_PAGE = 20;

class AdminSounds {
    constructor() {
        this.db = null;
        this.storage = null;
        this.sounds = [];
        this.filteredSounds = [];
        this.currentPage = 1;
        this.selectedSounds = new Set();
        this.currentFilters = {
            search: '',
            category: 'all',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        this.pendingDelete = null;
    }

    init(db, storage) {
        this.db = db;
        this.storage = storage;
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            tableBody: document.getElementById('sounds-table-body'),
            loadingState: document.getElementById('loading-state'),
            emptyState: document.getElementById('empty-state'),
            searchInput: document.getElementById('sound-search'),
            categoryFilter: document.getElementById('category-filter'),
            sortFilter: document.getElementById('sort-filter'),
            selectAll: document.getElementById('select-all'),
            bulkActions: document.getElementById('bulk-actions'),
            selectedCount: document.getElementById('selected-count'),
            bulkDeleteBtn: document.getElementById('btn-bulk-delete'),
            prevBtn: document.getElementById('btn-prev'),
            nextBtn: document.getElementById('btn-next'),
            pageInfo: document.getElementById('page-info'),
            deleteModal: document.getElementById('delete-modal'),
            deleteMessage: document.getElementById('delete-message'),
            cancelDeleteBtn: document.getElementById('btn-cancel-delete'),
            confirmDeleteBtn: document.getElementById('btn-confirm-delete')
        };
    }

    bindEvents() {
        if (this.elements.searchInput) {
            let debounceTimer;
            this.elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const searchValue = e.target.value.slice(0, 200).toLowerCase();
                    this.currentFilters.search = searchValue;
                    this.applyFilters();
                }, 300);
            });
        }

        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (this.elements.sortFilter) {
            this.elements.sortFilter.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.currentFilters.sortBy = sortBy;
                this.currentFilters.sortOrder = sortOrder;
                this.applyFilters();
            });
        }

        if (this.elements.selectAll) {
            this.elements.selectAll.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }

        if (this.elements.bulkDeleteBtn) {
            this.elements.bulkDeleteBtn.addEventListener('click', () => {
                this.showBulkDeleteConfirmation();
            });
        }

        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTable();
                }
            });
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredSounds.length / SOUNDS_PER_PAGE);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderTable();
                }
            });
        }

        if (this.elements.cancelDeleteBtn) {
            this.elements.cancelDeleteBtn.addEventListener('click', () => {
                this.hideDeleteModal();
            });
        }

        if (this.elements.confirmDeleteBtn) {
            this.elements.confirmDeleteBtn.addEventListener('click', () => {
                this.executeDelete();
            });
        }

        if (this.elements.deleteModal) {
            this.elements.deleteModal.addEventListener('click', (e) => {
                if (e.target === this.elements.deleteModal) {
                    this.hideDeleteModal();
                }
            });
        }
    }

    t(key, fallback, params = {}) {
        if (typeof i18n !== 'undefined' && i18n && typeof i18n.t === 'function') {
            return i18n.t(key, params);
        }
        return fallback;
    }

    async loadSounds() {
        this.showLoading();

        try {
            const snapshot = await this.db.collection('sounds')
                .orderBy('createdAt', 'desc')
                .get();

            this.sounds = [];
            snapshot.forEach(doc => {
                this.sounds.push({ id: doc.id, ...doc.data() });
            });

            this.applyFilters();
        } catch (error) {
            this.showError('Failed to load sounds: ' + error.message);
        }
    }

    applyFilters() {
        let filtered = [...this.sounds];

        if (this.currentFilters.search) {
            const search = this.currentFilters.search;
            filtered = filtered.filter(s =>
                (s.name && s.name.toLowerCase().includes(search)) ||
                (s.description && s.description.toLowerCase().includes(search))
            );
        }

        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(s => s.category === this.currentFilters.category);
        }

        const { sortBy, sortOrder } = this.currentFilters;
        filtered.sort((a, b) => {
            let valueA, valueB;

            if (sortBy === 'createdAt') {
                valueA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                valueB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            } else {
                valueA = a[sortBy] || 0;
                valueB = b[sortBy] || 0;
            }

            if (sortOrder === 'desc') {
                return valueA > valueB ? -1 : 1;
            }
            return valueA > valueB ? 1 : -1;
        });

        this.filteredSounds = filtered;
        this.currentPage = 1;
        this.selectedSounds.clear();
        this.updateBulkActionsUI();
        this.renderTable();
    }

    renderTable() {
        if (!this.elements.tableBody) return;

        this.hideLoading();

        if (this.filteredSounds.length === 0) {
            this.elements.tableBody.innerHTML = '';
            if (this.elements.emptyState) {
                this.elements.emptyState.style.display = 'block';
            }
            this.updatePagination();
            return;
        }

        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }

        const start = (this.currentPage - 1) * SOUNDS_PER_PAGE;
        const end = start + SOUNDS_PER_PAGE;
        const pageSounds = this.filteredSounds.slice(start, end);

        this.elements.tableBody.innerHTML = pageSounds.map(sound => {
            const date = sound.createdAt
                ? (sound.createdAt.toDate ? sound.createdAt.toDate() : new Date(sound.createdAt))
                : new Date();

            const formattedDate = date.toLocaleDateString();
            const fileSize = this.formatFileSize(sound.fileSize || 0);
            const isSelected = this.selectedSounds.has(sound.id);

            return `
                <tr data-id="${sound.id}">
                    <td class="checkbox-col">
                        <input type="checkbox" class="sound-checkbox" data-id="${sound.id}" ${isSelected ? 'checked' : ''}>
                    </td>
                    <td>
                        <div class="sound-name">
                            <span class="sound-name-text">${this.escapeHtml(sound.name || 'Untitled')}</span>
                            ${sound.description ? `<span class="sound-description">${this.escapeHtml(sound.description)}</span>` : ''}
                        </div>
                    </td>
                    <td><span class="category-badge">${this.getCategoryLabel(sound.category || 'custom')}</span></td>
                    <td>${fileSize}</td>
                    <td>${sound.downloads || 0}</td>
                    <td>${sound.likes || 0}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${sound.id}" title="Delete" aria-label="Delete sound"><span aria-hidden="true">🗑️</span></button>
                    </td>
                </tr>
            `;
        }).join('');

        this.bindRowEvents();
        this.updatePagination();
    }

    bindRowEvents() {
        const checkboxes = this.elements.tableBody.querySelectorAll('.sound-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const soundId = e.target.dataset.id;
                if (e.target.checked) {
                    this.selectedSounds.add(soundId);
                } else {
                    this.selectedSounds.delete(soundId);
                }
                this.updateBulkActionsUI();
            });
        });

        const deleteButtons = this.elements.tableBody.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const soundId = e.target.dataset.id;
                this.showDeleteConfirmation(soundId);
            });
        });
    }

    handleSelectAll(checked) {
        const start = (this.currentPage - 1) * SOUNDS_PER_PAGE;
        const end = start + SOUNDS_PER_PAGE;
        const pageSounds = this.filteredSounds.slice(start, end);

        if (checked) {
            pageSounds.forEach(s => this.selectedSounds.add(s.id));
        } else {
            pageSounds.forEach(s => this.selectedSounds.delete(s.id));
        }

        const checkboxes = this.elements.tableBody.querySelectorAll('.sound-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });

        this.updateBulkActionsUI();
    }

    updateBulkActionsUI() {
        const count = this.selectedSounds.size;

        if (this.elements.bulkActions) {
            this.elements.bulkActions.style.display = count > 0 ? 'flex' : 'none';
        }

        if (this.elements.selectedCount) {
            this.elements.selectedCount.textContent = this.t('admin.selectedCount', `${count} selected`, { count });
        }

        if (this.elements.selectAll) {
            const start = (this.currentPage - 1) * SOUNDS_PER_PAGE;
            const end = start + SOUNDS_PER_PAGE;
            const pageSounds = this.filteredSounds.slice(start, end);
            const allSelected = pageSounds.length > 0 && pageSounds.every(s => this.selectedSounds.has(s.id));
            this.elements.selectAll.checked = allSelected;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredSounds.length / SOUNDS_PER_PAGE) || 1;

        if (this.elements.pageInfo) {
            this.elements.pageInfo.textContent = this.t('admin.pageOf', `Page ${this.currentPage} of ${totalPages}`, {
                page: this.currentPage,
                total: totalPages
            });
        }

        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = this.currentPage <= 1;
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = this.currentPage >= totalPages;
        }
    }

    showDeleteConfirmation(soundId) {
        const sound = this.sounds.find(s => s.id === soundId);
        if (!sound) return;

        this.pendingDelete = { type: 'single', ids: [soundId] };

        if (this.elements.deleteMessage) {
            this.elements.deleteMessage.innerHTML = `Are you sure you want to delete <strong>"${this.escapeHtml(sound.name || 'Untitled')}"</strong>? This action cannot be undone.`;
        }

        this.showDeleteModal();
    }

    showBulkDeleteConfirmation() {
        if (this.selectedSounds.size === 0) return;

        this.pendingDelete = { type: 'bulk', ids: Array.from(this.selectedSounds) };

        if (this.elements.deleteMessage) {
            this.elements.deleteMessage.innerHTML = `Are you sure you want to delete <strong>${this.selectedSounds.size} sounds</strong>? This action cannot be undone.`;
        }

        this.showDeleteModal();
    }

    showDeleteModal() {
        if (this.elements.deleteModal) {
            this.elements.deleteModal.style.display = 'flex';
        }
    }

    hideDeleteModal() {
        if (this.elements.deleteModal) {
            this.elements.deleteModal.style.display = 'none';
        }
        this.pendingDelete = null;
    }

    async executeDelete() {
        if (!this.pendingDelete) return;

        const { ids } = this.pendingDelete;
        const btn = this.elements.confirmDeleteBtn;
        const originalText = btn ? btn.textContent : '';

        try {
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Deleting...';
            }

            for (const soundId of ids) {
                await this.deleteSound(soundId);
            }

            this.sounds = this.sounds.filter(s => !ids.includes(s.id));
            this.selectedSounds.clear();
            this.applyFilters();

            this.showSuccess(`Successfully deleted ${ids.length} sound(s)`);

            if (window.adminStats) {
                await window.adminStats.refresh();
            }
        } catch (error) {
            this.showError('Delete failed: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
            }
            this.hideDeleteModal();
        }
    }

    async deleteSound(soundId) {
        const sound = this.sounds.find(s => s.id === soundId);
        if (!sound) {
            throw new Error('Sound not found');
        }

        if (sound.fileName && this.storage) {
            try {
                const storageRef = this.storage.ref(`sounds/${sound.fileName}`);
                await storageRef.delete();
            } catch (storageError) {
                // Storage file may not exist, continue with Firestore deletion
            }
        }

        await this.db.collection('sounds').doc(soundId).delete();
    }

    showLoading() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'flex';
        }
        if (this.elements.tableBody) {
            this.elements.tableBody.innerHTML = '';
        }
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async refresh() {
        await this.loadSounds();
    }
}

let adminSounds = null;

window.addEventListener('adminAuthenticated', async () => {
    if (!window.adminAuth) return;

    const db = window.adminAuth.getFirestore();
    const storage = window.adminAuth.getStorage();
    if (!db) return;

    adminSounds = new AdminSounds();
    adminSounds.init(db, storage);

    try {
        await adminSounds.loadSounds();
    } catch (error) {
        console.error('Failed to load sounds:', error);
        const managementSection = document.querySelector('.management-section');
        if (managementSection) {
            managementSection.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Failed to load sounds. Please refresh the page.';
            managementSection.appendChild(errorDiv);
        }
    }

    window.adminSounds = adminSounds;
});
