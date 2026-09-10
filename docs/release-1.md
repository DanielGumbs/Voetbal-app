# Release 1 — testen en veilig publiceren

## Wat deze release doet

De bestaande app wordt getest met de echte Firebase SDK, Auth-emulator en
Firestore-regels. Er is geen verbinding met de productie- of testdatabase.
Iedere E2E-test start met dezelfde verzonnen seizoenen, spelers en wedstrijden.
Tests lopen na elkaar omdat zij de emulatordata opnieuw aanmaken.

Playwright draait in desktop-Chromium, Chromium met Android-formaat en WebKit
met iPhone-formaat. Het controleert:

- Aanmelden, starten op Wedstrijden, uitloggen en het nieuwste seizoen.
- Mobiele navigatie, gelijke titelpositie en rangschikken op goals/assists.
- Lege statistieken met Spelersranglijst en Klaar voor de aftrap.
- Lange wedstrijd- en spelerslijsten op 320 × 568 zonder paginascroll.
- Adminroutes en verborgen beheerknoppen voor gewone leden.
- Wedstrijd opslaan met deelnemers, goal en assist; teruglezen uit Firestore.
- Verplichte velden en onvolledige gebeurtenisregels zonder databasewrite.
- Seizoen met competities en speler toevoegen, dropdown onder de knop zonder verspringen.

De zes Firestore-tests controleren lezen, adminwrites, ontbrekende/onbevestigde
identiteit, privilegeverhoging en ongeldige seizoen/competitiekoppelingen.
Zeven tests bewaken de releaseblokkades bij falende controles, ontbrekende
toestemming, een andere commit, lokale wijzigingen en een verkeerde branch.

### Grenzen van de tests

De Google-provider is alleen in de E2E-build vervangen door een unsigned
emulatorcredential. De aanmeldknop, Firebase-authstatus, het gebruikersprofiel,
de router en beveiligingsregels zijn echt. De productiebuild bevat deze adapter
niet; de buildcontrole weigert emulatorproject-ID's en testaccountschakelaars.
De browser blokkeert en rapporteert iedere externe HTTP-aanvraag.

Dit test geen echte Google-popup, Snapchat-webview, iOS-toetsenbord of fysiek
toestel. Controleer voor een release op de testsite nog handmatig aanmelden in
Safari/Chrome en het openen vanuit Snapchat. WebKit-emulatie vervangt die controle
niet. Wijzig tijdens een controle geen productiedata.

## Eenmalige lokale installatie

1. Installeer Node.js 22, Chrome en Java 21. Zet `JAVA_HOME` naar Java 21.
2. Voer onderstaande commando's uit vanuit de repository.

```bash
npm ci
npx playwright install chromium webkit
npm run hooks:install
```

Op Linux: `npx playwright install --with-deps chromium webkit`.
Een lokale portable Java-installatie onder `.tools/java21/<jdk-map>/bin/java.exe`
wordt op Windows automatisch gevonden als `JAVA_HOME` niet is ingesteld.
`.tools` wordt niet gecommit. De eerste emulatortest downloadt de Firestore-emulator.
Firebase-aanmelding is voor E2E niet nodig.

Poorten: Auth 9099, Firestore 8080, Angular 4300 (127.0.0.1). De Firebase CLI
gebruikt ook hulppoorten zoals 4400/4500/9150. Stop een eerdere emulatorrun als
een poort bezet is. Een bestaande server wordt bewust niet hergebruikt.

`npm run test:e2e` start en stopt de emulators en de app. `start:e2e` is alleen
de appserver; gebruik voor de tests altijd `test:e2e`. Traces en screenshots van
fouten staan in `test-results`, het HTML-rapport in `playwright-report`.

## GitHub-controles activeren

De workflow `.github/workflows/ci.yml` draait na een push naar `feature/*`, `main`
of `production` en op pull requests naar `main` en `production`. Ook handmatig
starten is mogelijk. Hij krijgt alleen leesrechten en geen Firebase-deploysecret.
De job **Release checks** controleert Prettier, releasebeveiliging, Angular-tests,
Firestore-regels, alle Playwright-profielen en de productiebuild. Een fout maakt
de job rood. Rapporten blijven zeven dagen beschikbaar.

**Een workflowbestand stelt geen branch protection in.** Na de eerste push en
geslaagde CI-run moet een repositorybeheerder dit in GitHub activeren:

1. Open `DanielGumbs/Voetbal-app` → Settings → Branches → Add branch protection rule.
2. Gebruik branch pattern `production`.
3. Zet **Require a pull request before merging** aan.
4. Zet **Require status checks to pass before merging** aan. Selecteer de door
   GitHub Actions uitgevoerde check **Release checks**.
