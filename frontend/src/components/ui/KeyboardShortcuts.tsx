"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["Ctrl", "K"], description: "Quick switcher" },
      { keys: ["Ctrl", "Shift", "K"], description: "Direct messages" },
      { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
      { keys: ["Alt", "↑"], description: "Previous channel" },
      { keys: ["Alt", "↓"], description: "Next channel" },
    ],
  },
  {
    category: "Messaging",
    items: [
      { keys: ["Enter"], description: "Send message" },
      { keys: ["Shift", "Enter"], description: "New line" },
      { keys: ["↑"], description: "Edit last message" },
      { keys: ["Ctrl", "F"], description: "Search messages" },
      { keys: ["Escape"], description: "Cancel editing" },
    ],
  },
  {
    category: "Formatting",
    items: [
      { keys: ["Ctrl", "B"], description: "Bold text" },
      { keys: ["Ctrl", "I"], description: "Italic text" },
      { keys: ["Ctrl", "Shift", "X"], description: "Strikethrough" },
      { keys: ["Ctrl", "Shift", "C"], description: "Code block" },
      { keys: ["Ctrl", "U"], description: "Upload file" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["Ctrl", "Shift", "A"], description: "All unreads" },
      { keys: ["Ctrl", "Shift", "T"], description: "Threads" },
      { keys: ["Ctrl", "Shift", "M"], description: "Mentions & reactions" },
      { keys: ["Ctrl", "Shift", "S"], description: "Saved items" },
      { keys: ["Ctrl", ","], description: "Preferences" },
    ],
  },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredShortcuts = shortcuts
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.keys.some((key) =>
            key.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      ),
    }))
    .filter((category) => category.items.length > 0);

  const renderKey = (key: string) => (
    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">
      {key}
    </kbd>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Shortcuts */}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Keyboard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shortcuts found</p>
            </div>
          ) : (
            filteredShortcuts.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: categoryIndex * 0.1 + index * 0.05,
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center space-x-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            {keyIndex > 0 && (
                              <span className="mx-1 text-gray-400">+</span>
                            )}
                            {renderKey(key)}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Command className="h-4 w-4" />
              <span>Press Ctrl+/ to open this dialog anytime</span>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ to show shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        setShowShortcuts(true);
      }

      // Escape to close shortcuts
      if (event.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  return {
    showShortcuts,
    setShowShortcuts,
  };
}
