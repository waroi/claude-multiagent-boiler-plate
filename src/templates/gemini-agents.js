'use strict';

const geminiAgentsMd = `---
description: Delegate read-only analysis tasks to Gemini CLI agents
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [task description]
---

# Gemini Agents - Cheap Bulk Analysis

**Triggered by:** \`g\`, \`g2\`, \`g3\`, \`g5\` at end of command, or \`/gemini_agents\`

This skill runs parallel Gemini CLI calls for bulk read-only analysis. Gemini is cheap - use it for tedious work.

## STEP 1: Announce with Blue Indicator (REQUIRED)

**You MUST announce activation before doing anything else:**

🔵 **3 Gemini agents activated**

- Gemini 1: [what this agent will analyze]
- Gemini 2: [what this agent will analyze]
- Gemini 3: [what this agent will analyze]

**Parse the shorthand:**

- \`g\` or \`g3\` → 3 Gemini agents (default)
- \`g2\` → 2 Gemini agents
- \`g5\` → 5 Gemini agents

## STEP 2: Gather the Data

Before running Gemini, gather the data it will analyze:

\`\`\`bash

# Option A: Download from cloud storage to temp folder

aws s3 sync s3://your-bucket/data/ /tmp/data/ --profile your-profile

# Option B: Use already-available local files

ls /path/to/local/files/*.json

# Option C: Stream directly without saving (single file)

aws s3 cp s3://your-bucket/file.json - --profile your-profile | gemini -p "..." -o text 2>/dev/null
\`\`\`

## STEP 3: Run Gemini CLI Commands (REQUIRED)

**You MUST actually run Gemini CLI commands. This is the whole point.**

### Single Gemini Agent (g or g1)

\`\`\`bash
cat /tmp/data/*.json | gemini -p "Analyze these files. Find:

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
(cat /tmp/data/batch3*.json | gemini -p "Check batch 3 for errors" -o text 2>/dev/null > /tmp/g3.txt) &

wait # Wait for all to complete

# Show results

echo "=== Gemini 1 ===" && cat /tmp/g1.txt
echo "=== Gemini 2 ===" && cat /tmp/g2.txt
echo "=== Gemini 3 ===" && cat /tmp/g3.txt
\`\`\`

### Automatic Batch Splitting (for large file sets)

\`\`\`bash
FILES=($(ls /tmp/data/*.json))
TOTAL=\${#FILES[@]}
BATCH=$((TOTAL / 3 + 1))

(cat \${FILES[@]:0:$BATCH} | gemini -p "Analyze batch 1..." -o text 2>/dev/null > /tmp/g1.txt) &
(cat \${FILES[@]:$BATCH:$BATCH} | gemini -p "Analyze batch 2..." -o text 2>/dev/null > /tmp/g2.txt) &
(cat \${FILES[@]:$((BATCH*2)):$BATCH} | gemini -p "Analyze batch 3..." -o text 2>/dev/null > /tmp/g3.txt) &
wait
\`\`\`

### Automatic Model Fallback

\`\`\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"

    # Primary: Gemini Pro
    result=$(echo "$input" | gemini -m gemini-pro -p "$prompt" -o text 2>&1)

    # Fallback 1: Gemini 2.5 Pro (if quota/error)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted\\|error"; then
        result=$(echo "$input" | gemini -m gemini-2.5-pro -p "$prompt" -o text 2>&1)
    fi

    # Fallback 2: Gemini Flash (if still failing)
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted\\|error"; then
        result=$(echo "$input" | gemini -m gemini-flash -p "$prompt" -o text 2>&1)
    fi

    # All models failed → signal for Claude takeover
    if [ -z "$result" ] || echo "$result" | grep -qi "quota\\|rate.limit\\|resource.exhausted\\|error"; then
        echo "AGENT_FAILED"
        return 1
    fi

    echo "$result"
}

# Usage:
gemini_with_fallback "Analyze this data for errors" "$(cat /tmp/data/*.json)"
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

- Gemini 1: \`cat batch1.json | gemini -p "..." -o text\`
- Gemini 2: \`cat batch2.json | gemini -p "..." -o text\`
- Gemini 3: \`cat batch3.json | gemini -p "..." -o text\`

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

When the user says something like \`check data x2 g5\`:

1. First announce both:

✅ **2 subagents activated**

- Agent 1: [Claude task requiring judgment]
- Agent 2: [Claude task requiring judgment]

🔵 **5 Gemini agents activated**

- Gemini 1-5: [bulk analysis tasks]

2. Run Claude subagents for judgment/multi-step/writes
3. Run Gemini agents via Bash CLI for bulk analysis
4. Synthesize all results

## Graceful Degradation

**If all Gemini models fail (output is empty or contains \`AGENT_FAILED\`):**

⚡ **Claude takes over** — perform the analysis yourself using native tools:

1. Announce: \`⚡ Claude takeover — Gemini agents failed, Claude devralıyor\`
2. Read the data files using the Read tool
3. Analyze the content directly
4. Report findings with the same format as Gemini would

**Degradation chain:**
\`\`\`
gemini-pro → gemini-2.5-pro → gemini-flash → ⚡ Claude takeover
\`\`\`

**Do NOT skip failed agents silently.** Always announce which agents failed and that Claude is taking over.

## Error Handling

**If Gemini fails:**

1. Check if data is too large (token limit) → split into smaller chunks
2. Check if \`gemini\` is in PATH → \`which gemini\`
3. Try with smaller sample first

**If response is cut off:**

- Data too large → use more Gemini agents with smaller batches
- Add \`| head -c 50000\` to limit input size
`;

module.exports = geminiAgentsMd;
