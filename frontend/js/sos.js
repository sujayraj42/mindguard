/* ============================================
   MindGuard – F7: Emergency SOS & Resources
   ============================================ */

function triggerSOS() {
    // Show immediate crisis resources
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeInUp 0.3s ease;';
    modal.innerHTML = `
    <div class="glass-card-static" style="max-width:500px;width:100%;padding:40px;text-align:center;">
      <div style="font-size:3rem;margin-bottom:16px;">🆘</div>
      <h2 style="font-size:1.5rem;margin-bottom:8px;color:var(--accent-red);">You Are Not Alone</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;">Help is available 24/7. Please reach out.</p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <a href="tel:9152987821" class="btn btn-danger w-full btn-lg">📞 iCall — 9152987821</a>
        <a href="tel:18602662345" class="btn btn-danger w-full btn-lg">📞 Vandrevala — 1860-2662-345</a>
        <a href="tel:9820466726" class="btn btn-danger w-full btn-lg">📞 AASRA — 9820466726</a>
        <a href="tel:112" class="btn btn-danger w-full btn-lg">🚨 Emergency — 112</a>
      </div>

      <div style="border-top:1px solid var(--border-subtle);padding-top:16px;margin-top:16px;">
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">Quick relief while you wait:</p>
        <button class="btn btn-secondary btn-sm" onclick="this.closest('div[style*=fixed]').remove();navigateTo('breathing');">🫁 Start Breathing Exercise</button>
      </div>

      <button onclick="this.closest('div[style*=fixed]').remove();" class="btn btn-secondary" style="margin-top:16px;">Close</button>
    </div>
  `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Log the SOS event
    Store.push('sos_events', { time: new Date().toISOString() });
}

function startGrounding() {
    const steps = [
        { num: 5, sense: 'SEE', text: 'Name 5 things you can see around you.' },
        { num: 4, sense: 'TOUCH', text: 'Name 4 things you can physically touch.' },
        { num: 3, sense: 'HEAR', text: 'Name 3 things you can hear right now.' },
        { num: 2, sense: 'SMELL', text: 'Name 2 things you can smell.' },
        { num: 1, sense: 'TASTE', text: 'Name 1 thing you can taste.' }
    ];

    let currentStep = 0;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';

    function renderStep() {
        const step = steps[currentStep];
        modal.innerHTML = `
      <div class="glass-card-static" style="max-width:450px;width:100%;padding:40px;text-align:center;">
        <div style="font-size:1rem;color:var(--primary-light);margin-bottom:8px;">5-4-3-2-1 Grounding</div>
        <div style="font-size:4rem;margin-bottom:16px;">${step.num}</div>
        <h2 style="font-size:1.25rem;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;color:var(--secondary);">${step.sense}</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;">${step.text}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          ${currentStep > 0 ? `<button class="btn btn-secondary" id="grounding-prev">← Back</button>` : ''}
          ${currentStep < steps.length - 1
                ? `<button class="btn btn-primary" id="grounding-next">Next →</button>`
                : `<button class="btn btn-success" id="grounding-done">✅ Done</button>`
            }
        </div>
        <div style="display:flex;gap:6px;justify-content:center;margin-top:20px;">
          ${steps.map((_, i) => `<div style="width:8px;height:8px;border-radius:50%;background:${i <= currentStep ? 'var(--primary)' : 'var(--border-subtle)'};"></div>`).join('')}
        </div>
      </div>
    `;

        const prev = modal.querySelector('#grounding-prev');
        const next = modal.querySelector('#grounding-next');
        const done = modal.querySelector('#grounding-done');

        if (prev) prev.onclick = () => { currentStep--; renderStep(); };
        if (next) next.onclick = () => { currentStep++; renderStep(); };
        if (done) done.onclick = () => { modal.remove(); showToast('Grounding exercise complete. You did great! 🌿', 'success'); };
    }

    renderStep();
    document.body.appendChild(modal);
}
