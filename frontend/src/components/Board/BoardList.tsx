import { useState } from 'react';
import { useKanbanStore } from '../../store/kanbanStore';
import type { Board } from '../../types';
import Modal from '../common/Modal';

const BOARD_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#16A34A', '#0891B2', '#475569',
];

interface Props {
  onSelect: (board: Board) => void;
}

export default function BoardList({ onSelect }: Props) {
  const { boards, addBoard } = useKanbanStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);

  const handleCreate = () => {
    if (!title.trim()) return;
    const board = addBoard(title.trim(), description.trim(), color);
    setTitle('');
    setDescription('');
    setColor(BOARD_COLORS[0]);
    setCreating(false);
    onSelect(board);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-100">My Boards</h1>
          <button
            onClick={() => setCreating(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            + New Board
          </button>
        </div>

        {/* Board grid */}
        {boards.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium text-gray-400">No boards yet</p>
            <p className="text-sm mt-1">Create your first board to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map(board => (
              <button
                key={board.id}
                onClick={() => onSelect(board)}
                className="group text-left rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-all transform hover:-translate-y-1"
              >
                <div
                  className="h-24 p-4 flex items-end"
                  style={{ backgroundColor: board.color }}
                >
                  <span className="text-white font-bold text-lg leading-tight drop-shadow">
                    {board.title}
                  </span>
                </div>
                <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
                  {board.description && (
                    <p className="text-sm text-gray-400 truncate">{board.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <Modal title="Create Board" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="My project board"
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium py-2 rounded-xl transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="flex-1 border border-gray-600 text-gray-400 hover:bg-gray-700 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
