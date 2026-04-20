"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";

interface Backup {
  filename: string;
  path: string;
  size: number;
  created: string;
  type: "database" | "files";
}

interface BackupStatus {
  lastBackup: {
    timestamp: string;
    database: string;
    files: string;
  } | null;
  totalBackups: number;
  totalSize: number;
  oldestBackup: string;
  newestBackup: string;
}

export function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduleExpression, setScheduleExpression] = useState("0 2 * * *"); // Daily at 2 AM

  useEffect(() => {
    fetchBackups();
    fetchStatus();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/backup", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.data.backups);
      }
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/backup/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.data.status);
      }
    } catch (error) {
      console.error("Failed to fetch backup status:", error);
    }
  };

  const createBackup = async (type: "database" | "files" | "full") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/backup/${type}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast.success(`${type} backup created successfully`);
        fetchBackups();
        fetchStatus();
      } else {
        throw new Error("Backup failed");
      }
    } catch (error) {
      toast.error(`Failed to create ${type} backup`);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;

    try {
      const response = await fetch(`/api/backup/${filename}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast.success("Backup deleted successfully");
        fetchBackups();
        fetchStatus();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete backup");
    }
  };

  const scheduleBackup = async () => {
    try {
      const response = await fetch("/api/backup/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ cronExpression: scheduleExpression }),
      });

      if (response.ok) {
        toast.success("Backup scheduled successfully");
      } else {
        throw new Error("Schedule failed");
      }
    } catch (error) {
      toast.error("Failed to schedule backup");
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Backup Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status.totalBackups}
              </div>
              <div className="text-sm text-gray-500">Total Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatFileSize(status.totalSize)}
              </div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {status.lastBackup
                  ? formatDate(status.lastBackup.timestamp)
                  : "Never"}
              </div>
              <div className="text-sm text-gray-500">Last Backup</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {status.newestBackup ? formatDate(status.newestBackup) : "N/A"}
              </div>
              <div className="text-sm text-gray-500">Latest</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Backup Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create Backup
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => createBackup("database")}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Database Backup
          </Button>
          <Button
            onClick={() => createBackup("files")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            Files Backup
          </Button>
          <Button
            onClick={() => createBackup("full")}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Full Backup
          </Button>
        </div>
      </motion.div>

      {/* Schedule Backup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule Automatic Backup
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cron Expression
            </label>
            <input
              type="text"
              value={scheduleExpression}
              onChange={(e) => setScheduleExpression(e.target.value)}
              placeholder="0 2 * * * (Daily at 2 AM)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: minute hour day month weekday
            </p>
          </div>
          <Button
            onClick={scheduleBackup}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Schedule
          </Button>
        </div>
      </motion.div>

      {/* Backup List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Backup History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.filename} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {backup.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        backup.type === "database"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {backup.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(backup.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteBackup(backup.filename)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No backups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
