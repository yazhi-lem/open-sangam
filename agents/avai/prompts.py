"""Test prompts suite for evaluating and testing all Sangam Avai poet agents.

Also re-exports instructions from .instructions for backward compatibility.
"""

from typing import Optional

# Re-export agent instruction fragments for backward compatibility
from .instructions import (
    ABSTENTION_RULE,
    CITATION_RULE,
    CONTESTED_INTERPRETATION_RULE,
    NAKKIRAR_INSTRUCTION,
    AVVAIYAR_INSTRUCTION,
    KAPILAR_INSTRUCTION,
    THOLKAPPIYAR_INSTRUCTION,
    PARANAR_INSTRUCTION,
)

# ---------------------------------------------------------------------------
# Test Prompts for நக்கீரர் (Nakkirar) — Convener, Critic & Router
# ---------------------------------------------------------------------------
TEST_PROMPTS_NAKKIRAR = [
    {
        "id": "nakkirar_route_to_paranar",
        "category": "routing_image",
        "agent": "nakkirar",
        "prompt": "குறுந்தொகை 1-ஆம் பாடலின் காட்சியை மனக்கண் முன் கொண்டுவந்து ஓர் அழகான சித்திரமாக வரைந்து தருக.",
        "expected_tools": ["paranar"],
        "expected_behavior": "Must hand off to the 'paranar' tool and output the generated image markdown verbatim without summarizing.",
    },
    {
        "id": "nakkirar_tinai_overview",
        "category": "critic_and_overview",
        "agent": "nakkirar",
        "prompt": "சங்க இலக்கியத்தில் ஐந்திணைகளின் நில அமைப்பும் உரிப்பொருளும் யாவை? சுருக்கமாக நக்கீரர் பார்வையில் விளக்குக.",
        "expected_tools": ["get_tinai_context"],
        "expected_behavior": "Must ground the overview in tiṇai context and cite classical conventions.",
    },
    {
        "id": "nakkirar_colophon_and_parallel",
        "category": "intertextual",
        "agent": "nakkirar",
        "prompt": "kurunthokai_001 பாடலின் பாடியவர் யார், மற்றும் அப்பாடலுக்கு இணையான வேறு குறிஞ்சிப் பாடல்கள் எவை?",
        "expected_tools": ["get_colophon_metadata", "find_parallel_verses"],
        "expected_behavior": "Must identify poet (திப்புத் தோளார்) and list parallel verses with reasons.",
    },
]

# ---------------------------------------------------------------------------
# Test Prompts for ஔவையார் (Avvaiyar) — Q&A and Etymology Specialist
# ---------------------------------------------------------------------------
TEST_PROMPTS_AVVAIYAR = [
    {
        "id": "avvaiyar_verse_qa",
        "category": "qa_grounded",
        "agent": "avvaiyar",
        "prompt": "குறுந்தொகை 100-ஆம் பாடலின் திணை யாது, மற்றும் அப்பாடலில் இடம்பெற்றுள்ள முதன்மையான செய்தி என்ன?",
        "expected_tools": ["get_verse"],
        "expected_behavior": "Must call get_verse('kurunthokai_100'), identify kurinji tiṇai, and cite verse ID.",
    },
    {
        "id": "avvaiyar_word_etymology",
        "category": "etymology",
        "agent": "avvaiyar",
        "prompt": "சங்க இலக்கியத்தில் 'காந்தள்' என்ற சொல் எந்தெந்த பாடல்களில் பயின்றுவருகிறது மற்றும் அதன் பொருள் என்ன?",
        "expected_tools": ["analyze_word_etymology"],
        "expected_behavior": "Must retrieve occurrences of 'காந்தள்' and explain its Sangam botanical & cultural context.",
    },
    {
        "id": "avvaiyar_corpus_count",
        "category": "corpus_meta",
        "agent": "avvaiyar",
        "prompt": "சங்க இலக்கியத் தொகுப்பில் உள்ள நூல்களின் பட்டியலையும் அவற்றின் பாடல் எண்ணிக்கைகளையும் தருக.",
        "expected_tools": ["list_poems"],
        "expected_behavior": "Must return list of poems and their verse counts using list_poems.",
    },
    {
        "id": "avvaiyar_colophon_lookup",
        "category": "colophon",
        "agent": "avvaiyar",
        "prompt": "purananooru_001 பாடலின் பாடியவர், பாடப்பட்ட கடவுள் மற்றும் கொளுச் செய்திகளை விவரிக்க.",
        "expected_tools": ["get_colophon_metadata", "get_verse"],
        "expected_behavior": "Must retrieve author and colophon metadata for Purananooru 1.",
    },
]

# ---------------------------------------------------------------------------
# Test Prompts for கபிலர் (Kapilar) — Search, Ranking & Retrieval
# ---------------------------------------------------------------------------
TEST_PROMPTS_KAPILAR = [
    {
        "id": "kapilar_nature_search",
        "category": "search_and_ranking",
        "agent": "kapilar",
        "prompt": "குறிஞ்சி மலர், அருவி மற்றும் மலை சார்ந்த சங்கப் பாடல்களைத் தேடி மிகவும் பொருத்தமானவற்றை வரிசைப்படுத்தித் தருக.",
        "expected_tools": ["search_verses", "get_tinai_context"],
        "expected_behavior": "Must retrieve relevant Kurinji verses and provide brief matching summaries without verbose commentary.",
    },
    {
        "id": "kapilar_parallel_verses",
        "category": "parallel_discovery",
        "agent": "kapilar",
        "prompt": "kurunthokai_001 பாடலுக்கு இணையான திணை மற்றும் உரிப்பொருள் கொண்ட ஒப்புமைப் பாடல்களை வரிசைப்படுத்துக.",
        "expected_tools": ["find_parallel_verses"],
        "expected_behavior": "Must find and rank parallel verses sharing tiṇai, poet, or motifs.",
    },
]

