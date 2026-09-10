import { test as base, expect, type Page, type APIRequestContext } from '@playwright/test';

export const project = 'demo-voetbal-e2e';
const root = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;
function field(value: unknown): object {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } };
  return { mapValue: { fields: fields(value as Record<string, unknown>) } };
}
function fields(value: Record<string, unknown>): object {
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, field(val)]));
}

export async function seed(request: APIRequestContext, longLists = false) {
  if (process.env['FIRESTORE_EMULATOR_HOST'] !== '127.0.0.1:8080')
    throw new Error('E2E requires the isolated emulator runner.');
  const cleared = await request.delete(
    `http://127.0.0.1:8080/emulator/v1/projects/${project}/databases/(default)/documents`,
  );
  expect(cleared.ok()).toBeTruthy();
  const authCleared = await request.delete(
    `http://127.0.0.1:9099/emulator/v1/projects/${project}/accounts`,
  );
  expect(authCleared.ok()).toBeTruthy();
  const docs: Record<string, Record<string, unknown>> = {
    'seasons/current': { name: '2026/2027' },
    'seasons/previous-season': { name: 'Vorig seizoen' },
    'competitions/current_competitie': { seasonId: 'current', type: 'competitie' },
    'competitions/current_beker': { seasonId: 'current', type: 'beker' },
    'players/thijs': {
      name: 'Thijs Test',
      number: 7,
      seasonId: 'current',
      competitionIds: ['current_competitie', 'current_beker'],
    },
    'players/daniel': {
      name: 'Daniel Test',
      number: 21,
      seasonId: 'current',
      competitionIds: ['current_competitie', 'current_beker'],
    },
    'games/first': {
      opponent: 'Test United',
      date: '2026-09-10',
      scoreTeam: 1,
      scoreOpponent: 0,
      league: 'competitie',
      seasonId: 'current',
      competitionId: 'current_competitie',
      players: ['thijs', 'daniel'],
      events: [
        { playerId: 'thijs', type: 'goal' },
        { playerId: 'daniel', type: 'assist' },
      ],
    },
  };
  if (longLists) {
    for (let i = 0; i < 30; i++) {
      docs[`players/extra-${i}`] = {
        name: `Reservespeler ${i}`,
        number: i + 30,
        seasonId: 'current',
        competitionIds: ['current_competitie'],
      };
      docs[`games/extra-${i}`] = {
        ...docs['games/first'],
        opponent: `Tegenstander ${i}`,
        date: '2026-09-01',
      };
    }
  }
  const response = await request.post(`${root}:commit`, {
    headers: { Authorization: 'Bearer owner' },
    data: {
      writes: Object.entries(docs).map(([path, data]) => ({
        update: {
          name: `projects/${project}/databases/(default)/documents/${path}`,
          fields: fields(data),
        },
      })),
    },
  });
  expect(response.ok()).toBeTruthy();
}

export async function login(page: Page, role: 'admin' | 'member' = 'admin') {
  await page.goto('/');
  await page.evaluate((value) => sessionStorage.setItem('e2e-role', value), role);
  await page.getByRole('button', { name: 'Doorgaan met Google' }).click();
  await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wedstrijden.', exact: true })).toBeVisible();
}

export const test = base.extend<{ isolated: void }>({
  isolated: [
    async ({ page, request }, use) => {
      const external: string[] = [];
      await page.context().route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
          external.push(url.origin);
          await route.abort();
        } else await route.continue();
      });
      await seed(request);
      await use();
      expect(external, 'The E2E app must never call a cloud service').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
