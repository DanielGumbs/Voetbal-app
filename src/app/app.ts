import { Component, Signal, signal } from '@angular/core';
import { LoginComponent } from './login/login';
import { Navbar } from './navbar/navbar';
import { Auth, user, User } from '../services/firebase';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  host: { class: 'block h-full min-h-0' },
  imports: [LoginComponent, Navbar, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  public user!: Signal<User | null | undefined>;
  protected readonly title = signal('voetbal-app');

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
  }
}
