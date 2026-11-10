import { NextResponse } from "next/server";
import fs from "fs";
import matter from "gray-matter";
import { executeAi, getAvailableProviders, type AiProvider } from "@/lib/ai-provider";
import { resolveRepoFilePath } from "@/lib/admin-content-paths";
import { collectionOf, loadSuggestVocabulary } from "@/lib/suggest-vocabulary";
import { formatTagList, refineSuggestion, SUGGEST_RULES } from "@/lib/taxonomy-vocabulary";
import { submitWorkbenchTemplate } from "@/lib/workbench";
import { WORKBENCH_TEMPLATES } from "@/lib/workbench-templates";

export async function POST(req: Request) {
  const { filePath, provider } = await req.json();

  // Check for available AI providers
  const availableProviders = getAvailableProviders();
  const hasAnyProvider = availableProviders.some((p) => p.available);

  if (!hasAnyProvider) {
    return NextResponse.json({
      error: "사용 가능한 AI 프로바이더가 없습니다. API 키를 설정하거나 CLI 도구를 설치하세요."
    }, { status: 400 });
  }

  // Determine which provider to use
  let selectedProvider: AiProvider;
  if (provider) {
    // Use explicitly requested provider
    const providerInfo = availableProviders.find((p) => p.id === provider);
    if (!providerInfo || !providerInfo.available) {
      return NextResponse.json({
        error: `선택한 프로바이더(${provider})를 사용할 수 없습니다`
      }, { status: 400 });
    }
    selectedProvider = provider;
  } else {
    // Fall back to first available provider
    const firstAvailable = availableProviders.find((p) => p.available);
    if (!firstAvailable) {
      return NextResponse.json({
        error: "사용 가능한 AI 프로바이더가 없습니다"
      }, { status: 400 });
    }
    selectedProvider = firstAvailable.id;
  }

  // Read post content
  const resolved = typeof filePath === "string" ? resolveRepoFilePath(filePath, ["content/"]) : null;
  if (!resolved || !fs.existsSync(resolved.absPath)) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
  }

  const raw = fs.readFileSync(resolved.absPath, "utf-8");
  const { content, data } = matter(raw);
  const truncatedContent = content.substring(0, 3000); // Limit for API
  // 화면이 보낸 목록은 표기가 섞여 있어 쓰지 않는다. 정본 카테고리와 자주 쓰는 태그(정본으로 모은 횟수)를 보낸다.
  const collection = collectionOf(resolved.repoPath);
  const vocabulary = loadSuggestVocabulary(collection);
  const categoryList = vocabulary.categories.join(", ");
  const tagList = formatTagList(vocabulary.frequentTags);

  if (selectedProvider === "workbench") {
    try {
      const jobUuid = await submitWorkbenchTemplate(WORKBENCH_TEMPLATES.suggest.name, {
        title: String(data.title || ""),
        content: truncatedContent,
        existing_categories: categoryList,
        existing_tags: tagList,
      });
      // 결과를 다듬을 때 같은 어휘를 다시 만들 수 있게 컬렉션을 넘긴다.
      return NextResponse.json({ success: true, workbench: { jobUuid, feature: "suggest", context: collection } });
    } catch (err) {
      return NextResponse.json({ error: `워크벤치 요청 실패: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
    }
  }

  const prompt = `다음은 기술 블로그 포스트 내용입니다. 이 포스트에 적합한 메타데이터를 JSON으로 제안해주세요.

카테고리 목록: [${categoryList}]
자주 쓰는 태그: [${tagList}]

${SUGGEST_RULES}

포스트 제목: ${data.title || ""}
포스트 내용:
${truncatedContent}

반드시 다음 JSON 형식으로만 응답하세요:
{"description": "...", "categories": ["...", "..."], "tags": ["...", "...", "..."]}`;

  try {
    // Execute AI request
    const response = await executeAi({
      provider: selectedProvider,
      prompt,
    });

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      model: response.provider,
      suggestion: refineSuggestion(response.result, vocabulary),
    });
  } catch (err) {
    return NextResponse.json({ error: `AI 요청 실패: ${String(err)}` }, { status: 500 });
  }
}
