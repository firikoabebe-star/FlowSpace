"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Message } from "@/types";
import { useMessageStore } from "@/store/message.store";
import { formatTime, generateAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { FilePreview } from "./FilePreview";
import { MessageReactions } from "./MessageReactions";
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react";

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  showTimestamp: boolean;
  isOwn: boolean;
}

export function MessageItem({
  message,
  showAvatar,
  showTimestamp,
  isOwn,
}: MessageItemProps) {
  const { editMessage, deleteMessage } = useMessageStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await editMessage(message.id, editContent.trim());
        setIsEditing(false);
      } catch (error) {
        // Error handled by store
      }
    } else {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`group flex items-start space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors ${
          showAvatar ? "mt-2" : ""
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar */}
        <div className="shrink-0">
          {showAvatar ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-indigo-200 transition-all"
              src={
                message.user?.avatarUrl ||
                generateAvatarUrl(message.user?.displayName || "")
              }
              alt={message.user?.displayName}
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center">
              {showTimestamp && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showActions ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-gray-400"
                >
                  {formatTime(message.createdAt)}
                </motion.span>
              )}
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {showAvatar && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-baseline space-x-2"
            >
              <span className="text-sm font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer transition-colors">
                {message.user?.displayName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </motion.div>
          )}

          <div className="mt-1">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={Math.min(editContent.split("\n").length, 5)}
                  autoFocus
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={!editContent.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="relative">
                <div className="text-sm text-gray-900 whitespace-pre-wrap wrap-break-word leading-relaxed">
                  {message.isDeleted ? (
                    <span className="italic text-gray-500">
                      [Message deleted]
                    </span>
                  ) : (
                    <>
                      {message.content}
                      {message.isEdited && (
                        <span className="text-xs text-gray-400 ml-2">
                          (edited)
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* File attachment */}
                {message.file && (
                  <div className="mt-2">
                    <FilePreview file={message.file} />
                  </div>
                )}

                {/* Message reactions */}
                {!message.isDeleted && (
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions || []}
                    onReactionUpdate={() => {
                      // Refresh message reactions
                      // This could trigger a refetch of the message or update the store
                    }}
                  />
                )}

                {/* Message actions */}
                {isOwn && !message.isDeleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: showActions ? 1 : 0,
                      scale: showActions ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
