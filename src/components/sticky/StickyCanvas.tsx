"use client";

import { useMemo, useState, type RefObject } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
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
  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  // Active note during drag
  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [notes, activeId]
  );

  return (
    // Sticky notes canvas
    <div className="relative flex-1 rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0">
        <DndContext
          sensors={sensors}
          modifiers={[restrictToParentElement]}
          onDragStart={({ active }) => {
            setActiveId(String(active.id));
          }}
          onDragCancel={() => {
            setActiveId(null);
          }}
          onDragEnd={({ active, delta }) => {
            const note = notes.find((item) => item.id === active.id);
            if (!note) return;
            const bounds = containerRef.current?.getBoundingClientRect();
            if (!bounds) {
              setActiveId(null);
              return;
            }
            const nextX = clamp(note.x + delta.x, 0, Math.max(0, bounds.width - NOTE_WIDTH));
            const nextY = clamp(note.y + delta.y, 0, Math.max(0, bounds.height - NOTE_HEIGHT));
            onUpdateNote(note.id, { x: nextX, y: nextY });
            setActiveId(null);
          }}
        >
          {notes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              colors={colors}
              onChange={onUpdateNote}
              onDelete={onDeleteNote}
              hidden={note.id === activeId}
            />
          ))}
          {/* Drag preview */}
          <DragOverlay dropAnimation={null}>
            {activeNote ? (
              <div
                className="rounded-xl border border-base-300 shadow-xl cursor-grabbing"
                style={{
                  width: NOTE_WIDTH,
                  height: NOTE_HEIGHT,
                  backgroundColor: activeNote.color,
                  transform: "rotate(1deg)",
                }}
              >
                <div className="h-[40px] border-b border-black/5" />
                <div className="p-3 text-sm text-base-content/80 whitespace-pre-wrap break-words overflow-hidden max-h-[120px]">
                  {activeNote.text || " "}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
