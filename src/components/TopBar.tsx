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
  // Menu state
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const isClient = typeof window !== "undefined";

  // Position menu near trigger
  useLayoutEffect(() => {
    if (!desktopMenuOpen || !menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 8,
      left: rect.right,
    });
  }, [desktopMenuOpen]);

  // Keep menu within viewport
  useLayoutEffect(() => {
    if (!desktopMenuOpen || !menuButtonRef.current || !menuRef.current) return;
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
  }, [desktopMenuOpen, menuStyle]);

  // Close menu on outside click / Escape
  useEffect(() => {
    if (!desktopMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setDesktopMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDesktopMenuOpen(false);
      setMobileMenuOpen(false);
      setIsMobileSearchOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [desktopMenuOpen]);

  return (
    // Top navigation layout
    <div className="bg-base-100 border-b border-base-300 px-3 py-2 md:pl-8 md:pr-3 md:py-4">
      <div className="md:hidden">
        <div className="h-14 flex items-center justify-between gap-3">
          <div className="flex items-center flex-shrink-0">
            <div className="relative inline-flex items-start">
              <h1 className="text-[1.25rem] leading-none font-extrabold tracking-tight text-base-content">
                Design Pings
              </h1>
              <span
                className="absolute -right-4 top-0 h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 65%, #d97706 100%)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-ghost btn-square h-11 min-h-11 w-11 rounded-md ${
                isMobileSearchOpen || searchQuery ? "text-primary" : "text-base-content"
              }`}
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              aria-label={isMobileSearchOpen ? "Hide search" : "Show search"}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-square h-11 min-h-11 w-11 text-base-content rounded-md"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {(isMobileSearchOpen || Boolean(searchQuery)) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="pb-2"
            >
              <div className="join w-full">
                <label
                  className={`input input-bordered join-item h-11 min-h-11 flex items-center gap-2 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#fed7aa] rounded-l-xl ${
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
                    className="btn btn-ghost join-item h-11 min-h-11 text-base-content border border-base-300 border-l-0 rounded-l-none rounded-r-xl"
                    onClick={() => onSearchChange("")}
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden md:flex items-center justify-between gap-6 mx-auto">
        {/* Left: App Name/Logo */}
        <div className="flex items-center flex-shrink-0">
          <div className="relative inline-flex items-start">
            <h1 className="text-[1.5rem] leading-none font-extrabold tracking-tight text-base-content">
              Design Pings
            </h1>
            <span
              className="absolute -right-5 top-0 h-3 w-3 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 65%, #d97706 100%)",
              }}
              aria-hidden="true"
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
              onClick={() => setDesktopMenuOpen((prev) => !prev)}
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isClient &&
              createPortal(
                <AnimatePresence>
                  {desktopMenuOpen && menuStyle && (
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
                              setDesktopMenuOpen(false);
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
                              setDesktopMenuOpen(false);
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
                              setDesktopMenuOpen(false);
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

      {isClient &&
        createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-[2200] md:hidden">
                <motion.button
                  type="button"
                  className="absolute inset-0 bg-black/35"
                  aria-label="Close menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-base-300 bg-base-100 p-3 shadow-2xl"
                  initial={{ y: "100%", opacity: 0.9 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0.9 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-base-300" />
                  <ul className="menu p-1 w-full">
                    <li>
                      <button
                        type="button"
                        className="h-11 text-base-content flex items-center gap-2 w-full"
                        onClick={() => {
                          onOpenTagEditor();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <TagIcon className="w-4 h-4" />
                        Edit Tags
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="h-11 text-base-content flex items-center gap-2 w-full"
                        onClick={() => {
                          onClearDone();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                        Clear All Done
                      </button>
                    </li>
                  </ul>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export type { TopBarProps };
