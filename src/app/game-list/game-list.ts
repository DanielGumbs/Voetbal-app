import { Component } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game, GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import {PlayerService} from '../../services/player.service';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [NgIf, NgForOf, RouterLink, AsyncPipe, DatePipe],
  templateUrl: './game-list.html'
})
export class GameList {
  games$: Observable<Game[]>;

  constructor(private gameService: GameService) {
    this.games$ = this.gameService.getGames();
  }
}
