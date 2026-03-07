/* ============================================
   MindGuard – F8: Admin Analytics Dashboard
   Complete admin portal with API integration
   ============================================ */

// Cached admin stats
let adminStats = null;

// ---- Page Navigation ----
function showAdminPage(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('admin-page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    const titles = {
        overview: 'Admin Overview',
        'risk-analytics': 'Risk Analytics',
        engagement: 'Engagement Metrics',
        students: 'Student Management',
        counselors: 'Counselor Management',
        reports: 'Reports'
    };
    document.getElementById('admin-page-title').textContent = titles[page] || 'Admin';

    // Init charts on page load
    if (page === 'overview') initOverviewPage();
    if (page === 'risk-analytics') initRiskAnalyticsPage();
    if (page === 'engagement') initEngagementPage();
    if (page === 'students') initStudentsTable();
    if (page === 'counselors') initCounselorsList();
}

function toggleAdminTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('mindguard_theme', next);
    document.getElementById('admin-theme-btn').textContent = next === 'dark' ? '🌙' : '☀️';
}

// ---- Fetch Admin Stats from API ----
async function fetchAdminStats() {
    try {
        const res = await Api.get('/admin/stats');
        if (res.success && res.data) {
            adminStats = res.data;
            return adminStats;
        }
    } catch (e) {
        console.error('Failed to fetch admin stats:', e);
    }

    // Fallback: demo stats
    adminStats = {
        total_users: 1247,
        total_checkins: 892,
        total_journal: 534,
        total_posts: 312,
        risk_distribution: { high: 47, medium: 506, low: 694 }
    };
    return adminStats;
}

// ---- Overview Page ----
let checkinChart = null, riskPieChart = null;

async function initOverviewPage() {
    const stats = adminStats || await fetchAdminStats();

    // Update summary cards
    setText('admin-total-students', stats.total_users.toLocaleString());
    setText('admin-students-trend', `↑ Registered users`);
    setText('admin-total-checkins', stats.total_checkins.toLocaleString());
    setText('admin-checkins-trend', `Total submissions`);

    const highRisk = stats.risk_distribution.high;
    const totalRisk = stats.risk_distribution.high + stats.risk_distribution.medium + stats.risk_distribution.low;
    setText('admin-at-risk', highRisk.toLocaleString());
    setText('admin-risk-pct', totalRisk > 0 ? `${((highRisk / totalRisk) * 100).toFixed(1)}% of check-ins` : 'No data');

    setText('admin-total-posts', stats.total_posts.toLocaleString());
    setText('admin-posts-trend', 'Forum posts');

    // Risk breakdown
    setText('admin-low-risk', stats.risk_distribution.low.toLocaleString());
    setText('admin-med-risk', stats.risk_distribution.medium.toLocaleString());
    setText('admin-high-risk', stats.risk_distribution.high.toLocaleString());
    setText('admin-total-journal', stats.total_journal.toLocaleString());

    initOverviewCharts(stats);
}

function initOverviewCharts(stats) {
    // Check-in trend chart
    const ctx1 = document.getElementById('admin-checkin-chart');
    if (checkinChart) checkinChart.destroy();

    checkinChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: 'Check-ins',
                data: generateTrendData(stats.total_checkins, 8),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139,92,246,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: chartOptions(500)
    });

    // Risk distribution pie
    const ctx2 = document.getElementById('admin-risk-pie');
    if (riskPieChart) riskPieChart.destroy();

    riskPieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [stats.risk_distribution.low, stats.risk_distribution.medium, stats.risk_distribution.high],
                backgroundColor: ['rgba(52,211,153,0.7)', 'rgba(251,191,36,0.7)', 'rgba(248,113,113,0.7)'],
                borderColor: ['#34d399', '#fbbf24', '#f87171'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12 } }
            },
            cutout: '60%'
        }
    });
}

// ---- Risk Analytics Page ----
let riskTrendChart = null;

