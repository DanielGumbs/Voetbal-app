import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService, Game } from '../../services/game.service';
import { Player, PlayerService } from '../../services/player.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-game.html'
})
export class CreateGame {
  players = toSignal(this.playerService.getPlayers());

  form!: FormGroup;

  get events(): FormArray {
    return this.form.get('events') as FormArray;
  }

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
      events: this.fb.array([] as { playerId: string; type: 'goal' | 'assist' }[])
    });

    // start with one empty event row by default
    this.addEvent();
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

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();

    const payload: Game = {
      opponent: raw.opponent!,
      date: raw.date!,
      scoreTeam: raw.scoreTeam ?? undefined,
      scoreOpponent: raw.scoreOpponent ?? undefined,
      events: (raw.events as any[])?.filter(e => e.playerId) ?? []
    };

    await this.gameService.addGame(payload);
    await this.router.navigate(['/games']);
  }
}
