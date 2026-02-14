'use strict';

function buildSettingsLocal(tools) {
  const allow = [
    'Bash(where:*)',
    'Bash(python:*)',
    'Bash(dir:*)',
    'Bash(find:*)'
  ];

  if (tools === 'gemini' || tools === 'both') {
    allow.push('Bash(gemini:*)');
  }
  if (tools === 'codex' || tools === 'both') {
    allow.push('Bash(codex:*)');
  }

  const settings = {
    permissions: {
      allow: allow
    }
  };

  return JSON.stringify(settings, null, 2) + '\n';
}

module.exports = buildSettingsLocal;
