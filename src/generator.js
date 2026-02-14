'use strict';

const buildClaudeMd = require('./templates/claude-md');
const buildSettingsLocal = require('./templates/settings-local');
const { investigatorFull, investigatorGeminiOnly } = require('./templates/investigator');
const geminiAgentsMd = require('./templates/gemini-agents');
const codexAgentsMd = require('./templates/codex-agents');

const usageEn = require('./docs/usage-en');
const usageTr = require('./docs/usage-tr');
const codexEn = require('./docs/codex-en');
const codexTr = require('./docs/codex-tr');
const geminiEn = require('./docs/gemini-en');
const geminiTr = require('./docs/gemini-tr');

function generateFiles(answers) {
  const { tools, docs, lang } = answers;
  const files = [];

  // Always: CLAUDE.md
  files.push(['CLAUDE.md', buildClaudeMd(tools)]);

  // Always: .claude/settings.local.json
  files.push(['.claude/settings.local.json', buildSettingsLocal(tools)]);

  // Investigator agent (gemini or both)
  if (tools === 'gemini' || tools === 'both') {
    const investigator = tools === 'both' ? investigatorFull : investigatorGeminiOnly;
    files.push(['.claude/agents/investigator.md', investigator]);
  }

  // Gemini agents skill (gemini or both)
  if (tools === 'gemini' || tools === 'both') {
    files.push(['.claude/commands/gemini_agents.md', geminiAgentsMd]);
  }

  // Codex agents skill (codex or both)
  if (tools === 'codex' || tools === 'both') {
    files.push(['.claude/commands/codex_agents.md', codexAgentsMd]);
  }

  // Documentation files (only if full docs selected)
  if (docs === 'full') {
    // Usage guide
    if (lang === 'en' || lang === 'both') {
      files.push(['USAGE.md', usageEn]);
    }
    if (lang === 'tr' || lang === 'both') {
      files.push(['KULLANIM.md', usageTr]);
    }

    // Codex integration docs (codex or both)
    if (tools === 'codex' || tools === 'both') {
      if (lang === 'en' || lang === 'both') {
        files.push(['codex-integration-en.md', codexEn]);
      }
      if (lang === 'tr' || lang === 'both') {
        files.push(['codex-integration.md', codexTr]);
      }
    }

    // Gemini integration docs (gemini or both)
    if (tools === 'gemini' || tools === 'both') {
      if (lang === 'en' || lang === 'both') {
        files.push(['Gemini-Integration-en.md', geminiEn]);
      }
      if (lang === 'tr' || lang === 'both') {
        files.push(['Gemini-Integration.md', geminiTr]);
      }
    }
  }

  return files;
}

module.exports = { generateFiles };
