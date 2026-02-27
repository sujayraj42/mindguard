/* ============================================
   MindGuard – F8: Admin Analytics Dashboard
   ============================================ */

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
    if (page === 'overview') initOverviewCharts();
    if (page === 'risk-analytics') initRiskAnalyticsChart();
    if (page === 'engagement') initFeatureChart();
    if (page === 'students') initStudentsTable();
    if (page === 'counselors') initCounselorsList();
}

function toggleAdminTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    document.getElementById('admin-theme-btn').textContent = next === 'dark' ? '🌙' : '☀️';
}

// ---- Overview Charts ----
let checkinChart = null, riskPieChart = null;

function initOverviewCharts() {
    // Check-in trend chart
    const ctx1 = document.getElementById('admin-checkin-chart');
    if (checkinChart) checkinChart.destroy();

    checkinChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: 'Check-ins',
                data: [620, 680, 750, 810, 790, 850, 870, 892],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139,92,246,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, min: 500 }
            }
        }
    });

    // Risk distribution pie
    const ctx2 = document.getElementById('admin-risk-pie');
    if (riskPieChart) riskPieChart.destroy();

    riskPieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [694, 506, 47],
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

// ---- Risk Analytics Chart ----
let riskTrendChart = null;

function initRiskAnalyticsChart() {
    const ctx = document.getElementById('admin-risk-trend-chart');
    if (!ctx) return;
    if (riskTrendChart) riskTrendChart.destroy();

    riskTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [
                { label: 'Low', data: [500, 520, 550, 580, 600, 640, 670, 694], borderColor: '#34d399', tension: 0.4, fill: false },
                { label: 'Medium', data: [350, 370, 400, 420, 450, 470, 490, 506], borderColor: '#fbbf24', tension: 0.4, fill: false },
                { label: 'High', data: [30, 32, 35, 38, 40, 42, 45, 47], borderColor: '#f87171', tension: 0.4, fill: false }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// ---- Feature Chart ----
let featureChart = null;

function initFeatureChart() {
    const ctx = document.getElementById('admin-feature-chart');
    if (!ctx) return;
    if (featureChart) featureChart.destroy();

    featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Check-in', 'Trends', 'Counselor', 'Circles', 'Journal', 'Breathing', 'Forum', 'Sleep', 'SOS', 'Gamification'],
            datasets: [{
                label: 'Monthly Uses',
                data: [892, 756, 312, 438, 289, 534, 312, 267, 45, 678],
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
        <td style="padding:10px;font-weight:500;">${s.alias}</td>
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
          <strong>${c.name}</strong>
          <div style="font-size:0.8rem;color:var(--text-muted);">${c.spec}</div>
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
    const data = 'Alias,Check-ins,Streak,Risk,Status\nBrave Phoenix,18,12,Low,Active\nCalm Eagle,15,8,Low,Active';
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindguard_students_report.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('mindguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('admin-theme-btn').textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    initOverviewCharts();
});
