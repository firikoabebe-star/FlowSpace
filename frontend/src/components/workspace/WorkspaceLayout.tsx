"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { useToastContext } from "@/providers/ToastProvider";
import { Sidebar } from "./Sidebar";
import { ChannelView } from "./ChannelView";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Menu, Hash, Users } from "lucide-react";

export function WorkspaceLayout() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentWorkspace,
    currentChannel,
    selectWorkspace,
    selectChannel,
    isLoading,
    error,
  } = useWorkspaceStore();

  const toast = useToastContext();

  // Initialize socket connection
  useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const workspaceSlug = params.slug as string;
  const channelId = params.channelId as string;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (workspaceSlug && workspaceSlug !== currentWorkspace?.slug) {
      selectWorkspace(workspaceSlug);
    }
  }, [workspaceSlug, currentWorkspace?.slug, selectWorkspace]);

  useEffect(() => {
    if (channelId && channelId !== currentChannel?.id) {
      selectChannel(channelId);
    }
  }, [channelId, currentChannel?.id, selectChannel]);

  // Redirect to first channel if no channel is selected
  useEffect(() => {
    if (
      currentWorkspace &&
      !channelId &&
      currentWorkspace.channels?.length > 0
    ) {
      const firstChannel = currentWorkspace.channels[0];
      router.push(`/workspace/${workspaceSlug}/${firstChannel.id}`);
    }
  }, [currentWorkspace, channelId, workspaceSlug, router]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Error", error);
    }
  }, [error, toast]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [channelId, isMobile]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading workspace..." />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-400" />}
          title="Workspace not found"
          description="The workspace you're looking for doesn't exist or you don't have access to it."
          action={{
            label: "Back to Workspaces",
            onClick: () => router.push("/workspace"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <ConnectionStatus />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen || !isMobile ? 0 : -256,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`
          ${isMobile ? "fixed" : "relative"} inset-y-0 left-0 z-50 w-64 bg-gray-900 
          ${isMobile ? "shadow-xl" : ""}
        `}
      >
        <Sidebar
          workspace={currentWorkspace}
          currentChannel={currentChannel}
          onChannelSelect={(channel) => {
            router.push(`/workspace/${workspaceSlug}/${channel.id}`);
            if (isMobile) setSidebarOpen(false);
          }}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 shadow-sm"
        >
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3 p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {currentChannel && (
              <div className="flex items-center min-w-0">
                <div className="flex items-center text-gray-500 mr-2">
                  <Hash className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {currentChannel.name}
                  </h1>
                  {currentChannel.description && (
                    <p className="text-sm text-gray-500 truncate hidden sm:block">
                      {currentChannel.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Member count */}
            {currentChannel && (
              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                <span>{currentChannel.members?.length || 0}</span>
              </div>
            )}

            {/* User profile */}
            <div className="flex items-center">
              <motion.img
                whileHover={{ scale: 1.05 }}
                className="h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-indigo-200 transition-all cursor-pointer"
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || "")}&background=6366f1&color=fff`
                }
                alt={user?.displayName}
              />
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline truncate max-w-32">
                {user?.displayName}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Channel content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentChannel ? (
              <motion.div
                key={currentChannel.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ChannelView channel={currentChannel} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <EmptyState
                  icon={<Hash className="w-8 h-8 text-gray-400" />}
                  title={`Welcome to ${currentWorkspace.name}`}
                  description="Select a channel from the sidebar to start chatting with your team."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
