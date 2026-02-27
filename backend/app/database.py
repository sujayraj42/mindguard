"""
MindGuard Backend – Database Connection (Motor + MongoDB Atlas)
"""
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env from backend/ directory (parent of app/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
print(f"📡 MongoDB URI: {MONGO_URI[:30]}...")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        # Test connection
        await client.admin.command("ping")
        db = client["mindguard"]
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.checkins.create_index("user_id")
        await db.checkins.create_index("logged_at")
        await db.journal.create_index("user_id")
        await db.forum_posts.create_index("created_at")
        print("✅ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        print("   Server will start but database features won't work.")
        print("   → Whitelist your IP at https://cloud.mongodb.com (Network Access → Add IP → 0.0.0.0/0)")
        db = None


async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_db():
    return db
