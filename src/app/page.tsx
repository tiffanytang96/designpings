"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline";
import TopBar from "@/components/TopBar";
import Column from "@/components/Column";
import AddPingModal from "@/components/AddPingModal";
import TagEditModal from "@/components/TagEditModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import StickyNotesBoard from "@/components/sticky/StickyNotesBoard";
import { useBoardStore } from "@/stores/boardStore";

interface Ping {
  id: string;
  title: string;
  column: "Inbox" | "In Progress" | "Done";
  tagIds?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  description?: string;
  checklist?: { id: string; text: string; done: boolean }[];
}

type LegacyPing = Omit<Ping, "tagIds"> & { tags?: string[] };

const DEFAULT_PINGS: LegacyPing[] = [
  {
    id: "1",
    title: "Review design system documentation",
    column: "Inbox",
    tags: ["docs", "design-system"],
    priority: "high",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: "2",
    title: "Update color palette for dark mode",
    column: "In Progress",
    tags: ["design"],
    priority: "medium",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "3",
    title: "Create prototype for new dashboard",
    column: "Done",
    tags: ["prototype", "figma"],
    priority: "low",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

export default function Home() {
  const pings = useBoardStore((state) => state.pings);
  const tagsById = useBoardStore((state) => state.tags);
  const addPing = useBoardStore((state) => state.addPing);
  const updatePing = useBoardStore((state) => state.updatePing);
  const deletePing = useBoardStore((state) => state.deletePing);
  const movePing = useBoardStore((state) => state.movePing);
  const movePingToColumnAt = useBoardStore((state) => state.movePingToColumnAt);
  const clearDonePings = useBoardStore((state) => state.clearDonePings);
  const migrateLegacyData = useBoardStore((state) => state.migrateLegacyData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPing, setEditingPing] = useState<Ping | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState(false);
  const [isTopBarHover, setIsTopBarHover] = useState(false);
  const [uiHydrated, setUiHydrated] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [defaultColumn, setDefaultColumn] = useState<Ping["column"]>("Inbox");
  const [isTagEditOpen, setIsTagEditOpen] = useState(false);
  const [isClearDoneOpen, setIsClearDoneOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "added" | "deleted" } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const unsubscribe = useBoardStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    setHasHydrated(useBoardStore.persist.hasHydrated());
    return unsubscribe;
  }, []);


  // Load from localStorage on mount
  useEffect(() => {
    if (!hasHydrated) return;
    if (pings.length > 0 || Object.keys(tagsById).length > 0) return;
    try {
      const legacyPingsRaw = localStorage.getItem("design-pings");
      const legacyTagsRaw = localStorage.getItem("design-pings-tags");
      const legacyPings = legacyPingsRaw ? (JSON.parse(legacyPingsRaw) as LegacyPing[]) : [];
      const legacyTags = legacyTagsRaw ? (JSON.parse(legacyTagsRaw) as string[]) : [];
      if (legacyPings.length > 0 || legacyTags.length > 0) {
        migrateLegacyData(legacyPings as unknown as Ping[], legacyTags);
        return;
      }
    } catch (error) {
      console.error("Failed to migrate legacy data:", error);
    }
    migrateLegacyData(DEFAULT_PINGS as unknown as Ping[], []);
  }, [hasHydrated]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load UI preferences (focus mode + top nav visibility)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pingboard:ui");
      if (stored) {
        const parsed = JSON.parse(stored) as {
          focusMode?: boolean;
          isTopBarHidden?: boolean;
        };
        if (typeof parsed.focusMode === "boolean") {
          setFocusMode(parsed.focusMode);
        }
        if (typeof parsed.isTopBarHidden === "boolean") {
          setIsTopBarHidden(parsed.isTopBarHidden);
        }
      }
    } catch (error) {
      console.error("Failed to load UI prefs:", error);
    }
    setUiHydrated(true);
  }, []);

  // Persist UI preferences
  useEffect(() => {
    if (!uiHydrated) return;
    try {
      localStorage.setItem(
        "pingboard:ui",
        JSON.stringify({ focusMode, isTopBarHidden })
      );
    } catch (error) {
      console.error("Failed to save UI prefs:", error);
    }
  }, [focusMode, isTopBarHidden, uiHydrated]);

  // Keyboard shortcut: Cmd+K opens Add Ping
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMacCmdK =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k";
      if (!isMacCmdK) return;
      event.preventDefault();
      handleAddPing();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // CRUD Functions
  const handleAddPing = (column?: Ping["column"]) => {
    setEditingPing(null);
    setDefaultColumn(column ?? "Inbox");
    setIsModalOpen(true);
  };

  const handleEditPing = (ping: Ping) => {
    setEditingPing(ping);
    setIsModalOpen(true);
  };

  const handleSavePing = (pingData: Omit<Ping, "id" | "createdAt">) => {
    if (editingPing) {
      updatePing(editingPing.id, pingData);
    } else {
      const newPing: Ping = {
        id: Date.now().toString(),
        ...pingData,
        createdAt: new Date().toISOString(),
      };
      addPing(newPing);
      setToast({ message: newPing.title, tone: "added" });
    }
  };

  const handleDeletePing = (id: string) => {
    const pingToDelete = pings.find((ping) => ping.id === id);
    deletePing(id);
    setToast({ message: pingToDelete?.title || "Ping", tone: "deleted" });
  };

  const handleMovePing = (id: string, newColumn: Ping["column"]) => {
    movePing(id, newColumn);
  };

  const handleReorderPing = (
    id: string,
    column: Ping["column"],
    targetId: string,
    position: "before" | "after"
  ) => {
    movePingToColumnAt(id, column, targetId, position);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPing(null);
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [toast]);


  // Filter pings by search query
  const filteredPings = searchQuery
    ? pings.filter(
        (ping) =>
          ping.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ping.tagIds?.some((tagId) =>
            tagsById[tagId]?.label
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
      )
    : pings;

  // Group pings by column
  const getPingsByColumn = (column: Ping["column"]) =>
    filteredPings.filter((p) => p.column === column);

  const doneCount = pings.filter((ping) => ping.column === "Done").length;

  return (
    <main className="h-screen bg-base-200 flex flex-col">
      {/* Top Bar */}
      {/* Top hover reveal zone */}
      {isTopBarHidden && (
        <div
          className="fixed top-0 left-0 right-0 h-2 z-50"
          onMouseEnter={() => setIsTopBarHover(true)}
        />
      )}

      <AnimatePresence initial={false}>
        {(!isTopBarHidden || isTopBarHover) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden relative z-50"
            onMouseEnter={() => setIsTopBarHover(true)}
            onMouseLeave={() => {
              if (isTopBarHidden) setIsTopBarHover(false);
            }}
          >
            <TopBar
              onAddPing={() => handleAddPing()}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
              isTopBarHidden={isTopBarHidden}
              onToggleTopBarHidden={() => {
                setIsTopBarHidden((prev) => {
                  const next = !prev;
                  if (next) setIsTopBarHover(false);
                  return next;
                });
              }}
              onOpenTagEditor={() => setIsTagEditOpen(true)}
              onClearDone={() => setIsClearDoneOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board - Horizontal scrollable columns */}
      <section className="flex-1 overflow-hidden p-6">
        <div className="flex gap-6 h-full">
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-6 h-full min-w-max pr-4">
              <Column
                columnName="Inbox"
                pings={getPingsByColumn("Inbox")}
                onAddPing={handleAddPing}
                onEditPing={handleEditPing}
                onDeletePing={handleDeletePing}
                onMovePing={handleMovePing}
                onReorderPing={handleReorderPing}
              />
              <Column
                columnName="In Progress"
                pings={getPingsByColumn("In Progress")}
                onAddPing={handleAddPing}
                onEditPing={handleEditPing}
                onDeletePing={handleDeletePing}
                onMovePing={handleMovePing}
                onReorderPing={handleReorderPing}
              />
              {!focusMode && (
                <Column
                  columnName="Done"
                  pings={getPingsByColumn("Done")}
                  onAddPing={handleAddPing}
                  onEditPing={handleEditPing}
                  onDeletePing={handleDeletePing}
                  onMovePing={handleMovePing}
                  onReorderPing={handleReorderPing}
                />
              )}
            </div>
          </div>
          <div className="w-[380px] flex-shrink-0">
            <StickyNotesBoard />
          </div>
        </div>
      </section>

      {/* Add/Edit Ping Modal */}
      <AddPingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePing}
        editingPing={editingPing}
        defaultColumn={defaultColumn}
      />
      <TagEditModal
        isOpen={isTagEditOpen}
        onClose={() => setIsTagEditOpen(false)}
      />
      <DeleteConfirmModal
        isOpen={isClearDoneOpen}
        title="Done pings"
        heading="Clear Done Pings?"
        description={`This will permanently delete ${doneCount} done ping${
          doneCount === 1 ? "" : "s"
        }.`}
        confirmLabel="Clear Done"
        confirmClassName="btn btn-error btn-sm"
        cancelClassName="btn btn-outline btn-sm text-base-content"
        onConfirm={() => {
          clearDonePings();
          setIsClearDoneOpen(false);
        }}
        onCancel={() => setIsClearDoneOpen(false)}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div
                className="fixed z-[3000] flex items-center gap-3 rounded-xl border border-base-300 bg-white px-4 py-3 text-sm min-w-[220px] max-w-[360px] overflow-hidden"
                style={{ right: 24, bottom: 24, left: "auto", top: "auto" }}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span
                  className={`absolute left-0 top-0 h-1 w-full ${
                    toast.tone === "deleted" ? "bg-rose-300" : "bg-emerald-300"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    toast.tone === "deleted"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {toast.tone === "deleted" ? (
                    <MinusCircleIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wide text-base-content/60">
                    {toast.tone === "deleted" ? "Deleted" : "Added"}
                  </span>
                  <span className="font-medium text-base-content">{toast.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </main>
  );
}
