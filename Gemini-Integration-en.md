# Gemini CLI Integration Guide

A comprehensive guide for using Gemini CLI as a low-cost, parallel analysis layer within Claude Code. Gemini handles large-scale read-only jobs. Claude handles evaluation, decision-making, and file writing.

> **Note:** This guide covers the Gemini layer. For code-focused tasks, Codex CLI integration is also available — see `codex-integration.md`. Three-layer architecture: Gemini (🔵 text/data) + Codex (🟠 code) + Claude (✅ decisions).

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Prerequisites](#2-prerequisites)
3. [Setup Overview](#3-setup-overview)
4. [CLAUDE.md Configuration](#4-claudemd-configuration)
5. [Investigator Agent](#5-investigator-agent)
6. [Gemini Agents Skill](#6-gemini-agents-skill)
7. [Fallback Function](#7-fallback-function)
8. [Usage Patterns and Examples](#8-usage-patterns-and-examples)
9. [Integrating into Your Own Agents](#9-integrating-into-your-own-agents)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Philosophy

This guide focuses on the Gemini layer. The complete architecture is a **three-layer delegation model** (Gemini + Codex + Claude). The Gemini layer:

| Role                | Claude Code                                          | Gemini CLI                                      |
| ------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **Purpose**         | Evaluation, decisions, writing                       | Comprehensive analysis, pattern finding         |
| **Cost**            | Higher                                               | Much cheaper                                    |
| **Capabilities**    | Full (read + write + execute)                        | Read-only analysis                              |
| **Best suited for** | Multi-step tasks, final decisions, file edits        | Scanning 50+ files, summarization, data validation |

**Pattern:**

1. Gather data (download files, stream from cloud storage)
2. Pipe data to Gemini CLI with specific prompt
3. Claude verifies Gemini's findings (spot-checks 1-2 items)
4. Claude makes final decision and reports

**Why this works:**

- Gemini CLI is practically free for bulk text analysis
- Claude tokens are expensive. Don't waste them reading 100 JSON files
- Gemini can run in parallel (multiple background jobs)
- Claude provides the evaluation layer that Gemini cannot

---

## 2. Prerequisites

### Install Gemini CLI

```bash
npm install -g @google/gemini-cli
```

Or follow Google's latest installation instructions.

### Verify Installation

```bash
which gemini        # Should return a path
gemini --version    # Should show version
```

### Authentication

Gemini CLI requires Google Cloud authentication. Run:

```bash
gemini  # First run will redirect for auth
```

Complete the browser-based authentication flow. After authentication, the CLI will work in every terminal session.

### Verify It Works

```bash
echo "Hello, what is 2+2?" | gemini -p "Answer this question" -o text 2>/dev/null
```

You should get a response containing "4".

---

## 3. Setup Overview

You need to create or modify these files in your project:

```
your-project/
  CLAUDE.md                         # Add Gemini delegation rules
  .claude/
    agents/
      investigator.md               # Investigation subagent (Gemini-first)
    commands/
      gemini_agents.md              # Bulk Gemini analysis skill
```

The rest of this document provides exact contents for each file.

---

## 4. `CLAUDE.md` Configuration

Add the following sections to your project's `CLAUDE.md` file. This tells Claude Code when and how to delegate to Gemini.

### Section 1: Gemini Delegation Rules

```markdown
## Gemini Delegation

**When the user says "use gemini"**, offload bulk analysis to Gemini CLI:

\`\`\`bash
cat data.json | gemini -p "Analyze this" -o text 2>/dev/null
\`\`\`

**Appropriate for Gemini:** Bulk file analysis, pattern finding, summarization, data validation, log analysis, code review of large diffs

**Keep with Claude:** File writes, multi-step work, final decisions, deployments, anything requiring judgment

**Gemini is READ-ONLY** - it cannot write files or run modifying commands.
```

### Section 2: Parallel Agent Shorthand ("x" commands)

```markdown
## "x" Shorthand - Parallel Agents

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

**Gemini fallback:** gemini-pro → gemini-2.5-pro → gemini-flash

**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini

**⚠️ Gemini is READ-ONLY** - cannot write files or run modifying commands.

**⚠️ Codex defaults to READ-ONLY** - use `workspace-write` sandbox only when code changes are needed.
```

### Section 3: Proactive Agents (Optional)

If you have specific agents that should use Gemini, list them here:

```markdown
## Proactive Subagents

These trigger automatically - announce with ✅ emoji:

| Subagent       | Triggers When                                  |
| -------------- | ---------------------------------------------- |
| `investigator` | When `x3` or `x5` shorthand is used (Claude+Gemini) |
```

---

## 5. Investigator Agent

Create this file at `.claude/agents/investigator.md`. This is the main subagent that uses Gemini for bulk analysis.

```markdown
---
name: investigator
description: General investigation agent spawned via "x" shorthand. Uses Gemini CLI for bulk analysis, Claude for verification and judgment.
tools: Read, Bash, Glob, Grep
model: sonnet
---

# Investigator Agent

You are an investigation subagent spawned to analyze a specific aspect of a task. You use Gemini CLI for bulk work and verify findings before reporting.

## FIRST: Announce Yourself

**Always start by announcing to the user:**

✅ **Investigator** - [Your assigned task]...

## Your Task

You were given a specific investigation task. Focus only on that task and report findings.

## GEMINI-FIRST APPROACH

**Always use Gemini CLI for bulk reading/analysis.** You verify Gemini's output, you don't do the bulk work yourself.

### The Pattern

1. Gather data (download/stream files)
2. Pipe to Gemini with specific prompt
3. Verify Gemini's findings (spot-check 1-2 items)
4. Report back

## Gemini CLI Usage (with Automatic Fallback)

When quota is exceeded, automatically fall back to the next model:

\`\`\`bash

# Helper function - define at start of any investigation

gemini_with_fallback() {
local prompt="$1"
local input="$2"

    # Primary: Gemini Pro
    result=$(echo "$input" | gemini -m gemini-pro -p "$prompt" -o text 2>&1)

    # Fallback 1: Gemini 2.5 Pro (if quota/error)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-2.5-pro -p "$prompt" -o text 2>&1)
    fi

    # Fallback 2: Gemini Flash (if still failing)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-flash -p "$prompt" -o text 2>&1)
    fi

    echo "$result"

}

# Usage examples:

# Single local file

gemini_with_fallback "Analyze this for errors" "$(cat file.json)"

# Multiple files

gemini_with_fallback "Check all these for issues" "$(cat /tmp/data/\*.json)"

# Stream from cloud storage (no local download)

gemini_with_fallback "Find problems" "$(aws s3 cp s3://your-bucket/file.json - --profile your-profile)"
\`\`\`

**Always use:**

- `-o text` for clean output
- The fallback function to handle quota limits automatically

## What Gemini Does vs What You Do

| Gemini (Bulk Work) | You (Verification & Judgment) |
| ------------------ | ----------------------------- |
| Read all files     | Spot-check 1-2 files          |
| Find patterns      | Verify patterns are real      |
| List issues        | Confirm issues exist          |
| Summarize data     | Judge severity/priority       |
| Compare files      | Decide what matters           |

## Investigation Types

### File Analysis

\`\`\`bash
gemini_with_fallback "Analyze these files. Find:

1. Files with missing required fields
2. Suspicious values (nulls, zeros, negatives)
3. Any error indicators
   List issues by filename." "$(cat /tmp/data/\*.json)"
   \`\`\`

### Code Analysis

\`\`\`bash
gemini_with_fallback "Review this code for:

1. Bugs related to [SPECIFIC ISSUE]
2. Edge cases not handled
3. Logic errors
   Be specific - cite line numbers or function names." "$(cat /path/to/file.py)"
   \`\`\`

### Log Analysis

\`\`\`bash
gemini_with_fallback "Find error patterns in these logs:

1. Recurring errors (group by type)
2. Timing issues or timeouts
3. Failed operations with context
   Summarize patterns, don't list every line." "$(cat /tmp/logs.txt)"
   \`\`\`

### Data Validation

\`\`\`bash
gemini_with_fallback "Validate this data:

1. All dates between 2000-2030
2. Amounts must be positive numbers
3. Required fields: name, date, amount
   Report violations only, grouped by rule." "$(cat data.json)"
   \`\`\`

### Comparison

\`\`\`bash
gemini_with_fallback "Compare these two versions. List all differences:

- Added items
- Removed items
- Changed values
  Be specific with field names and values." "$(echo '=== OLD ===' && cat old.json && echo '=== NEW ===' && cat new.json)"
  \`\`\`

## Verification Step

After Gemini returns findings, **always verify 1-2 items**:

\`\`\`bash

# Example: Gemini says "file_abc.json has missing fields"

# Verify by reading that file yourself

cat /tmp/data/file_abc.json | jq '.required_field'
\`\`\`

If Gemini's finding is wrong, note it. If correct, trust the rest of the analysis.

## Report Format

Keep reports concise:

**[Your assigned task]**

Findings:

- [Issue 1] - verified
- [Issue 2] - verified
- [Issue 3] - from Gemini analysis

Verified: [which items you spot-checked]

Recommendation: [if applicable]

## Rules

1. **Gemini first** - Don't read files one by one. Pipe to Gemini.
2. **Verify before reporting** - Spot-check at least 1 finding
3. **Stay focused** - Only investigate your assigned task
4. **Be concise** - Report findings, not process
5. **No code changes** - Investigation only, no fixes
```

---

## 6. Gemini Agents Skill

Create this file at `.claude/commands/gemini_agents.md`. This provides users with the `/gemini_agents` slash command and shorthand triggers.

```markdown
---
description: Delegate read-only analysis tasks to Gemini CLI agents
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [task description]
---

# Gemini Agents - Cheap Bulk Analysis

**Triggered by:** `g`, `g2`, `g3`, `g5` at end of command, or `/gemini_agents`

This skill runs parallel Gemini CLI calls for bulk read-only analysis. Gemini is cheap - use it for tedious work.

## STEP 1: Announce with Blue Indicator (REQUIRED)

**You MUST announce activation before doing anything else:**

🔵 **3 Gemini agents activated**

- Gemini 1: [what this agent will analyze]
- Gemini 2: [what this agent will analyze]
- Gemini 3: [what this agent will analyze]

**Parse the shorthand:**

- `g` or `g3` → 3 Gemini agents (default)
- `g2` → 2 Gemini agents
- `g5` → 5 Gemini agents

## STEP 2: Gather the Data

Before running Gemini, gather the data it will analyze:

\`\`\`bash

# Option A: Download from cloud storage to temp folder

aws s3 sync s3://your-bucket/data/ /tmp/data/ --profile your-profile

# Option B: Use already-available local files

ls /path/to/local/files/\*.json

# Option C: Stream directly without saving (single file)

aws s3 cp s3://your-bucket/file.json - --profile your-profile | gemini -p "..." -o text 2>/dev/null
\`\`\`

## STEP 3: Run Gemini CLI Commands (REQUIRED)

**You MUST actually run Gemini CLI commands. This is the whole point.**

### Single Gemini Agent (g or g1)

\`\`\`bash
cat /tmp/data/\*.json | gemini -p "Analyze these files. Find:

1. Records with missing required fields
2. Suspicious or invalid values
3. Any errors or null values
   List issues only, be concise." -o text 2>/dev/null
   \`\`\`

### Multiple Gemini Agents (g2, g3, g5)

Run in parallel using background jobs:

\`\`\`bash

# Split data and run in parallel

(cat /tmp/data/batch1*.json | gemini -p "Check batch 1 for errors" -o text 2>/dev/null > /tmp/g1.txt) &
(cat /tmp/data/batch2*.json | gemini -p "Check batch 2 for errors" -o text 2>/dev/null > /tmp/g2.txt) &
(cat /tmp/data/batch3\*.json | gemini -p "Check batch 3 for errors" -o text 2>/dev/null > /tmp/g3.txt) &

wait # Wait for all to complete

# Show results

echo "=== Gemini 1 ===" && cat /tmp/g1.txt
echo "=== Gemini 2 ===" && cat /tmp/g2.txt
echo "=== Gemini 3 ===" && cat /tmp/g3.txt
\`\`\`

### Automatic Batch Splitting (for large file sets)

\`\`\`bash
FILES=($(ls /tmp/data/*.json))
TOTAL=${#FILES[@]}
BATCH=$((TOTAL / 3 + 1))

(cat ${FILES[@]:0:$BATCH} | gemini -p "Analyze batch 1..." -o text 2>/dev/null > /tmp/g1.txt) &
(cat ${FILES[@]:$BATCH:$BATCH} | gemini -p "Analyze batch 2..." -o text 2>/dev/null > /tmp/g2.txt) &
(cat ${FILES[@]:$((BATCH\*2)):$BATCH} | gemini -p "Analyze batch 3..." -o text 2>/dev/null > /tmp/g3.txt) &
wait
\`\`\`

### CLI Syntax Reference

\`\`\`bash

# Always use these flags

gemini -p "prompt" -o text 2>/dev/null

# -p = prompt

# -o text = clean text output (not JSON)

# 2>/dev/null = suppress stderr noise

# Specify model explicitly

gemini -m gemini-pro -p "prompt" -o text 2>/dev/null
\`\`\`

## STEP 4: Report Results (REQUIRED FORMAT)

**Your report MUST include the Gemini commands you ran:**

🔵 **Gemini Analysis Complete**

**Commands ran:**

- Gemini 1: `cat batch1.json | gemini -p "..." -o text`
- Gemini 2: `cat batch2.json | gemini -p "..." -o text`
- Gemini 3: `cat batch3.json | gemini -p "..." -o text`

**Findings:**

- [Issue 1 from Gemini]
- [Issue 2 from Gemini]
- [Issue 3 from Gemini]

**Summary:** [Brief synthesis of what Gemini found]

## What Gemini Is Good For

| Task               | Example Prompt                         |
| ------------------ | -------------------------------------- |
| Bulk file analysis | "Check all 50 JSONs for errors"        |
| Pattern finding    | "Find records with missing fields"     |
| Summarization      | "Summarize these 10 documents"         |
| Comparison         | "Compare old vs new, list differences" |
| Data validation    | "Check all dates are valid"            |
| Log analysis       | "Find error patterns in these logs"    |
| Code review        | "Review this diff for bugs"            |

## What Gemini Cannot Do (Use Claude Instead)

- Write files
- Run commands with side effects
- Make final decisions
- Deploy or delete anything
- Multi-step autonomous work

## Combining with Claude Subagents (x2 g5)

When the user says something like `check data x2 g5`:

1. First announce both:

✅ **2 subagents activated**

- Agent 1: [Claude task requiring judgment]
- Agent 2: [Claude task requiring judgment]

🔵 **5 Gemini agents activated**

- Gemini 1-5: [bulk analysis tasks]

2. Run Claude subagents for judgment/multi-step/writes
3. Run Gemini agents via Bash CLI for bulk analysis
4. Synthesize all results

## Error Handling

**If Gemini fails:**

1. Check if data is too large (token limit) → split into smaller chunks
2. Check if `gemini` is in PATH → `which gemini`
3. Try with smaller sample first

**If response is cut off:**

- Data too large → use more Gemini agents with smaller batches
- Add `| head -c 50000` to limit input size
```

---

## 7. Fallback Function

This is the reusable core bash function. It tries three Gemini models sequentially when there's a rate limit or quota error.

```bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"

    # Primary: Gemini Pro (best quality)
    result=$(echo "$input" | gemini -m gemini-pro -p "$prompt" -o text 2>&1)

    # Fallback 1: Gemini 2.5 Pro (if quota/error)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-2.5-pro -p "$prompt" -o text 2>&1)
    fi

    # Fallback 2: Gemini Flash (if still failing - fastest, cheapest)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-flash -p "$prompt" -o text 2>&1)
    fi

    # All models failed → signal for Claude takeover
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        echo "AGENT_FAILED"
        return 1
    fi

    echo "$result"
}
```

### How It Works

1. First tries **Gemini Pro** (best quality)
2. If it returns empty or rate-limits, falls back to **Gemini 2.5 Pro**
3. If still failing, falls back to **Gemini Flash** (fastest, cheapest)
4. If all fail, returns `AGENT_FAILED` → **Claude Code automatically takes over**
5. Catches errors with these patterns: empty output, "quota", "rate.limit", "resource.exhausted"

### Graceful Degradation

If all three Gemini models fail, Claude Code automatically takes over the task:

**Degradation chain:**
```
gemini-pro → gemini-2.5-pro → gemini-flash → ⚡ Claude Code takeover
```

**How it works:**
1. `gemini_with_fallback()` function tries 3 models
2. If all fail, returns `AGENT_FAILED`
3. Claude Code detects this and does the task itself (using Read, Grep, Glob tools)
4. Announcement: `⚡ Claude takeover — Gemini agents failed, Claude taking over`

**Important:** Failed agents are not silently skipped. Errors and takeover are always announced.

### Usage

```bash
# First define the function, then use it:
gemini_with_fallback "Summarize this data" "$(cat large-file.json)"
gemini_with_fallback "Find bugs in this code" "$(cat src/main.py)"
gemini_with_fallback "Compare these two files" "$(echo '=== A ===' && cat a.json && echo '=== B ===' && cat b.json)"
```

### Updating Model Names

Google periodically updates model names. To update the fallback chain, change these three model names:

- `gemini-pro` → primary Pro model
- `gemini-2.5-pro` → stable Pro fallback
- `gemini-flash` → fastest and cheapest Flash model

List current models like this:

```bash
gemini --list-models 2>/dev/null
```

---

## 8. Usage Patterns and Examples

### Pattern 1: Single File Analysis

```bash
cat report.json | gemini -p "Analyze this report for anomalies" -o text 2>/dev/null
```

### Pattern 2: Analyzing Multiple Files at Once

```bash
cat /tmp/data/*.json | gemini -p "Check all records for missing fields" -o text 2>/dev/null
```

### Pattern 3: Streaming from Cloud Storage (No Local Download)

```bash
# AWS S3
aws s3 cp s3://your-bucket/data.json - --profile your-profile | \
  gemini -p "Analyze this" -o text 2>/dev/null

# Google Cloud Storage
gsutil cat gs://your-bucket/data.json | \
  gemini -p "Analyze this" -o text 2>/dev/null
```

### Pattern 4: Comparing Two Files

```bash
(cat old_version.json; echo "---SEPARATOR---"; cat new_version.json) | \
  gemini -p "Compare OLD (before separator) vs NEW (after separator). List all differences." -o text 2>/dev/null
```

### Pattern 5: Parallel Batch Processing

```bash
# Split files into 3 parallel Gemini calls
(cat batch1/*.json | gemini -p "Analyze batch 1" -o text 2>/dev/null > /tmp/g1.txt) &
(cat batch2/*.json | gemini -p "Analyze batch 2" -o text 2>/dev/null > /tmp/g2.txt) &
(cat batch3/*.json | gemini -p "Analyze batch 3" -o text 2>/dev/null > /tmp/g3.txt) &
wait

cat /tmp/g1.txt /tmp/g2.txt /tmp/g3.txt
```

### Pattern 6: Code Review

```bash
git diff HEAD~5 | gemini -p "Review this diff for:
1. Bugs introduced
2. Edge cases missed
3. Security issues
Be specific with file names and line references." -o text 2>/dev/null
```

### Pattern 7: Log Analysis

```bash
cat /var/log/app.log | gemini -p "Find error patterns:
1. Group recurring errors by type
2. Identify timing patterns
3. Flag critical failures
Summarize, don't list every line." -o text 2>/dev/null
```

---

## 9. Integrating into Your Own Agents

You can add Gemini delegation to any custom Claude Code agent. Template:

### Template for Any Agent with Gemini Delegation

Add this section to any `.claude/agents/your-agent.md` file:

```markdown
## GEMINI DELEGATION

Gemini does bulk analysis. You verify findings and make decisions.

### Gemini Fallback Function

Always define this at the start of your bash session:

\`\`\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"
    result=$(echo "$input" | gemini -m gemini-pro -p "$prompt" -o text 2>&1)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-2.5-pro -p "$prompt" -o text 2>&1)
    fi
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-flash -p "$prompt" -o text 2>&1)
    fi
    echo "$result"
}
\`\`\`

### Workflow

1. Gather data relevant to your task
2. Pipe to Gemini with a specific, focused prompt
3. Verify 1-2 findings from Gemini's output
4. Use verified findings to make your decision
```

### Example: Code Impact Analysis Agent

```markdown
---
name: impact-checker
description: Checks code change impact before modifications
tools: Read, Bash, Glob, Grep
model: sonnet
---

# Impact Checker

## Gemini Delegation

\`\`\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"
    result=$(echo "$input" | gemini -m gemini-pro -p "$prompt" -o text 2>&1)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-2.5-pro -p "$prompt" -o text 2>&1)
    fi
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted"; then
        result=$(echo "$input" | gemini -m gemini-flash -p "$prompt" -o text 2>&1)
    fi
    echo "$result"
}
\`\`\`

## Steps

1. **Identify files being changed**
2. **Gemini scans dependencies:**
   \`\`\`bash
   # Find what imports/uses the changed files
   grep -r "import.*module_name\\|from.*module_name" /path/to/project/ > /tmp/deps.txt
   gemini_with_fallback "Analyze these dependencies and assess impact" "$(cat /tmp/deps.txt)"
   \`\`\`
3. **Verify** - Check 1-2 dependent files
4. **Report** risk level: LOW / MEDIUM / HIGH
```

### Example: Monitoring/Validation Agent (with Gemini Delegation)

In monitoring or validation workflows, you can delegate specific validation steps to Gemini:

```markdown
## Gemini Delegation Points

| Step | Task        | Gemini Does                  | Claude Verifies              |
| ---- | ----------- | ---------------------------- | ---------------------------- |
| 3    | Data Review | Scan all files for anomalies | Confirm critical issues      |
| 5    | Comparison  | Compare source to output     | Review flagged discrepancies |
| 7    | Coverage    | Track items through pipeline | Verify counts match          |
```

Within each step:

```bash
gemini_with_fallback "Your verification prompt here" "$(cat /tmp/verification_data.json)"
```

---

## 10. Troubleshooting

### Gemini Returns Empty Output

```bash
# Check if gemini is installed
which gemini

# Check if auth is working
echo "test" | gemini -p "Reply with OK" -o text 2>&1

# Check if model is available
gemini --list-models 2>/dev/null | grep pro
```

### Data Too Large (Token Limit Exceeded)

```bash
# Limit input size
cat huge-file.json | head -c 100000 | gemini -p "..." -o text 2>/dev/null

# Or split across multiple agents
split -n 3 huge-file.json /tmp/chunk_
(cat /tmp/chunk_aa | gemini -p "..." -o text 2>/dev/null > /tmp/g1.txt) &
(cat /tmp/chunk_ab | gemini -p "..." -o text 2>/dev/null > /tmp/g2.txt) &
(cat /tmp/chunk_ac | gemini -p "..." -o text 2>/dev/null > /tmp/g3.txt) &
wait
```

### Rate Limit on All Models

If all three fallback models fail:

1. Wait 60 seconds and try again
2. Reduce input size
3. Use fewer parallel agents
4. Fall back to Claude for that specific analysis

### Response Getting Cut Off

- Input too large. Limit with `| head -c 50000`
- Or split into smaller chunks and use more Gemini calls
- Use more parallel agents with smaller batches

### Wrong Model Name

Model names change as Google releases new versions. Check current names:

```bash
gemini --list-models 2>/dev/null
```

Update the three model names in the fallback function accordingly.

---

## Quick Start Checklist

- [ ] Install Gemini CLI: `npm install -g @google/gemini-cli`
- [ ] Authenticate: Run `gemini` and follow redirects
- [ ] Verify: `echo "test" | gemini -p "Say hello" -o text 2>/dev/null`
- [ ] Add Gemini delegation section to your `CLAUDE.md`
- [ ] Add "x" shorthand section to your `CLAUDE.md`
- [ ] Create `.claude/agents/investigator.md` (copy from Section 5)
- [ ] Create `.claude/commands/gemini_agents.md` (copy from Section 6)
- [ ] Test: Ask Claude Code to "analyze my src folder x3"

---

## Core Concepts Summary

| Concept                               | Meaning                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `gemini -p "..." -o text 2>/dev/null` | Basic Gemini CLI call                                   |
| `gemini_with_fallback()`              | Automatic fallback across 3 models                      |
| `x3` / `x5`                           | Creates parallel agents (Claude + Gemini)               |
| `g` / `g3` / `g5`                     | Creates Gemini agents only (no Claude)                  |
| ✅ emoji                              | Claude subagent indicator                               |
| 🔵 emoji                              | Gemini agent indicator                                  |
| Verify pattern                        | Gemini finds issues, Claude spot-checks 1-2             |
| Background jobs                       | Parallel Gemini calls with `(...) &` and `wait`         |
| `AGENT_FAILED`                        | All models failed → Claude takeover signal              |
| ⚡ Claude takeover                    | Claude taking over when agents fail                     |