5. Zet **Require branches to be up to date before merging** en **Do not allow
   bypassing the above settings** aan. Sta force pushes en verwijderen niet toe.
6. Herhaal bij voorkeur voor `main`. Houd de checknaam uniek.

Daniel keurt iedere productiemerge zelf goed. Bij meerdere beheerders kun je
ook een verplichte PR-review instellen; een auteur kan zijn eigen PR niet
goedkeuren. Bij een solo-repository is een verplichte review dus alleen haalbaar
met een tweede reviewer. Vereiste statuschecks en geen bypass blijven nodig.

Deze instellingen zijn nog niet op GitHub toegepast door deze featurebranch.
Beschikbaarheid hangt af van repositoryzichtbaarheid en GitHub-abonnement.
Zonder serverbeveiliging kan een lokale hook worden overgeslagen met `--no-verify`,
een andere checkout of rechtstreeks via de GitHub-interface. De npm-scripts
vervangen ook niet de toegangsrechten in Firebase.

Bronnen: [Playwright CI](https://playwright.dev/docs/ci),
[GitHub branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).

## Releaseprocedure

1. Ontwikkel op een featurebranch vanaf `main`. Voer `npm run release:check` uit.
2. Commit de wijzigingen en maak een PR naar `main`. Laat **Release checks** slagen.
3. Controleer desgewenst met `npm run deploy:test` op de aparte testsite en voer
   de korte fysieke telefooncontrole uit.
4. Maak een PR van `main` naar `production`, controleer de diff en wacht op groen.
5. **Vraag Daniel toestemming voor deze productiemerge/push.** Merge pas na zijn
   akkoord. GitHub moet de verplichte controles afdwingen.
6. Check de nieuwe `production`-commit lokaal uit en zorg voor een schone werkmap.
7. **Vraag afzonderlijk toestemming voor de deploy van die volledige commit-ID.**
8. Alleen na dat akkoord:

```powershell
git switch production
git pull --ff-only origin production
$releaseCommit = git rev-parse HEAD
npm run deploy:prod -- "--approve=$releaseCommit"
```

`deploy:prod` weigert een andere branch, lokale wijzigingen en ontbrekende of
verouderde toestemming. Het draait alle releasecontroles opnieuw, controleert dat
de broncode tijdens de tests niet veranderde en publiceert daarna uitsluitend
hosting en regels naar `voetbal-app-6fa54`. Het schrijft geen wedstrijddocumenten.
Dezelfde beveiliging geldt voor `npm run deploy -- --approve=<volledige-commit>`.
Een commit-ID als argument is de expliciete bevestiging door de uitvoerder; een
agent mag dit argument alleen gebruiken na Daniels akkoord.

### Lokale productiepush

Met de hook geïnstalleerd worden gewone feature/main-pushes doorgelaten.
Een push die `refs/heads/production` wijzigt, test eerst de exact uitgecheckte,
schone commit. Zonder toestemming stopt hij vóór de tests. Alleen als Daniel
een directe productiepush heeft goedgekeurd en de GitHub-regels dit toestaan:

```powershell
$env:PRODUCTION_PUSH_APPROVAL = git rev-parse HEAD
try {
  git push origin HEAD:production
} finally {
  Remove-Item Env:PRODUCTION_PUSH_APPROVAL
}
```

De hook start `release:check`, stopt bij fouten en controleert de commit nogmaals
na afloop. Hij weigert productie te verwijderen. Gebruik normaal de PR-route;
verzwak de branch protection niet om een directe push mogelijk te maken.

## Controle en herstel na een release

Controleer de live site na een goedgekeurde deploy: aanmelden, wedstrijdlijst,
statistieken en een bestaande wedstrijd openen. Controleer ook de updatebanner
bij een al geopend tabblad. Maak daarvoor geen nepwedstrijd in productie aan.

Bij een fout: noteer commit en foutmelding, stop verdere publicaties en bespreek
de concrete herstelversie met Daniel. Een vorige Hosting-release terugzetten in
Firebase herstelt alleen Hosting; databasegegevens en regels worden daarmee niet
teruggezet. Herstel regels via een beoordeelde revert-commit, laat alle controles
slagen en vraag opnieuw toestemming voor een productiedeploy. Ook een rollback
naar productie vereist toestemming.

Deze release voert geen datamigratie uit. Een volgende release die het datamodel
wijzigt, moet eerst een actuele productieback-up, een herstelproef op test en een
afzonderlijk goedgekeurd migratieplan krijgen. Een eenmalige oude testkopie is
geen actuele productieback-up.
