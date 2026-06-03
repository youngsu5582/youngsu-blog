"use client";

import React, { useEffect, RefObject } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  Link,
  Image,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

type SelectionResult = {
  start: number;
  end: number;
  selectedText: string;
  beforeSelection: string;
  afterSelection: string;
};

export function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  // Get current selection info
  const getSelection = (): SelectionResult | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeSelection = value.substring(0, start);
    const afterSelection = value.substring(end);

    return { start, end, selectedText, beforeSelection, afterSelection };
  };

  // Wrap selection with prefix and suffix
  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const selection = getSelection();
    if (!selection) return;

    const { start, selectedText, beforeSelection, afterSelection } = selection;
    const newText = beforeSelection + prefix + selectedText + suffix + afterSelection;
    onChange(newText);

    // Restore focus and selection
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      } else {
        // If no selection, place cursor between prefix and suffix
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  // Insert text at cursor or replace selection
  const insertText = (text: string, selectLength: number = 0) => {
    const selection = getSelection();
    if (!selection) return;

    const { start, beforeSelection, afterSelection } = selection;
    const newText = beforeSelection + text + afterSelection;
    onChange(newText);

    // Restore focus and set cursor position
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      if (selectLength > 0) {
        textarea.setSelectionRange(start, start + selectLength);
      } else {
        textarea.setSelectionRange(start + text.length, start + text.length);
      }
    }, 0);
  };

  // Insert at line start
  const insertAtLineStart = (prefix: string) => {
    const selection = getSelection();
    if (!selection) return;

    const { start, beforeSelection, afterSelection } = selection;

    // Find the start of the current line
    const lineStart = beforeSelection.lastIndexOf('\n') + 1;
    const linePrefix = value.substring(lineStart, start);

    // Check if line already has the prefix
    if (linePrefix.trim().startsWith(prefix.trim())) {
      // Remove prefix
      const newBefore = beforeSelection.substring(0, lineStart) + linePrefix.replace(prefix, '');
      const newText = newBefore + afterSelection;
      onChange(newText);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(start - prefix.length, start - prefix.length);
      }, 0);
    } else {
      // Add prefix
      const newBefore = beforeSelection.substring(0, lineStart) + prefix + linePrefix;
      const newText = newBefore + afterSelection;
      onChange(newText);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  // Toolbar actions
  const handleBold = () => wrapSelection("**");
  const handleItalic = () => wrapSelection("*");
  const handleStrikethrough = () => wrapSelection("~~");
  const handleCode = () => wrapSelection("`");
  const handleCodeBlock = () => {
    const selection = getSelection();
    if (!selection) return;
    const { selectedText } = selection;
    if (selectedText) {
      wrapSelection("```\n", "\n```");
    } else {
      insertText("```\n\n```", 4); // Select "```\n"
    }
  };
  const handleLink = () => {
    const selection = getSelection();
    if (!selection) return;
    const { selectedText } = selection;
    if (selectedText) {
      wrapSelection("[", "](url)");
    } else {
      insertText("[text](url)", 1); // Select "text"
    }
  };
  const handleImage = () => {
    insertText("![alt](url)", 2); // Select "alt"
  };
  const handleHeading2 = () => insertAtLineStart("## ");
  const handleHeading3 = () => insertAtLineStart("### ");
  const handleUnorderedList = () => insertAtLineStart("- ");
  const handleOrderedList = () => insertAtLineStart("1. ");
  const handleQuote = () => insertAtLineStart("> ");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea || document.activeElement !== textarea) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if (cmdOrCtrl && e.key === 'i') {
        e.preventDefault();
        handleItalic();
      } else if (cmdOrCtrl && e.key === 'e') {
        e.preventDefault();
        handleCode();
      } else if (cmdOrCtrl && e.key === 'k') {
        e.preventDefault();
        handleLink();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Rebind when editor value changes so toolbar actions use the latest selection/value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, textareaRef]);

  return (
    <div
      role="toolbar"
      aria-label="마크다운 편집 도구"
      className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <div role="group" aria-label="텍스트 서식" className="flex items-center gap-0.5 rounded-md bg-background/60 p-0.5 ring-1 ring-border/40">
          <ToolbarButton icon={Bold} onClick={handleBold} label="굵게" title="굵게 (Cmd/Ctrl+B)" />
          <ToolbarButton icon={Italic} onClick={handleItalic} label="기울임" title="기울임 (Cmd/Ctrl+I)" />
          <ToolbarButton icon={Strikethrough} onClick={handleStrikethrough} label="취소선" title="취소선" />
        </div>
        <div role="group" aria-label="코드" className="flex items-center gap-0.5 rounded-md bg-background/60 p-0.5 ring-1 ring-border/40">
          <ToolbarButton icon={Code} onClick={handleCode} label="인라인 코드" title="인라인 코드 (Cmd/Ctrl+E)" />
          <ToolbarButton icon={FileCode} onClick={handleCodeBlock} label="코드 블록" title="코드 블록" />
        </div>
        <div role="group" aria-label="삽입" className="flex items-center gap-0.5 rounded-md bg-background/60 p-0.5 ring-1 ring-border/40">
          <ToolbarButton icon={Link} onClick={handleLink} label="링크 삽입" title="링크 삽입 (Cmd/Ctrl+K)" />
          <ToolbarButton icon={Image} onClick={handleImage} label="이미지 삽입" title="이미지 삽입" />
        </div>
        <div role="group" aria-label="블록" className="flex items-center gap-0.5 rounded-md bg-background/60 p-0.5 ring-1 ring-border/40">
          <ToolbarButton icon={Heading2} onClick={handleHeading2} label="제목 2" title="제목 2" />
          <ToolbarButton icon={Heading3} onClick={handleHeading3} label="제목 3" title="제목 3" />
          <ToolbarButton icon={List} onClick={handleUnorderedList} label="글머리 목록" title="글머리 목록" />
          <ToolbarButton icon={ListOrdered} onClick={handleOrderedList} label="번호 목록" title="번호 목록" />
          <ToolbarButton icon={Quote} onClick={handleQuote} label="인용문" title="인용문" />
        </div>
      </div>
      <span className="hidden shrink-0 text-[10px] text-muted-foreground/60 lg:inline">
        단축키: Cmd/Ctrl+B · Cmd/Ctrl+K
      </span>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  label: string;
  title: string;
}

function ToolbarButton({ icon: Icon, onClick, label, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
