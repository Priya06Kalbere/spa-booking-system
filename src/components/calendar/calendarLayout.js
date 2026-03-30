import { TIME_COL_WIDTH, BASE_COLUMN_WIDTH } from "./calendarHelpers";

// Calculate responsive column sizes
export const getCalendarDimensions = (boardWidth, therapistCount) => {
  const availableWidth = Math.max(boardWidth - TIME_COL_WIDTH, 0);

  const dynamicColumnWidth =
    therapistCount > 0
      ? Math.max(BASE_COLUMN_WIDTH, Math.floor(availableWidth / therapistCount))
      : BASE_COLUMN_WIDTH;

  const columnWidth =
    therapistCount <= 8 ? dynamicColumnWidth : BASE_COLUMN_WIDTH;

  const tableWidth = therapistCount * columnWidth;
  const fullWidth = TIME_COL_WIDTH + tableWidth;

  return {
    availableWidth,
    columnWidth,
    tableWidth,
    fullWidth,
  };
};

// Calculate visible virtual rows/columns
export const getVisibleWindow = ({
  scrollTop,
  scrollLeft,
  rowHeight,
  totalSlots,
  columnWidth,
  therapistCount,
  viewportHeight,
  viewportWidth,
}) => {
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
  const visibleRowCount = Math.ceil(viewportHeight / rowHeight) + 10;
  const endRow = Math.min(totalSlots, startRow + visibleRowCount);

  const startCol = Math.max(0, Math.floor(scrollLeft / columnWidth) - 2);
  const visibleColCount = Math.ceil(viewportWidth / columnWidth) + 4;
  const endCol = Math.min(therapistCount, startCol + visibleColCount);

  return {
    startRow,
    endRow,
    startCol,
    endCol,
  };
};