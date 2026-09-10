import { test, expect, login, seed } from './fixtures';

test('login, fixed navigation, season selection and logout', async ({ page, isMobile }) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
  await expect(nav.getByRole('link', { name: 'Wedstrijden' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Statistieken' })).toBeVisible();
  const bounds = await nav.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  if (isMobile)
    expect(Math.abs(bounds!.y + bounds!.height - page.viewportSize()!.height)).toBeLessThan(2);
  await expect(page.getByRole('button', { name: 'Seizoen', exact: true })).toContainText(
    '2026/2027',
  );
  const before = await page
    .getByRole('heading', { name: 'Wedstrijden.', exact: true })
    .boundingBox();
  await nav.getByRole('link', { name: 'Statistieken' }).click();
  const after = await page
    .getByRole('heading', { name: 'Statistieken.', exact: true })
    .boundingBox();
  expect(after!.y).toBe(before!.y);
  await expect(page.getByRole('heading', { name: 'Spelersranglijst' })).toBeVisible();
  await page.getByRole('button', { name: 'Goals', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Goals', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('region', { name: 'Spelersranglijst' }).getByRole('heading').first(),
  ).toHaveText('Thijs Test');
  await page.getByRole('button', { name: 'Assists', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assists', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('region', { name: 'Spelersranglijst' }).getByRole('heading').first(),
  ).toHaveText('Daniel Test');
  await page.getByRole('button', { name: 'Seizoen', exact: true }).click();
  await page.getByRole('option', { name: 'Vorig seizoen' }).click();
  await expect(page.getByRole('heading', { name: 'Klaar voor de aftrap' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spelersranglijst' })).toBeVisible();
  await page.getByRole('button', { name: 'Accountmenu' }).click();
  await page.getByRole('button', { name: 'Uitloggen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Doorgaan met Google' })).toBeVisible();
});

test('members cannot access admin routes or controls', async ({ page }) => {
  await login(page, 'member');
  await expect(page.getByRole('link', { name: 'Nieuwe wedstrijd', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Beheer', exact: true })).toHaveCount(0);
  for (const route of ['/games/new', '/seasons']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/games$/);
    await expect(page.getByRole('heading', { name: 'Wedstrijden.', exact: true })).toBeVisible();
  }
});

test('long lists scroll inside the app on a small phone', async ({ page, request }) => {
  await seed(request, true);
  await page.setViewportSize({ width: 320, height: 568 });
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
  for (const [tab, name] of [
    ['Wedstrijden', 'Wedstrijdoverzicht'],
    ['Statistieken', 'Spelersranglijst'],
  ]) {
    await nav.getByRole('link', { name: tab, exact: true }).click();
    const list = page.getByRole('region', { name, exact: true });
    await expect(list).toBeVisible();
    await expect
      .poll(() => list.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);
    await list.focus();
    await page.keyboard.press('End');
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(nav.getByRole('link', { name: 'Wedstrijden', exact: true })).toBeInViewport();
    await expect(nav.getByRole('link', { name: 'Statistieken', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  }
});

test('admin creates a match with a goal and assist', async ({ page, request }) => {
  await login(page);
  await page.getByRole('link', { name: 'Nieuwe wedstrijd', exact: true }).click();
  await page.getByLabel('Tegenstander', { exact: true }).fill('E2E Rovers');
  await page.getByLabel('Datum', { exact: true }).fill('2026-09-11');
  await page.getByLabel('Score Vedette', { exact: true }).fill('1');
  await page.getByLabel('Score tegenstander', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: '7 - Thijs Test' }).check();
  await page.getByRole('checkbox', { name: '21 - Daniel Test' }).check();
  for (const [index, [name, type]] of [
    ['7 - Thijs Test', 'Goal'],
    ['21 - Daniel Test', 'Assist'],
  ].entries()) {
    await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();
    const player = page.getByRole('button', { name: 'Speler', exact: true }).nth(index);
    await player.click();
    await page.getByRole('option', { name, exact: true }).click();
    await expect(player).toHaveText(name);
    if (type === 'Assist') {
      await page.getByRole('button', { name: 'Gebeurtenis', exact: true }).nth(index).click();
      await page.getByRole('option', { name: 'Assist', exact: true }).click();
    }
  }
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await expect(page.getByRole('link').filter({ hasText: 'E2E Rovers' })).toBeVisible();
  await page.getByRole('link').filter({ hasText: 'E2E Rovers' }).click();
  await expect(page.getByRole('heading', { name: 'Vedette — E2E Rovers' })).toBeVisible();
  await expect(page.getByText('Thijs Test (#7)', { exact: true })).toBeVisible();
  await expect(page.getByText('Daniel Test (#21)', { exact: true })).toBeVisible();
  const saved = await request.get(
    'http://127.0.0.1:8080/v1/projects/demo-voetbal-e2e/databases/(default)/documents/games',
    { headers: { Authorization: 'Bearer owner' } },
  );
  const docs = (await saved.json()).documents.filter(
    (d: any) => d.fields.opponent.stringValue === 'E2E Rovers',
  );
  expect(docs).toHaveLength(1);
  expect(docs[0].fields.events.arrayValue.values).toHaveLength(2);
  expect(docs[0].fields.seasonId.stringValue).toBe('current');
  expect(docs[0].fields.competitionId.stringValue).toBe('current_competitie');
});

test('invalid match stays in the form without saving', async ({ page, request }) => {
  await login(page);
  await page.getByRole('link', { name: 'Nieuwe wedstrijd', exact: true }).click();
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await expect(page.getByText('Vul een tegenstander in.', { exact: true })).toBeVisible();
  await expect(page.getByText('Vul een datum in.', { exact: true })).toBeVisible();
  await page.getByLabel('Tegenstander', { exact: true }).fill('Nog niet opslaan');
  await page.getByLabel('Datum', { exact: true }).fill('2026-09-11');
  await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await expect(page).toHaveURL(/\/games\/new$/);
  await expect(
    page.getByText('Selecteer een speler of verwijder deze regel.', { exact: true }),
  ).toBeVisible();
  const saved = await request.get(
    'http://127.0.0.1:8080/v1/projects/demo-voetbal-e2e/databases/(default)/documents/games',
    { headers: { Authorization: 'Bearer owner' } },
  );
  expect((await saved.json()).documents).toHaveLength(1);
});

test('admin creates a season and player; overlay does not shift the form', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Beheer', exact: true }).click();
  const title = page.getByRole('heading', { name: 'Nieuw seizoen toevoegen' });
  const before = await title.boundingBox();
  const trigger = page.getByRole('button', { name: 'Seizoen', exact: true });
  await trigger.click();
  const list = page.getByRole('listbox', { name: 'Seizoen' });
  await expect(list).toBeVisible();
  expect((await list.boundingBox())!.y).toBeGreaterThan((await trigger.boundingBox())!.y);
  expect((await title.boundingBox())!.y).toBe(before!.y);
  await list.press('Escape');
  await page.getByLabel('Naam nieuw seizoen').fill('2027/2028');
  await page.getByRole('button', { name: 'Seizoen toevoegen' }).click();
  await expect(trigger).toContainText('2027/2028');
  await page.getByLabel('Spelersnaam').fill('Nieuwe Speler');
  await page.getByLabel('Rugnummer').fill('9');
  await page.getByRole('button', { name: 'Speler toevoegen' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Nieuwe Speler' })).toBeVisible();
});
