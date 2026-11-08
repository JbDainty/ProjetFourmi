/** Match the atelier's actual page padding, maximum width and desktop column ratio. */
export function workshopLayout(windowWidth: number, viewportWidth = windowWidth) {
  const wide = windowWidth > 1100;
  const padding = windowWidth < 800 ? 18 : 32;
  const maxWidth = 1180;
  const gap = 28;
  const content = Math.max(0, Math.min(viewportWidth || windowWidth, maxWidth) - padding * 2);
  return {
    wide,
    padding,
    maxWidth,
    gap,
    boardWidth: Math.round(wide ? ((content - gap) * 1.35) / 2.35 : content),
  };
}
