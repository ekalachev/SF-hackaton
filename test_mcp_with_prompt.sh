#!/bin/bash
source ~/.zshrc

# Example script to test MCP with a specific prompt
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton

# Run claude-eng with MCP config and a test prompt
~/claude-eng --mcp-config /Users/alexanderfedin/Projects/hackathons/SF-hackaton/.mcp.json --print "Test the HubSpot connection and list available resources"