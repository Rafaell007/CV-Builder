/**
 * Screens at least this many pixels wide use the desktop layout; narrower screens use the tablet layout.
 * For `DataTable` `hideBelow`. CSS media queries cannot read a constant, so CSS files repeat it as
 * `max-width: 1023.98px` (the limit minus 0.02px; a test checks `ListPage` and `DataTable`). Own choice: Figma has only the 1440 and 768 frames.
 */
export const DESKTOP_MIN_WIDTH = 1024;
