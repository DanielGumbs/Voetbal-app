import { Component, signal } from '@angular/core';
import { LoginComponent } from './login/login';
import { Navbar } from './navbar/navbar';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [LoginComponent, Navbar, AsyncPipe, RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('voetbal-app');
  public user$: Observable<any>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }
}
