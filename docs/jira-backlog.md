# Epic: Meerdere teams, wedstrijdregistratie en tweetalige chat

Onderzocht op 15 september 2026. De epic en negen issues zijn op dezelfde dag via de ingelogde Chrome-sessie aangemaakt in Jira-project VOET. Een Jira-connector is niet beschikbaar; beheer kan via de browser. Dit document bewaart de volledige onderzoeksbasis. De oorspronkelijke opdracht buiten dit gesprek is niet beschikbaar; alle hier aangeleverde eisen zijn hieronder opgenomen.

## Jira-koppeling en uitvoervolgorde

Epic: [VOET-1 — Meerdere teams, wedstrijdregistratie en tweetalige chat](https://danielrgumbs.atlassian.net/browse/VOET-1).

| Volgorde | Backlogreferentie | Jira                                                                                             | Branch bij featurestart                  |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1        | FEATURE-01        | [VOET-2 — Projectonderzoek](https://danielrgumbs.atlassian.net/browse/VOET-2)                    | `codex/VOET-2-projectonderzoek`          |
| 2        | FEATURE-09        | [VOET-3 — Nederlandse en Engelse vertaalbasis](https://danielrgumbs.atlassian.net/browse/VOET-3) | `codex/VOET-3-nederlands-engels`         |
| 3        | FEATURE-02        | [VOET-4 — Teams en teamtoegang](https://danielrgumbs.atlassian.net/browse/VOET-4)                | `codex/VOET-4-meerdere-teams`            |
| 4        | FEATURE-03        | [VOET-5 — Seizoenen, selecties en bijnamen](https://danielrgumbs.atlassian.net/browse/VOET-5)    | `codex/VOET-5-seizoenen-selecties`       |
| 5        | FEATURE-04        | [VOET-6 — Gebeurtenissen en kaarten](https://danielrgumbs.atlassian.net/browse/VOET-6)           | `codex/VOET-6-wedstrijdgebeurtenissen`   |
| 6        | FEATURE-05        | [VOET-7 — Tweetalige chatinvoer](https://danielrgumbs.atlassian.net/browse/VOET-7)               | `codex/VOET-7-chatinvoer`                |
| 7        | FEATURE-06        | [VOET-8 — Chatcorrecties](https://danielrgumbs.atlassian.net/browse/VOET-8)                      | `codex/VOET-8-chatcorrecties`            |
| 8        | FEATURE-07        | [VOET-9 — Statistieken](https://danielrgumbs.atlassian.net/browse/VOET-9)                        | `codex/VOET-9-statistieken`              |
| 9        | FEATURE-08        | [VOET-10 — Beheer, export en oplevering](https://danielrgumbs.atlassian.net/browse/VOET-10)      | `codex/VOET-10-beheer-export-oplevering` |

Alle negen stories hebben VOET-1 als parent. Epic en stories staan op naam van Daniel in VOET Sprint 1 (nog niet gestart). Afhankelijkheden staan expliciet in de issuebeschrijvingen; nog geen afzonderlijke Jira-blocks-links aangemaakt. De oorspronkelijke FEATURE-nummers hieronder blijven stabiele documentreferenties. De oude gepushte onderzoeksbranch blijft behouden. Volgende branches ontstaan pas bij featurestart vanaf dan actuele main, na merge van de voorganger.

### Uitvoeringsstatus

- VOET-2 is Done: onderzoeks-[PR #2](https://github.com/DanielGumbs/Voetbal-app/pull/2) is gemerged. De aanwezige backendwijzigingen zijn apart beoordeeld, getest en behouden in [PR #3](https://github.com/DanielGumbs/Voetbal-app/pull/3), ook gemerged.
- Main na beide merges: `478662dd427e3ea3e04382f05cf0b1a292612f5c`. De oorspronkelijke werkmapwijzigingen zijn daarmee vastgelegd; geen bestanden weggegooid.
- VOET-3 is In Progress op `codex/VOET-3-nederlands-engels`, gestart vanaf die main. Runtime catalogi, instellingen, profieladapters en additieve migratie zijn geïmplementeerd. 39 unit-/componenttests slagen, waaronder conceptbehoud en profielraces.
- Nog nodig voor afronding VOET-3: Supabase-taalmigratie uitvoeren en rechtentests draaien in development; Firestore-regels in emulator toetsen; volledige schermcontrole in beide talen. Live profielopslag werkt pas na de backendwijziging. Productie is niet gepubliceerd. Teams (VOET-4) starten pas na afronding en merge van VOET-3.

## Baseline en werkwijze

- Main bij aanvang: `7511c3928d5ef66f70386bb38ddc9d53aa9af466`.
- De werkmap bevatte bij aanvang 21 gewijzigde tracked bestanden plus nieuwe Supabase-adapters, migraties en importscripts. Onderstaande inventaris beschrijft die baseline, inmiddels afzonderlijk behouden in PR #3.
- Onderzoeksbranch: `codex/VOET-2-projectonderzoek`. Alleen onderzoeksdocumentatie is in de onderzoeks-PR opgenomen.
- Eén feature tegelijk: onderzoek → vertaalbasis → teams → selecties → gebeurtenissen → chatinvoer → chatcorrecties → statistieken → beheer/export/oplevering. Elke voorganger moet in main staan voordat afhankelijke implementatie start.
- Maak iedere volgende branch op dat moment vanaf opnieuw opgehaalde actuele main. De namen hieronder zijn gereserveerde branchnamen, geen verklaring dat ze al bestaan. Vervang bij beschikbare Jira-key `feature-NN` door die key.
- De bestaande backendwissel moet als gecontroleerde baseline in main staan voordat de vertaalbasis beide adapters kan uitbreiden. Leg de review/merge daarvan afzonderlijk vast; neem geen wijzigingen van de gebruiker ongemerkt over in een featurecommit.
- Elke feature krijgt een gecontroleerde PR naar main. Geen automatische productiepublicatie. Productie blijft via een schone `production`-branch en `scripts/verify-production-branch.cjs` verlopen.

## Daadwerkelijke implementatie

| Onderdeel            | Aanwezig en hergebruik                                                                                                                                                                  | Ontbreekt / uitbreiding                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Angular en navigatie | Angular 21, standalone componenten, reactive forms/signals; routes `/games`, `/games/new`, `/games/:id`, `/seasons`, `/leaderboard` in `src/app/app.routes.ts`                          | Instellingen, teamselectie en chat ontbreken. Bestaande componentstructuur behouden.                                                       |
| Login en rollen      | Google-login; development redirect via `supabase.ts`, productie popup via `backend.production.ts`; `AdminService` volgt geverifieerde profielrol; guard voor wedstrijd/seizoen aanmaken | Globale boolean `isAdmin`, geen teamlidmaatschap of rollenbeheer in UI. Alle ingelogden lezen momenteel alle teamgegevens.                 |
| Seizoenen            | `SeasonService`, `SeasonSelector`, `SeasonManager`; seizoen plus competitie/beker atomair via SQL RPC of Firestore batch; selectie blijft bij navigeren bestaan                         | Geen teamcontext of selectieopslag per team. `previous-season` is expliciete legacy-fallback voor ontbrekend seasonId.                     |
| Spelers              | `PlayerService`: naam, rugnummer, seasonId, competitionIds; selectie in seizoenbeheer en deelnemerslijst bij wedstrijd                                                                  | Geen alias, stabiele persoon over seizoenen, spelersovername, teamId of bewerken.                                                          |
| Wedstrijden          | `CreateGame`, `GameList`, `GameDetailComponent`; tegenstander, datum, optionele scores, deelnemers, competitie en gebeurtenissen                                                        | Alleen toevoegen/lezen. Geen opgeslagen wedstrijd wijzigen. Geen kaarten, chat, audit, event-ID, revision of idempotentie.                 |
| Goals en assists     | `GameEvent = {playerId, type: 'goal' \| 'assist'}`; array per wedstrijd, één item per goal/assist; detail groepeert per speler                                                          | Geen geel/direct rood/tweede geel. Scores en eventaantallen worden niet vergeleken. Historische events hebben geen identiteit.             |
| Klassement           | `LeaderboardComponent` telt wedstrijden via `players`, goals/assists via `events`; tabs totaal/goals/assists, seizoen- en competitiefilter                                              | Topscorers bestaan al! Uitbreiden met kaarten, W/G/V, voor/tegen/doelsaldo, teamfilter en volledigheid. Geen nieuw klassement bouwen.      |
| Talen                | Nederlandse teksten in HTML én TypeScript; vaste `dd-MM-yyyy` en `localeCompare(..., 'nl')`; extract-i18n builder aanwezig                                                              | Geen runtime vertaalondersteuning, vertaalbestanden, taalkeuze of profielveld. De builder alleen levert geen live taalwisseling.           |
| Mobiel               | Tailwind breakpoints, scrollregio's, touchknoppen en herbruikbare `SelectField` met toetsenbordtests                                                                                    | Nieuwe flows moeten bij smalle schermen en mobiel toetsenbord getest worden; huidige visuele werking niet live bevestigd in dit onderzoek. |
| Export               | Importscripts/back-ups voor technische migratie                                                                                                                                         | Geen gebruikers-CSV van wedstrijden/statistieken.                                                                                          |

### Opslag, beveiliging en concrete aandachtspunten

- Development: `src/services/supabase.ts` biedt `watch`, `add`, `addSeason`. `watch` pagineert per 1000 rijen, subscribe/refresh via Realtime. Filtering op seizoen gebeurt nu in services na ophalen.
- Productie: `src/services/backend.production.ts` gebruikt Firestore-collecties, `addDoc`, `writeBatch`. `angular.json` vervangt appconfig, backend, profielservice en environment voor productie. Deze scheiding blijft intact; geen automatische synchronisatie of fallback naar de andere backend.
- `supabase/migrations/202609150001_team.sql`: users, seasons, competitions, players, games; events JSONB, spelers-ID's in arrays. RLS laat ingelogden alle sportgegevens lezen; alleen admins inserts. Profielen zijn client-readonly. `202609150002_confirmed_profiles.sql` regelt geverifieerde profielaanmaak.
- `firestore.rules`: eigen profiel lezen/strikt aanmaken, geen profielupdates; globale admin voor toevoegen, geen game/player updates. Een taalveld vereist dus expliciete veilige profielupdate-regels in beide backends.
- Backendvalidatie is nog niet gelijkwaardig: SQL heeft checks voor niet-negatieve scores; Firestore valideert scores en individuele events niet. Geen van beide bewijst nu voor elk event dat speler/deelnemer/seizoen bij de wedstrijd hoort. Voeg dit toe bij gebeurtenissen/teamcontext, niet alleen in de browser.
- `getGames(true)` en `getPlayers(true)` in wedstrijddetail halen alle seizoenen op. Bij teamuitbreiding mag `true` nooit teamisolatie omzeilen; voeg backendfilters plus regels toe.
- `CreateGame.submit()` valideert deelnemers/eventspelers en heeft een lokale saving-vlag, maar geen server-idempotentie. Ook ontbreekt een expliciete `form.invalid`-guard in submit; validatie van scores en events moet server-side sluitend worden.
- `GameList` verbergt `friendly`, terwijl het klassement bij 'all' deze wedstrijden kan meetellen. Leg een gedeeld competitiebeleid vast en test het; historische friendly-data behouden.
- Naam 'Vedette' en clubpresentatie staan vast in templates. Vervang bij teams door geselecteerde teamgegevens; vertaal de naam niet.
- `SeasonService` sorteert op seizoensnaam en selecteert standaard de eerste niet-legacy-optie. Bij nieuwe teamcontext selectie expliciet herstellen/valideren om gegevens van het vorige team niet te tonen.

### Historische gegevens

README beschrijft een eerdere kopie naar Supabase: 2 seizoenen, 4 competities, 18 spelers, 25 wedstrijden, 167 goals en 126 assists. Dit zijn gedocumenteerde eerdere tellingen, niet opnieuw live gemeten in dit onderzoek. Bestaande export/importscripts behouden ID's en controleren checksums; gebruik die aanpak opnieuw. Lees productie uitsluitend voor inventarisatie/back-up, voer geen migratie uit als onderdeel van dit onderzoek.

### Tests en verificatiestatus

- Gevonden: 8 spec-bestanden voor app/loginweergave, navbar, selectveld, adminservice/guard, Firebase-authadapter, Supabase-authadapter en update-detectie. Geen unit-tests voor game/player/season-services of statistiekaggregatie, geen volledige invoer/correctie-E2E en geen Firestore emulatorregeltests gevonden.
- `supabase/tests/team_smoke.sql` bevat transactionele opslag/rechtentests; README meldt eerder live geslaagd. Niet opnieuw uitgevoerd hier.
- Hercontrole 15 september 2026 na opheffen sandboxbeperking: `npm run test:ci` slaagt met **27/27 tests**. De eerdere bundlerfout bleek omgevingsgebonden.
- `npm run build:test` en `npm run build:prod` slagen; `verify-build-environment.cjs` bevestigt respectievelijk Supabase en Firebase. Productie heeft een bestaande bundlegroottewaarschuwing (671,76 kB tegenover 500 kB waarschuwingsbudget, onder 1 MB foutgrens).
- Geen applicatiecode gewijzigd voor het onderzoek. De aanwezige backendbasis is apart beoordeeld en via PR #3 in main geïntegreerd vóór VOET-3. Live mobiele QA en backend-integratietests blijven expliciete implementatiechecks; builds/unit-tests bewijzen geen live databasewerking.

## Gemeenschappelijke Definition of Done

Alle features behouden bestaande gegevens en Angular-structuur. Nederlands én Engels zijn verplicht, inclusief lege toestanden, validatie, toegankelijkheidslabels en errors. Team-/seizoenfilters gelden ook backend-side. Nieuwe eventtypes hebben taalonafhankelijke codes. Controleer developmentbuild op afwezigheid Firebase en productiebuild op Firebase-configuratie; voer passende unit-, regel- en integratietests uit voor beide backends. PR vermeldt migratie, rollback, tests en beperkingen. Geen productie-release door een feature af te ronden.

## FEATURE-01 — Projectonderzoek en aangepaste backlog

Branch: `codex/feature-01-projectonderzoek`.

**Scope:** schermen, gegevensmodellen, rechten, tests, doelen/kaarten en backendverschillen inventariseren; hergebruik en afhankelijkheden vastleggen; één epic en negen issues voorbereiden.

**Acceptatie:** bovenstaande inventaris onderscheidt broncodebewijs, bestaande documentatie en nog niet uitgevoerde checks; elke onderstaande feature heeft scope, backendimpact, criteria, tests en voorgangers. Bestaande edits blijven behouden.

**Backends:** alleen analyse; geen schema-/datamutaties.

**Afhankelijkheden:** geen. Review van bestaande niet-gecommitte backendbasis is een afzonderlijke integratievoorwaarde voor FEATURE-09.

**Testaanpak:** bronverwijzingen en modellen controleren, bestaande tests proberen, branchbasis verifiëren. Status: documentatie gereed; PR/merge en uitvoerbare tests nog te regelen.

## FEATURE-09 — Nederlandse en Engelse vertaalbasis (als tweede uitvoeren)

Branch: `codex/feature-09-nederlands-engels`.

**Scope:** centrale NL/EN-catalogi; reactieve vertaaldienst/pipe passend bij standalone Angular, instellingen met Nederlands / English. Vertaal alle bestaande routes, navbar, login, seizoen-/spelerschermen, wedstrijden, statistieken, errors, laad-/lege toestanden en updatebanner. Geen paginareload of reconstructie van formulieren bij taalwisseling.

**Acceptatiecriteria:**

1. Eerste bezoek kiest ondersteunde browsertaal (`nl-*` → nl, `en-*` → en), anders Nederlands. Taalcodes zijn `nl`/`en`.
2. Expliciete keuze direct opslaan op apparaat en voor ingelogden in eigen profiel. Bij login geldt geldige profielkeuze boven apparaatkeuze boven browserkeuze; profiel zonder taal neemt de lokale keuze over. Traag profielantwoord mag een nieuwere gebruikerskeuze niet overschrijven.
3. Vernieuwen en opnieuw inloggen behouden taal. Netwerkfout bij profielsave toont vertaalde melding en behoudt lokale keuze/concept; bied opnieuw proberen aan.
4. Wisselen werkt onmiddellijk zonder uitloggen, navigeren of verlies van wedstrijd-/seizoensinvoer. Locale-formattering voor datums/getallen; datum zonder tijd mag geen dag verschuiven.
5. Namen van spelers, teams, tegenstanders en eigen notities blijven identiek. Ook bestaande competitiecodes blijven intact; alleen labels veranderen. 'Vorig seizoen' als systeemaanduiding vertalen, eigen seizoensnamen behouden.
6. Ontbrekende vertaling valt terug op leesbare Nederlandse tekst of expliciete standaardtekst, nooit een interne sleutel. Documenttaal en toegankelijkheidslabels volgen de keuze.
7. Nieuwe features leveren beide catalogi aan. Chat accepteert later NL én EN ongeacht UI-taal en antwoordt in UI-taal; FEATURE-05/06 implementeren dit op deze basis.

**Supabase:** additieve migratie voor nullable `users.language` met check nl/en; veilig eigen-taalupdate via beperkte kolomrechten/RLS of RPC. `isAdmin`/email/id onveranderbaar voor browser; profieltrigger behoudt rollen en taal. Oude profielen blijven geldig.

**Firebase:** eigen profielservice leest/schrijft optionele `language`; rules staan uitsluitend eigen taalwijziging toe via veld-diff en enumcheck, met behoud van rol/email. Oude profielen zonder veld blijven geldig; profielaanmaak compatibel uitbreiden. Geen data kopiëren tussen backends.

**Afhankelijkheden:** FEATURE-01 en gecontroleerde huidige backendbasis in main; vóór FEATURE-02.

**Testaanpak:** unit-tests voor detectie/voorrang/fallback/storagefouten/races; profielregeltets voor eigen/andere gebruiker en rol-escalatie; alle schermen in twee talen, wissel midden in formulier, refresh/relogin, browser fr → nl, getal/datumformattering, gelijke opgeslagen gegevens. Beide builds.

## FEATURE-02 — Teams, sporttype, migratie en teamtoegang

Branch: `codex/feature-02-meerdere-teams`.

**Scope:** teams beheren/kiezen; sportcode `field` of `futsal` per team; teamcontext door bestaande services/schermen; lidmaatschap als toegangsgrondslag. Initieel huidig team expliciet bevestigen in migratiemanifest, niet afleiden uit vrije tekst.

**Acceptatie:** team A kan team B niet lezen/schrijven via URL, query, realtime of direct API-verzoek. Wisselen toont geen oude data terwijl nieuwe data laadt. Teamtype blijft bewaard. Oude ID's/scores/events/assists/historie behouden. Huidige gebruikers krijgen expliciet geverifieerde toegang volgens manifest; niet alle toekomstige logins automatisch lid maken. Niet-leden standaard weigeren.

**Gegevens:** teams(id,name,sportType), memberships(teamId,userId,role), teamId op seasons/competitions/players/games; rollen owner/admin/member, bevoegdhedenmatrix vastleggen. Globale admin geeft niet automatisch toegang tot alle teams. Gecombineerde team/seizoensvalidatie; teamloze legacyrijen gecontroleerd backfillen.

**Supabase:** additieve kolommen en FK's/indexen, lidmaatschap-RLS en teamgefilterde queries/realtime; aangepaste add_season RPC. Beperk verwijzingen tot hetzelfde team, na backfill teamId verplicht maken.

**Firebase:** team- en lidmaatschapsdocumenten, teamId op bestaande documenten, membership-rules en teamqueries/indexen; batch voor seizoenaanmaak aanpassen. Pas queries tegelijk met rules aan (regels zijn geen filters).

**Migratie:** per backend export + checksum + tellingen; dry-run met mapping van alle objecten/gebruikers; schrijven onder gecontroleerd onderhoudsmoment; herhaalbaar manifest met migratieversie; postcheck totalen en verwijzingen; beperkingen pas na succesvolle backfill aanscherpen. Rollback via bewaarde mapping/back-up en compatibele vorige regels/app, zonder nieuwe gegevens te overschrijven. Geen twee omgevingen synchroniseren.

**Afhankelijkheden:** FEATURE-09.

**Testaanpak:** twee teams/twee gebruikers, directe cross-team requests en ingetrokken lidmaatschap; migration dry-run, herhaling, gedeeltelijke fout/rollback; originele eventaantallen en ID's vergelijken; NL/EN teamwissel en beide backendregels.

## FEATURE-03 — Seizoenen, selecties en bijnamen per team

Branch: `codex/feature-03-seizoenen-selecties`.

**Scope:** hergebruik seizoenbeheer/selector en PlayerService; selectie per team/seizoen; spelers overnemen zonder historie te verplaatsen; bijnamen voor chatherkenning.

**Acceptatie:** team-/seizoenwisseling toont juiste selectie/historie; nieuw seizoen maakt competitie/beker atomair; overname herhalen maakt geen duplicaten. Oude event-playerId verwijzingen blijven geldig. Bijnamen mogen ambigu zijn; resolver vraagt dan verduidelijking. Namen/notities onvertaald.

**Gegevens:** behoud bestaande seizoensspelers en hun ID; voeg optionele stabiele personId en aliases toe, nieuwe selectie krijgt eigen seizoenrecord. Unique team/season/person voor overname met idempotentiesleutel; historische ontbrekende personId gecontroleerd mappen, nooit op naam alleen samenvoegen.

**Supabase:** person/aliasvelden of relationele tabellen, unieke overnameconstraint, transactionele kopieer-RPC en team-RLS. **Firebase:** persoon/aliasvelden en transactioneel overnamemanifest met deterministische doel-ID's, team-/seizoenregels en indexen.

**Afhankelijkheden:** FEATURE-02.

**Testaanpak:** overname/tweemaal overname, gelijke namen, oude speler niet meer actief, per-team selectie, fout midden in transactie; NL/EN en beide backends.

## FEATURE-04 — Wedstrijdgebeurtenissen en handmatige correcties

Branch: `codex/feature-04-wedstrijdgebeurtenissen`.

**Scope:** bestaande create/detail/list uitbreiden; behoud goal/assist; voeg `yellow_card`, `direct_red_card`, `second_yellow_card` toe. Stable event-ID, revision, audit en gedeelde validatie. Handmatige correctie van bestaande wedstrijd/events.

**Acceptatie:** niet-negatieve gehele scores, geldige spelers binnen team/seizoen/deelnemers, geldige eventcodes; onvolledige doelregistratie mag met expliciete status, geen verzonnen goals. Correctie behoudt event-ID en past bestaande gebeurtenis aan; verwijdering controleerbaar markeren, geen dubbeltelling. Tweede geel telt afzonderlijk als tweede gele kaart en één uitsluiting; geen automatische extra direct-rood-event. Kaartenoverzicht onderscheidt direct rood en tweede geel.

**Gegevens:** events uitbreiden met id, revision, type, playerId; wedstrijd schemaVersion/revision en registratievolledigheid; audit met actor, timestamp, before/after, mutationId. Oude arrays compatibel lezen; stabiele legacy-ID's eenmalig/deterministisch op oorspronkelijke positie toekennen, niet na sorteren. Assists blijven bestaan.

**Supabase:** transactionele mutatie-RPC met revisioncheck, eventvalidatie, audit en unieke mutationId; JSONB compatibel uitbreiden of gecontroleerd normaliseren met behoud van oude referenties. **Firebase:** transactionele/trusted mutatielaag met eventvalidatie, revision en atomair audit/idempotentiedocument; bestaande write-regels niet breed openzetten. Maak backendvalidatie gelijkwaardig.

**Afhankelijkheden:** FEATURE-03.

**Testaanpak:** dubbele goals zelfde speler, ieder kaarttype, ongeldige speler, twee gelijktijdige correcties, retry na timeout, legacy arrays en assists, onvolledige score; totalen na correctie en NL/EN labels identiek.

## FEATURE-05 — Tweetalige chatinvoer binnen geselecteerde wedstrijd

Branch: `codex/feature-05-chatinvoer`.

**Scope:** chat in bestaande wedstrijddetail; parser produceert gestructureerd concept, geen directe writes. Resolver gebruikt geselecteerde team-/seizoensselectie plus bijnamen; UI houdt concept vast.

**Acceptatiecriteria:**

1. '4-2 gewonnen van De Adelaars. Daan twee goals, Sam twee, Bram geel.' levert voorstel score 4–2, vier goal-events (2 Daan, 2 Sam), één yellow_card voor Bram. Match geselecteerde tegenstander; bij afwijking verduidelijking, geen andere wedstrijd stilzwijgend openen/aanmaken.
2. 'Daan scoorde twee keer en Bram kreeg geel.' en 'Daan scored twice and Bram received a yellow card.' leveren dezelfde wedstrijdmutatie. Begrijp beide invoertalen onafhankelijk van interface; ook gemengde invoer testen.
3. Onbekende/dubbelzinnige namen of onduidelijke score/kaart vragen door. Geen nieuwe speler verzinnen of willekeurig kiezen. Niet-deelnemer eerst expliciet oplossen via voorstel.
4. Bewerkbaar voorstel toont uitslag, spelers, aantallen, kaarttypes en verschil met al opgeslagen gegevens. Scoreconflict en onvolledige registratie zichtbaar; geen bestaande gebeurtenissen ongemerkt verdubbelen.
5. Alleen expliciete bevestiging schrijft atomair. Herhaald bevestigen, netwerkretry en dubbele tabs gebruiken dezelfde mutationId en leveren hoogstens één mutatie. Bij gewijzigde wedstrijdrevision nieuw voorstel/bevestiging.
6. Annuleren schrijft niets. Chatstoring laat handmatige invoer/correctie beschikbaar en bewaart concept. Taalwisseling behoudt concept, vertaalt verduidelijking/voorstel/antwoord direct.

**Supabase:** beveiligde serverfunctie/Edge Function voor chatprovider, autorisatie en gestructureerde validatie; bevestiging via FEATURE-04 RPC. **Firebase:** gelijkwaardig beveiligd endpoint/Cloud Function en transactionele bevestiging. Providersleutels uitsluitend server-side. Gedeeld contract met eventcodes, inputtaal onafhankelijk van responseLocale; AI-uitvoer altijd server-side valideren.

**Afhankelijkheden:** FEATURE-04 en aliases uit FEATURE-03.

**Testaanpak:** voorbeelden NL/EN, onbekend/twee keer Daan, afwijkende tegenstander, ongeldige provideroutput, prompttekst die om directe save vraagt, annuleren, twee bevestigingen, timeout na commit, dienstuitval en mobiele taalwisseling. Contracttests op beide backends.

## FEATURE-06 — Chatcorrecties met audit

Branch: `codex/feature-06-chatcorrecties`.

**Scope:** correctieverzoeken resolven naar opgeslagen event-ID/revision; voorstel met voor/na. Gebruik mutatie- en auditlaag van FEATURE-04.

**Acceptatie:** 'Eén goal van Sam was eigenlijk van Daan.' wijzigt één bestaand Sam-goal naar Daan; aantal goals en score blijven gelijk. Bij meerdere kandidaat-events eerst specificeren/selecteren, nooit zelf een event kiezen. Geen kandidaat betekent uitleg en verduidelijking. Bevestiging vereist; wie/wat/wanneer wordt bewaard. Geen extra goal-event aanmaken. Repeated confirm wijzigt één keer. Oude revision leidt tot conflict en nieuw voorstel. Engels equivalent werkt met antwoorden in UI-taal.

**Supabase:** uitbreiden correctiecontract/RPC met verwacht event en revision, audit in dezelfde transactie. **Firebase:** hetzelfde transactionele correctiecontract en audit, membership opnieuw controleren bij bevestigen. Audit niet door cliënten overschrijfbaar.

**Afhankelijkheden:** FEATURE-05.

**Testaanpak:** één/twee/geen Sam-goals, gewijzigd/verwijderd event tussen voorstel en bevestigen, concurrente correctie, ingetrokken rechten, dubbele bevestiging, auditidentiteit, NL/EN zelfde statistische uitkomst.

## FEATURE-07 — Klassement en consistente statistieken

Branch: `codex/feature-07-statistieken`.

**Scope:** hergebruik bestaande tabs en berekeningen; centrale aggregatie voor UI en export. Voeg kaartentotalen, winst/gelijk/verlies, voor/tegen/doelsaldo en doelregistratievolledigheid toe.

**Acceptatie:** topscorers/assists/gespeeld blijven beschikbaar. Alleen gespeelde wedstrijden met beide geldige scores tellen voor W/G/V en doelsaldo; ontbrekende score is geen 0–0. Gefilterde team-/seizoen-/competitieset is overal dezelfde, inclusief expliciet friendly-beleid. Toon verschil tussen scoreTeam en geregistreerde goals, en label historisch onvolledig/onbekend. Correcties verversen totalen zonder dubbeltelling; verwijderde events tellen niet. Geel (inclusief tweede geel), direct rood en tweede-geel-uitsluitingen apart inzichtelijk. Beide talen tonen exact dezelfde cijfers.

**Supabase:** geautoriseerde team-/seizoenqueries/indexen; aggregatie vanuit canonieke wedstrijden/events, eventuele view onder RLS. **Firebase:** equivalente queries/indexen; geen ongecontroleerde globale totals; eventuele cache alleen met correcte transactionele invalidatie. Begin zonder persistente dubbele totalen als bestaande berekening volstaat.

**Afhankelijkheden:** FEATURE-06 in de gekozen seriële uitvoervolgorde; technisch FEATURE-04/02 voor events/teams.

**Testaanpak:** vaste dataset met winst/gelijk/verlies/gepland, kaarten, friendly, legacy onvolledig, correcties en dubbele mutationId. Verwachte totalen onafhankelijk narekenen; filtercombinaties, ontbrekende speler, nulwaarden en beide talen/backends.

## FEATURE-08 — Ledenbeheer, CSV, mobiel en volledige oplevering

Branch: `codex/feature-08-beheer-export-oplevering`.

**Scope:** UI voor lidmaatschappen/rollen uit FEATURE-02; geautoriseerde CSV van wedstrijden en statistieken; mobiele QA, volledige E2E en beheerdocumentatie.

**Acceptatie:** alleen bevoegde teambeheerder beheert leden; laatste owner niet verwijderen/degraderen; geen eigen ongeoorloofde escalatie. Verwijderde toegang werkt direct. CSV gebruikt dezelfde selectie en aggregatie als scherm, correcte Unicode/quoting, expliciete datum/getalconventie en bescherming tegen spreadsheetformules in vrije tekst. Export bevat geen andere teams. Mobiele volledige flow bruikbaar met toetsenbord, lange namen en beide talen. Documentatie beschrijft omgeving, migratie/rollback, rollen, chatfallback, taalgedrag en productieprocedure.

**Supabase:** beveiligde membership-RPC's en laatste-ownercheck transactioneel; exportquery onder RLS. **Firebase:** geautoriseerde membershiptransacties/endpoint en laatste-ownercheck; exports via toegestane teamqueries. Profieltaal en globale legacyrol blijven beschermd.

**Afhankelijkheden:** FEATURE-07; gebruikt FEATURE-02 membershipmodel en alle invoerfeatures.

**Testaanpak:** twee gebruikers met verschillende rollen, rolwijziging tijdens save, CSV-roundtrip met komma/quote/newline/accent/formuleprefix, totalen vergelijken met UI; E2E in NL/EN: login → team → seizoen → wedstrijd → chat → bevestigen → correctie → statistiek → export. Breedtes 320/375/768 px, mobiel toetsenbord, focus en schermlezerlabels. Beide backends en migratieherhaling; productie uitsluitend via afzonderlijke promotion/release.
