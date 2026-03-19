"use client";

import { useState, useEffect } from "react";
import { Folder, Upload, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";

interface FileInfo {
  filename: string;
  path: string;
  size: number;
  modifiedAt: string;
}

interface ImportResult {
  file: string;
  success: boolean;
  error?: string;
  outputPath?: string;
}

export default function ObsidianPage() {
  const [vaultPath, setVaultPath] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [targetCollection, setTargetCollection] = useState<"posts" | "articles" | "notes" | "library">("posts");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("obsidian_vault_path");
    if (saved) setVaultPath(saved);
  }, []);

  const handleLoadFiles = async () => {
    if (!vaultPath.trim()) {
      alert("Vault 경로를 입력해주세요");
      return;
    }

    setLoading(true);
    setFiles([]);
    setSelectedFiles(new Set());
    setResults([]);

    try {
      const res = await fetch(`/api/admin/obsidian?path=${encodeURIComponent(vaultPath)}`);
      const data = await res.json();

      if (data.success) {
        setFiles(data.files);
        localStorage.setItem("obsidian_vault_path", vaultPath);
      } else {
        alert(data.error || "파일 목록을 불러오는데 실패했습니다");
      }
    } catch (error) {
      console.error("Load files error:", error);
      alert("파일 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFile = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.path)));
    }
  };

  const handleImport = async () => {
    if (selectedFiles.size === 0) {
      alert("가져올 파일을 선택해주세요");
      return;
    }

    setImporting(true);
    setResults([]);

    try {
      const res = await fetch("/api/admin/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: Array.from(selectedFiles),
          targetCollection,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setSelectedFiles(new Set());
        alert(`가져오기 완료: 성공 ${data.summary.success}개, 실패 ${data.summary.failed}개`);
      } else {
        alert(data.error || "파일 가져오기에 실패했습니다");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("파일 가져오기에 실패했습니다");
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Vault Path Input */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Obsidian Vault 경로</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            placeholder="/Users/username/Documents/ObsidianVault"
            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleLoadFiles()}
          />
          <button
            onClick={handleLoadFiles}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              "불러오기"
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Obsidian vault의 절대 경로를 입력하세요. 경로는 로컬스토리지에 저장됩니다.</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">파일 목록 ({files.length}개)</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={targetCollection}
                onChange={(e) => setTargetCollection(e.target.value as any)}
                className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="posts">Posts</option>
                <option value="articles">Articles</option>
                <option value="notes">Notes</option>
                <option value="library">Library</option>
              </select>
              <button
                onClick={handleToggleAll}
                className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-accent"
              >
                {selectedFiles.size === files.length ? "전체 해제" : "전체 선택"}
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFiles.size === 0 || importing}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    가져오는 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    가져오기 ({selectedFiles.size})
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.path}
                className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
                  selectedFiles.has(file.path) ? "bg-accent border-primary" : ""
                }`}
                onClick={() => handleToggleFile(file.path)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => {}}
                  className="h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.filename}</p>
                  <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{formatDate(file.modifiedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Results */}
      {results.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5" />
            <h2 className="text-lg font-semibold">가져오기 결과</h2>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 border rounded-md">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.file}</p>
                  {result.success && result.outputPath && (
                    <p className="text-xs text-green-600 truncate">→ {result.outputPath}</p>
                  )}
                  {!result.success && result.error && (
                    <p className="text-xs text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
