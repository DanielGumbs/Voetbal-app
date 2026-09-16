import { SeasonSelector } from '../season-selector/season-selector';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../services/admin.service';
import { SeasonService, LEGACY_SEASON } from '../../services/season.service';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';
@Component({
  selector: 'app-season-manager',
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col [&>*]:shrink-0' },
  standalone: true,
  imports: [SeasonSelector, FormsModule],
  template: ` <h1
      class="mb-3 flex h-11 shrink-0 items-center text-[23px] font-extrabold leading-tight tracking-tight text-white sm:text-[26px] max-[359px]:mb-[68px]"
    >
      <span>Seizoenen beheren<span class="text-accent">.</span></span>
    </h1>
    <p class="mb-3 text-sm text-muted">
      Seizoenen en spelers van <strong class="text-ink">{{ team().name }}</strong>
    </p>
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
              class="min-h-11 min-w-0 max-w-full flex-1 rounded-xl border border-line bg-[#171419] px-3 py-2.5 text-base text-ink placeholder:text-muted/60"
            />
            <button
              [disabled]="busy || !name.trim()"
              class="inline-flex min-h-11 items-center justify-center rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-action-hover active:bg-action-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-action disabled:active:bg-action"
            >
              Seizoen toevoegen
            </button>
          </form>
          <p class="text-sm text-muted">
            Voeg een seizoen toe voor {{ team().name }}. Competitie en beker staan daarna voor je
            klaar.
          </p>
          @if (selected() !== legacy) {
            <h2 class="mt-6 border-t border-line pt-5 font-semibold text-red-300">
              Spelers beheren
            </h2>
            <form (ngSubmit)="addPlayer()" class="flex flex-wrap items-center gap-2 my-3">
              <input
                aria-label="Spelersnaam"
                name="player"
                [(ngModel)]="playerName"
                required
                placeholder="Naam speler"
                class="min-h-11 min-w-0 max-w-full flex-1 rounded-xl border border-line bg-[#171419] px-3 py-2.5 text-base text-ink placeholder:text-muted/60"
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
                class="min-h-11 w-28 min-w-0 max-w-full rounded-xl border border-line bg-[#171419] px-3 py-2.5 text-base text-ink placeholder:text-muted/60"
              />
              <label
                class="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm"
                ><input class="size-4" type="checkbox" name="league" [(ngModel)]="league" />
                Competitie</label
              >
              <label
                class="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm"
                ><input class="size-4" type="checkbox" name="cup" [(ngModel)]="cup" /> Beker</label
              >
              <button
                [disabled]="busy || !playerName.trim() || number === null || (!league && !cup)"
                class="inline-flex min-h-11 items-center justify-center rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-action-hover active:bg-action-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-action disabled:active:bg-action"
              >
                Speler toevoegen
              </button>
            </form>
            <ul>
              @for (p of players(); track p.id) {
                <li class="flex items-center gap-3">
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 font-bold tabular-nums text-red-200"
                    >{{ p.number }}</span
                  ><span class="min-w-0 break-words font-medium">{{ p.name }}</span>
                </li>
              } @empty {
                <li>Nog geen spelers toegevoegd.</li>
              }
            </ul>
          }
        </div>
      }
      @if (message) {
        <p
          role="status"
          class="rounded-xl border border-accent/30 bg-accent/10 px-3 py-3 text-sm leading-relaxed"
        >
          {{ message }}
        </p>
      }
    </section>`,
})
export class SeasonManager {
  readonly team = inject(TeamService).currentTeam;
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
