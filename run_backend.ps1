# Juice Bar POS - Backend Run Script
Write-Host "Starting Juice Bar POS Backend..." -ForegroundColor Green
Write-Host "Uvicorn will run on http://127.0.0.1:8000" -ForegroundColor Cyan

# 1. Set PYTHONPATH to root to ensure backend package is discoverable
$env:PYTHONPATH = ".;$env:PYTHONPATH"

# 2. Launch Uvicorn via python -m to ensure local site-packages are used
python -m uvicorn backend.main:app --reload
