import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Auth, authState, User } from '../services/supabase';
import { UserProfileService } from '../services/user-profile.service';
import { isLanguage, Language, TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceService {
  private auth = inject(Auth);
  private profiles = inject(UserProfileService);
  private i18n = inject(TranslationService);
  private account: User | null = null;
  private profile?: Subscription;
  private generation = 0;
  private chosen = false;
  private queue: Promise<void> = Promise.resolve();
  readonly error = signal('');
  readonly signedIn = signal(false);

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => this.profile?.unsubscribe());
    this.i18n.choices.pipe(takeUntilDestroyed(destroy)).subscribe((language) => {
      this.chosen = true;
      if (this.account) this.save(this.account, language);
    });
    authState(this.auth)
      .pipe(takeUntilDestroyed(destroy))
      .subscribe((account) => {
        if (account?.uid === this.account?.uid) return;
        this.profile?.unsubscribe();
        const generation = ++this.generation;
        this.account = account;
        this.chosen = false;
        this.error.set('');
        this.signedIn.set(!!account);
        if (!account) return;
        let loaded = false;
        this.profile = this.profiles.watch(account).subscribe({
          next: (profile) => {
            if (!profile || loaded || generation !== this.generation) return;
            loaded = true;
            // A choice made while loading wins over the delayed profile response.
            if (this.chosen) return;
            if (isLanguage(profile.language)) this.i18n.apply(profile.language);
            else this.save(account, this.i18n.language());
          },
          error: () => {
            if (generation === this.generation && !this.chosen)
              this.error.set(
                'Je profielvoorkeur kon niet worden geladen. De taal op dit apparaat blijft actief.',
              );
          },
        });
      });
  }

  retry() {
    if (this.account) {
      this.chosen = true;
      this.save(this.account, this.i18n.language());
    }
  }

  private save(account: User, language: Language) {
    const generation = this.generation;
    this.error.set('');
    // Serialize rapid toggles so the last choice also wins in persistent storage.
    this.queue = this.queue.then(async () => {
      if (generation !== this.generation) return;
      try {
        await this.profiles.setLanguage(account, language);
        if (generation === this.generation) this.error.set('');
      } catch {
        if (generation === this.generation)
          this.error.set(
            'Je taalkeuze kon niet in je profiel worden opgeslagen. Je invoer blijft bewaard.',
          );
      }
    });
  }
}
