"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import Column from "@/components/Column";
import AddPingModal from "@/components/AddPingModal";

interface Ping {
  id: string;
  title: string;
  column: "Inbox" | "In Progress" | "Done";
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
}

const DEFAULT_PINGS: Ping[] = [
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
  // State management
  const [pings, setPings] = useState<Ping[]>(DEFAULT_PINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPing, setEditingPing] = useState<Ping | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("design-pings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPings(parsed);
      }
    } catch (error) {
      console.error("Failed to load pings from localStorage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever pings change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("design-pings", JSON.stringify(pings));
      } catch (error) {
        console.error("Failed to save pings to localStorage:", error);
      }
    }
  }, [pings, isHydrated]);

  // CRUD Functions
  const handleAddPing = () => {
    setEditingPing(null);
    setIsModalOpen(true);
  };

  const handleEditPing = (ping: Ping) => {
    setEditingPing(ping);
    setIsModalOpen(true);
  };

  const handleSavePing = (pingData: Omit<Ping, "id" | "createdAt">) => {
    if (editingPing) {
      // Update existing ping
      setPings(
        pings.map((p) =>
          p.id === editingPing.id
            ? { ...p, ...pingData }
            : p
        )
      );
    } else {
      // Create new ping
      const newPing: Ping = {
        id: Date.now().toString(),
        ...pingData,
        createdAt: new Date().toISOString(),
      };
      setPings([...pings, newPing]);
    }
  };

  const handleDeletePing = (id: string) => {
    setPings(pings.filter((p) => p.id !== id));
  };

  const handleMovePing = (id: string, newColumn: Ping["column"]) => {
    setPings(
      pings.map((p) => (p.id === id ? { ...p, column: newColumn } : p))
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPing(null);
  };

  // Filter pings by search query
  const filteredPings = searchQuery
    ? pings.filter(
        (ping) =>
          ping.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ping.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : pings;

  // Group pings by column
  const getPingsByColumn = (column: Ping["column"]) =>
    filteredPings.filter((p) => p.column === column);

  return (
    <main className="h-screen bg-base-200 flex flex-col">
      {/* Top Bar */}
      <TopBar
        onAddPing={() => handleAddPing()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Board - Horizontal scrollable columns */}
      <section className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          <Column
            columnName="Inbox"
            pings={getPingsByColumn("Inbox")}
            onAddPing={handleAddPing}
            onEditPing={handleEditPing}
            onDeletePing={handleDeletePing}
            onMovePing={handleMovePing}
          />
          <Column
            columnName="In Progress"
            pings={getPingsByColumn("In Progress")}
            onAddPing={handleAddPing}
            onEditPing={handleEditPing}
            onDeletePing={handleDeletePing}
            onMovePing={handleMovePing}
          />
          <Column
            columnName="Done"
            pings={getPingsByColumn("Done")}
            onAddPing={handleAddPing}
            onEditPing={handleEditPing}
            onDeletePing={handleDeletePing}
            onMovePing={handleMovePing}
          />
        </div>
      </section>

      {/* Add/Edit Ping Modal */}
      <AddPingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePing}
        editingPing={editingPing}
      />
    </main>
  );
}
