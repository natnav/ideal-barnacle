import { Database } from '../types';

const db: Database = {
  boards: [],
  columns: [],
  cards: [],
};

export function readDb(): Database {
  return db;
}
