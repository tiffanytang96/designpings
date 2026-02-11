"use client";

import { useMemo, useRef } from "react";
import { useStickyStore, STICKY_COLORS } from "@/stores/stickyStore";
import StickyCanvas from "./StickyCanvas";
import StickyToolbar from "./StickyToolbar";
import type { StickyNote } from "@/stores/stickyStore";
import { NOTE_HEIGHT, NOTE_WIDTH } from "./StickyNoteCard";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const randomColor = (colors: string[]) =>
  colors[Math.floor(Math.random() * colors.length)];

export default function StickyNotesBoard() {
  const notes = useStickyStore((state) => state.notes);
  const addNote = useStickyStore((state) => state.addNote);
  const updateNote = useStickyStore((state) => state.updateNote);
  const deleteNote = useStickyStore((state) => state.deleteNote);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleAddNote = () => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? 320;
    const height = bounds?.height ?? 420;
    const x = clamp(width / 2 - NOTE_WIDTH / 2, 8, Math.max(8, width - NOTE_WIDTH - 8));
    const y = clamp(height / 2 - NOTE_HEIGHT / 2, 8, Math.max(8, height - NOTE_HEIGHT - 8));
    const newNote: StickyNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: "",
      x,
      y,
      color: randomColor(STICKY_COLORS),
      createdAt: Date.now(),
    };
    addNote(newNote);
  };

  const colors = useMemo(() => STICKY_COLORS, []);

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <StickyToolbar onAddNote={handleAddNote} />
      <StickyCanvas
        notes={notes}
        colors={colors}
        containerRef={containerRef}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      />
    </div>
  );
}
