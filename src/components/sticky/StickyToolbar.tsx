"use client";

import { PlusIcon } from "@heroicons/react/24/outline";

interface StickyToolbarProps {
  onAddNote: () => void;
}

export default function StickyToolbar({ onAddNote }: StickyToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-base-content">Sticky Notes</h3>
        <p className="text-xs text-base-content/60">Quick ideas and scratchpad</p>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm rounded-md"
        onClick={onAddNote}
      >
        <PlusIcon className="h-4 w-4" />
        Add Sticky
      </button>
    </div>
  );
}
