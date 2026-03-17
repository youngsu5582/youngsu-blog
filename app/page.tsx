import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          {siteConfig.author.name}의 블로그
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {siteConfig.description}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">최근 포스트</h2>
        <p className="text-muted-foreground">
          포스트가 아직 없습니다. Phase 2에서 콘텐츠 파이프라인을 구축합니다.
        </p>
      </section>
    </div>
  );
}
