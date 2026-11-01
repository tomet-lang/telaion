export type BadgeTone = "neutral" | "accent" | "ok" | "warn" | "danger";

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  [key: string]: unknown;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  items: KanbanCardData[];
}

export interface KanbanMoveEvent {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  fromIndex: number;
  toIndex: number;
}
