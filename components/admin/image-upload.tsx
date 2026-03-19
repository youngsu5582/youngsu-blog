"use client";

import { useState, useRef } from "react";
import { Upload, Check, Copy, X } from "lucide-react";

interface UploadedFile {
  name: string;
  path: string;
}

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "업로드 실패");
      }

      setUploadedFiles((prev) => [...data.files, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleCopy = (path: string, index: number) => {
    navigator.clipboard.writeText(path);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">이미지 업로드</p>
        <p className="text-xs text-muted-foreground">
          클릭하거나 드래그앤드롭으로 파일 선택 (여러 파일 가능)
        </p>
      </div>

      {/* Loading state */}
      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <p className="text-xs text-muted-foreground mt-2">업로드 중...</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">업로드된 이미지</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{file.path}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(file.path, index)}
                    className="p-1.5 rounded hover:bg-background transition-colors"
                    title="경로 복사"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded hover:bg-background transition-colors"
                    title="목록에서 제거"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
