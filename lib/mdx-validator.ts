import { compile } from "@mdx-js/mdx";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export interface MdxValidationError {
  line?: number;
  column?: number;
  message: string;
}

export interface MdxValidationResult {
  valid: boolean;
  errors: MdxValidationError[];
}

/**
 * MDX 본문을 컴파일하여 파싱 에러를 검증한다.
 * rehype-pretty-code는 shiki 의존성이 무거워 검증에서 제외 (구문 에러 감지와 무관).
 */
export async function validateMdx(body: string): Promise<MdxValidationResult> {
  try {
    await compile(body, {
      remarkPlugins: [remarkBreaks],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    });
    return { valid: true, errors: [] };
  } catch (error: unknown) {
    const err = error as { line?: number; column?: number; message?: string };
    return {
      valid: false,
      errors: [
        {
          line: err.line,
          column: err.column,
          message: err.message || "MDX 파싱 에러",
        },
      ],
    };
  }
}
