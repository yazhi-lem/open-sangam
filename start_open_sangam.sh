#!/bin/bash

# --- Configuration ---
BACKEND_DIR="agents"
FRONTEND_DIR="frontend"
PYTHON_VENV_PATH="agents/avai/.venv"
BACKEND_PORT=8080
FRONTEND_PORT=5173

echo "Starting Open Sangam services..."
echo "---------------------------------"

# --- Start Backend Service ---
echo "Starting backend (FastAPI Uvicorn) from ${BACKEND_DIR}..."
(
  ACTIVATE_SCRIPT=""
  for venv_candidate in "${PYTHON_VENV_PATH}" "agents/avai/venv"; do
    if [ -f "${venv_candidate}/bin/activate" ]; then
      ACTIVATE_SCRIPT="${venv_candidate}/bin/activate"
      break
    elif [ -f "${venv_candidate}/Scripts/activate" ]; then
      ACTIVATE_SCRIPT="${venv_candidate}/Scripts/activate"
      break
    fi
  done

  if [ -n "${ACTIVATE_SCRIPT}" ]; then
    echo "Activating Python virtual environment (${ACTIVATE_SCRIPT})..."
    source "${ACTIVATE_SCRIPT}"
  else
    echo "Python virtual environment not found in ${PYTHON_VENV_PATH} or agents/avai/venv. Please setup virtual environment first."
    exit 1
  fi
  cd "${BACKEND_DIR}" || exit
  echo "Running uvicorn on port ${BACKEND_PORT}..."
  # Use --reload for development, remove for production
  python -m uvicorn avai.api.app:app --host 127.0.0.1 --port "${BACKEND_PORT}" --reload &
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
