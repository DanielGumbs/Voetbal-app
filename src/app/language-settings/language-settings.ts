import { Component, inject } from '@angular/core';
import { LanguagePreferenceService } from '../../i18n/language-preference.service';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-language-settings',
  template: `<details class="relative text-sm">
    <summary
      class="flex min-h-11 cursor-pointer items-center rounded-lg border border-line px-3 text-ink"
    >
      {{ i18n.t('Instellingen') }}
    </summary>
    <section
      class="absolute right-0 top-full z-[70] mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-line bg-surface p-4 text-ink shadow-lg"
      [attr.aria-label]="i18n.t('Instellingen')"
    >
      <label for="language" class="mb-2 block font-semibold">{{ i18n.t('Taal') }}</label>
      <select
        id="language"
        class="min-h-11 w-full rounded-lg border border-line bg-[#171419] px-3 text-base"
        [value]="i18n.language()"
        (change)="i18n.choose($any($event.target).value)"
      >
        <option value="nl" lang="nl">Nederlands</option>
        <option value="en" lang="en">English</option>
      </select>
      <p class="mt-3 text-xs text-muted">
        {{
          i18n.t(
            preferences.signedIn()
              ? 'Je taalkeuze wordt ook in je profiel bewaard.'
              : 'Taal op dit apparaat opgeslagen.'
          )
        }}
      </p>
      @if (i18n.storageFailed()) {
        <p role="alert" class="mt-2 text-xs text-red-300">
          {{ i18n.t('De taal kan niet op dit apparaat worden onthouden.') }}
        </p>
      }
      @if (preferences.error()) {
        <p role="alert" class="mt-2 text-xs text-red-300">{{ i18n.t(preferences.error()) }}</p>
        <button
          type="button"
          class="mt-2 min-h-11 rounded-lg border border-line px-3"
          (click)="preferences.retry()"
        >
          {{ i18n.t('Opnieuw proberen') }}
        </button>
      }
    </section>
  </details>`,
})
export class LanguageSettings {
  readonly i18n = inject(TranslationService);
  readonly preferences = inject(LanguagePreferenceService);
}
