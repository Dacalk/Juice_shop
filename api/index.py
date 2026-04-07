import sys
import os
from fastapi import FastAPI

# Add the project root to the path so the 'backend' package can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app from backend/main.py
try:
    from backend.main import app as backend_app
except ImportError:
    # Fallback for different environments
    from main import app as backend_app

# Create a wrapper app to handle the /api prefix
# This ensures that /api/auth/login is correctly routed to /auth/login
app = FastAPI()
app.mount("/api", backend_app)

# This is the entry point for Vercel
# The app object will be exported and served as a serverless function
