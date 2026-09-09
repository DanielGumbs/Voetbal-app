import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {SeasonService} from '../../services/season.service';
@Component({
  selector: 'app-season-selector', standalone: true, imports: [FormsModule],
  template: `
    <select aria-label="Seizoen" class="bg-white text-gray-800 font-bold text-sm rounded px-2 py-1" [ngModel]="selected()" (ngModelChange)="seasons.selected.next($event)">
      @for (season of list(); track season.id) { <option [value]="season.id">{{season.name}}</option> }
    </select>`
})
export class SeasonSelector {
  seasons = inject(SeasonService);
  list = toSignal(this.seasons.getSeasons());
  selected = toSignal(this.seasons.selected, {requireSync: true});
}

