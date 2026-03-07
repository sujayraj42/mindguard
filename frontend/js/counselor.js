/* ============================================
   MindGuard – F3: Anonymous Counselor Chat
   ============================================ */

const DEMO_COUNSELORS = [
  { id: 'c1', name: 'Dr. Serenity', specialization: 'Anxiety & Stress', icon: '🧠', available: true },
  { id: 'c2', name: 'Dr. Haven', specialization: 'Depression & Mood', icon: '💙', available: true },
  { id: 'c3', name: 'Dr. Compass', specialization: 'Academic Burnout', icon: '📚', available: false },
  { id: 'c4', name: 'Dr. Harmony', specialization: 'Relationships & Social', icon: '🤝', available: true },
  { id: 'c5', name: 'Dr. Anchor', specialization: 'Crisis Intervention', icon: '⚓', available: true }
];

let currentCounselor = null;
let identityRevealed = false;

function initCounselor() {
  const list = document.getElementById('counselor-list');
  list.innerHTML = DEMO_COUNSELORS.map(c => `
    <div class="glass-card" style="padding:14px;cursor:${c.available ? 'pointer' : 'default'};opacity:${c.available ? 1 : 0.4};"
         onclick="${c.available ? `selectCounselor('${c.id}')` : ''}" id="counselor-${c.id}">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:1.5rem;">${c.icon}</div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${c.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${c.specialization}</div>
        </div>
      </div>
      <span class="badge ${c.available ? 'badge-low' : 'badge-high'}" style="margin-top:8px;font-size:0.7rem;">
        ${c.available ? '🟢 Available' : '🔴 Busy'}
      </span>
    </div>
  `).join('');
}

function selectCounselor(id) {
  const counselor = DEMO_COUNSELORS.find(c => c.id === id);
  if (!counselor) return;

  currentCounselor = counselor;
  identityRevealed = false;

  document.getElementById('chat-counselor-name').textContent = counselor.name;
  document.getElementById('chat-counselor-spec').textContent = counselor.specialization;
  document.getElementById('reveal-btn').style.display = 'inline-flex';
  document.getElementById('counselor-input-area').style.display = 'flex';

  // Load chat history or show welcome
  const chatKey = `chat_${id}`;
  const messages = Store.get(chatKey, []);

  if (messages.length === 0) {
    const user = Auth.getUser();
    const alias = user?.anonymous_alias || 'Anonymous Student';
    messages.push({
      sender: 'counselor',
      text: `Hello ${alias}! 👋 I'm ${counselor.name}, specializing in ${counselor.specialization}. This space is completely safe and anonymous. How can I help you today?`,
      time: new Date().toISOString()
    });
    Store.set(chatKey, messages);
  }

  renderCounselorMessages(messages);

  // Highlight selected counselor
  document.querySelectorAll('[id^="counselor-c"]').forEach(el => {
    el.style.borderColor = '';
  });
  document.getElementById(`counselor-${id}`).style.borderColor = 'var(--primary)';
}

function renderCounselorMessages(messages) {
  const container = document.getElementById('counselor-messages');
  const user = Auth.getUser();

  container.innerHTML = messages.map(m => `
    <div class="chat-bubble ${m.sender === 'user' ? 'sent' : 'received'}">
      ${m.sender === 'counselor' ? `<div class="chat-sender">${escapeHtml(currentCounselor?.name || 'Counselor')}</div>` : ''}
      ${escapeHtml(m.text)}
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function sendCounselorMsg() {
  const input = document.getElementById('counselor-msg-input');
  const text = input.value.trim();
  if (!text || !currentCounselor) return;

  const chatKey = `chat_${currentCounselor.id}`;
  const messages = Store.get(chatKey, []);

  messages.push({ sender: 'user', text, time: new Date().toISOString() });
  Store.set(chatKey, messages);

  input.value = '';
  renderCounselorMessages(messages);

  // Simulate counselor response after delay
  setTimeout(() => {
    const responses = [
      "Thank you for sharing that. Can you tell me more about how that made you feel?",
      "I hear you. It's completely normal to feel that way. What strategies have you tried so far?",
      "That sounds challenging. Remember, reaching out like this takes courage. 💪",
      "Let's explore that together. How long have you been experiencing this?",
      "Your feelings are valid. It's important to acknowledge them. What would make you feel safer right now?",
      "I understand. Many students go through similar experiences. You're not alone in this.",
      "That's a really insightful observation about yourself. How do you think we could work on this together?"
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];

    messages.push({ sender: 'counselor', text: response, time: new Date().toISOString() });
    Store.set(chatKey, messages);
    renderCounselorMessages(messages);
  }, 1500);
}

function toggleReveal() {
  identityRevealed = !identityRevealed;
  const btn = document.getElementById('reveal-btn');

  if (identityRevealed) {
    const user = Auth.getUser();
    btn.innerHTML = '🙈 Hide Identity';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
    showToast(`Identity revealed to ${currentCounselor.name}`, 'info');
  } else {
    btn.innerHTML = '👁️ Reveal Identity';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    showToast('Identity hidden again', 'info');
  }
}
