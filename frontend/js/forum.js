/* ============================================
   MindGuard – F12: Anonymous Forum
   ============================================ */

let selectedTags = [];

const DEMO_POSTS = [
  {
    id: 'p1',
    author: 'Brave Eagle',
    title: 'How do you deal with exam anxiety?',
    content: 'I have finals coming up and I can barely sleep. Every time I think about exams, my heart starts racing. Has anyone found effective strategies?',
    tags: ['anxiety', 'academic'],
    upvotes: 12,
    replies: [
      { author: 'Calm Dolphin', text: 'I use the 4-7-8 breathing technique right before exams. It really helps calm my nerves! Check the breathing section here on MindGuard.', time: '2h ago' },
      { author: 'Wise Owl', text: 'Breaking study sessions into 25-min chunks (Pomodoro) made a huge difference for me. Less overwhelming.', time: '1h ago' }
    ],
    time: '5h ago'
  },
  {
    id: 'p2',
    author: 'Kind Panda',
    title: 'Feeling disconnected from friends after transferring',
    content: 'I transferred universities this semester and I feel so alone. Everyone already has their groups and I don\'t know how to break in. Any advice?',
    tags: ['social', 'stress'],
    upvotes: 8,
    replies: [
      { author: 'Swift Fox', text: 'I felt exactly the same way! Joining clubs was a game-changer for me. Even just one activity where you see the same people weekly helps.', time: '3h ago' }
    ],
    time: '1d ago'
  },
  {
    id: 'p3',
    author: 'Gentle Bear',
    title: 'My thesis is destroying my mental health',
    content: 'I\'m in my final year and the thesis pressure is unreal. My advisor keeps adding more requirements. I haven\'t slept well in weeks. Anyone else going through this?',
    tags: ['academic', 'stress', 'sleep'],
    upvotes: 15,
    replies: [
      { author: 'Bold Tiger', text: 'Yes, same boat here. What helped me was setting boundaries with my advisor about scope. You don\'t have to say yes to everything.', time: '6h ago' },
      { author: 'Calm Eagle', text: 'Please make sure you\'re getting enough sleep. Your thesis won\'t improve if you\'re running on empty. Take care of yourself first. ❤️', time: '4h ago' },
      { author: 'Wise Dolphin', text: 'I started using the check-in feature here and it really opened my eyes to how bad my patterns were. Seeing the data helped me make changes.', time: '2h ago' }
    ],
    time: '2d ago'
  }
];

async function initForum() {
  // Try loading from API first
  try {
    const res = await Api.get('/forum');
    if (res.success && res.data && res.data.posts && res.data.posts.length > 0) {
      // Merge API posts with local ones
      const apiPosts = res.data.posts.map(p => ({ ...p, time: new Date(p.created_at).toLocaleDateString() }));
      Store.set('forum_posts', apiPosts);
    }
  } catch (e) { /* Demo mode */ }
  renderForumPosts();
}

