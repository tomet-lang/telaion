import type { IconData } from "./icon-data.js";

/** One row of a CommandPalette. Extend it with your own fields: `onselect` hands the same object back. */
export interface PaletteItem {
  /** Stable and unique among the items shown. */
  id: string;
  /** The main line. */
  label: string;
  /** A second, quieter line under the label: a path, a description. */
  detail?: string;
  /** Quiet text at the end of the row: a shortcut, a kind. */
  hint?: string;
  icon?: IconData;
  /** Shown but cannot be moved to or chosen. */
  disabled?: boolean;
}
