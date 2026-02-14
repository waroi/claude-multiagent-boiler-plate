'use strict';

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

function banner() {
  console.log('');
  console.log(`  claude-agents-delegation v${pkg.version}`);
  console.log('  Multi-agent delegation for Claude Code');
  console.log('');
}

function writeFiles(files, targetDir) {
  let created = 0;
  for (const [relPath, content] of files) {
    const fullPath = path.join(targetDir, relPath);
    const dir = path.dirname(fullPath);

    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.error(`  Error creating directory ${dir}: ${err.message}`);
      continue;
    }

    if (fs.existsSync(fullPath)) {
      console.log(`  Skipped: ${relPath} (already exists)`);
      continue;
    }

    try {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`  Created: ${relPath}`);
      created++;
    } catch (err) {
      console.error(`  Error writing ${relPath}: ${err.message}`);
    }
  }
  return created;
}

function printSuccess(created, answers) {
  console.log('');
  console.log(`  Done! ${created} file${created !== 1 ? 's' : ''} created.`);
  console.log('');
  console.log('  Next steps:');

  let step = 1;
  if (answers.tools === 'gemini' || answers.tools === 'both') {
    console.log(`  ${step}. Install Gemini CLI: npm install -g @google/gemini-cli`);
    step++;
  }
  if (answers.tools === 'codex' || answers.tools === 'both') {
    console.log(`  ${step}. Install Codex CLI:  npm install -g @openai/codex`);
    step++;
  }

  const example = answers.tools === 'codex' ? 'analyze this project c3' :
                  answers.tools === 'gemini' ? 'analyze this project g3' :
                  'analyze this project x3';
  console.log(`  ${step}. Open Claude Code and try: "${example}"`);
  console.log('');
}

module.exports = { banner, writeFiles, printSuccess };
