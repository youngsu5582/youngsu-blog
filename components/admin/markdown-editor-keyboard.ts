import type { KeyboardEvent } from "react";

export type MarkdownIndentDirection = "indent" | "outdent";

export type MarkdownIndentResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const INDENT = "  ";

function getSelectedLineRange(value: string, selectionStart: number, selectionEnd: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const selectionHasTrailingNewline =
    selectionEnd > selectionStart && value[selectionEnd - 1] === "\n";
  const selectionEndForLine = selectionHasTrailingNewline ? selectionEnd - 1 : selectionEnd;
  const nextNewline = value.indexOf("\n", selectionEndForLine);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;

  return { lineStart, lineEnd };
}

function outdentLine(line: string) {
  if (line.startsWith("\t")) return { line: line.slice(1), delta: -1 };
  if (line.startsWith(INDENT)) return { line: line.slice(INDENT.length), delta: -INDENT.length };
  if (line.startsWith(" ")) return { line: line.slice(1), delta: -1 };
  return { line, delta: 0 };
}

export function applyMarkdownIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: MarkdownIndentDirection,
): MarkdownIndentResult {
  const { lineStart, lineEnd } = getSelectedLineRange(value, selectionStart, selectionEnd);
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");

  let lineOffset = lineStart;
  let nextSelectionStart = selectionStart;
  let nextSelectionEnd = selectionEnd;

  const transformed = lines.map((line) => {
    const transformIndex = lineOffset;
    let nextLine = line;
    let delta = 0;

    if (direction === "indent") {
      nextLine = `${INDENT}${line}`;
      delta = INDENT.length;
    } else {
      const result = outdentLine(line);
      nextLine = result.line;
      delta = result.delta;
    }

    // Keep a selection that begins exactly at the first edited line anchored there,
    // while shifting cursors/selections that start after removed or inserted indentation.
    if (transformIndex < selectionStart) {
      nextSelectionStart += delta;
    }
    if (
      transformIndex < selectionEnd ||
      (direction === "indent" && transformIndex === selectionEnd)
    ) {
      nextSelectionEnd += delta;
    }

    lineOffset += line.length + 1;
    return nextLine;
  });

  const nextValue = `${value.slice(0, lineStart)}${transformed.join("\n")}${value.slice(lineEnd)}`;
  const clampedSelectionStart = Math.max(lineStart, Math.min(nextSelectionStart, nextValue.length));
  const clampedSelectionEnd = Math.max(
    clampedSelectionStart,
    Math.min(nextSelectionEnd, nextValue.length),
  );

  return {
    value: nextValue,
    selectionStart: clampedSelectionStart,
    selectionEnd: clampedSelectionEnd,
  };
}

export function handleMarkdownIndentKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
) {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return false;

  event.preventDefault();

  const textarea = event.currentTarget;
  const result = applyMarkdownIndent(
    value,
    textarea.selectionStart,
    textarea.selectionEnd,
    event.shiftKey ? "outdent" : "indent",
  );
  onChange(result.value);

  const restoreSelection = () => {
    textarea.focus();
    textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
  };

  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(restoreSelection);
  } else {
    window.setTimeout(restoreSelection, 0);
  }

  return true;
}
