import { SelectField } from '../select-field/select-field';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SeasonService } from '../../services/season.service';
@Component({
  selector: 'app-season-selector',
  host: { class: 'inline-block min-w-0 max-w-full' },
  standalone: true,
  imports: [SelectField, FormsModule],
  template: `<app-select-field
    label="Seizoen"
    [options]="options()"
    [ngModel]="selected()"
    (ngModelChange)="seasons.selected.next($event)"
  ></app-select-field>`,
})
export class SeasonSelector {
  seasons = inject(SeasonService);
  list = toSignal(this.seasons.getSeasons());
  options = computed(() => (this.list() ?? []).map((s) => ({ value: s.id, label: s.name })));
  selected = toSignal(this.seasons.selected, { requireSync: true });
}
