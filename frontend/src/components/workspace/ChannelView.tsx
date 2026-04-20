"use client";

import { useEffect, useState } from "react";
import { Channel } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import { socketManager } from "@/lib/socket";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { MessageSearch } from "@/components/messages/MessageSearch";
import { Button } from "@/components/ui/Button";
import { Hash, Lock, Users, Settings, Search } from "lucide-react";

interface ChannelViewProps {
  channel: Channel;
}

export function ChannelView({ channel }: ChannelViewProps) {
  const { connected } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (connected && channel.id) {
      // Join the channel room for real-time updates
      socketManager.joinChannel(channel.id);

      // Cleanup when leaving channel
      return () => {
        socketManager.leaveChannel(channel.id);
      };
    }
  }, [connected, channel.id]);

  return (
    <div className="h-full flex flex-col">
      {/* Channel header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {channel.isPrivate ? (
              <Lock className="h-5 w-5 text-gray-500 mr-2" />
            ) : (
              <Hash className="h-5 w-5 text-gray-500 mr-2" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {channel.name}
              </h2>
              {channel.description && (
                <p className="text-sm text-gray-600">{channel.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-1" />
              {channel.members?.length || 0}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <MessageList channelId={channel.id} />

      {/* Message input */}
      <MessageInput channelId={channel.id} channelName={channel.name} />

      {/* Message search modal */}
      <MessageSearch
        channelId={channel.id}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
