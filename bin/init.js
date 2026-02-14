#!/usr/bin/env node
'use strict';

const { banner, writeFiles, printSuccess } = require('../src/utils');
const { promptUser, defaultAnswers } = require('../src/cli');
const { generateFiles } = require('../src/generator');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== 'init') {
    console.log('');
    console.log('  Usage: npx claude-agents-delegation init [--yes|-y]');
    console.log('');
    console.log('  Options:');
    console.log('    init         Generate delegation config files in current directory');
    console.log('    --yes, -y    Use defaults (both tools, full docs, English)');
    console.log('');
    process.exit(0);
  }

  banner();

  const useDefaults = args.includes('--yes') || args.includes('-y');
  const answers = useDefaults ? defaultAnswers() : await promptUser();

  if (!useDefaults) {
    console.log('');
  }

  const files = generateFiles(answers);
  const targetDir = process.cwd();
  const created = writeFiles(files, targetDir);

  printSuccess(created, answers);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
