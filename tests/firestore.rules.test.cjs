const { readFileSync } = require('node:fs');
const { before, after, beforeEach, test } = require('node:test');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
let env;
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw new Error('Only the local Firestore emulator is allowed.');
  env = await initializeTestEnvironment({
    projectId: 'demo-voetbal-e2e',
    firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/admin'), { email: 'daniel.r.gumbs@gmail.com', isAdmin: true });
    await setDoc(doc(db, 'users/member'), { email: 'member@example.test', isAdmin: false });
    await setDoc(doc(db, 'seasons/current'), { name: '2026/2027' });
    await setDoc(doc(db, 'competitions/current_competitie'), {
      seasonId: 'current',
      type: 'competitie',
    });
  });
});
const account = (uid, email, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const game = {
  seasonId: 'current',
  competitionId: 'current_competitie',
  league: 'competitie',
  opponent: 'Test United',
  date: '2026-09-10',
  players: [],
  events: [],
};
test('signed-out users cannot read team data', async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'seasons/current')));
});
test('members can read but cannot add games, players or seasons', async () => {
  const db = account('member', 'member@example.test');
  await assertSucceeds(getDoc(doc(db, 'seasons/current')));
  await assertFails(setDoc(doc(db, 'games/new'), game));
  await assertFails(setDoc(doc(db, 'seasons/new'), { name: '2027/2028' }));
  await assertFails(
    setDoc(doc(db, 'players/new'), {
      name: 'Test',
      number: 7,
      seasonId: 'current',
      competitionIds: ['current_competitie'],
    }),
  );
});
test('verified database admins can create a valid game', async () => {
  await assertSucceeds(
    setDoc(doc(account('admin', 'daniel.r.gumbs@gmail.com'), 'games/new'), game),
  );
});
test('unverified admins cannot write', async () => {
  await assertFails(
    setDoc(doc(account('admin', 'daniel.r.gumbs@gmail.com', false), 'games/new'), game),
  );
});
test('users cannot grant themselves admin or read another profile', async () => {
  const db = account('member', 'member@example.test');
  await assertFails(updateDoc(doc(db, 'users/member'), { isAdmin: true }));
  await assertFails(getDoc(doc(db, 'users/admin')));
  const fresh = account('new-user', 'new@example.test');
  await assertFails(
    setDoc(doc(fresh, 'users/new-user'), { email: 'new@example.test', isAdmin: true }),
  );
  await assertSucceeds(
    setDoc(doc(fresh, 'users/new-user'), { email: 'new@example.test', isAdmin: false }),
  );
});
test('games cannot reference a missing season or a mismatched competition', async () => {
  const db = account('admin', 'daniel.r.gumbs@gmail.com');
  await assertFails(setDoc(doc(db, 'games/new'), { ...game, seasonId: 'missing' }));
  await assertFails(setDoc(doc(db, 'games/new'), { ...game, competitionId: 'current_beker' }));
});
