const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkProductionPush, deployProduction } = require('../scripts/release-safety.cjs');
const sha = 'a'.repeat(40);
const other = 'b'.repeat(40);
const update = (ref = 'production', target = sha) =>
  `refs/heads/main ${target} refs/heads/${ref} ${other}\n`;
function fixture() {
  const state = { head: sha, branch: 'production', status: '', checked: 0, deployed: 0 };
  const deps = {
    approval: sha,
    git: (command) =>
      ({ 'rev-parse': state.head, branch: state.branch, status: state.status })[command],
    runChecks: () => state.checked++,
    deploy: () => state.deployed++,
  };
  return { state, deps };
}
test('feature pushes do not trigger release checks', () => {
  const { state, deps } = fixture();
  checkProductionPush(update('feature/1'), deps);
  assert.equal(state.checked, 0);
});
test('production pushes test the exact approved clean commit', () => {
  const { state, deps } = fixture();
  checkProductionPush(update(), deps);
  assert.equal(state.checked, 1);
  assert.equal(state.deployed, 0);
});
test('wrong commit, dirty worktree, deletion and missing approval block pushes before tests', () => {
  for (const variant of ['head', 'dirty', 'delete', 'approval']) {
    const { state, deps } = fixture();
    if (variant === 'head') state.head = other;
    if (variant === 'dirty') state.status = ' M src/app/app.ts';
    if (variant === 'approval') deps.approval = undefined;
    assert.throws(() =>
      checkProductionPush(update('production', variant === 'delete' ? '0'.repeat(40) : sha), deps),
    );
    assert.equal(state.checked, 0);
  }
});
test('a failing check blocks both push and deployment', () => {
  const { state, deps } = fixture();
  deps.runChecks = () => {
    throw new Error('Test failed');
  };
  assert.throws(() => checkProductionPush(update(), deps), /Test failed/);
  assert.throws(() => deployProduction(deps), /Test failed/);
  assert.equal(state.deployed, 0);
});
test('changing source during tests blocks both push and deployment', () => {
  for (const operation of ['push', 'deploy']) {
    const { state, deps } = fixture();
    deps.runChecks = () => {
      state.head = other;
    };
    assert.throws(
      () => (operation === 'push' ? checkProductionPush(update(), deps) : deployProduction(deps)),
      /exacte/,
    );
    assert.equal(state.deployed, 0);
  }
});
test('deployment requires production branch and approval before checks', () => {
  for (const variant of ['branch', 'approval']) {
    const { state, deps } = fixture();
    if (variant === 'branch') state.branch = 'feature/1';
    else deps.approval = undefined;
    assert.throws(() => deployProduction(deps));
    assert.equal(state.checked, 0);
    assert.equal(state.deployed, 0);
  }
});
test('deployment runs only after successful checks', () => {
  const { state, deps } = fixture();
  deps.deploy = () => {
    assert.equal(state.checked, 1);
    state.deployed++;
  };
  deployProduction(deps);
  assert.equal(state.deployed, 1);
});
