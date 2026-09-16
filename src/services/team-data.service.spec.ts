import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AdminService } from './admin.service';
import { Game, GameService } from './game.service';
import { Player, PlayerService } from './player.service';
import { LEGACY_SEASON, Season, SeasonService } from './season.service';
import { Database } from './supabase';
import { IVV_TEAM, LEGACY_TEAM } from './team.model';
import { TeamService } from './team.service';

describe('Team seasons, players and games', () => {
  let selectedTeam: BehaviorSubject<string>;
  let seasonRows: BehaviorSubject<Season[]>;
  let playerRows: BehaviorSubject<Player[]>;
  let gameRows: BehaviorSubject<Game[]>;
  let seasons: SeasonService;
  let players: PlayerService;
  let games: GameService;
  let subscriptions: Subscription;
  let add: jasmine.Spy;
  let addSeason: jasmine.Spy;
  let assertAdmin: jasmine.Spy;

  beforeEach(() => {
    selectedTeam = new BehaviorSubject<string>(LEGACY_TEAM);
    seasonRows = new BehaviorSubject<Season[]>([
      { id: 'vedette-2025', name: '2025 / 2026' },
      { id: 'vedette-2026', name: '2026 / 2027', teamId: LEGACY_TEAM },
      { id: 'ivv-2026', name: '2026 / 2027', teamId: IVV_TEAM },
    ]);
    playerRows = new BehaviorSubject<Player[]>([
      { id: 'historic-player', name: 'Historisch', number: 1 },
      { id: 'vedette-player', name: 'Vedette', number: 2, seasonId: 'vedette-2026' },
      { id: 'ivv-player', name: 'IVV', number: 3, seasonId: 'ivv-2026', teamId: IVV_TEAM },
    ]);
    gameRows = new BehaviorSubject<Game[]>([
      {
        id: 'historic-game',
        opponent: 'Historisch',
        date: '2024-01-01',
        league: 'friendly',
        events: [],
      },
      {
        id: 'vedette-game',
        opponent: 'Vedette',
        date: '2026-01-01',
        league: 'competitie',
        events: [],
        seasonId: 'vedette-2026',
      },
      {
        id: 'ivv-game',
        opponent: 'IVV',
        date: '2026-01-01',
        league: 'beker',
        events: [],
        seasonId: 'ivv-2026',
        teamId: IVV_TEAM,
      },
    ]);
    add = jasmine.createSpy('add').and.resolveTo({ id: 'new-record' });
    addSeason = jasmine.createSpy('addSeason').and.resolveTo('new-season');
    assertAdmin = jasmine.createSpy('assertAdmin');
    const tables: Record<string, Observable<unknown[]>> = {
      seasons: seasonRows,
      players: playerRows,
      games: gameRows,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TeamService, useValue: { selected: selectedTeam } },
        {
          provide: Database,
          useValue: { watch: (table: string) => tables[table], add, addSeason },
        },
        { provide: AdminService, useValue: { assertAdmin } },
      ],
    });
    seasons = TestBed.inject(SeasonService);
    players = TestBed.inject(PlayerService);
    games = TestBed.inject(GameService);
    subscriptions = new Subscription();
  });

  afterEach(() => subscriptions.unsubscribe());

  it('isolates seasons and reserves the historical season for Vedette', () => {
    let options: Season[] = [];
    subscriptions.add(seasons.getSeasons().subscribe((value) => (options = value)));
    expect(options.map((season) => season.id)).toEqual([
      'vedette-2026',
      'vedette-2025',
      LEGACY_SEASON,
    ]);
    expect(seasons.selected.value).toBe('vedette-2026');
    selectedTeam.next(IVV_TEAM);
    expect(options.map((season) => season.id)).toEqual(['ivv-2026']);
    expect(seasons.selected.value).toBe('ivv-2026');
    seasonRows.next(seasonRows.value.filter((season) => season.teamId !== IVV_TEAM));
    expect(options).toEqual([]);
    expect(seasons.selected.value).toBe(LEGACY_SEASON);
    expect(() => seasons.assertWritableSelection()).toThrowError(/seizoen/);
  });

  it('keeps a season across routes but clears it immediately on an off-route team switch', () => {
    const firstRoute = seasons.getSeasons().subscribe();
    seasons.selected.next('vedette-2025');
    firstRoute.unsubscribe();
    const secondRoute = seasons.getSeasons().subscribe();
    expect(seasons.selected.value).toBe('vedette-2025');
    secondRoute.unsubscribe();
    selectedTeam.next(IVV_TEAM);
    expect(seasons.selected.value).toBe(LEGACY_SEASON);
    expect(() => seasons.assertWritableSelection()).toThrowError(/seizoen/);
    subscriptions.add(seasons.getSeasons().subscribe());
    expect(seasons.selected.value).toBe('ivv-2026');
  });

  it('filters season records and all-time statistics by team, including untagged history', () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    let activePlayers: Player[] = [];
    let allPlayers: Player[] = [];
    let activeGames: Game[] = [];
    let allGames: Game[] = [];
    subscriptions.add(players.getPlayers().subscribe((value) => (activePlayers = value)));
    subscriptions.add(players.getPlayers(true).subscribe((value) => (allPlayers = value)));
    subscriptions.add(games.getGames().subscribe((value) => (activeGames = value)));
    subscriptions.add(games.getGames(true).subscribe((value) => (allGames = value)));
    expect(activePlayers.map((player) => player.id)).toEqual(['vedette-player']);
    expect(activeGames.map((game) => game.id)).toEqual(['vedette-game']);
    expect(allPlayers.map((player) => player.id)).toEqual(['historic-player', 'vedette-player']);
    expect(allGames.map((game) => game.id)).toEqual(['historic-game', 'vedette-game']);
    seasons.selected.next(LEGACY_SEASON);
    expect(activePlayers.map((player) => player.id)).toEqual(['historic-player']);
    expect(activeGames.map((game) => game.id)).toEqual(['historic-game']);
    selectedTeam.next(IVV_TEAM);
    expect(activePlayers.map((player) => player.id)).toEqual(['ivv-player']);
    expect(activeGames.map((game) => game.id)).toEqual(['ivv-game']);
    expect(allPlayers.map((player) => player.id)).toEqual(['ivv-player']);
    expect(allGames.map((game) => game.id)).toEqual(['ivv-game']);
  });

  it('captures the active team and season in writes and overrides supplied game identity', async () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    selectedTeam.next(IVV_TEAM);
    const playerWrite = players.addPlayer('  Nieuwe speler  ', 9, [
      'competitie',
      'beker',
      'competitie',
    ]);
    const gameWrite = games.addGame({
      opponent: 'Opponent',
      date: '2026-09-16',
      league: 'beker',
      events: [],
      teamId: LEGACY_TEAM,
      seasonId: 'vedette-2026',
      competitionId: 'wrong-competition',
    });
    selectedTeam.next(LEGACY_TEAM);
    await Promise.all([playerWrite, gameWrite]);
    expect(add.calls.argsFor(0)).toEqual([
      'players',
      {
        name: 'Nieuwe speler',
        number: 9,
        teamId: IVV_TEAM,
        seasonId: 'ivv-2026',
        competitionIds: ['ivv-2026_competitie', 'ivv-2026_beker'],
      },
    ]);
    expect(add.calls.argsFor(1)).toEqual([
      'games',
      {
        opponent: 'Opponent',
        date: '2026-09-16',
        league: 'beker',
        events: [],
        teamId: IVV_TEAM,
        seasonId: 'ivv-2026',
        competitionId: 'ivv-2026_beker',
      },
    ]);
    expect(assertAdmin).toHaveBeenCalledTimes(2);
  });

  it('never emits the previous team while resetting the season during a team change', () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    const unexpectedTeams: string[] = [];
    const verify = (rows: { teamId?: string | null }[]) => {
      for (const row of rows) {
        if ((row.teamId ?? LEGACY_TEAM) !== selectedTeam.value) {
          unexpectedTeams.push(row.teamId ?? LEGACY_TEAM);
        }
      }
    };
    subscriptions.add(players.getPlayers().subscribe(verify));
    subscriptions.add(players.getPlayers(true).subscribe(verify));
    subscriptions.add(games.getGames().subscribe(verify));
    subscriptions.add(games.getGames(true).subscribe(verify));
    selectedTeam.next(IVV_TEAM);
    selectedTeam.next(LEGACY_TEAM);
    expect(unexpectedTeams).toEqual([]);
  });

  it('rejects writes without a valid team season and competitions outside the managed types', async () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    const game: Game = {
      opponent: 'Opponent',
      date: '2026-09-16',
      league: 'competitie',
      events: [],
    };
    seasons.selected.next(LEGACY_SEASON);
    await expectAsync(players.addPlayer('Speler', 9, ['competitie'])).toBeRejectedWithError(
      /seizoen/,
    );
    expect(() => games.addGame(game)).toThrowError(/seizoen/);
    selectedTeam.next(IVV_TEAM);
    seasons.selected.next('vedette-2026');
    expect(() => games.addGame(game)).toThrowError(/seizoen/);
    seasons.selected.next('ivv-2026');
    await expectAsync(players.addPlayer('Speler', 9, ['friendly'])).toBeRejectedWithError(
      /competitie/,
    );
    expect(() => games.addGame({ ...game, league: 'friendly' })).toThrowError(/competitie/);
    expect(add).not.toHaveBeenCalled();
  });

  it('keeps a season creation tied to its original team when the team changes during saving', async () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    let finish!: (value: string) => void;
    addSeason.and.returnValue(new Promise<string>((resolve) => (finish = resolve)));
    const saving = seasons.addSeason(' 2027 / 2028 ');
    selectedTeam.next(IVV_TEAM);
    finish('vedette-2027');
    await saving;
    expect(addSeason).toHaveBeenCalledWith('2027 / 2028', LEGACY_TEAM);
    expect(seasons.selected.value).toBe('ivv-2026');
    selectedTeam.next(LEGACY_TEAM);
    expect(seasons.selected.value).toBe('vedette-2027');
    expect(seasons.assertWritableSelection()).toEqual({
      teamId: LEGACY_TEAM,
      seasonId: 'vedette-2027',
    });
  });

  it('selects a newly saved season immediately for the current team', async () => {
    subscriptions.add(seasons.getSeasons().subscribe());
    selectedTeam.next(IVV_TEAM);
    await seasons.addSeason('2027 / 2028');
    expect(seasons.selected.value).toBe('new-season');
    expect(seasons.assertWritableSelection()).toEqual({ teamId: IVV_TEAM, seasonId: 'new-season' });
    expect(addSeason).toHaveBeenCalledWith('2027 / 2028', IVV_TEAM);
  });
});
