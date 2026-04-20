"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";
import {
  Activity,
  Database,
  Wifi,
  HardDrive,
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface HealthCheck {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      status: string;
      responseTime: number;
    };
    socket: {
      status: string;
      connections: number;
    };
    memory: {
      status: string;
      usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
    };
  };
}

export function SystemStatus() {
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/health/detailed");
      setHealthData(response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "ok":
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "unhealthy":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center p-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900">
          Unable to load system status
        </p>
        <Button onClick={fetchHealthData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={fetchHealthData}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(healthData.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                System {healthData.status}
              </h3>
              <p className="text-sm text-gray-500">
                Uptime: {formatUptime(healthData.uptime)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Environment</p>
            <p className="font-medium">{healthData.environment}</p>
          </div>
        </div>
      </motion.div>

      {/* Service Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Database</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData.checks.database.status)}
                <span className="text-sm font-medium">
                  {healthData.checks.database.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Response Time</span>
              <span className="text-sm font-medium">
                {healthData.checks.database.responseTime}ms
              </span>
            </div>
          </div>
        </motion.div>

        {/* Socket.IO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Wifi className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">WebSocket</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData.checks.socket.status)}
                <span className="text-sm font-medium">
                  {healthData.checks.socket.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Connections</span>
              <span className="text-sm font-medium">
                {healthData.checks.socket.connections}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Memory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <MemoryStick className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Memory</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData.checks.memory.status)}
                <span className="text-sm font-medium">
                  {healthData.checks.memory.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Heap Used</span>
              <span className="text-sm font-medium">
                {healthData.checks.memory.usage.heapUsed}MB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">RSS</span>
              <span className="text-sm font-medium">
                {healthData.checks.memory.usage.rss}MB
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
