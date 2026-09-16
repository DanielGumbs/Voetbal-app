import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-team-badge',
  host: {
    class:
      'flex size-11 flex-none items-center justify-center overflow-hidden rounded-[13px] border-2 border-accent/60 bg-[linear-gradient(145deg,#50232f,#291d28)] text-[#ffd9df]',
  },
  template: `
    @if (logoUrl() && failedUrl() !== logoUrl()) {
      <img
        class="size-full bg-white object-contain p-1"
        [src]="logoUrl()"
        alt=""
        (error)="failedUrl.set(logoUrl())"
      />
    } @else {
      <span class="p-1 text-[13px] font-extrabold tracking-[0.5px]" aria-hidden="true">{{
        initials()
      }}</span>
    }
  `,
})
export class TeamBadge {
  readonly name = input.required<string>();
  readonly logoUrl = input<string | null>(null);
  readonly failedUrl = signal<string | null | undefined>(undefined);
  readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    return (
      (words.length === 1
        ? words[0].slice(0, 3)
        : words
            .slice(0, 3)
            .map((word) => word[0])
            .join('')
      ).toUpperCase() || 'FC'
    );
  });
}
