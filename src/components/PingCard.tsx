"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import {
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useBoardStore } from "@/stores/boardStore";

interface Ping {
  id: string;
  title: string;
  column: "Inbox" | "In Progress" | "Done";
  tagIds?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  description?: string;
  checklist?: { id: string; text: string; done: boolean }[];
}

interface PingCardProps {
  ping: Ping;
  onEdit: (ping: Ping) => void;
  onDelete: (id: string) => void;
}

export default function PingCard({ ping, onEdit, onDelete }: PingCardProps) {
  // Store selectors
  const tagsById = useBoardStore((state) => state.tags);

  // Derived data
  const tags = useMemo(
    () => (ping.tagIds || []).map((id) => tagsById[id]).filter(Boolean),
    [ping.tagIds, tagsById]
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(tags.length);
  const [tagsContainerWidth, setTagsContainerWidth] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const tagsMeasureRef = useRef<HTMLDivElement>(null);

  // Visual styles
  const priorityBadgeColors = {
    low: "bg-green-500/10 text-green-700 font-medium border-green-400/60 rounded-md",
    medium: "bg-amber-500/10 text-amber-700 font-medium border-amber-400/60 rounded-md",
    high: "bg-rose-500/10 text-rose-700 font-medium border-rose-400/60 rounded-md",
    urgent: "bg-purple-500/10 text-purple-700 font-medium border-purple-400/60 rounded-md",
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const checklistTotal = ping.checklist ? ping.checklist.length : 0;
  const checklistDone = ping.checklist
    ? ping.checklist.filter((item) => item.done).length
    : 0;

  // Check if title is truncated
  useEffect(() => {
    if (titleRef.current) {
      setIsTruncated(titleRef.current.scrollHeight > titleRef.current.clientHeight);
    }
  }, [ping.title]);

  // Compute how many tags fit on a single row and reserve space for the overflow pill.
  useLayoutEffect(() => {
    const commitVisibleTagCount = (nextCount: number) => {
      requestAnimationFrame(() => {
        setVisibleTagCount(nextCount);
      });
    };

    if (!tagsContainerRef.current || !tagsMeasureRef.current || tags.length === 0) {
      commitVisibleTagCount(tags.length);
      return;
    }

    const container = tagsContainerRef.current;
    const measure = tagsMeasureRef.current;
    const containerWidth = tagsContainerWidth || container.clientWidth;
    if (containerWidth === 0) return;

    const computed = window.getComputedStyle(container);
    const gapValue = parseFloat(computed.columnGap || computed.gap || "0");
    const gap = Number.isFinite(gapValue) ? gapValue : 0;

    const tagEls = Array.from(measure.querySelectorAll<HTMLElement>("[data-measure-tag]"));
    const tagWidths = tagEls.map((el) => el.getBoundingClientRect().width);
    const overflowEl = measure.querySelector<HTMLElement>("[data-measure-overflow]");
    const overflowWidth = overflowEl ? overflowEl.getBoundingClientRect().width : 0;

    let used = 0;
    let countAll = 0;
    for (let i = 0; i < tagWidths.length; i += 1) {
      const add = countAll === 0 ? tagWidths[i] : tagWidths[i] + gap;
      if (used + add > containerWidth) break;
      used += add;
      countAll += 1;
    }

    if (countAll >= tags.length) {
      commitVisibleTagCount(tags.length);
      return;
    }

    used = 0;
    let countWithOverflow = 0;
    for (let i = 0; i < tagWidths.length; i += 1) {
      const add = countWithOverflow === 0 ? tagWidths[i] : tagWidths[i] + gap;
      const needsOverflow = tags.length - (countWithOverflow + 1) > 0;
      const overflowSpace = needsOverflow ? overflowWidth + gap : 0;
      if (used + add + overflowSpace > containerWidth) break;
      used += add;
      countWithOverflow += 1;
    }

    commitVisibleTagCount(Math.max(0, Math.min(countWithOverflow, tags.length)));
  }, [tags, tagsContainerWidth]);

  // Keep tag fitting correct on resize.
  useEffect(() => {
    if (!tagsContainerRef.current) return;
    const container = tagsContainerRef.current;
    const updateWidth = () => setTagsContainerWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Card drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer!.effectAllowed = "move";
    e.dataTransfer!.dropEffect = "move";
    e.dataTransfer!.setData("application/json", JSON.stringify({ id: ping.id }));
    e.dataTransfer!.setData("text/plain", ping.id);
    document.body.classList.add("dragging");
    document.documentElement.classList.add("dragging");
    window.dispatchEvent(new CustomEvent("ping-drag-start", { detail: { id: ping.id } }));
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      window.dispatchEvent(
        new CustomEvent("ping-drag-rect", {
          detail: {
            id: ping.id,
            rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
          },
        })
      );
      const clone = cardRef.current.cloneNode(true) as HTMLDivElement;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.boxShadow = "0 18px 40px -8px rgba(0, 0, 0, 0.25)";
      clone.style.transform = "rotate(-1deg)";
      clone.style.opacity = "0.98";
      clone.style.pointerEvents = "none";
      clone.style.position = "fixed";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.zIndex = "9999";
      clone.style.transform = "translate(-9999px, -9999px)";
      document.body.appendChild(clone);
      dragGhostRef.current = clone;

      const ghostCanvas = document.createElement("canvas");
      ghostCanvas.width = 1;
      ghostCanvas.height = 1;
      e.dataTransfer!.setDragImage(ghostCanvas, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.classList.remove("dragging");
    document.documentElement.classList.remove("dragging");
    dragOffsetRef.current = null;
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleDragOver = (event: DragEvent) => {
      if (!dragGhostRef.current) return;
      const offset = dragOffsetRef.current ?? { x: 12, y: 12 };
      const x = event.clientX - offset.x;
      const y = event.clientY - offset.y;
      dragGhostRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    const forceCursor = () => {
      document.body.style.cursor = "grabbing";
    };
    const clearGhost = () => {
      document.body.style.cursor = "";
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }
      setIsDragging(false);
      document.body.classList.remove("dragging");
      document.documentElement.classList.remove("dragging");
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragstart", forceCursor);
    window.addEventListener("drop", clearGhost);
    window.addEventListener("dragend", clearGhost);
    window.addEventListener("ping-drag-end", clearGhost as EventListener);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragstart", forceCursor);
      window.removeEventListener("drop", clearGhost);
      window.removeEventListener("dragend", clearGhost);
      window.removeEventListener("ping-drag-end", clearGhost as EventListener);
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  return (
    // Card layout
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        ref={cardRef}
        data-ping-id={ping.id}
        className="card bg-base-100 shadow-sm cursor-grab active:cursor-grabbing flex flex-row overflow-visible min-h-[140px]"
        onClick={() => onEdit(ping)}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.1)"
        }}
        animate={isDragging ? {
          scale: 1.05,
          opacity: 0.8,
          boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.25), 0 10px 20px -2px rgba(0, 0, 0, 0.15)"
        } : {}}
        transition={{ duration: 0.2 }}
      >
        {/* Priority indicator */}
        {ping.priority && (
          <div
            className={`w-1.5 my-4 ml-3 rounded-lg flex-shrink-0 ${
              ping.priority === "low"
                ? "bg-green-600/70"
                : ping.priority === "medium"
                ? "bg-amber-500/70"
                : ping.priority === "high"
                ? "bg-rose-600/70"
                : "bg-purple-600/70"
            }`}
          />
        )}
        {!ping.priority && <div className="w-1.5 my-4 ml-3 rounded-lg flex-shrink-0 bg-base-300" />}

      <div className="card-body p-4 gap-3 flex-1">
        {/* Header: Title + Delete */}
        <div className="flex items-start justify-between gap-2">
          <div className={`${isTruncated ? "tooltip tooltip-top" : ""} w-full`} data-tip={isTruncated ? ping.title : ""}>
            <h3 
              ref={titleRef}
              className="text-base font-semibold line-clamp-2 text-base-content min-h-12 w-full overflow-hidden"
            >
              {ping.title}
            </h3>
          </div>

          {/* Delete button */}
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error hover:bg-base-200/60 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            aria-label="Delete ping"
          >
            <TrashIcon className="w-4 h-4" />
          </button>

          {/* Delete confirmation modal */}
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title={ping.title}
            onConfirm={() => {
              onDelete(ping.id);
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>

        {/* Tags */}
        {tags.length > 0 ? (
          <>
            <div ref={tagsContainerRef} className="flex flex-wrap gap-1.5 min-h-[24px]">
              {(visibleTagCount > 0 ? tags.slice(0, visibleTagCount) : []).map((tag) => (
                <span key={tag.id} className="badge badge-sm bg-base-200 text-base-content border-none">
                  {tag.label}
                </span>
              ))}

              {visibleTagCount < tags.length && (
                <span
                  className="badge badge-sm bg-base-200 text-base-content/70 border-none tooltip tooltip-top"
                  data-tip={tags.slice(visibleTagCount).map((t) => t.label).join(", ")}
                >
                  +{tags.length - visibleTagCount}
                </span>
              )}
            </div>

            {/* Hidden measuring row for single-line tag fitting */}
            <div
              ref={tagsMeasureRef}
              className="flex flex-wrap gap-1.5 absolute -left-[9999px] top-0 opacity-0 pointer-events-none"
              aria-hidden="true"
            >
              {tags.map((tag) => (
                <span
                  key={`measure-${tag.id}`}
                  data-measure-tag
                  className="badge badge-sm bg-base-200 text-base-content border-none"
                >
                  {tag.label}
                </span>
              ))}
              <span
                data-measure-overflow
                className="badge badge-sm bg-base-200 text-base-content/70 border-none"
              >
                +{tags.length}
              </span>
            </div>
          </>
        ) : (
          <div className="min-h-[24px]" aria-hidden="true" />
        )}

        {/* Footer: Priority + Due Date + Checklist */}
        <div className="flex items-center justify-between gap-2 pt-1 min-h-6">
          <div className="flex items-center gap-2">
            {ping.priority && (
              <span className={`badge badge-sm px-1.5 ${priorityBadgeColors[ping.priority]}`}>
                {ping.priority.charAt(0).toUpperCase() + ping.priority.slice(1)}
              </span>
            )}
            {ping.dueDate && (
              <span className="text-xs text-base-content/60 inline-flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {formatDueDate(ping.dueDate)}
              </span>
            )}
            {ping.checklist && ping.checklist.length > 0 && (
              <span
                className={`text-xs inline-flex items-center gap-1 ${
                  checklistDone === checklistTotal ? "text-green-600" : "text-base-content/60"
                }`}
              >
                <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}

export type { Ping, PingCardProps };
