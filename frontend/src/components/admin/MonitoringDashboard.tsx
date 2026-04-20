"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";

interface SystemStatus {
  overall: string;
  timestamp: string;
  metrics: Record<string, any>;
  alerts: {
    active: Array<{
      id: string;
      name: string;
      severity: string;
      lastTriggered: string;
    }>;
    total: number;
    enabled: number;
  };
}

interface SecurityEvent {
  type: string;
  severity: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
}

interface NotificationChannel {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
}

export function MonitoringDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [notificationChannels, setNotificationChannels] = useState<
    NotificationChannel[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "alerts" | "security" | "notifications"
  >("overview");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, eventsRes, channelsRes] = await Promise.all([
        fetch("/api/monitoring/status", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
        fetch("/api/monitoring/security/events?hours=24", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
        fetch("/api/monitoring/notifications/channels", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData.data.status);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setSecurityEvents(eventsData.data.events);
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setNotificationChannels(channelsData.data.channels);
      }
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "degraded":
        return "text-orange-600 bg-orange-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const testNotificationChannel = async (channelId: string) => {
    try {
      const response = await fetch(
        `/api/monitoring/notifications/channels/${channelId}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Test notification sent successfully");
      } else {
        toast.error("Failed to send test notification");
      }
    } catch (error) {
      toast.error("Failed to test notification channel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: "System Overview", icon: "📊" },
            { id: "alerts", label: "Alerts & Monitoring", icon: "🚨" },
            { id: "security", label: "Security Events", icon: "🔒" },
            { id: "notifications", label: "Notifications", icon: "📢" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* System Overview */}
      {activeTab === "overview" && systemStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                System Status
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus.overall)}`}
              >
                {systemStatus.overall.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(systemStatus.timestamp)}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(systemStatus.metrics).map(
              ([key, data]: [string, any]) => (
                <div
                  key={key}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.current !== null ? data.current.toFixed(2) : "N/A"}
                  </div>
                  {data.stats && (
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {data.stats.avg?.toFixed(2)} | Max:{" "}
                      {data.stats.max?.toFixed(2)}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {/* Active Alerts */}
          {systemStatus.alerts.active.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active Alerts
              </h3>
              <div className="space-y-3">
                {systemStatus.alerts.active.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {alert.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Triggered: {formatDate(alert.lastTriggered)}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Security Events */}
      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Security Events (Last 24 Hours)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {securityEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <details className="cursor-pointer">
                        <summary>View Details</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
                {securityEvents.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No security events in the last 24 hours
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Notification Channels */}
      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Notification Channels
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notificationChannels.map((channel) => (
                <div key={channel.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {channel.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        channel.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {channel.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    Type: {channel.type}
                  </div>
                  <Button
                    onClick={() => testNotificationChannel(channel.id)}
                    disabled={!channel.enabled}
                    className="w-full text-sm"
                  >
                    Test Channel
                  </Button>
                </div>
              ))}
              {notificationChannels.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No notification channels configured
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
