/**
 * Client-side image compression using the Canvas API.
 *
 * Reduces image dimensions and JPEG quality until the result is under
 * maxSizeBytes, then returns a new File object ready for upload.
 * Videos and non-image files are returned unchanged.
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeBytes: number = 9.5 * 1024 * 1024, // 9.5 MB — stays under Cloudinary's 10 MB cap
): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= maxSizeBytes) {
    return file;
  }

  // Animated GIFs cannot be reliably compressed via Canvas — return as-is
  // and let the backend reject if too large.
  if (file.type === 'image/gif') {
    return file;
  }

  // HEIC/HEIF (iPhone photos) cannot be decoded by Chrome or Firefox.
  // Try createImageBitmap and catch the failure with a clear message.
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.heic?$/i.test(file.name);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (isHeic) {
      throw new Error(
        'HEIC/HEIF photos are not supported by this browser. ' +
        'Please convert to JPEG or PNG before uploading. ' +
        'On iPhone: tap Share → Save as File and choose JPEG. ' +
        'On Mac: open in Preview → File → Export and choose JPEG.',
      );
    }
    // Unknown format the browser can't decode — return original and let
    // the backend produce a clear validation error.
    return file;
  }

  const { width: origW, height: origH } = bitmap;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Quality steps to try (high → low)
  const qualities = [0.85, 0.75, 0.65, 0.5, 0.4];

  // Scale factors to try if quality alone isn't enough
  const scales = [1.0, 0.85, 0.7, 0.55];

  for (const scale of scales) {
    canvas.width = Math.round(origW * scale);
    canvas.height = Math.round(origH * scale);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (blob && blob.size <= maxSizeBytes) {
        bitmap.close();
        const ext = file.name.replace(/\.[^.]+$/, '');
        return new File([blob], `${ext}.jpg`, { type: 'image/jpeg' });
      }
    }
  }

  // Could not compress enough — return original and let the backend
  // respond with a clear 400 error.
  bitmap.close();
  return file;
}
