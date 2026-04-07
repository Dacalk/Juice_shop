import sys
import os

# Add the parent directory (backend/) to the path so main.py can be found
# when Vercel invokes this under /api/index.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app from main.py
from main import app

# This is the entry point for Vercel
# The app object will be exported and served as a serverless function
