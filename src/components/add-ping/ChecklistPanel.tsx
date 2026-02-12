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
  // Checklist progress
  const completedCount = checklist.filter((item) => item.done).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    // Checklist panel layout
    <div className="w-full rounded-xl border border-base-300 bg-base-200/70 p-3 sm:p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-base-content">Checklist</span>
          <span className="text-xs text-base-content/50">
            {totalCount > 0 ? `${completedCount}/${totalCount}` : "0/0"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-300">
            <div
              className="h-full bg-primary/80 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs text-base-content/50">{progress}%</span>
        </div>

        <div className="form-control space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Add a checklist item..."
              className="input input-bordered min-h-11 w-full flex-1 placeholder:text-base-content/50 sm:min-h-10"
              value={checklistInput}
              onChange={(e) => onChecklistInputChange(e.target.value)}
              onKeyDown={onChecklistKeyDown}
            />
            <button
              type="button"
              className="btn btn-outline h-11 min-h-11 w-full text-base-content sm:h-10 sm:min-h-10 sm:w-auto"
              onClick={onAddChecklistItem}
              disabled={!checklistInput.trim()}
            >
              Add
            </button>
          </div>

          {totalCount > 0 ? (
            <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1 sm:max-h-64 sm:space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-base-300/80 bg-base-100 px-2.5 py-2 sm:items-center"
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
                    className={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors sm:mt-0 sm:h-4 sm:w-4 ${
                      item.done
                        ? "bg-primary/80 border-primary/80"
                        : "bg-base-100 border-base-300"
                    }`}
                  >
                    {item.done ? (
                      <CheckIcon className="h-3 w-3 text-base-100" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span
                    className={`min-w-0 flex-1 break-words pr-1 text-sm leading-snug ${
                      item.done ? "line-through text-base-content/50" : "text-base-content"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-square ml-auto h-9 min-h-9 w-9 shrink-0 rounded-md text-base-content/40 hover:bg-base-200/60 hover:text-error sm:btn-xs sm:h-7 sm:min-h-7 sm:w-7"
                    onClick={() => onRemoveChecklistItem(item.id)}
                    aria-label="Remove checklist item"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-base-300/90 bg-base-100/50 px-3 py-2.5 text-xs text-base-content/55">
              No checklist items yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
