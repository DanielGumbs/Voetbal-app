import { LanguageSettings } from '../language-settings/language-settings';
import { TranslationService } from '../../i18n/translation.service';
import { AdminService } from '../../services/admin.service';
import { ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { Component, Signal, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth, signOut, user, User } from '../../services/supabase';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  host: { class: 'contents' },
  imports: [RouterLink, RouterLinkActive, LanguageSettings],
  templateUrl: './navbar.html',
})
export class Navbar {
  readonly i18n = inject(TranslationService);
  admin = inject(AdminService);
  public mobileOpen = signal(false);
  readonly logoutError = signal(false);
  public user!: Signal<User | null | undefined>;
  accountButton = viewChild<ElementRef<HTMLButtonElement>>('accountButton');
  accountPanel = viewChild<ElementRef<HTMLElement>>('accountPanel');

  @HostListener('document:click', ['$event'])
  dismissOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (
      !this.accountButton()?.nativeElement.contains(target) &&
      !this.accountPanel()?.nativeElement.contains(target)
    )
      this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  dismissWithEscape() {
    if (!this.mobileOpen()) return;
    this.closeMenu();
    this.accountButton()?.nativeElement.focus();
  }

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
  }

  toggleMenu() {
    this.mobileOpen.update((v) => !v);
  }

  closeMenu() {
    this.mobileOpen.set(false);
  }

  async logout() {
    this.logoutError.set(false);
    try {
      await signOut(this.auth);
    } catch (err) {
      this.logoutError.set(true);
      console.error('Logout error:', err);
    }
  }
}
