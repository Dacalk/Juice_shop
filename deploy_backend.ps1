# Juice Bar POS - Backend Deployment Script
Write-Host "--- Deploying Juice Bar Backend to Fly.io ---" -ForegroundColor Yellow

# Ensure we are in the backend directory
$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

# Deploy to Fly.io
fly deploy

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
Write-Host "Your backend is live at: https://juice-bar-backend.fly.dev" -ForegroundColor Cyan
Write-Host "Check health: https://juice-bar-backend.fly.dev/health" -ForegroundColor Green
