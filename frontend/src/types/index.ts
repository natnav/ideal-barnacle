export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high' | null;

export interface Card {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description: string;
  order: number;
  labels: Label[];
  dueDate: string | null;
  priority: Priority;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDetail extends Board {
  columns: Column[];
  cards: Card[];
}
