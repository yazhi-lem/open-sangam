from avai.tools.tinai import get_tinai_context


def test_get_tinai_context_known():
    # Snapshot of data/knowledge/tinai_context.json. The five tiṇai counts must
    # add up to the number of records carrying a known tiṇai (2,334 of 6,167).
    context = get_tinai_context("kurinji")
    assert context["verseCount"] == 587
    assert "topPoets" in context
    assert "attested" in context


def test_get_tinai_context_unknown():
    result = get_tinai_context("not_a_tinai")
    assert "error" in result
