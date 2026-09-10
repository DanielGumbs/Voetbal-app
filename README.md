# VoetbalApp

Angular 21-app voor wedstrijden, seizoenen en spelersstatistieken van ZVV Vedette.
De UI gebruikt Tailwind-utilities; er is geen eigen CSS-bestand. Firebase regelt
Google-aanmelding en Firestore. Prettier formatteert de code.

## Ontwikkelen

Gebruik Node.js 22 en installeer de dependencies:

```bash
npm ci
npm run hooks:install
npm start
```

| Commando                           | Doel                                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| `npm start` / `npm run start:test` | Testapp op localhost:4200, aparte Firebase-testdatabase          |
| `npm run start:production`         | Lokaal op localhost:4201 met echte productiedata                 |
| `npm run format`                   | Prettier uitvoeren                                               |
| `npm run format:check`             | Formatteringscontrole                                            |
| `npm run test:ci`                  | Angular-unit-tests in Chrome Headless                            |
| `npm run test:e2e`                 | Firestore-regeltests + Playwright met lokale emulators           |
| `npm run test:e2e:report`          | Het laatste Playwright-rapport openen                            |
| `npm run release:check`            | Alle controles en de productiebuild uitvoeren, zonder publicatie |
| `npm run deploy:test`              | Hosting en regels naar het testproject publiceren                |

Voor E2E zijn Java 21 en Playwright-browsers nodig. Zie
[Release 1: testen en publiceren](docs/release-1.md) voor installatie,
GitHub-beveiliging, toestemming voor productie en herstel.

## Branches en databases

- `feature/*`: wijzigingen vanaf `main`, bijvoorbeeld `feature/1` voor release 1.
- `main`: integratie en testen.
- `production`: de versie voor productie.
- Productieproject: `voetbal-app-6fa54`.
- Testproject: `voetbal-app-6fa54-test`. Eenmalig gekopieerde data, geen synchronisatie.
- E2E-project: `demo-voetbal-e2e`, uitsluitend lokale Firebase-emulators met verzonnen testdata.

Startcommando's publiceren niets. `start:production` kan wel echte data wijzigen
als je in de app gegevens opslaat. Een deploy kopieert geen databasegegevens.
Back-ups en testresultaten blijven buiten Git.

**Vraag Daniel altijd eerst om toestemming voor een productiepush, productiemerge
of productiedeploy.** Een geslaagde test is geen toestemming. Er is geen automatische
productiedeploy. De releaseprocedure gebruikt verplichte controles én een expliciete
goedkeuring voor de volledige commit-ID.

## Seizoenen en rechten

Het nieuwste seizoen is standaard geselecteerd. Wedstrijden en de spelersranglijst
volgen de gekozen seizoen- en competitiefilters. Via **Beheer** voeg je een seizoen,
competitie/beker en spelers toe; via **Nieuwe wedstrijd** registreer je deelnemers,
uitslag, goals en assists. Historische gegevens zonder `seasonId` horen bij **Vorig
seizoen**. Speler-ID's zijn per seizoen apart.

Gebruikers krijgen een Firestore-document `users/{uid}` met `email` en `isAdmin`.
Het geverifieerde account `daniel.r.gumbs@gmail.com` krijgt bij de eerste aanmaak
`isAdmin: true`; andere accounts krijgen `false`. Bestaande rollen blijven staan.
Rollen wijzigen kan via de vertrouwde Firebase-console/Admin SDK, niet door een
gebruiker in de app. Zowel de routes als de database controleren de adminrol.

## Volgende releases

Release 1 legt de test- en releasebasis. Teams aanmaken, kleuren uit een teamlogo,
AI-chat voor wedstrijden en een boetepot volgen in afzonderlijke releases.
