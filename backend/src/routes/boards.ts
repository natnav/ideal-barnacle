import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb } from '../db/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.boards);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = readDb();
  const board = db.boards.find(b => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const columns = db.columns
    .filter(c => c.boardId === board.id)
    .sort((a, b) => a.order - b.order);

  const cards = db.cards.filter(c => c.boardId === board.id);

  return res.json({ ...board, columns, cards });
});

router.post('/', (req: Request, res: Response) => {
  const db = readDb();
  const { title, description = '', color = '#4F46E5' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const board = {
    id: uuidv4(),
    title,
    description,
    color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.boards.push(board);
  return res.status(201).json(board);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.boards.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Board not found' });

  const { title, description, color } = req.body;
  db.boards[idx] = {
    ...db.boards[idx],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(color !== undefined && { color }),
    updatedAt: new Date().toISOString(),
  };
  return res.json(db.boards[idx]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.boards.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Board not found' });

  db.boards.splice(idx, 1);
  db.columns = db.columns.filter(c => c.boardId !== req.params.id);
  db.cards = db.cards.filter(c => c.boardId !== req.params.id);
  return res.status(204).send();
});

export default router;
