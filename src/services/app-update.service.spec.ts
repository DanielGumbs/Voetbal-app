import { appBundleSignature } from './app-update.service';

describe('App update detection', () => {
  const signature = (html: string) =>
    appBundleSignature(new DOMParser().parseFromString(html, 'text/html'));
  it('detects a changed application bundle', () => {
    expect(signature('<script type="module" src="main-old.js"></script>')).not.toBe(
      signature('<script type="module" src="main-new.js"></script>'),
    );
  });
  it('ignores markup and script ordering when the build is unchanged', () => {
    expect(
      signature(
        '<h1>Old page</h1><script type="module" src="main.js"></script><script type="module" src="polyfills.js"></script>',
      ),
    ).toBe(
      signature(
        '<h1>New text</h1><script type="module" src="polyfills.js"></script><script type="module" src="main.js"></script>',
      ),
    );
  });
  it('returns no version for error pages or inline scripts', () => {
    expect(signature('<h1>Offline</h1><script>console.log("error")</script>')).toBe('');
  });
});
