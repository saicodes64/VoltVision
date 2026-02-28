"""
MongoDB Connection Setup using standard PyMongo.
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voltvision")

# Initialize MongoDB client
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Ping the server to verify connection is working
    client.admin.command("ping")
    db = client[DB_NAME]
    print(f"✅ Connected to MongoDB database '{DB_NAME}'")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    print("   Make sure MONGODB_URI is set correctly in your .env file.")
    db = None