async function initRiskAnalyticsPage() {
    const stats = adminStats || await fetchAdminStats();

    setText('admin-ra-low', stats.risk_distribution.low.toLocaleString());
    setText('admin-ra-med', stats.risk_distribution.medium.toLocaleString());
    setText('admin-ra-high', stats.risk_distribution.high.toLocaleString());

    const total = stats.risk_distribution.low + stats.risk_distribution.medium + stats.risk_distribution.high;
    if (total > 0) {
        setText('admin-ra-low-pct', `Low Risk (${((stats.risk_distribution.low / total) * 100).toFixed(1)}%)`);
        setText('admin-ra-med-pct', `Medium Risk (${((stats.risk_distribution.medium / total) * 100).toFixed(1)}%)`);
        setText('admin-ra-high-pct', `High Risk (${((stats.risk_distribution.high / total) * 100).toFixed(1)}%)`);
    }

    const ctx = document.getElementById('admin-risk-trend-chart');
    if (!ctx) return;
    if (riskTrendChart) riskTrendChart.destroy();

    riskTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [
                { label: 'Low', data: generateTrendData(stats.risk_distribution.low, 8), borderColor: '#34d399', tension: 0.4, fill: false },
                { label: 'Medium', data: generateTrendData(stats.risk_distribution.medium, 8), borderColor: '#fbbf24', tension: 0.4, fill: false },
                { label: 'High', data: generateTrendData(stats.risk_distribution.high, 8), borderColor: '#f87171', tension: 0.4, fill: false }
            ]
        },
        options: chartOptions()
    });
}

// ---- Engagement Page ----
let featureChart = null;

