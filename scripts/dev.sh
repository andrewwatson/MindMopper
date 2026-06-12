#!/bin/bash
set -e
# Start the Go backend
go run . &
GO_PID=$!

# Start the Vite dev server
cd web && npm run dev &
VITE_PID=$!

# Cleanup on exit
trap "kill $GO_PID $VITE_PID 2>/dev/null; exit" INT TERM

echo "Backend running at http://localhost:8080"
echo "Frontend running at http://localhost:5173"
echo "Press Ctrl+C to stop both"

wait
