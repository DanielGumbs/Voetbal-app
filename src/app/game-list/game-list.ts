import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game, GameService } from '../../services/game.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './game-list.html'
})
export class GameList {
  games = toSignal(this.gameService.getGames());

  constructor(private gameService: GameService) {}
}
