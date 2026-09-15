import { TranslationService } from '../../i18n/translation.service';
import { FormsModule } from '@angular/forms';
import { SelectField } from '../select-field/select-field';
import { SeasonSelector } from '../season-selector/season-selector';
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';

import { Player, PlayerService } from '../../services/player.service';
import { Game, GameService, LeagueType } from '../../services/game.service';
import { toSignal } from '@angular/core/rxjs-interop';

interface PlayerStats {
  player: Player;
  games: number;
  goals: number;
  assists: number;
}

type TabKey = 'total' | 'goals' | 'assists';

type LeagueFilter = 'all' | LeagueType;

@Component({
  selector: 'app-leaderboard',
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col [&>*]:shrink-0' },
  standalone: true,
  imports: [SelectField, FormsModule, SeasonSelector, RouterLink],
  templateUrl: './leaderboard.html',
})
export class LeaderboardComponent {
  readonly i18n = inject(TranslationService);
  admin = inject(AdminService);
  players!: Signal<Player[] | undefined>;
  games!: Signal<Game[] | undefined>;

  tab: WritableSignal<TabKey> = signal<TabKey>('total');
  leagueFilter = signal<LeagueFilter>('all');

  filteredGames = computed(() => {
    const games = this.games();
    const league = this.leagueFilter();
    return league === 'all' ? games : games?.filter((g) => g.league === league);
  });

  stats = computed<PlayerStats[] | undefined>(() => {
    const players = this.players();
    const games = this.filteredGames();
    const league = this.leagueFilter();
    if (!players || !games) return undefined;

    const filteredGames = games;

    const res: PlayerStats[] = players
      .filter(
        (p) =>
          league === 'all' ||
          !p.competitionIds ||
          p.competitionIds.includes(p.seasonId + '_' + league),
      )
      .map((p) => {
        const pid = p.id!;
        let gamesPlayed = 0;
        let goals = 0;
        let assists = 0;

        for (const g of filteredGames) {
          if (g.players && g.players.includes(pid)) {
            gamesPlayed++;
          }
          if (g.events) {
            for (const ev of g.events) {
              if (ev.playerId === pid) {
                if (ev.type === 'goal') goals++;
                if (ev.type === 'assist') assists++;
              }
            }
          }
        }

        return { player: p, games: gamesPlayed, goals, assists };
      });

    return res;
  });

  sorted = computed<PlayerStats[] | undefined>(() => {
    const s = this.stats();
    if (!s) return undefined;
    const key = this.tab();
    if (key === 'total') {
      return [...s].sort((a, b) => b.goals + b.assists - (a.goals + a.assists));
    }
    return [...s].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
  });

  constructor(
    private playerService: PlayerService,
    private gameService: GameService,
  ) {
    this.players = toSignal(this.playerService.getPlayers());
    this.games = toSignal(this.gameService.getGames());
  }

  selectTab(key: TabKey) {
    this.tab.set(key);
  }

  setLeagueFilter(vOrEvent: LeagueFilter | Event) {
    let value: LeagueFilter;
    if (typeof vOrEvent === 'string') {
      value = vOrEvent as LeagueFilter;
    } else {
      const target = vOrEvent?.target as HTMLSelectElement | null;
      value = (target?.value as LeagueFilter) ?? 'all';
    }
    this.leagueFilter.set(value);
  }
}
