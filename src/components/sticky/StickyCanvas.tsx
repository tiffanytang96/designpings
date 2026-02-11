"use client";

import type { RefObject } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import type { StickyNote } from "@/stores/stickyStore";
import StickyNoteCard, { NOTE_HEIGHT, NOTE_WIDTH } from "./StickyNoteCard";

interface StickyCanvasProps {
  notes: StickyNote[];
  colors: string[];
  containerRef: RefObject<HTMLDivElement | null>;
  onUpdateNote: (id: string, patch: Partial<StickyNote>) => void;
  onDeleteNote: (id: string) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function StickyCanvas({
  notes,
  colors,
  containerRef,
  onUpdateNote,
  onDeleteNote,
}: StickyCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  return (
    <div className="relative flex-1 rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0">
        <DndContext
          sensors={sensors}
          modifiers={[restrictToParentElement]}
          onDragEnd={({ active, delta }) => {
            const note = notes.find((item) => item.id === active.id);
            if (!note) return;
            const bounds = containerRef.current?.getBoundingClientRect();
            if (!bounds) return;
            const nextX = clamp(note.x + delta.x, 0, Math.max(0, bounds.width - NOTE_WIDTH));
            const nextY = clamp(note.y + delta.y, 0, Math.max(0, bounds.height - NOTE_HEIGHT));
            onUpdateNote(note.id, { x: nextX, y: nextY });
          }}
        >
          {notes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              colors={colors}
              onChange={onUpdateNote}
              onDelete={onDeleteNote}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