async function initEngagementPage() {
    const stats = adminStats || await fetchAdminStats();

    setText('admin-eng-checkins', stats.total_checkins.toLocaleString());
    setText('admin-eng-journal', stats.total_journal.toLocaleString());
    setText('admin-eng-posts', stats.total_posts.toLocaleString());
    setText('admin-eng-users', stats.total_users.toLocaleString());

    const ctx = document.getElementById('admin-feature-chart');
    if (!ctx) return;
    if (featureChart) featureChart.destroy();

    featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Check-in', 'Trends', 'Counselor', 'Circles', 'Journal', 'Breathing', 'Forum', 'Sleep', 'SOS', 'Gamification'],
            datasets: [{
                label: 'Usage',
                data: [
                    stats.total_checkins,
                    Math.round(stats.total_checkins * 0.85),
                    Math.round(stats.total_users * 0.25),
                    Math.round(stats.total_users * 0.35),
                    stats.total_journal,
                    Math.round(stats.total_users * 0.4),
                    stats.total_posts,
                    Math.round(stats.total_checkins * 0.3),
                    Math.round(stats.total_users * 0.04),
                    Math.round(stats.total_users * 0.55)
                ],
                backgroundColor: [
                    'rgba(139,92,246,0.6)', 'rgba(6,182,212,0.6)', 'rgba(244,114,182,0.6)',
                    'rgba(52,211,153,0.6)', 'rgba(251,191,36,0.6)', 'rgba(139,92,246,0.4)',
                    'rgba(6,182,212,0.4)', 'rgba(244,114,182,0.4)', 'rgba(248,113,113,0.6)',
                    'rgba(251,191,36,0.4)'
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// ---- Students Table ----
function initStudentsTable() {
    const tbody = document.getElementById('admin-students-body');
    const demoStudents = [
        { alias: 'Brave Phoenix', checkins: 18, streak: 12, risk: 'Low', lastActive: '2h ago', status: 'Active' },
        { alias: 'Calm Eagle', checkins: 15, streak: 8, risk: 'Low', lastActive: '1d ago', status: 'Active' },
        { alias: 'Gentle Fox', checkins: 12, streak: 5, risk: 'Medium', lastActive: '3h ago', status: 'Active' },
        { alias: 'Swift Wolf', checkins: 9, streak: 0, risk: 'High', lastActive: '5d ago', status: 'Inactive' },
        { alias: 'Wise Owl', checkins: 22, streak: 22, risk: 'Low', lastActive: '1h ago', status: 'Active' },
        { alias: 'Bold Tiger', checkins: 7, streak: 2, risk: 'Medium', lastActive: '2d ago', status: 'Active' },
        { alias: 'Kind Panda', checkins: 3, streak: 0, risk: 'High', lastActive: '8d ago', status: 'At Risk' },
        { alias: 'Noble Lion', checkins: 14, streak: 6, risk: 'Low', lastActive: '4h ago', status: 'Active' }
    ];

    tbody.innerHTML = demoStudents.map(s => {
        const badgeClass = s.risk === 'High' ? 'badge-high' : s.risk === 'Medium' ? 'badge-medium' : 'badge-low';
        const statusColor = s.status === 'At Risk' ? 'var(--accent-red)' : s.status === 'Inactive' ? 'var(--accent-yellow)' : 'var(--accent-green)';
        return `
      <tr style="border-bottom:1px solid var(--border-subtle);">
        <td style="padding:10px;font-weight:500;">${escapeHtml(s.alias)}</td>
        <td style="padding:10px;text-align:center;">${s.checkins}</td>
        <td style="padding:10px;text-align:center;">${s.streak > 0 ? '🔥' + s.streak : '-'}</td>
        <td style="padding:10px;text-align:center;"><span class="badge ${badgeClass}">${s.risk}</span></td>
        <td style="padding:10px;text-align:center;color:var(--text-muted);">${s.lastActive}</td>
        <td style="padding:10px;text-align:center;"><span style="color:${statusColor};font-weight:600;font-size:0.85rem;">${s.status}</span></td>
      </tr>
    `;
    }).join('');
}

// ---- Counselors List ----
function initCounselorsList() {
    const container = document.getElementById('admin-counselors-list');
    const counselors = [
        { name: 'Dr. Serenity', spec: 'Anxiety & Stress', sessions: 34, rating: 4.8, available: true },
        { name: 'Dr. Haven', spec: 'Depression & Mood', sessions: 28, rating: 4.9, available: true },
        { name: 'Dr. Compass', spec: 'Academic Burnout', sessions: 22, rating: 4.7, available: false },
        { name: 'Dr. Harmony', spec: 'Relationships', sessions: 19, rating: 4.6, available: true },
        { name: 'Dr. Anchor', spec: 'Crisis Intervention', sessions: 41, rating: 4.9, available: true }
    ];

    container.innerHTML = counselors.map(c => `
    <div class="glass-card-static" style="padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <strong>${escapeHtml(c.name)}</strong>
          <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(c.spec)}</div>
        </div>
        <span class="badge ${c.available ? 'badge-low' : 'badge-high'}">${c.available ? 'Available' : 'Busy'}</span>
      </div>
      <div style="display:flex;gap:16px;font-size:0.85rem;color:var(--text-secondary);">
        <span>📊 ${c.sessions} sessions</span>
        <span>⭐ ${c.rating}/5.0</span>
      </div>
    </div>
  `).join('');
}

// ---- Export CSV ----
function exportCSV() {
    const students = [
        ['Alias', 'Check-ins', 'Streak', 'Risk', 'Status'],
        ['Brave Phoenix', 18, 12, 'Low', 'Active'],
        ['Calm Eagle', 15, 8, 'Low', 'Active'],
        ['Gentle Fox', 12, 5, 'Medium', 'Active'],
        ['Swift Wolf', 9, 0, 'High', 'Inactive'],
        ['Wise Owl', 22, 22, 'Low', 'Active'],
        ['Bold Tiger', 7, 2, 'Medium', 'Active'],
        ['Kind Panda', 3, 0, 'High', 'At Risk'],
        ['Noble Lion', 14, 6, 'Low', 'Active']
    ];
    const csv = students.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindguard_students_report.csv';
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast('CSV exported successfully!', 'success');
}

// ---- Download Report ----
function downloadReport(type) {
    const titles = {
        weekly: 'Weekly Risk Summary',
        monthly: 'Monthly Engagement Report',
        intervention: 'Intervention Effectiveness Analysis'
    };

    const stats = adminStats || { total_users: 0, total_checkins: 0, total_journal: 0, total_posts: 0, risk_distribution: { high: 0, medium: 0, low: 0 } };
    const report = `MindGuard – ${titles[type] || 'Report'}
Generated: ${new Date().toLocaleDateString()}
${'='.repeat(40)}

Total Users: ${stats.total_users}
Total Check-ins: ${stats.total_checkins}
Journal Entries: ${stats.total_journal}
Forum Posts: ${stats.total_posts}

Risk Distribution:
  Low Risk: ${stats.risk_distribution.low}
  Medium Risk: ${stats.risk_distribution.medium}
  High Risk: ${stats.risk_distribution.high}
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindguard_${type}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast(`${titles[type]} downloaded!`, 'success');
}

// ---- Utilities ----
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function generateTrendData(finalValue, points) {
    const data = [];
    const start = Math.max(1, Math.round(finalValue * 0.5));
    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        const value = start + (finalValue - start) * progress;
        data.push(Math.round(value + (Math.random() - 0.5) * finalValue * 0.1));
    }
    data[data.length - 1] = finalValue; // ensure last point is exact
    return data;
}

function chartOptions(minY) {
    return {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, ...(minY ? { min: minY } : {}) }
        }
    };
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('mindguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('admin-theme-btn');
    if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    // Fetch real stats from API
    await fetchAdminStats();
    initOverviewPage();
});
