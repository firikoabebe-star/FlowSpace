"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        className={cn(
          "border-2 border-gray-200 border-t-indigo-600 rounded-full",
          sizeClasses[size],
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-sm text-gray-600"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-gray-200 rounded"></div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex items-start space-x-3 px-4 py-2">
      <SkeletonLoader className="h-8 w-8 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <SkeletonLoader className="h-4 w-20 bg-gray-200 rounded" />
          <SkeletonLoader className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <SkeletonLoader className="h-4 w-3/4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2 px-2 py-1">
          <SkeletonLoader className="h-4 w-4 bg-gray-600 rounded" />
          <SkeletonLoader className="h-4 flex-1 bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  );
}
