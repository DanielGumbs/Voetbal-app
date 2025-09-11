import { Component, signal } from '@angular/core';
import { GameList } from './game-list/game-list';
import { LoginComponent } from './login/login';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [GameList, LoginComponent, AsyncPipe],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('voetbal-app');
  public user$: Observable<any>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }
}
