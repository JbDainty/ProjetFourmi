/** A fixed viewport for the collection: page the books instead of shrinking their
 * titles into illegibility or mounting the entire 200-plate collection. */
export function herbariumLayout(width: number, height: number, fontScale = 1) {
  const landscape = width >= 480 && width > height * 1.2;
  const short = height < 620;
  const padding = width < 600 ? 10 : 20;
  const contentWidth = Math.min(1120, width - padding * 2);
  const gap = short ? 10 : width >= 700 ? 20 : 14;
  const hudHeight = short ? 52 : 68;
  const summaryHeight = short ? 18 : 26;
  const tabHeight = 44,
    pagerHeight = 44;
  const bodyHeight = Math.max(
    80,
    height - padding * 2 - hudHeight - tabHeight - summaryHeight - 12,
  );
  const booksPerPage = height < 340 || (!landscape && (height < 500 || fontScale > 1.4)) ? 2 : 4;
  const columns = landscape && booksPerPage === 4 ? 4 : 2;
  const rows = Math.ceil(booksPerPage / columns);
  const bookWidth = Math.min(320, (contentWidth - (columns - 1) * gap) / columns);
  const bookHeight = Math.min(
    390,
    bookWidth * (fontScale > 1.4 ? 2.1 : 1.65),
    (bodyHeight - pagerHeight - gap - (rows - 1) * gap) / rows,
  );
  const pigmentColumns = contentWidth >= 620 ? 4 : 2;
  const pigmentRows = Math.max(
    1,
    Math.min(
      8 / pigmentColumns,
      Math.floor((bodyHeight - pagerHeight) / (fontScale > 1.3 ? 180 : 112)),
    ),
  );
  return {
    padding,
    gap,
    short,
    landscape,
    contentWidth,
    hudHeight,
    summaryHeight,
    tabHeight,
    pagerHeight,
    bodyHeight,
    booksPerPage,
    columns,
    rows,
    bookWidth,
    bookHeight,
    gridWidth: columns * bookWidth + (columns - 1) * gap,
    gridHeight: rows * bookHeight + (rows - 1) * gap,
    pigmentColumns,
    pigmentRows,
    pigmentsPerPage: pigmentColumns * pigmentRows,
    pigmentWidth: (contentWidth - (pigmentColumns - 1) * gap) / pigmentColumns,
    pigmentHeight: (bodyHeight - pagerHeight - gap - (pigmentRows - 1) * gap) / pigmentRows,
  };
}
export type HerbariumLayout = ReturnType<typeof herbariumLayout>;
