"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "@/stores/boardStore";
import { TrashIcon } from "@heroicons/react/24/outline";
import { GripVertical } from "lucide-react";

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TagEditModal({ isOpen, onClose }: TagEditModalProps) {
  // Store selectors
  const tagOrder = useBoardStore((state) => state.tagOrder);
  const tagsById = useBoardStore((state) => state.tags);
  const setTagOrder = useBoardStore((state) => state.setTagOrder);
  const createOrReuseTag = useBoardStore((state) => state.createOrReuseTag);
  const tags = useMemo(
    () => tagOrder.map((id) => tagsById[id]).filter(Boolean),
    [tagOrder, tagsById]
  );
  const renameTag = useBoardStore((state) => state.renameTag);
  const deleteTag = useBoardStore((state) => state.deleteTag);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const dropHandledRef = useRef(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTagError, setNewTagError] = useState<string | undefined>();
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  // Tag ordering helper
  const moveTagWithPosition = (
    fromId: string,
    toId: string,
    position: "before" | "after"
  ) => {
    if (fromId === toId) return;
    const order = [...tagOrder];
    const fromIndex = order.indexOf(fromId);
    const toIndex = order.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return;
    order.splice(fromIndex, 1);
    const insertIndex = position === "after" ? toIndex + 1 : toIndex;
    order.splice(insertIndex, 0, fromId);
    setTagOrder(order);
  };

  const handleRename = (id: string, value: string) => {
    const result = renameTag(id, value);
    setErrors((prev) => ({ ...prev, [id]: result.error }));
  };

  const handleAddNewTag = () => {
    const result = createOrReuseTag(newTagInput);
    if (result.error) {
      setNewTagError(result.error);
      return;
    }
    setNewTagInput("");
    setNewTagError(undefined);
    setShowNewTagInput(false);
  };

  return (
    // Tag editor modal
    <AnimatePresence>
      {isOpen && (
        <div className="modal modal-open">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target !== e.currentTarget) return;
              onClose();
            }}
          />
          <motion.div
            className="modal-box max-w-2xl !transition-none !animate-none h-[70vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-base-content">Edit Tags</h3>
                <p className="text-sm text-base-content/60 mt-1">
                  Rename or delete tags. Changes update all pings.
                </p>
              </div>
              {!showNewTagInput && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowNewTagInput(true);
                    setNewTagError(undefined);
                  }}
                >
                  Add Tag
                </button>
              )}
            </div>

            {showNewTagInput && (
              <div className="mt-3 rounded-lg border border-dashed border-base-300 bg-base-200/40 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add new tag..."
                    className="input input-bordered w-full"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNewTag}
                    disabled={!newTagInput.trim()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-base-content"
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTagInput("");
                      setNewTagError(undefined);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {newTagError && (
                  <div className="mt-2 text-xs text-error">{newTagError}</div>
                )}
              </div>
            )}

            <div className="mt-4 flex-1 overflow-y-auto pr-1 rounded-lg bg-base-200/50 p-2">
              {tags.length === 0 ? (
                <div className="text-sm text-base-content/50 py-10 text-center">
                  No tags yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="space-y-2"
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggingId) return;
                        if (draggingId === tag.id) {
                          setDropIndicator(null);
                          return;
                        }
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const position = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
                        setDropIndicator({ id: tag.id, position });
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (!draggingId) return;
                        if (draggingId === tag.id) {
                          setDropIndicator(null);
                          return;
                        }
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const position = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
                        setDropIndicator({ id: tag.id, position });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggingId || draggingId === tag.id) return;
                        const position =
                          dropIndicator?.id === tag.id ? dropIndicator.position : "before";
                        moveTagWithPosition(draggingId, tag.id, position);
                        dropHandledRef.current = true;
                        setDraggingId(null);
                        setDropIndicator(null);
                      }}
                    >
                      {dropIndicator?.id === tag.id && dropIndicator.position === "before" && (
                        <div className="h-12 rounded-lg border border-dashed border-primary/60 bg-primary/5" />
                      )}
                      <div
                        className="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3 cursor-move"
                        draggable
                        onDragStart={() => {
                          setDraggingId(tag.id);
                          setDropIndicator(null);
                          dropHandledRef.current = false;
                        }}
                        onDragEnd={() => {
                          if (
                            !dropHandledRef.current &&
                            draggingId &&
                            dropIndicator &&
                            draggingId !== dropIndicator.id
                          ) {
                            moveTagWithPosition(draggingId, dropIndicator.id, dropIndicator.position);
                          }
                          dropHandledRef.current = false;
                          setDraggingId(null);
                          setDropIndicator(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base-content/50">
                            <GripVertical className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              defaultValue={tag.label}
                              className="input input-bordered w-full"
                              onBlur={(e) => handleRename(tag.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                            />
                            {errors[tag.id] && (
                              <div className="mt-1 text-xs text-error">
                                {errors[tag.id]}
                              </div>
                            )}
                          </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-md btn-square text-error hover:bg-base-200/60 rounded-lg"
                          onClick={() => deleteTag(tag.id)}
                          aria-label={`Delete ${tag.label} tag`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                      {dropIndicator?.id === tag.id && dropIndicator.position === "after" && (
                        <div className="h-12 rounded-lg border border-dashed border-primary/60 bg-primary/5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action pt-4">
              <button type="button" className="btn btn-outline text-base-content" onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
