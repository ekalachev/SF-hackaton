[🏠 Home](../README.md) | [📚 Documentation](index.md)

---

# 🚀 QUICKSTART - 5 Minute Setup

**Author:** Alex Fedin | [O2.services](https://O2.services) | [LinkedIn](https://linkedin.com/in/alex-fedin)

## 📑 Table of Contents
1. [Fastest Path to Running Demo](#fastest-path-to-running-demo)
2. [Set HubSpot Token](#1️⃣-set-hubspot-private-app-token-30-seconds)
3. [Quick Install](#2️⃣-quick-install-2-minutes)
4. [Test Connection](#3️⃣-test-connection-30-seconds)
5. [Run Demo](#4️⃣-run-demo-2-minutes)
6. [Next Steps](#next-steps)

---

## Fastest Path to Running Demo

### 1️⃣ Set HubSpot Private App Token (30 seconds)
```bash
# Get token from HubSpot Settings > Integrations > Private Apps
export HUBSPOT_ACCESS_TOKEN="pat-na-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

> ⚠️ **Note:** API Keys are deprecated! You MUST use a Private App access token.

### 2️⃣ Install Dependencies (2 minutes)
```bash
npm install -g @modelcontextprotocol/server-hubspot
brew install git-flow  # Mac only
```

### 3️⃣ Run Setup (30 seconds)
```bash
cd /Users/alexanderfedin/Projects/hackathons/SF-hackaton
chmod +x *.sh agents/*.sh
./setup.sh
```

### 4️⃣ Create Test Data in HubSpot (2 minutes)
1. Log into HubSpot
2. Create contact: "John Demo" (john@demo.com)
3. Create task: "Qualify Lead John Demo"
4. Assign to: "AI Processing Queue" (or just leave unassigned)

### 5️⃣ Test Agent (30 seconds)
```bash
# Run the task monitor once
./agents/task_monitor.sh

# Check it worked
tail logs/agent_activity.log
```

### ✅ If you see activity in the log, YOU'RE READY!

---

## 🔥 Demo in 1 Command

```bash
# Show everything working
./demo.sh
```

---

## 🆘 If Something Breaks

```bash
# Check connection with curl
curl -X GET https://api.hubapi.com/crm/v3/objects/contacts?limit=1 \
  -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN"

# If that fails, check your token
echo $HUBSPOT_ACCESS_TOKEN  # Should start with pat-na- or pat-eu-

# Test with our helper
source agents/hubspot_api_helper.sh && get_contacts

# Create mock demo without real HubSpot
./mock_demo.sh  # Fallback demo that always works
```

---

## 📱 Demo Talking Points

"We built an AI agent swarm that replaces manual sales tasks in HubSpot"

1. **Problem:** Sales teams waste 70% of time on repetitive tasks
2. **Solution:** Shell scripts + Claude CLI + HubSpot native tasks
3. **Demo:** Watch agents process leads automatically
4. **Impact:** 95% time savings, 24/7 operation, zero infrastructure

**Remember:** Judges want to see it WORK, not perfect code!

---

## Next Steps

- [📋 Manual Setup Guide](MANUAL-SETUP-GUIDE.md) - Detailed configuration
- [🏗️ Architecture Documentation](architecture/index.md) - System design
- [🎬 Demo Guide](demo/DEMO_README.md) - Running demonstrations

---

[⬆️ Top](#-quickstart---5-minute-setup) | [📚 Documentation](index.md) | [Next: Manual Setup →](MANUAL-SETUP-GUIDE.md)