"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Bars3Icon, TrashIcon } from "@heroicons/react/24/outline";
import type { StickyNote } from "@/stores/stickyStore";

interface StickyNoteCardProps {
  note: StickyNote;
  onChange: (id: string, patch: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  colors: string[];
}

const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 160;

export default function StickyNoteCard({
  note,
  onChange,
  onDelete,
  colors,
}: StickyNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  });
  const [showColors, setShowColors] = useState(false);

  const style = useMemo(() => {
    const translate = transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined;
    return {
      transform: translate,
    } as React.CSSProperties;
  }, [transform]);

  return (
    <motion.div
      ref={setNodeRef}
      className="absolute"
      style={{ left: note.x, top: note.y, width: NOTE_WIDTH, height: NOTE_HEIGHT, ...style }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.div
        className="h-full w-full rounded-xl border border-base-300 shadow-xs overflow-visible"
        style={{ backgroundColor: note.color }}
        animate={{
          boxShadow: isDragging
            ? "0 14px 28px rgba(0, 0, 0, 0.18)"
            : "0 4px 10px rgba(0, 0, 0, 0.08)",
          scale: isDragging ? 1.02 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square rounded-md text-base-content/60 hover:text-base-content"
            {...listeners}
            {...attributes}
            aria-label="Drag note"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              className="h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: note.color }}
              onClick={() => setShowColors((prev) => !prev)}
              aria-label="Change color"
            />
            {showColors && (
              <div className="absolute right-0 mt-2 flex gap-1 rounded-lg border border-base-300 bg-base-100 p-1 shadow-md z-20">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(note.id, { color });
                      setShowColors(false);
                    }}
                    aria-label="Select color"
                  />
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square rounded-md text-base-content/60 hover:text-error"
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        <textarea
          className="h-[calc(100%-40px)] w-full resize-none bg-transparent p-3 text-sm text-base-content/80 outline-none"
          placeholder="Write a note..."
          value={note.text}
          onChange={(event) => onChange(note.id, { text: event.target.value })}
        />
      </motion.div>
    </motion.div>
  );
}

export { NOTE_WIDTH, NOTE_HEIGHT };
