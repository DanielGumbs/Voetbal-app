# VoetbalApp

## Omgevingen

- `main` / development: **Supabase** voor Google-login, gebruikersrechten en teamgegevens.
- `production` / productiebuild: **Firebase** voor Google-login, Firestore en hosting.
- Angular kiest de backend via `fileReplacements` in `angular.json`. De productieconfiguratie vervangt de Supabase-adapter en gebruikersprofielen door de Firebase-implementatie. Ook een productiebuild vanaf main gebruikt dus Firebase.
- Er wordt geen data automatisch gekopieerd of gesynchroniseerd tussen de omgevingen.

## Supabase-testomgeving instellen

Het bestaande testproject `voetbal-app-supabase-test` (`jfjjsvmqvpghknytydac`) is gekoppeld in de developmentconfiguratie. Beide SQL-migraties zijn daar op 15 september 2026 succesvol uitgevoerd; voer die niet nogmaals uit. De bestaande `pilot_*`-tabellen zijn behouden. Site URL is `http://localhost:4200`, met `http://localhost:4200/games` als toegestane redirect.

Google-login is live gecontroleerd met het beheeraccount, inclusief de beheerpagina en realtime rolupdates. De Google-testclient is `Voetbal Supabase test`; de callback is `https://jfjjsvmqvpghknytydac.supabase.co/auth/v1/callback`. De secret staat uitsluitend in Supabase. De profieltrigger wacht op e-mailbevestiging: Google schrijft die na de eerste accountaanmaak. Bestaande rollen worden vervolgens behouden.

De SQL-controle `supabase/tests/team_smoke.sql` test de opslag van seizoenen, competities, spelers en wedstrijden met beheerdersrechten, weigering van seizoensaanmaak zonder beheerdersrol en de tabelrechten. Deze controle is live geslaagd en draait alle testgegevens terug.

Voor een nieuw, leeg testproject:

1. Maak een apart Supabase-testproject aan.
2. Voer de SQL-bestanden in `supabase/migrations` eenmalig in bestandsnaamvolgorde uit in de SQL Editor. Dit maakt de tabellen, toegangsregels, profieltrigger, seizoensfunctie en Realtime-publicatie aan.
3. Vul de project-URL en publieke publishable/anon-key in bij `supabase` in `src/environments/environment.ts`. Gebruik nooit een service-role-key of secret key in de frontend. Er is bewust geen terugval naar Firebase als deze gegevens ontbreken.
4. Schakel Google in onder Authentication / Providers. Configureer de Google OAuth-client met de callback-URL die Supabase toont. Voeg `http://localhost:4200/games` toe aan de toegestane redirect-URL's en stel de Site URL in op `http://localhost:4200`. Voeg bij hosting ook de werkelijke test-URL toe.
5. Start met `npm start` en meld je aan met Google. Supabase gebruikt een redirect voor aanmelden.

Documentatie: [Google-login](https://supabase.com/docs/guides/auth/social-login/auth-google) en [databasebeveiliging](https://supabase.com/docs/guides/database/postgres/row-level-security).

Op 15 september 2026 is een eenmalige kopie van de Firebase-productiedata naar Supabase uitgevoerd: **2 seizoenen, 4 competities, 18 spelers en 25 wedstrijden**, inclusief **167 goal-events en 126 assist-events**. Alle 25 wedstrijden vallen onder **Vorig seizoen**; selecteer dat seizoen en **Alles** bij competitie om ze te zien. De bestaande ID's, scores en gebeurtenissen zijn behouden en met de bron vergeleken. Firebase-productie is daarbij uitsluitend gelezen. Firebase-logins zijn niet gekopieerd; aanmelden verloopt via Supabase.

De lokale bronkopie staat onder `backups/supabase-source-2026-09-15T17-30-10-526Z.json` (buiten Git). Voor een nieuwe kopie leest `node scripts/export-firestore-team.cjs` de vier teamcollecties met de bestaande Firebase CLI-login. `node scripts/prepare-supabase-import.cjs <bronbestand.json>` genereert een SQL-import naast het bronbestand. Deze import is bedoeld voor historische wedstrijden zonder seizoen-ID en weigert onbekende velden. Voer de gegenereerde SQL uitsluitend in de Supabase-testomgeving uit: de transactie controleert de bronchecksum en alle geïmporteerde rijen, en breekt af als bestaande rijen afwijken. Er is geen automatische synchronisatie.

## Starten en bouwen

- `npm start` / `npm run start:test`: Supabase-testomgeving op `http://localhost:4200`.
- `npm run start:production`: Firebase-productieomgeving lokaal op `http://localhost:4201`; writes gaan naar de echte productiedatabase.
- `npm run build:test`: geoptimaliseerde testbuild met controle dat Firebase niet gebundeld is.
- `npm run build:prod`: Firebase-productiebuild.
- `npm run test:ci`: unit-tests in Chrome Headless.
- `npm run format` / `npm run format:check`: formatteren/controleren met Prettier.

`npm run deploy:test` stopt met een uitleg: de oude Firebase-testdeployment is uitgeschakeld. Supabase verzorgt Auth en database; voor de Angular-testsite moet nog een statische host worden ingesteld. Publiceer daar de bestanden uit `dist/voetbal-app/browser` met een SPA-fallback naar `index.html`.

## Productie publiceren (Firebase)

Productie blijft project `voetbal-app-6fa54` gebruiken, met de bestaande configuratie in `firebase.config.ts`, hosting in `firebase.json` en regels in `firestore.rules`.

`npm run deploy:prod` vereist een schone, gecommitte `production`-branch, bouwt de app, controleert dat de Firebase-productieconfiguratie aanwezig is en publiceert hosting en Firestore-regels. Log zo nodig eerst in met `npm run firebase:login`.

Een geteste versie promoveren:

```bash
git switch production
git merge --ff-only main
npm run deploy:prod
git push origin main production
git switch main
```

## Seizoenen en rechten

- Kies bovenaan een seizoen. Wedstrijden en statistieken volgen deze keuze.
- Maak via **Seizoenen** een nieuw seizoen aan; de backend maakt competitie en beker in dezelfde transactie aan.
- Voeg spelers toe aan het gekozen seizoen, daarna wedstrijden via **Nieuwe wedstrijd**.
- Alleen ingelogde gebruikers kunnen teamgegevens lezen. Alleen geverifieerde beheerders kunnen toevoegen.
- In Supabase maakt een database-trigger bij de eerste aanmelding een profiel in `public.users`. Het geverifieerde account `daniel.r.gumbs@gmail.com` krijgt aanvankelijk `isAdmin: true`; andere accounts krijgen `false`. Rollen kunnen uitsluitend via vertrouwd databasebeheer worden aangepast. De browser kan geen rollen schrijven. Bestaande rollen blijven behouden.
- In productie blijven de bestaande Firestore-profielen en regels gelden.
- Verwijderen is niet beschikbaar vanuit de app. Historische data wordt niet overschreven.

De scripts `copy-production-to-test.cjs` en `configure-test-auth.cjs` betreffen uitsluitend het oude Firebase-testproject; ze configureren of vullen Supabase niet.

## Techniek

Angular 21, TypeScript 5.9, Tailwind-utilities en officiële Firebase- en Supabase-SDK's. De clubkleuren staan in `tailwind.config.js`. Elke build bevat alleen zijn eigen backend. Lokale back-ups en deploymentcache staan buiten Git.
