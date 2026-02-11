"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PingColumn, PingPriority, Tag } from "./types";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface LeftFormFieldsProps {
  title: string;
  description: string;
  column: PingColumn;
  priority: PingPriority | "";
  dueDate: string;
  tagInput: string;
  selectedTags: Tag[];
  suggestions: Tag[];
  activeSuggestionIndex: number;
  tagError?: string;
  priorityError?: string;
  showSuggestions: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onColumnChange: (value: PingColumn) => void;
  onPriorityChange: (value: PingPriority | "") => void;
  onDueDateChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
  onAddTag: () => void;
  onRemoveTag: (tagId: string) => void;
  onSuggestionSelect: (label: string) => void;
  onTagFocus: () => void;
  onTagBlur: () => void;
}

export default function LeftFormFields({
  title,
  description,
  column,
  priority,
  dueDate,
  tagInput,
  selectedTags,
  suggestions,
  activeSuggestionIndex,
  tagError,
  priorityError,
  showSuggestions,
  onTitleChange,
  onDescriptionChange,
  onColumnChange,
  onPriorityChange,
  onDueDateChange,
  onTagInputChange,
  onTagKeyDown,
  onAddTag,
  onRemoveTag,
  onSuggestionSelect,
  onTagFocus,
  onTagBlur,
}: LeftFormFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updateDropdownPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (!showSuggestions) return;
    updateDropdownPosition();
  }, [showSuggestions, tagInput]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleScroll = () => updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [showSuggestions]);

  return (
    <div className="space-y-4 pl-1">
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
          onChange={(e) => onTitleChange(e.target.value)}
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="text-sm font-semibold text-base-content">Description</span>
        </label>
        <textarea
          placeholder="Add a short description..."
          className="textarea textarea-bordered w-full min-h-24 placeholder:text-base-content/50"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
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
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-box w-full mt-2 z-10"
          >
            {(["Inbox", "In Progress", "Done"] as const).map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => onColumnChange(option)}
                  className="text-base-content"
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Priority selector */}
      <div className="form-control">
        <label className="label">
          <span className="text-sm font-semibold text-base-content">
            Priority <span className="text-error">*</span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { label: "Low", value: "low", color: "bg-emerald-400" },
            { label: "Medium", value: "medium", color: "bg-amber-400" },
            { label: "High", value: "high", color: "bg-rose-500" },
            { label: "Urgent", value: "urgent", color: "bg-purple-500" },
          ] as const).map((option) => (
            <label key={option.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                className="radio radio-sm radio-primary"
                checked={priority === option.value}
                onChange={() => onPriorityChange(option.value)}
              />
              {option.value ? (
                <span className={`w-2.5 h-2.5 rounded-sm ${option.color}`} aria-hidden="true" />
              ) : null}
              <span className="text-sm text-base-content">{option.label}</span>
            </label>
          ))}
        </div>
        {priorityError && (
          <div className="mt-2 text-xs text-error">{priorityError}</div>
        )}
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
          onChange={(e) => onDueDateChange(e.target.value)}
        />
      </div>

      {/* Tags input */}
      <div className="form-control">
        <label className="label">
          <span className="text-sm font-semibold text-base-content">Tags</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add a tag..."
              className="input input-bordered w-full placeholder:text-base-content/50"
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onKeyDown={onTagKeyDown}
              onFocus={onTagFocus}
              onBlur={onTagBlur}
              ref={inputRef}
            />
          </div>
          <button
            type="button"
            className="btn btn-outline text-base-content"
            onClick={onAddTag}
            disabled={!tagInput.trim()}
          >
            Add
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && dropdownStyle && (
          createPortal(
            <div
              className="fixed rounded-box border border-base-300 bg-base-100/95 backdrop-blur shadow-lg text-base-content z-[2000] max-h-40 overflow-y-auto"
              style={{
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
            >
              {suggestions.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm text-base-content hover:bg-base-200 ${
                    index === activeSuggestionIndex && activeSuggestionIndex >= 0 ? "bg-base-200" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSuggestionSelect(tag.label)}
                >
                  <span className="inline-flex items-center gap-2">{tag.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        )}
        {tagError && (
          <div className="mt-2 text-xs text-error">{tagError}</div>
        )}

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag) => (
              <span key={tag.id} className="badge gap-1 bg-base-200 text-base-content border-none">
                {tag.label}
                <button
                  type="button"
                  className="text-error hover:text-error-focus cursor-pointer"
                  onClick={() => onRemoveTag(tag.id)}
                  aria-label={`Remove ${tag.label} tag`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
