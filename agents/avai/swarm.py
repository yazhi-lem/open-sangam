"""Swarm wiring for the Sangam Avai peer mesh.

This module initializes the poet agents and connects them together for ADK agent transfer.
"""

from .poets.nakkirar import nakkirar_agent
from .poets.avvaiyar import avvaiyar_agent
from .poets.kapilar import kapilar_agent
from .poets.tholkappiyar import tholkappiyar_agent
from google.adk.tools.agent_tool import AgentTool



# Note: Paranar will be added in M2 later.
poets = [nakkirar_agent, avvaiyar_agent, kapilar_agent, tholkappiyar_agent]

def wire_mesh():
    """Connects all agents together to allow mid-conversation handoffs."""
    for poet in poets:
        for peer in poets:
            if poet.name != peer.name:
                # Wrap peer agent in AgentTool to allow agent transfer
                agent_tool = AgentTool(agent=peer)
                # Check if it's already added by name to avoid duplicates
                # AgentTool has a .name attribute, whereas regular functions have .__name__
                existing_tool_names = [getattr(t, 'name', getattr(t, '__name__', '')) for t in poet.tools]
                
                if agent_tool.name not in existing_tool_names:
                    poet.tools.append(agent_tool)

wire_mesh()

# Nakkirar is the convener and default entry point
root_agent = nakkirar_agent
