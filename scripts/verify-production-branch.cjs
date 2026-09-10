const { execFileSync } = require('node:child_process');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('branch', '--show-current') !== 'production') {
  throw new Error('Publiceer productie vanaf de production-branch. Ontwikkel en test op main.');
}
if (git('status', '--porcelain')) {
  throw new Error('Commit alle wijzigingen voordat je productie publiceert.');
}
console.log(`Production release: ${git('rev-parse', '--short', 'HEAD')}`);
