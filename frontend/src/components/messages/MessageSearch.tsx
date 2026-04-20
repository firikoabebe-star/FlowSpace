"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MessageItem } from "./MessageItem";
import { Message } from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Search, X, ArrowUp } from "lucide-react";

interface MessageSearchProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageSearch({
  channelId,
  isOpen,
  onClose,
}: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get(
        `/messages/channel/${channelId}/search?query=${encodeURIComponent(searchQuery.trim())}&limit=50`,
      );

      if (response.success) {
        setResults(response.data.messages);
        setHasSearched(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Search failed";
      showToast(errorMessage, "error");
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === "Escape") {
      onClose();
    }
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
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {!hasSearched && !isSearching && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Search Messages</p>
                <p className="text-sm">
                  Type to search through channel messages
                </p>
              </div>
            )}

            {hasSearched && results.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No Results Found</p>
                <p className="text-sm">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Found {results.length} message
                    {results.length !== 1 ? "s" : ""} for "{query}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Scroll to top of results
                      const container =
                        document.querySelector(".overflow-y-auto");
                      if (container) {
                        container.scrollTop = 0;
                      }
                    }}
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Top
                  </Button>
                </div>

                {results.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  >
                    <MessageItem
                      message={message}
                      showAvatar={true}
                      showTimestamp={true}
                      isOwn={false} // We'll determine this based on current user
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              <strong>Tips:</strong> Search is case-insensitive. Use specific
              keywords for better results. Press Escape to close.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
