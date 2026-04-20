"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Download, Eye, File, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface FilePreviewProps {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadedBy: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
    createdAt: string;
  };
}

export function FilePreview({ file }: FilePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = file.mimetype.startsWith("image/");
  const isPdf = file.mimetype === "application/pdf";
  const isText = file.mimetype === "text/plain";

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("File downloaded successfully", "success");
    } catch (error) {
      showToast("Failed to download file", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = () => {
    if (isImage) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const canPreview = isImage || isPdf || isText;

  return (
    <>
      <div className="border rounded-lg p-3 bg-gray-50 max-w-sm">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • Uploaded by{" "}
              {file.uploadedBy.displayName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-3">
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={file.originalName}
        size="lg"
      >
        <div className="space-y-4">
          {isImage && (
            <div className="text-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`}
                alt={file.originalName}
                className="max-w-full max-h-96 mx-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-image.png";
                }}
              />
            </div>
          )}

          {isPdf && (
            <div className="text-center">
              <iframe
                src={`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`}
                className="w-full h-96 border rounded-lg"
                title={file.originalName}
              />
            </div>
          )}

          {isText && (
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              <iframe
                src={`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`}
                className="w-full h-64 border-0"
                title={file.originalName}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
