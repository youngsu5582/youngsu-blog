/**
 * Admin AI 기능이 쓰는 워크벤치 템플릿을 이 저장소의 정의(lib/workbench-templates.ts)대로 맞춘다.
 *
 *   pnpm workbench:sync            # 이름으로 찾아 없으면 만들고, 있으면 정의대로 고친다
 *   pnpm workbench:sync --dry-run  # 무엇이 바뀔지만 보여 준다
 *
 * WORKBENCH_BASE_URL · WORKBENCH_API_KEY 가 필요하다(환경 변수 또는 .env.local).
 * 키는 템플릿을 둘 서비스의 서비스 키다 — 템플릿은 키의 서비스에 만들어진다.
 * 워크벤치 콘솔에서 고친 내용은 덮어쓴다. 정본은 이 저장소다.
 */
import fs from "fs";
import { listWorkbenchTemplates, workbenchRequest } from "@/lib/workbench";
import { WORKBENCH_TEMPLATES } from "@/lib/workbench-templates";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const existing = new Map((await listWorkbenchTemplates()).map((t) => [t.name, t.uuid]));

  for (const [feature, template] of Object.entries(WORKBENCH_TEMPLATES)) {
    const uuid = existing.get(template.name);
    const body = JSON.stringify({
      name: template.name,
      option: template.option,
      inputImageCount: template.inputImageCount,
      model: template.model,
    });
    const action = uuid ? "고침" : "만듦";
    if (dryRun) {
      console.log(`[dry-run] ${action} ${feature}: ${template.name}${uuid ? ` (${uuid})` : ""}`);
      continue;
    }
    const res = uuid
      ? await workbenchRequest(`/api/templates/${uuid}`, { method: "PUT", body })
      : await workbenchRequest("/api/templates", { method: "POST", body });
    const saved = await res.json();
    console.log(`${action} ${feature}: ${template.name} → ${saved.uuid} (변수: ${(saved.variables ?? []).join(", ")})`);
  }
}

main().catch((err) => {
  console.error(`워크벤치 템플릿 동기화 실패: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
