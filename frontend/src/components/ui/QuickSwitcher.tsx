"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { UserPresence } from "./UserPresence";
import { Search, Hash, Lock, User, Clock } from "lucide-react";

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Array<{
    id: string;
    name: string;
    isPrivate: boolean;
    description?: string;
  }>;
  users: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isOnline?: boolean;
  }>;
  recentChannels: string[];
  onChannelSelect: (channelId: string) => void;
  onUserSelect: (userId: string) => void;
}

export function QuickSwitcher({
  isOpen,
  onClose,
  channels,
  users,
  recentChannels,
  onChannelSelect,
  onUserSelect,
}: QuickSwitcherProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and sort results
  const filteredChannels = channels
    .filter(
      (channel) =>
        channel.name.toLowerCase().includes(query.toLowerCase()) ||
        channel.description?.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      // Prioritize recent channels
      const aRecent = recentChannels.indexOf(a.id);
      const bRecent = recentChannels.indexOf(b.id);

      if (aRecent !== -1 && bRecent !== -1) {
        return aRecent - bRecent;
      }
      if (aRecent !== -1) return -1;
      if (bRecent !== -1) return 1;

      return a.name.localeCompare(b.name);
    });

  const filteredUsers = users
    .filter(
      (user) =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      // Prioritize online users
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

  const allResults = [
    ...filteredChannels.map((channel) => ({
      type: "channel" as const,
      item: channel,
    })),
    ...filteredUsers.map((user) => ({ type: "user" as const, item: user })),
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (allResults[selectedIndex]) {
          const result = allResults[selectedIndex];
          if (result.type === "channel") {
            onChannelSelect(result.item.id);
          } else {
            onUserSelect(result.item.id);
          }
          onClose();
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleResultClick = (result: (typeof allResults)[0]) => {
    if (result.type === "channel") {
      onChannelSelect(result.item.id);
    } else {
      onUserSelect(result.item.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search channels and people..."
                className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {allResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            ) : (
              <div className="p-2">
                {query === "" && recentChannels.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Recent
                    </div>
                    {channels
                      .filter((channel) =>
                        recentChannels.slice(0, 3).includes(channel.id),
                      )
                      .map((channel, index) => (
                        <motion.div
                          key={`recent-${channel.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() =>
                            handleResultClick({
                              type: "channel",
                              item: channel,
                            })
                          }
                        >
                          {channel.isPrivate ? (
                            <Lock className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Hash className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {channel.name}
                            </p>
                            {channel.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {channel.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {allResults.map((result, index) => (
                  <motion.div
                    key={`${result.type}-${result.item.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? "bg-indigo-100 text-indigo-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    {result.type === "channel" ? (
                      <>
                        {result.item.isPrivate ? (
                          <Lock className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Hash className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {result.item.name}
                          </p>
                          {result.item.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {result.item.description}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <UserPresence
                          user={result.item}
                          isOnline={result.item.isOnline}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {result.item.displayName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{result.item.username}
                          </p>
                        </div>
                        {result.item.isOnline && (
                          <span className="text-xs text-green-600 font-medium">
                            Online
                          </span>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
                <span>esc to close</span>
              </div>
              <span>Ctrl+K</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for quick switcher
export function useQuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open quick switcher
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
  };
}
