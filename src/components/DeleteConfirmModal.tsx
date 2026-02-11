"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  heading?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  heading,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmClassName = "btn btn-error btn-sm",
  cancelClassName = "btn btn-neutral btn-sm",
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-base-100 rounded-lg p-6 shadow-lg max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base-content mb-2">
              {heading ?? "Delete Ping?"}
            </h3>
            <p className="text-sm text-base-content/70 mb-6">
              {description ??
                `Are you sure you want to delete "${title}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button className={cancelClassName} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button className={confirmClassName} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
