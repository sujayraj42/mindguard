"""
MindGuard Backend – API Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from .database import get_db
from .auth import (
    hash_password, verify_password, create_token,
    get_current_user, generate_alias
)
from .models import (
    UserSignup, UserLogin, TokenResponse, UserResponse,
    CheckinCreate, CheckinResponse,
    JournalCreate, JournalResponse,
    ForumPostCreate, ForumReplyCreate, ForumPostResponse,
    PredictRequest
)

router = APIRouter()

# ============== AUTH ==============

@router.post("/api/auth/signup", response_model=TokenResponse)
async def signup(data: UserSignup):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")

    # Check existing
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
        "anonymous_alias": generate_alias(),
        "xp": 0,
        "level": 1,
        "streak": 0,
        "badges": [],
        "created_at": datetime.utcnow().isoformat()
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user_doc["name"],
            email=user_doc["email"],
            role=user_doc["role"],
            anonymous_alias=user_doc["anonymous_alias"],
            xp=0, level=1, streak=0, badges=[],
            created_at=user_doc["created_at"]
        )
    )


@router.post("/api/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")

    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_token(user_id)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=user.get("role", "student"),
            anonymous_alias=user.get("anonymous_alias", "Anonymous"),
            xp=user.get("xp", 0),
            level=user.get("level", 1),
            streak=user.get("streak", 0),
            badges=user.get("badges", []),
            created_at=user.get("created_at", "")
        )
    )


@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "student"),
        anonymous_alias=user.get("anonymous_alias", "Anonymous"),
        xp=user.get("xp", 0),
        level=user.get("level", 1),
        streak=user.get("streak", 0),
        badges=user.get("badges", []),
        created_at=user.get("created_at", "")
    )


# ============== CHECK-INS ==============

@router.post("/api/checkin", response_model=CheckinResponse)
async def create_checkin(data: CheckinCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")

    # Calculate risk score
    risk_score = calculate_risk(data)
    risk_level = "High" if risk_score > 70 else "Medium" if risk_score > 40 else "Low"

    checkin_doc = {
        "user_id": user_id,
        "sleep_hours": data.sleep_hours,
        "stress_level": data.stress_level,
        "socialization": data.socialization,
        "study_hours": data.study_hours,
        "mood": data.mood,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "logged_at": datetime.utcnow().isoformat()
    }

    result = await db.checkins.insert_one(checkin_doc)

    # Update user streak & XP
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"xp": 25, "streak": 1}}
    )

    return CheckinResponse(
        id=str(result.inserted_id),
        sleep_hours=data.sleep_hours,
        stress_level=data.stress_level,
        socialization=data.socialization,
        study_hours=data.study_hours,
        mood=data.mood,
        risk_score=risk_score,
        risk_level=risk_level,
        logged_at=checkin_doc["logged_at"]
    )


@router.get("/api/checkins")
async def get_checkins(user_id: str = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")
    cursor = db.checkins.find({"user_id": user_id}).sort("logged_at", -1).limit(52)
    checkins = []
    async for doc in cursor:
        checkins.append({
            "id": str(doc["_id"]),
            "sleep_hours": doc["sleep_hours"],
            "stress_level": doc["stress_level"],
            "socialization": doc["socialization"],
            "study_hours": doc["study_hours"],
            "mood": doc["mood"],
            "risk_score": doc["risk_score"],
            "risk_level": doc["risk_level"],
            "logged_at": doc["logged_at"]
        })
    return {"checkins": checkins}


# ============== JOURNAL ==============

POSITIVE_WORDS = {"happy", "joy", "love", "great", "amazing", "wonderful", "good", "excellent",
                  "fantastic", "beautiful", "grateful", "blessed", "excited", "proud", "peaceful",
                  "calm", "hopeful", "inspired", "confident", "cheerful", "relaxed", "satisfied"}
NEGATIVE_WORDS = {"sad", "angry", "depressed", "anxious", "worried", "stressed", "terrible", "awful",
                  "horrible", "lonely", "tired", "exhausted", "overwhelmed", "frustrated", "scared",
                  "hopeless", "miserable", "helpless", "worthless", "painful", "afraid", "upset"}


@router.post("/api/journal", response_model=JournalResponse)
async def create_journal(data: JournalCreate, user_id: str = Depends(get_current_user)):
    db = get_db()

    # Sentiment analysis
    words = data.content.lower().split()
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos + neg
    score = pos / total if total > 0 else 0.5
    label = "Positive" if score > 0.6 else "Negative" if score < 0.4 else "Neutral"

    entry_doc = {
        "user_id": user_id,
        "content": data.content,
        "sentiment_score": score,
        "sentiment_label": label,
        "created_at": datetime.utcnow().isoformat()
    }

    result = await db.journal.insert_one(entry_doc)

    # XP for journaling
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"xp": 15}}
    )

    return JournalResponse(
        id=str(result.inserted_id),
        content=data.content,
        sentiment_score=score,
        sentiment_label=label,
        created_at=entry_doc["created_at"]
    )


@router.get("/api/journal")
async def get_journal(user_id: str = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")
    cursor = db.journal.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    entries = []
    async for doc in cursor:
        entries.append({
            "id": str(doc["_id"]),
            "content": doc["content"],
            "sentiment_score": doc["sentiment_score"],
            "sentiment_label": doc["sentiment_label"],
            "created_at": doc["created_at"]
        })
    return {"entries": entries}


# ============== FORUM ==============

@router.post("/api/forum", response_model=ForumPostResponse)
async def create_forum_post(data: ForumPostCreate, user_id: str = Depends(get_current_user)):
    db = get_db()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    alias = user.get("anonymous_alias", "Anonymous") if user else "Anonymous"

    post_doc = {
        "user_id": user_id,
        "author": alias,
        "title": data.title,
        "content": data.content,
        "tags": data.tags,
        "upvotes": 0,
        "upvoted_by": [],
        "replies": [],
        "created_at": datetime.utcnow().isoformat()
    }

    result = await db.forum_posts.insert_one(post_doc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"xp": 15}})

    return ForumPostResponse(
        id=str(result.inserted_id),
        author=alias,
        title=data.title,
        content=data.content,
        tags=data.tags,
        upvotes=0,
        replies=[],
        created_at=post_doc["created_at"]
    )


@router.get("/api/forum")
async def get_forum_posts():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")
    cursor = db.forum_posts.find().sort("created_at", -1).limit(50)
    posts = []
    async for doc in cursor:
        posts.append({
            "id": str(doc["_id"]),
            "author": doc["author"],
            "title": doc["title"],
            "content": doc["content"],
            "tags": doc.get("tags", []),
            "upvotes": doc.get("upvotes", 0),
            "replies": doc.get("replies", []),
            "created_at": doc["created_at"]
        })
    return {"posts": posts}


@router.post("/api/forum/{post_id}/upvote")
async def upvote_post(post_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    post = await db.forum_posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if user_id in post.get("upvoted_by", []):
        raise HTTPException(status_code=400, detail="Already upvoted")

    await db.forum_posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"upvotes": 1}, "$push": {"upvoted_by": user_id}}
    )
    return {"message": "Upvoted", "upvotes": post.get("upvotes", 0) + 1}


@router.post("/api/forum/{post_id}/reply")
async def reply_to_post(post_id: str, data: ForumReplyCreate, user_id: str = Depends(get_current_user)):
    db = get_db()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    alias = user.get("anonymous_alias", "Anonymous") if user else "Anonymous"

    reply = {
        "author": alias,
        "text": data.text,
        "time": datetime.utcnow().isoformat()
    }

    await db.forum_posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"replies": reply}}
    )
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"xp": 5}})

    return {"message": "Reply posted", "reply": reply}


# ============== PREDICTION ==============

@router.post("/api/predict")
async def predict_risk(data: PredictRequest, user_id: str = Depends(get_current_user)):
    risk_score = calculate_risk(data)
    risk_level = "High" if risk_score > 70 else "Medium" if risk_score > 40 else "Low"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": {
            "sleep": "warning" if data.sleep_hours < 6 else "good",
            "stress": "warning" if data.stress_level > 7 else "good",
            "social": "warning" if data.socialization < 3 else "good",
            "study": "warning" if data.study_hours > 12 else "good",
            "mood": "warning" if data.mood < 3 else "good"
        }
    }


# ============== ADMIN ==============

@router.get("/api/admin/stats")
async def get_admin_stats(user_id: str = Depends(get_current_user)):
    db = get_db()

    # Verify admin/counselor role
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") not in ["admin", "counselor"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    total_users = await db.users.count_documents({})
    total_checkins = await db.checkins.count_documents({})
    total_journal = await db.journal.count_documents({})
    total_posts = await db.forum_posts.count_documents({})

    # Risk distribution
    high_risk = await db.checkins.count_documents({"risk_level": "High"})
    medium_risk = await db.checkins.count_documents({"risk_level": "Medium"})
    low_risk = await db.checkins.count_documents({"risk_level": "Low"})

    return {
        "total_users": total_users,
        "total_checkins": total_checkins,
        "total_journal": total_journal,
        "total_posts": total_posts,
        "risk_distribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk
        }
    }


# ============== HELPERS ==============

def calculate_risk(data) -> float:
    score = 0
    if data.sleep_hours < 5:
        score += 25
    elif data.sleep_hours < 6:
        score += 15
    elif data.sleep_hours < 7:
        score += 5

    if data.stress_level >= 8:
        score += 25
    elif data.stress_level >= 6:
        score += 15
    elif data.stress_level >= 4:
        score += 5

    if data.socialization <= 2:
        score += 20
    elif data.socialization <= 4:
        score += 10

    if data.study_hours > 12:
        score += 15
    elif data.study_hours < 1:
        score += 10

    if data.mood <= 1:
        score += 20
    elif data.mood <= 2:
        score += 10
    elif data.mood <= 3:
        score += 5

    return min(100, max(0, score))
