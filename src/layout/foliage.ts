export type FrameSurface = { x: number; y: number; width: number; height: number };

/** Android SVG paints into a bitmap at device density. Keep the empty center out
 * of tall-page bitmaps, with the same viewBox coordinates and original artwork. */
export function foliageSurfaces(width: number, height: number, native: boolean): FrameSurface[] {
  if (width <= 0 || height <= 0) return [];
  if (!native || (height <= 640 && width * height <= 240000))
    return [{ x: 0, y: 0, width, height }];
  const edge = Math.min(48, height / 2);
  const side = Math.min(28, width / 2);
  const surfaces: FrameSurface[] = [];
  // Also bound the horizontal strips on tablets and in landscape.
  for (let x = 0; x < width; x += 384) {
    const span = Math.min(384, width - x);
    surfaces.push({ x, y: 0, width: span, height: edge });
    surfaces.push({ x, y: height - edge, width: span, height: edge });
  }
  for (let y = edge; y < height - edge; y += 384) {
    const span = Math.min(384, height - edge - y);
    surfaces.push({ x: 0, y, width: side, height: span });
    surfaces.push({ x: width - side, y, width: side, height: span });
  }
  return surfaces;
}
