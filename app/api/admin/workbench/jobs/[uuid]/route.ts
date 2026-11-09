import { NextResponse } from "next/server";
import { downloadWorkbenchFile, readWorkbenchJob, WorkbenchError } from "@/lib/workbench";
import { isWorkbenchFeature, toFeatureResult } from "@/lib/workbench-results";

/**
 * 워크벤치 작업의 진행을 읽는다. 끝나기 전에는 `{ pending: true }`, 끝나면 그 기능의 기존 응답과 같은 모양이다.
 * 화면은 이 경로를 몇 초마다 부른다(`readAiResult`). 키는 서버에만 있어 브라우저가 워크벤치를 직접 부르지 않는다.
 */
export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const feature = new URL(req.url).searchParams.get("feature");
  if (!isWorkbenchFeature(feature)) {
    return NextResponse.json({ success: false, error: "feature 가 올바르지 않습니다" }, { status: 400 });
  }
  try {
    const job = await readWorkbenchJob(uuid);
    if (!job.done) return NextResponse.json({ pending: true, status: job.status });
    return NextResponse.json(await toFeatureResult(feature, job, downloadWorkbenchFile));
  } catch (err) {
    const message = err instanceof WorkbenchError ? err.message : `워크벤치 조회 실패: ${String(err)}`;
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
