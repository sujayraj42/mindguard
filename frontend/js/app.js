/* ============================================
   MindGuard – App Core (Router + Global)
   ============================================ */

// ---- HTML Sanitization (XSS protection) ----
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ---- Page Navigation ----
const PAGE_TITLES = {
    checkin: 'Weekly Check-in',
    trends: 'AI Risk Engine',
    counselor: 'Anonymous Counselor',
    circles: 'Peer Support Circles',
    journal: 'Mood Journal',
    gamification: 'Achievements & Streaks',
    sos: 'Emergency SOS',
    breathing: 'Breathing & Meditation',
    sleep: 'Sleep Analyzer',
    notifications: 'Notifications',
    forum: 'Anonymous Forum',
    profile: 'My Profile'
};

function navigateTo(page) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    // Show target
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Update title
    document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;

    // Init page-specific content
    if (page === 'trends') initTrends();
    if (page === 'counselor') initCounselor();
    if (page === 'circles') initCircles();
    if (page === 'journal') initJournal();
    if (page === 'gamification') initGamification();
    if (page === 'sleep') initSleep();
    if (page === 'notifications') initNotifications();
    if (page === 'forum') initForum();
    if (page === 'profile') initProfile();

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// ---- User Menu Toggle ----
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('user-menu');
    const avatar = document.getElementById('user-avatar');
    if (menu && avatar && !avatar.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// ---- Theme Toggle ----
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('mindguard_theme', next);
    document.getElementById('theme-btn').textContent = next === 'dark' ? '🌙' : '☀️';
}

// ---- Sidebar Toggle (mobile) ----
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ---- Confetti Effect ----
function showConfetti() {
    const colors = ['#8b5cf6', '#06b6d4', '#f472b6', '#fbbf24', '#34d399'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.width = (Math.random() * 8 + 5) + 'px';
        piece.style.height = (Math.random() * 8 + 5) + 'px';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 2500);
    }
}

// ---- Data Store (localStorage-based) ----
const Store = {
    get(key, defaultVal = null) {
        const val = localStorage.getItem('mg_' + key);
        return val ? JSON.parse(val) : defaultVal;
    },
    set(key, val) {
        localStorage.setItem('mg_' + key, JSON.stringify(val));
    },
    push(key, item) {
        const arr = this.get(key, []);
        arr.push(item);
        this.set(key, arr);
    }
};

// ---- Init on Load ----
document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('mindguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-btn').textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    // Set user avatar
    const user = Auth.getUser();
    if (user) {
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
        document.getElementById('user-avatar').textContent = initials;

        // Update streak display
        const streak = user.streak || 0;
        document.getElementById('streak-count').textContent = streak;
    }

    // Load initial page
    navigateTo('checkin');
});
