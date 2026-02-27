/* ============================================
   MindGuard – Profile Page Module
   ============================================ */

function initProfile() {
    const user = Auth.getUser();
    if (!user) return;

    const checkins = Store.get('checkins', []);
    const journalEntries = Store.get('journal_entries', []);
    const joinedCircles = Store.get('joined_circles', []);
    const breathingSessions = Store.get('breathing_sessions', 0);
    const forumPosts = Store.get('forum_posts', []);

    // Profile Header
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    document.getElementById('profile-avatar-large').textContent = initials;
    document.getElementById('profile-name').textContent = user.name || 'Student';
    document.getElementById('profile-email').textContent = user.email || 'email@university.edu';
    document.getElementById('profile-alias').textContent = user.anonymous_alias || 'Anonymous';
    document.getElementById('profile-role').textContent = user.role === 'counselor' ? '🩺 Counselor' : '🎓 Student';
    document.getElementById('profile-joined').textContent = `Joined ${new Date(user.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;

    // Level & XP
    const xp = user.xp || 0;
    const level = user.level || Math.floor(xp / 100) + 1;
    const xpProgress = (xp % 100);
    document.getElementById('profile-level').textContent = level;
    document.getElementById('profile-xp-current').textContent = xp;
    document.getElementById('profile-xp-next').textContent = level * 100;
    document.getElementById('profile-xp-bar').style.width = xpProgress + '%';

    // Stats
    document.getElementById('profile-stat-checkins').textContent = checkins.length;
    document.getElementById('profile-stat-streak').textContent = user.streak || 0;
    document.getElementById('profile-stat-journal').textContent = journalEntries.length;
    document.getElementById('profile-stat-circles').textContent = joinedCircles.length;
    document.getElementById('profile-stat-breathing').textContent = breathingSessions;
    document.getElementById('profile-stat-posts').textContent = forumPosts.length;
    document.getElementById('profile-stat-badges').textContent = (user.badges || []).length;
    document.getElementById('profile-stat-xp').textContent = xp;

    // Risk summary
    if (checkins.length > 0) {
        const latest = checkins[checkins.length - 1];
        const riskBadge = document.getElementById('profile-risk-badge');
        riskBadge.textContent = latest.risk_level;
        riskBadge.className = `badge badge-${latest.risk_level.toLowerCase()}`;
    }

    // Populate settings form
    document.getElementById('settings-name').value = user.name || '';
    document.getElementById('settings-email').value = user.email || '';

    // Activity chart
    renderActivityChart(checkins);

    // Badge showcase
    renderProfileBadges(user);
}

function renderActivityChart(checkins) {
    const ctx = document.getElementById('profile-activity-chart');
    if (!ctx) return;

    // Last 7 days activity
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
        const dateStr = d.toISOString().split('T')[0];
        const count = checkins.filter(c => c.logged_at && c.logged_at.startsWith(dateStr)).length;
        data.push(count);
    }

    if (window.profileActivityChart) window.profileActivityChart.destroy();

    window.profileActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Activities',
                data,
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                borderRadius: 8,
                barThickness: 24
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', stepSize: 1 }, min: 0 }
            }
        }
    });
}

function renderProfileBadges(user) {
    const container = document.getElementById('profile-badges-showcase');
    const earned = user.badges || [];

    const ALL_BADGES = [
        { id: 'first_checkin', name: 'First Step', icon: '🌱' },
        { id: 'week_warrior', name: 'Week Warrior', icon: '⚔️' },
        { id: 'month_tracker', name: 'Month Tracker', icon: '📅' },
        { id: 'streak_master', name: 'Streak Master', icon: '🔥' },
        { id: 'journal_writer', name: 'Journal Writer', icon: '✍️' },
        { id: 'circle_leader', name: 'Circle Leader', icon: '👑' },
        { id: 'helper', name: 'Helping Hand', icon: '🤝' },
        { id: 'zen_master', name: 'Zen Master', icon: '🧘' },
        { id: 'night_owl', name: 'Sleep Champion', icon: '🌙' },
        { id: 'explorer', name: 'Explorer', icon: '🗺️' },
        { id: 'top_supporter', name: 'Top Supporter', icon: '⭐' },
        { id: 'wellness_pro', name: 'Wellness Pro', icon: '💎' }
    ];

    const earnedBadges = ALL_BADGES.filter(b => earned.includes(b.id));

    if (earnedBadges.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Complete check-ins and activities to earn badges!</span>';
        return;
    }

    container.innerHTML = earnedBadges.map(b => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--bg-glass);border-radius:var(--radius-md);border:1px solid var(--border-glass);">
      <span style="font-size:1.25rem;">${b.icon}</span>
      <span style="font-size:0.8rem;font-weight:600;">${b.name}</span>
    </div>
  `).join('');
}

function saveProfileSettings() {
    const name = document.getElementById('settings-name').value.trim();
    const email = document.getElementById('settings-email').value.trim();

    if (!name) {
        showToast('Name is required', 'error');
        return;
    }

    const user = Auth.getUser();
    if (user) {
        user.name = name;
        user.email = email;
        Auth.updateUser(user);

        // Update header avatar
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('user-avatar').textContent = initials;
        document.getElementById('profile-avatar-large').textContent = initials;
        document.getElementById('profile-name').textContent = name;
        document.getElementById('profile-email').textContent = email;
    }

    showToast('Profile updated! ✅', 'success');
}

function regenerateAlias() {
    const newAlias = Auth.generateAlias();
    const user = Auth.getUser();
    if (user) {
        user.anonymous_alias = newAlias;
        Auth.updateUser(user);
        document.getElementById('profile-alias').textContent = newAlias;
        showToast(`New alias: ${newAlias}`, 'success');
    }
}

function exportUserData() {
    const user = Auth.getUser();
    const checkins = Store.get('checkins', []);
    const journal = Store.get('journal_entries', []);

    const data = {
        profile: user,
        checkins,
        journal_entries: journal,
        exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindguard_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported! 📥', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ Are you sure? This will delete ALL your MindGuard data including check-ins, journal entries, and progress. This cannot be undone.')) return;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mg_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const user = Auth.getUser();
    if (user) {
        user.xp = 0;
        user.streak = 0;
        user.level = 1;
        user.badges = [];
        Auth.updateUser(user);
    }

    showToast('All data cleared', 'info');
    initProfile();
}
