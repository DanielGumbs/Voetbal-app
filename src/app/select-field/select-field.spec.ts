import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectField } from './select-field';
@Component({
  imports: [SelectField, ReactiveFormsModule],
  template: `<app-select-field
    label="Competitie"
    [formControl]="control"
    [options]="options"
  ></app-select-field>`,
})
class Host {
  control = new FormControl('', Validators.required);
  options = [
    { value: 'competitie', label: 'Competitie' },
    { value: 'beker', label: 'Beker' },
  ];
}
describe('SelectField', () => {
  it('opens the options when the view renders after the click timer queue', fakeAsync(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    // Coalesced change detection can render after zero-delay timers have already run.
    tick();
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('[role=listbox]') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.matches(':popover-open')).toBeTrue();
    expect(document.activeElement).toBe(list);
  }));
  it('opens below the trigger and updates the reactive form using the keyboard', fakeAsync(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const field = fixture.nativeElement.querySelector('app-select-field') as HTMLElement;
    const heightBefore = field.getBoundingClientRect().height;
    button.click();
    fixture.detectChanges();
    tick();
    const list = fixture.nativeElement.querySelector('[role=listbox]') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.matches(':popover-open')).toBeTrue();
    expect(getComputedStyle(list).position).toBe('fixed');
    expect(field.getBoundingClientRect().height).toBe(heightBefore);
    expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      button.getBoundingClientRect().bottom,
    );
    expect(button.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    tick();
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('beker');
    expect(fixture.componentInstance.control.valid).toBeTrue();
    expect(fixture.componentInstance.control.touched).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role=listbox]')).toBeNull();
  }));
  it('respects programmatic values and disabled state', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue('beker');
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Beker');
    expect(button.disabled).toBeTrue();
  });
  it('closes on Escape without changing the selected value', fakeAsync(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    tick();
    fixture.nativeElement
      .querySelector('[role=listbox]')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('');
    expect(fixture.nativeElement.querySelector('[role=listbox]')).toBeNull();
  }));
});
