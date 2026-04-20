"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { socketManager } from "@/lib/socket";

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connected = socketManager.connected;
      setIsConnected(connected);

      // Show status when disconnected or reconnecting
      if (!connected || isReconnecting) {
        setShowStatus(true);
      } else {
        // Hide status after a delay when connected
        setTimeout(() => setShowStatus(false), 2000);
      }
    };

    // Check initial connection
    checkConnection();

    // Listen for connection changes
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [isReconnecting]);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsReconnecting(true);
      setTimeout(() => setIsReconnecting(false), 3000);
    };

    const handleOffline = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div
          className={`
          flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium
          ${
            isConnected
              ? "bg-green-100 text-green-800 border border-green-200"
              : isReconnecting
                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                : "bg-red-100 text-red-800 border border-red-200"
          }
        `}
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </>
          ) : isReconnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <AlertCircle className="h-4 w-4" />
              </motion.div>
              <span>Reconnecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Disconnected</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
