const { spawnSync } = require('node:child_process');
const { deployProduction } = require('./release-safety.cjs');
const { git, runNpm } = require('./release-process.cjs');
try {
  deployProduction({
    git,
    approval: process.argv
      .slice(2)
      .find((arg) => arg.startsWith('--approve='))
      ?.slice('--approve='.length),
    runChecks: () => runNpm('release:check'),
    deploy: () => {
      const result = spawnSync(
        process.execPath,
        [
          require.resolve('firebase-tools/lib/bin/firebase'),
          'deploy',
          '--project',
          'voetbal-app-6fa54',
          '--only',
          'hosting,firestore:rules',
        ],
        { stdio: 'inherit' },
      );
      if (result.status !== 0) throw new Error('Productiedeploy mislukt.');
    },
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
