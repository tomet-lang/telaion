import type { IconData } from "@telaion/primitives";

/** One node of the tree. The application decides what a node is; the tree only shows it. */
export interface TreeNode {
  id: string;
  /** What is shown, and the accessible name of the row. */
  label: string;
  /**
   * Whether the node can hold children (it gets a chevron, and it is a place to drop onto).
   * Without it, a node is a branch when `children` is set, even when that list is empty.
   * Leave `children` unset on a branch whose children are not loaded yet.
   */
  isFolder?: boolean;
  children?: TreeNode[];
  /** The icon in front of the label. Without it a branch shows a folder and a leaf shows a file. */
  icon?: IconData;
  /** The icon of an expanded branch. Without it, `icon` is used for both states. */
  openIcon?: IconData;
  /** Its children are being fetched: a spinner takes the place of the chevron. */
  loading?: boolean;
  /** Anything the application wants back in its own handlers. */
  data?: unknown;
}

export interface TreeSelectEvent {
  node: TreeNode;
}

/**
 * A node was dropped onto a branch, or onto the empty area of the tree.
 * The tree only reports it; the application moves the node and passes new `nodes`.
 */
export interface TreeMoveEvent {
  sourceId: string;
  source: TreeNode;
  /** The branch it was dropped into; `null` is the root. */
  targetId: string | null;
  target: TreeNode | null;
}

/** The pointer or the keyboard asked for a context menu. */
export interface TreeContextMenuEvent {
  /** The node under the pointer or the keyboard focus; `null` when it was the empty area. */
  node: TreeNode | null;
  /** Where to open it, in viewport coordinates. From the keyboard: below the focused row. */
  x: number;
  y: number;
  source: "pointer" | "keyboard";
}

interface TreeEditBase {
  /** The text in the field to begin with. */
  value?: string;
  /** A part of `value` to select at the start, `[start, end]`. All of it when absent. */
  selection?: [number, number];
  /** The accessible name of the field. */
  label?: string;
  placeholder?: string;
}

/** The name of a node is being edited, in place of its label. */
export interface TreeRenameEditing extends TreeEditBase {
  kind: "rename";
  id: string;
}

/** A new child is being named. Its row stands at the top of the children of `parentId`. */
export interface TreeCreateEditing extends TreeEditBase {
  kind: "create";
  /** The branch it is created in (it is expanded if it is not); `null` is the root. */
  parentId: string | null;
  /** The icon of the row, so a new folder can look like a folder. */
  icon?: IconData;
}

export type TreeEditing = TreeRenameEditing | TreeCreateEditing;

export interface TreeCommitEvent {
  editing: TreeEditing;
  /** What was typed, trimmed. Never empty, and for a rename never the old name. */
  value: string;
}

/** A message for the person means "refused"; nothing means "accepted". */
export type TreeCheckResult = string | null | undefined | void;
