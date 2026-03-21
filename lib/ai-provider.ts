import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export type AiProvider = "claude-cli" | "gemini-cli" | "codex-cli" | "openai-api" | "gemini-api";

export interface AiProviderInfo {
  id: AiProvider;
  label: string;
  available: boolean;
  type: "cli" | "api";
}

export interface AiRequest {
  provider: AiProvider;
  prompt: string;
}

export interface AiResponse {
  success: boolean;
  provider: string;
  result?: any;
  error?: string;
}

/**
 * CLI 도구가 설치되어 있는지 확인
 */
function checkCliAvailable(command: string): boolean {
  try {
    execSync(`which ${command}`, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * 사용 가능한 AI 프로바이더 목록 반환
 */
export function getAvailableProviders(): AiProviderInfo[] {
  const providers: AiProviderInfo[] = [
    {
      id: "claude-cli",
      label: "Claude CLI",
      available: checkCliAvailable("claude"),
      type: "cli",
    },
    {
      id: "gemini-cli",
      label: "Gemini CLI",
      available: checkCliAvailable("gemini"),
      type: "cli",
    },
    {
      id: "codex-cli",
      label: "Codex CLI",
      available: checkCliAvailable("codex"),
      type: "cli",
    },
    {
      id: "openai-api",
      label: "OpenAI API",
      available: !!process.env.OPENAI_API_KEY,
      type: "api",
    },
    {
      id: "gemini-api",
      label: "Gemini API",
      available: !!process.env.GEMINI_API_KEY,
      type: "api",
    },
  ];

  return providers;
}

/**
 * CLI 도구를 실행하여 AI 응답 가져오기
 */
async function executeCliProvider(provider: AiProvider, prompt: string): Promise<AiResponse> {
  const tempFile = path.join("/tmp", `ai-prompt-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);

  try {
    // 프롬프트를 임시 파일에 작성
    fs.writeFileSync(tempFile, prompt, "utf-8");

    let command: string;
    switch (provider) {
      case "claude-cli":
        command = `cat "${tempFile}" | claude --print`;
        break;
      case "gemini-cli":
        command = `cat "${tempFile}" | gemini`;
        break;
      case "codex-cli":
        command = `cat "${tempFile}" | codex --quiet`;
        break;
      default:
        throw new Error(`지원하지 않는 CLI 프로바이더: ${provider}`);
    }

    // CLI 실행 (60초 타임아웃)
    const output = execSync(command, {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    // JSON 추출
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        provider,
        error: "CLI 응답에서 JSON을 찾을 수 없습니다",
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      provider,
      result,
    };
  } catch (err: any) {
    if (err.code === "ETIMEDOUT") {
      return {
        success: false,
        provider,
        error: "CLI 실행 시간이 초과되었습니다 (60초)",
      };
    }
    return {
      success: false,
      provider,
      error: `CLI 실행 실패: ${err.message || String(err)}`,
    };
  } finally {
    // 임시 파일 정리
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch {
      // 정리 실패는 무시
    }
  }
}

/**
 * API를 통해 AI 응답 가져오기
 */
async function executeApiProvider(provider: AiProvider, prompt: string): Promise<AiResponse> {
  try {
    let result: any;

    if (provider === "openai-api") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          provider,
          error: "OPENAI_API_KEY가 설정되지 않았습니다",
        };
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          provider,
          error: `OpenAI API 오류 (${res.status}): ${errorData.error?.message || "알 수 없는 오류"}`,
        };
      }

      const data = await res.json();
      result = JSON.parse(data.choices[0].message.content);
    } else if (provider === "gemini-api") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          provider,
          error: "GEMINI_API_KEY가 설정되지 않았습니다",
        };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          provider,
          error: `Gemini API 오류 (${res.status}): ${errorData.error?.message || "알 수 없는 오류"}`,
        };
      }

      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      result = JSON.parse(text);
    } else {
      return {
        success: false,
        provider,
        error: `지원하지 않는 API 프로바이더: ${provider}`,
      };
    }

    return {
      success: true,
      provider,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      provider,
      error: `API 요청 실패: ${err.message || String(err)}`,
    };
  }
}

/**
 * AI 프로바이더 실행 (CLI 또는 API)
 */
export async function executeAi(request: AiRequest): Promise<AiResponse> {
  const { provider, prompt } = request;

  // 프로바이더가 사용 가능한지 확인
  const providers = getAvailableProviders();
  const providerInfo = providers.find((p) => p.id === provider);

  if (!providerInfo) {
    return {
      success: false,
      provider,
      error: `존재하지 않는 프로바이더: ${provider}`,
    };
  }

  if (!providerInfo.available) {
    return {
      success: false,
      provider,
      error: `사용할 수 없는 프로바이더: ${providerInfo.label}. ${
        providerInfo.type === "cli"
          ? "CLI 도구가 설치되지 않았습니다"
          : "API 키가 설정되지 않았습니다"
      }`,
    };
  }

  // 타입에 따라 실행
  if (providerInfo.type === "cli") {
    return executeCliProvider(provider, prompt);
  } else {
    return executeApiProvider(provider, prompt);
  }
}
