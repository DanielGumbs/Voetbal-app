# VoetbalApp

## Branches en omgevingen

- `main`: ontwikkelen en testen met `npm start` (aparte Firebase-testdatabase).
- `production`: de versie die naar productie wordt gepubliceerd.
- `npm run deploy:test`: publiceert naar het testproject.
- `npm run deploy:prod`: publiceert uitsluitend vanaf een schone, gecommitte `production`-branch. De build wordt gecontroleerd op de productieconfiguratie.

Een geteste versie promoveren:

```bash
git switch production
git merge --ff-only main
npm run deploy:prod
git push origin main production
git switch main
```

Deployen kopieert geen databasegegevens. Productie gebruikt `voetbal-app-6fa54`,
test gebruikt `voetbal-app-6fa54-test`. De testdata is een eenmalige kopie;
wijzigingen worden niet gesynchroniseerd. Lokale back-ups en Firebase-deploycache
staan buiten Git. In test meld je je apart aan met Google.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

## Development server

- `npm start` of `npm run start:test`: testomgeving op `http://localhost:4200`, met de aparte testdatabase.
- `npm run start:production`: productieversie lokaal op `http://localhost:4201`, met de echte productiedatabase. Opgeslagen wijzigingen zijn dus echte productiewijzigingen.

Deze startcommando's publiceren niets. Beide omgevingen kunnen tegelijk draaien dankzij de verschillende poorten.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deploying to Firebase Hosting

Follow these steps to deploy a new version to Firebase Hosting.

Prerequisites:

- Install Firebase CLI (one time):
  npm install -g firebase-tools
- Log in to Firebase (one time per machine):
  npm run firebase:login
- Make sure your project is selected or set a default project (replace YOUR_PROJECT_ID):
  firebase use YOUR_PROJECT_ID
  or run:
  npm run firebase:use

Build and deploy:

1. Build a production bundle:
   npm run build:prod
2. Deploy to Firebase Hosting:
   npm run deploy

Notes:

- The Firebase Hosting config is in firebase.json and points to dist/voetbal-app/browser which is where Angular outputs the app.
- If you haven’t initialized hosting locally before, you can run firebase init hosting and choose “Configure files for Firebase Hosting”. This repo already includes a working firebase.json.
- If you prefer CI/CD later, you can add GitHub Actions with firebase/cli-action to build and deploy on push to main.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Seizoenen en beheer

- Kies bovenaan een seizoen. Wedstrijden en de ranglijst worden op dit seizoen gefilterd.
- Alleen het geverifieerde Google-account `daniel.r.gumbs@gmail.com` kan toevoegen.
- Open de tab **Seizoenen**, vul bijvoorbeeld `2026/2027` in en voeg het seizoen toe. Firestore slaat het seizoen en de bijbehorende competitie en beker atomair op.
- Voeg spelers toe aan het gekozen seizoen, met rugnummer en deelname aan competitie, beker of beide. Voeg daarna wedstrijden toe via **Nieuwe wedstrijd**.
- Bestaande `games` en `players` zonder `seasonId` worden uitsluitend als **Vorig seizoen** gelezen. Hun documenten en statistieken worden niet overschreven. Bij het eerste nieuwe seizoen wordt ook het vorige seizoen als document vastgelegd. Historische wedstrijdlinks blijven werken.
- Nieuwe spelers bevatten `seasonId` en `competitionIds`; nieuwe wedstrijden bevatten `seasonId` en `competitionId`. Speler-ID's zijn per seizoen apart, zodat oude statistieken behouden blijven.
- Publiceer zowel de app als `firestore.rules` met `npm run deploy`. Zonder publicatie van de regels is de e-mailbeperking in de database nog niet actief. De regels staan lezen toe voor ingelogde gebruikers, toevoegen alleen voor de beheerder, en geen verwijderen. Bestaande gegevens blijven leesbaar.
- Firebase CLI en een ingelogd account met deployrechten zijn vereist. De lokale productiebuild controleert de Angular-code; test de rechten en het opslaan daarnaast in Firebase voordat je de wijziging in gebruik neemt.

## Styling en formatteren

Alle styling staat in Tailwind-utilities in de templates en component-hostklassen. Er is geen eigen CSS-bestand en geen `@apply`. De clubkleuren staan in `tailwind.config.js`. Angular compileert het standaard `tailwindcss/tailwind.css`-bestand uit node_modules.

- `npm run format`: formatteert het project met Prettier.
- `npm run format:check`: controleert de formattering zonder bestanden te wijzigen.
- `npm run test:ci`: voert tests eenmalig uit in Chrome Headless.

Angular is bijgewerkt naar versie 21 met TypeScript 5.9. Firebase gebruikt de officiële SDK via `src/services/firebase.ts`; AngularFire is verwijderd omdat versie 20 geen Angular 21 ondersteunt. De bootstrapconfiguratie staat centraal in `src/app/app.config.ts`.

# Gebruikersrechten

Gebruikers krijgen bij aanmelden een Firestore-document `users/{uid}` met `email` en
`isAdmin` (boolean). Het geverifieerde account `daniel.r.gumbs@gmail.com` krijgt bij
de eerste aanmaak `isAdmin: true`; andere accounts krijgen `false`. Bestaande rollen
worden niet overschreven. Wijzig rollen via de Firebase-console of een vertrouwde
Admin SDK. Gebruikers kunnen hun eigen rol niet wijzigen.

De app, routebeveiliging en Firestore-regels controleren `isAdmin`. Publiceer de
regels uit `firestore.rules` voordat je deze versie gebruikt.
