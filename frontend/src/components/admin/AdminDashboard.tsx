"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SystemStatus } from "./SystemStatus";
import { BackupManagement } from "./BackupManagement";
import { AuditLogViewer } from "./AuditLogViewer";
import { MonitoringDashboard } from "./MonitoringDashboard";

type TabType = "analytics" | "system" | "backup" | "audit" | "monitoring";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");

  const tabs = [
    { id: "analytics" as TabType, label: "Analytics", icon: "📊" },
    { id: "system" as TabType, label: "System Status", icon: "🖥️" },
    { id: "monitoring" as TabType, label: "Monitoring", icon: "📈" },
    { id: "backup" as TabType, label: "Backup Management", icon: "💾" },
    { id: "audit" as TabType, label: "Audit Logs", icon: "📋" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsDashboard />;
      case "system":
        return <SystemStatus />;
      case "monitoring":
        return <MonitoringDashboard />;
      case "backup":
        return <BackupManagement />;
      case "audit":
        return <AuditLogViewer />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                FlowSpace Enterprise Admin Panel
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
