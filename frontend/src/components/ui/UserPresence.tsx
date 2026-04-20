"use client";

import { motion } from "framer-motion";
import { generateAvatarUrl } from "@/lib/utils";

interface UserPresenceProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export function UserPresence({
  user,
  isOnline = false,
  size = "md",
  showStatus = true,
}: UserPresenceProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const statusSizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <div className="relative inline-block">
      <motion.img
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={`${sizeClasses[size]} rounded-full ring-2 ring-transparent hover:ring-indigo-200 transition-all`}
        src={user.avatarUrl || generateAvatarUrl(user.displayName)}
        alt={user.displayName}
        title={`${user.displayName} ${isOnline ? "(Online)" : "(Offline)"}`}
      />

      {showStatus && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
}
