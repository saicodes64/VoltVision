"""
User CRUD operations using PyMongo and bcrypt.
"""
import bcrypt
from datetime import datetime
from bson import ObjectId
from app.db.database import db
from app.core.auth import create_access_token

# Define the collection
users_collection = db["users"] if db is not None else None


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_user(email: str, password: str) -> dict:
    """Create a new user, return user_id + signed JWT token."""
    if users_collection is None:
        return {"error": "Database not connected — check your MONGODB_URI in .env"}

    if users_collection.find_one({"email": email}):
        return {"error": "An account with this email already exists"}

    user_doc = {
        "email": email,
        "hashed_password": get_password_hash(password),
        "created_at": datetime.utcnow(),
    }
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    return {"user_id": user_id, "email": email, "token": token}


def authenticate_user(email: str, password: str) -> dict:
    """Authenticate user; returns user_id + signed JWT token on success."""
    if users_collection is None:
        return {"error": "Database not connected — check your MONGODB_URI in .env"}

    user = users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        return {"error": "Invalid email or password"}

    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    return {"user_id": user_id, "email": email, "token": token}


def get_user_by_id(user_id: str) -> dict:
    """Retrieve user by ID. Returns dict with user_id and email, or None."""
    if users_collection is None:
        return None

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return {"user_id": str(user["_id"]), "email": user["email"]}
        return None
    except Exception:
        return None
