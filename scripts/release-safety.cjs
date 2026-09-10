function assertTarget({ target, head, status, approval }) {
  if (!/^[a-f0-9]{40}$/.test(target) || /^0+$/.test(target)) {
    throw new Error(
      'Een productiebranch verwijderen of een ongeldige versie publiceren is geblokkeerd.',
    );
  }
  if (target !== head) throw new Error('Check eerst de exacte te publiceren commit uit.');
  if (status.trim()) throw new Error('Commit alle wijzigingen voordat je productie controleert.');
  if (approval !== target) {
    throw new Error(
      `Expliciete toestemming vereist voor productiecommit ${target}. Zie docs/release-1.md.`,
    );
  }
}

function checkProductionPush(input, { git, approval, runChecks }) {
  const updates = input
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(/\s+/));
  const production = updates.filter((parts) => parts[2] === 'refs/heads/production');
  if (!production.length) return;
  if (production.length !== 1 || production[0].length !== 4)
    throw new Error('Ongeldige productiepush.');
  const target = production[0][1];
  const verify = () =>
    assertTarget({
      target,
      approval,
      head: git('rev-parse', 'HEAD'),
      status: git('status', '--porcelain'),
    });
  verify();
  runChecks();
  verify();
}

function deployProduction({ git, approval, runChecks, deploy }) {
  const target = git('rev-parse', 'HEAD');
  const verify = () => {
    if (git('branch', '--show-current') !== 'production')
      throw new Error('Deploy productie alleen vanaf de production-branch.');
    assertTarget({
      target,
      approval,
      head: git('rev-parse', 'HEAD'),
      status: git('status', '--porcelain'),
    });
  };
  verify();
  runChecks();
  verify();
  deploy();
}
module.exports = { checkProductionPush, deployProduction };
