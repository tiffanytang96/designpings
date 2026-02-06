"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ping {
  id: string;
  title: string;
  column: "Inbox" | "In Progress" | "Done";
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
}

interface AddPingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ping: Omit<Ping, "id" | "createdAt">) => void;
  editingPing?: Ping | null;
}

export default function AddPingModal({
  isOpen,
  onClose,
  onSave,
  editingPing,
}: AddPingModalProps) {
  const [title, setTitle] = useState("");
  const [column, setColumn] = useState<Ping["column"]>("Inbox");
  const [priority, setPriority] = useState<Ping["priority"] | "">("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingPing) {
      setTitle(editingPing.title);
      setColumn(editingPing.column);
      setPriority(editingPing.priority || "");
      setTags(editingPing.tags || []);
      setDueDate(editingPing.dueDate ? editingPing.dueDate.split("T")[0] : "");
    } else {
      // Reset form for new ping
      setTitle("");
      setColumn("Inbox");
      setPriority("");
      setTags([]);
      setDueDate("");
    }
  }, [editingPing, isOpen]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    const pingData = {
      title: title.trim(),
      column,
      tags: tags.length > 0 ? tags : undefined,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
    };

    onSave(pingData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setColumn("Inbox");
    setPriority("");
    setTags([]);
    setTagInput("");
    setDueDate("");
    onClose();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    handleClose();
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <div className="modal modal-open !transition-none !animate-none">
          <motion.div
            className="modal-backdrop !transition-none !animate-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={handleBackdropMouseDown}
          />
          <motion.div
            className="modal-box max-w-md !transition-none !animate-none"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4 text-base-content">
              {editingPing ? "Edit Ping" : "Add New Ping"}
            </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <div className="form-control">
            <label className="label">
              <span className="text-sm font-semibold text-base-content">
                Title <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Enter ping title..."
              className="input input-bordered w-full placeholder:text-base-content/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Column selector */}
          <div className="form-control">
            <label className="label">
              <span className="text-sm font-semibold text-base-content">Column</span>
            </label>
            <div className="dropdown dropdown-bottom w-full">
              <button
                type="button"
                tabIndex={0}
                className="input input-bordered w-full flex justify-between items-center text-base-content cursor-pointer"
              >
                <span>{column}</span>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-box w-full mt-2 z-10"
              >
                <li>
                  <button
                    type="button"
                    onClick={() => setColumn("Inbox")}
                    className="text-base-content"
                  >
                    Inbox
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setColumn("In Progress")}
                    className="text-base-content"
                  >
                    In Progress
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setColumn("Done")}
                    className="text-base-content"
                  >
                    Done
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Priority selector */}
          <div className="form-control">
            <label className="label">
              <span className="text-sm font-semibold text-base-content">Priority</span>
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  className="radio radio-sm radio-primary"
                  checked={priority === ""}
                  onChange={() => setPriority("")}
                />
                <span className="text-sm text-base-content">None</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  className="radio radio-sm radio-primary"
                  checked={priority === "low"}
                  onChange={() => setPriority("low")}
                />
                <span className="text-sm text-base-content">Low</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  className="radio radio-sm radio-primary"
                  checked={priority === "medium"}
                  onChange={() => setPriority("medium")}
                />
                <span className="text-sm text-base-content">Medium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  className="radio radio-sm radio-primary"
                  checked={priority === "high"}
                  onChange={() => setPriority("high")}
                />
                <span className="text-sm text-base-content">High</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  className="radio radio-sm radio-primary"
                  checked={priority === "urgent"}
                  onChange={() => setPriority("urgent")}
                />
                <span className="text-sm text-base-content">Urgent</span>
              </label>
            </div>
          </div>

          {/* Due date */}
          <div className="form-control">
            <label className="label">
              <span className="text-sm font-semibold text-base-content">Due Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Tags input */}
          <div className="form-control">
            <label className="label">
              <span className="text-sm font-semibold text-base-content">Tags</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
                className="input input-bordered flex-1 placeholder:text-base-content/50"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="btn btn-outline text-base-content"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>

            {/* Display tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <span key={index} className="badge badge-neutral gap-1">
                    {tag}
                    <button
                      type="button"
                      className="text-error hover:text-error-focus"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost text-base-content"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim()}
            >
              {editingPing ? "Save Changes" : "Add Ping"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}

export type { AddPingModalProps };
