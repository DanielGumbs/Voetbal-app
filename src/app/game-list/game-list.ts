import {Component, computed, signal, Signal} from '@angular/core';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {Game, GameService, LeagueType} from '../../services/game.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {Auth, user, User} from '@angular/fire/auth';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe],
  templateUrl: './game-list.html'
})
export class GameList {
  games!: Signal<Game[] | undefined>;
  user!: Signal<User | null | undefined>;
  readonly leagues = signal<(LeagueType | 'all')[]>(['all', 'competitie', 'beker']);
  readonly selectedLeague = signal<LeagueType | 'all'>('all');
  readonly filteredSortedGames = computed(() => {
    const list = this.games() ?? [];
    const noFriendly = list.filter(g => g.league !== 'friendly');
    const league = this.selectedLeague();
    const filtered = league === 'all' ? noFriendly : noFriendly.filter(g => g.league === league);
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  constructor(private gameService: GameService, private auth: Auth) {
    this.games = toSignal(this.gameService.getGames());
    this.user = toSignal(user(this.auth));
  }

  onLeagueChange(value: string) {
    if (value === 'all' || value === 'competitie' || value === 'beker') {
      this.selectedLeague.set(value as LeagueType);
    }
  }
}
