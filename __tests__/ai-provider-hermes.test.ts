import { execSync } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";

const { execSyncMock } = vi.hoisted(() => ({
  execSyncMock: vi.fn(),
}));

vi.mock("child_process", () => ({
  default: { execSync: execSyncMock },
  execSync: execSyncMock,
}));

describe("Hermes Agent AI provider", () => {
  const originalHermesCliPath = process.env.HERMES_CLI_PATH;

  afterEach(() => {
    if (originalHermesCliPath === undefined) {
      delete process.env.HERMES_CLI_PATH;
    } else {
      process.env.HERMES_CLI_PATH = originalHermesCliPath;
    }
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("Hermes CLI가 설치되어 있으면 provider 목록에 사용 가능으로 노출한다", async () => {
    process.env.HERMES_CLI_PATH = "hermes";
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === "which hermes") return "/usr/local/bin/hermes\n";
      throw new Error("not found");
    });

    const { getAvailableProviders } = await import("@/lib/ai-provider");

    expect(getAvailableProviders()).toContainEqual({
      id: "hermes-agent",
      label: "Hermes Agent",
      available: true,
      type: "cli",
    });
  });

  it("Hermes Agent provider는 hermes chat one-shot 명령으로 리뷰 프롬프트를 실행한다", async () => {
    process.env.HERMES_CLI_PATH = "hermes";
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === "which hermes") return "/usr/local/bin/hermes\n";
      if (command.startsWith("which ")) throw new Error("not found");
      if (command.includes(" chat -q") && command.includes("--toolsets safe") && command.includes("--source youngsu-blog-admin-review")) {
        return "## ⭐ 종합 평가\n- 5/5\n- 최종 판단: 발행 가능\n";
      }
      throw new Error(`unexpected command: ${command}`);
    });

    const { executeAi } = await import("@/lib/ai-provider");
    const response = await executeAi({ provider: "hermes-agent", prompt: "리뷰해줘" });

    expect(response).toEqual({
      success: true,
      provider: "hermes-agent",
      result: "## ⭐ 종합 평가\n- 5/5\n- 최종 판단: 발행 가능",
    });
  });
});