function renderForumPosts() {
  const container = document.getElementById('forum-posts');
  const storedPosts = Store.get('forum_posts', []);
  const allPosts = [...[...storedPosts].reverse(), ...DEMO_POSTS];

  container.innerHTML = allPosts.map(post => {
    const replyCount = (post.replies || []).length;
    const safeAuthor = escapeHtml(post.author);
    const safeTitle = escapeHtml(post.title);
    const safeContent = escapeHtml(post.content);
    return `
      <div class="forum-post glass-card-static" id="post-${post.id}" onclick="togglePostReplies('${post.id}')">
        <div class="forum-post-header">
          <div class="forum-post-avatar">${safeAuthor[0]}</div>
          <div>
            <strong style="font-size:0.9rem;">${safeAuthor}</strong>
            <div class="forum-post-meta">${escapeHtml(post.time)}</div>
          </div>
        </div>
        <h3>${safeTitle}</h3>
        <p>${safeContent}</p>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          ${(post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="forum-post-footer">
          <button class="forum-action" onclick="event.stopPropagation();upvotePost('${post.id}')">
            👍 <span id="upvotes-${post.id}">${post.upvotes || 0}</span>
          </button>
          <button class="forum-action" onclick="event.stopPropagation();togglePostReplies('${post.id}')">
            💬 ${replyCount} replies
          </button>
          <button class="forum-action" onclick="event.stopPropagation();">
            🔗 Share
          </button>
        </div>
        <div id="replies-${post.id}" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle);">
          ${(post.replies || []).map(r => `
            <div style="display:flex;gap:10px;margin-bottom:12px;">
              <div class="forum-post-avatar" style="width:28px;height:28px;font-size:0.65rem;">${escapeHtml(r.author)[0]}</div>
              <div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <strong style="font-size:0.8rem;">${escapeHtml(r.author)}</strong>
                  <span style="font-size:0.7rem;color:var(--text-muted);">${escapeHtml(r.time)}</span>
                </div>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${escapeHtml(r.text)}</p>
              </div>
            </div>
          `).join('')}
          <div style="display:flex;gap:8px;margin-top:12px;">
            <input type="text" class="form-input" style="flex:1;font-size:0.85rem;" placeholder="Write a reply..." id="reply-input-${post.id}" onclick="event.stopPropagation()">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();submitReply('${post.id}')">Reply</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function togglePostReplies(postId) {
  const replies = document.getElementById('replies-' + postId);
  if (replies) {
    replies.style.display = replies.style.display === 'none' ? 'block' : 'none';
  }
}

function upvotePost(postId) {
  const el = document.getElementById('upvotes-' + postId);
  if (el) {
    const current = parseInt(el.textContent);
    el.textContent = current + 1;
    // Send to API
    Api.post(`/forum/${postId}/upvote`).catch(() => { });
    showToast('Upvoted! 👍', 'success');
  }
}

function submitReply(postId) {
  const input = document.getElementById('reply-input-' + postId);
  const text = input?.value.trim();
  if (!text) return;

  const user = Auth.getUser();
  const replies = document.getElementById('replies-' + postId);

  const replyHtml = `
    <div style="display:flex;gap:10px;margin-bottom:12px;animation:fadeInUp 0.3s ease;">
      <div class="forum-post-avatar" style="width:28px;height:28px;font-size:0.65rem;">${(user?.anonymous_alias || 'You')[0]}</div>
      <div>
        <div style="display:flex;gap:8px;align-items:center;">
          <strong style="font-size:0.8rem;">${user?.anonymous_alias || 'You'}</strong>
          <span style="font-size:0.7rem;color:var(--text-muted);">Just now</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${text}</p>
      </div>
    </div>
  `;

  // Insert before the input area
  const inputArea = replies.querySelector('div:last-child');
  inputArea.insertAdjacentHTML('beforebegin', replyHtml);
  input.value = '';

  // Add XP
  if (user) {
    user.xp = (user.xp || 0) + 5;
    Auth.updateUser(user);
  }

  // Send reply to API
  Api.post(`/forum/${postId}/reply`, { text }).catch(() => { });

  showToast('Reply posted! +5 XP', 'success');
}

function showNewPostForm() {
  document.getElementById('new-post-form').style.display = 'block';
}

function hideNewPostForm() {
  document.getElementById('new-post-form').style.display = 'none';
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  selectedTags = [];
  document.querySelectorAll('#post-tags .tag').forEach(t => {
    t.style.background = '';
    t.style.color = '';
  });
}

function toggleTag(el, tag) {
  if (selectedTags.includes(tag)) {
    selectedTags = selectedTags.filter(t => t !== tag);
    el.style.background = '';
    el.style.color = '';
  } else {
    selectedTags.push(tag);
    el.style.background = 'var(--primary)';
    el.style.color = 'white';
  }
}

function submitForumPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();

  if (!title || !content) {
    showToast('Please fill in both title and content', 'error');
    return;
  }

  const user = Auth.getUser();
  const post = {
    id: 'p_' + Date.now(),
    author: user?.anonymous_alias || 'Anonymous',
    title,
    content,
    tags: [...selectedTags],
    upvotes: 0,
    replies: [],
    time: 'Just now'
  };

  Store.push('forum_posts', post);

  // Send to API
  Api.post('/forum', { title, content, tags: [...selectedTags] }).catch(() => { });

  // Add XP
  if (user) {
    user.xp = (user.xp || 0) + 15;
    Auth.updateUser(user);
  }

  hideNewPostForm();
  showToast('Post published! +15 XP', 'success');
  renderForumPosts();
}
