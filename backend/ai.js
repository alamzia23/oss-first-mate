require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

async function analyzeWithClaude(repo, issues, prs, slackMessages) {
  const prompt = `You are an AI assistant helping an open source maintainer triage their project.

Repository: ${repo}

RECENT OPEN ISSUES (${issues.length} total):
${issues.slice(0, 10).map(i => `- #${i.number}: "${i.title}" (${i.comments} comments)`).join('\n')}

OPEN PULL REQUESTS (${prs.length} total):
${prs.slice(0, 10).map(p => `- PR #${p.number}: "${p.title}" by @${p.user__login} | Slop Score: ${p.slopScore}% | Reasons: ${p.slopReasons.join(', ') || 'none'}`).join('\n')}

SLACK MESSAGES (${slackMessages.length} total):
${slackMessages.slice(0, 5).map(m => `- "${m.text}"`).join('\n') || 'No slack messages'}

Based on this data, provide:
1. A 2-sentence summary of the repo's current health
2. The single most important thing the maintainer should do TODAY
3. One pattern you notice across issues or PRs
4. A confidence score (0-100) on overall repo health

Keep your response concise and actionable. Format as JSON:
{
  "health_summary": "...",
  "top_priority": "...",
  "pattern": "...",
  "health_score": 0-100
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Claude API error:', err.message);
    return {
      health_summary: 'Unable to analyze at this time.',
      top_priority: 'Review stale PRs and urgent issues manually.',
      pattern: 'Analysis unavailable.',
      health_score: 50
    };
  }
}

module.exports = { analyzeWithClaude };
