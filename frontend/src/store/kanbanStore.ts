import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Board, Column, Card, Label, ChecklistItem, Priority } from '../types';

interface KanbanState {
  boards: Board[];
  columns: Column[];
  cards: Card[];

  // Board actions
  addBoard: (title: string, description?: string, color?: string) => Board;
  updateBoard: (id: string, data: Partial<Pick<Board, 'title' | 'description' | 'color'>>) => void;
  deleteBoard: (id: string) => void;

  // Column actions
  addColumn: (boardId: string, title: string, color?: string) => Column;
  updateColumn: (id: string, data: Partial<Pick<Column, 'title' | 'color'>>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (boardId: string, orderedIds: string[]) => void;

  // Card actions
  addCard: (columnId: string, boardId: string, title: string) => Card;
  updateCard: (id: string, data: Partial<Omit<Card, 'id' | 'createdAt'>>) => void;
  moveCard: (cardId: string, toColumnId: string, toOrder: number) => void;
  deleteCard: (id: string) => void;

  // Checklist
  addChecklistItem: (cardId: string, text: string) => void;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  deleteChecklistItem: (cardId: string, itemId: string) => void;

  // Labels
  addLabel: (cardId: string, label: Omit<Label, 'id'>) => void;
  removeLabel: (cardId: string, labelId: string) => void;
}

const now = () => new Date().toISOString();

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      boards: [],
      columns: [],
      cards: [],

      addBoard: (title, description = '', color = '#4F46E5') => {
        const board: Board = { id: uuidv4(), title, description, color, createdAt: now(), updatedAt: now() };
        set(s => ({ boards: [...s.boards, board] }));
        return board;
      },

      updateBoard: (id, data) =>
        set(s => ({
          boards: s.boards.map(b => b.id === id ? { ...b, ...data, updatedAt: now() } : b),
        })),

      deleteBoard: (id) =>
        set(s => ({
          boards: s.boards.filter(b => b.id !== id),
          columns: s.columns.filter(c => c.boardId !== id),
          cards: s.cards.filter(c => c.boardId !== id),
        })),

      addColumn: (boardId, title, color = '#E2E8F0') => {
        let maxOrder = -1;
        const store = useKanbanStore.getState();
        store.columns.filter(c => c.boardId === boardId).forEach(c => {
          if (c.order > maxOrder) maxOrder = c.order;
        });
        const column: Column = { id: uuidv4(), boardId, title, color, order: maxOrder + 1, createdAt: now(), updatedAt: now() };
        set(s => ({ columns: [...s.columns, column] }));
        return column;
      },

      updateColumn: (id, data) =>
        set(s => ({
          columns: s.columns.map(c => c.id === id ? { ...c, ...data, updatedAt: now() } : c),
        })),

      deleteColumn: (id) =>
        set(s => ({
          columns: s.columns.filter(c => c.id !== id),
          cards: s.cards.filter(c => c.columnId !== id),
        })),

      reorderColumns: (boardId, orderedIds) =>
        set(s => ({
          columns: s.columns.map(c => {
            if (c.boardId !== boardId) return c;
            const idx = orderedIds.indexOf(c.id);
            return idx === -1 ? c : { ...c, order: idx };
          }),
        })),

      addCard: (columnId, boardId, title) => {
        const store = useKanbanStore.getState();
        const maxOrder = store.cards
          .filter(c => c.columnId === columnId)
          .reduce((max, c) => Math.max(max, c.order), -1);
        const card: Card = {
          id: uuidv4(), columnId, boardId, title, description: '',
          order: maxOrder + 1, labels: [], dueDate: null,
          priority: null, checklist: [], createdAt: now(), updatedAt: now(),
        };
        set(s => ({ cards: [...s.cards, card] }));
        return card;
      },

      updateCard: (id, data) =>
        set(s => ({
          cards: s.cards.map(c => c.id === id ? { ...c, ...data, updatedAt: now() } : c),
        })),

      moveCard: (cardId, toColumnId, toOrder) =>
        set(s => {
          const card = s.cards.find(c => c.id === cardId);
          if (!card) return s;
          const fromColumnId = card.columnId;

          let cards = s.cards.map(c => {
            if (c.id === cardId) return { ...c, columnId: toColumnId, order: toOrder, updatedAt: now() };
            if (c.columnId === fromColumnId && c.id !== cardId && c.order >= card.order) {
              return { ...c, order: c.order - 1 };
            }
            if (c.columnId === toColumnId && c.id !== cardId && c.order >= toOrder) {
              return { ...c, order: c.order + 1 };
            }
            return c;
          });
          return { cards };
        }),

      deleteCard: (id) =>
        set(s => ({ cards: s.cards.filter(c => c.id !== id) })),

      addChecklistItem: (cardId, text) =>
        set(s => ({
          cards: s.cards.map(c =>
            c.id === cardId
              ? { ...c, checklist: [...c.checklist, { id: uuidv4(), text, completed: false }], updatedAt: now() }
              : c
          ),
        })),

      toggleChecklistItem: (cardId, itemId) =>
        set(s => ({
          cards: s.cards.map(c =>
            c.id === cardId
              ? {
                  ...c,
                  checklist: c.checklist.map((item: ChecklistItem) =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                  ),
                  updatedAt: now(),
                }
              : c
          ),
        })),

      deleteChecklistItem: (cardId, itemId) =>
        set(s => ({
          cards: s.cards.map(c =>
            c.id === cardId
              ? { ...c, checklist: c.checklist.filter((i: ChecklistItem) => i.id !== itemId), updatedAt: now() }
              : c
          ),
        })),

      addLabel: (cardId, label) =>
        set(s => ({
          cards: s.cards.map(c =>
            c.id === cardId
              ? { ...c, labels: [...c.labels, { ...label, id: uuidv4() }], updatedAt: now() }
              : c
          ),
        })),

      removeLabel: (cardId, labelId) =>
        set(s => ({
          cards: s.cards.map(c =>
            c.id === cardId
              ? { ...c, labels: c.labels.filter((l: Label) => l.id !== labelId), updatedAt: now() }
              : c
          ),
        })),
    }),
    {
      name: 'kanban-storage',
    }
  )
);

export type { Priority };
