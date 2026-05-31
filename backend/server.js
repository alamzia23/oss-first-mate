require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { execFileSync } = require('child_process');
const { analyzeWithClaude } = require('./ai');

const PORT = process.env.PORT || 3001;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C057H0PF3PG';

const app = express();
app.use(cors());
app.use(express.json());

function coralQuery(sql) {
  try {
    const result = execFileSync('coral', ['sql', '--format', 'json', sql], {
      encoding: 'utf8',
      timeout: 30000
    });
    return JSON.parse(result);
  } catch (err) {
    console.error('Coral query failed:', err.message);
    return [];
  }
}

// For optional sources (Slack, Notion) — returns { data, connected }
// so the frontend can distinguish "not configured" from "empty".
function optionalCoralQuery(sql, sourceName) {
  try {
    const result = execFileSync('coral', ['sql', '--format', 'json', sql], {
      encoding: 'utf8',
      timeout: 30000
    });
    const data = JSON.parse(result);
    return { data: Array.isArray(data) ? data : [], connected: true };
  } catch (err) {
    console.error(`${sourceName} Coral query failed (source may not be configured):`, err.message);
    return { data: [], connected: false };
  }
}

app.post('/api/triage', async (req, res) => {
  const { owner, repo } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner and repo are required' });

  try {
    console.log(`Triaging ${owner}/${repo}...`);

    const issues = coralQuery(
      `SELECT number, title, body, created_at, comments, user__login FROM github.issues WHERE owner='${owner}' AND repo='${repo}' AND state='open' LIMIT 30`
    );

    const prs = coralQuery(
      `SELECT number, title, body, user__login, created_at, changed_files FROM github.pulls WHERE owner='${owner}' AND repo='${repo}' AND state='open' LIMIT 20`
    );

    const slack = optionalCoralQuery(
      `SELECT text, user_id, ts FROM slack.messages WHERE channel = '${SLACK_CHANNEL_ID}' LIMIT 20`,
      'Slack'
    );
    const slackMessages = slack.data;

    console.log(`Got ${issues.length} issues, ${prs.length} PRs, ${slackMessages.length} Slack messages (connected: ${slack.connected})`);

    const analyzedPRs = prs.map(pr => {
      let slopScore = 0;
      const reasons = [];
      if (!pr.body || pr.body.length < 100) { slopScore += 25; reasons.push('Vague description'); }
      const genericPhrases = ['improve', 'update', 'fix', 'enhance', 'optimize', 'refactor'];
      const titleWords = (pr.title || '').toLowerCase().split(' ');
      if (titleWords.length < 5 && genericPhrases.some(p => titleWords.includes(p))) { slopScore += 25; reasons.push('Generic title'); }
      if (pr.changed_files > 15) { slopScore += 15; reasons.push(`High file scatter (${pr.changed_files} files)`); }
      return { ...pr, slopScore: Math.min(slopScore, 95), slopReasons: reasons, isSuspicious: slopScore >= 40 };
    });

    const duplicateClusters = [];
    const seen = new Set();
    issues.forEach((issue, i) => {
      if (seen.has(i)) return;
      const similar = issues.filter((other, j) => {
        if (i === j || seen.has(j)) return false;
        const wordsA = (issue.title || '').toLowerCase().split(' ');
        const wordsB = (other.title || '').toLowerCase().split(' ');
        const common = wordsA.filter(w => w.length > 4 && wordsB.includes(w));
        return common.length >= 2;
      });
      if (similar.length > 0) { similar.forEach((_, j) => seen.add(j)); duplicateClusters.push({ primary: issue, duplicates: similar }); }
    });

    const stalePRs = analyzedPRs.filter(pr => {
      const daysDiff = (new Date() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
    });

    const urgentIssues = issues.filter(i => i.comments > 3).sort((a, b) => b.comments - a.comments).slice(0, 5);

    // Claude AI analysis
    console.log('Asking Claude for insights...');
    const aiInsights = await analyzeWithClaude(
      `${owner}/${repo}`,
      issues,
      analyzedPRs,
      slackMessages
    );

    res.json({
      repo: `${owner}/${repo}`,
      ai: aiInsights,
      summary: {
        totalIssues: issues.length,
        totalPRs: prs.length,
        urgentCount: urgentIssues.length,
        slopCount: analyzedPRs.filter(p => p.isSuspicious).length,
        staleCount: stalePRs.length,
        duplicateGroups: duplicateClusters.length
      },
      urgent: urgentIssues,
      suspicious: analyzedPRs.filter(p => p.isSuspicious),
      stale: stalePRs,
      duplicates: duplicateClusters,
      slack: slackMessages,
      slackConnected: slack.connected
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 OSS First Mate backend running on http://localhost:${PORT}`));
