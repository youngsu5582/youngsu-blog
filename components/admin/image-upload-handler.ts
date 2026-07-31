/**
 * Image upload handler for textarea editors.
 * Handles clipboard paste and drag-and-drop image uploads without replacing
 * edits made while an upload is in flight.
 */

export interface ImageUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const UPLOAD_PLACEHOLDER_PREFIX = "<!-- image-upload:";

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || !data.files?.length) {
    throw new Error(data?.error || "업로드 실패");
  }

  return data.files[0].path;
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  valueSetter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertAtSelection(textarea: HTMLTextAreaElement, value: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const token = `${UPLOAD_PLACEHOLDER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}-->`;
  const placeholder = `${token}${value}`;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);

  setTextareaValue(textarea, before + placeholder + after);
  const cursor = start + placeholder.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.focus();
  return placeholder;
}

function replaceToken(textarea: HTMLTextAreaElement, token: string, replacement: string): boolean {
  const currentValue = textarea.value;
  const tokenStart = currentValue.indexOf(token);
  if (tokenStart < 0) return false;

  const nextValue =
    currentValue.slice(0, tokenStart) + replacement + currentValue.slice(tokenStart + token.length);
  setTextareaValue(textarea, nextValue);
  const cursor = tokenStart + replacement.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.focus();
  return true;
}

async function handleImageFile(
  file: File,
  textarea: HTMLTextAreaElement,
  options: ImageUploadOptions,
) {
  const token = insertAtSelection(textarea, " (이미지 업로드 중...) ");
  options.onUploadStart?.();

  try {
    const imageUrl = await uploadImage(file);
    const inserted = replaceToken(textarea, token, `![image](${imageUrl})`);
    if (!inserted) {
      options.onUploadError?.("업로드는 완료됐지만 본문에서 업로드 위치가 삭제되었습니다");
      return;
    }
    options.onUploadComplete?.(imageUrl);
  } catch (error) {
    replaceToken(textarea, token, "");
    options.onUploadError?.(error instanceof Error ? error.message : "업로드 실패");
  }
}

export function handlePaste(
  e: ClipboardEvent,
  textarea: HTMLTextAreaElement,
  options: ImageUploadOptions = {},
): void {
  const imageItem = Array.from(e.clipboardData?.items || []).find((item) =>
    item.type.startsWith("image/"),
  );
  if (!imageItem) return;

  const file = imageItem.getAsFile();
  if (!file) return;

  e.preventDefault();
  void handleImageFile(file, textarea, options);
}

export function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

export function handleDrop(
  e: DragEvent,
  textarea: HTMLTextAreaElement,
  options: ImageUploadOptions = {},
): void {
  e.preventDefault();
  e.stopPropagation();

  const imageFile = Array.from(e.dataTransfer?.files || []).find((file) =>
    file.type.startsWith("image/"),
  );
  if (!imageFile) return;

  void handleImageFile(imageFile, textarea, options);
}

export function attachImageUploadHandlers(
  textarea: HTMLTextAreaElement | null,
  options: ImageUploadOptions = {},
): () => void {
  if (!textarea) return () => {};

  const pasteHandler = (e: ClipboardEvent) => handlePaste(e, textarea, options);
  const dragOverHandler = (e: DragEvent) => handleDragOver(e);
  const dropHandler = (e: DragEvent) => handleDrop(e, textarea, options);

  textarea.addEventListener("paste", pasteHandler);
  textarea.addEventListener("dragover", dragOverHandler);
  textarea.addEventListener("drop", dropHandler);

  return () => {
    textarea.removeEventListener("paste", pasteHandler);
    textarea.removeEventListener("dragover", dragOverHandler);
    textarea.removeEventListener("drop", dropHandler);
  };
}
