"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import PingCard, { Ping } from "./PingCard";

interface ColumnProps {
  columnName: "Inbox" | "In Progress" | "Done";
  pings: Ping[];
  onAddPing: (column: Ping["column"]) => void;
  onEditPing: (ping: Ping) => void;
  onDeletePing: (id: string) => void;
  onMovePing: (id: string, newColumn: Ping["column"]) => void;
  onReorderPing: (
    id: string,
    column: Ping["column"],
    targetId: string,
    position: "before" | "after"
  ) => void;
}

export default function Column({
  columnName,
  pings,
  onAddPing,
  onEditPing,
  onDeletePing,
  onMovePing,
  onReorderPing,
}: ColumnProps) {
  // Drag state
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragRectRef = useRef<{ top: number; right: number; bottom: number; left: number } | null>(
    null
  );
  const effectiveDragId = activeDragId;

  type DropPosition = "before" | "after";

  // Shared helpers
  const resetColumnDragState = () => {
    setIsDraggedOver(false);
    dragCounterRef.current = 0;
    setDropIndicator(null);
  };

  const parseDragId = (dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) return null;
    const raw = dataTransfer.getData("application/json");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      return parsed.id ?? null;
    } catch {
      return null;
    }
  };

  const getDropPosition = (e: React.DragEvent<HTMLDivElement>): DropPosition => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2 ? "after" : "before";
  };

  const isPointerInsideDragRect = (clientX: number, clientY: number) => {
    const dragRect = dragRectRef.current;
    if (!dragRect) return false;
    return (
      clientX >= dragRect.left &&
      clientX <= dragRect.right &&
      clientY >= dragRect.top &&
      clientY <= dragRect.bottom
    );
  };

  const isNearDraggedCardCenter = (draggedId: string, clientY: number) => {
    const draggedEl = document.querySelector<HTMLElement>(`[data-ping-id="${draggedId}"]`);
    if (!draggedEl) return false;
    const draggedRect = draggedEl.getBoundingClientRect();
    const dragCenterY = draggedRect.top + draggedRect.height / 2;
    const deadZone = draggedRect.height * 0.35;
    return Math.abs(clientY - dragCenterY) < deadZone;
  };

  const shouldSuppressIndicator = (draggedId: string, overId: string, clientX: number, clientY: number) => {
    if (draggedId === overId) return true;
    if (isPointerInsideDragRect(clientX, clientY)) return true;
    if (isNearDraggedCardCenter(draggedId, clientY)) return true;
    return false;
  };

  // Global drag event listeners
  useEffect(() => {
    const handleDragStart = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      const id = custom.detail?.id ?? null;
      setActiveDragId(id);
    };
    const handleDragRect = (
      event: Event
    ) => {
      const custom = event as CustomEvent<{
        id?: string;
        rect?: { top: number; right: number; bottom: number; left: number };
      }>;
      if (custom.detail?.rect) {
        dragRectRef.current = custom.detail.rect;
      }
    };
    const handleDragEnd = () => {
      setActiveDragId(null);
      dragRectRef.current = null;
      setDropIndicator(null);
      dragCounterRef.current = 0;
      setIsDraggedOver(false);
    };
    window.addEventListener("ping-drag-start", handleDragStart as EventListener);
    window.addEventListener("ping-drag-rect", handleDragRect as EventListener);
    window.addEventListener("ping-drag-end", handleDragEnd as EventListener);
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.removeEventListener("ping-drag-start", handleDragStart as EventListener);
      window.removeEventListener("ping-drag-rect", handleDragRect as EventListener);
      window.removeEventListener("ping-drag-end", handleDragEnd as EventListener);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  // Column-level drag handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggedOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDraggedOver(false);
      setDropIndicator(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    resetColumnDragState();

    try {
      const draggedId = parseDragId(e.dataTransfer);
      if (!draggedId) return;
      if (dropIndicator && effectiveDragId === draggedId && dropIndicator.id !== draggedId) {
        onReorderPing(draggedId, columnName, dropIndicator.id, dropIndicator.position);
      } else {
        onMovePing(draggedId, columnName);
      }
      window.dispatchEvent(new Event("ping-drag-end"));
    } catch (err) {
      console.error("Failed to parse drag data:", err);
    }
  };

  // Item-level drag handlers
  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    const draggedId = parseDragId(e.dataTransfer) ?? effectiveDragId;
    if (!draggedId || draggedId === overId) {
      setDropIndicator(null);
      return;
    }
    if (shouldSuppressIndicator(draggedId, overId, e.clientX, e.clientY)) {
      setDropIndicator(null);
      return;
    }
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const distanceFromCenter = Math.abs(e.clientY - (rect.top + rect.height / 2));
    if (distanceFromCenter < 16) {
      setDropIndicator(null);
      return;
    }
    const next = { id: overId, position: getDropPosition(e) } as const;
    setDropIndicator((prev) => {
      if (prev?.id === next.id && prev.position === next.position) return prev;
      return next;
    });
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = parseDragId(e.dataTransfer);
    if (!draggedId || draggedId === overId) return;
    onReorderPing(draggedId, columnName, overId, getDropPosition(e));
    resetColumnDragState();
    window.dispatchEvent(new Event("ping-drag-end"));
  };

  const handlePlaceholderDrop = (
    e: React.DragEvent<HTMLDivElement>,
    overId: string,
    position: DropPosition
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = parseDragId(e.dataTransfer);
    if (!draggedId || draggedId === overId) return;
    onReorderPing(draggedId, columnName, overId, position);
    resetColumnDragState();
    window.dispatchEvent(new Event("ping-drag-end"));
  };

  return (
    // Column layout
    <motion.div
      className={`flex flex-col h-full rounded-xl p-4 w-[360px] flex-shrink-0 transition-all duration-200 ${
        isDraggedOver 
          ? "bg-primary/20 ring-3 ring-primary ring-opacity-100" 
          : "bg-base-200"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      layout
      animate={{
        scale: isDraggedOver ? 1.02 : 1,
        boxShadow: isDraggedOver 
          ? "0 0 30px rgba(var(--color-primary), 0.5), inset 0 0 20px rgba(var(--color-primary), 0.15)" 
          : "none",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-base-content">{columnName}</h2>
          <span className="badge badge-sm badge-neutral">{pings.length}</span>
        </div>
        <button
          className="btn btn-ghost btn-sm text-base-content rounded-md !bg-base-200 hover:!bg-base-300 px-2 min-w-0"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddPing(columnName);
          }}
          aria-label={`Add ping to ${columnName}`}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 -mx-4 px-4 -my-4 py-4 [overflow-clip-margin:20px]">
        <AnimatePresence mode="popLayout">
          {pings.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-32 text-base-content/40 text-sm"
            >
              No pings yet
            </motion.div>
          ) : (
            pings.map((ping) => (
              <motion.div
                key={ping.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {dropIndicator?.id === ping.id &&
                  dropIndicator.position === "before" &&
                  effectiveDragId !== ping.id && (
                  <div
                    className="h-[120px] rounded-xl border border-dashed border-primary/60 bg-primary/5 my-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handlePlaceholderDrop(e, ping.id, "before")}
                  />
                )}
                <div
                  onDragOver={(e) => handleItemDragOver(e, ping.id)}
                  onDragEnter={(e) => handleItemDragOver(e, ping.id)}
                  onDrop={(e) => handleItemDrop(e, ping.id)}
                >
                  <PingCard
                    ping={ping}
                    onEdit={onEditPing}
                    onDelete={onDeletePing}
                  />
                </div>
                {dropIndicator?.id === ping.id &&
                  dropIndicator.position === "after" &&
                  effectiveDragId !== ping.id && (
                  <div
                    className="h-[120px] rounded-xl border border-dashed border-primary/60 bg-primary/5 my-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handlePlaceholderDrop(e, ping.id, "after")}
                  />
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export type { ColumnProps };
