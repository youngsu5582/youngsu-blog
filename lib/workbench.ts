/**
 * 워크벤치(내 AI 작업 서버)를 서비스 키로 부르는 서버 전용 클라이언트.
 *
 * 키는 이 서버 안에서만 쓴다. 브라우저는 블로그 API 라우트를 거쳐 결과만 받는다.
 * 워크벤치는 비동기라, 실행은 작업 uuid 만 돌려주고 결과는 [readWorkbenchJob] 으로 따로 읽는다.
 */

export class WorkbenchError extends Error {}

function config() {
  return {
    baseUrl: process.env.WORKBENCH_BASE_URL?.trim().replace(/\/+$/, ""),
    apiKey: process.env.WORKBENCH_API_KEY?.trim(),
  };
}

export function isWorkbenchConfigured(): boolean {
  const { baseUrl, apiKey } = config();
  return Boolean(baseUrl && apiKey);
}

/** 워크벤치 오류 응답(ProblemDetail)의 detail 만 꺼낸다. 원문 전체를 화면에 흘리지 않는다. */
async function describeFailure(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const body = JSON.parse(text);
    if (typeof body?.detail === "string" && body.detail) return body.detail;
  } catch {
    // JSON 이 아니면 아래에서 상태 코드만 알린다.
  }
  return res.statusText || "요청 실패";
}

export async function workbenchRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, apiKey } = config();
  if (!baseUrl || !apiKey) {
    throw new WorkbenchError("WORKBENCH_BASE_URL · WORKBENCH_API_KEY 가 설정되지 않았습니다");
  }
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new WorkbenchError(`워크벤치 ${res.status}: ${await describeFailure(res)}`);
  return res;
}

export interface WorkbenchTemplateSummary {
  uuid: string;
  name: string;
}

export async function listWorkbenchTemplates(): Promise<WorkbenchTemplateSummary[]> {
  return (await workbenchRequest("/api/templates")).json();
}

// 템플릿 uuid 는 sync 할 때만 바뀐다. 실행마다 목록을 읽지 않도록 잠깐 기억한다.
const TEMPLATE_CACHE_MS = 60_000;
let templateCache: { at: number; byName: Map<string, string> } | null = null;

async function templateUuid(name: string): Promise<string> {
  if (!templateCache || Date.now() - templateCache.at > TEMPLATE_CACHE_MS) {
    const templates = await listWorkbenchTemplates();
    templateCache = { at: Date.now(), byName: new Map(templates.map((t) => [t.name, t.uuid])) };
  }
  const uuid = templateCache.byName.get(name);
  if (!uuid) {
    templateCache = null;
    throw new WorkbenchError(`워크벤치에 '${name}' 템플릿이 없습니다 — pnpm workbench:sync 로 올리세요`);
  }
  return uuid;
}

/** 템플릿의 변수를 채워 작업을 접수하고 작업 uuid 를 돌려준다. 결과는 기다리지 않는다. */
export async function submitWorkbenchTemplate(name: string, variables: Record<string, string>): Promise<string> {
  const uuid = await templateUuid(name);
  const res = await workbenchRequest(`/api/templates/${uuid}/jobs`, {
    method: "POST",
    body: JSON.stringify({ variables }),
  });
  const body = await res.json();
  return body.uuid;
}

export type WorkbenchJob =
  | { done: false; status: string }
  | { done: true; model: string; failure: string | null; texts: string[]; files: string[] };

interface JobResponse {
  status: string;
  model: string;
  failureReason?: string | null;
  tasks?: {
    status: string;
    failureReason?: string | null;
    texts?: { content: string }[];
    files?: { sha256: string }[];
  }[];
}

/**
 * 작업 상태를 읽는다. `CLOSED` 는 처리가 끝났다는 뜻이고 성공 여부는 작업 단위 결과로 본다.
 * 하나라도 실패하면 그 사유를 실패로 돌려준다 — 블로그 기능은 모두 작업 하나짜리다.
 */
export async function readWorkbenchJob(uuid: string): Promise<WorkbenchJob> {
  const job: JobResponse = await (await workbenchRequest(`/api/jobs/${encodeURIComponent(uuid)}`)).json();
  if (job.status !== "CLOSED") return { done: false, status: job.status };

  const tasks = job.tasks ?? [];
  const failed = tasks.find((task) => task.status !== "SUCCEEDED");
  const failure = failed
    ? failed.failureReason || "작업이 실패했습니다"
    : tasks.length === 0
      ? job.failureReason || "결과가 없습니다"
      : null;
  return {
    done: true,
    model: job.model,
    failure,
    texts: tasks.flatMap((task) => (task.texts ?? []).map((text) => text.content)),
    files: tasks.flatMap((task) => (task.files ?? []).map((file) => file.sha256)),
  };
}

/** 결과 파일을 받는다. 워크벤치는 보관소의 서명 주소로 넘겨 주므로 리다이렉트를 따라간다. */
export async function downloadWorkbenchFile(sha256: string): Promise<{ base64: string; mime: string }> {
  const res = await workbenchRequest(`/api/files/${encodeURIComponent(sha256)}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  const mime = res.headers.get("content-type")?.split(";")[0].trim() || "image/png";
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), mime };
}

/** 테스트에서 템플릿 목록 캐시를 비운다. */
export function resetWorkbenchTemplateCache() {
  templateCache = null;
}
