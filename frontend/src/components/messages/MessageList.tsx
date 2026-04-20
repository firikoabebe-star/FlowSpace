"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { useMessageStore } from "@/store/message.store";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import {
  LoadingSpinner,
  MessageSkeleton,
} from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { user } = useAuthStore();
  const {
    channelMessages,
    isLoadingMessages,
    fetchChannelMessages,
    typingUsers,
  } = useMessageStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messages = channelMessages[channelId] || [];
  const typingInChannel = Array.from(typingUsers[channelId] || []).filter(
    (userId) => userId !== user?.id,
  );

  useEffect(() => {
    if (channelId) {
      fetchChannelMessages(channelId);
    }
  }, [channelId, fetchChannelMessages]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    const isNearTop = scrollTop < 100;

    setIsAtBottom(isNearBottom);
    setShowScrollButton(!isNearBottom && messages.length > 0);

    // Load more messages when scrolling to top
    if (isNearTop && !isLoadingMessages && messages.length > 0) {
      const oldestMessage = messages[0];
      if (oldestMessage) {
        fetchChannelMessages(channelId, 50, oldestMessage.createdAt);
      }
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
        onScroll={handleScroll}
      >
        {messageGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center text-gray-500">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                No messages yet. Be the first to say something!
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {messageGroups.map((group, groupIndex) => (
                <motion.div
                  key={group.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
                >
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-6">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm"
                    >
                      <span className="text-xs font-medium text-gray-600">
                        {formatDate(group.date)}
                      </span>
                    </motion.div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-1">
                    {group.messages.map((message, index) => {
                      const prevMessage =
                        index > 0 ? group.messages[index - 1] : null;
                      const showAvatar =
                        !prevMessage || prevMessage.userId !== message.userId;
                      const showTimestamp =
                        !prevMessage ||
                        new Date(message.createdAt).getTime() -
                          new Date(prevMessage.createdAt).getTime() >
                          5 * 60 * 1000; // 5 minutes

                      return (
                        <MessageItem
                          key={message.id}
                          message={message}
                          showAvatar={showAvatar}
                          showTimestamp={showTimestamp}
                          isOwn={message.userId === user?.id}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typingInChannel.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator userIds={typingInChannel} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 right-6"
          >
            <button
              onClick={scrollToBottom}
              className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 group"
            >
              <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
