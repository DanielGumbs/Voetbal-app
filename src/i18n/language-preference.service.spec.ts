import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Auth, User } from '../services/supabase';
import { UserProfile, UserProfileService } from '../services/user-profile.service';
import { LanguagePreferenceService } from './language-preference.service';
import { LANGUAGE_KEY, TranslationService } from './translation.service';

describe('LanguagePreferenceService', () => {
  let notify: (account: User | null) => void;
  let profile: Subject<UserProfile | null>;
  let save: jasmine.Spy;
  let i18n: TranslationService;
  let preferences: LanguagePreferenceService;
  const account = { uid: 'user-a', email: 'a@example.com' } as User;

  beforeEach(() => {
    localStorage.setItem(LANGUAGE_KEY, 'nl');
    profile = new Subject();
    save = jasmine.createSpy('setLanguage').and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth,
          useValue: {
            onAuthStateChanged: (next: typeof notify) => {
              notify = next;
              next(null);
              return () => {};
            },
          },
        },
        { provide: UserProfileService, useValue: { watch: () => profile, setLanguage: save } },
      ],
    });
    i18n = TestBed.inject(TranslationService);
    preferences = TestBed.inject(LanguagePreferenceService);
  });
  afterEach(() => localStorage.removeItem(LANGUAGE_KEY));

  it('restores the profile on login and after signing out and back in', fakeAsync(() => {
    notify(account);
    profile.next({ email: account.email!, isAdmin: false, language: 'en' });
    expect(i18n.language()).toBe('en');
    expect(save).not.toHaveBeenCalled();
    notify(null);
    i18n.choose('nl');
    notify(account);
    profile.next({ email: account.email!, isAdmin: false, language: 'en' });
    flushMicrotasks();
    expect(i18n.language()).toBe('en');
    expect(preferences.signedIn()).toBeTrue();
    expect(save).not.toHaveBeenCalled();
  }));

  it('initializes an old profile without changing its email or role', fakeAsync(() => {
    notify(account);
    profile.next({ email: account.email!, isAdmin: false });
    flushMicrotasks();
    expect(save).toHaveBeenCalledOnceWith(account, 'nl');
  }));

  it('keeps an explicit choice when a delayed profile arrives', fakeAsync(() => {
    notify(account);
    i18n.choose('en');
    profile.next({ email: account.email!, isAdmin: false, language: 'nl' });
    flushMicrotasks();
    expect(i18n.language()).toBe('en');
    expect(save).toHaveBeenCalledOnceWith(account, 'en');
  }));

  it('serializes rapid choices and keeps the last one in the profile', fakeAsync(() => {
    let finish!: () => void;
    save.and.returnValue(new Promise<void>((resolve) => (finish = resolve)));
    notify(account);
    i18n.choose('en');
    i18n.choose('nl');
    flushMicrotasks();
    expect(save.calls.count()).toBe(1);
    finish();
    flushMicrotasks();
    expect(save.calls.allArgs()).toEqual([
      [account, 'en'],
      [account, 'nl'],
    ]);
  }));

  it('discards pending writes when the account changes', fakeAsync(() => {
    notify(account);
    i18n.choose('en');
    notify(null);
    flushMicrotasks();
    expect(save).not.toHaveBeenCalled();
  }));

  it('preserves device preference on failure and supports retry', fakeAsync(() => {
    save.and.rejectWith(new Error('offline'));
    notify(account);
    i18n.choose('en');
    flushMicrotasks();
    expect(preferences.error()).not.toBe('');
    expect(i18n.language()).toBe('en');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    save.and.resolveTo();
    preferences.retry();
    flushMicrotasks();
    expect(preferences.error()).toBe('');
  }));
});
