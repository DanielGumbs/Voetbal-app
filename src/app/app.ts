
import {Component, Signal, signal} from '@angular/core';
import {LoginComponent} from './login/login';
import {Navbar} from './navbar/navbar';
import {Auth, user, User} from '@angular/fire/auth';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [LoginComponent, Navbar, RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  public user!: Signal<User | null | undefined>;
  protected readonly title = signal('voetbal-app');

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
  }
}



