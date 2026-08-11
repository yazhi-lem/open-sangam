import pytest
from agents.avai.prompts import NAKKIRAR_INSTRUCTION

def test_nakkirar_routing_instructions_present():
    """
    Ensure Nakkirar's instruction prompt explicitly tells it to route
    illustration/visualization requests to the Paranar agent.
    """
    instruction_lower = NAKKIRAR_INSTRUCTION.lower()
    
    # Must explicitly mention the paranar tool
    assert "paranar" in instruction_lower, "Nakkirar instruction must explicitly mention 'paranar' tool."
    
    # Must explicitly mention the trigger words
    assert "illustrate" in instruction_lower or "visualize" in instruction_lower, \
        "Nakkirar instruction must explicitly mention 'illustrate' or 'visualize' triggers."
