import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb } from '../db/database';

const router = Router();

router.post('/:boardId/columns', (req: Request, res: Response) => {
  const db = readDb();
  const board = db.boards.find(b => b.id === req.params.boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const { title, color = '#E2E8F0' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const maxOrder = db.columns
    .filter(c => c.boardId === req.params.boardId)
    .reduce((max, c) => Math.max(max, c.order), -1);

  const column = {
    id: uuidv4(),
    boardId: req.params.boardId,
    title,
    color,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.columns.push(column);
  return res.status(201).json(column);
});

router.put('/columns/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.columns.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Column not found' });

  const { title, color } = req.body;
  db.columns[idx] = {
    ...db.columns[idx],
    ...(title !== undefined && { title }),
    ...(color !== undefined && { color }),
    updatedAt: new Date().toISOString(),
  };
  return res.json(db.columns[idx]);
});

router.delete('/columns/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.columns.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Column not found' });

  const colId = db.columns[idx].id;
  db.columns.splice(idx, 1);
  db.cards = db.cards.filter(c => c.columnId !== colId);
  return res.status(204).send();
});

router.put('/columns/reorder', (req: Request, res: Response) => {
  const db = readDb();
  const { boardId, orderedIds } = req.body as { boardId: string; orderedIds: string[] };
  if (!boardId || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'boardId and orderedIds are required' });
  }

  orderedIds.forEach((id, idx) => {
    const col = db.columns.find(c => c.id === id && c.boardId === boardId);
    if (col) col.order = idx;
  });
  return res.json(db.columns.filter(c => c.boardId === boardId).sort((a, b) => a.order - b.order));
});

export default router;
