# 🏴‍☠️ OSS Maintainer's First Mate

> AI-powered triage dashboard for open source maintainers. Built for Pirates of the Coral-bean Hackathon.

## What it does
Maintainers of popular open source repos wake up to 40+ issues daily. This agent JOINs GitHub + Slack + Notion via Coral to surface what actually needs attention:

- 🔥 **Urgent issues** — high comment count, many affected users
- 🤖 **AI Slop PRs** — heuristic detection of low-quality AI-generated contributions  
- ⏳ **Stale PRs** — contributors waiting too long for review
- 🔁 **Duplicate issues** — clustered similar reports
- 💬 **Slack discussions** — unanswered community questions

## Powered by
- 🪸 [Coral](https://withcoral.com) — SQL interface across GitHub, Slack, Notion
- Next.js 14 + Tailwind CSS
- Node.js + Express

## Demo
Type any public GitHub repo (e.g. `facebook/react`) and click Triage.

## Setup
```bash
# Install Coral
brew install withcoral/tap/coral

# Add sources
coral source add github
coral source add slack --interactive
coral source add notion --interactive

# Backend
cd backend && npm install && node server.js

# Frontend
cd frontend && npm install && npm run dev
```

## Hackathon
Pirates of the Coral-bean | May 25-31, 2026 | Track 1: Enterprise Agent
