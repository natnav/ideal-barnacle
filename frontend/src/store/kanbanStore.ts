import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Board, Column, Card, Label, ChecklistItem, Priority } from '../types';

// ---------- row → type mappers ----------

function toBoard(r: Record<string, unknown>): Board {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    color: r.color as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function toColumn(r: Record<string, unknown>): Column {
  return {
    id: r.id as string,
    boardId: r.board_id as string,
    title: r.title as string,
    color: r.color as string,
    order: r.order as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function toCard(r: Record<string, unknown>): Card {
  return {
    id: r.id as string,
    columnId: r.column_id as string,
    boardId: r.board_id as string,
    title: r.title as string,
    description: r.description as string,
    order: r.order as number,
    labels: (r.labels as Label[]) ?? [],
    dueDate: (r.due_date as string) ?? null,
    priority: (r.priority as Priority) ?? null,
    checklist: (r.checklist as ChecklistItem[]) ?? [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ---------- state ----------

interface KanbanState {
  boards: Board[];
  columns: Column[];
  cards: Card[];
  loading: boolean;
  error: string | null;

  loadAll: () => Promise<void>;

  addBoard: (title: string, description?: string, color?: string) => Promise<Board>;
  updateBoard: (id: string, data: Partial<Pick<Board, 'title' | 'description' | 'color'>>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  addColumn: (boardId: string, title: string, color?: string) => Promise<Column>;
  updateColumn: (id: string, data: Partial<Pick<Column, 'title' | 'color'>>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (boardId: string, orderedIds: string[]) => Promise<void>;

  addCard: (columnId: string, boardId: string, title: string) => Promise<Card>;
  updateCard: (id: string, data: Partial<Omit<Card, 'id' | 'createdAt'>>) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, toOrder: number) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  addChecklistItem: (cardId: string, text: string) => Promise<void>;
  toggleChecklistItem: (cardId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (cardId: string, itemId: string) => Promise<void>;

  addLabel: (cardId: string, label: Omit<Label, 'id'>) => Promise<void>;
  removeLabel: (cardId: string, labelId: string) => Promise<void>;
}

const now = () => new Date().toISOString();

export const useKanbanStore = create<KanbanState>()((set, get) => ({
  boards: [],
  columns: [],
  cards: [],
  loading: false,
  error: null,

  // ---------- load ----------

  loadAll: async () => {
    set({ loading: true, error: null });
    const [{ data: boards, error: e1 }, { data: columns, error: e2 }, { data: cards, error: e3 }] =
      await Promise.all([
        supabase.from('boards').select('*').order('created_at'),
        supabase.from('columns').select('*').order('order'),
        supabase.from('cards').select('*').order('order'),
      ]);

    const err = e1 ?? e2 ?? e3;
    if (err) {
      set({ loading: false, error: err.message });
      return;
    }

    set({
      boards: (boards ?? []).map(toBoard),
      columns: (columns ?? []).map(toColumn),
      cards: (cards ?? []).map(toCard),
      loading: false,
    });
  },

  // ---------- boards ----------

  addBoard: async (title, description = '', color = '#4F46E5') => {
    const board: Board = { id: uuidv4(), title, description, color, createdAt: now(), updatedAt: now() };
    set(s => ({ boards: [...s.boards, board] }));
    await supabase.from('boards').insert({
      id: board.id, title, description, color,
      created_at: board.createdAt, updated_at: board.updatedAt,
    });
    return board;
  },

  updateBoard: async (id, data) => {
    set(s => ({ boards: s.boards.map(b => b.id === id ? { ...b, ...data, updatedAt: now() } : b) }));
    await supabase.from('boards').update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      updated_at: now(),
    }).eq('id', id);
  },

  deleteBoard: async (id) => {
    set(s => ({
      boards: s.boards.filter(b => b.id !== id),
      columns: s.columns.filter(c => c.boardId !== id),
      cards: s.cards.filter(c => c.boardId !== id),
    }));
    await supabase.from('boards').delete().eq('id', id);
  },

  // ---------- columns ----------

  addColumn: async (boardId, title, color = '#E2E8F0') => {
    const maxOrder = get().columns
      .filter(c => c.boardId === boardId)
      .reduce((max, c) => Math.max(max, c.order), -1);
    const column: Column = { id: uuidv4(), boardId, title, color, order: maxOrder + 1, createdAt: now(), updatedAt: now() };
    set(s => ({ columns: [...s.columns, column] }));
    await supabase.from('columns').insert({
      id: column.id, board_id: boardId, title, color, order: column.order,
      created_at: column.createdAt, updated_at: column.updatedAt,
    });
    return column;
  },

  updateColumn: async (id, data) => {
    set(s => ({ columns: s.columns.map(c => c.id === id ? { ...c, ...data, updatedAt: now() } : c) }));
    await supabase.from('columns').update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.color !== undefined && { color: data.color }),
      updated_at: now(),
    }).eq('id', id);
  },

  deleteColumn: async (id) => {
    set(s => ({
      columns: s.columns.filter(c => c.id !== id),
      cards: s.cards.filter(c => c.columnId !== id),
    }));
    await supabase.from('columns').delete().eq('id', id);
  },

  reorderColumns: async (boardId, orderedIds) => {
    set(s => ({
      columns: s.columns.map(c => {
        if (c.boardId !== boardId) return c;
        const idx = orderedIds.indexOf(c.id);
        return idx === -1 ? c : { ...c, order: idx };
      }),
    }));
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('columns').update({ order: idx, updated_at: now() }).eq('id', id)
      )
    );
  },

  // ---------- cards ----------

  addCard: async (columnId, boardId, title) => {
    const maxOrder = get().cards
      .filter(c => c.columnId === columnId)
      .reduce((max, c) => Math.max(max, c.order), -1);
    const card: Card = {
      id: uuidv4(), columnId, boardId, title, description: '',
      order: maxOrder + 1, labels: [], dueDate: null,
      priority: null, checklist: [], createdAt: now(), updatedAt: now(),
    };
    set(s => ({ cards: [...s.cards, card] }));
    await supabase.from('cards').insert({
      id: card.id, column_id: columnId, board_id: boardId, title,
      description: '', order: card.order, labels: [], due_date: null,
      priority: null, checklist: [],
      created_at: card.createdAt, updated_at: card.updatedAt,
    });
    return card;
  },

  updateCard: async (id, data) => {
    set(s => ({ cards: s.cards.map(c => c.id === id ? { ...c, ...data, updatedAt: now() } : c) }));
    await supabase.from('cards').update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.labels !== undefined && { labels: data.labels }),
      ...(data.dueDate !== undefined && { due_date: data.dueDate }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.checklist !== undefined && { checklist: data.checklist }),
      updated_at: now(),
    }).eq('id', id);
  },

  moveCard: async (cardId, toColumnId, toOrder) => {
    set(s => {
      const card = s.cards.find(c => c.id === cardId);
      if (!card) return s;
      const fromColumnId = card.columnId;
      return {
        cards: s.cards.map(c => {
          if (c.id === cardId) return { ...c, columnId: toColumnId, order: toOrder, updatedAt: now() };
          if (c.columnId === fromColumnId && c.id !== cardId && c.order >= card.order)
            return { ...c, order: c.order - 1 };
          if (c.columnId === toColumnId && c.id !== cardId && c.order >= toOrder)
            return { ...c, order: c.order + 1 };
          return c;
        }),
      };
    });
    await supabase.from('cards').update({
      column_id: toColumnId, order: toOrder, updated_at: now(),
    }).eq('id', cardId);
  },

  deleteCard: async (id) => {
    set(s => ({ cards: s.cards.filter(c => c.id !== id) }));
    await supabase.from('cards').delete().eq('id', id);
  },

  // ---------- checklist ----------

  addChecklistItem: async (cardId, text) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const checklist = [...card.checklist, { id: uuidv4(), text, completed: false }];
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, checklist, updatedAt: now() } : c) }));
    await supabase.from('cards').update({ checklist, updated_at: now() }).eq('id', cardId);
  },

  toggleChecklistItem: async (cardId, itemId) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const checklist = card.checklist.map((i: ChecklistItem) =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, checklist, updatedAt: now() } : c) }));
    await supabase.from('cards').update({ checklist, updated_at: now() }).eq('id', cardId);
  },

  deleteChecklistItem: async (cardId, itemId) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const checklist = card.checklist.filter((i: ChecklistItem) => i.id !== itemId);
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, checklist, updatedAt: now() } : c) }));
    await supabase.from('cards').update({ checklist, updated_at: now() }).eq('id', cardId);
  },

  // ---------- labels ----------

  addLabel: async (cardId, label) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const labels = [...card.labels, { ...label, id: uuidv4() }];
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, labels, updatedAt: now() } : c) }));
    await supabase.from('cards').update({ labels, updated_at: now() }).eq('id', cardId);
  },

  removeLabel: async (cardId, labelId) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const labels = card.labels.filter((l: Label) => l.id !== labelId);
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? { ...c, labels, updatedAt: now() } : c) }));
    await supabase.from('cards').update({ labels, updated_at: now() }).eq('id', cardId);
  },
}));

export type { Priority };
