import express from 'express';
import cors from 'cors';
import boardsRouter from './routes/boards';
import columnsRouter from './routes/columns';
import cardsRouter from './routes/cards';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

app.use('/api/boards', boardsRouter);
app.use('/api/boards', columnsRouter);
app.use('/api', cardsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Kanban API running on http://localhost:${PORT}`);
});
