import { NextResponse } from "next/server";
import { loadSuggestVocabulary } from "@/lib/suggest-vocabulary";
import { refineSuggestion } from "@/lib/taxonomy-vocabulary";
import { downloadWorkbenchFile, readWorkbenchJob, WorkbenchError } from "@/lib/workbench";
import { isWorkbenchFeature, toFeatureResult } from "@/lib/workbench-results";

/**
 * 워크벤치 작업의 진행을 읽는다. 끝나기 전에는 `{ pending: true }`, 끝나면 그 기능의 기존 응답과 같은 모양이다.
 * 화면은 이 경로를 몇 초마다 부른다(`readAiResult`). 키는 서버에만 있어 브라우저가 워크벤치를 직접 부르지 않는다.
 */
export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const query = new URL(req.url).searchParams;
  const feature = query.get("feature");
  if (!isWorkbenchFeature(feature)) {
    return NextResponse.json({ success: false, error: "feature 가 올바르지 않습니다" }, { status: 400 });
  }
  try {
    const job = await readWorkbenchJob(uuid);
    if (!job.done) return NextResponse.json({ pending: true, status: job.status });
    const result = await toFeatureResult(feature, job, downloadWorkbenchFile);
    // 제안은 기존 프로바이더 결과와 같은 규칙으로 정본 카테고리 · 태그로 다듬는다. context 는 접수할 때 받은 글의 컬렉션이다.
    if (feature === "suggest" && result.success) {
      result.suggestion = refineSuggestion(result.suggestion, loadSuggestVocabulary(query.get("context") ?? "posts"));
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof WorkbenchError ? err.message : `워크벤치 조회 실패: ${String(err)}`;
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
