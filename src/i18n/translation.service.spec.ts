import { TestBed } from '@angular/core/testing';
import { browserLanguage, LANGUAGE_KEY, TranslationService } from './translation.service';
import { en } from './en';
import { nl } from './nl';

describe('TranslationService', () => {
  beforeEach(() => localStorage.removeItem(LANGUAGE_KEY));
  afterEach(() => localStorage.removeItem(LANGUAGE_KEY));

  it('detects regional browser languages and defaults unsupported languages to Dutch', () => {
    expect(browserLanguage(['en-US'])).toBe('en');
    expect(browserLanguage(['nl-BE'])).toBe('nl');
    expect(browserLanguage(['fr-FR', 'en-GB'])).toBe('nl');
    expect(browserLanguage([])).toBe('nl');
  });

  it('persists choices across service recreation and updates the document language', () => {
    const service = TestBed.inject(TranslationService);
    service.choose('en');
    expect(document.documentElement.lang).toBe('en');
    expect(service.t('Wedstrijden')).toBe('Matches');
    TestBed.resetTestingModule();
    expect(TestBed.inject(TranslationService).language()).toBe('en');
    TestBed.inject(TranslationService).choose('fr');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
  });

  it('formats the same date and number in each locale without changing their values', () => {
    const service = TestBed.inject(TranslationService);
    service.choose('nl');
    expect(service.number(1234.5)).toBe('1.234,5');
    expect(service.date('2026-09-15')).toBe('15-09-2026');
    service.choose('en');
    expect(service.number(1234.5)).toBe('1,234.5');
    expect(service.date('2026-09-15')).toBe('15/09/2026');
    expect(service.date('invalid')).toBe('–');
    expect(service.number(undefined)).toBe('–');
  });

  it('covers every source message and never displays an unknown internal key', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(nl).sort());
    for (const value of Object.values(en)) expect(value.trim().length).toBeGreaterThan(0);
    const service = TestBed.inject(TranslationService);
    service.choose('en');
    expect(service.t('missing.internal.key')).toBe('Text unavailable.');
    expect(service.t('toString')).toBe('Text unavailable.');
    expect(service.t('missing.internal.key', 'Try again')).toBe('Try again');
  });

  it('keeps switching language when device storage is unavailable', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('unavailable');
    spyOn(Storage.prototype, 'setItem').and.throwError('unavailable');
    const service = TestBed.inject(TranslationService);
    service.choose('en');
    expect(service.language()).toBe('en');
    expect(service.storageFailed()).toBeTrue();
  });
});
