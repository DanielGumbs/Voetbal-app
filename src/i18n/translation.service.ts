import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { nl } from './nl';
import { en } from './en';

export type Language = 'nl' | 'en';
export const LANGUAGE_KEY = 'voetbal.language';
export const isLanguage = (value: unknown): value is Language => value === 'nl' || value === 'en';
export function browserLanguage(languages: readonly string[]): Language {
  const primary = languages[0]?.toLowerCase().split('-')[0];
  return isLanguage(primary) ? primary : 'nl';
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private document = inject(DOCUMENT);
  readonly language = signal<Language>('nl');
  readonly locale = computed(() => (this.language() === 'en' ? 'en-GB' : 'nl-NL'));
  readonly storageFailed = signal(false);
  readonly choices = new Subject<Language>();

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANGUAGE_KEY);
    } catch {
      this.storageFailed.set(true);
    }
    this.apply(isLanguage(stored) ? stored : browserLanguage(navigator.languages));
  }

  choose(value: string) {
    if (!isLanguage(value)) return;
    this.apply(value);
    this.choices.next(value);
  }

  /** Applying a profile preference does not create another save request. */
  apply(value: Language) {
    this.language.set(value);
    this.document.documentElement.lang = value;
    try {
      localStorage.setItem(LANGUAGE_KEY, value);
      this.storageFailed.set(false);
    } catch {
      this.storageFailed.set(true);
    }
  }

  t(source: string, fallback?: string): string {
    const key = source as keyof typeof nl;
    const known = Object.prototype.hasOwnProperty.call(nl, key);
    return (
      (known && (this.language() === 'en' ? en[key] : nl[key])) ||
      (known && nl[key]) ||
      fallback ||
      (this.language() === 'en' ? 'Text unavailable.' : 'Tekst niet beschikbaar.')
    );
  }

  number(value: number | null | undefined): string {
    return value == null ? '–' : new Intl.NumberFormat(this.locale()).format(value);
  }

  date(value: string): string {
    // Calendar dates are not instants: pin to UTC to avoid shifting the match day.
    const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = new Date(calendarDate ? value + 'T12:00:00Z' : value);
    if (Number.isNaN(date.valueOf())) return '–';
    return new Intl.DateTimeFormat(this.locale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(calendarDate ? { timeZone: 'UTC' } : {}),
    }).format(date);
  }
}
