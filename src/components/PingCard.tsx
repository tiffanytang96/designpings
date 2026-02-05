"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Ping {
  id: string;
  title: string;
  column: "Inbox" | "In Progress" | "Done";
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
}

interface PingCardProps {
  ping: Ping;
  onEdit: (ping: Ping) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newColumn: Ping["column"]) => void;
}

export default function PingCard({ ping, onEdit, onDelete, onMove }: PingCardProps) {
  const tags = ping.tags ?? [];
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

  const priorityColors = {
    low: "border-l-green-500",
    medium: "border-l-amber-400",
    high: "border-l-rose-500",
    urgent: "border-l-purple-500",
  };

  const priorityBadgeColors = {
    low: "bg-green-500/10 text-green-700 font-medium border-green-400/60 rounded-md",
    medium: "bg-amber-500/10 text-amber-700 font-medium border-amber-400/60 rounded-md",
    high: "bg-rose-500/10 text-rose-700 font-medium border-rose-400/60 rounded-md",
    urgent: "bg-purple-500/10 text-purple-700 font-medium border-purple-400/60 rounded-md",
  };

  const columnOptions: Ping["column"][] = ["Inbox", "In Progress", "Done"];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Check if title is truncated
  useEffect(() => {
    if (titleRef.current) {
      setIsTruncated(titleRef.current.scrollHeight > titleRef.current.clientHeight);
    }
  }, [ping.title]);

  // Compute how many tags fit on a single row and reserve space for the overflow pill.
  useLayoutEffect(() => {
    if (!tagsContainerRef.current || !tagsMeasureRef.current || tags.length === 0) {
      setVisibleTagCount(tags.length);
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
      setVisibleTagCount(tags.length);
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

    setVisibleTagCount(Math.max(0, Math.min(countWithOverflow, tags.length)));
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer!.effectAllowed = "move";
    e.dataTransfer!.dropEffect = "move";
    e.dataTransfer!.setData("application/json", JSON.stringify({ id: ping.id }));
    document.body.classList.add("dragging");
    document.documentElement.classList.add("dragging");
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
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
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        ref={cardRef}
        className="card bg-base-100 shadow-sm cursor-grab active:cursor-grabbing flex flex-row"
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
        {!ping.priority && <div className="w-1 rounded-r-md flex-shrink-0 bg-base-300" />}

      <div className="card-body p-4 gap-3 flex-1">
        {/* Header: Drag handle + Priority + Delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Priority badge */}
            {ping.priority && (
              <span className={`badge badge-sm px-1.5 ${priorityBadgeColors[ping.priority]}`}>
                {ping.priority.charAt(0).toUpperCase() + ping.priority.slice(1)}
              </span>
            )}
          </div>

          {/* Delete button */}
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            aria-label="Delete ping"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-4 h-4"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
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

        {/* Title */}
        <div className={`${isTruncated ? "tooltip tooltip-top" : ""} w-full`} data-tip={isTruncated ? ping.title : ""}>
          <h3 
            ref={titleRef}
            className="text-base font-semibold line-clamp-2 text-base-content min-h-12 w-full overflow-hidden"
          >
            {ping.title}
          </h3>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <div ref={tagsContainerRef} className="flex flex-wrap gap-1.5">
              {(visibleTagCount > 0 ? tags.slice(0, visibleTagCount) : []).map((tag, index) => (
                <span key={index} className="badge badge-sm bg-base-200 text-base-content border-none">
                  {tag}
                </span>
              ))}

              {visibleTagCount < tags.length && (
                <span
                  className="badge badge-sm bg-base-200 text-base-content/70 border-none tooltip tooltip-top"
                  data-tip={tags.slice(visibleTagCount).join(", ")}
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
              {tags.map((tag, index) => (
                <span
                  key={`measure-${index}`}
                  data-measure-tag
                  className="badge badge-sm bg-base-300 text-base-content border-none"
                >
                  {tag}
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
        )}

        {/* Footer: Timestamp + Move dropdown */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-base-content/60 inline-flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
            {formatTimestamp(ping.createdAt)}
          </span>
        </div>
      </div>
      </motion.div>
    </div>
  );
}

export type { Ping, PingCardProps };
