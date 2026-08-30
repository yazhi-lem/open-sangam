#!/bin/bash

# --- Configuration ---
BACKEND_DIR="agents/avai"
FRONTEND_DIR="frontend"
PYTHON_VENV_PATH="${BACKEND_DIR}/venv"
BACKEND_PORT=8080
FRONTEND_PORT=5173

echo "Starting Open Sangam services..."
echo "---------------------------------"

# --- Start Backend Service ---
echo "Starting backend (FastAPI Uvicorn) from ${BACKEND_DIR}..."
(
  cd "${BACKEND_DIR}" || exit
  if [ -d "${PYTHON_VENV_PATH}" ]; then
    echo "Activating Python virtual environment..."
    source "${PYTHON_VENV_PATH}/bin/activate"
  else
    echo "Python virtual environment not found. Please run 'python -m venv venv && source venv/bin/activate && pip install -r requirements.txt' in '${BACKEND_DIR}' first."
    exit 1
  fi
  echo "Running uvicorn on port ${BACKEND_PORT}..."
  # Use --reload for development, remove for production
  uvicorn api.app:app --host 0.0.0.0 --port "${BACKEND_PORT}" --reload &
  BACKEND_PID=$!
  echo "Backend PID: ${BACKEND_PID}"
) &
BACKEND_JOB_PID=$!

# --- Start Frontend Service ---
echo "Starting frontend (Vite Dev Server) from ${FRONTEND_DIR}..."
(
  cd "${FRONTEND_DIR}" || exit
  echo "Running npm run dev on port ${FRONTEND_PORT}..."
  npm run dev -- --port "${FRONTEND_PORT}" &
  FRONTEND_PID=$!
  echo "Frontend PID: ${FRONTEND_PID}"
) &
FRONTEND_JOB_PID=$!

echo "---------------------------------"
echo "Both services are attempting to start."
echo "You can access the frontend at: http://localhost:${FRONTEND_PORT}"
echo "To stop both services, press Ctrl+C in this terminal."
echo "Waiting for services to finish..."

# Trap Ctrl+C to kill background processes
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; wait $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM EXIT

wait "$BACKEND_JOB_PID" "$FRONTEND_JOB_PID"

echo "Open Sangam services stopped."
