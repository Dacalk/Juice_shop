# 🥤 Juice Bar POS System

A modern Point of Sale (POS) system for juice shops, built with **FastAPI** (Python) and **React** (Vite).

## 🚀 Quick Start (Docker)
The easiest way to run the entire project (Frontend + Backend + DB) is using Docker Compose:

```powershell
docker-compose up --build
```
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/health

---

## 🛠️ Local Development (Manual)

### 1. Backend Setup
Recommended Python version: 3.11+
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

### 2. Frontend Setup
Recommended Node version: 18+
```powershell
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure
- `backend/`: FastAPI application, SQLite database (`pos.db`), and product uploads.
- `frontend/`: React application using Tailwind CSS and Zustand.
- `docker-compose.yml`: Orchestration for the entire stack.

## 📝 Features
- **Gram-based Pricing**: Automatic price calculation based on weight (e.g., Murukku 100g, 250g).
- **Admin Dashboard**: Manage products, staff, and view sales reports.
- **Persistent Storage**: Database and uploads are persisted even when containers are restarted.
- **Environment Ready**: Supports `ALLOWED_ORIGINS` and `DATABASE_PATH` configurations.
