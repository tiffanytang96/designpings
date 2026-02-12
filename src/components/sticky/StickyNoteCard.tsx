"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { MicrophoneIcon, TrashIcon } from "@heroicons/react/24/outline";
import { GripVertical } from "lucide-react";
import type { StickyNote } from "@/stores/stickyStore";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

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
  const latestTextRef = useRef(note.text);

  useEffect(() => {
    latestTextRef.current = note.text;
  }, [note.text]);

  const appendTranscript = useCallback(
    (spokenText: string) => {
      const trimmed = spokenText.trim();
      if (!trimmed) return;
      const current = latestTextRef.current;
      const separator = current.length > 0 && !/[\s\n]$/.test(current) ? " " : "";
      onChange(note.id, { text: `${current}${separator}${trimmed}` });
    },
    [note.id, onChange]
  );

  const {
    isSupported,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
    clearError,
  } = useSpeechRecognition({ onTranscript: appendTranscript });

  const micTooltip = !isSupported
    ? "Voice input not supported in this browser"
    : isListening
    ? "Listening..."
    : "Click to dictate";

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

  const handleMicClick = () => {
    clearError();
    if (!isSupported) return;
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

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
        className={`relative h-full w-full rounded-xl border border-base-300 shadow-xs overflow-visible ${
          isListening ? "ring-2 ring-sky-400/70 ring-offset-1 ring-offset-transparent" : ""
        } ${
          hidden ? "opacity-0 pointer-events-none" : ""
        }`}
        style={{ backgroundColor: note.color }}
        animate={{
          boxShadow: isDragging
            ? "0 14px 28px rgba(0, 0, 0, 0.08)"
            : isListening
            ? "0 0 0 2px rgba(56, 189, 248, 0.20), 0 8px 16px rgba(0, 0, 0, 0.10)"
            : "0 4px 10px rgba(0, 0, 0, 0.08)",
          scale: isDragging ? 1.02 : 1,
          rotate: isDragging ? 1.5 : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        {isListening ? (
          <motion.div
            className="pointer-events-none absolute -inset-1 rounded-2xl border border-sky-400/70"
            initial={false}
            animate={{ opacity: [0.45, 0.9, 0.45], scale: [1, 1.02, 1] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        ) : null}

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
            <div className="tooltip tooltip-bottom" data-tip={micTooltip}>
              <button
                type="button"
                className={`btn btn-ghost btn-xs btn-square rounded-md ${
                  isListening
                    ? "text-sky-600 bg-sky-500/10 border border-sky-400/50"
                    : "text-base-content/60 hover:text-base-content"
                }`}
                onClick={handleMicClick}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={!isSupported}
                aria-label={isListening ? "Stop dictation" : "Start dictation"}
              >
                {isListening ? (
                  <span className="inline-flex items-end gap-0.5" aria-hidden="true">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="w-0.5 rounded-full bg-sky-600/80"
                        animate={{ height: [4, 9, 4] }}
                        transition={{
                          duration: 0.7,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: index * 0.1,
                        }}
                        style={{ height: 4 }}
                      />
                    ))}
                  </span>
                ) : (
                  <MicrophoneIcon className="h-4 w-4" />
                )}
              </button>
            </div>
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
        <div className="h-[calc(100%-40px)] w-full flex flex-col">
          {voiceError ? (
            <div className="px-3 pt-2 text-[11px] leading-4 text-error">{voiceError}</div>
          ) : null}
          <textarea
            className="flex-1 w-full resize-none bg-transparent p-3 text-sm text-base-content/80 outline-none"
            placeholder="Write a note..."
            value={note.text}
            onChange={(event) => {
              clearError();
              onChange(note.id, { text: event.target.value });
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export { NOTE_WIDTH, NOTE_HEIGHT };
