/**
 * Admin Authentication Module
 * Firebase Auth with Google Sign-In and Admin Verification
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAsrRsJVRCF-2nDCGNucE9FT_25OenDSrQ",
    authDomain: "tesla-lock-sounds.firebaseapp.com",
    projectId: "tesla-lock-sounds",
    storageBucket: "tesla-lock-sounds.firebasestorage.app",
    messagingSenderId: "1067424699027",
    appId: "1:1067424699027:web:3c7105f523f26c3005f366"
};

const ADMINS_COLLECTION = 'admins';

class AdminAuth {
    constructor() {
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.currentUser = null;
        this.isAdmin = false;
        this.isInitialized = false;
        this.onAuthStateChangedCallbacks = [];
    }

    async init() {
        if (this.isInitialized) {
            return true;
        }

        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            this.auth.onAuthStateChanged(async (user) => {
                await this.handleAuthStateChange(user);
            });

            this.isInitialized = true;
            return true;
        } catch (error) {
            throw new Error('Firebase initialization failed: ' + error.message);
        }
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            this.isAdmin = await this.checkAdminStatus(user.email);
        } else {
            this.currentUser = null;
            this.isAdmin = false;
        }

        this.onAuthStateChangedCallbacks.forEach(callback => {
            callback({
                user: this.currentUser,
                isAdmin: this.isAdmin
            });
        });
    }

    onAuthStateChanged(callback) {
        this.onAuthStateChangedCallbacks.push(callback);

        if (this.currentUser !== null || this.isInitialized) {
            callback({
                user: this.currentUser,
                isAdmin: this.isAdmin
            });
        }
    }

    async signInWithGoogle() {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                return null;
            }
            throw error;
        }
    }

    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        await this.auth.signOut();
        this.currentUser = null;
        this.isAdmin = false;
    }

    async checkAdminStatus(email) {
        if (!email) {
            return false;
        }

        try {
            const normalizedEmail = email.toLowerCase();
            const doc = await this.db.collection(ADMINS_COLLECTION).doc(normalizedEmail).get();
            return doc.exists;
        } catch (error) {
            console.error('Admin status check failed:', error);
            return false;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getIsAdmin() {
        return this.isAdmin;
    }

    getUserInfo() {
        if (!this.currentUser) {
            return null;
        }

        return {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            displayName: this.currentUser.displayName,
            photoURL: this.currentUser.photoURL
        };
    }

    getFirestore() {
        return this.db;
    }

    getStorage() {
        return this.storage;
    }
}

class AdminDashboardUI {
    constructor(adminAuth) {
        this.auth = adminAuth;
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.bindEvents();

        this.auth.onAuthStateChanged(({ user, isAdmin }) => {
            this.handleAuthStateChange(user, isAdmin);
        });
    }

    cacheElements() {
        this.elements = {
            loginSection: document.getElementById('admin-login'),
            dashboardSection: document.getElementById('admin-dashboard'),
            accessDenied: document.getElementById('access-denied'),
            deniedEmail: document.getElementById('denied-email'),
            loginCard: document.querySelector('.login-card'),
            googleLoginBtn: document.getElementById('btn-google-login'),
            tryAnotherBtn: document.getElementById('btn-try-another'),
            logoutBtn: document.getElementById('btn-logout'),
            userAvatar: document.getElementById('admin-user-avatar'),
            userEmail: document.getElementById('admin-user-email')
        };
    }

    bindEvents() {
        if (this.elements.googleLoginBtn) {
            this.elements.googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        if (this.elements.tryAnotherBtn) {
            this.elements.tryAnotherBtn.addEventListener('click', () => this.handleTryAnother());
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleGoogleLogin() {
        const btn = this.elements.googleLoginBtn;
        const originalText = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<span>Signing in...</span>';

            await this.auth.signInWithGoogle();
        } catch (error) {
            this.showError('Sign in failed: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async handleTryAnother() {
        await this.auth.signOut();
        this.showLoginScreen();
    }

    async handleLogout() {
        await this.auth.signOut();
        this.showLoginScreen();
    }

    handleAuthStateChange(user, isAdmin) {
        if (!user) {
            this.showLoginScreen();
            return;
        }

        if (isAdmin) {
            this.showDashboard(user);
        } else {
            this.showAccessDenied(user.email);
        }
    }

    showLoginScreen() {
        if (this.elements.loginCard) {
            this.elements.loginCard.style.display = 'block';
        }
        if (this.elements.accessDenied) {
            this.elements.accessDenied.style.display = 'none';
        }
        if (this.elements.loginSection) {
            this.elements.loginSection.style.display = 'flex';
        }
        if (this.elements.dashboardSection) {
            this.elements.dashboardSection.style.display = 'none';
        }
    }

    showAccessDenied(email) {
        if (this.elements.loginCard) {
            this.elements.loginCard.style.display = 'none';
        }
        if (this.elements.accessDenied) {
            this.elements.accessDenied.style.display = 'block';
        }
        if (this.elements.deniedEmail) {
            this.elements.deniedEmail.textContent = email;
        }
        if (this.elements.loginSection) {
            this.elements.loginSection.style.display = 'flex';
        }
        if (this.elements.dashboardSection) {
            this.elements.dashboardSection.style.display = 'none';
        }
    }

    showDashboard(user) {
        if (this.elements.loginSection) {
            this.elements.loginSection.style.display = 'none';
        }
        if (this.elements.dashboardSection) {
            this.elements.dashboardSection.style.display = 'flex';
        }

        if (this.elements.userAvatar && user.photoURL) {
            this.elements.userAvatar.src = user.photoURL;
        }
        if (this.elements.userEmail) {
            this.elements.userEmail.textContent = user.email;
        }

        window.dispatchEvent(new CustomEvent('adminAuthenticated', { detail: { user } }));
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

let adminAuth = null;
let adminUI = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        adminAuth = new AdminAuth();
        await adminAuth.init();

        adminUI = new AdminDashboardUI(adminAuth);
        adminUI.init();

        window.adminAuth = adminAuth;
    } catch (error) {
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.innerHTML = '';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'login-icon';
            iconDiv.textContent = '⚠️';

            const h1 = document.createElement('h1');
            h1.textContent = 'Error';

            const p = document.createElement('p');
            p.className = 'login-subtitle';
            p.textContent = error.message;

            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = 'Retry';
            btn.addEventListener('click', () => location.reload());

            loginCard.appendChild(iconDiv);
            loginCard.appendChild(h1);
            loginCard.appendChild(p);
            loginCard.appendChild(btn);
        }
    }
});
