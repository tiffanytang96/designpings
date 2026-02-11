"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PingColumn = "Inbox" | "In Progress" | "Done";
export type PingPriority = "low" | "medium" | "high" | "urgent";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
  createdAt: string;
}

export interface Ping {
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

export interface BoardState {
  pings: Ping[];
  tags: Record<string, Tag>;
  tagOrder: string[];
  tagLabelIndex: Record<string, string>;
  tagPalette: string[];
  addOrUpdatePing: (ping: Ping) => void;
  addPing: (ping: Ping) => void;
  updatePing: (id: string, patch: Partial<Ping>) => void;
  deletePing: (id: string) => void;
  movePing: (id: string, column: PingColumn) => void;
  movePingToColumnAt: (
    id: string,
    column: PingColumn,
    targetId: string,
    position: "before" | "after"
  ) => void;
  clearDonePings: () => void;
  createOrReuseTag: (label: string) => { tag?: Tag; error?: string };
  removeTagFromPing: (pingId: string, tagId: string) => void;
  getTagById: (id: string) => Tag | undefined;
  getAllTags: () => Tag[];
  renameTag: (id: string, newLabel: string) => { error?: string };
  deleteTag: (id: string) => void;
  mergeTags: (sourceId: string, targetId: string) => void;
  setTagOrder: (order: string[]) => void;
  migrateLegacyData: (legacyPings?: Ping[], legacyTags?: string[]) => Ping[];
}

const TAG_MAX_LENGTH = 12;
const TAG_MAX_PER_PING = 6;
const TAG_LABEL_REGEX = /^[a-z0-9- ]+$/i;

const DEFAULT_PALETTE = [
  "bg-rose-200 text-rose-900",
  "bg-amber-200 text-amber-900",
  "bg-emerald-200 text-emerald-900",
  "bg-sky-200 text-sky-900",
  "bg-indigo-200 text-indigo-900",
  "bg-fuchsia-200 text-fuchsia-900",
  "bg-teal-200 text-teal-900",
  "bg-lime-200 text-lime-900",
];

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const validateLabel = (label: string) => {
  const trimmed = label.trim();
  if (!trimmed) return "Tag is empty.";
  if (trimmed.length > TAG_MAX_LENGTH) return `Max ${TAG_MAX_LENGTH} characters.`;
  if (!TAG_LABEL_REGEX.test(trimmed)) return "Only letters, numbers, spaces, and dashes.";
  return undefined;
};

const pickColor = (palette: string[], index: number) =>
  palette[index % palette.length];

const buildTag = (label: string, palette: string[], index: number): Tag => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: label.trim(),
  color: pickColor(palette, index),
  createdAt: new Date().toISOString(),
});

const getPreferredStorage = () => {
  if (typeof window === "undefined") return null;
  const testKey = "__pingboard_storage_test__";
  try {
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    try {
      window.sessionStorage.setItem(testKey, "1");
      window.sessionStorage.removeItem(testKey);
      return window.sessionStorage;
    } catch (innerError) {
      return null;
    }
  }
};

