import { TranslationService } from '../../i18n/translation.service';
import {
  Component,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  host: { class: 'block min-w-0 w-full' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectField), multi: true },
  ],
  template: ` <div class="w-full min-w-0">
    <button
      #trigger
      type="button"
      class="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm text-ink disabled:opacity-50"
      [disabled]="disabled"
      [attr.aria-label]="label() || i18n.t('Selecteer')"
      aria-haspopup="listbox"
      [attr.aria-expanded]="opened()"
      [attr.aria-controls]="opened() ? listId : null"
      (click)="toggle()"
      (keydown)="onTriggerKey($event)"
      (blur)="onTouched()"
    >
      <span class="min-w-0 truncate">{{ selectedLabel() }}</span>
      <svg
        class="size-4 shrink-0 transition-transform"
        [class.rotate-180]="opened()"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path d="m5 7 5 5 5-5" />
      </svg>
    </button>
    @if (opened()) {
      <div
        #panel
        popover="manual"
        [id]="listId"
        role="listbox"
        [attr.aria-label]="label() || i18n.t('Selecteer')"
        tabindex="0"
        [attr.aria-activedescendant]="options().length ? listId + '-' + active() : null"
        class="fixed inset-auto m-0 box-border overflow-y-auto overscroll-contain rounded-xl border border-accent/40 bg-surface p-1 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        (keydown)="onListKey($event)"
        (focusout)="onPanelBlur($event)"
      >
        @for (option of options(); track option.value; let i = $index) {
          <div
            role="option"
            [id]="listId + '-' + i"
            [attr.aria-selected]="value() === option.value"
            [attr.data-active]="active() === i"
            class="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-accent/15 data-[active=true]:bg-accent/15"
            (click)="choose(option.value)"
          >
            <span>{{ option.label }}</span>
            @if (value() === option.value) {
              <span class="text-accent" aria-hidden="true">✓</span>
            }
          </div>
        } @empty {
          <p class="px-3 py-2 text-sm text-muted">{{ i18n.t('Geen opties beschikbaar.') }}</p>
        }
      </div>
    }
  </div>`,
})
export class SelectField implements ControlValueAccessor {
  readonly i18n = inject(TranslationService);
  private static nextId = 0;
  readonly listId = `select-options-${SelectField.nextId++}`;
  options = input<SelectOption[]>([]);
  label = input('');
  value = signal('');
  opened = signal(false);
  active = signal(0);
  disabled = false;
  panel = viewChild<ElementRef<HTMLElement>>('panel');
  trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  constructor() {
    const onScroll = (event: Event) => {
      if (this.opened() && !this.panel()?.nativeElement.contains(event.target as Node)) {
        this.opened.set(false);
      }
    };
    const onResize = () => this.opened.set(false);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    });
  }
  selectedLabel() {
    return (
      this.options().find((o) => o.value === this.value())?.label ??
      (this.label() || this.i18n.t('Selecteer'))
    );
  }
  writeValue(value: string | null) {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
    if (disabled) this.opened.set(false);
  }
  toggle() {
    if (this.disabled) return;
    this.opened.update((v) => !v);
    if (this.opened()) {
      this.active.set(
        Math.max(
          0,
          this.options().findIndex((o) => o.value === this.value()),
        ),
      );
      setTimeout(() => {
        if (this.opened()) {
          const panel = this.panel()?.nativeElement;
          const rect = this.trigger()?.nativeElement.getBoundingClientRect();
          if (!panel || !rect) return;
          Object.assign(panel.style, {
            top: `${rect.bottom + 4}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            maxHeight: `${Math.max(0, Math.min(192, window.innerHeight - rect.bottom - 12))}px`,
          });
          panel.showPopover();
          panel.focus({ preventScroll: true });
        }
      });
    }
  }
  choose(value: string) {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
    this.close();
  }
  close() {
    this.opened.set(false);
    this.trigger()?.nativeElement.focus({ preventScroll: true });
  }
  onPanelBlur(event: FocusEvent) {
    if (event.relatedTarget === this.trigger()?.nativeElement) return;
    if (!this.panel()?.nativeElement.contains(event.relatedTarget as Node | null))
      this.opened.set(false);
  }
  onTriggerKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.opened()) this.toggle();
    }
    if (event.key === 'Escape') this.close();
  }
  onListKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    const count = this.options().length;
    if (!count) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.choose(this.options()[this.active()].value);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.active.set(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? count - 1
            : (this.active() + (event.key === 'ArrowDown' ? 1 : -1) + count) % count,
      );
      setTimeout(() =>
        this.panel()
          ?.nativeElement.querySelector('[data-active="true"]')
          ?.scrollIntoView({ block: 'nearest' }),
      );
    }
  }
}
