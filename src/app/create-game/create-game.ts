import {SeasonSelector} from '../season-selector/season-selector';
import {Component, computed, effect, inject, Signal} from '@angular/core';
import {competitionId, SeasonService} from '../../services/season.service';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Game, GameService} from '../../services/game.service';
import {Player, PlayerService} from '../../services/player.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [SeasonSelector, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-game.html'
})
export class CreateGame {
  seasons = inject(SeasonService);
  selectedSeason = toSignal(this.seasons.selected, {requireSync: true});
  saving = false;
  error = '';
  form!: FormGroup;
  players!: Signal<Player[] | undefined>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gameService: GameService,
    private playerService: PlayerService
  ) {
    this.form = this.fb.group({
      opponent: ['', Validators.required],
      date: ['', Validators.required],
      scoreTeam: [null as number | null],
      scoreOpponent: [null as number | null],
      league: ['competitie', Validators.required],
      players: this.fb.control([] as string[]),
      events: this.fb.array([] as { playerId: string; type: 'goal' | 'assist' }[])
    });

    // A scoreless or scheduled game does not require events.


    const allPlayers = toSignal(this.playerService.getPlayers());
    const league = toSignal(this.form.get('league')!.valueChanges, {initialValue: 'competitie'});
    this.players = computed(() => (allPlayers() ?? []).filter(p => p.competitionIds?.includes(competitionId(this.selectedSeason(), league()))));
    effect(() => {
      this.selectedSeason();
      league();
      this.form.get('players')?.setValue([]);
      this.events.clear();
    });
  }

  get events(): FormArray {
    return this.form.get('events') as FormArray;
  }

  addEvent() {
    this.events.push(
      this.fb.group({
        playerId: ['', Validators.required],
        type: ['goal' as 'goal' | 'assist', Validators.required]
      })
    );
  }

  removeEvent(index: number) {
    this.events.removeAt(index);
  }

  isPlayerSelected(id: string): boolean {
    const selected = (this.form.get('players')?.value as string[]) || [];
    return selected.includes(id);
  }

  onTogglePlayer(id: string, checked: boolean) {
    const current: string[] = (this.form.get('players')?.value as string[]) || [];
    const set = new Set(current);
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    this.form.get('players')?.setValue(Array.from(set));
    this.form.get('players')?.markAsDirty();
    this.form.get('players')?.updateValueAndValidity();
  }

  async submit() {
    if (this.saving) return;
    type EventForm = { playerId: string; type: 'goal' | 'assist' };
    type CreateGameForm = {
      opponent: string;
      date: string;
      scoreTeam: number | null;
      scoreOpponent: number | null;
      league: 'competitie' | 'beker';
      players: string[];
      events: EventForm[];
    };

    const raw = this.form.getRawValue() as CreateGameForm;

    const payload: Game = {
      opponent: raw.opponent,
      date: raw.date,
      scoreTeam: raw.scoreTeam ?? undefined,
      scoreOpponent: raw.scoreOpponent ?? undefined,
      events: raw.events?.filter(e => e.playerId) ?? [],
      players: raw.players ?? [],
      league: raw.league,
    };

    const allowed = new Set((this.players() ?? []).map(p => p.id));
    if (payload.players?.some(id => !allowed.has(id)) || payload.events.some(e => !allowed.has(e.playerId) || !payload.players?.includes(e.playerId))) {
      this.error = 'Selecteer bij ieder doelpunt of assist een speler die heeft meegedaan.';
      return;
    }
    this.saving = true; this.error = '';
    try { await this.gameService.addGame(payload); await this.router.navigate(['/games']); }
    catch (error: unknown) {
      const code = (error as {code?: string} | null)?.code;
      if (code === 'permission-denied') {
        this.error = 'Geen toestemming om deze wedstrijd op te slaan. Log in als daniel.r.gumbs@gmail.com. Als je al met dit account bent ingelogd, moeten de databasebeveiliging en het seizoen worden gecontroleerd.';
      } else if (code === 'unavailable') {
        this.error = 'De database is tijdelijk niet bereikbaar. Controleer je internetverbinding en probeer opnieuw.';
      } else {
        this.error = 'Opslaan mislukt. Probeer opnieuw. Je invoer blijft bewaard.';
      }
    }
    finally { this.saving = false; }
  }
}



