import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../../types';
import PriorityBadge from '../common/PriorityBadge';
import CardModal from './CardModal';

interface Props {
  card: Card;
}

export default function CardItem({ card }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const doneItems = card.checklist.filter(i => i.completed).length;
  const dueSoon =
    card.dueDate &&
    new Date(card.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const overdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        className="bg-gray-800 rounded-xl border border-gray-700 p-3 cursor-pointer hover:border-brand-500 hover:shadow-lg hover:shadow-black/30 transition-all group"
      >
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map(l => (
              <span
                key={l.id}
                style={{ backgroundColor: l.color }}
                className="h-1.5 w-8 rounded-full opacity-90"
              />
            ))}
          </div>
        )}

        <p className="text-sm font-medium text-gray-100 leading-snug">{card.title}</p>

        {card.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <PriorityBadge priority={card.priority} />

          {card.dueDate && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                overdue
                  ? 'bg-red-900/50 text-red-400'
                  : dueSoon
                  ? 'bg-amber-900/50 text-amber-400'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {new Date(card.dueDate).toLocaleDateString()}
            </span>
          )}

          {card.checklist.length > 0 && (
            <span className="text-xs text-gray-500">
              ✓ {doneItems}/{card.checklist.length}
            </span>
          )}
        </div>
      </div>

      {modalOpen && <CardModal card={card} onClose={() => setModalOpen(false)} />}
    </>
  );
}
