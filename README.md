# 🏴 OSS First Mate

> AI-powered triage dashboard for open source maintainers — built for the Pirates of the Coral-bean Hackathon (May 25–31, 2026).

OSS First Mate helps maintainers cut through the noise. Enter any GitHub repo and get an instant health report: urgent issues, suspicious AI-generated PRs, stale pull requests, duplicate issue clusters, and relevant Slack activity — all surfaced by querying live data via Coral SQL and analyzed by Claude AI.

---

## Features

- **Claude AI Insights** — repo health score (0–100), today's single top priority, and a detected pattern across open issues and PRs
- **Urgent Issue Detection** — surfaces the most-commented open issues ranked by community signal
- **AI Slop PR Scoring** — flags pull requests with vague descriptions, generic one-word titles, or high file scatter using a heuristic slop score (≥40% = suspicious)
- **Stale PR Tracker** — identifies open PRs that have gone untouched for more than 7 days
- **Duplicate Issue Clustering** — groups open issues by title-word overlap to highlight redundant reports you can close in one pass
- **Slack Context** — pulls recent messages from your workspace alongside GitHub data via a single Coral SQL interface

---

## Architecture

```
oss-first-mate/
├── backend/        Node.js + Express API (port 3001)
│   ├── server.js   Coral SQL queries, triage heuristics
│   └── ai.js       Claude API integration
└── frontend/       Next.js 16 + Tailwind CSS v4 (port 3000)
    └── app/
        └── page.tsx  Single-page triage dashboard
```

The backend executes Coral SQL queries against GitHub, Slack, and Notion, runs local heuristics, then calls the Claude API for a natural-language health report. The frontend renders results in a tabbed dashboard.

---

## Prerequisites

- **Node.js** v18+
- **[Coral CLI](https://withcoral.com)** — installed, authenticated, and with GitHub/Slack sources configured
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)
- **GitHub personal access token** — passed to Coral when adding the GitHub source

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Backend | Anthropic API key used by the Claude SDK |
| `GITHUB_TOKEN` | Coral config | GitHub PAT with `repo` read scope — set when running `coral source add github` |

Set them in your shell or a `backend/.env` file:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export GITHUB_TOKEN=ghp_...
```

> The GitHub token is consumed by the Coral CLI, not loaded directly by the app. Set it before running `coral source add github`.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/oss-first-mate.git
cd oss-first-mate
```

### 2. Install and configure Coral

```bash
# macOS
brew install withcoral/tap/coral

# Add data sources
coral source add github     # prompts for GITHUB_TOKEN
coral source add slack      # prompts for Slack OAuth
coral source add notion     # prompts for Notion token (optional)
```

Verify Coral is working:

```bash
coral sql "SELECT number, title FROM github.issues WHERE owner='vercel' AND repo='next.js' LIMIT 3"
```

### 3. Install dependencies

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
# Backend running on http://localhost:3001
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), enter a GitHub `owner` and `repo` (e.g. `vercel` / `next.js`), and click **Triage**.

---

## How It Works

1. The frontend posts `{ owner, repo }` to `POST /api/triage` on the backend.
2. The backend fires three Coral SQL queries:
   - `github.issues` — up to 30 open issues with comment counts
   - `github.pulls` — up to 20 open PRs with file-change metadata
   - `slack.messages` — up to 20 recent messages from the configured channel
3. Local heuristics run over the results:
   - **Slop scoring** — each PR is scored for vague description, generic title, and high file scatter
   - **Duplicate clustering** — issues with 2+ overlapping words (>4 chars) in their titles are grouped
   - **Stale detection** — PRs open more than 7 days are flagged
   - **Urgency ranking** — issues with >3 comments are surfaced as urgent
4. All data is sent to Claude (`claude-sonnet-4-5`) which returns a structured JSON health report.
5. The frontend renders the report across five tabs: **Urgent**, **AI Slop**, **Stale**, **Duplicates**, **Slack**.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Data | [Coral](https://withcoral.com) — SQL over GitHub, Slack, Notion |
| AI | Anthropic Claude (`claude-sonnet-4-5` via `@anthropic-ai/sdk`) |

---

## Configuration Notes

- **Slack channel** — the backend queries a hardcoded channel ID (`C057H0PF3PG` in `backend/server.js:39`). Replace it with your own Slack channel ID.
- **Issue/PR limits** — defaults are 30 issues and 20 PRs per query. Adjust the `LIMIT` values in `server.js` if you need broader coverage.
- **Slop threshold** — PRs with a slop score ≥ 40 are flagged as suspicious. Tune the weights in `server.js:47–51` for your community's norms.

---

## Hackathon

Pirates of the Coral-bean | May 25–31, 2026 | Track 1: Enterprise Agent
