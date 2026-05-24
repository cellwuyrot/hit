"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useInlineEdit } from "./InlineEditContext";

interface InlineEditableProps {
  model: string;
  id: string;
  field: string;
  value: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  className?: string;
  multiline?: boolean;
  children?: React.ReactNode;
}

async function saveField(model: string, id: string, field: string, value: string) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/admin/inline", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, id, field, value }),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

export default function InlineEditable({
  model,
  id,
  field,
  value,
  as: Tag = "span",
  className = "",
  multiline = false,
  children,
}: InlineEditableProps) {
  const { editing } = useInlineEdit();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (currentValue === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await saveField(model, id, field, currentValue);
      setIsEditing(false);
    } catch {
      setCurrentValue(value);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }, [currentValue, value, model, id, field]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Enter" && multiline && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        setCurrentValue(value);
        setIsEditing(false);
      }
    },
    [handleSave, multiline, value]
  );

  if (!editing) {
    return <Tag className={className}>{children || currentValue}</Tag>;
  }

  if (isEditing) {
    const inputClass =
      "w-full bg-white border-2 border-primary rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30";

    return (
      <div className="relative inline-block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${inputClass} min-h-[60px] resize-y`}
            disabled={saving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={inputClass}
            disabled={saving}
          />
        )}
        {saving && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse">
            ...
          </span>
        )}
      </div>
    );
  }

  return (
    <Tag
      className={`${className} cursor-pointer border border-dashed border-transparent hover:border-primary/50 rounded transition-colors relative group/edit`}
      onClick={() => setIsEditing(true)}
      title="Нажмите чтобы редактировать"
    >
      {children || currentValue}
      <span className="absolute -top-2 -right-2 bg-primary text-white text-[9px] px-1 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Редактировать
      </span>
    </Tag>
  );
}
