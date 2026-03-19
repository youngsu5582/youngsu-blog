import { execSync } from "child_process";
import { CheckCircle, XCircle, Key, GitBranch, Info } from "lucide-react";

function getEnvStatus(key: string): boolean {
  return !!process.env[key];
}

function getGitInfo() {
  try {
    const remote = execSync("git remote -v", { encoding: "utf-8" }).trim();
    const branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
    return { remote, branch, error: null };
  } catch (error) {
    return { remote: "", branch: "", error: "Git 정보를 가져올 수 없습니다" };
  }
}

export default function SettingsPage() {
  const apiKeys = [
    { name: "OPENAI_API_KEY", label: "OpenAI API Key" },
    { name: "GEMINI_API_KEY", label: "Gemini API Key" },
    { name: "GOOGLE_API_KEY", label: "Google API Key" },
  ];

  const gitInfo = getGitInfo();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* API Keys Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5" />
          <h2 className="text-lg font-semibold">API 키 상태</h2>
        </div>
        <div className="space-y-3">
          {apiKeys.map((key) => {
            const isSet = getEnvStatus(key.name);
            return (
              <div key={key.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span className="text-sm font-medium">{key.label}</span>
                <div className="flex items-center gap-2">
                  {isSet ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">설정됨</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">미설정</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Git Info Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Git 정보</h2>
        </div>
        {gitInfo.error ? (
          <p className="text-sm text-muted-foreground">{gitInfo.error}</p>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">현재 브랜치</h3>
              <code className="text-sm bg-muted px-2 py-1 rounded">{gitInfo.branch}</code>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1">리모트 저장소</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">{gitInfo.remote}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Environment Variables Guide */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5" />
          <h2 className="text-lg font-semibold">환경변수 설정</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>환경변수는 프로젝트 루트의 <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code> 파일에서 설정할 수 있습니다.</p>
          <p className="text-xs">경로: <code className="bg-muted px-1.5 py-0.5 rounded">{process.cwd()}/.env.local</code></p>
        </div>
      </div>
    </div>
  );
}
