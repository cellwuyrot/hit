"use client";

import { useState, useRef, useCallback } from "react";
import { useInlineEdit } from "./InlineEditContext";

interface DragReorderListProps {
  model: string;
  items: { id: string; [key: string]: unknown }[];
  renderItem: (item: { id: string; [key: string]: unknown }, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  onReorder?: (newItems: { id: string; [key: string]: unknown }[]) => void;
}

async function saveOrder(model: string, orderedIds: string[]) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/admin/inline", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, orderedIds }),
  });
  if (!res.ok) throw new Error("Reorder failed");
  return res.json();
}

export default function DragReorderList({
  model,
  items: initialItems,
  renderItem,
  className = "",
  itemClassName = "",
  onReorder,
}: DragReorderListProps) {
  const { editing } = useInlineEdit();
  const [items, setItems] = useState(initialItems);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragItem = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(index);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = dragItem.current;
      if (fromIndex === null || fromIndex === dropIndex) {
        setDragIdx(null);
        setOverIdx(null);
        return;
      }

      const newItems = [...items];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(dropIndex, 0, moved);
      setItems(newItems);
      setDragIdx(null);
      setOverIdx(null);
      dragItem.current = null;

      onReorder?.(newItems);

      setSaving(true);
      try {
        await saveOrder(model, newItems.map((i) => i.id));
      } catch {
        setItems(initialItems);
      } finally {
        setSaving(false);
      }
    },
    [items, initialItems, model, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }, []);

  if (!editing) {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={item.id} className={itemClassName}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {saving && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center rounded-lg">
          <span className="text-sm text-primary animate-pulse">Сохранение порядка...</span>
        </div>
      )}
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`${itemClassName} relative transition-all duration-150 ${
            dragIdx === index ? "opacity-40 scale-95" : ""
          } ${overIdx === index && dragIdx !== index ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
        >
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing bg-primary/90 text-white rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
