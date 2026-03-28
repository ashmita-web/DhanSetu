#!/bin/bash
# DhanSetu Platform Startup Script

echo "╔══════════════════════════════════════════╗"
echo "║      🏦 Starting DhanSetu Platform       ║"
echo "╚══════════════════════════════════════════╝"

# Check for API key
if grep -q "your_anthropic_api_key_here" backend/.env 2>/dev/null; then
  echo ""
  echo "⚠️  SETUP REQUIRED: Add your Anthropic API key to backend/.env"
  echo "   Open backend/.env and replace 'your_anthropic_api_key_here' with your key"
  echo "   Get a key at: https://console.anthropic.com"
  echo ""
fi

echo "Starting Backend (port 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 2

echo "Starting Frontend (port 5173)..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ DhanSetu is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
