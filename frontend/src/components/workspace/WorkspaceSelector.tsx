"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { generateAvatarUrl } from "@/lib/utils";
import { Plus, Settings, Users, Hash } from "lucide-react";

export function WorkspaceSelector() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    workspaces,
    currentWorkspace,
    fetchWorkspaces,
    selectWorkspace,
    isLoading,
  } = useWorkspaceStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleWorkspaceSelect = async (slug: string) => {
    await selectWorkspace(slug);
    router.push(`/workspace/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName}
          </h1>
          <p className="text-gray-600">Choose a workspace to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {workspaces.map((workspace) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleWorkspaceSelect(workspace.slug)}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-gray-500">@{workspace.slug}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{workspace._count?.members || 0} members</span>
                </div>
                <div className="flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  <span>{workspace.channels?.length || 0} channels</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {workspace.userRole}
                </span>
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          ))}

          {/* Create New Workspace Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-indigo-400 transition-colors flex flex-col items-center justify-center min-h-[200px]"
            onClick={() => setShowCreateForm(true)}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Create Workspace
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Start a new workspace for your team
            </p>
          </motion.div>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/workspace/join")}
            className="mr-4"
          >
            Join Workspace
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              // Handle logout
              router.push("/auth/login");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateWorkspaceModal onClose={() => setShowCreateForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { createWorkspace, isLoading } = useWorkspaceStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const workspace = await createWorkspace({
        name,
        slug: slug || undefined,
      });
      router.push(`/workspace/${workspace.slug}`);
      onClose();
    } catch (error) {
      // Error handled by store
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slug) {
      setSlug(generateSlug(newName));
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
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Workspace
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="My Awesome Team"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace URL
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                flowspace.com/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="my-awesome-team"
                required
              />
            </div>
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
              Create Workspace
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
