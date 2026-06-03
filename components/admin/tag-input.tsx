"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, X } from "lucide-react";

interface TagInputProps {
  label: string;
  values: string[];
  suggestions: string[];
  onChange: (values: string[]) => void;
}

export function TagInput({ label, values, suggestions, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingIndex]);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(values.filter((v) => v !== tag));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(values[index]);
    setShowSuggestions(false);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const commitEditing = () => {
    if (editingIndex === null) return;

    const trimmed = editingValue.trim();
    if (!trimmed) {
      onChange(values.filter((_, index) => index !== editingIndex));
      cancelEditing();
      return;
    }

    const duplicateIndex = values.findIndex(
      (value, index) => value === trimmed && index !== editingIndex
    );
    if (duplicateIndex !== -1) {
      cancelEditing();
      return;
    }

    const nextValues = values.map((value, index) =>
      index === editingIndex ? trimmed : value
    );
    if (nextValues[editingIndex] !== values[editingIndex]) {
      onChange(nextValues);
    }
    cancelEditing();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const reorderTag = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const nextValues = [...values];
    const [movedTag] = nextValues.splice(fromIndex, 1);
    nextValues.splice(toIndex, 0, movedTag);
    onChange(nextValues);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", values[index]);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      reorderTag(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const endDragging = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && values.length > 0) {
      removeTag(values[values.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-border bg-background min-h-[38px]">
          {values.map((tag, index) => (
            editingIndex === index ? (
              <input
                key={tag}
                ref={editInputRef}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={commitEditing}
                onKeyDown={handleEditKeyDown}
                aria-label={`${tag} 태그 수정 입력`}
                className="min-w-[80px] max-w-[160px] text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <span
                key={tag}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={endDragging}
                onDragEnter={() => setDragOverIndex(index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                aria-label={`${tag} 태그`}
                className={`relative inline-flex cursor-grab items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 transition-all active:cursor-grabbing ${
                  draggedIndex === index ? "opacity-50" : ""
                } ${dragOverIndex === index && draggedIndex !== index ? "ring-2 ring-primary/60 ring-offset-1" : ""}`}
              >
                {dragOverIndex === index && draggedIndex !== index && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground shadow-sm">
                    여기에 놓기
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`${tag} 태그 드래그`}
                  title="드래그해서 순서 변경"
                  className="-ml-1 cursor-grab rounded-full p-0.5 text-primary/50 hover:bg-primary/10 hover:text-primary active:cursor-grabbing"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => startEditing(index)}
                  className="hover:underline"
                  aria-label={`${tag} 태그 수정`}
                >
                  {tag}
                </button>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                  aria-label={`${tag} 태그 삭제`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={values.length === 0 ? "입력 또는 선택..." : ""}
            className="flex-1 min-w-[80px] text-sm bg-transparent outline-none"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-36 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {filtered.slice(0, 10).map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
