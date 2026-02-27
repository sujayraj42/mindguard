/* ============================================
   MindGuard – F6: Gamification & Streaks
   ============================================ */

const ALL_BADGES = [
    { id: 'first_checkin', name: 'First Step', icon: '🌱', description: 'Complete your first check-in', xp: 25 },
    { id: 'week_warrior', name: 'Week Warrior', icon: '⚔️', description: '7-day check-in streak', xp: 100 },
    { id: 'month_tracker', name: 'Month Tracker', icon: '📅', description: 'Complete 4 check-ins', xp: 75 },
    { id: 'streak_master', name: 'Streak Master', icon: '🔥', description: '30-day streak', xp: 250 },
    { id: 'journal_writer', name: 'Journal Writer', icon: '✍️', description: 'Write 5 journal entries', xp: 50 },
    { id: 'circle_leader', name: 'Circle Leader', icon: '👑', description: 'Join 3 peer circles', xp: 75 },
    { id: 'helper', name: 'Helping Hand', icon: '🤝', description: 'Reply to 5 forum posts', xp: 60 },
    { id: 'zen_master', name: 'Zen Master', icon: '🧘', description: 'Complete 10 breathing sessions', xp: 100 },
    { id: 'night_owl', name: 'Sleep Champion', icon: '🌙', description: 'Log 7+ hours sleep for a week', xp: 80 },
    { id: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Use all 12 features', xp: 150 },
    { id: 'top_supporter', name: 'Top Supporter', icon: '⭐', description: 'Get 10 upvotes on forum', xp: 100 },
    { id: 'wellness_pro', name: 'Wellness Pro', icon: '💎', description: 'Reach Level 10', xp: 500 }
];

function initGamification() {
    const user = Auth.getUser();
    if (!user) return;

    const xp = user.xp || 0;
    const level = user.level || Math.floor(xp / 100) + 1;
    const streak = user.streak || 0;
    const totalCheckins = Store.get('checkins', []).length;
    const xpForNextLevel = level * 100;
    const xpProgress = (xp % 100) / 100 * 100;

    // Update stats
    document.getElementById('gamif-streak').textContent = streak;
    document.getElementById('gamif-level').textContent = level;
    document.getElementById('gamif-xp').textContent = xp;
    document.getElementById('gamif-xp-next').textContent = xpForNextLevel;
    document.getElementById('gamif-checkins').textContent = totalCheckins;
    document.getElementById('xp-bar').style.width = xpProgress + '%';

    // Render badges
    renderBadges(user);

    // Render leaderboard
    renderLeaderboard();
}

function renderBadges(user) {
    const grid = document.getElementById('badges-grid');
    const earned = user.badges || [];

    grid.innerHTML = ALL_BADGES.map(b => {
        const isEarned = earned.includes(b.id);
        return `
      <div class="badge-card glass-card-static ${isEarned ? '' : 'locked'}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${b.description}</div>
        <span class="badge ${isEarned ? 'badge-purple' : 'badge-info'}" style="margin-top:8px;">
          ${isEarned ? '✅ Earned' : `🔒 ${b.xp} XP`}
        </span>
      </div>
    `;
    }).join('');
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    const user = Auth.getUser();

    // Generate demo leaderboard
    const leaderboard = [
        { alias: 'Brave Phoenix', level: 12, xp: 1250, streak: 34 },
        { alias: 'Calm Eagle', level: 10, xp: 980, streak: 28 },
        { alias: 'Wise Dolphin', level: 8, xp: 820, streak: 21 },
        { alias: 'Bold Tiger', level: 7, xp: 710, streak: 18 },
        { alias: user?.anonymous_alias || 'You', level: user?.level || 1, xp: user?.xp || 0, streak: user?.streak || 0, isYou: true },
        { alias: 'Kind Panda', level: 6, xp: 580, streak: 14 },
        { alias: 'Swift Hawk', level: 5, xp: 490, streak: 11 },
        { alias: 'Gentle Bear', level: 4, xp: 380, streak: 8 }
    ].sort((a, b) => b.xp - a.xp);

    container.innerHTML = `
    <div style="display:grid;grid-template-columns:40px 1fr 80px 80px 80px;gap:8px;font-size:0.85rem;">
      <div style="color:var(--text-muted);font-weight:600;">#</div>
      <div style="color:var(--text-muted);font-weight:600;">Player</div>
      <div style="color:var(--text-muted);font-weight:600;text-align:center;">Level</div>
      <div style="color:var(--text-muted);font-weight:600;text-align:center;">XP</div>
      <div style="color:var(--text-muted);font-weight:600;text-align:center;">Streak</div>
      ${leaderboard.map((p, i) => `
        <div style="padding:8px 0;${p.isYou ? 'color:var(--primary-light);font-weight:700;' : ''}">
          ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
        </div>
        <div style="padding:8px 0;${p.isYou ? 'color:var(--primary-light);font-weight:700;' : ''}">
          ${p.alias} ${p.isYou ? '(You)' : ''}
        </div>
        <div style="padding:8px 0;text-align:center;${p.isYou ? 'color:var(--primary-light);font-weight:700;' : ''}">${p.level}</div>
        <div style="padding:8px 0;text-align:center;${p.isYou ? 'color:var(--primary-light);font-weight:700;' : ''}">${p.xp}</div>
        <div style="padding:8px 0;text-align:center;${p.isYou ? 'color:var(--primary-light);font-weight:700;' : ''}">🔥${p.streak}</div>
      `).join('')}
    </div>
  `;
}
