import type { TreeCreateEditing, TreeEditing, TreeNode } from "./types.js";

/** Where a node stands, for the whole tree and not only the part that is open. */
export interface TreeIndex {
  byId: Map<string, TreeNode>;
  parentOf: Map<string, string | null>;
}

export function indexTree(nodes: TreeNode[]): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const parentOf = new Map<string, string | null>();
  const visit = (list: TreeNode[], parentId: string | null) => {
    for (const node of list) {
      byId.set(node.id, node);
      parentOf.set(node.id, parentId);
      if (node.children) visit(node.children, node.id);
    }
  };
  visit(nodes, null);
  return { byId, parentOf };
}

export function isBranch(node: TreeNode): boolean {
  return node.isFolder ?? node.children !== undefined;
}

/** A row of what is on screen, in order. The tree is flat in the DOM and says its depth with aria-level. */
export type TreeRowModel =
  | {
      kind: "node";
      node: TreeNode;
      /** 1 for the top. */
      level: number;
      /** Where it stands among its siblings, for assistive technology. */
      position: number;
      setSize: number;
      expanded: boolean;
      branch: boolean;
      parentId: string | null;
    }
  | { kind: "create"; editing: TreeCreateEditing; level: number; parentId: string | null }
  | { kind: "empty"; level: number; parent: TreeNode };

export function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  editing: TreeEditing | null,
): TreeRowModel[] {
  const rows: TreeRowModel[] = [];
  const create = editing?.kind === "create" ? editing : null;

  const visit = (list: TreeNode[], level: number, parentId: string | null) => {
    list.forEach((node, index) => {
      const branch = isBranch(node);
      const expanded = branch && expandedIds.has(node.id);
      rows.push({
        kind: "node",
        node,
        level,
        position: index + 1,
        setSize: list.length,
        expanded,
        branch,
        parentId,
      });
      if (!expanded) return;
      if (create?.parentId === node.id) {
        rows.push({ kind: "create", editing: create, level: level + 1, parentId: node.id });
      }
      if (node.children) {
        visit(node.children, level + 1, node.id);
        if (node.children.length === 0 && create?.parentId !== node.id) {
          rows.push({ kind: "empty", level: level + 1, parent: node });
        }
      }
    });
  };

  if (create && create.parentId === null) {
    rows.push({ kind: "create", editing: create, level: 1, parentId: null });
  }
  visit(nodes, 1, null);
  return rows;
}

/**
 * Whether a node may be dropped into a branch, by the shape of the tree alone: not into itself or
 * its own descendants (that would cut the tree off), and not where it already is (nothing to do).
 */
export function canMoveInto(index: TreeIndex, sourceId: string, targetId: string | null): boolean {
  if (!index.byId.has(sourceId)) return false;
  if (index.parentOf.get(sourceId) === targetId) return false;
  for (let id = targetId; id !== null; id = index.parentOf.get(id) ?? null) {
    if (id === sourceId) return false;
  }
  return true;
}
