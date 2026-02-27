/* ============================================
   MindGuard – F4: Peer Support Circles
   ============================================ */

const DEMO_CIRCLES = [
    { id: 'thesis', name: 'Thesis Stress Group', tag: 'thesis', description: 'For students struggling with thesis/dissertation pressure', members: 24, icon: '📝' },
    { id: 'exam', name: 'Exam Anxiety Support', tag: 'exams', description: 'Share strategies and support during exam season', members: 38, icon: '📖' },
    { id: 'social', name: 'Social Anxiety Circle', tag: 'social', description: 'A safe space for those dealing with social anxiety', members: 19, icon: '🤝' },
    { id: 'sleep', name: 'Night Owl Recovery', tag: 'sleep', description: 'Helping each other build better sleep habits', members: 15, icon: '🌙' },
    { id: 'homesick', name: 'Homesick & Away', tag: 'homesick', description: 'For students missing home and adjusting to new environments', members: 22, icon: '🏠' },
    { id: 'burnout', name: 'Burnout Survivors', tag: 'burnout', description: 'Recovering from and preventing academic burnout', members: 31, icon: '🔥' }
];

let currentCircle = null;

function initCircles() {
    const list = document.getElementById('circles-list');
    const joinedCircles = Store.get('joined_circles', []);

    list.innerHTML = DEMO_CIRCLES.map(c => {
        const isJoined = joinedCircles.includes(c.id);
        return `
      <div class="glass-card" style="padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:2rem;">${c.icon}</span>
          <div>
            <h3 style="font-size:1rem;">${c.name}</h3>
            <span class="tag">${c.tag}</span>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">${c.description}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:var(--text-muted);font-size:0.8rem;">👥 ${c.members} members</span>
          ${isJoined
                ? `<button class="btn btn-primary btn-sm" onclick="openCircleChat('${c.id}')">💬 Open Chat</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="joinCircle('${c.id}')">➕ Join</button>`
            }
        </div>
      </div>
    `;
    }).join('');
}

function joinCircle(id) {
    const joined = Store.get('joined_circles', []);
    if (!joined.includes(id)) {
        joined.push(id);
        Store.set('joined_circles', joined);
    }

    // Add XP
    const user = Auth.getUser();
    if (user) {
        user.xp = (user.xp || 0) + 10;
        Auth.updateUser(user);
    }

    showToast('Joined circle! +10 XP', 'success');
    initCircles();
}

function openCircleChat(id) {
    const circle = DEMO_CIRCLES.find(c => c.id === id);
    if (!circle) return;

    currentCircle = circle;

    document.getElementById('circles-view').style.display = 'none';
    document.getElementById('circle-chat-view').style.display = 'block';
    document.getElementById('circle-chat-name').textContent = circle.name;
    document.getElementById('circle-member-count').textContent = `👥 ${circle.members} members`;

    const chatKey = `circle_chat_${id}`;
    let messages = Store.get(chatKey, []);

    if (messages.length === 0) {
        // Seed with demo messages
        const aliases = ['Brave Penguin', 'Calm Owl', 'Gentle Fox', 'Swift Eagle', 'Wise Bear'];
        const demoMsgs = [
            { sender: aliases[0], text: `Hey everyone! Glad to find this group. ${circle.name} is exactly what I needed.`, time: new Date(Date.now() - 3600000).toISOString() },
            { sender: aliases[1], text: "Same here! It's comforting knowing others understand what we're going through.", time: new Date(Date.now() - 3000000).toISOString() },
            { sender: aliases[2], text: "I've been dealing with this for weeks. Any tips that helped you all?", time: new Date(Date.now() - 2400000).toISOString() },
            { sender: aliases[3], text: "Honestly, just talking about it here has been really helpful. No judgment, just support. 💪", time: new Date(Date.now() - 1800000).toISOString() }
        ];
        messages = demoMsgs;
        Store.set(chatKey, messages);
    }

    renderCircleMessages(messages);
}

function leaveCircleChat() {
    currentCircle = null;
    document.getElementById('circles-view').style.display = 'block';
    document.getElementById('circle-chat-view').style.display = 'none';
}

function renderCircleMessages(messages) {
    const container = document.getElementById('circle-messages');
    const user = Auth.getUser();
    const myAlias = user?.anonymous_alias || 'You';

    container.innerHTML = messages.map(m => {
        const isSent = m.sender === myAlias || m.sender === 'You';
        return `
      <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
        ${!isSent ? `<div class="chat-sender">${m.sender}</div>` : ''}
        ${m.text}
      </div>
    `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function sendCircleMsg() {
    const input = document.getElementById('circle-msg-input');
    const text = input.value.trim();
    if (!text || !currentCircle) return;

    const chatKey = `circle_chat_${currentCircle.id}`;
    const messages = Store.get(chatKey, []);
    const user = Auth.getUser();

    messages.push({
        sender: user?.anonymous_alias || 'You',
        text,
        time: new Date().toISOString()
    });

    Store.set(chatKey, messages);
    input.value = '';
    renderCircleMessages(messages);

    // Simulate peer response
    setTimeout(() => {
        const peers = ['Brave Penguin', 'Calm Owl', 'Gentle Fox', 'Swift Eagle'];
        const responses = [
            "That's a really great point! Thanks for sharing. ❤️",
            "I totally relate to this. You're not alone!",
            "Has anyone tried meditation for this? It helped me a lot.",
            "Thanks for being so open. This group is amazing. 🙏",
            "I feel the same way. Let's keep supporting each other!"
        ];
        messages.push({
            sender: peers[Math.floor(Math.random() * peers.length)],
            text: responses[Math.floor(Math.random() * responses.length)],
            time: new Date().toISOString()
        });
        Store.set(chatKey, messages);
        renderCircleMessages(messages);
    }, 2000);
}
