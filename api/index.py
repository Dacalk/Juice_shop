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

# Create a wrapper FastAPI application
app = FastAPI()

# Mount the backend app under /api
# This ensures all requests to /api/... are correctly handled by the backend
app.mount("/api", backend_app)
