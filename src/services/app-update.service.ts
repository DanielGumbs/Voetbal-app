import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export function appBundleSignature(document: Document): string {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))
    .map((script) => script.getAttribute('src')!)
    .sort()
    .join('|');
}

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly available = signal(false);
  private readonly current = appBundleSignature(document);
  private checking = false;
  private readonly controller = new AbortController();

  constructor() {
    const check = () => {
      if (document.visibilityState === 'visible') void this.check();
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    const timer = window.setInterval(check, 60_000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
      this.controller.abort();
    });
    // Only update our legacy worker; never clear authentication or other registrations.
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          for (const registration of registrations) {
            const worker = registration.active || registration.waiting || registration.installing;
            if (worker && new URL(worker.scriptURL).pathname === '/service-worker.js') {
              await registration.update();
            }
          }
        })
        .catch(() => {});
    }
    check();
  }

  async check() {
    if (!this.current || this.checking || this.available()) return;
    this.checking = true;
    try {
      const response = await fetch('/index.html', {
        cache: 'no-store',
        signal: this.controller.signal,
      });
      if (!response.ok) return;
      const latest = appBundleSignature(
        new DOMParser().parseFromString(await response.text(), 'text/html'),
      );
      if (latest && latest !== this.current) this.available.set(true);
    } catch {
      // Being offline is not an update; try again when the app resumes.
    } finally {
      this.checking = false;
    }
  }

  reload() {
    window.location.reload();
  }
}
