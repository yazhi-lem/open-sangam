"""Tests for the translate_all.py wrapper's command construction.

Pure function only — no subprocess is actually run here.
"""

import argparse

from ai.translate_all import LANG_ORDER, build_command


def _args(**overrides):
    base = dict(
        only=None,
        poem=None,
        phase=None,
        limit=200,
        concurrency=4,
        dry_run=False,
        force=False,
        status=False,
    )
    base.update(overrides)
    return argparse.Namespace(**base)


def test_lang_order_runs_urai_then_yazhi_urai_then_english():
    assert LANG_ORDER == ["urai", "yazhi_urai", "english"]


def test_build_command_status_ignores_other_flags():
    cmd = build_command("urai", _args(status=True, poem="mullaippattu", limit=5))
    assert cmd[-2:] == ["--lang", "urai"] or "--status" in cmd
    assert "--status" in cmd
    assert "--poem" not in cmd


def test_build_command_forwards_shared_flags():
    cmd = build_command(
        "english",
        _args(poem="mullaippattu", phase=2, limit=7, concurrency=3, dry_run=True, force=True),
    )
    assert "--lang" in cmd and cmd[cmd.index("--lang") + 1] == "english"
    assert "--poem" in cmd and cmd[cmd.index("--poem") + 1] == "mullaippattu"
    assert "--phase" in cmd and cmd[cmd.index("--phase") + 1] == "2"
    assert "--limit" in cmd and cmd[cmd.index("--limit") + 1] == "7"
    assert "--concurrency" in cmd and cmd[cmd.index("--concurrency") + 1] == "3"
    assert "--dry-run" in cmd
    assert "--force" in cmd


def test_build_command_omits_optional_flags_by_default():
    cmd = build_command("urai", _args())
    assert "--poem" not in cmd
    assert "--phase" not in cmd
    assert "--dry-run" not in cmd
    assert "--force" not in cmd
