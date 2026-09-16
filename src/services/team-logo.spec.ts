import { prepareTeamLogo } from './team-logo';

describe('team logo preparation', () => {
  it('rejects unsupported formats and oversized files before decoding', async () => {
    await expectAsync(
      prepareTeamLogo(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })),
    ).toBeRejectedWithError('Kies een JPG-, PNG- of WebP-afbeelding.');
    await expectAsync(
      prepareTeamLogo(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      ),
    ).toBeRejectedWithError('Deze afbeelding is te groot. Kies een bestand van maximaal 5 MB.');
  });

  it('reports invalid image contents and releases the object URL', async () => {
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    await expectAsync(
      prepareTeamLogo(new File(['not an image'], 'broken.png', { type: 'image/png' })),
    ).toBeRejectedWithError('Deze afbeelding kan niet worden geopend. Kies een ander bestand.');
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('scales a selected logo to 384px and retains its proportions within the storage limit', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ed3c51';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((value) => resolve(value!), 'image/png'),
    );
    const encoded = await prepareTeamLogo(new File([blob], 'team.png', { type: 'image/png' }));
    expect(encoded.length).toBeLessThanOrEqual(180_000);
    expect(encoded).toMatch(/^data:image\/(webp|jpeg);base64,/);
    const image = new Image();
    const decoded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Compressed logo cannot be decoded'));
    });
    image.src = encoded;
    await decoded;
    expect(image.naturalWidth).toBe(384);
    expect(image.naturalHeight).toBe(192);
  });
});
