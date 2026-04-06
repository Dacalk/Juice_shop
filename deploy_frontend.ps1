# Juice Bar POS - Frontend Deployment Script
Write-Host "--- Deploying Juice Bar Frontend to Fly.io ---" -ForegroundColor Cyan

# Ensure we are in the frontend directory
$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

# Deploy to Fly.io with the Backend API URL pre-configured
fly deploy --build-arg VITE_API_URL=https://juice-bar-backend.fly.dev

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
Write-Host "Your frontend is live at: https://my-unique-juice-bar-frontend.fly.dev" -ForegroundColor Cyan
