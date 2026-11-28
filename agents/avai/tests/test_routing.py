"""Intent routing table — the contract the floating Avai council depends on.

`POST /avai/ask` with no `pulavar` runs `classify_message`, and the resulting
workflow picks the poet. The floating panel's "அவை" mode sends exactly that
request, so these cases are what keeps "the platform picks the poet" honest.

Pure functions only: no model, no network, no corpus.
"""

import pytest

from ..api.app import classify_message
from ..health import PULAVAR_TO_DEFAULT_WORKFLOW, WORKFLOW_TO_PULAVAR

# (message, expected workflow, expected pulavar)
ROUTING_CASES = [
    # General literary guidance -> Nakkirar (convener / default)
    ("வணக்கம்", "general", "nakkirar"),
    ("சங்க இலக்கியம் பற்றி சொல்", "general", "nakkirar"),
    ("who are you?", "general", "nakkirar"),
    # Direct knowledge / commentary -> Avvaiyar
    ("குறுந்தொகை 40 பாடலை விளக்குக", "qa", "avvaiyar"),
    ("What tiṇai is kurunthokai_100?", "qa", "avvaiyar"),
    ("explain the meaning of this verse", "qa", "avvaiyar"),
    # Search & reimagination -> Kapilar
    ("திணை பற்றிய பாடல்களைத் தேடு", "search", "kapilar"),
    ("find verses about love", "search", "kapilar"),
    # Grammar & scenario -> Tholkappiyar
    ("தொல்காப்பியம் இலக்கணம் கூறு", "scenario", "tholkappiyar"),
    ("explain grammar and prosody rules in tolkappiyam", "scenario", "tholkappiyar"),
    # Imagery & poetic interpretation -> Paranar
    ("ஒரு காட்சி வரை", "imagery", "paranar"),
    ("குறிஞ்சி காட்சியை வரைந்து காட்டு", "imagery", "paranar"),
    ("draw a scene of the seashore", "imagery", "paranar"),
    ("Explain the war imagery in Purananooru 192.", "imagery", "paranar"),
    ("குறிஞ்சிப் பாடலின் உருவகம் எதைக் காட்டுகிறது?", "imagery", "paranar"),
    # Unknown intent falls back to the convener
    ("xyz random unrecognized query 12345", "general", "nakkirar"),
]


@pytest.mark.parametrize("message, expected_workflow, expected_pulavar", ROUTING_CASES)
def test_intent_routing(message, expected_workflow, expected_pulavar):
    workflow, reason = classify_message(message)
    assert workflow == expected_workflow, (message, workflow)
    assert WORKFLOW_TO_PULAVAR[workflow] == expected_pulavar, (message, workflow)
    assert reason


def test_plain_use_of_image_is_not_imagery():
    """A figure of speech in an ordinary question must not summon Paranar."""
    workflow, reason = classify_message("What is the image of a king in classical society?")
    assert workflow == "general"
    assert reason == "default_convener"


def test_every_pulavar_is_reachable_by_intent():
    """All five specialists answer at least one intent, so the council is real."""
    reachable = set(WORKFLOW_TO_PULAVAR.values())
    assert reachable == {
        "nakkirar",
        "avvaiyar",
        "kapilar",
        "tholkappiyar",
        "paranar",
    }
    assert set(PULAVAR_TO_DEFAULT_WORKFLOW) >= reachable
