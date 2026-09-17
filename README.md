# VoetbalApp

## Omgevingen

- Development gebruikt Supabase-testproject `jfjjsvmqvpghknytydac`.
- Productie gebruikt Supabase-project `dbbfboycceytdwaarwfv` in de aparte gratis organisatie **Voetbal-app productie**.
- Firebase Hosting blijft de website op https://voetbal-app-6fa54.web.app verzorgen.
- `main` en `production` bevatten bij iedere publicatie dezelfde commit. De buildconfiguratie bepaalt welke database wordt gebruikt; branchgelijkheid betekent geen gegevenssynchronisatie.
- De publieke productie-URL en publishable key staan in `src/environments/supabase-production.json`. Geen databasewachtwoorden, OAuth-secrets of service-role keys in Git.
- De expliciete configuratie `firebase-legacy` bewaart de vorige Firebase-backend voor een gecontroleerde terugkeer. De standaard productiebuild bevat uitsluitend Supabase.

## Supabase-testomgeving instellen

Het bestaande testproject `voetbal-app-supabase-test` (`jfjjsvmqvpghknytydac`) is gekoppeld in de developmentconfiguratie. De twee basismigraties zijn op 15 september 2026 uitgevoerd. De teammigratie en twee opruimmigraties van 16 september zijn ook live uitgevoerd; voer deze vijf migraties daar niet nogmaals uit. De lege, ongebruikte `pilot_*`-tabellen en bijbehorende functies zijn verwijderd. Site URL is `http://localhost:4200`, met `http://localhost:4200/games` als toegestane redirect.

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
- `npm run start:production`: Supabase-productieomgeving lokaal op `http://localhost:4201`; writes gaan naar de echte productiedatabase.
- `npm run build:test`: geoptimaliseerde testbuild met controle dat Firebase niet gebundeld is.
- `npm run build:prod`: Supabase-productiebuild, met controle op de juiste project-URL en publieke key.
- `npm run test:ci`: unit-tests in Chrome Headless.
- `npm run format` / `npm run format:check`: formatteren/controleren met Prettier.

`npm run deploy:test` stopt met een uitleg: de oude Firebase-testdeployment is uitgeschakeld. Supabase verzorgt Auth en database; voor de Angular-testsite moet nog een statische host worden ingesteld. Publiceer daar de bestanden uit `dist/voetbal-app/browser` met een SPA-fallback naar `index.html`.

## Productie publiceren

Hosting blijft Firebase-project `voetbal-app-6fa54`. Auth, database, rechten en teamlogo’s worden door Supabase geleverd. `npm run deploy:prod` publiceert uitsluitend hosting; Firestore en de oude productiegegevens blijven bewaard.

Publiceren vereist een schone `production`-branch die exact gelijk is aan `main`. De buildcontrole weigert de testdatabase, ontbrekende instellingen, secret keys en Firebase-databasecode in een Supabase-productiebuild.

```bash
git switch production
git merge --ff-only main
npm run deploy:prod
git push origin main production
git switch main
```

Migratiegegevens, controles en terugkeerprocedure staan in [docs/supabase-production.md](docs/supabase-production.md).

## Seizoenen en rechten

- Kies bovenaan een team of open **Teams**. **Vedette De Remise** blijft één team met alle bestaande seizoenen; **IVV** heeft eigen seizoenen. Binnen ieder team kun je meerdere seizoenen toevoegen. De laatste teamkeuze wordt op dit apparaat onthouden.
- Beheerders kunnen via **Nieuw team** een team toevoegen en via **Bewerken** de teamnaam en het logo aanpassen. Kies een JPG-, PNG- of WebP-bestand van maximaal 5 MB. De app verkleint dit lokaal tot maximaal 384 pixels en bewaart een compact logo bij het team. Zonder logo verschijnen initialen.
- Kies bovenaan een seizoen. Wedstrijden en statistieken volgen deze keuze.
- Maak via **Seizoenen** een nieuw seizoen aan; de backend maakt competitie en beker in dezelfde transactie aan.
- Voeg spelers toe aan het gekozen seizoen, daarna wedstrijden via **Nieuwe wedstrijd**.
- Alleen ingelogde gebruikers kunnen teamgegevens lezen. Alleen geverifieerde beheerders kunnen toevoegen.
- In Supabase maakt een database-trigger bij de eerste aanmelding een profiel in `public.users`. Het geverifieerde account `daniel.r.gumbs@gmail.com` krijgt aanvankelijk `isAdmin: true`; andere accounts krijgen `false`. Rollen kunnen uitsluitend via vertrouwd databasebeheer worden aangepast. De browser kan geen rollen schrijven. Bestaande rollen blijven behouden.
- Productie gebruikt dezelfde Supabase-profieltrigger en toegangsregels als test. Na de overstap melden gebruikers opnieuw met Google aan; Supabase maakt een nieuw profiel aan. Het geverifieerde beheeraccount krijgt dezelfde beheerdersrol.
- Verwijderen is niet beschikbaar vanuit de app. Historische data wordt niet overschreven.

