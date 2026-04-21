import { useState, useEffect } from 'react';
import { useKanbanStore } from './store/kanbanStore';
import type { Board } from './types';
import BoardList from './components/Board/BoardList';
import BoardView from './components/Board/BoardView';

export default function App() {
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const { boards, loading, error, loadAll } = useKanbanStore();

  useEffect(() => {
    loadAll();
  }, []);

  const currentBoard = activeBoard ? boards.find(b => b.id === activeBoard.id) ?? null : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-red-400 font-medium">Failed to connect to Supabase</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={loadAll}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
