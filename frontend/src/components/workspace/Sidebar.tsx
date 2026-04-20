"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Workspace, Channel } from "@/types";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import {
  Hash,
  Lock,
  Plus,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  workspace: Workspace;
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onCloseSidebar: () => void;
}

export function Sidebar({
  workspace,
  currentChannel,
  onChannelSelect,
  onCloseSidebar,
}: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { createChannel } = useWorkspaceStore();
  const [showChannels, setShowChannels] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const publicChannels =
    workspace.channels?.filter((channel) => !channel.isPrivate) || [];
  const privateChannels =
    workspace.channels?.filter((channel) => channel.isPrivate) || [];

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Workspace header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
            <p className="text-sm text-gray-400">@{workspace.slug}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={onCloseSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Channels Section */}
        <div className="p-2">
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="flex items-center w-full px-2 py-1 text-sm font-medium text-gray-300 hover:text-white rounded"
          >
            {showChannels ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            Channels
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto p-1 h-6 w-6 text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateChannel(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </button>

          <AnimatePresence>
            {showChannels && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 space-y-1"
              >
                {publicChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={currentChannel?.id === channel.id}
                    onClick={() => onChannelSelect(channel)}
                  />
                ))}

                {privateChannels.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider mt-4">
                      Private Channels
                    </div>
                    {privateChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={currentChannel?.id === channel.id}
                        onClick={() => onChannelSelect(channel)}
                        isPrivate
                      />
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Messages Section */}
        <div className="p-2 mt-4">
          <button className="flex items-center w-full px-2 py-1 text-sm font-medium text-gray-300 hover:text-white rounded">
            <ChevronRight className="h-4 w-4 mr-1" />
            Direct Messages
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto p-1 h-6 w-6 text-gray-400 hover:text-white"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </button>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white"
          onClick={() => router.push("/workspace")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Workspace Settings
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateChannel && (
          <CreateChannelModal
            workspaceId={workspace.id}
            onClose={() => setShowCreateChannel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
  isPrivate = false,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
  isPrivate?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full px-2 py-1 text-sm rounded group
        ${
          isActive
            ? "bg-indigo-600 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }
      `}
    >
      {isPrivate ? (
        <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
      ) : (
        <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>
      {channel._count?.messages > 0 && (
        <span className="ml-auto text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">
          {channel._count.messages}
        </span>
      )}
    </button>
  );
}

function CreateChannelModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { createChannel, isLoading } = useWorkspaceStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChannel(workspaceId, { name, description, isPrivate });
      onClose();
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-md text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Create Channel</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="general"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isPrivate"
              className="ml-2 block text-sm text-gray-700"
            >
              Make this channel private
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Channel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
