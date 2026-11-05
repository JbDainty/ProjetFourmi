/** TextureView/CAEAGLLayer renders fewer physical pixels, then GPU-scales to fit. */
export function prologueSurface(width: number, height: number, density: number) {
  const ratio = Math.min(1, 2 / density, 1600 / (Math.max(width, height) * density));
  return { width: width * ratio, height: height * ratio, scale: 1 / ratio };
}
