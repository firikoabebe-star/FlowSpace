"use client";

import { useState, useRef, useEffect } from "react";
import { useMessageStore } from "@/store/message.store";
import { socketManager } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "./FileUpload";
import { EmojiPicker } from "./EmojiPicker";
import { Send } from "lucide-react";

interface MessageInputProps {
  channelId: string;
  channelName: string;
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const { sendMessage } = useMessageStore();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(channelId, message.trim());
      setMessage("");

      // Stop typing indicator
      if (isTyping) {
        socketManager.stopTyping(channelId);
        setIsTyping(false);
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      // Error handled by store
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      socketManager.startTyping(channelId);
      setIsTyping(true);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        socketManager.stopTyping(channelId);
        setIsTyping(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        socketManager.stopTyping(channelId);
      }
    };
  }, [channelId, isTyping]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* File upload button */}
        <FileUpload
          channelId={channelId}
          onFileUploaded={(file) => {
            // Optionally send a message about the file upload
            // This could be handled by the socket or refresh messages
          }}
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={`Message #${channelName}`}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-h-32"
            rows={1}
          />

          {/* Emoji picker */}
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setMessage((prev) => prev + emoji);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
          />
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="sm"
          className="shrink-0 mb-1"
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
