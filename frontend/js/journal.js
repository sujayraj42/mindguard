/* ============================================
   MindGuard – F5: Mood Journal & Sentiment
   ============================================ */

const POSITIVE_WORDS = ['happy', 'joy', 'love', 'great', 'amazing', 'wonderful', 'good', 'excellent', 'fantastic', 'beautiful', 'grateful', 'blessed', 'excited', 'proud', 'peaceful', 'calm', 'hopeful', 'inspired', 'confident', 'cheerful', 'relaxed', 'comfortable', 'satisfied', 'thrilled'];
const NEGATIVE_WORDS = ['sad', 'angry', 'depressed', 'anxious', 'worried', 'stressed', 'terrible', 'awful', 'horrible', 'lonely', 'tired', 'exhausted', 'overwhelmed', 'frustrated', 'scared', 'hopeless', 'miserable', 'helpless', 'worthless', 'painful', 'afraid', 'upset', 'nervous', 'struggling'];

function initJournal() {
    renderJournalEntries();
    renderHeatmap();
    renderWordCloud();

    // Live sentiment analysis
    const input = document.getElementById('journal-input');
    input.addEventListener('input', () => {
        const sentiment = analyzeSentiment(input.value);
        const el = document.getElementById('journal-sentiment');
        if (input.value.trim().length > 10) {
            const emoji = sentiment.label === 'Positive' ? '😊' : sentiment.label === 'Negative' ? '😔' : '😐';
            el.textContent = `${emoji} Sentiment: ${sentiment.label} (${(sentiment.score * 100).toFixed(0)}%)`;
            el.style.color = sentiment.label === 'Positive' ? 'var(--accent-green)' : sentiment.label === 'Negative' ? 'var(--accent-red)' : 'var(--text-muted)';
        } else {
            el.textContent = '';
        }
    });
}

function analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let posCount = 0, negCount = 0;

    words.forEach(word => {
        if (POSITIVE_WORDS.includes(word)) posCount++;
        if (NEGATIVE_WORDS.includes(word)) negCount++;
    });

    const total = posCount + negCount;
    if (total === 0) return { score: 0.5, label: 'Neutral' };

    const score = posCount / total;
    const label = score > 0.6 ? 'Positive' : score < 0.4 ? 'Negative' : 'Neutral';
    return { score, label };
}

function saveJournalEntry() {
    const input = document.getElementById('journal-input');
    const content = input.value.trim();
    if (!content) {
        showToast('Please write something first!', 'error');
        return;
    }

    const sentiment = analyzeSentiment(content);
    const entry = {
        id: Date.now(),
        content,
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
        created_at: new Date().toISOString()
    };

    Store.push('journal_entries', entry);

    // Send to API (async, non-blocking)
    Api.post('/journal', { content }).then(res => {
        if (res.success && res.data) {
            entry.sentiment_score = res.data.sentiment_score;
            entry.sentiment_label = res.data.sentiment_label;
        }
    }).catch(() => { });

    input.value = '';
    document.getElementById('journal-sentiment').textContent = '';

    // Add XP
    const user = Auth.getUser();
    if (user) {
        user.xp = (user.xp || 0) + 15;
        Auth.updateUser(user);

        // Check journal badge
        const entries = Store.get('journal_entries', []);
        if (entries.length >= 5 && !(user.badges || []).includes('journal_writer')) {
            user.badges = [...(user.badges || []), 'journal_writer'];
            Auth.updateUser(user);
            showToast('🏅 Badge Unlocked: Journal Writer!', 'success');
        }
    }

    showToast('Journal entry saved! +15 XP 📝', 'success');
    renderJournalEntries();
    renderHeatmap();
    renderWordCloud();
}

function renderJournalEntries() {
    const entries = Store.get('journal_entries', []);
    const container = document.getElementById('journal-entries');

    if (entries.length === 0) {
        container.innerHTML = `
      <div class="empty-state glass-card-static" style="padding:40px;">
        <div class="empty-state-icon">📓</div>
        <h3>No entries yet</h3>
        <p>Start writing to track your thoughts and emotions over time.</p>
      </div>
    `;
        return;
    }

    const reversed = [...entries].reverse().slice(0, 10);
    container.innerHTML = reversed.map(e => {
        const date = new Date(e.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const emoji = e.sentiment_label === 'Positive' ? '😊' : e.sentiment_label === 'Negative' ? '😔' : '😐';
        const badgeClass = e.sentiment_label === 'Positive' ? 'badge-low' : e.sentiment_label === 'Negative' ? 'badge-high' : 'badge-info';

        return `
      <div class="glass-card-static" style="padding:20px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:0.8rem;color:var(--text-muted);">${date}</span>
          <span class="badge ${badgeClass}">${emoji} ${e.sentiment_label}</span>
        </div>
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">${escapeHtml(e.content)}</p>
      </div>
    `;
    }).join('');
}

function renderHeatmap() {
    const container = document.getElementById('journal-heatmap');
    const entries = Store.get('journal_entries', []);

    // Generate 28 days of heatmap
    const cells = [];
    for (let i = 27; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayEntries = entries.filter(e => e.created_at.startsWith(dateStr));
        const level = dayEntries.length === 0 ? 0 : Math.min(4, dayEntries.length);
        cells.push(`<div class="heatmap-cell" data-level="${level}" title="${dateStr}: ${dayEntries.length} entries"></div>`);
    }

    container.innerHTML = cells.join('');
}

function renderWordCloud() {
    const entries = Store.get('journal_entries', []);
    const container = document.getElementById('word-cloud');

    if (entries.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Write journal entries to see your word cloud</span>';
        return;
    }

    const allText = entries.map(e => e.content).join(' ');
    const words = allText.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'too', 'very', 'just', 'than', 'then', 'that', 'this', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'his', 'her', 'its', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'am', 'im', 'dont', 'ive', 'really', 'feel', 'like', 'about', 'also', 'much', 'even']);

    const freq = {};
    words.forEach(w => {
        const clean = w.replace(/[^a-z]/g, '');
        if (clean.length > 2 && !stopWords.has(clean)) {
            freq[clean] = (freq[clean] || 0) + 1;
        }
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const maxFreq = sorted.length > 0 ? sorted[0][1] : 1;

    const colors = ['var(--primary-light)', 'var(--secondary)', 'var(--accent)', 'var(--accent-green)', 'var(--accent-yellow)'];

    container.innerHTML = sorted.map(([word, count]) => {
        const size = 0.7 + (count / maxFreq) * 1.3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `<span style="font-size:${size}rem;color:${color};font-weight:${count > 2 ? 600 : 400};padding:2px 4px;">${word}</span>`;
    }).join(' ');
}
