#!/bin/bash
echo "Starting SoilFusion Services..."

# Start Backend
cd Backend
npm run start &
BACKEND_PID=$!

# Start Frontend
cd ../Frontend
npm run dev -- --open &
FRONTEND_PID=$!

echo "SoilFusion is running."
echo "Backend Port: http://localhost:5001"
echo "Frontend Port: http://localhost:5173"
echo "Press CTRL+C to stop."

# Wait for signals
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT
wait
