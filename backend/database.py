import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# MongoDB Connection String
# ONLY from environment variables (no hardcoded fallback here)
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "juice_shop_pos")

if not MONGODB_URL:
    raise ValueError("ERROR: MONGODB_URL environment variable is NOT set. Please set it in your .env file.")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

async def get_db():
    """Dependency that returns the MongoDB database instance."""
    return db

def run_migrations():
    """
    MongoDB is schema-less, but we can use this for initial 
    index creation or data seeding if needed.
    """
    print(f"[Database] Connected to: {DATABASE_NAME}")

# Collections
users_collection = db["users"]
products_collection = db["products"]
orders_collection = db["orders"]
