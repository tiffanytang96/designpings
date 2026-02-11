"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type StickyNote = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
};

type StickyState = {
  notes: StickyNote[];
  addNote: (note: StickyNote) => void;
  updateNote: (id: string, patch: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const STICKY_COLORS = [
  "#FEF3C7", // amber-100
  "#DCFCE7", // green-100
  "#DBEAFE", // blue-100
  "#EDE9FE", // violet-100
  "#FFE4E6", // rose-100
  "#E0F2FE", // sky-100
];

export const useStickyStore = create<StickyState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...patch } : note
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
    }),
    {
      name: "design-pings-sticky-notes",
      version: 1,
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : localStorage)),
    }
  )
);
