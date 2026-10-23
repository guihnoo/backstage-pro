/**
 * Reduz uma foto para caber no envio: corte quadrado no centro, lado máximo `size`, JPEG.
 * Foto de celular (4 a 12 MB) vira ~100 KB. Devolve um File pronto para o upload.
 */
export async function squareThumbnail(file, { size = 512, quality = 0.85 } = {}) {
  const { source, width, height, release } = await loadSource(file);
  try {
    const side = Math.min(width, height);
    const sx = Math.round((width - side) / 2);
    const sy = Math.round((height - side) / 2);
    const target = Math.min(size, side);

    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a'; // PNG com fundo transparente não vira preto estranho no JPEG
    ctx.fillRect(0, 0, target, target);
    ctx.drawImage(source, sx, sy, side, side, 0, 0, target, target);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Não foi possível preparar a foto.');
    return new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
  } finally {
    release();
  }
}

async function loadSource(file) {
  // imageOrientation: a foto de celular não sai deitada
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close?.() };
    } catch { /* tenta pelo <img> */ }
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Esse arquivo não parece ser uma imagem.'));
    };
    el.src = url;
  });
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}
