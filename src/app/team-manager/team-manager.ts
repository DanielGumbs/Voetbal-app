import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { TeamService } from '../../services/team.service';
import { Team } from '../../services/team.model';
import { prepareTeamLogo } from '../../services/team-logo';
import { TeamBadge } from '../team-badge/team-badge';

@Component({
  selector: 'app-team-manager',
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-ink' },
  imports: [FormsModule, TeamBadge],
  templateUrl: './team-manager.html',
})
export class TeamManager {
  readonly teams = inject(TeamService);
  readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly saving = signal(false);
  readonly readingLogo = signal(false);
  readonly formError = signal('');
  readonly success = signal('');
  readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  readonly editorPanel = viewChild<ElementRef<HTMLElement>>('editorPanel');
  name = '';
  private uploadVersion = 0;
  private editorTrigger: HTMLButtonElement | null = null;

  edit(team?: Team) {
    if (this.saving()) return;
    const focused = this.element.nativeElement.ownerDocument.activeElement;
    this.editorTrigger =
      focused instanceof HTMLButtonElement && this.element.nativeElement.contains(focused)
        ? focused
        : null;
    this.uploadVersion++;
    this.readingLogo.set(false);
    this.editingId.set(team?.id ?? null);
    this.name = team?.name ?? '';
    this.logoUrl.set(team?.logoUrl ?? null);
    this.formError.set('');
    this.success.set('');
    this.editorOpen.set(true);
    setTimeout(() => {
      this.editorPanel()?.nativeElement.scrollIntoView({ block: 'nearest' });
      this.nameInput()?.nativeElement.focus({ preventScroll: true });
    });
  }

  closeEditor() {
    if (this.saving()) return;
    this.uploadVersion++;
    this.readingLogo.set(false);
    this.editorOpen.set(false);
    this.formError.set('');
    this.restoreEditorFocus();
  }

  async chooseLogo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const version = ++this.uploadVersion;
    this.readingLogo.set(true);
    this.formError.set('');
    try {
      const result = await prepareTeamLogo(file);
      if (version === this.uploadVersion) this.logoUrl.set(result);
    } catch (error) {
      if (version === this.uploadVersion) this.formError.set(this.message(error));
    } finally {
      if (version === this.uploadVersion) this.readingLogo.set(false);
    }
  }

  removeLogo() {
    this.uploadVersion++;
    this.readingLogo.set(false);
    this.logoUrl.set(null);
    this.formError.set('');
  }

  async save() {
    if (this.saving() || this.readingLogo()) return;
    this.formError.set('');
    if (!this.name.trim()) {
      this.formError.set('Vul een teamnaam in.');
      this.nameInput()?.nativeElement.focus();
      return;
    }
    this.saving.set(true);
    const id = this.editingId();
    try {
      if (id) await this.teams.updateTeam(id, this.name, this.logoUrl());
      else await this.teams.createTeam(this.name, this.logoUrl());
      this.editorOpen.set(false);
      this.restoreEditorFocus();
      this.success.set(
        id
          ? 'De teamgegevens zijn bijgewerkt.'
          : `${this.name.trim()} is toegevoegd en geselecteerd.`,
      );
    } catch (error) {
      this.formError.set(this.message(error));
    } finally {
      this.saving.set(false);
    }
  }

  select(id: string) {
    if (this.saving()) return;
    this.teams.selectTeam(id);
    void this.router.navigate(['/games']);
  }

  private message(error: unknown) {
    return error instanceof Error ? error.message : 'Opslaan is niet gelukt. Probeer het opnieuw.';
  }

  private restoreEditorFocus() {
    const trigger = this.editorTrigger;
    setTimeout(() => {
      if (!this.editorOpen() && trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  }
}
