#!/usr/bin/env bash
# Fast Avai test gate. Run from anywhere.
#
#   ./agents/avai/scripts/test_avai.sh          # tests + deterministic eval
#   ./agents/avai/scripts/test_avai.sh --live   # also run real-model smoke
#
# The default path makes no model/API calls and is safe for CI.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."   # agents/

RUN_LIVE=0
for arg in "$@"; do
  case "$arg" in
    --live) RUN_LIVE=1 ;;
    -h|--help)
      echo "usage: $0 [--live]"
      exit 0
      ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

echo "==> Avai unit + integration tests"
python -m pytest avai/tests -q

echo "==> Fast deterministic evaluation"
python -m avai.evals.fast_eval

if [[ "$RUN_LIVE" == "1" ]]; then
  echo "==> Live model smoke test (requires a working provider key)"
  python -m avai.evals.qa_smoke
fi
