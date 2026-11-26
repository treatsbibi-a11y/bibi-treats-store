'use client';

/**
 * Convert and compress any uploaded image File to WebP before sending to storage/DB.
 * Falls back to the original file if the browser does not support WebP encoding.
 */
export async function convertImageToWebP(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = objectUrl;
      });

      const { naturalWidth: origW, naturalHeight: origH } = img;
      if (!origW || !origH) return file;

      let targetW = origW;
      let targetH = origH;
      if (origW > maxDimension || origH > maxDimension) {
        const ratio = Math.min(maxDimension / origW, maxDimension / origH);
        targetW = Math.round(origW * ratio);
        targetH = Math.round(origH * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality)
      );

      if (!blob || blob.type !== 'image/webp') {
        return file;
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
      return new File([blob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return file;
  }
}

/**
 * Download any image URL (WebP/PNG/JPG) as a standard JPEG (.jpg) file
 * so it can be shared or posted anywhere directly.
 */
export async function downloadImageAsJpeg(
  imageUrl: string,
  filename = 'image.jpg',
  quality = 0.92
): Promise<void> {
  const safeName = filename.replace(/\.[^.]+$/, '') + '.jpg';
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error('ไม่สามารถโหลดรูปภาพสำหรับดาวน์โหลดได้');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('ไม่สามารถแปลงรูปภาพเป็น JPEG ได้'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');

    // Fill white background before drawing so transparent WebP/PNG converts cleanly to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!jpegBlob) throw new Error('JPEG conversion failed');

    const downloadUrl = URL.createObjectURL(jpegBlob);
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(downloadUrl);
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
