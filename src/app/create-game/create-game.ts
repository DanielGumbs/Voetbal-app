import {Component, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Game, GameService} from '../../services/game.service';
import {Player, PlayerService} from '../../services/player.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-game.html'
})
export class CreateGame {
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

    // start with one empty event row by default
    this.addEvent();

    this.players = toSignal(this.playerService.getPlayers());
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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

    await this.gameService.addGame(payload);
    await this.router.navigate(['/games']);
  }
}
