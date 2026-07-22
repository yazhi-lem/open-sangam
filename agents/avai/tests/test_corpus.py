from avai.tools.corpus import get_verse, list_poems, search_verses


def test_get_verse_known_id():
    verse = get_verse("kurunthokai_100")
    assert verse["poem"] == "kurunthokai"
    assert verse["tinai"] == "kurinji"
    assert "அருவி" in verse["sangamTamil"]


def test_get_verse_unknown_id():
    result = get_verse("not_a_real_id")
    assert "error" in result


def test_search_verses_tamil_text():
    results = search_verses("அருவி")
    assert len(results) > 0
    assert all("அருவி" in (v["sangamTamil"] or "") for v in results)


def test_search_verses_tinai_filter():
    results = search_verses("அருவி", tinai="kurinji", limit=50)
    assert len(results) > 0
    assert all(v["tinai"] == "kurinji" for v in results)


def test_search_verses_respects_limit():
    results = search_verses("a", limit=3)
    assert len(results) <= 3


def test_list_poems_includes_known_poems():
    poems = {p["poem"] for p in list_poems()}
    assert "kurunthokai" in poems
    assert "akananooru" in poems
