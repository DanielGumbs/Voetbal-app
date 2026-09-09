import {Component, computed, Signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {Game, GameService} from '../../services/game.service';
import {map} from 'rxjs/operators';
import {toSignal} from '@angular/core/rxjs-interop';
import {Player, PlayerService} from '../../services/player.service';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './game-detail.html'
})
export class GameDetailComponent {
  game!: Signal<Game | undefined | null>;
  players!: Signal<Player[] | undefined>;
  goals = computed(() => (this.game()?.events ?? []).filter(e => e.type === 'goal'));
  assists = computed(() => (this.game()?.events ?? []).filter(e => e.type === 'assist'));
  goalCounts = computed(() => {
    const map = new Map<string, number>();
    for (const e of (this.game()?.events ?? [])) {
      if (e.type === 'goal') map.set(e.playerId, (map.get(e.playerId) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([playerId, count]) => ({playerId, count}));
  });
  assistCounts = computed(() => {
    const map = new Map<string, number>();
    for (const e of (this.game()?.events ?? [])) {
      if (e.type === 'assist') map.set(e.playerId, (map.get(e.playerId) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([playerId, count]) => ({playerId, count}));
  });

  constructor(route: ActivatedRoute, gameService: GameService, playerService: PlayerService) {
    const id = route.snapshot.paramMap.get('id');
    this.game = toSignal(gameService.getGames(true).pipe(
      map(list => list.find(g => g.id === id) ?? null)
    ));
    this.players = toSignal(playerService.getPlayers(true));
  }

  nameFor(playerId: string): string {
    const list = this.players();
    const p = list?.find(x => x.id === playerId);
    return p ? `${p.name} (#${p.number})` : playerId;
  }
}

