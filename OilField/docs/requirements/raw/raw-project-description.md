# OilTwin Protocol — Digital Twin & Tokenization Layer for Oil Wells
**Version:** 1.0  
**Date:** 2025-10-31  
**Sponsor Context:** Pytheas Energy

---

## 1. Executive Summary
OilTwin turns each physical oil & gas well into a verifiable digital twin that streams production and ESG telemetry on-chain via oracles.
The twin mints production-backed tokens (PBTs) that represent verified barrels produced (or approved forward production) and enables financing, trading,
hedging, and transparent reporting. The system aligns energy operators, investors, and sustainability stakeholders with a single source of truth
that is cryptographically attested.

- **Problem:** Opaque production reporting, limited liquidity, fragmented ESG verification.  
- **Solution:** Digital-twin registry + oracle network + tokenization engine for production-backed assets.  
- **Outcomes:** Transparent financing, real-time monitoring, automated compliance, broader market access.

---

## 2. Judging Fit (Hackathon)
| Criterion | How OilTwin Scores | Score (1-4) |
|---|---|---|
| Impact & Relevance | Brings real energy assets on-chain with measurable utility (financing + transparency). | **4** |
| Technical Innovation | Digital twins + multi-source oracles + asset-backed tokens + optional ZK/AI. | **4** |
| Feasibility & Scalability | MVP using mock oracles/state datasets; scalable to fields & basins. | **3–4** |
| Presentation & Collaboration | Clear UI with live metrics, token flow, ESG score; demo-friendly. | **4** |

---

## 3. System Architecture
- **Twin Registry (NFT Layer)** — Each well becomes an ERC-721 digital twin storing identity, location, and ESG metadata.  
- **Oracle Layer** — Aggregates production, price, reserves, and ESG feeds.  
- **Tokenization Engine** — Mints and burns Production-Backed Tokens (PBTs) based on verified data.  
- **Valuation & Risk Layer** — Computes NAV from oil price and reserves forecasts.  
- **DeFi Layer** — Enables collateralization, staking, and secondary market trading.  
- **Dashboard Layer** — Shows metrics, token flow, oracle status, and ESG analytics.

---

## 4. Oracle Network
| Oracle | Purpose | Example Source | Frequency |
|---|---|---|---|
| Production Oracle | Daily output volumes | EIA, IoT sensors | Daily |
| Price Oracle | WTI / Brent market price | Chainlink, Pytheas | Realtime |
| ESG Oracle | Emission & flaring data | NASA FIRMS, Sentinel | Daily |
| Carbon Oracle | Offset verification | Pytheas carbon bridge | Weekly |
| Reserve Oracle | Forecasted recoverables | AI-based model | Weekly |
| KYC Oracle | Ownership verification | Reg. agencies / DIDs | Static |

---

## 5. Dashboard Metrics
**Overview:** well ID, operator, status, live barrels/day, cumulative output, remaining reserves.  
**Financials:** token supply, NAV, yield, collateral value, liquidity depth.  
**ESG:** methane emissions, carbon intensity, flaring events, offset credits.  
**Oracles:** uptime, latency, last update, quorum agreement.  
**KPIs:** <10s latency, 95% accuracy, ESG coverage ≥80%.

---

## 6. Data Feeds & APIs
1. EIA Open Data API — [https://www.eia.gov/opendata/](https://www.eia.gov/opendata/)  
2. BOEM Offshore Wells — [https://www.data.boem.gov/](https://www.data.boem.gov/)  
3. TX Railroad Commission — [https://www.rrc.texas.gov/](https://www.rrc.texas.gov/)  
4. Chainlink Oil Price Feed — [https://data.chain.link/](https://data.chain.link/)  
5. NASA FIRMS Satellite Data — [https://firms.modaps.eosdis.nasa.gov/](https://firms.modaps.eosdis.nasa.gov/)  
6. Pytheas Energy Registry — [https://pytheasenergy.com/](https://pytheasenergy.com/)  

---

## 7. Implementation Plan (24h Hackathon)
1. Select demo well from state dataset.  
2. Simulate IoT data feed (JSON or WebSocket).  
3. Use Chainlink oil price oracle for NAV.  
4. Deploy minimal TwinRegistry + OracleHub + Token contracts.  
5. Build dashboard in React or Framer.  
6. Present live demo: **data → oracle tick → token mint → NAV update → ESG badge**.

---

## 8. One-Minute Pitch
> “OilTwin turns real oil wells into verifiable digital twins on blockchain.  
> Each barrel produced mints a token, verified by Pytheas oracles.  
> Investors gain transparent access to real-world energy yield, while operators access instant liquidity — turning barrels into bytes.”

---

## Appendix A — Example API Payload
```json
{
  "wellId": "TX-2438",
  "timestamp": "2025-10-31T12:00:00Z",
  "flowRate_bbl_day": 1050,
  "pressure_psi": 2450,
  "temperature_c": 72.5,
  "signature": "0xabc123"
}
```
