"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkspaceStore } from "@/store/workspace.store";

export default function JoinWorkspacePage() {
  const router = useRouter();
  const { joinWorkspace, isLoading, error, clearError } = useWorkspaceStore();
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await joinWorkspace(inviteCode);
      // Redirect will be handled by the store after successful join
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join Workspace</h1>
          <p className="mt-2 text-gray-600">
            Enter your invite code to join a workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Invite Code"
            type="text"
            placeholder="Enter workspace invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            error={error || undefined}
            required
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-md bg-red-50 p-3"
            >
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Join Workspace
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an invite code?{" "}
            <button
              onClick={() => router.push("/workspace")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to workspaces
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
