"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Workspace } from "@/types";
import { ChevronDown, Plus, Settings } from "lucide-react";

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onWorkspaceChange: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  onWorkspaceSettings: (workspace: Workspace) => void;
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
  onWorkspaceChange,
  onCreateWorkspace,
  onWorkspaceSettings,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="w-full justify-between p-3 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
            {getWorkspaceInitials(currentWorkspace.name)}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 truncate">
              {currentWorkspace.name}
            </p>
            <p className="text-xs text-gray-500">
              {currentWorkspace._count?.members || 0} members
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2">
                Your Workspaces
              </div>

              {workspaces.map((workspace, index) => (
                <motion.button
                  key={workspace.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-gray-100 transition-colors ${
                    workspace.id === currentWorkspace.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    onWorkspaceChange(workspace);
                    setIsOpen(false);
                  }}
                >
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold ${
                      workspace.id === currentWorkspace.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {getWorkspaceInitials(workspace.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{workspace.name}</p>
                    <p className="text-xs text-gray-500">
                      {workspace._count?.members || 0} members
                    </p>
                  </div>
                  {workspace.id === currentWorkspace.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkspaceSettings(workspace);
                        setIsOpen(false);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                </motion.button>
              ))}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onCreateWorkspace();
                    setIsOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
