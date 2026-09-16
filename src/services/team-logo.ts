const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_LENGTH = 180_000;
const LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Decode and resize locally so a team logo remains small enough for its team record. */
export async function prepareTeamLogo(file: File): Promise<string> {
  if (!LOGO_TYPES.has(file.type)) {
    throw new Error('Kies een JPG-, PNG- of WebP-afbeelding.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Deze afbeelding is te groot. Kies een bestand van maximaal 5 MB.');
  }
  if (file.size === 0) throw new Error('Dit bestand is leeg. Kies een andere afbeelding.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () =>
        reject(new Error('Deze afbeelding kan niet worden geopend. Kies een ander bestand.'));
      candidate.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Deze afbeelding heeft geen geldig formaat.');
    }
    const scale = Math.min(1, 384 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Je browser kan deze afbeelding niet verwerken.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.72, 0.5]) {
      const result = canvas.toDataURL('image/webp', quality);
      if (result.startsWith('data:image/webp;base64,') && result.length <= MAX_LOGO_LENGTH) {
        return result;
      }
    }
    // Browsers without WebP encoding can still save a compact JPG.
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const copyContext = copy.getContext('2d');
    if (!copyContext) throw new Error('Je browser kan deze afbeelding niet verwerken.');
    copyContext.fillStyle = '#ffffff';
    copyContext.fillRect(0, 0, copy.width, copy.height);
    copyContext.drawImage(canvas, 0, 0);
    for (const quality of [0.82, 0.65, 0.45]) {
      const result = copy.toDataURL('image/jpeg', quality);
      if (result.startsWith('data:image/jpeg;base64,') && result.length <= MAX_LOGO_LENGTH)
        return result;
    }
    throw new Error(
      'Dit logo kan niet klein genoeg worden opgeslagen. Kies een eenvoudigere afbeelding.',
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