# ---------------------------------------------------------------------------
# Test Prompts for தொல்காப்பியர் (Tholkappiyar) — Scenario & Prosody
# ---------------------------------------------------------------------------
TEST_PROMPTS_THOLKAPPIYAR = [
    {
        "id": "tholkappiyar_scenario_extraction",
        "category": "scenario_extraction",
        "agent": "tholkappiyar",
        "prompt": "kurunthokai_001 பாடலின் கூற்று, கேட்போர், திணை, உரிப்பொருள், கருப்பொருள்களைப் பிரித்தெடுத்து முறைப்படி தருக.",
        "expected_tools": ["get_verse", "get_tinai_context"],
        "expected_behavior": "Must extract structured scenario matching Scenario schema with 1-3 concise evidenceLines.",
    },
    {
        "id": "tholkappiyar_prosody_analysis",
        "category": "prosody_analysis",
        "agent": "tholkappiyar",
        "prompt": "kurunthokai_001 பாடலின் யாப்பமைதி, பா வகை, மோனை மற்றும் எதுகை அமைப்பைப் பகுத்தாய்க.",
        "expected_tools": ["analyze_prosody"],
        "expected_behavior": "Must analyze meter (ஆசிரியப்பா/அகவற்பா) and identify Monai & Etukai pairs.",
    },
]

# ---------------------------------------------------------------------------
# Test Prompts for பரணர் (Paranar) — Imagery & Scene Visualizer
# ---------------------------------------------------------------------------
TEST_PROMPTS_PARANAR = [
    {
        "id": "paranar_visualize_scene",
        "category": "visual_imagery",
        "agent": "paranar",
        "prompt": "குறுந்தொகை 1-ஆம் பாடலின் (செங்களம், காந்தள் பூ, செங்கோட்டு யானை) காட்சியை மனக்கண் முன் கொண்டுவந்து விரிவான காட்சி விவரிப்பை வரைக.",
        "expected_tools": ["get_verse", "get_tinai_context"],
        "expected_behavior": "Must read verse and tiṇai context, craft detailed visual prompt, and invoke painter sub-agent.",
    },
    {
        "id": "paranar_out_of_scope_rejection",
        "category": "scope_enforcement",
        "agent": "paranar",
        "prompt": "நவீன விண்வெளி ஓடமும் வேற்றுக்கிரக மனிதர்களும் கொண்ட ஒரு படத்தைச் சித்திரமாக வரைக.",
        "expected_tools": [],
        "expected_behavior": "Must politely decline modern/unrelated topics and steer conversation back to Sangam literature.",
    },
]

# ---------------------------------------------------------------------------
# Consolidated Test Prompts Directory & Helper
# ---------------------------------------------------------------------------
TEST_PROMPTS_BY_AGENT = {
    "nakkirar": TEST_PROMPTS_NAKKIRAR,
    "avvaiyar": TEST_PROMPTS_AVVAIYAR,
    "kapilar": TEST_PROMPTS_KAPILAR,
    "tholkappiyar": TEST_PROMPTS_THOLKAPPIYAR,
    "paranar": TEST_PROMPTS_PARANAR,
}

ALL_TEST_PROMPTS = (
    TEST_PROMPTS_NAKKIRAR
    + TEST_PROMPTS_AVVAIYAR
    + TEST_PROMPTS_KAPILAR
    + TEST_PROMPTS_THOLKAPPIYAR
    + TEST_PROMPTS_PARANAR
)


def get_test_prompts(
    agent_name: Optional[str] = None, category: Optional[str] = None
) -> list[dict]:
    """Retrieve test prompts filtered by agent name and/or category.

    Args:
        agent_name: e.g. 'nakkirar', 'avvaiyar', 'kapilar', 'tholkappiyar', 'paranar'
        category: e.g. 'routing_image', 'etymology', 'prosody_analysis'

    Returns:
        list of prompt dictionaries with id, prompt, expected_tools, and expected_behavior.
    """
    prompts = TEST_PROMPTS_BY_AGENT.get(agent_name, ALL_TEST_PROMPTS) if agent_name else ALL_TEST_PROMPTS
    if category:
        prompts = [p for p in prompts if p.get("category") == category]
    return prompts


__all__ = [
    # Re-exported instructions
    "CITATION_RULE",
    "ABSTENTION_RULE",
    "CONTESTED_INTERPRETATION_RULE",
    "NAKKIRAR_INSTRUCTION",
    "AVVAIYAR_INSTRUCTION",
    "KAPILAR_INSTRUCTION",
    "THOLKAPPIYAR_INSTRUCTION",
    "PARANAR_INSTRUCTION",
    # Test Prompts
    "TEST_PROMPTS_NAKKIRAR",
    "TEST_PROMPTS_AVVAIYAR",
    "TEST_PROMPTS_KAPILAR",
    "TEST_PROMPTS_THOLKAPPIYAR",
    "TEST_PROMPTS_PARANAR",
    "TEST_PROMPTS_BY_AGENT",
    "ALL_TEST_PROMPTS",
    "get_test_prompts",
]
