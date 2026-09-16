import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { TeamBadge } from '../team-badge/team-badge';

@Component({
  selector: 'app-team-selector',
  imports: [RouterLink, TeamBadge],
  templateUrl: './team-selector.html',
  host: {
    class: 'relative block min-w-0 w-[min(310px,calc(100vw_-_96px))] text-[#f5f5f6]',
  },
})
export class TeamSelector {
  readonly teams = inject(TeamService);
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>);
  readonly open = signal(false);
  readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  @HostListener('document:click', ['$event'])
  dismissOutside(event: MouseEvent) {
    if (event.target instanceof Node && !this.element.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  dismissWithEscape() {
    if (!this.open()) return;
    this.closeAndRestoreFocus();
  }

  @HostListener('focusout', ['$event'])
  dismissOnFocusOut(event: FocusEvent) {
    if (
      event.relatedTarget instanceof Node &&
      !this.element.nativeElement.contains(event.relatedTarget)
    ) {
      this.open.set(false);
    }
  }

  select(id: string) {
    this.teams.selectTeam(id);
    this.closeAndRestoreFocus();
    void this.router.navigate(['/games']);
  }

  closeAndRestoreFocus() {
    this.open.set(false);
    this.trigger()?.nativeElement.focus({ preventScroll: true });
  }
}
