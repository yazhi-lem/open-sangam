#!/usr/bin/env bash
# sync_verses.sh — Copy verse data and generate poems_registry.json
# Run from the repo root: bash mobile/scripts/sync_verses.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$REPO_ROOT/data/texts"
ASSETS_DIR="$REPO_ROOT/mobile/assets/data"
TEXTS_DIR="$ASSETS_DIR/texts"

mkdir -p "$TEXTS_DIR"

echo "Syncing verse data from $DATA_DIR → $TEXTS_DIR"

# Copy the full JSON for each poem (the React frontend's dynamic imports).
for poem_dir in "$DATA_DIR"/*/; do
  poem_id="$(basename "$poem_dir")"
  json_file="$poem_dir/${poem_id}.json"
  if [ -f "$json_file" ]; then
    cp "$json_file" "$TEXTS_DIR/${poem_id}.json"
    echo "  ✓ $poem_id"
  fi
done

echo ""
echo "Generating poems_registry.json"

# Generate the registry JSON from the poems.js source of truth.
# This uses Node.js to import the ES module and dump JSON.
node -e "
  import('file://$REPO_ROOT/frontend/src/data/poems.js')
    .then(mod => {
      const collections = Object.entries(mod.COLLECTIONS).map(([id, c]) => ({
        id, ta: c.ta, en: c.en, desc: c.desc,
      }));
      const poems = mod.POEMS.map(p => ({
        id: p.id,
        ta: p.ta,
        en: p.en,
        collection: p.collection,
        count: p.count,
        unit: p.unit,
        tinai: p.tinai || [],
        available: p.available,
      }));
      const out = { collections, poems };
      process.stdout.write(JSON.stringify(out, null, 2));
    })
    .catch(err => {
      console.error('Failed to generate registry:', err.message);
      process.exit(1);
    });
" > "$ASSETS_DIR/poems_registry.json"

echo "  ✓ poems_registry.json ($(wc -c < "$ASSETS_DIR/poems_registry.json") bytes)"
echo ""
echo "Done! Run 'cd mobile && flutter pub get' to update."
