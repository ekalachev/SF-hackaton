#!/bin/bash
# Agent identity configuration for shell scripts

export AGENT_USER="AI-Agents"
export AGENT_EMAIL="ai-agents@salesswarm.ai"
export AGENT_QUEUE="AI Processing Queue"
export HUMAN_QUEUE="Human Review Queue"
export PRIORITY_QUEUE="Priority Queue"

# Helper function to identify as AI-Agent in commands
ai_agent_cmd() {
    ~/claude-eng --mcp hubspot --as-user "$AGENT_USER" --print "$1"
}

# Export the function
export -f ai_agent_cmd
