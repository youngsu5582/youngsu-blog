/**
 * Image upload handler for textarea editors
 * Handles both clipboard paste and drag-and-drop image uploads
 */

export interface ImageUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  onContentChange?: (value: string) => void;
}

/**
 * Upload an image file to the server
 */
export async function uploadAdminImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("업로드 실패");
  }

  const data = await response.json();
  if (!data.success || !data.files || data.files.length === 0) {
    throw new Error(data.error || "업로드 실패");
  }

  return data.files[0].path;
}

/**
 * Insert markdown image syntax at cursor position in textarea
 */
function insertImageMarkdown(
  textarea: HTMLTextAreaElement,
  imageUrl: string,
  options: ImageUploadOptions,
  originalValue: string,
  start: number,
  end: number
) {
  const imageMarkdown = `![image](${imageUrl})`;
  const newText = originalValue.substring(0, start) + imageMarkdown + originalValue.substring(end);
  const newCursorPos = start + imageMarkdown.length;

  if (options.onContentChange) {
    options.onContentChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
    return;
  }

  // Fallback for callers that do not use a controlled React textarea.
  textarea.value = newText;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Handle paste event for image upload
 */
export function handlePaste(
  e: ClipboardEvent,
  textarea: HTMLTextAreaElement,
  options: ImageUploadOptions = {}
): void {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();

      const file = item.getAsFile();
      if (!file) continue;

      // Keep the controlled textarea in React state; only mutate the DOM for legacy callers.
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const originalValue = textarea.value;

      if (!options.onContentChange) {
        const loadingText = " (이미지 업로드 중...) ";
        textarea.value =
          originalValue.substring(0, start) +
          loadingText +
          originalValue.substring(end);
      }

      options.onUploadStart?.();

      // Upload image
      uploadAdminImage(file)
        .then((imageUrl) => {
          insertImageMarkdown(textarea, imageUrl, options, originalValue, start, end);
          options.onUploadComplete?.(imageUrl);
        })
        .catch((error) => {
          if (!options.onContentChange) {
            textarea.value = originalValue;
            textarea.setSelectionRange(start, start);
          }
          options.onUploadError?.(error.message || "업로드 실패");
        });

      break; // Only handle first image
    }
  }
}

/**
 * Handle drag over event
 */
export function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Handle drop event for image upload
 */
export function handleDrop(
  e: DragEvent,
  textarea: HTMLTextAreaElement,
  options: ImageUploadOptions = {}
): void {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const imageFile = Array.from(files).find((file) =>
    file.type.startsWith("image/")
  );

  if (!imageFile) return;

  // Keep the controlled textarea in React state; only mutate the DOM for legacy callers.
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const originalValue = textarea.value;

  if (!options.onContentChange) {
    const loadingText = " (이미지 업로드 중...) ";
    textarea.value =
      originalValue.substring(0, start) +
      loadingText +
      originalValue.substring(end);
  }

  options.onUploadStart?.();

  // Upload image
  uploadAdminImage(imageFile)
    .then((imageUrl) => {
      insertImageMarkdown(textarea, imageUrl, options, originalValue, start, end);
      options.onUploadComplete?.(imageUrl);
    })
    .catch((error) => {
      if (!options.onContentChange) {
        textarea.value = originalValue;
        textarea.setSelectionRange(start, start);
      }
      options.onUploadError?.(error.message || "업로드 실패");
    });
}

/**
 * Attach image upload handlers to a textarea
 */
export function attachImageUploadHandlers(
  textarea: HTMLTextAreaElement | null,
  options: ImageUploadOptions = {}
): () => void {
  if (!textarea) return () => {};

  const pasteHandler = (e: ClipboardEvent) => handlePaste(e, textarea, options);
  const dragOverHandler = (e: DragEvent) => handleDragOver(e);
  const dropHandler = (e: DragEvent) => handleDrop(e, textarea, options);

  textarea.addEventListener("paste", pasteHandler as any);
  textarea.addEventListener("dragover", dragOverHandler as any);
  textarea.addEventListener("drop", dropHandler as any);

  // Return cleanup function
  return () => {
    textarea.removeEventListener("paste", pasteHandler as any);
    textarea.removeEventListener("dragover", dragOverHandler as any);
    textarea.removeEventListener("drop", dropHandler as any);
  };
}
