import { describe, expect, it } from "vitest";
import {
  getReferenceLayout,
  getReferenceType,
  getYouTubeEmbedUrl,
  type ReferenceInput,
} from "@/lib/references";

describe("reference layout helpers", () => {
  it("유튜브·공식 문서·일반 아티클을 URL로 분류한다", () => {
    expect(getReferenceType({ title: "video", url: "https://youtu.be/abc123" })).toBe("video");
    expect(
      getReferenceType({
        title: "docs",
        url: "https://docs.spring.io/spring-framework/reference/integration/cache.html",
      }),
    ).toBe("docs");
    expect(getReferenceType({ title: "article", url: "https://tech.kakao.com/posts/485" })).toBe(
      "article",
    );
  });

  it("대표 영상을 상단으로 올리고 나머지는 입력 순서를 보존한다", () => {
    const references: ReferenceInput[] = [
      { title: "카카오 아티클", url: "https://tech.kakao.com/posts/485" },
      { title: "RabbitMQ vs Kafka", url: "https://www.youtube.com/watch?v=w8xWTIFU4C8" },
      { title: "RabbitMQ 문서", url: "https://www.rabbitmq.com/docs" },
      { title: "Kafka 문서", url: "https://docs.confluent.io/kafka/design/log_compaction.html" },
    ];

    const layout = getReferenceLayout(references);

    expect(layout.primary?.title).toBe("RabbitMQ vs Kafka");
    expect(layout.secondary.map((reference) => reference.title)).toEqual([
      "카카오 아티클",
      "RabbitMQ 문서",
      "Kafka 문서",
    ]);
  });

  it("role이 primary로 지정된 비디오를 자동 선택보다 우선한다", () => {
    const references: ReferenceInput[] = [
      { title: "첫 번째 영상", url: "https://youtu.be/first123" },
      { title: "대표 영상", url: "https://youtu.be/primary12", role: "primary" },
    ];

    expect(getReferenceLayout(references).primary?.title).toBe("대표 영상");
  });

  it("지원하지 않는 URL 스킴은 카드에서 제외한다", () => {
    const references: ReferenceInput[] = [
      { title: "안전한 링크", url: "https://example.com/article" },
      { title: "위험한 링크", url: "javascript:alert(1)" },
    ];

    const layout = getReferenceLayout(references);

    expect(layout.primary).toBeUndefined();
    expect(layout.secondary.map((reference) => reference.title)).toEqual(["안전한 링크"]);
  });

  it("YouTube watch, short, live URL을 개인정보 보호 임베드 URL로 변환한다", () => {
    expect(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123?rel=0",
    );
    expect(getYouTubeEmbedUrl("https://youtu.be/short456?t=30")).toBe(
      "https://www.youtube-nocookie.com/embed/short456?rel=0",
    );
    expect(getYouTubeEmbedUrl("https://www.youtube.com/live/live789")).toBe(
      "https://www.youtube-nocookie.com/embed/live789?rel=0",
    );
    expect(getYouTubeEmbedUrl("https://example.com/not-youtube")).toBeNull();
  });
});
