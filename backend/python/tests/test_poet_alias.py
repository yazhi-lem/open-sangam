"""Guards poet-name canonicalisation.

The corpus was scraped from several sources, so the same poet appeared under
different spacing and with trailing punctuation. `normalizer/canonicalize_poets.py`
collapses those variants using the tamil.wiki poet list
(`data/library/tamilwiki-poets.json`) as the spelling authority, and writes
`data/library/poet-aliases.json`. Without a gate, one careless edit to a scraped
file resurrects a duplicate `Poet -` note and splits the graph node.

These tests are pure local checks: no network, no writes.
"""

import json
from collections import Counter, defaultdict

import pytest

from normalizer import validate_corpus as vc
from normalizer.poet_alias import ALIASES_PATH, canonical_poet, clean_poet, name_key


@pytest.fixture(scope="module")
def corpus_poets() -> Counter:
    counts: Counter = Counter()
    for path in sorted((vc.REPO_ROOT / "data" / "texts").glob("*/*.json")):
        if "raw" in path.parts:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            continue
        for record in data:
            poet = record.get("poet")
            if poet:
                counts[poet] += 1
    return counts


@pytest.fixture(scope="module")
def aliases() -> dict[str, str]:
    assert ALIASES_PATH.exists(), "run: python -m normalizer.canonicalize_poets --write"
    return json.loads(ALIASES_PATH.read_text(encoding="utf-8"))["aliases"]


def test_no_two_spellings_of_the_same_poet(corpus_poets):
    groups = defaultdict(list)
    for spelling in corpus_poets:
        groups[name_key(spelling)].append(spelling)
    duplicates = {key: found for key, found in groups.items() if len(found) > 1}
    assert not duplicates, f"duplicate poet spellings: {duplicates}"


def test_poet_strings_carry_no_scrape_artefacts(corpus_poets):
    for spelling in corpus_poets:
        assert spelling == clean_poet(spelling), f"{spelling!r} is not a clean name"


def test_alias_targets_are_not_themselves_aliased(aliases):
    for raw, canonical in aliases.items():
        assert raw != canonical
        assert canonical not in aliases, f"alias chain: {raw!r} → {canonical!r} → …"


def test_alias_targets_exist_in_the_corpus(corpus_poets, aliases):
    for canonical in set(aliases.values()):
        assert canonical in corpus_poets, f"alias target {canonical!r} is not in the corpus"


def test_canonical_poet_resolves_aliases_and_artefacts(aliases):
    if aliases:
        raw, canonical = next(iter(aliases.items()))
        assert canonical_poet(raw) == canonical
    # trailing punctuation and tabs are scrape noise, not part of a name
    assert canonical_poet("கபிலர்.") == "கபிலர்"
    assert canonical_poet("கபிலர்\t") == "கபிலர்"


def test_anonymous_markers_are_not_poets():
    for marker in ("அறியப்படவில்லை", "பெயர் தெரியவில்லை", "unknown", ""):
        assert canonical_poet(marker) is None


def test_authority_index_is_names_only():
    path = vc.REPO_ROOT / "data" / "library" / "tamilwiki-poets.json"
    if not path.exists():
        pytest.skip("authority index not committed")
    doc = json.loads(path.read_text(encoding="utf-8"))
    assert doc["source"].startswith("https://tamil.wiki")
    assert "CC BY-SA 4.0" in doc["source"]
    for entry in doc["poets"]:
        assert set(entry) == {"ta", "roles", "bytes", "url"}, "authority must not carry article text"
