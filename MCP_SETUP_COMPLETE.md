# ✅ MCP Setup Complete for Claude CLI

## What's Configured

### 1. Project-Level MCP Configuration (`.mcp.json`)
Located at: `/Users/alexanderfedin/Projects/hackathons/SF-hackaton/.mcp.json`

**Servers configured:**
- ✅ **Puppeteer** - Web automation and scraping
- ✅ **HubSpot** - CRM integration with your access token

### 2. Installed MCP Servers
```
✅ @modelcontextprotocol/server-puppeteer (web automation)
✅ @shinzolabs/hubspot-mcp (HubSpot integration)
```

### 3. HubSpot Access Token
- Token saved in `~/.zshrc`
- Token: `pat-na2-30f8b732-2167-4521-a829-01bb51c277a5`
- Auto-loads in all shell scripts

## How to Use

### Start Claude with MCP Servers

**Option 1: From Project Directory (Recommended)**
```bash
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton
claude
```
When prompted, approve both servers by typing `y` for each.

**Option 2: With Explicit Config**
```bash
claude --mcp-config /Users/alexanderfedin/Projects/hackathons/SF-hackaton/.mcp.json
```

### Test MCP Servers

Once in Claude CLI:
```
/mcp                    # List available MCP servers
/mcp list              # Same as above
```

### Use MCP Servers

**Puppeteer Examples:**
```bash
# Take a screenshot
claude --print "Use puppeteer to navigate to https://google.com and take a screenshot"

# Scrape a website
claude --print "Use puppeteer to get the main headline from https://news.ycombinator.com"
```

**HubSpot Examples:**
```bash
# List contacts
claude --print "Use hubspot to list my contacts"

# Get tasks
claude --print "Use hubspot to show my open tasks"

# Create a task
claude --print "Use hubspot to create a task called 'Follow up with lead'"
```

## Troubleshooting

### If MCP servers don't show up:
1. Make sure you're in the project directory
2. Restart Claude CLI
3. Approve servers when prompted (type `y`)

### If HubSpot fails to connect:
1. Verify token is correct: `echo $HUBSPOT_ACCESS_TOKEN`
2. Check token has required scopes in HubSpot settings
3. Try the direct API test: `./test_private_app.sh`

### Reset MCP if needed:
```bash
~/claude-eng mcp reset-project-choices
```

## Quick Commands

```bash
# Verify setup
./verify_setup.sh

# Test HubSpot API
./test_private_app.sh

# Run mock demo
./mock_demo.sh

# Run lead qualifier
./agents/lead_qualifier_v2.sh
```

## Important Notes

1. **First Time:** You'll be prompted to approve the MCP servers
2. **Project Scope:** MCP servers only work when Claude is started from this directory
3. **Auto-Load:** The `.mcp.json` file auto-loads when you start Claude here
4. **Token Security:** Your HubSpot token is embedded in the config - don't commit it to public repos

## Ready for Hackathon! 🚀

Everything is set up and ready for the August 16 hackathon. The MCP servers will provide:
- Web scraping capabilities (Puppeteer)
- Direct HubSpot CRM integration
- All authentication configured

Good luck with the hackathon!