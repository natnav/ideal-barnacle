import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanbanStore } from '../../store/kanbanStore';
import type { Column, Card } from '../../types';
import CardItem from '../Card/CardItem';

interface Props {
  column: Column;
  cards: Card[];
}

export default function ColumnComponent({ column, cards }: Props) {
  const { updateColumn, deleteColumn, addCard } = useKanbanStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const { setNodeRef: dropRef } = useDroppable({ id: column.id, data: { type: 'column', column } });

  const {
    attributes,
    listeners,
    setNodeRef: sortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sortedCards = [...cards].sort((a, b) => a.order - b.order);
  const cardIds = sortedCards.map(c => c.id);

  const saveTitle = () => {
    if (title.trim()) updateColumn(column.id, { title: title.trim() });
    else setTitle(column.title);
    setEditingTitle(false);
  };

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    addCard(column.id, column.boardId, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
  };

  return (
    <div
      ref={sortRef}
      style={style}
      className="flex-shrink-0 w-72 flex flex-col"
    >
      {/* Column header — drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing select-none"
        style={{ backgroundColor: column.color }}
      >
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(column.title); setEditingTitle(false); } }}
            className="flex-1 text-sm font-semibold bg-transparent border-b border-gray-600 outline-none text-gray-900"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-gray-900 truncate"
            onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
          >
            {column.title}
          </span>
        )}
        <span className="text-xs text-gray-700 ml-2">{cards.length}</span>
        <button
          onClick={e => { e.stopPropagation(); deleteColumn(column.id); }}
          className="ml-2 text-gray-600 hover:text-red-700 text-sm leading-none"
        >
          ✕
        </button>
      </div>

      {/* Cards area */}
      <div
        ref={dropRef}
        className="flex-1 bg-gray-900 rounded-b-xl p-2 min-h-[60px]"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedCards.map(card => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>

        {/* Add card */}
        {addingCard ? (
          <div className="mt-2 space-y-1">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
              }}
              placeholder="Card title…"
              rows={2}
              className="w-full text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg p-2 outline-none focus:border-brand-500 resize-none placeholder-gray-600"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                className="text-xs bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="mt-2 w-full text-left text-xs text-gray-600 hover:text-brand-400 px-1 py-1 transition-colors"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
