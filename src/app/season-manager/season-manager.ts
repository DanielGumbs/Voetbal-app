import { SeasonSelector } from '../season-selector/season-selector';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../services/admin.service';
import { SeasonService, LEGACY_SEASON } from '../../services/season.service';
import { PlayerService } from '../../services/player.service';
@Component({
  selector: 'app-season-manager',
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col [&>*]:shrink-0' },
  standalone: true,
  imports: [SeasonSelector, FormsModule],
  template: ` <h1 class="text-xl font-bold text-white mb-4">
      Seizoenen beheren<span class="text-accent">.</span>
    </h1>
    <div class="mb-3 flex shrink-0 items-center gap-3 [&_label]:text-xs [&_label]:text-muted">
      <label>Seizoen</label><app-season-selector></app-season-selector>
    </div>
    <section
      class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:#79323e_#201d23] space-y-3 rounded-2xl border border-line bg-surface p-4 [&_form]:flex [&_form]:flex-wrap [&_form]:gap-3 [&_form]:py-4 [&_ul]:mt-5 [&_ul]:border-t [&_ul]:border-line [&_li]:border-b [&_li]:border-line [&_li]:py-3 [&_li]:text-sm max-sm:[&_form>input]:w-full max-sm:[&_form>button]:w-full"
      tabindex="0"
      aria-label="Seizoensbeheer"
    >
      @if (admin.isAdmin()) {
        <div>
          <h2 class="font-semibold text-red-300">Nieuw seizoen toevoegen</h2>
          <form (ngSubmit)="addSeason()" class="flex flex-wrap gap-2 my-3">
            <input
              aria-label="Naam nieuw seizoen"
              name="season"
              [(ngModel)]="name"
              required
              maxlength="80"
              placeholder="Bijv. 2026/2027"
              class="border rounded p-2 min-w-0 max-w-full border-line bg-[#171419] text-base text-ink placeholder:text-[#97929d]"
            />
            <button
              [disabled]="busy || !name.trim()"
              class="bg-red-600 text-white rounded p-2 disabled:opacity-50"
            >
              Seizoen toevoegen
            </button>
          </form>
          <p class="text-sm text-muted">
            Een nieuw seizoen krijgt een competitie en beker. Bestaande statistieken blijven bij het
            vorige seizoen.
          </p>
          @if (selected() !== legacy) {
            <form (ngSubmit)="addPlayer()" class="flex flex-wrap items-center gap-2 my-3">
              <input
                aria-label="Spelersnaam"
                name="player"
                [(ngModel)]="playerName"
                required
                placeholder="Naam speler"
                class="border rounded p-2 min-w-0 max-w-full border-line bg-[#171419] text-base text-ink placeholder:text-[#97929d]"
              />
              <input
                aria-label="Rugnummer"
                name="number"
                [(ngModel)]="number"
                type="number"
                min="0"
                step="1"
                required
                placeholder="Rugnummer"
                class="border rounded p-2 w-28 min-w-0 max-w-full border-line bg-[#171419] text-base text-ink placeholder:text-[#97929d]"
              />
              <label><input type="checkbox" name="league" [(ngModel)]="league" /> Competitie</label>
              <label><input type="checkbox" name="cup" [(ngModel)]="cup" /> Beker</label>
              <button
                [disabled]="busy || !playerName.trim() || number === null || (!league && !cup)"
                class="bg-red-600 text-white rounded p-2 disabled:opacity-50 min-w-0 max-w-full border-line bg-[#171419] text-base text-ink placeholder:text-[#97929d]"
              >
                Speler toevoegen
              </button>
            </form>
            <ul>
              @for (p of players(); track p.id) {
                <li>{{ p.number }} — {{ p.name }}</li>
              } @empty {
                <li>Nog geen spelers toegevoegd.</li>
              }
            </ul>
          }
        </div>
      }
      @if (message) {
        <p role="status" class="text-sm">{{ message }}</p>
      }
    </section>`,
})
export class SeasonManager {
  seasons = inject(SeasonService);
  admin = inject(AdminService);
  playerService = inject(PlayerService);
  message = '';
  list = toSignal(this.seasons.getSeasons());
  selected = toSignal(this.seasons.selected, { requireSync: true });
  players = toSignal(this.playerService.getPlayers());
  legacy = LEGACY_SEASON;
  name = '';
  playerName = '';
  number: number | null = null;
  league = true;
  cup = true;
  busy = false;
  async addSeason() {
    if (this.busy) return;
    this.busy = true;
    this.message = '';
    try {
      await this.seasons.addSeason(this.name);
      this.name = '';
      this.message = 'Seizoen met competitie en beker opgeslagen.';
    } catch {
      this.message = 'Seizoen opslaan mislukt. Controleer je verbinding en beheerrechten.';
    } finally {
      this.busy = false;
    }
  }
  async addPlayer() {
    if (this.busy || this.number === null) return;
    this.busy = true;
    this.message = '';
    try {
      await this.playerService.addPlayer(this.playerName, this.number, [
        ...(this.league ? ['competitie'] : []),
        ...(this.cup ? ['beker'] : []),
      ]);
      this.playerName = '';
      this.number = null;
      this.message = 'Speler opgeslagen.';
    } catch {
      this.message = 'Speler opslaan mislukt. Controleer je invoer, verbinding en beheerrechten.';
    } finally {
      this.busy = false;
    }
  }
}
