## Gemini Delegation

**When the user says "use gemini"**, offload bulk analysis to Gemini CLI:

```bash
cat data.json | gemini -p "Analyze this" -o text 2>/dev/null
```

**Appropriate for Gemini:** Bulk file analysis, pattern finding, summarization, data validation, log analysis, code review of large diffs

**Keep with Claude:** File writes, multi-step work, final decisions, deployments, anything requiring judgment

**Gemini is READ-ONLY** - it cannot write files or run modifying commands.

## Codex Delegation

**When the user says "use codex"**, offload simple code tasks and analysis to Codex CLI:

```bash
codex exec -s read-only "Analyze this code for bugs" -o /tmp/codex_out.txt
```

**Appropriate for Codex:** Simple code generation, bug fixing, refactoring, test writing, code review, code analysis

**Keep with Claude:** Complex multi-step work, final decisions, deployments, architecture decisions

**Codex sandbox modes:** `read-only` for analysis, `workspace-write` for code changes

## Shorthands - Parallel Agents

**Number after letter = agent count. Letter alone defaults to 3.**

| Shorthand  | Claude | Gemini | Codex | Total |
| ---------- | ------ | ------ | ----- | ----- |
| `x3`       | 1      | 2      | 0     | 3     |
| `x5`       | 1      | 4      | 0     | 5     |
| `c` / `c3` | 0      | 0      | 3     | 3     |
| `c2`       | 0      | 0      | 2     | 2     |
| `c5`       | 0      | 0      | 5     | 5     |
| `g` / `g3` | 0      | 3      | 0     | 3     |
| `g2`       | 0      | 2      | 0     | 2     |
| `g5`       | 0      | 5      | 0     | 5     |

**Combine freely:** `analyze code x3 c3` = 1 Claude + 2 Gemini + 3 Codex = 6 agents

**Announce with emojis:** ✅ = Claude subagents, 🔵 = Gemini agents, 🟠 = Codex agents

**Gemini fallback:** gemini-pro → gemini-2.5-pro → gemini-flash → ⚡ Claude takeover

**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude takeover

## Graceful Degradation

**When agents fail (credit/rate limits), Claude Code takes over automatically.**

**Degradation chain:**

```
Agent CLI (primary model)
  → Fallback 1 (cheaper model)
    → Fallback 2 (cheapest model)
      → ⚡ Claude Code takeover (native tools: Read, Grep, Glob)
```

**Detection:** If agent output is empty, contains only errors, or fallback function returns `AGENT_FAILED` — Claude performs the task itself.

**How Claude takes over:**
- For Gemini tasks (text/data analysis): Claude reads files with Read tool and analyzes directly
- For Codex tasks (code analysis): Claude uses Read + Grep + Glob to analyze code directly
- Announce takeover: `⚡ Claude takeover — [agent type] agents failed, Claude devralıyor`

**Do NOT silently skip failed agents.** Always announce the failure and takeover.

**⚠️ Gemini is READ-ONLY** - cannot write files or run modifying commands.

**⚠️ Codex defaults to READ-ONLY** - use `workspace-write` sandbox only when code changes are needed.

**Shell:** All CLI commands use bash syntax. Requires bash, Git Bash, or WSL on Windows.

## Proactive Subagents

These trigger automatically - announce with ✅ emoji:

| Subagent       | Triggers When                                         |
| -------------- | ----------------------------------------------------- |
| `investigator` | When `x3` or `x5` shorthand is used (Claude+Gemini)  |
