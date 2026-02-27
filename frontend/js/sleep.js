/* ============================================
   MindGuard – F10: Sleep Pattern Analyzer
   ============================================ */

let sleepChart = null;

function initSleep() {
    const checkins = Store.get('checkins', []);

    if (checkins.length === 0) {
        document.getElementById('avg-sleep').textContent = '--';
        document.getElementById('sleep-quality').textContent = '--';
        renderSleepTips([]);
        return;
    }

    const sleepData = checkins.map(c => c.sleep_hours);
    const avgSleep = (sleepData.reduce((a, b) => a + b, 0) / sleepData.length).toFixed(1);
    document.getElementById('avg-sleep').textContent = avgSleep + 'h';

    // Quality rating
    const quality = avgSleep >= 7 ? 'Excellent' : avgSleep >= 6 ? 'Good' : avgSleep >= 5 ? 'Fair' : 'Poor';
    const qualityEl = document.getElementById('sleep-quality');
    qualityEl.textContent = quality;
    qualityEl.style.color = quality === 'Excellent' ? 'var(--accent-green)' :
        quality === 'Good' ? 'var(--secondary)' :
            quality === 'Fair' ? 'var(--accent-yellow)' : 'var(--accent-red)';

    // Chart
    updateSleepChart(checkins);

    // Tips
    renderSleepTips(checkins);
}

function updateSleepChart(checkins) {
    const ctx = document.getElementById('sleep-chart');
    if (!ctx) return;

    const labels = checkins.map((_, i) => `Week ${i + 1}`);
    const sleepData = checkins.map(c => c.sleep_hours);

    if (sleepChart) sleepChart.destroy();

    sleepChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sleep Hours',
                data: sleepData,
                backgroundColor: sleepData.map(h =>
                    h >= 7 ? 'rgba(52, 211, 153, 0.6)' :
                        h >= 6 ? 'rgba(251, 191, 36, 0.6)' :
                            'rgba(248, 113, 113, 0.6)'
                ),
                borderColor: sleepData.map(h =>
                    h >= 7 ? '#34d399' :
                        h >= 6 ? '#fbbf24' :
                            '#f87171'
                ),
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                annotation: {}
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
                    max: 12,
                    title: { display: true, text: 'Hours', color: '#64748b' }
                }
            }
        }
    });

    // Draw recommended zone line (7 hours)
    // This is handled visually by the color coding
}

function renderSleepTips(checkins) {
    const container = document.getElementById('sleep-tips');

    if (checkins.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Submit check-ins to get personalized sleep tips.</p>';
        return;
    }

    const avgSleep = checkins.map(c => c.sleep_hours).reduce((a, b) => a + b, 0) / checkins.length;
    const avgStress = checkins.map(c => c.stress_level).reduce((a, b) => a + b, 0) / checkins.length;

    const tips = [];

    if (avgSleep < 6) {
        tips.push({ icon: '⏰', text: 'Try setting a consistent bedtime alarm. Aim for 7-8 hours of sleep.' });
        tips.push({ icon: '📱', text: 'Avoid screens 1 hour before bed. Blue light disrupts melatonin production.' });
    }
    if (avgSleep < 7) {
        tips.push({ icon: '🌙', text: 'Create a relaxing bedtime routine: reading, light stretching, or meditation.' });
    }
    if (avgStress > 6) {
        tips.push({ icon: '🧘', text: 'High stress affects sleep quality. Try the breathing exercises before bed.' });
    }

    tips.push({ icon: '☕', text: 'Avoid caffeine after 2 PM — it can stay in your system for 6+ hours.' });
    tips.push({ icon: '🌡️', text: 'Keep your bedroom cool (65-68°F / 18-20°C) for optimal sleep.' });
    tips.push({ icon: '🏃', text: 'Regular exercise improves sleep quality, but avoid intense workouts near bedtime.' });

    container.innerHTML = tips.map(t => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
      <span style="font-size:1.25rem;">${t.icon}</span>
      <p style="font-size:0.9rem;color:var(--text-secondary);">${t.text}</p>
    </div>
  `).join('');
}
