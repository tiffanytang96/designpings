"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { TrashIcon } from "@heroicons/react/24/outline";
import { GripVertical } from "lucide-react";
import type { StickyNote } from "@/stores/stickyStore";

interface StickyNoteCardProps {
  note: StickyNote;
  onChange: (id: string, patch: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  colors: string[];
  hidden?: boolean;
}

const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 160;

export default function StickyNoteCard({
  note,
  onChange,
  onDelete,
  colors,
  hidden = false,
}: StickyNoteCardProps) {
  // Drag behavior
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  });

  // Color menu state
  const [showColors, setShowColors] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  // Runtime drag transform
  const style = useMemo(() => {
    const translate = transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined;
    return {
      transform: translate,
    } as React.CSSProperties;
  }, [transform]);

  // Close color menu when clicking outside the picker
  useEffect(() => {
    if (!showColors) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (colorPickerRef.current?.contains(target)) return;
      setShowColors(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showColors]);

  return (
    // Note shell
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
        className={`h-full w-full rounded-xl border border-base-300 shadow-xs overflow-visible ${
          hidden ? "opacity-0 pointer-events-none" : ""
        }`}
        style={{ backgroundColor: note.color }}
        animate={{
          boxShadow: isDragging
            ? "0 14px 28px rgba(0, 0, 0, 0.08)"
            : "0 4px 10px rgba(0, 0, 0, 0.08)",
          scale: isDragging ? 1.02 : 1,
          rotate: isDragging ? 1.5 : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Note header actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
          <button
            type="button"
            className={`btn btn-ghost btn-xs btn-square rounded-md text-base-content/60 hover:text-base-content cursor-grab active:cursor-grabbing ${
              isDragging ? "text-base-content" : ""
            }`}
            {...listeners}
            {...attributes}
            aria-label="Drag note"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            <div className="relative" ref={colorPickerRef}>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square rounded-md"
                onClick={() => setShowColors((prev) => !prev)}
                aria-label="Change color"
              >
                <span
                  className="h-3.5 w-3.5 rounded-xs border border-black/10"
                  style={{ backgroundColor: note.color }}
                />
              </button>
              {/* Color options */}
              {showColors && (
                <div className="absolute right-0 mt-2 flex gap-1 rounded-lg border border-base-300 bg-base-100 p-1 shadow-md z-20">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-4 w-4 rounded-xs border border-black/10"
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
        </div>
        {/* Note body */}
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
