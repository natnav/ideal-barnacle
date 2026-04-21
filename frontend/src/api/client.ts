import type { Board, BoardDetail, Card, Column } from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  boards: {
    list: () => request<Board[]>('/boards'),
    get: (id: string) => request<BoardDetail>(`/boards/${id}`),
    create: (data: { title: string; description?: string; color?: string }) =>
      request<Board>('/boards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Board, 'title' | 'description' | 'color'>>) =>
      request<Board>(`/boards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/boards/${id}`, { method: 'DELETE' }),
  },
  columns: {
    create: (boardId: string, data: { title: string; color?: string }) =>
      request<Column>(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Column, 'title' | 'color'>>) =>
      request<Column>(`/boards/columns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/boards/columns/${id}`, { method: 'DELETE' }),
    reorder: (boardId: string, orderedIds: string[]) =>
      request<Column[]>('/boards/columns/reorder', {
        method: 'PUT',
        body: JSON.stringify({ boardId, orderedIds }),
      }),
  },
  cards: {
    create: (columnId: string, data: { title: string }) =>
      request<Card>(`/columns/${columnId}/cards`, { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<Card>(`/cards/${id}`),
    update: (id: string, data: Partial<Card>) =>
      request<Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    move: (id: string, data: { columnId: string; order: number }) =>
      request<Card>(`/cards/${id}/move`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/cards/${id}`, { method: 'DELETE' }),
  },
};
