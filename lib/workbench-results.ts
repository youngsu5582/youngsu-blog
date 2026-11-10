import type { WorkbenchJob } from "@/lib/workbench";
import type { WorkbenchFeature } from "@/lib/workbench-templates";

export const WORKBENCH_FEATURES: readonly WorkbenchFeature[] = ["suggest", "review", "translate", "thumbnail"];

export function isWorkbenchFeature(value: unknown): value is WorkbenchFeature {
  return typeof value === "string" && (WORKBENCH_FEATURES as readonly string[]).includes(value);
}

type FinishedJob = Extract<WorkbenchJob, { done: true }>;
type Download = (sha256: string) => Promise<{ base64: string; mime: string }>;

/** 끝난 작업의 결과를 기능마다 기존 응답과 같은 모양으로 옮긴다. 화면은 어느 길로 왔는지 몰라도 된다. */
export async function toFeatureResult(
  feature: WorkbenchFeature,
  job: FinishedJob,
  download: Download
): Promise<Record<string, unknown>> {
  if (job.failure) return { success: false, error: `워크벤치 작업 실패: ${job.failure}` };
  const label = `workbench · ${job.model}`;

  if (feature === "thumbnail") {
    const sha256 = job.files[0];
    if (!sha256) return { success: false, error: "워크벤치 작업에 이미지가 없습니다" };
    const { base64, mime } = await download(sha256);
    return { success: true, base64, mime, prompt: "", method: label };
  }

  const content = job.texts[0];
  if (content === undefined) return { success: false, error: "워크벤치 작업에 글 결과가 없습니다" };
  if (feature === "review") {
    return typeof content === "string"
      ? { success: true, provider: label, review: content }
      : { success: false, error: "워크벤치 리뷰 결과가 글이 아닙니다" };
  }

  // 제안 · 번역은 JSON Schema 로 받았고, 워크벤치는 그 답을 객체로 준다. 객체가 아니면 약속이 깨진 것이다. 원문으로 대신하지 않고 실패로 알린다.
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return { success: false, error: "워크벤치 응답이 JSON 객체가 아닙니다" };
  }
  return feature === "suggest"
    ? { success: true, model: label, suggestion: content }
    : { success: true, provider: label, translation: content };
}
