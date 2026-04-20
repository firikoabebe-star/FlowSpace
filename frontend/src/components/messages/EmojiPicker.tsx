"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = {
  "Frequently Used": ["👍", "❤️", "😂", "😊", "😢", "😮", "😡", "🎉"],
  Smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
  ],
  Gestures: [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👏",
    "🙌",
    "🤲",
    "🤝",
    "🙏",
  ],
  Hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
  ],
  Objects: [
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "⭐",
    "🌟",
    "💫",
    "✨",
    "🔥",
    "💯",
    "💢",
    "💥",
    "💦",
    "💨",
  ],
};

export function EmojiPicker({
  onEmojiSelect,
  disabled = false,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Frequently Used");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-2 bottom-2"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
          {/* Category tabs */}
          <div className="flex space-x-1 mb-3 overflow-x-auto">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[
              selectedCategory as keyof typeof EMOJI_CATEGORIES
            ].map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Quick reactions */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">Quick reactions</p>
            <div className="flex space-x-1">
              {EMOJI_CATEGORIES["Frequently Used"]
                .slice(0, 6)
                .map((emoji, index) => (
                  <button
                    key={`quick-${emoji}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1 text-lg hover:bg-gray-100 rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
