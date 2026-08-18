#!/usr/bin/env bash
# setup.sh — One-command setup for the Sangam Chat Flutter app.
# Run from the repo root: bash mobile/scripts/setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MOBILE_DIR="$REPO_ROOT/mobile"
FLUTTER_DIR="$HOME/flutter"

echo "╔══════════════════════════════════════════╗"
echo "║   Sangam Avai — Flutter App Setup        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Install Flutter if not present ──────────────────────────────────
if ! command -v flutter &>/dev/null; then
  echo "→ Flutter not found. Installing..."
  if [ -d "$FLUTTER_DIR" ]; then
    echo "  Found existing Flutter at $FLUTTER_DIR"
  else
    echo "  Cloning Flutter stable channel..."
    git clone https://github.com/flutter/flutter.git -b stable "$FLUTTER_DIR" --depth 1
  fi
  export PATH="$FLUTTER_DIR/bin:$PATH"
  echo "  Running flutter precache..."
  flutter precache
else
  echo "→ Flutter found: $(flutter --version | head -1)"
fi

# ── Step 2: Sync verse data ────────────────────────────────────────────────
echo ""
echo "→ Syncing verse data..."
bash "$REPO_ROOT/mobile/scripts/sync_verses.sh"

# ── Step 3: Generate missing Flutter project files ─────────────────────────
echo ""
echo "→ Generating Flutter project scaffolding..."
cd "$MOBILE_DIR"
flutter create . --org com.yazhi.sangam --project-name sangam_chat 2>/dev/null || true

# ── Step 4: Install dependencies ───────────────────────────────────────────
echo ""
echo "→ Installing Flutter dependencies..."
flutter pub get

# ── Step 5: Run analyze + tests ────────────────────────────────────────────
echo ""
echo "→ Running flutter analyze..."
flutter analyze --no-fatal-infos || true

echo ""
echo "→ Running flutter test..."
flutter test || true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Setup Complete!                        ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║   Run the app:                           ║"
echo "║     cd mobile && flutter run             ║"
echo "║                                          ║"
echo "║   Build Android APK:                     ║"
echo "║     flutter build apk --release          ║"
echo "║                                          ║"
echo "║   Build iOS (macOS only):                ║"
echo "║     flutter build ios --release          ║"
echo "║                                          ║"
echo "║   Start the Avai API:                    ║"
echo "║     cd agents && uvicorn avai.api.app:app ║"
echo "║       --reload --port 8080               ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
