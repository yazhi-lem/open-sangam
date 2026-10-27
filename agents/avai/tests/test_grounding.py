"""Tests for deterministic Tamil verse grounding."""

import asyncio

from google.adk.models.llm_request import LlmRequest
from google.genai import types

from avai.grounding import TamilGroundingPlugin, extract_verse_id


def test_extract_verse_id_latin():
    assert extract_verse_id("What tinai is kurunthokai_100?") == "kurunthokai_100"


def test_extract_verse_id_tamil_name_and_digits():
    assert extract_verse_id("குறுந்தொகை ௧௦௦ பாடலின் திணை என்ன?") == "kurunthokai_100"
    assert extract_verse_id("புறநானூறு 192 பற்றி கூறுக") == "purananooru_192"


def test_extract_verse_id_absent():
    assert extract_verse_id("சங்க இலக்கியம் பற்றி கூறுக") is None


def test_plugin_appends_verified_evidence_and_tamil_instruction():
    request = LlmRequest(
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text="குறுந்தொகை 100 பாடலின் திணை என்ன?")],
            )
        ]
    )

    asyncio.run(TamilGroundingPlugin().before_model_callback(None, request))

    text = request.contents[0].parts[0].text
    assert "verse_id=kurunthokai_100" in text
    assert "tinai=kurinji" in text
    assert "Reply in Tamil" in text


def test_plugin_does_not_duplicate_hint():
    plugin = TamilGroundingPlugin()
    request = LlmRequest(
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text="குறுந்தொகை 100 பாடலின் திணை என்ன?")],
            )
        ]
    )

    asyncio.run(plugin.before_model_callback(None, request))
    once = request.contents[0].parts[0].text
    asyncio.run(plugin.before_model_callback(None, request))

    assert request.contents[0].parts[0].text.count("verse_id=kurunthokai_100") == 1
    assert request.contents[0].parts[0].text == once
