/* ============================================
   MindGuard – F2: AI Risk Engine / Trends
   ============================================ */

let trendsChart = null;

function initTrends() {
    const checkins = Store.get('checkins', []);

    if (checkins.length === 0) {
        document.getElementById('risk-score-num').textContent = '--';
        document.getElementById('risk-score-label').textContent = 'No data yet';
        return;
    }

    // Update risk gauge
    const latest = checkins[checkins.length - 1];
    updateRiskGauge(latest.risk_score, latest.risk_level);

    // Update risk factors
    updateRiskFactors(latest);

    // Update chart
    updateTrendsChart(checkins);

    // Update history table
    updateHistoryTable(checkins);
}

function updateRiskGauge(score, level) {
    const circle = document.getElementById('risk-gauge-circle');
    const circumference = 2 * Math.PI * 75; // radius = 75
    const offset = circumference - (score / 100) * circumference;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;

    const colors = {
        'Low': 'var(--accent-green)',
        'Medium': 'var(--accent-yellow)',
        'High': 'var(--accent-red)'
    };
    circle.style.stroke = colors[level] || 'var(--accent-green)';

    document.getElementById('risk-score-num').textContent = Math.round(score);
    document.getElementById('risk-score-label').textContent = 'Risk Score';

    const badge = document.getElementById('risk-badge');
    badge.textContent = level;
    badge.className = `badge badge-${level.toLowerCase()}`;
}

function updateRiskFactors(data) {
    const factors = document.getElementById('risk-factors');
    const items = [
        { label: 'Sleep', value: `${data.sleep_hours}h`, icon: '😴', status: data.sleep_hours < 6 ? 'warning' : 'good' },
        { label: 'Stress', value: `${data.stress_level}/10`, icon: '😰', status: data.stress_level > 7 ? 'warning' : 'good' },
        { label: 'Social', value: `${data.socialization}/10`, icon: '🤝', status: data.socialization < 3 ? 'warning' : 'good' },
        { label: 'Study', value: `${data.study_hours}h`, icon: '📚', status: data.study_hours > 12 ? 'warning' : 'good' },
        { label: 'Mood', value: ['😢', '😕', '😐', '😊', '🤩'][data.mood - 1], icon: '💭', status: data.mood < 3 ? 'warning' : 'good' }
    ];

    factors.innerHTML = items.map(f => `
    <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);border:1px solid ${f.status === 'warning' ? 'rgba(248,113,113,0.3)' : 'var(--border-subtle)'};">
      <span style="font-size:1.5rem;">${f.icon}</span>
      <div>
        <div style="font-size:0.85rem;color:var(--text-muted);">${f.label}</div>
        <div style="font-weight:600;">${f.value}</div>
      </div>
      <span style="margin-left:auto;">${f.status === 'warning' ? '⚠️' : '✅'}</span>
    </div>
  `).join('');
}

function updateTrendsChart(checkins) {
    const ctx = document.getElementById('trends-chart');
    if (!ctx) return;

    const labels = checkins.map((c, i) => `Week ${i + 1}`);
    const sleepData = checkins.map(c => c.sleep_hours);
    const stressData = checkins.map(c => c.stress_level);
    const moodData = checkins.map(c => c.mood * 2); // Scale to 10
    const riskData = checkins.map(c => c.risk_score / 10); // Scale to 10

    if (trendsChart) trendsChart.destroy();

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Sleep (h)',
                    data: sleepData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Stress',
                    data: stressData,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Mood',
                    data: moodData,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Risk',
                    data: riskData,
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', usePointStyle: true, padding: 16 }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b' },
                    min: 0,
                    max: 12
                }
            }
        }
    });
}

function updateHistoryTable(checkins) {
    const tbody = document.getElementById('history-body');
    const moods = ['😢', '😕', '😐', '😊', '🤩'];
    const reversed = [...checkins].reverse();

    tbody.innerHTML = reversed.map(c => {
        const date = new Date(c.logged_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const badgeClass = c.risk_level === 'High' ? 'badge-high' : c.risk_level === 'Medium' ? 'badge-medium' : 'badge-low';
        return `
      <tr style="border-bottom:1px solid var(--border-subtle);">
        <td style="padding:10px;">${date}</td>
        <td style="padding:10px;text-align:center;">${c.sleep_hours}h</td>
        <td style="padding:10px;text-align:center;">${c.stress_level}/10</td>
        <td style="padding:10px;text-align:center;">${c.socialization}/10</td>
        <td style="padding:10px;text-align:center;">${c.study_hours}h</td>
        <td style="padding:10px;text-align:center;">${moods[c.mood - 1] || '😐'}</td>
        <td style="padding:10px;text-align:center;"><span class="badge ${badgeClass}">${c.risk_level}</span></td>
      </tr>
    `;
    }).join('');
}
