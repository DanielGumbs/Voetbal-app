import { TranslationService } from '../../i18n/translation.service';
import { FormsModule } from '@angular/forms';
import { SelectField } from '../select-field/select-field';
import { SeasonSelector } from '../season-selector/season-selector';
import { Component, computed, inject, signal, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Game, GameService, LeagueType } from '../../services/game.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-game-list',
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col [&>*]:shrink-0' },
  standalone: true,
  imports: [SelectField, FormsModule, SeasonSelector, RouterLink],
  templateUrl: './game-list.html',
})
export class GameList {
  readonly i18n = inject(TranslationService);
  games!: Signal<Game[] | undefined>;
  readonly admin = inject(AdminService);
  readonly leagues = signal<(LeagueType | 'all')[]>(['all', 'competitie', 'beker']);
  readonly selectedLeague = signal<LeagueType | 'all'>('all');
  readonly filteredSortedGames = computed(() => {
    const list = this.games() ?? [];
    const noFriendly = list.filter((g) => g.league !== 'friendly');
    const league = this.selectedLeague();
    const filtered = league === 'all' ? noFriendly : noFriendly.filter((g) => g.league === league);
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  constructor(private gameService: GameService) {
    this.games = toSignal(this.gameService.getGames());
  }

  onLeagueChange(value: string) {
    if (value === 'all' || value === 'competitie' || value === 'beker') {
      this.selectedLeague.set(value as LeagueType);
    }
  }
}
