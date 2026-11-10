/**
 * Ancho y alto de un mp4 leidos de su cabecera, sin dependencias.
 *
 * Payload solo mide imagenes: a un video le deja `width` y `height` en null, y el
 * adaptador del portfolio descarta toda pieza sin medidas (sin ellas la galeria no
 * sabe su orientacion ni puede reservar el hueco). La medida vive en la caja `tkhd`
 * de la pista de video, dentro de `moov`; con `-movflags +faststart` esa caja va al
 * principio del archivo, asi que basta con los primeros bytes.
 */
export interface Mp4Dimensions {
  width: number;
  height: number;
}

const CONTAINERS = new Set(['moov', 'trak']);

export function mp4Dimensions(bytes: Uint8Array): Mp4Dimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return walk(view, 0, bytes.byteLength);
}

function walk(view: DataView, start: number, end: number): Mp4Dimensions | null {
  let at = start;
  while (at + 8 <= end) {
    let size = view.getUint32(at);
    const type = String.fromCharCode(view.getUint8(at + 4), view.getUint8(at + 5), view.getUint8(at + 6), view.getUint8(at + 7));
    let header = 8;
    if (size === 1) {
      if (at + 16 > end) return null;
      size = Number(view.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) {
      size = end - at;
    }
    if (size < header) return null;
    const boxEnd = Math.min(at + size, end);

    if (type === 'tkhd') {
      const found = readTkhd(view, at + header, boxEnd);
      if (found) return found;
    } else if (CONTAINERS.has(type)) {
      const found = walk(view, at + header, boxEnd);
      if (found) return found;
    }
    at += size;
  }
  return null;
}

/** La pista de audio tambien tiene `tkhd`, con ancho y alto en cero: se salta. */
function readTkhd(view: DataView, start: number, end: number): Mp4Dimensions | null {
  const version = view.getUint8(start);
  const offset = start + (version === 1 ? 88 : 76);
  if (offset + 8 > end) return null;
  // Punto fijo 16.16: la parte entera son los 16 bits altos.
  const width = view.getUint32(offset) >>> 16;
  const height = view.getUint32(offset + 4) >>> 16;
  return width > 0 && height > 0 ? { width, height } : null;
}
