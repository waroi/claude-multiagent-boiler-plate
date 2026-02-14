'use strict';

function buildClaudeMd(tools) {
  const sections = [];

  // Gemini Delegation section
  if (tools === 'gemini' || tools === 'both') {
    sections.push(`## Gemini Delegation

**When the user says "use gemini"**, offload bulk analysis to Gemini CLI:

\`\`\`bash
cat data.json | gemini -p "Analyze this" -o text 2>/dev/null
\`\`\`

**Appropriate for Gemini:** Bulk file analysis, pattern finding, summarization, data validation, log analysis, code review of large diffs

**Keep with Claude:** File writes, multi-step work, final decisions, deployments, anything requiring judgment

**Gemini is READ-ONLY** - it cannot write files or run modifying commands.`);
  }

  // Codex Delegation section
  if (tools === 'codex' || tools === 'both') {
    sections.push(`## Codex Delegation

**When the user says "use codex"**, offload simple code tasks and analysis to Codex CLI:

\`\`\`bash
codex exec -s read-only "Analyze this code for bugs" -o /tmp/codex_out.txt
\`\`\`

**Appropriate for Codex:** Simple code generation, bug fixing, refactoring, test writing, code review, code analysis

**Keep with Claude:** Complex multi-step work, final decisions, deployments, architecture decisions

**Codex sandbox modes:** \`read-only\` for analysis, \`workspace-write\` for code changes`);
  }

  // Shorthands section
  sections.push(buildShorthandsSection(tools));

  // Graceful Degradation section
  sections.push(buildGracefulDegradation(tools));

  // Proactive Subagents section (gemini or both only)
  if (tools === 'gemini' || tools === 'both') {
    sections.push(`## Proactive Subagents

These trigger automatically - announce with ✅ emoji:

| Subagent       | Triggers When                                         |
| -------------- | ----------------------------------------------------- |
| \`investigator\` | When \`x3\` or \`x5\` shorthand is used (Claude+Gemini)  |`);
  }

  return sections.join('\n\n') + '\n';
}

function buildShorthandsSection(tools) {
  let table = `## Shorthands - Parallel Agents

**Number after letter = agent count. Letter alone defaults to 3.**

| Shorthand  | Claude | Gemini | Codex | Total |
| ---------- | ------ | ------ | ----- | ----- |`;

  if (tools === 'gemini' || tools === 'both') {
    table += `
| \`x3\`       | 1      | 2      | 0     | 3     |
| \`x5\`       | 1      | 4      | 0     | 5     |`;
  }

  if (tools === 'codex' || tools === 'both') {
    table += `
| \`c\` / \`c3\` | 0      | 0      | 3     | 3     |
| \`c2\`       | 0      | 0      | 2     | 2     |
| \`c5\`       | 0      | 0      | 5     | 5     |`;
  }

  if (tools === 'gemini' || tools === 'both') {
    table += `
| \`g\` / \`g3\` | 0      | 3      | 0     | 3     |
| \`g2\`       | 0      | 2      | 0     | 2     |
| \`g5\`       | 0      | 5      | 0     | 5     |`;
  }

  if (tools === 'both') {
    table += `

**Combine freely:** \`analyze code x3 c3\` = 1 Claude + 2 Gemini + 3 Codex = 6 agents`;
  }

  table += `

**Announce with emojis:** ✅ = Claude subagents`;

  if (tools === 'gemini' || tools === 'both') {
    table += `, 🔵 = Gemini agents`;
  }
  if (tools === 'codex' || tools === 'both') {
    table += `, 🟠 = Codex agents`;
  }

  if (tools === 'gemini' || tools === 'both') {
    table += `

**Gemini fallback:** gemini-pro → gemini-2.5-pro → gemini-flash → ⚡ Claude takeover`;
  }

  if (tools === 'codex' || tools === 'both') {
    table += `

**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude takeover`;
  }

  return table;
}

function buildGracefulDegradation(tools) {
  let section = `## Graceful Degradation

**When agents fail (credit/rate limits), Claude Code takes over automatically.**

**Degradation chain:**

\`\`\`
Agent CLI (primary model)
  → Fallback 1 (cheaper model)
    → Fallback 2 (cheapest model)
      → ⚡ Claude Code takeover (native tools: Read, Grep, Glob)
\`\`\`

**Detection:** If agent output is empty, contains only errors, or fallback function returns \`AGENT_FAILED\` — Claude performs the task itself.

**How Claude takes over:**`;

  if (tools === 'gemini' || tools === 'both') {
    section += `
- For Gemini tasks (text/data analysis): Claude reads files with Read tool and analyzes directly`;
  }
  if (tools === 'codex' || tools === 'both') {
    section += `
- For Codex tasks (code analysis): Claude uses Read + Grep + Glob to analyze code directly`;
  }

  section += `
- Announce takeover: \`⚡ Claude takeover — [agent type] agents failed, Claude devralıyor\`

**Do NOT silently skip failed agents.** Always announce the failure and takeover.`;

  if (tools === 'gemini' || tools === 'both') {
    section += `

**⚠️ Gemini is READ-ONLY** - cannot write files or run modifying commands.`;
  }

  if (tools === 'codex' || tools === 'both') {
    section += `

**⚠️ Codex defaults to READ-ONLY** - use \`workspace-write\` sandbox only when code changes are needed.`;
  }

  section += `

**Shell:** All CLI commands use bash syntax. Requires bash, Git Bash, or WSL on Windows.`;

  return section;
}

module.exports = buildClaudeMd;
