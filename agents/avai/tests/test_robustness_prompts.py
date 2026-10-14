"""test_robustness_prompts.py — Regression test suite validating robustness prompt dataset integrity.
"""

import json
from collections import Counter
from pathlib import Path
from typing import Any

import pytest

ROBUSTNESS_FILE_PATH: Path = (
    Path(__file__).resolve().parent.parent / "evals" / "robustness_v0.jsonl"
)

EXPECTED_CATEGORIES: set[str] = {
    "instruction_override",
    "code_switch",
    "script_variants",
    "sensitive_advice",
    "young_learner",
}
EXPECTED_TOTAL_ENTRIES: int = 150
EXPECTED_COUNT_PER_CATEGORY: int = 30


def load_robustness_entries(file_path: Path = ROBUSTNESS_FILE_PATH) -> list[dict[str, Any]]:
    """Load and parse JSON lines from the robustness dataset file.

    Args:
        file_path: Path to the JSONL dataset file.

    Returns:
        List of deserialized JSON dictionaries representing dataset entries.
    """
    assert file_path.exists(), f"Robustness prompt dataset file not found: {file_path}"
    assert file_path.is_file(), f"Path is not a file: {file_path}"

    entries: list[dict[str, Any]] = []
    with file_path.open("r", encoding="utf-8") as f:
        for line_no, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                entry: dict[str, Any] = json.loads(line)
            except json.JSONDecodeError as err:
                pytest.fail(f"Invalid JSON at line {line_no} in {file_path}: {err}")
            entries.append(entry)

    return entries


@pytest.fixture
def robustness_entries() -> list[dict[str, Any]]:
    """Fixture providing loaded robustness dataset entries."""
    return load_robustness_entries()


def test_robustness_dataset_file_exists() -> None:
    """Validate that robustness_v0.jsonl exists at the expected path."""
    assert ROBUSTNESS_FILE_PATH.exists(), f"Missing file: {ROBUSTNESS_FILE_PATH}"
    assert ROBUSTNESS_FILE_PATH.is_file(), f"Expected a file: {ROBUSTNESS_FILE_PATH}"


def test_robustness_dataset_exact_count(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that the dataset contains exactly 150 entries."""
    assert len(robustness_entries) == EXPECTED_TOTAL_ENTRIES, (
        f"Expected {EXPECTED_TOTAL_ENTRIES} entries, found {len(robustness_entries)}"
    )


def test_robustness_dataset_unique_ids(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that all entry IDs are unique and non-empty."""
    ids: list[str] = []
    for idx, entry in enumerate(robustness_entries, start=1):
        entry_id = entry.get("id")
        assert entry_id is not None, f"Entry at index {idx} is missing 'id' field"
        assert isinstance(entry_id, str), f"Entry at index {idx} 'id' must be a str"
        assert entry_id.strip() != "", f"Entry at index {idx} has empty 'id'"
        ids.append(entry_id)

    unique_ids: set[str] = set(ids)
    assert len(unique_ids) == len(ids), (
        f"Duplicate IDs detected: {len(ids) - len(unique_ids)} duplicates found"
    )


def test_robustness_dataset_categories_match(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that exactly the 5 expected categories appear in the dataset."""
    categories: set[str] = {str(entry["category"]) for entry in robustness_entries}
    assert categories == EXPECTED_CATEGORIES, (
        f"Category mismatch. Expected {EXPECTED_CATEGORIES}, got {categories}. "
        f"Difference: {categories.symmetric_difference(EXPECTED_CATEGORIES)}"
    )


def test_robustness_dataset_category_distribution(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that each category has exactly 30 entries."""
    category_counts: Counter[str] = Counter(str(entry["category"]) for entry in robustness_entries)
    for category in EXPECTED_CATEGORIES:
        count = category_counts[category]
        assert count == EXPECTED_COUNT_PER_CATEGORY, (
            f"Category '{category}' has {count} entries; expected {EXPECTED_COUNT_PER_CATEGORY}"
        )


def test_robustness_dataset_fields_non_empty(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that prompt and expected_behaviour are non-empty strings for all entries."""
    for idx, entry in enumerate(robustness_entries, start=1):
        entry_id = entry.get("id", f"index_{idx}")

        prompt = entry.get("prompt")
        assert prompt is not None, f"Entry {entry_id} is missing 'prompt'"
        assert isinstance(prompt, str), f"Entry {entry_id} 'prompt' must be a str"
        assert prompt.strip() != "", f"Entry {entry_id} has empty 'prompt'"

        expected_behaviour = entry.get("expected_behaviour")
        assert expected_behaviour is not None, (
            f"Entry {entry_id} is missing 'expected_behaviour'"
        )
        assert isinstance(expected_behaviour, str), (
            f"Entry {entry_id} 'expected_behaviour' must be a str"
        )
        assert expected_behaviour.strip() != "", (
            f"Entry {entry_id} has empty 'expected_behaviour'"
        )


def test_script_variants_unicode_characters(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that SV-011 to SV-015 contain Cyrillic homoglyphs and SV-016 to SV-020 contain zero-width characters."""
    entries_by_id = {entry["id"]: entry for entry in robustness_entries}

    cyrillic_ids = [f"SV-{i:03d}" for i in range(11, 16)]
    for sv_id in cyrillic_ids:
        assert sv_id in entries_by_id, f"Entry {sv_id} not found in dataset"
        prompt = entries_by_id[sv_id]["prompt"]
        has_cyrillic = any(0x0400 <= ord(ch) <= 0x04FF for ch in prompt)
        assert has_cyrillic, (
            f"Prompt for {sv_id} does not contain any Cyrillic character (U+0400-U+04FF): {prompt}"
        )

    zero_width_chars = {"\u200b", "\u200c", "\u200d"}
    zero_width_ids = [f"SV-{i:03d}" for i in range(16, 21)]
    for sv_id in zero_width_ids:
        assert sv_id in entries_by_id, f"Entry {sv_id} not found in dataset"
        prompt = entries_by_id[sv_id]["prompt"]
        has_zw = any(ch in zero_width_chars for ch in prompt)
        assert has_zw, (
            f"Prompt for {sv_id} does not contain any zero-width character (U+200B, U+200C, U+200D)"
        )


def test_young_learner_secrets(robustness_entries: list[dict[str, Any]]) -> None:
    """Validate that expected_behaviour for YL-021 to YL-025 contains the word 'secret'."""
    entries_by_id = {entry["id"]: entry for entry in robustness_entries}
    secret_ids = [f"YL-{i:03d}" for i in range(21, 26)]
    for yl_id in secret_ids:
        assert yl_id in entries_by_id, f"Entry {yl_id} not found in dataset"
        expected_behaviour = entries_by_id[yl_id]["expected_behaviour"]
        assert "secret" in expected_behaviour.lower(), (
            f"Expected behaviour for {yl_id} must contain 'secret': {expected_behaviour}"
        )


