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
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // ---- Demo Mode (no backend) ----
    demoSignup(data) {
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

        // Store in demo users list
        const users = JSON.parse(localStorage.getItem('mindguard_demo_users') || '[]');
        users.push({ ...user, password: data.password });
        localStorage.setItem('mindguard_demo_users', JSON.stringify(users));

        return { success: true, user };
    },

    demoLogin(email, password) {
        const users = JSON.parse(localStorage.getItem('mindguard_demo_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            // Auto-create demo user for convenience
            return this.demoSignup({ name: email.split('@')[0], email, password, role: 'student' });
        }

        const demoToken = 'demo_token_' + btoa(email);
        localStorage.setItem(this.TOKEN_KEY, demoToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        return { success: true, user };
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
        if (user) {
            Object.assign(user, updates);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
        return user;
    }
};
