/**
 * 워크벤치 `GET /api/jobs/{uuid}` 응답(`GenerationJobDetailResponse`)을 그 모양 그대로 만든다.
 *
 * 글 결과의 `content` 는 요청한 형식이 모양을 정한다 — `text` 면 문자열, `json-schema` 면 그 스키마를 따르는 객체다
 * (워크벤치 `docs/development.md` 의 text-generate 절). 옵션의 스키마는 받은 순서를 지키려고 문자열로 돌아온다.
 * 필요한 필드만 흉내 내면 받는 쪽의 짐작이 테스트에 굳으므로, 블로그가 읽지 않는 필드까지 함께 둔다.
 */
export function closedTextJob(content: unknown, schema: Record<string, unknown> | null = null) {
  return {
    uuid: "0b2bed58-0000-4000-8000-000000000001",
    status: "CLOSED",
    model: "gpt-6-luna",
    option: {
      type: "text-generate",
      prompt: "…",
      output: schema ? { type: "json-schema", schema: JSON.stringify(schema) } : { type: "text" },
    },
    createdAt: "2026-11-10T13:00:00Z",
    progress: { total: 1, succeeded: 1, failed: 0 },
    tasks: [
      {
        sequence: 0,
        status: "SUCCEEDED",
        failureReason: null,
        files: [],
        texts: [{ content }],
        decisions: [],
      },
    ],
  };
}
