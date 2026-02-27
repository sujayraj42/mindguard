/* ============================================
   MindGuard – F11: Smart Notifications & Nudges
   ============================================ */

const MOTIVATIONAL_QUOTES = [
    { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { text: "It's okay to not be okay. What matters is that you keep going.", author: "Unknown" },
    { text: "Your mental health is a priority. Your happiness is essential.", author: "Unknown" },
    { text: "You are stronger than you think, braver than you believe.", author: "A.A. Milne" },
    { text: "Taking care of yourself isn't selfish — it's necessary.", author: "Unknown" },
    { text: "Every day may not be good, but there is good in every day.", author: "Alice Morse Earle" },
    { text: "Progress, not perfection, is what we should be asking of ourselves.", author: "Julia Cameron" },
    { text: "Be gentle with yourself. You're doing the best you can.", author: "Unknown" },
    { text: "Small steps every day lead to big changes over time.", author: "Unknown" },
    { text: "You are worthy of the love and care you give to others.", author: "Unknown" }
];

function initNotifications() {
    const container = document.getElementById('notifications-list');
    const notifications = generateNotifications();

    if (notifications.length === 0) {
        container.innerHTML = `
      <div class="empty-state glass-card-static" style="padding:40px;">
        <div class="empty-state-icon">🔔</div>
        <h3>No notifications yet</h3>
        <p>Start using MindGuard to receive personalized nudges.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = notifications.map((n, i) => `
    <div class="glass-card animate-fadeInUp" style="padding:20px;animation-delay:${i * 0.1}s;cursor:pointer;" onclick="${n.action || ''}">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="font-size:1.5rem;flex-shrink:0;">${n.icon}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="font-size:0.9rem;">${n.title}</strong>
            <span style="font-size:0.75rem;color:var(--text-muted);">${n.time}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-secondary);">${n.message}</p>
        </div>
      </div>
    </div>
  `).join('');

    // Hide notification dot
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
}

function generateNotifications() {
    const notifications = [];
    const user = Auth.getUser();
    const checkins = Store.get('checkins', []);
    const lastCheckin = checkins[checkins.length - 1];
    const now = new Date();

    // Daily motivational quote
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    notifications.push({
        icon: '💬',
        title: 'Daily Motivation',
        message: `"${quote.text}" — ${quote.author}`,
        time: 'Today',
        action: ''
    });

    // Check-in reminder
    const lastCheckinDate = lastCheckin ? new Date(lastCheckin.logged_at) : null;
    const daysSinceCheckin = lastCheckinDate
        ? Math.floor((now - lastCheckinDate) / (1000 * 60 * 60 * 24))
        : 999;

    if (daysSinceCheckin >= 7) {
        notifications.push({
            icon: '📋',
            title: 'Weekly Check-in Due',
            message: "It's been a while since your last check-in. Take 2 minutes to log how you're doing.",
            time: daysSinceCheckin + ' days ago',
            action: "navigateTo('checkin')"
        });
    }

    // Streak celebration
    if (user?.streak >= 7) {
        notifications.push({
            icon: '🔥',
            title: 'Streak Milestone!',
            message: `Amazing! You've maintained a ${user.streak}-day streak. Keep it up!`,
            time: 'Achievement',
            action: "navigateTo('gamification')"
        });
    }

    // Risk alert
    if (lastCheckin && lastCheckin.risk_level === 'High') {
        notifications.push({
            icon: '⚠️',
            title: 'High Risk Alert',
            message: 'Your recent check-in shows elevated risk. Consider talking to a counselor or trying a breathing exercise.',
            time: 'Important',
            action: "navigateTo('counselor')"
        });
    }

    // Journal nudge
    const journalEntries = Store.get('journal_entries', []);
    if (journalEntries.length === 0) {
        notifications.push({
            icon: '📓',
            title: 'Start Your Journal',
            message: 'Writing about your feelings can help you understand and process them better.',
            time: 'Suggestion',
            action: "navigateTo('journal')"
        });
    }

    // Breathing reminder
    notifications.push({
        icon: '🧘',
        title: 'Mindfulness Moment',
        message: 'Take a 2-minute breathing break. Your mind will thank you.',
        time: 'Wellness',
        action: "navigateTo('breathing')"
    });

    // Sleep tip
    if (lastCheckin && lastCheckin.sleep_hours < 6) {
        notifications.push({
            icon: '😴',
            title: 'Sleep Notice',
            message: 'Your sleep has been below 6 hours. Check out our sleep tips for better rest.',
            time: 'Health',
            action: "navigateTo('sleep')"
        });
    }

    // Welcome message for new users
    if (checkins.length <= 1) {
        notifications.push({
            icon: '👋',
            title: 'Welcome to MindGuard!',
            message: 'Start with your first weekly check-in to begin tracking your wellness journey.',
            time: 'Welcome',
            action: "navigateTo('checkin')"
        });
    }

    return notifications;
}
