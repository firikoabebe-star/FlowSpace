"use client";

import { useEffect, useState } from "react";
import { generateAvatarUrl } from "@/lib/utils";

interface TypingIndicatorProps {
  userIds: string[];
}

export function TypingIndicator({ userIds }: TypingIndicatorProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (userIds.length === 0) return null;

  const getTypingText = () => {
    if (userIds.length === 1) {
      return `Someone is typing${dots}`;
    } else if (userIds.length === 2) {
      return `2 people are typing${dots}`;
    } else {
      return `Several people are typing${dots}`;
    }
  };

  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-1">
          {/* Animated typing dots */}
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <span className="text-sm text-gray-500 italic">{getTypingText()}</span>
      </div>
    </div>
  );
}
