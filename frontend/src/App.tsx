import { useState } from 'react';
import { useKanbanStore } from './store/kanbanStore';
import type { Board } from './types';
import BoardList from './components/Board/BoardList';
import BoardView from './components/Board/BoardView';

export default function App() {
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const { boards } = useKanbanStore();

  const currentBoard = activeBoard ? boards.find(b => b.id === activeBoard.id) ?? null : null;

  return (
    <>
      {currentBoard ? (
        <BoardView board={currentBoard} onBack={() => setActiveBoard(null)} />
      ) : (
        <BoardList onSelect={setActiveBoard} />
      )}
    </>
  );
}
