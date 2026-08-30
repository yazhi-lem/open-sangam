from avai.tools.tinai import get_tinai_context


def test_get_tinai_context_known():
    context = get_tinai_context("kurinji")
    assert context["verseCount"] == 470
    assert "topPoets" in context
    assert "attested" in context


def test_get_tinai_context_unknown():
    result = get_tinai_context("not_a_tinai")
    assert "error" in result
