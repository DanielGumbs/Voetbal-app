import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { TranslationService, LANGUAGE_KEY } from '../../i18n/translation.service';
import { GameService } from '../../services/game.service';
import { PlayerService } from '../../services/player.service';
import { SeasonService } from '../../services/season.service';
import { CreateGame } from './create-game';

describe('CreateGame language switching', () => {
  afterEach(() => localStorage.removeItem(LANGUAGE_KEY));
  it('updates visible labels while retaining the exact draft and event codes', () => {
    localStorage.setItem(LANGUAGE_KEY, 'nl');
    TestBed.configureTestingModule({
      imports: [CreateGame],
      providers: [
        provideRouter([]),
        {
          provide: SeasonService,
          useValue: {
            selected: new BehaviorSubject('season-1'),
            getSeasons: () => of([{ id: 'season-1', name: 'Eigen seizoensnaam' }]),
          },
        },
        {
          provide: PlayerService,
          useValue: {
            getPlayers: () =>
              of([
                { id: 'daan', name: 'Daan', number: 9, competitionIds: ['season-1_competitie'] },
              ]),
          },
        },
        { provide: GameService, useValue: { addGame: jasmine.createSpy('addGame') } },
      ],
    });
    const fixture = TestBed.createComponent(CreateGame);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.patchValue({
      opponent: 'De Adelaars',
      date: '2026-09-15',
      scoreTeam: 2,
      scoreOpponent: 1,
      players: ['daan'],
    });
    component.addEvent();
    component.events.at(0).patchValue({ playerId: 'daan', type: 'goal' });
    const draft = component.form.getRawValue();
    const opponentInput = fixture.nativeElement.querySelector('input[formControlName="opponent"]');
    TestBed.inject(TranslationService).choose('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Opponent');
    expect(fixture.nativeElement.textContent).toContain('Daan');
    expect(component.form.getRawValue()).toEqual(draft);
    expect(fixture.nativeElement.querySelector('input[formControlName="opponent"]')).toBe(
      opponentInput,
    );
    TestBed.inject(TranslationService).choose('nl');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tegenstander');
    expect(component.form.getRawValue()).toEqual(draft);
    expect(TestBed.inject(GameService).addGame).not.toHaveBeenCalled();
  });
});
