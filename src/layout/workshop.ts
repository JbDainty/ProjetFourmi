type Options = { height: number; tubes: number; fontScale: number; hintHeight?: number };
/** Shared by the menu's preparation and the first rendered workshop frame. */
export function workshopLayout(
  windowWidth: number,
  viewportWidth = windowWidth,
  options?: Options,
) {
  const height = options?.height || 800;
  const width = Math.min(viewportWidth || windowWidth, 1180);
  const landscape = width >= 480 && width > height * 1.2 && height < 520;
  const tiny = height < 600;
  const compact = height < 680;
  const wide = width > 1100 && height >= 600;
  const padding = width < 800 ? 8 : 16;
  const gap = wide ? 18 : 4;
  const content = Math.max(0, width - padding * 2);
  const boardWidth = wide ? (content - gap) * 0.64 : content;
  const hudHeight = landscape ? 48 : tiny ? 60 : 56;
  const captionHeight = tiny || landscape ? 0 : compact ? 80 : 92;
  const hintWidth = landscape ? Math.max(180, boardWidth * 0.53 - 4) : Math.min(580, boardWidth);
  const narrowActions = landscape && boardWidth - hintWidth - 4 < 280;
  const actionHorizontalPadding = narrowActions ? 14 : 18;
  const showSeedPrice = !tiny && !landscape && !(compact && (options?.fontScale || 1) > 1.1);
  const actionIconSize = compact ? 20 : 24;
  const actionLabelSize = narrowActions ? 12 : compact ? 16 : 18;
  const actionLabelLine = compact ? 18 : 20;
  const actionLabelHeight = Math.ceil(actionLabelLine * Math.min(options?.fontScale || 1, 1.15));
  const actionContentHeight = Math.max(
    44,
    actionIconSize + 2 + actionLabelHeight + (showSeedPrice ? 14 : 0),
  );
  // Twelve points protect the content from the marginal leaves on both edges.
  const actionsHeight = actionContentHeight + 24;
  const hintHeight = options?.hintHeight || 56;
  const footerHeight = landscape
    ? Math.max(actionsHeight, hintHeight)
    : actionsHeight + hintHeight + 4;
  const boardHeight = Math.max(
    90,
    height - hudHeight - captionHeight - footerHeight - padding * 2 - 8,
  );
  return {
    wide,
    landscape,
    tiny,
    compact,
    padding,
    maxWidth: 1180,
    gap,
    boardWidth,
    boardHeight,
    hudHeight,
    captionHeight,
    actionsHeight,
    actionIconSize,
    actionLabelSize,
    actionLabelLine,
    actionLabelHeight,
    actionHorizontalPadding,
    showSeedPrice,
    hintWidth,
    hintHeight,
    footerHeight,
    height,
  };
}
