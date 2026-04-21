import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb } from '../db/database';

const router = Router();

router.post('/columns/:columnId/cards', (req: Request, res: Response) => {
  const db = readDb();
  const column = db.columns.find(c => c.id === req.params.columnId);
  if (!column) return res.status(404).json({ error: 'Column not found' });

  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const maxOrder = db.cards
    .filter(c => c.columnId === req.params.columnId)
    .reduce((max, c) => Math.max(max, c.order), -1);

  const card = {
    id: uuidv4(),
    columnId: req.params.columnId,
    boardId: column.boardId,
    title,
    description: '',
    order: maxOrder + 1,
    labels: [],
    dueDate: null,
    priority: null,
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.cards.push(card);
  return res.status(201).json(card);
});

router.get('/cards/:id', (req: Request, res: Response) => {
  const db = readDb();
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  return res.json(card);
});

router.put('/cards/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.cards.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Card not found' });

  const { title, description, labels, dueDate, priority, checklist } = req.body;
  db.cards[idx] = {
    ...db.cards[idx],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(labels !== undefined && { labels }),
    ...(dueDate !== undefined && { dueDate }),
    ...(priority !== undefined && { priority }),
    ...(checklist !== undefined && { checklist }),
    updatedAt: new Date().toISOString(),
  };
  return res.json(db.cards[idx]);
});

router.put('/cards/:id/move', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.cards.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Card not found' });

  const { columnId, order } = req.body;
  const targetColumn = db.columns.find(c => c.id === columnId);
  if (!targetColumn) return res.status(404).json({ error: 'Target column not found' });

  const card = db.cards[idx];
  const oldColumnId = card.columnId;

  db.cards
    .filter(c => c.columnId === oldColumnId && c.id !== card.id && c.order >= card.order)
    .forEach(c => c.order--);

  db.cards
    .filter(c => c.columnId === columnId && c.id !== card.id && c.order >= order)
    .forEach(c => c.order++);

  db.cards[idx] = {
    ...card,
    columnId,
    order,
    updatedAt: new Date().toISOString(),
  };
  return res.json(db.cards[idx]);
});

router.delete('/cards/:id', (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.cards.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Card not found' });
  db.cards.splice(idx, 1);
  return res.status(204).send();
});

export default router;
