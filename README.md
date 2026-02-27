# MindGuard

🧠 Student Early-Risk Prediction Portal — Capstone Project

## Features
- 📋 Weekly Wellness Check-in
- 🤖 AI Risk Engine (ML-based risk prediction)
- 🔒 Anonymous Counselor Matching
- 👥 Peer Support Circles
- 📓 Mood Journal with Sentiment Analysis
- 🏆 Gamification (XP, Badges, Leaderboard)
- 🆘 Emergency SOS Resources
- 📊 Admin Analytics Dashboard
- 🧘 Guided Breathing & Meditation
- 😴 Sleep Pattern Analyzer
- 🔔 Smart Notifications
- 💬 Anonymous Forum
- 👤 User Profile & Settings

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB Atlas
- **ML:** scikit-learn (Random Forest, 79.75% accuracy)

## Run Locally

```bash
# Frontend
npx http-server frontend -p 5500 -c-1

# Backend
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --port 8000 --reload

# Train ML Model
python -m backend.ml.train_model
```

## Environment Variables
Create `backend/.env`:
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

## Deploy
- **Frontend:** Vercel (static)
- **Backend:** Render (Python)
