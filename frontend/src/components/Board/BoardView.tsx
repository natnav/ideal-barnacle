import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useKanbanStore } from '../../store/kanbanStore';
import type { Board, Card } from '../../types';
import ColumnComponent from '../Column/ColumnComponent';
import CardItem from '../Card/CardItem';

interface Props {
  board: Board;
  onBack: () => void;
}

export default function BoardView({ board, onBack }: Props) {
  const { columns, cards, addColumn, moveCard, reorderColumns, updateBoard, deleteBoard } =
    useKanbanStore();

  const boardColumns = columns
    .filter(c => c.boardId === board.id)
    .sort((a, b) => a.order - b.order);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [newColTitle, setNewColTitle] = useState('');
  const [addingCol, setAddingCol] = useState(false);
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === 'card') {
      setActiveCard(e.active.data.current.card as Card);
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'card') {
      const activeCard = active.data.current?.card as Card;
      let toColumnId = activeCard.columnId;

      if (overType === 'column') {
        toColumnId = over.id as string;
      } else if (overType === 'card') {
        toColumnId = (over.data.current?.card as Card).columnId;
      }

      if (toColumnId !== activeCard.columnId) {
        const toCards = cards
          .filter(c => c.columnId === toColumnId)
          .sort((a, b) => a.order - b.order);
        moveCard(activeCard.id, toColumnId, toCards.length);
      }
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'column' && overType === 'column' && active.id !== over.id) {
      const ids = boardColumns.map(c => c.id);
      const fromIdx = ids.indexOf(active.id as string);
      const toIdx = ids.indexOf(over.id as string);
      const reordered = [...ids];
      reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, active.id as string);
      reorderColumns(board.id, reordered);
      return;
    }

    if (activeType === 'card' && overType === 'card') {
      const activeCardData = active.data.current?.card as Card;
      const overCardData = over.data.current?.card as Card;
      if (activeCardData.columnId === overCardData.columnId) {
        moveCard(activeCardData.id, activeCardData.columnId, overCardData.order);
      }
    }
  };

  const handleAddColumn = () => {
    if (!newColTitle.trim()) return;
    addColumn(board.id, newColTitle.trim());
    setNewColTitle('');
    setAddingCol(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Board header */}
      <div
        className="flex items-center gap-4 px-6 py-4 bg-gray-900/90 backdrop-blur border-b border-gray-800"
        style={{ borderBottomColor: board.color + '44' }}
      >
        <button onClick={onBack} className="text-gray-500 hover:text-gray-200 text-lg transition-colors">←</button>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: board.color }}
        />
        {editingBoardTitle ? (
          <input
            autoFocus
            value={boardTitle}
            onChange={e => setBoardTitle(e.target.value)}
            onBlur={() => { if (boardTitle.trim()) updateBoard(board.id, { title: boardTitle.trim() }); setEditingBoardTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { if (boardTitle.trim()) updateBoard(board.id, { title: boardTitle.trim() }); setEditingBoardTitle(false); } }}
            className="text-xl font-bold text-gray-100 bg-transparent border-b-2 border-brand-500 outline-none"
          />
        ) : (
          <h1
            className="text-xl font-bold text-gray-100 cursor-pointer hover:text-brand-400 transition-colors"
            onDoubleClick={() => setEditingBoardTitle(true)}
          >
            {board.title}
          </h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { if (confirm('Delete this board?')) { deleteBoard(board.id); onBack(); } }}
            className="text-sm text-gray-600 hover:text-red-400 transition-colors"
          >
            Delete board
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={boardColumns.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 items-start h-full">
              {boardColumns.map(col => (
                <ColumnComponent
                  key={col.id}
                  column={col}
                  cards={cards.filter(c => c.columnId === col.id)}
                />
              ))}

              {/* Add column */}
              {addingCol ? (
                <div className="flex-shrink-0 w-72 bg-gray-800 rounded-xl border border-gray-700 p-3 space-y-2">
                  <input
                    autoFocus
                    value={newColTitle}
                    onChange={e => setNewColTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') { setAddingCol(false); setNewColTitle(''); }
                    }}
                    placeholder="Column name…"
                    className="w-full text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-1.5 outline-none focus:border-brand-500 placeholder-gray-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="text-xs bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => { setAddingCol(false); setNewColTitle(''); }}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCol(true)}
                  className="flex-shrink-0 w-72 bg-gray-800/40 hover:bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 hover:border-brand-500 text-gray-600 hover:text-brand-400 text-sm py-3 transition-all"
                >
                  + Add column
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 shadow-2xl">
                <CardItem card={activeCard} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
