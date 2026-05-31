# OSS First Mate

An AI-powered triage dashboard for open source maintainers. Enter any GitHub repo and get an instant view of what needs your attention — urgent issues, suspicious PRs, stale reviews, and duplicate reports — enriched with Claude AI insights pulled from GitHub, Slack, and Notion via [Coral](https://withcoral.com).

Built for the Pirates of the Coral-bean Hackathon (May 25–31, 2026).

---

## Features

- **Urgent issues** — surfaces open issues ranked by comment volume so the noisiest threads don't get buried
- **AI Slop detection** — scores PRs for low-effort signals (vague descriptions, generic titles, high file scatter) and flags suspicious submissions
- **Stale PR tracking** — lists pull requests that have been open more than 7 days without merge or close
- **Duplicate clustering** — groups open issues with overlapping titles so you can close dupes in one pass
- **Slack context** — pulls recent messages from your workspace channel to catch community signals that never made it into GitHub
- **Claude AI insights** — synthesizes all of the above into a repo health score, a top priority for today, and a detected pattern callout

---

## Architecture

```
frontend/       Next.js 16 + Tailwind CSS (port 3000)
backend/        Express API (port 3001)
  server.js     Triage logic, Coral SQL queries
  ai.js         Claude API integration
```

The backend queries Coral's unified SQL layer to fetch GitHub issues, PRs, and Slack messages, then passes the results to Claude for analysis.

---

## Prerequisites

- Node.js 18+
- [Coral CLI](https://withcoral.com) installed and authenticated
- An Anthropic API key

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/oss-first-mate.git
cd oss-first-mate
```

### 2. Install and configure Coral

```bash
brew install withcoral/tap/coral

# Add data sources
coral source add github
coral source add slack --interactive
coral source add notion --interactive
```

### 3. Set environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com) |
| `GITHUB_TOKEN` | A GitHub personal access token with `repo` read scope — used by Coral to query GitHub data |

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export GITHUB_TOKEN=ghp_...
```

Add these to your `~/.zshrc` or `~/.bashrc` to persist them across sessions.

### 4. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Running

Open two terminals:

**Terminal 1 — Backend**
```bash
cd backend
node server.js
# Server running on http://localhost:3001
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# App running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), enter a GitHub `owner/repo` (e.g. `vercel/next.js`), and click **Triage**.

---

## How it works

1. The frontend sends a `POST /api/triage` with `{ owner, repo }`
2. The backend runs Coral SQL queries against three sources:
   - `github.issues` — open issues with comment counts
   - `github.pulls` — open PRs with file-change metadata
   - `slack.messages` — recent messages from your configured channel
3. Local heuristics compute a slop score per PR and cluster duplicate issues by title similarity
4. The full dataset is sent to Claude (`claude-sonnet-4-5`) which returns a structured JSON health report
5. The frontend renders everything across five tabs: **Urgent**, **AI Slop**, **Stale**, **Duplicates**, **Slack**

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Data | [Coral](https://withcoral.com) — SQL over GitHub, Slack, Notion |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |

---

## Hackathon

Pirates of the Coral-bean | May 25–31, 2026 | Track 1: Enterprise Agent
