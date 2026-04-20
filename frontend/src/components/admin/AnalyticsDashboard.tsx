"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Activity,
  FileText,
  Hash,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  workspace?: {
    members: { total: number };
    channels: { total: number };
    messages: {
      total: number;
      lastDay: number;
      lastWeek: number;
      lastMonth: number;
    };
    activeUsers: { lastDay: number; lastWeek: number };
    files: { total: number; totalSize: number };
  };
  trends?: Array<{
    date: string;
    messages: number;
  }>;
  engagement?: {
    messages: { lastWeek: number; lastMonth: number };
    reactions: { given: number; received: number };
    files: { uploaded: number };
    engagement: { channelsActive: number };
  };
}

interface AnalyticsDashboardProps {
  workspaceId?: string;
  type: "workspace" | "user" | "system";
}

export function AnalyticsDashboard({
  workspaceId,
  type,
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoints: string[] = [];

      if (type === "workspace" && workspaceId) {
        endpoints = [
          `/analytics/workspace/${workspaceId}`,
          `/analytics/workspace/${workspaceId}/trends?days=7`,
        ];
      } else if (type === "user") {
        endpoints = ["/analytics/user/engagement"];
      } else if (type === "system") {
        endpoints = ["/analytics/system"];
      }

      const responses = await Promise.all(
        endpoints.map((endpoint) => apiClient.get(endpoint)),
      );

      const newData: AnalyticsData = {};

      if (type === "workspace") {
        newData.workspace = responses[0]?.data?.stats;
        newData.trends = responses[1]?.data?.trends;
      } else if (type === "user") {
        newData.engagement = responses[0]?.data?.engagement;
      } else if (type === "system") {
        newData.workspace = responses[0]?.data?.stats; // System stats have similar structure
      }

      setData(newData);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [workspaceId, type, timeframe]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchAnalytics}>
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
          <h2 className="text-2xl font-bold text-gray-900">
            {type === "workspace"
              ? "Workspace Analytics"
              : type === "user"
                ? "Your Activity"
                : "System Analytics"}
          </h2>
          <p className="text-sm text-gray-500">
            Overview of activity and engagement metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workspace Analytics */}
      {type === "workspace" && data.workspace && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Members"
              value={data.workspace.members.total}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Channels"
              value={data.workspace.channels.total}
              icon={Hash}
              color="green"
            />
            <StatCard
              title="Messages Today"
              value={data.workspace.messages.lastDay}
              icon={MessageSquare}
              change={`${data.workspace.messages.lastWeek} this week`}
              color="purple"
            />
            <StatCard
              title="Active Users"
              value={data.workspace.activeUsers.lastDay}
              icon={Activity}
              change={`${data.workspace.activeUsers.lastWeek} this week`}
              color="orange"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Messages"
              value={data.workspace.messages.total.toLocaleString()}
              icon={MessageSquare}
              color="indigo"
            />
            <StatCard
              title="Files Uploaded"
              value={data.workspace.files.total}
              icon={FileText}
              color="pink"
            />
            <StatCard
              title="Storage Used"
              value={formatFileSize(data.workspace.files.totalSize)}
              icon={BarChart3}
              color="yellow"
            />
          </div>

          {/* Message Trends Chart */}
          {data.trends && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Message Activity Trends
              </h3>
              <div className="h-64 flex items-end space-x-2">
                {data.trends.map((day, index) => {
                  const maxMessages = Math.max(
                    ...data.trends!.map((d) => d.messages),
                  );
                  const height =
                    maxMessages > 0 ? (day.messages / maxMessages) * 100 : 0;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="w-full bg-indigo-500 rounded-t-sm min-h-[4px]"
                        title={`${day.messages} messages on ${day.date}`}
                      />
                      <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* User Engagement Analytics */}
      {type === "user" && data.engagement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Messages This Week"
            value={data.engagement.messages.lastWeek}
            icon={MessageSquare}
            change={`${data.engagement.messages.lastMonth} this month`}
            color="blue"
          />
          <StatCard
            title="Reactions Given"
            value={data.engagement.reactions.given}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Reactions Received"
            value={data.engagement.reactions.received}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Files Uploaded"
            value={data.engagement.files.uploaded}
            icon={FileText}
            color="orange"
          />
        </div>
      )}

      {/* Engagement Summary */}
      {type === "user" && data.engagement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Engagement Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Channels</span>
              <span className="font-medium">
                {data.engagement.engagement.channelsActive}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Engagement Score</span>
              <span className="font-medium text-green-600">
                {Math.min(
                  100,
                  data.engagement.messages.lastWeek * 2 +
                    data.engagement.reactions.given +
                    data.engagement.reactions.received +
                    data.engagement.files.uploaded * 5,
                )}
                %
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
