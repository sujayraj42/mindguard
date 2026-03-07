/* ============================================
   MindGuard – F1: Behavioral Check-in
   ============================================ */

let currentMood = 3;

function updateMetric(type, value) {
    const el = document.getElementById(type === 'sleep' ? 'sleep-val' :
        type === 'stress' ? 'stress-val' :
            type === 'social' ? 'social-val' : 'study-val');
    if (el) el.textContent = value;
}

function selectMood(mood) {
    currentMood = mood;
    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });
}

async function submitCheckin() {
    const btn = document.getElementById('checkin-submit-btn');
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Submitting...';
    btn.disabled = true;

    const data = {
        sleep_hours: parseFloat(document.getElementById('sleep-range').value),
        stress_level: parseInt(document.getElementById('stress-range').value),
        socialization: parseInt(document.getElementById('social-range').value),
        study_hours: parseFloat(document.getElementById('study-range').value),
        mood: currentMood
    };
    // logged_at is set by the server; keep a local copy for fallback display
    data.logged_at = new Date().toISOString();

    // Calculate risk score locally (basic heuristic, will be replaced by ML)
    const riskScore = calculateRiskScore(data);
    data.risk_score = riskScore;
    data.risk_level = riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';

    // Try API first, fallback to local
    try {
        const res = await Api.post('/checkin', {
            sleep_hours: data.sleep_hours,
            stress_level: data.stress_level,
            socialization: data.socialization,
            study_hours: data.study_hours,
            mood: data.mood
        });
        if (res.success && res.data) {
            // Use server-computed risk score
            data.risk_score = res.data.risk_score;
            data.risk_level = res.data.risk_level;
            data.logged_at = res.data.logged_at;
        }
    } catch (e) {
        // Local mode — already calculated above
    }

    // Save to local store
    Store.push('checkins', data);

    // Update user stats
    const user = Auth.getUser();
    if (user) {
        user.xp = (user.xp || 0) + 25;
        user.streak = (user.streak || 0) + 1;
        const totalCheckins = Store.get('checkins', []).length;

        // Level up check
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > (user.level || 1)) {
            user.level = newLevel;
            showToast(`🎉 Level Up! You're now Level ${newLevel}!`, 'success');
        }

        Auth.updateUser(user);
        document.getElementById('streak-count').textContent = user.streak;

        // Check for badge unlocks
        checkBadges(user, totalCheckins);
    }

    btn.innerHTML = '✅ Submit Check-in';
    btn.disabled = false;

    showConfetti();
    showToast('Check-in submitted! +25 XP 🎉', 'success');
}

function calculateRiskScore(data) {
    let score = 0;

    // Sleep: less sleep = higher risk
    if (data.sleep_hours < 5) score += 25;
    else if (data.sleep_hours < 6) score += 15;
    else if (data.sleep_hours < 7) score += 5;

    // Stress: higher stress = higher risk
    if (data.stress_level >= 8) score += 25;
    else if (data.stress_level >= 6) score += 15;
    else if (data.stress_level >= 4) score += 5;

    // Socialization: lower = higher risk
    if (data.socialization <= 2) score += 20;
    else if (data.socialization <= 4) score += 10;

    // Study hours: extreme values = risk
    if (data.study_hours > 12) score += 15;
    else if (data.study_hours < 1) score += 10;

    // Mood: lower = higher risk
    if (data.mood <= 1) score += 20;
    else if (data.mood <= 2) score += 10;
    else if (data.mood <= 3) score += 5;

    return Math.min(100, Math.max(0, score));
}

function checkBadges(user, totalCheckins) {
    const badges = user.badges || [];
    const newBadges = [];

    if (totalCheckins >= 1 && !badges.includes('first_checkin')) {
        newBadges.push('first_checkin');
        showToast('🏅 Badge Unlocked: First Check-in!', 'success');
    }
    if (totalCheckins >= 4 && !badges.includes('month_tracker')) {
        newBadges.push('month_tracker');
        showToast('🏅 Badge Unlocked: Month Tracker!', 'success');
    }
    if (user.streak >= 7 && !badges.includes('week_warrior')) {
        newBadges.push('week_warrior');
        showToast('🏅 Badge Unlocked: Week Warrior!', 'success');
    }
    if (user.streak >= 30 && !badges.includes('streak_master')) {
        newBadges.push('streak_master');
        showToast('🏅 Badge Unlocked: Streak Master!', 'success');
    }

    if (newBadges.length > 0) {
        user.badges = [...badges, ...newBadges];
        Auth.updateUser(user);
    }
}
