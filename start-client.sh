#!/bin/bash

# Vibesy Client Startup Script
echo "🚀 Starting Vibesy Client..."

# Navigate to client directory  
cd client

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start the development server
echo "🔥 Starting Expo development server..."
npm start
