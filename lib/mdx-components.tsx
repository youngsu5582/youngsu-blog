import * as React from "react";
import Image from "next/image";
import { Hash } from "lucide-react";
import { CodeCopyButton } from "@/components/mdx/code-copy-button";
import { ImageZoom } from "@/components/mdx/image-zoom";

// MDX에서 사용할 커스텀 컴포넌트
export const mdxComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-bold mt-8 mb-4 tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-semibold mt-8 mb-3 border-b border-border pb-2 group" id={id} {...props}>
      <a href={`#${id}`} className="flex items-center gap-2 no-underline">
        <Hash className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        {children}
      </a>
    </h2>
  ),
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold mt-6 mb-2 group" id={id} {...props}>
      <a href={`#${id}`} className="flex items-center gap-2 no-underline">
        <Hash className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        {children}
      </a>
    </h3>
  ),
  h4: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-lg font-semibold mt-4 mb-2 group" id={id} {...props}>
      <a href={`#${id}`} className="flex items-center gap-2 no-underline">
        <Hash className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        {children}
      </a>
    </h4>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-7 mb-4" {...props}>
      {children}
    </p>
  ),
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-border px-4 py-2 text-left font-semibold bg-muted" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border px-4 py-2" {...props}>
      {children}
    </td>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
    // Extract code text from children for copy button
    const extractCodeText = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (React.isValidElement(node)) {
        const element = node as React.ReactElement<{ children?: React.ReactNode }>;
        if (element.props.children) {
          return extractCodeText(element.props.children);
        }
      }
      if (Array.isArray(node)) {
        return node.map(extractCodeText).join("");
      }
      return "";
    };

    const codeText = extractCodeText(children);

    return (
      <div className="relative group">
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 my-4 text-sm" {...props}>
          {children}
        </pre>
        {codeText && <CodeCopyButton code={codeText} />}
      </div>
    );
  },
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    // 인라인 코드 (className이 없으면 인라인)
    if (!className) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    // 코드 블록 (pre 안의 code)
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <ImageZoom>
      <Image
        src={typeof src === "string" ? src : ""}
        alt={alt || ""}
        width={800}
        height={400}
        className="rounded-lg my-4"
      />
    </ImageZoom>
  ),
};
