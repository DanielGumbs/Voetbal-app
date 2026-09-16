import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { TeamService } from '../../services/team.service';
import { DEFAULT_TEAMS, IVV_TEAM, LEGACY_TEAM } from '../../services/team.model';
import { TeamManager } from './team-manager';

describe('TeamManager', () => {
  let admin: { isAdmin: () => boolean };
  let teamService: {
    teams: ReturnType<typeof signal<typeof DEFAULT_TEAMS>>;
    currentTeam: ReturnType<typeof signal<(typeof DEFAULT_TEAMS)[number]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string>>;
    selectTeam: jasmine.Spy;
    createTeam: jasmine.Spy;
    updateTeam: jasmine.Spy;
  };

  beforeEach(() => {
    admin = { isAdmin: () => true };
    teamService = {
      teams: signal([...DEFAULT_TEAMS]),
      currentTeam: signal(DEFAULT_TEAMS[0]),
      loading: signal(false),
      error: signal(''),
      selectTeam: jasmine.createSpy('selectTeam'),
      createTeam: jasmine.createSpy('createTeam').and.resolveTo(),
      updateTeam: jasmine.createSpy('updateTeam').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      imports: [TeamManager],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: admin },
        { provide: TeamService, useValue: teamService },
      ],
    });
  });

  it('lets members view teams while keeping creation and editing controls admin-only', () => {
    admin.isAdmin = () => false;
    const fixture = TestBed.createComponent(TeamManager);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Vedette De Remise');
    expect(fixture.nativeElement.textContent).toContain('IVV');
    expect(fixture.nativeElement.querySelector('button[aria-label="Team toevoegen"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label$=" bewerken"]')).toBeNull();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.nativeElement
      .querySelectorAll('button[aria-label^="Bekijk wedstrijden van "]')[1]
      .click();
    expect(teamService.selectTeam).toHaveBeenCalledWith(IVV_TEAM);
    expect(navigate).toHaveBeenCalledWith(['/games']);
  });

  it('creates a team with its selected logo and shows successful completion', async () => {
    const fixture = TestBed.createComponent(TeamManager);
    const component = fixture.componentInstance;
    component.edit();
    component.name = 'IVV 2';
    component.logoUrl.set('data:image/webp;base64,YQ==');
    await component.save();
    expect(teamService.createTeam).toHaveBeenCalledWith('IVV 2', 'data:image/webp;base64,YQ==');
    expect(component.editorOpen()).toBeFalse();
    expect(component.success()).toContain('IVV 2');
    expect(component.saving()).toBeFalse();
  });

  it('preserves the editor and logo when saving fails, then allows retry', async () => {
    teamService.updateTeam.and.rejectWith(new Error('Er bestaat al een team met deze naam.'));
    const fixture = TestBed.createComponent(TeamManager);
    const component = fixture.componentInstance;
    component.edit(DEFAULT_TEAMS[0]);
    await component.save();
    expect(component.editorOpen()).toBeTrue();
    expect(component.logoUrl()).toBe('/logo/vedette-logo.jpg');
    expect(component.formError()).toContain('Er bestaat al een team');
    expect(component.saving()).toBeFalse();
    component.removeLogo();
    teamService.updateTeam.and.resolveTo();
    await component.save();
    expect(teamService.updateTeam).toHaveBeenCalledWith(LEGACY_TEAM, 'Vedette De Remise', null);
    expect(component.editorOpen()).toBeFalse();
  });

  it('disables saving while teams are loading or failed to load', () => {
    const fixture = TestBed.createComponent(TeamManager);
    fixture.componentInstance.edit();
    fixture.componentInstance.name = 'New team';
    teamService.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    teamService.loading.set(false);
    teamService.error.set('Teams konden niet worden geladen.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
  });
});
