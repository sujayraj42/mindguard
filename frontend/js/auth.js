/* ============================================
   MindGuard – Auth Module
   JWT-based authentication with localStorage
   ============================================ */

const Auth = {
    TOKEN_KEY: 'mindguard_token',
    USER_KEY: 'mindguard_user',

    async signup(data) {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.detail || 'Signup failed' };
            }

            // Store token and user
            localStorage.setItem(this.TOKEN_KEY, result.access_token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(result.user));

            return { success: true, user: result.user };
        } catch (err) {
            // Fallback: demo mode (when backend is not running)
            return this.demoSignup(data);
        }
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.detail || 'Login failed' };
            }

            localStorage.setItem(this.TOKEN_KEY, result.access_token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(result.user));

            return { success: true, user: result.user };
        } catch (err) {
            // Fallback: demo mode
            return this.demoLogin(email, password);
        }
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'login.html';
    },

    getUser() {
        try {
            const userStr = localStorage.getItem(this.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            // corrupted data — clear and return null
            localStorage.removeItem(this.USER_KEY);
            return null;
        }
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;

        // Check if JWT is expired (for real tokens, not demo)
        if (!token.startsWith('demo_token_')) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    // Token expired — clean up
                    this.clearAuth();
                    return false;
                }
            } catch (e) {
                // Malformed token — clean up
                this.clearAuth();
                return false;
            }
        }

        return true;
    },

    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Refresh user data from server (sync local state)
    async refreshUser() {
        try {
            const token = this.getToken();
            if (!token || token.startsWith('demo_token_')) return;

            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                return user;
            } else if (res.status === 401) {
                // Token invalid — force logout
                this.logout();
            }
        } catch (e) {
            // Offline — keep cached user
        }
        return null;
    },

    // ---- Demo Mode (no backend) ----
    demoSignup(data) {
        // Validate required fields
        if (!data.name || !data.email || !data.password) {
            return { success: false, error: 'Name, email and password are required' };
        }

        if (data.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Check for duplicate emails in demo mode
        const users = JSON.parse(localStorage.getItem('mindguard_demo_users') || '[]');
        if (users.find(u => u.email === data.email)) {
            return { success: false, error: 'Email already registered' };
        }

        const user = {
            _id: 'demo_' + Date.now(),
            name: data.name,
            email: data.email,
            role: data.role || 'student',
            anonymous_alias: this.generateAlias(),
            xp: 0,
            streak: 0,
            level: 1,
            badges: [],
            created_at: new Date().toISOString()
        };

        const demoToken = 'demo_token_' + btoa(data.email);
        localStorage.setItem(this.TOKEN_KEY, demoToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        // Store in demo users list (hash the password so it's not in plaintext)
        users.push({ ...user, _pw_hash: btoa(data.password) });
        localStorage.setItem('mindguard_demo_users', JSON.stringify(users));

        return { success: true, user };
    },

    demoLogin(email, password) {
        const users = JSON.parse(localStorage.getItem('mindguard_demo_users') || '[]');
        const user = users.find(u => u.email === email && (
            u._pw_hash ? atob(u._pw_hash) === password : u.password === password
        ));

        if (!user) {
            return { success: false, error: 'Invalid email or password. No account found.' };
        }

        // Return user without password fields
        const { _pw_hash, password: _pw, ...safeUser } = user;

        const demoToken = 'demo_token_' + btoa(email);
        localStorage.setItem(this.TOKEN_KEY, demoToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));

        return { success: true, user: safeUser };
    },

    generateAlias() {
        const adjectives = ['Brave', 'Calm', 'Kind', 'Wise', 'Swift', 'Bold', 'Gentle', 'Bright', 'Noble', 'Warm'];
        const animals = ['Penguin', 'Owl', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Dolphin', 'Panda', 'Lion', 'Hawk'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        return `${adj} ${animal}`;
    },

    updateUser(updates) {
        const user = this.getUser();
        if (!user) return null;

        // If a full user object is passed (has _id), replace entirely
        // If partial updates, merge
        if (updates && updates._id) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(updates));
            return updates;
        }

        Object.assign(user, updates);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        // Also update in demo users list if applicable
        const demoUsers = JSON.parse(localStorage.getItem('mindguard_demo_users') || '[]');
        const idx = demoUsers.findIndex(u => u.email === user.email);
        if (idx !== -1) {
            Object.assign(demoUsers[idx], updates);
            localStorage.setItem('mindguard_demo_users', JSON.stringify(demoUsers));
        }

        return user;
    }
};
