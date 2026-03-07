/* ============================================
   MindGuard – F9: Guided Breathing & Meditation
   ============================================ */

let breathingInterval = null;
let breathingTimeout = null;
let meditationInterval = null;
let breathingSessions = 0;

function startBreathing(type) {
    stopBreathing();

    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const instruction = document.getElementById('breathing-instruction');
    const stopBtn = document.getElementById('breathing-stop-btn');
    const startBtn = document.getElementById('breathing-start-btn');
    const boxBtn = document.getElementById('box-breathing-btn');

    stopBtn.style.display = 'inline-flex';
    startBtn.disabled = true;
    boxBtn.disabled = true;

    if (type === '478') {
        // 4-7-8 Breathing: Inhale 4s, Hold 7s, Exhale 8s
        const phases = [
            { label: 'Inhale', duration: 4000, class: 'inhale' },
            { label: 'Hold', duration: 7000, class: '' },
            { label: 'Exhale', duration: 8000, class: 'exhale' }
        ];
        runBreathingCycle(phases, circle, text, instruction);
    } else if (type === 'box') {
        // Box Breathing: 4s each (Inhale, Hold, Exhale, Hold)
        const phases = [
            { label: 'Inhale', duration: 4000, class: 'inhale' },
            { label: 'Hold', duration: 4000, class: '' },
            { label: 'Exhale', duration: 4000, class: 'exhale' },
            { label: 'Hold', duration: 4000, class: '' }
        ];
        runBreathingCycle(phases, circle, text, instruction);
    }
}

function runBreathingCycle(phases, circle, text, instruction) {
    let phaseIndex = 0;
    let cycleCount = 0;

    function nextPhase() {
        const phase = phases[phaseIndex];

        // Reset animation
        circle.className = 'breathing-circle';
        void circle.offsetWidth; // Force reflow

        text.textContent = phase.label;
        instruction.textContent = `${phase.label}... (${phase.duration / 1000}s)`;

        if (phase.class) {
            circle.classList.add(phase.class);
        }

        // Visual countdown
        let countdown = Math.floor(phase.duration / 1000);
        const countInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                text.textContent = `${phase.label} ${countdown}`;
            }
        }, 1000);

        breathingTimeout = setTimeout(() => {
            clearInterval(countInterval);
            phaseIndex++;
            if (phaseIndex >= phases.length) {
                phaseIndex = 0;
                cycleCount++;
                instruction.textContent = `Cycle ${cycleCount + 1} — Great job! Keep going...`;
            }
            nextPhase();
        }, phase.duration);
    }

    nextPhase();
}

function stopBreathing() {
    // Track whether a session was actually running
    const wasActive = breathingTimeout !== null;

    if (breathingTimeout) clearTimeout(breathingTimeout);
    if (breathingInterval) clearInterval(breathingInterval);
    breathingTimeout = null;
    breathingInterval = null;

    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const instruction = document.getElementById('breathing-instruction');
    const stopBtn = document.getElementById('breathing-stop-btn');
    const startBtn = document.getElementById('breathing-start-btn');
    const boxBtn = document.getElementById('box-breathing-btn');

    if (circle) {
        circle.className = 'breathing-circle';
        text.textContent = 'Start';
        instruction.textContent = 'Press a button to begin';
        stopBtn.style.display = 'none';
        startBtn.disabled = false;
        boxBtn.disabled = false;
    }

    // Only count a completed session if one was actually running
    if (wasActive) {
        breathingSessions++;
        Store.set('breathing_sessions', (Store.get('breathing_sessions', 0)) + 1);

        // Check badge
        const totalSessions = Store.get('breathing_sessions', 0);
        if (totalSessions >= 10) {
            const user = Auth.getUser();
            if (user && !(user.badges || []).includes('zen_master')) {
                user.badges = [...(user.badges || []), 'zen_master'];
                user.xp = (user.xp || 0) + 100;
                Auth.updateUser(user);
                showToast('🏅 Badge Unlocked: Zen Master!', 'success');
            }
        }
    }
}

function playAmbient(type) {
    const sounds = {
        rain: 'Rain sounds are playing... 🌧️',
        ocean: 'Ocean waves... 🌊',
        forest: 'Forest ambience... 🌿',
        fire: 'Crackling fire... 🔥'
    };
    showToast(sounds[type] || 'Playing ambient sound...', 'info');
}

function startMeditationTimer(minutes) {
    if (meditationInterval) clearInterval(meditationInterval);

    const display = document.getElementById('timer-display');
    const container = document.getElementById('meditation-timer');
    container.style.display = 'block';

    let totalSeconds = minutes * 60;

    function updateDisplay() {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateDisplay();
    showToast(`Meditation timer started: ${minutes} minutes`, 'info');

    meditationInterval = setInterval(() => {
        totalSeconds--;
        updateDisplay();
        if (totalSeconds <= 0) {
            clearInterval(meditationInterval);
            meditationInterval = null;
            showToast('🧘 Meditation complete! Well done! +20 XP', 'success');
            container.style.display = 'none';

            const user = Auth.getUser();
            if (user) {
                user.xp = (user.xp || 0) + 20;
                Auth.updateUser(user);
            }
        }
    }, 1000);
}

function stopMeditationTimer() {
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
    document.getElementById('meditation-timer').style.display = 'none';
    showToast('Timer stopped', 'info');
}
