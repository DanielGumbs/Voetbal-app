import { Component, Signal, inject, signal } from '@angular/core';
import { AppUpdateService } from '../services/app-update.service';
import { LoginComponent } from './login/login';
import { Navbar } from './navbar/navbar';
import { Auth, user, User } from '../services/firebase';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  host: { class: 'block h-full min-h-0' },
  imports: [LoginComponent, Navbar, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  readonly updates = inject(AppUpdateService);
  readonly isTestEnvironment = !environment.production;
  public user!: Signal<User | null | undefined>;
  protected readonly title = signal('voetbal-app');

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
  }
}
