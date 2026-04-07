import sys
import os

# Add the project root to the path so the 'backend' package can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app from backend/main.py
try:
    from backend.main import app
except ImportError:
    # Fallback for different environments
    from main import app

# This is the entry point for Vercel
# The app object will be exported and served as a serverless function
# Combined with the APIRouter prefix in main.py, this handles all /api routes correctly.
