/**
 * Admin 화면이 AI 응답을 읽는 한 가지 방법.
 *
 * 기존 프로바이더는 결과를 바로 주고, 워크벤치는 `{ workbench: { jobUuid, feature } }` 로 접수만 알린다.
 * 접수된 작업은 끝날 때까지 블로그 라우트로 몇 초마다 묻고, 끝나면 기존 응답과 같은 모양을 돌려준다.
 * 그래서 화면은 `await res.json()` 대신 이것만 부르면 되고, 어느 길로 왔는지 몰라도 된다.
 */

export interface WorkbenchPending {
  jobUuid: string;
  feature: string;
}

interface Options {
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  fetcher?: typeof fetch;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readAiResult(res: Response, options: Options = {}): Promise<any> {
  const { intervalMs = 2_000, timeoutMs = 5 * 60_000, sleep = wait, fetcher = fetch } = options;
  const data = await res.json();
  const pending: WorkbenchPending | undefined = data?.workbench;
  if (!pending) return data;

  // 접수 응답의 나머지(번역 원문 등)는 결과와 합쳐 돌려준다.
  const extras = { ...data };
  delete extras.workbench;
  const url = `/api/admin/workbench/jobs/${encodeURIComponent(pending.jobUuid)}?feature=${encodeURIComponent(pending.feature)}`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const progress = await (await fetcher(url)).json();
    if (!progress?.pending) return { ...extras, ...progress };
  }
  return {
    success: false,
    error: `워크벤치 작업이 ${Math.round(timeoutMs / 60_000)}분 안에 끝나지 않았습니다. 워크벤치 콘솔의 작업 내역(${pending.jobUuid})에서 확인하세요`,
  };
}
