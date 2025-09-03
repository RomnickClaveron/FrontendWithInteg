#!/bin/bash

# PillNow Backend Startup Script

echo "🚀 Starting PillNow Backend API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before starting the server."
    echo "   Required variables: MONGODB_URI, JWT_SECRET"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting server..."
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production mode"
    npm start
else
    echo "🔧 Development mode"
    npm run dev
fi




