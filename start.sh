#!/usr/bin/env bash

# Start Airport Management System (AMS) Backend and Frontend
echo "=========================================================="
echo " Starting AeroSync Airport Management System (AMS v1.0)"
echo " RGIT Mumbai - Department of Computer Engineering"
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Start Backend on port 5000
echo "Starting Backend API on http://localhost:5000..."
cd "$DIR/backend" && node server.js &
BACKEND_PID=$!

# Wait briefly for backend to listen
sleep 2

# Start Frontend on port 3000
echo "Starting Frontend on http://localhost:3000..."
cd "$DIR/frontend" && npm run dev -- --port 3000 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo "Both services running! Open http://localhost:3000 in your browser."
wait
