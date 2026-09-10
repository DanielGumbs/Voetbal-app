const { readFileSync } = require('node:fs');
const { checkProductionPush } = require('./release-safety.cjs');
const { git, runNpm } = require('./release-process.cjs');
try {
  checkProductionPush(readFileSync(0, 'utf8'), {
    git,
    approval: process.env.PRODUCTION_PUSH_APPROVAL,
    runChecks: () => runNpm('release:check'),
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
