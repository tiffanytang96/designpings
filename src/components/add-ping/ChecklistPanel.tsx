"use client";

import type { ChecklistItem } from "./types";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ChecklistPanelProps {
  checklistInput: string;
  checklist: ChecklistItem[];
  onChecklistInputChange: (value: string) => void;
  onChecklistKeyDown: (e: React.KeyboardEvent) => void;
  onAddChecklistItem: () => void;
  onToggleChecklistItem: (id: string) => void;
  onRemoveChecklistItem: (id: string) => void;
}

export default function ChecklistPanel({
  checklistInput,
  checklist,
  onChecklistInputChange,
  onChecklistKeyDown,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
}: ChecklistPanelProps) {
  const completedCount = checklist.filter((item) => item.done).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 rounded-xl bg-base-200/70 border border-base-300 p-4 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-base-content">Checklist</span>
        <span className="text-xs text-base-content/50">
          {totalCount > 0 ? `${completedCount}/${totalCount}` : "0/0"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-base-300 overflow-hidden">
          <div
            className="h-full bg-primary/80 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-base-content/50 w-9 text-right">
          {progress}%
        </span>
      </div>

      <div className="form-control flex flex-col min-h-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a checklist item..."
            className="input input-bordered flex-1 placeholder:text-base-content/50"
            value={checklistInput}
            onChange={(e) => onChecklistInputChange(e.target.value)}
            onKeyDown={onChecklistKeyDown}
          />
          <button
            type="button"
            className="btn btn-outline text-base-content"
            onClick={onAddChecklistItem}
            disabled={!checklistInput.trim()}
          >
            Add
          </button>
        </div>

        {totalCount > 0 && (
          <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg bg-base-100 border border-base-300/80 px-2 py-1.5"
              >
                <span
                  role="checkbox"
                  aria-checked={item.done}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onToggleChecklistItem(item.id);
                    }
                  }}
                  onClick={() => onToggleChecklistItem(item.id)}
                  className={`h-4 w-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${
                    item.done
                      ? "bg-primary/80 border-primary/80"
                      : "bg-base-100 border-base-300"
                  }`}
                >
                  {item.done ? (
                    <CheckIcon className="w-3 h-3 text-base-100" aria-hidden="true" />
                  ) : null}
                </span>
                <span
                  className={`text-sm ${
                    item.done ? "line-through text-base-content/50" : "text-base-content"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error hover:bg-base-200/60 ml-auto rounded-md"
                  onClick={() => onRemoveChecklistItem(item.id)}
                  aria-label="Remove checklist item"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
