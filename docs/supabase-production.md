# Supabase-productie

## Configuratie

- Project: `voetbal-app-productie` (`dbbfboycceytdwaarwfv`), regio West EU / Ireland.
- Organisatie: `Voetbal-app productie` (`eyytmaepsicaolfztmwh`), Free-plan.
- Test blijft afzonderlijk in `jfjjsvmqvpghknytydac`.
- Hosting: `https://voetbal-app-6fa54.web.app`, bestaand Firebase-project.
- Google-client: `Voetbal Supabase productie`, in Google Cloud-project `voetbal-app-6fa54`.
- Google callback: `https://dbbfboycceytdwaarwfv.supabase.co/auth/v1/callback`.
- Site URL: `https://voetbal-app-6fa54.web.app`.
- Redirects: `/games` op `voetbal-app-6fa54.web.app`, `voetbal-app-6fa54.firebaseapp.com` en `http://localhost:4201` voor de gecontroleerde lokale productiepreview.
- De OAuth-secret is uitsluitend ingevoerd in Supabase, niet in broncode of lokale bestanden.

## Gegevensoverdracht op 17 september 2026

Firebase is uitsluitend gelezen. De verse bronkopie staat buiten Git in
`backups/supabase-source-2026-09-17T12-36-12-806Z.json`.
`scripts/prepare-supabase-import.cjs` genereerde de transactionele import naast deze kopie.
De bronpayload heeft SHA-256 `d864fda130176663e0930c860201a080401d3ab38e406eb1607440b524114be2`.
De import controleerde de checksum en vergeleek iedere geïmporteerde rij met de bron,
inclusief IDs, scores, spelerverwijzingen en events. Bestaande afwijkende rijen worden niet overschreven.

Overgezet: 2 seizoenen, 4 competities, 18 spelers, 25 wedstrijden, 167 goal-events en 126 assist-events.
De wedstrijden horen bij Vedette / Vorig seizoen. Er is geen testdata naar productie gekopieerd.
De twee vaste teams Vedette en IVV zijn aangemaakt met de bestaande IDs uit de app.
Accounts gebruiken Google-login via Supabase; bestaande Firebase-sessies worden niet gemigreerd.

Het nieuwe, lege project is ingericht met het definitieve schema uit de eerste drie
migraties: zes tabellen, bevestigde gebruikersprofielen, teamrelaties, triggers,
RLS, kolomrechten en Realtime. De oude pilot-tabellen en oude ongebruikte teamkolommen
zijn niet aangemaakt. De eenmalige reparatie van een oud testaccount is niet uitgevoerd.
Voer de historische migraties niet opnieuw uit op dit ingerichte project.

Voor publicatie gecontroleerd: Google-login met het beheeraccount, de 25 historische
wedstrijden in de app, 59 Angular-tests en vier configuratietests. De live
databasecontrole voor teams, meerdere seizoenen, wedstrijden, logo's en geweigerde
beheeracties zonder beheerdersrol is geslaagd; alle testwrites zijn teruggedraaid.
Een tweede Firebase-export om 12:59 UTC bevestigde dat de bron sinds de import ongewijzigd was.

## Controleren en publiceren

1. `npm run build:prod`: valideert publieke instellingen, bouwt en controleert de bundel.
2. `npm run test:ci` en `node --test scripts/verify-supabase-production.test.cjs`.
3. `npm run start:production`: lokale controle tegen echte productie op poort 4201.
4. Controleer Google-login, beheerrechten en de historische wedstrijden.
5. Commit op `main`, werk `production` bij met `git merge --ff-only main`.
6. `npm run deploy:prod`, push daarna beide branches. De deploycontrole vereist gelijke commits.

Alleen hosting wordt gepubliceerd. Een verkeerde testconfiguratie mag niet live komen.
Een Free-project kan na inactiviteit pauzeren; er is geen betaald abonnement afgesloten.

## Terugkeren bij problemen

De eerdere Firebase Hosting-release en Firestore-gegevens blijven beschikbaar.
Gebruik bij een storing de vorige Hosting-release. `npm run build:firebase-legacy`
kan de oude Firebase-backend expliciet bouwen, maar publiceert niets automatisch.
Stop eerst nieuwe writes en vergelijk gegevens als na de overstap al nieuwe
wedstrijden in Supabase zijn opgeslagen: die zijn niet automatisch teruggekopieerd naar Firebase.
