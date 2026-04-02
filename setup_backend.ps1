# Juice Bar POS - Backend Setup Script
Write-Host "--- Juice Bar POS Backend Setup ---" -ForegroundColor Cyan

# 1. Check for Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Install Dependencies with Retries
$packages = "fastapi uvicorn[standard] sqlalchemy pydantic python-multipart python-jose[cryptography] passlib[bcrypt]"
Write-Host "Installing dependencies..." -ForegroundColor Yellow

$maxRetries = 3
$retryCount = 0
$success = $false

while (-not $success -and $retryCount -lt $maxRetries) {
    try {
        pip install $packages --timeout 100
        if ($LASTEXITCODE -eq 0) {
            $success = $true
        } else {
            throw "Pip failed with exit code $LASTEXITCODE"
        }
    } catch {
        $retryCount++
        Write-Host "Retry $retryCount/$maxRetries: Connection issue. Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $success) {
    Write-Host "Failed to install dependencies after $maxRetries attempts." -ForegroundColor Red
    Write-Host "Please check your internet connection or try running: pip install $packages"
    exit 1
}

# 3. Initialize Database and Seed Data
Write-Host "Initializing database and seeding initial data..." -ForegroundColor Yellow
$env:PYTHONPATH = ".;$env:PYTHONPATH"
python -m backend.seed_db

Write-Host "--- Setup Complete! ---" -ForegroundColor Green
Write-Host "You can now run '.\run_backend.ps1' to start the server." -ForegroundColor Cyan
