"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChecklistPanel from "./add-ping/ChecklistPanel";
import LeftFormFields from "./add-ping/LeftFormFields";
import { TAG_RULES, useBoardStore } from "@/stores/boardStore";
import type { ChecklistItem, PingColumn, PingPriority, Tag } from "./add-ping/types";

interface Ping {
  id: string;
  title: string;
  column: PingColumn;
  tagIds?: string[];
  priority?: PingPriority;
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  description?: string;
  checklist?: ChecklistItem[];
}

interface AddPingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ping: Omit<Ping, "id" | "createdAt">) => void;
  editingPing?: Ping | null;
  defaultColumn?: Ping["column"];
}

export default function AddPingModal({
  isOpen,
  onClose,
  onSave,
  editingPing,
  defaultColumn = "Inbox",
}: AddPingModalProps) {
  // Store selectors
  const tagsById = useBoardStore((state) => state.tags);
  const tagOrder = useBoardStore((state) => state.tagOrder);
  const createOrReuseTag = useBoardStore((state) => state.createOrReuseTag);

  // Form state
  const [title, setTitle] = useState(() => editingPing?.title ?? "");
  const [column, setColumn] = useState<Ping["column"]>(
    () => editingPing?.column ?? defaultColumn
  );
  const [priority, setPriority] = useState<PingPriority | "">(
    () => editingPing?.priority || "low"
  );
  const [tagInput, setTagInput] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    () => editingPing?.tagIds || []
  );
  const [dueDate, setDueDate] = useState(
    () => editingPing?.dueDate?.split("T")[0] || ""
  );
  const [description, setDescription] = useState(() => editingPing?.description || "");
  const [checklistInput, setChecklistInput] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    () => editingPing?.checklist || []
  );
  const [tagError, setTagError] = useState<string | undefined>();
  const [priorityError, setPriorityError] = useState<string | undefined>();
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Derived tag lists
  const allTags: Tag[] = tagOrder.map((id) => tagsById[id]).filter(Boolean);
  const tagOrderIndex = useMemo(() => {
    const map = new Map<string, number>();
    tagOrder.forEach((id, index) => map.set(id, index));
    return map;
  }, [tagOrder]);
  const sortByTagOrder = (list: Tag[]) =>
    [...list].sort(
      (a, b) =>
        (tagOrderIndex.get(a.id) ?? 0) - (tagOrderIndex.get(b.id) ?? 0)
    );
  const normalizedInput = tagInput.trim().toLowerCase();
  const fuzzyMatch = (query: string, target: string) => {
    let qi = 0;
    for (let i = 0; i < target.length && qi < query.length; i += 1) {
      if (target[i] === query[qi]) qi += 1;
    }
    return qi === query.length;
  };

  const suggestions = normalizedInput
    ? allTags.filter((tag) => {
        const label = tag.label.toLowerCase();
        return (
          !selectedTagIds.includes(tag.id) &&
          (label.includes(normalizedInput) || fuzzyMatch(normalizedInput, label))
        );
      })
    : [];

  const dropdownSuggestions = normalizedInput
    ? sortByTagOrder(suggestions)
    : sortByTagOrder(allTags.filter((tag) => !selectedTagIds.includes(tag.id)));

  // Tag handlers
  const addTagLabel = (label: string) => {
    const trimmed = label.replace(/,+$/, "").trim();
    if (!trimmed) return;
    if (selectedTagIds.length >= TAG_RULES.maxPerPing) {
      setTagError(`Max ${TAG_RULES.maxPerPing} tags per ping.`);
      return;
    }
    const result = createOrReuseTag(trimmed);
    if (result.error) {
      setTagError(result.error);
      return;
    }
    const tagId = result.tag?.id;
    if (!tagId) return;
    if (selectedTagIds.includes(tagId)) {
      setTagError("Tag already added.");
      return;
    }
    setSelectedTagIds([...selectedTagIds, tagId]);
    setTagInput("");
    setTagError(undefined);
    setActiveSuggestionIndex(-1);
  };

  const handleAddTag = () => {
    addTagLabel(tagInput);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
  };

  // Keyboard handlers
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (suggestions[activeSuggestionIndex]) {
        addTagLabel(suggestions[activeSuggestionIndex].label);
        return;
      }
      addTagLabel(tagInput);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        Math.min(prev + 1, Math.max(0, suggestions.length - 1))
      );
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  const handleAddChecklistItem = () => {
    const trimmed = checklistInput.trim();
    if (!trimmed) return;
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      done: false,
    };
    setChecklist([...(checklist || []), newItem]);
    setChecklistInput("");
  };

  const handleChecklistKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddChecklistItem();
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      (checklist || []).map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((checklist || []).filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!priority) {
      setPriorityError("Priority is required.");
      return;
    }

    const pingData = {
      title: title.trim(),
      column,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      priority,
      dueDate: dueDate || undefined,
      description: description.trim() || undefined,
      checklist: checklist && checklist.length > 0 ? checklist : undefined,
    };

    onSave(pingData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setColumn(defaultColumn);
    setPriority("low");
    setTagInput("");
    setSelectedTagIds([]);
    setDueDate("");
    setDescription("");
    setChecklist([]);
    setChecklistInput("");
    setTagError(undefined);
    setPriorityError(undefined);
    setIsTagDropdownOpen(false);
    onClose();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    handleClose();
  };

  const formatCreatedAt = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    // Modal layout
    <AnimatePresence>
      {isOpen && (
        <div className="modal modal-open">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={handleBackdropMouseDown}
          />
          <motion.div
            className="modal-box max-w-3xl h-[85vh] overflow-visible flex flex-col"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4 text-base-content">
              {editingPing ? "Edit Ping" : "Add New Ping"}
            </h3>
            {editingPing && (
              <div className="text-xs text-base-content/60 mb-4">
                Created {formatCreatedAt(editingPing.createdAt)}
              </div>
            )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <LeftFormFields
              title={title}
              description={description}
              column={column}
              priority={priority}
              dueDate={dueDate}
              tagInput={tagInput}
              selectedTags={selectedTagIds.map((id) => tagsById[id]).filter(Boolean)}
              suggestions={dropdownSuggestions}
              activeSuggestionIndex={activeSuggestionIndex}
              tagError={tagError}
              priorityError={priorityError}
              showSuggestions={isTagDropdownOpen}
              onTagFocus={() => setIsTagDropdownOpen(true)}
              onTagBlur={() => {
                window.setTimeout(() => setIsTagDropdownOpen(false), 100);
              }}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onColumnChange={setColumn}
              onPriorityChange={(value) => {
                setPriority(value);
                if (value) setPriorityError(undefined);
              }}
              onDueDateChange={setDueDate}
              onTagInputChange={setTagInput}
              onTagKeyDown={handleTagKeyDown}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSuggestionSelect={addTagLabel}
            />
            <ChecklistPanel
              checklistInput={checklistInput}
              checklist={checklist}
              onChecklistInputChange={setChecklistInput}
              onChecklistKeyDown={handleChecklistKeyDown}
              onAddChecklistItem={handleAddChecklistItem}
              onToggleChecklistItem={handleToggleChecklistItem}
              onRemoveChecklistItem={handleRemoveChecklistItem}
            />
          </div>

          {/* Action buttons */}
          <div className="modal-action pt-4">
            <button
              type="button"
              className="btn btn-outline text-base-content"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim() || !priority}
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
