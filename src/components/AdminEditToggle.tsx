"use client";

import { useInlineEdit } from "./InlineEditContext";

export default function AdminEditToggle() {
  const { editing, setEditing, isAdmin } = useInlineEdit();

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => setEditing(!editing)}
      className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all text-sm font-medium ${
        editing
          ? "bg-primary text-white hover:bg-primary-dark ring-2 ring-primary/30"
          : "bg-bg-white text-text-dark border border-border hover:border-primary hover:text-primary"
      }`}
      title={editing ? "Выйти из режима редактирования" : "Включить редактирование"}
    >
      {editing ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Готово
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </>
      )}
    </button>
  );
}
