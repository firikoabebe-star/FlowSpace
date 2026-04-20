"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { EmojiPicker } from "./EmojiPicker";
import { MessageReaction } from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Plus } from "lucide-react";

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onReactionUpdate: () => void;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  userReacted: boolean;
}

export function MessageReactions({
  messageId,
  reactions,
  onReactionUpdate,
}: MessageReactionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc: Record<string, GroupedReaction>, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false,
        };
      }

      acc[reaction.emoji].count++;
      if (reaction.user) {
        acc[reaction.emoji].users.push(reaction.user);
      }

      // Note: userReacted would need to be determined by checking current user ID
      // This would typically come from the backend response

      return acc;
    },
    {},
  );

  const handleReactionToggle = async (
    emoji: string,
    isCurrentlyReacted: boolean,
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isCurrentlyReacted) {
        // Remove reaction
        await apiClient.delete(
          `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
        );
      } else {
        // Add reaction
        await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
      }

      onReactionUpdate();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update reaction";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
      onReactionUpdate();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to add reaction";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatUserList = (users: GroupedReaction["users"]) => {
    if (users.length === 0) return "";
    if (users.length === 1) return users[0].displayName;
    if (users.length === 2)
      return `${users[0].displayName} and ${users[1].displayName}`;
    return `${users[0].displayName}, ${users[1].displayName} and ${users.length - 2} others`;
  };

  if (Object.keys(groupedReactions).length === 0) {
    return (
      <div className="flex items-center mt-1">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-1 mt-2">
      {Object.values(groupedReactions).map((reaction) => (
        <motion.div
          key={reaction.emoji}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant={reaction.userReacted ? "default" : "outline"}
            size="sm"
            className={`h-7 px-2 text-xs ${
              reaction.userReacted
                ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() =>
              handleReactionToggle(reaction.emoji, reaction.userReacted)
            }
            disabled={isLoading}
            title={`${reaction.emoji} ${formatUserList(reaction.users)}`}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </Button>
        </motion.div>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={isLoading} />
      </div>
    </div>
  );
}
