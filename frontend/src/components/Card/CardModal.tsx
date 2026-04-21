import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useKanbanStore } from '../../store/kanbanStore';
import type { Card, Priority } from '../../types';
import Modal from '../common/Modal';
import PriorityBadge from '../common/PriorityBadge';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface Props {
  card: Card;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: Props) {
  const { updateCard, deleteCard, addChecklistItem, toggleChecklistItem, deleteChecklistItem, addLabel, removeLabel } =
    useKanbanStore();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [descEditing, setDescEditing] = useState(false);
  const [checkText, setCheckText] = useState('');
  const [labelText, setLabelText] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const save = () => updateCard(card.id, { title, description });

  return (
    <Modal title="" onClose={() => { save(); onClose(); }} wide>
      <div className="space-y-5">
        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={save}
          className="w-full text-xl font-semibold text-gray-100 bg-transparent border-b-2 border-transparent focus:border-brand-500 outline-none pb-1 placeholder-gray-600"
        />

        {/* Priority + Due Date */}
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Priority</label>
            <select
              value={card.priority ?? ''}
              onChange={e => updateCard(card.id, { priority: (e.target.value || null) as Priority })}
              className="text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-2 py-1 outline-none focus:border-brand-500"
            >
              {PRIORITIES.map(p => (
                <option key={String(p.value)} value={p.value ?? ''}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Due Date</label>
            <input
              type="date"
              value={card.dueDate ?? ''}
              onChange={e => updateCard(card.id, { dueDate: e.target.value || null })}
              className="text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-2 py-1 outline-none focus:border-brand-500"
            />
          </div>

          {card.priority && <PriorityBadge priority={card.priority} />}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">Description</label>
            <button
              onClick={() => setDescEditing(e => !e)}
              className="text-xs text-brand-400 hover:underline"
            >
              {descEditing ? 'Preview' : 'Edit'}
            </button>
          </div>
          {descEditing ? (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={save}
              rows={5}
              placeholder="Supports **markdown**..."
              className="w-full text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-xl p-3 outline-none focus:border-brand-500 resize-none font-mono placeholder-gray-600"
            />
          ) : (
            <div
              className="prose prose-sm prose-invert max-w-none min-h-[60px] bg-gray-700/50 rounded-xl p-3 cursor-text"
              onClick={() => setDescEditing(true)}
            >
              {description ? (
                <ReactMarkdown>{description}</ReactMarkdown>
              ) : (
                <span className="text-gray-600 text-sm">Click to add description…</span>
              )}
            </div>
          )}
        </div>

        {/* Labels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Labels</label>
            <button
              onClick={() => setShowLabelForm(f => !f)}
              className="text-xs text-brand-400 hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels.map(l => (
              <span
                key={l.id}
                style={{ backgroundColor: l.color }}
                className="flex items-center gap-1 text-xs text-white font-medium px-2 py-0.5 rounded-full"
              >
                {l.text}
                <button
                  onClick={() => removeLabel(card.id, l.id)}
                  className="opacity-70 hover:opacity-100 leading-none"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          {showLabelForm && (
            <div className="flex gap-2 items-center">
              <input
                value={labelText}
                onChange={e => setLabelText(e.target.value)}
                placeholder="Label text"
                className="flex-1 text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-2 py-1 outline-none focus:border-brand-500 placeholder-gray-600"
              />
              <div className="flex gap-1">
                {LABEL_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setLabelColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full ${labelColor === c ? 'ring-2 ring-offset-1 ring-offset-gray-800 ring-white' : ''}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (!labelText.trim()) return;
                  addLabel(card.id, { text: labelText.trim(), color: labelColor });
                  setLabelText('');
                  setShowLabelForm(false);
                }}
                className="text-sm bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div>
          <label className="text-xs text-gray-500 block mb-2">Checklist</label>
          <div className="space-y-1.5 mb-3">
            {card.checklist.map(item => (
              <div key={item.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(card.id, item.id)}
                  className="accent-brand-500 w-4 h-4"
                />
                <span
                  className={`flex-1 text-sm ${
                    item.completed ? 'line-through text-gray-600' : 'text-gray-200'
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => deleteChecklistItem(card.id, item.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={checkText}
              onChange={e => setCheckText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && checkText.trim()) {
                  addChecklistItem(card.id, checkText.trim());
                  setCheckText('');
                }
              }}
              placeholder="Add checklist item (Enter)"
              className="flex-1 text-sm bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-1.5 outline-none focus:border-brand-500 placeholder-gray-600"
            />
          </div>
          {card.checklist.length > 0 && (
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{
                  width: `${(card.checklist.filter(i => i.completed).length / card.checklist.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Delete */}
        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={() => { deleteCard(card.id); onClose(); }}
            className="text-sm text-red-500 hover:text-red-400 hover:underline"
          >
            Delete card
          </button>
        </div>
      </div>
    </Modal>
  );
}