De scripts `copy-production-to-test.cjs` en `configure-test-auth.cjs` betreffen uitsluitend het oude Firebase-testproject; ze configureren of vullen Supabase niet.

## Teamdatabase bijgewerkt op 16 september 2026

De bestaande team-ID's zijn behouden: `vedette` en `3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26` (IVV). Alle bestaande seizoenen, spelers en wedstrijden blijven bij Vedette. De migratie controleert dat aantallen, seizoen-ID's, namen en teamrelaties behouden blijven. Nieuwe gegevens krijgen een `teamId`; databasevoorwaarden voorkomen dat een speler of wedstrijd naar het seizoen van een ander team verwijst.

De bestaande kolom `teams.logo` is hernoemd naar `logoUrl`, met behoud van het clublogo. De ongebruikte kolommen `primaryColor` en `secondaryColor` zijn na een back-up verwijderd, zonder `CASCADE`. `teams` bevat nu alleen `id`, `name` en `logoUrl`. De lokale back-up van teamwaarden en het oude schema staat buiten Git in `backups/supabase-teams-before-2026-09-16.csv`.

De oude proefopzet is daarna verwijderd: acht lege `pilot_*`-tabellen, de view `pilot_personal_stats`, acht oude functies en het schema `pilot_private`. De migratie weigert nieuwe proefgegevens of onverwachte afhankelijkheden en gebruikt geen `CASCADE`. Alle rijen van de zes gebruikte tabellen zijn binnen dezelfde transactie voor en na de opruiming vergeleken en bleven exact gelijk, inclusief het nieuwe IVV-seizoen. `public` bevat nu alleen `users`, `teams`, `seasons`, `competitions`, `players` en `games`. De schema- en functieback-ups staan buiten Git in `backups/supabase-pilot-before-cleanup-2026-09-16.csv` en `backups/supabase-pilot-functions-before-cleanup-2026-09-16.csv`.

De live SQL-controle is geslaagd voor teams aanmaken/bewerken, meerdere seizoenen per team, logo's, spelers, wedstrijden, weigering van teamoverschrijdende relaties en beheerdersrechten. De controle draait alle testgegevens terug. Firebase-regels en de productieadapter zijn apart gecontroleerd in een lokale Firestore-emulator; de live Firebase-productieomgeving is niet gewijzigd.

## Mobiele interface

De interface schaalt naar telefoon en desktop, met navigatie onderaan op mobiel, veilige schermmarges, ruime aanraakvlakken en iOS-webappmetadata. Dit project levert momenteel een webapp/PWA. Native iOS-/Android-builds, ondertekening en publicatie in de App Store of Google Play zijn nog niet ingericht.

De vormgeving gebruikt Tailwind-utilities in templates en host-klassen; er zijn geen eigen componentstylesheets of inline component-CSS. Toevoeg- en opslagknoppen gebruiken dezelfde rode `action`-kleuren uit `tailwind.config.js`, inclusief hover, indrukken, focus en uitgeschakelde toestand. De toevoegknoppen bevatten alleen tekst. Keuzelijsten en secundaire acties houden hun donkere stijl. De keuzelijsten berekenen hun positie bij het openen, zodat ze binnen het scherm blijven en niet door scrollgebieden worden afgesneden.

## Techniek

Angular 21, TypeScript 5.9, Tailwind-utilities en officiële Firebase- en Supabase-SDK's. De clubkleuren staan in `tailwind.config.js`. Elke build bevat alleen zijn eigen backend. Lokale back-ups en deploymentcache staan buiten Git.
