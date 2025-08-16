#!/bin/bash
source ~/.zshrc

# Start Claude CLI with MCP servers configured
claude --mcp-config '{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": [
        "/Users/alexanderfedin/Projects/hackathons/SF-hackaton/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"
      ],
      "env": {
        "PUPPETEER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    },
    "hubspot": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-hubspot"
      ],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "pat-na2-30f8b732-2167-4521-a829-01bb51c277a5"
      }
    }
  }
}'