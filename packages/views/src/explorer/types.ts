export interface TreeNode {
  id: string;
  label: string;
  isFolder?: boolean;
  children?: TreeNode[];
  icon?: unknown;
  data?: unknown;
}

export interface TreeSelectEvent {
  node: TreeNode;
}
