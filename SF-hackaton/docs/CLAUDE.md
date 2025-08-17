# Claude Development Guide

## Repository Structure
```
/Users/alexanderfedin/Projects/hackathons/SF-hackaton/
├── README.md           # Main hackathon information and event details
└── CLAUDE.md          # This file - development guidelines and project context
```

## Project Context
This repository is for the **AI Hackathon: Corp-Agent Vibe Coding** event on August 16, 2025, in San Francisco. The challenge is to build AI agents for sales automation that integrate with HubSpot.

## Key Information
- **Event Details:** See [README.md](./README.md) for complete hackathon information
- **Working Directory:** `/Users/alexanderfedin/Projects/hackathons/SF-hackaton/`
- **Challenge Focus:** AI-powered sales automation tools with HubSpot integration

## Development Guidelines

### Project Setup
1. All code should be developed within this repository
2. Create organized subdirectories for different components (e.g., `/backend`, `/frontend`, `/ai-agents`)
3. Use environment variables for API keys and sensitive data
4. Include a `.gitignore` file for sensitive files and dependencies

### Technical Requirements
- **Primary Integration:** HubSpot API
- **AI/ML Options:** OpenAI API, Claude API, Google AI, or similar
- **Deployment Ready:** Solution should be demo-ready by 3:30 PM on event day

### Suggested Project Structure
```
SF-hackaton/
├── README.md
├── CLAUDE.md
├── .env.example
├── .gitignore
├── requirements.txt / package.json
├── /src
│   ├── /agents         # AI agent implementations
│   ├── /integrations   # HubSpot and other API integrations
│   ├── /api           # Backend API endpoints
│   └── /utils         # Utility functions
├── /frontend          # UI components (if applicable)
├── /tests            # Test files
└── /docs             # Additional documentation
```

### Commands to Run
```bash
# Navigate to project directory
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton/

# Initialize git (if needed)
git init

# Create project structure
mkdir -p src/{agents,integrations,api,utils} frontend tests docs

# Install dependencies (example for Python)
pip install -r requirements.txt

# Install dependencies (example for Node.js)
npm install

# Run tests
npm test
# or
python -m pytest

# Start development server
npm run dev
# or
python app.py
```

### HubSpot Integration Notes
- API Documentation: https://developers.hubspot.com/docs/api/overview
- Required scopes will depend on your use case (contacts, deals, companies, etc.)
- Use OAuth 2.0 for authentication
- Rate limits apply - implement proper error handling

### AI Agent Development Tips
1. Start with a clear use case definition
2. Design modular, reusable agent components
3. Implement proper prompt engineering
4. Add error handling and fallback mechanisms
5. Consider response time optimization for demo

### Testing Checklist
- [ ] HubSpot API connection works
- [ ] AI agent responds appropriately
- [ ] Error handling is robust
- [ ] Demo flow is smooth
- [ ] All features are documented

### Demo Preparation
- Prepare a 3-5 minute presentation
- Have a backup plan if live demo fails
- Create sample data for demonstration
- Test everything multiple times before 3:30 PM

## Quick Reference Links
- **Main Documentation:** [README.md](./README.md)
- **Event Registration:** https://lu.ma/8clf1otc
- **HubSpot API:** https://developers.hubspot.com/docs/api/overview
- **Repository Path:** `/Users/alexanderfedin/Projects/hackathons/SF-hackaton/`

## Notes for Future Development
- This hackathon focuses on practical AI applications in sales
- Judges include representatives from OpenAI, Google, Palantir, NVIDIA, and Apple
- Prizes include cash awards and interview opportunities
- Both code and no-code solutions are acceptable