#!/bin/bash

# Vibesy Backend Startup Script
echo "🚀 Starting Vibesy Backend..."

# Navigate to backend directory
cd backend

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Start the FastAPI server
echo "🔥 Starting FastAPI server on http://localhost:8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
