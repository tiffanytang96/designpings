import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface TopBarProps {
  onAddPing: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  isTopBarHidden: boolean;
  onToggleTopBarHidden: () => void;
  onOpenTagEditor: () => void;
  onClearDone: () => void;
}

export default function TopBar({
  onAddPing,
  searchQuery,
  onSearchChange,
  focusMode,
  onToggleFocusMode,
  isTopBarHidden,
  onToggleTopBarHidden,
  onOpenTagEditor,
  onClearDone,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen || !menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 8,
      left: rect.right,
    });
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen || !menuButtonRef.current || !menuRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    let left = rect.right - menuRect.width;
    left = Math.min(Math.max(left, padding), window.innerWidth - menuRect.width - padding);
    let top = rect.bottom + 8;
    if (top + menuRect.height + padding > window.innerHeight) {
      top = Math.max(padding, rect.top - menuRect.height - 8);
    }
    setMenuStyle((prev) => {
      if (!prev || prev.left !== left || prev.top !== top) {
        return { top, left };
      }
      return prev;
    });
  }, [menuOpen, menuStyle]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <div className="bg-base-100 border-b border-base-300 px-6 py-4">
      <div className="flex items-center justify-between gap-6 max-w-screen-2xl mx-auto">
        {/* Left: App Name/Logo */}
        <div className="flex items-center flex-shrink-0">
          <div className="h-10 w-[200px] overflow-hidden rounded-lg">
            <img
              src="/designpings.png"
              alt="Design Pings"
              className="h-full w-full object-cover object-left"
            />
          </div>
        </div>

        {/* Center: Search/Filter */}
        <div className="flex-1 max-w-md">
          <div className="join w-full">
            <label
              className={`input input-bordered join-item flex items-center gap-2 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#fed7aa] rounded-l-xl ${
                searchQuery ? "rounded-r-none" : "rounded-r-xl"
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 opacity-70" />
              <input
                type="text"
                placeholder="Search pings..."
                className="grow bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 !outline-none !outline-offset-0 placeholder:text-base-content/50"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </label>
            {searchQuery && (
              <button
                className="btn btn-ghost join-item text-base-content border border-base-300 border-l-0 rounded-l-none rounded-r-xl"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Add Ping Button + Settings */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="btn btn-primary rounded-md"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddPing();
            }}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="inline-flex items-center gap-2">
              Add Ping
              <span className="inline-flex items-center gap-1 text-xs text-base-content/70 border border-base-100/60 rounded px-1.5 py-0.5 bg-base-100/20">
                ⌘K
              </span>
            </span>
          </button>

          {/* Settings Menu */}
          <div className="relative z-[200]">
            <button
              ref={menuButtonRef}
              className="btn btn-ghost btn-square text-base-content rounded-md"
              aria-label="Settings"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {mounted &&
              createPortal(
                <AnimatePresence>
                  {menuOpen && menuStyle && (
                    <motion.div
                      ref={menuRef}
                      className="fixed z-[2000] w-56 rounded-box bg-base-100 shadow-2xl border border-base-300 origin-top-right"
                      style={{ top: menuStyle.top, left: menuStyle.left }}
                      initial={{ opacity: 0, scale: 0.98, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -6 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                      <ul className="menu p-2 w-full">
                        <li>
                          <button
                            type="button"
                            className="text-base-content flex items-center gap-2 w-full"
                            onClick={() => {
                              onToggleFocusMode();
                              setMenuOpen(false);
                            }}
                          >
                            <SparklesIcon className="w-4 h-4" />
                            {focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between gap-3 px-3 py-2 text-base-content"
                            onClick={() => onToggleTopBarHidden()}
                          >
                            <div className="flex items-center gap-2 text-base-content text-sm">
                              <Bars3Icon className="w-4 h-4" />
                              Hide Navigation
                            </div>
                            <input
                              type="checkbox"
                              className="toggle toggle-sm pointer-events-none"
                              checked={isTopBarHidden}
                              onChange={() => {}}
                            />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="text-base-content flex items-center gap-2 w-full"
                            onClick={() => {
                              onOpenTagEditor();
                              setMenuOpen(false);
                            }}
                          >
                            <TagIcon className="w-4 h-4" />
                            Edit Tags
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="text-base-content flex items-center gap-2 w-full"
                            onClick={() => {
                              onClearDone();
                              setMenuOpen(false);
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                            Clear All Done
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { TopBarProps };
