import {Component, Signal} from '@angular/core';
import {AsyncPipe, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {Game, GameService} from '../../services/game.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {Auth, user} from '@angular/fire/auth';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [RouterLink, DatePipe, AsyncPipe],
  templateUrl: './game-list.html'
})
export class GameList {
  games!: Signal<Game[] | undefined>;
  user$!: Observable<any>;

  constructor(private gameService: GameService, private auth: Auth) {
    this.games = toSignal(this.gameService.getGames());
    this.user$ = user(this.auth);
  }
}
