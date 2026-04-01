import * as React from "react";
import { Info, AlertTriangle, XCircle, Lightbulb } from "lucide-react";

type CalloutType = "info" | "warning" | "danger" | "tip";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  info: {
    icon: Info,
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    titleColor: "text-blue-700 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    icon: XCircle,
    borderColor: "border-red-500",
    bgColor: "bg-red-500/10",
    iconColor: "text-red-500",
    titleColor: "text-red-700 dark:text-red-400",
  },
  tip: {
    icon: Lightbulb,
    borderColor: "border-green-500",
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
    titleColor: "text-green-700 dark:text-green-400",
  },
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`my-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} backdrop-blur-sm`}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
          <div className="flex-1 min-w-0">
            {title && (
              <div className={`font-semibold mb-2 ${config.titleColor}`}>
                {title}
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse GitHub-style blockquote alerts
 * Supports: > [!NOTE], > [!WARNING], > [!TIP], > [!DANGER]
 */
export function parseBlockquoteAlert(
  children: React.ReactNode
): { type: CalloutType; title: string; content: React.ReactNode } | null {
  // Extract text content from children
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
      if (element.props.children) {
        return extractText(element.props.children);
      }
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join("");
    }
    return "";
  };

  const text = extractText(children).trim();

  // Match GitHub-style alert syntax
  const alertMatch = text.match(/^\[!(NOTE|INFO|WARNING|TIP|DANGER)\]\s*([\s\S]*?)$/);

  if (!alertMatch) return null;

  const alertType = alertMatch[1].toLowerCase();
  const content = alertMatch[2].trim();

  // Map GitHub alert types to our callout types
  const typeMap: Record<string, CalloutType> = {
    note: "info",
    info: "info",
    warning: "warning",
    tip: "tip",
    danger: "danger",
  };

  const calloutType = typeMap[alertType] || "info";

  // Extract title if present (first line)
  const lines = content.split("\n");
  const hasTitle = lines.length > 1 && lines[0].trim().length > 0 && !lines[0].includes("\n\n");

  return {
    type: calloutType,
    title: hasTitle ? lines[0].trim() : alertType.charAt(0).toUpperCase() + alertType.slice(1),
    content: hasTitle ? lines.slice(1).join("\n").trim() : content,
  };
}