const storageAdapter = {
  getItem: (name: string) => {
    const storage = getPreferredStorage();
    return storage ? storage.getItem(name) : null;
  },
  setItem: (name: string, value: string) => {
    const storage = getPreferredStorage();
    if (storage) {
      storage.setItem(name, value);
      if (process.env.NODE_ENV !== "production") {
        const storageType =
          storage === window.localStorage ? "localStorage" : "sessionStorage";
        console.info(`[pingboard] persisted to ${storageType}`);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.warn("[pingboard] no storage available");
    }
  },
  removeItem: (name: string) => {
    const storage = getPreferredStorage();
    if (storage) storage.removeItem(name);
  },
};

const getInsertIndexForColumn = (pings: Ping[], column: PingColumn) => {
  let lastIndex = -1;
  pings.forEach((ping, index) => {
    if (ping.column === column) {
      lastIndex = index;
    }
  });
  return lastIndex === -1 ? pings.length : lastIndex + 1;
};

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      pings: [],
      tags: {},
      tagOrder: [],
      tagLabelIndex: {},
      tagPalette: DEFAULT_PALETTE,
      addPing: (ping) => set((state) => ({ pings: [...state.pings, ping] })),
      addOrUpdatePing: (ping) =>
        set((state) => {
          const exists = state.pings.some((p) => p.id === ping.id);
          return {
            pings: exists
              ? state.pings.map((p) => (p.id === ping.id ? ping : p))
              : [...state.pings, ping],
          };
        }),
      updatePing: (id, patch) =>
        set((state) => ({
          pings: state.pings.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePing: (id) =>
        set((state) => ({ pings: state.pings.filter((p) => p.id !== id) })),
      movePing: (id, column) =>
        set((state) => {
          const next = [...state.pings];
          const fromIndex = next.findIndex((p) => p.id === id);
          if (fromIndex === -1) return state;
          const moving = { ...next[fromIndex], column };
          next.splice(fromIndex, 1);
          const insertIndex = getInsertIndexForColumn(next, column);
          next.splice(insertIndex, 0, moving);
          return { pings: next };
        }),
      movePingToColumnAt: (id, column, targetId, position) =>
        set((state) => {
          const next = [...state.pings];
          const fromIndex = next.findIndex((p) => p.id === id);
          if (fromIndex === -1) return state;
          const moving = { ...next[fromIndex], column };
          next.splice(fromIndex, 1);
          const targetIndex = next.findIndex(
            (p) => p.id === targetId && p.column === column
          );
          if (targetIndex === -1) {
            const insertIndex = getInsertIndexForColumn(next, column);
            next.splice(insertIndex, 0, moving);
            return { pings: next };
          }
          const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
          next.splice(insertIndex, 0, moving);
          return { pings: next };
        }),
      clearDonePings: () =>
        set((state) => ({
          pings: state.pings.filter((ping) => ping.column !== "Done"),
        })),
      createOrReuseTag: (label) => {
        const error = validateLabel(label);
        if (error) return { error };
        const normalized = normalizeLabel(label);
        const existingId = get().tagLabelIndex[normalized];
        if (existingId) {
          return { tag: get().tags[existingId] };
        }
        const palette = get().tagPalette;
        const newTag = buildTag(label, palette, get().tagOrder.length);
        set((state) => ({
          tags: { ...state.tags, [newTag.id]: newTag },
          tagOrder: [...state.tagOrder, newTag.id],
          tagLabelIndex: { ...state.tagLabelIndex, [normalized]: newTag.id },
        }));
        return { tag: newTag };
      },
      removeTagFromPing: (pingId, tagId) =>
        set((state) => ({
          pings: state.pings.map((p) =>
            p.id === pingId
              ? { ...p, tagIds: (p.tagIds || []).filter((id) => id !== tagId) }
              : p
          ),
        })),
      getTagById: (id) => get().tags[id],
      getAllTags: () => get().tagOrder.map((id) => get().tags[id]).filter(Boolean),
      renameTag: (id, newLabel) => {
        const error = validateLabel(newLabel);
        if (error) return { error };
        const normalized = normalizeLabel(newLabel);
        const existing = get().tagLabelIndex[normalized];
        if (existing && existing !== id) {
          return { error: "Tag already exists." };
        }
        const tag = get().tags[id];
        if (!tag) return { error: "Tag not found." };
        set((state) => {
          const nextIndex = { ...state.tagLabelIndex };
          delete nextIndex[normalizeLabel(tag.label)];
          nextIndex[normalized] = id;
          return {
            tags: { ...state.tags, [id]: { ...tag, label: newLabel.trim() } },
            tagLabelIndex: nextIndex,
          };
        });
        return {};
      },
      deleteTag: (id) =>
        set((state) => {
          const nextTags = { ...state.tags };
          const tag = nextTags[id];
          if (!tag) return state;
          delete nextTags[id];
          const nextIndex = { ...state.tagLabelIndex };
          delete nextIndex[normalizeLabel(tag.label)];
          return {
            tags: nextTags,
            tagOrder: state.tagOrder.filter((tagId) => tagId !== id),
            tagLabelIndex: nextIndex,
            pings: state.pings.map((p) => ({
              ...p,
              tagIds: (p.tagIds || []).filter((tagId) => tagId !== id),
            })),
          };
        }),
      mergeTags: (sourceId, targetId) =>
        set((state) => {
          if (sourceId === targetId) return state;
          const source = state.tags[sourceId];
          const target = state.tags[targetId];
          if (!source || !target) return state;
          const nextTags = { ...state.tags };
          delete nextTags[sourceId];
          const nextIndex = { ...state.tagLabelIndex };
          delete nextIndex[normalizeLabel(source.label)];
          return {
            tags: nextTags,
            tagOrder: state.tagOrder.filter((id) => id !== sourceId),
            tagLabelIndex: nextIndex,
            pings: state.pings.map((p) => ({
              ...p,
              tagIds: Array.from(
                new Set(
                  (p.tagIds || []).map((id) => (id === sourceId ? targetId : id))
                )
              ),
            })),
          };
        }),
      setTagOrder: (order) =>
        set((state) => ({
          tagOrder: order.filter((id) => state.tags[id]),
        })),
      migrateLegacyData: (legacyPings, legacyTags) => {
        const tagIds: Record<string, string> = {};
        const migratedPings = (legacyPings || []).map((ping) => {
          if (!("tags" in ping)) return ping;
          const anyPing = ping as Ping & { tags?: string[] };
          const legacyTagLabels = anyPing.tags || [];
          const nextTagIds: string[] = [];
          legacyTagLabels.forEach((label) => {
            const normalized = normalizeLabel(label);
            let tagId = get().tagLabelIndex[normalized];
            if (!tagId) {
              const created = get().createOrReuseTag(label);
              tagId = created.tag?.id;
            }
            if (tagId) {
              tagIds[label] = tagId;
              nextTagIds.push(tagId);
            }
          });
          const { tags, ...rest } = anyPing as any;
          return { ...rest, tagIds: nextTagIds };
        });

        (legacyTags || []).forEach((label) => {
          get().createOrReuseTag(label);
        });

        if (migratedPings.length > 0) {
          set({ pings: migratedPings });
        }
        return migratedPings;
      },
    }),
    {
      name: "pingboard:data",
      version: 1,
      storage: createJSONStorage(() => storageAdapter),
      onRehydrateStorage: () => (state, error) => {
        if (process.env.NODE_ENV !== "production") {
          if (error) {
            console.error("[pingboard] rehydrate error", error);
          } else {
            console.info("[pingboard] rehydrated");
          }
        }
      },
      partialize: (state) => ({
        pings: state.pings,
        tags: state.tags,
        tagOrder: state.tagOrder,
        tagLabelIndex: state.tagLabelIndex,
        tagPalette: state.tagPalette,
      }),
    }
  )
);

export const TAG_RULES = {
  maxLength: TAG_MAX_LENGTH,
  maxPerPing: TAG_MAX_PER_PING,
  regex: TAG_LABEL_REGEX,
};
