/**
 * Image upload handler for textarea editors
 * Handles both clipboard paste and drag-and-drop image uploads
 */

export interface ImageUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Upload an image file to the server
 */
async function uploadImage(file: File): Promise<string> {
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
function insertImageMarkdown(textarea: HTMLTextAreaElement, imageUrl: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const before = text.substring(0, start);
  const after = text.substring(end);
  const imageMarkdown = `![image](${imageUrl})`;

  const newText = before + imageMarkdown + after;
  const newCursorPos = start + imageMarkdown.length;

  // Update textarea value
  textarea.value = newText;

  // Restore cursor position
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();

  // Trigger change event for React
  const event = new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
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

      // Show loading indicator
      const loadingText = " (이미지 업로드 중...) ";
      const start = textarea.selectionStart;
      const originalValue = textarea.value;

      textarea.value =
        originalValue.substring(0, start) +
        loadingText +
        originalValue.substring(start);

      options.onUploadStart?.();

      // Upload image
      uploadImage(file)
        .then((imageUrl) => {
          // Remove loading text and insert markdown
          textarea.value = originalValue;
          textarea.setSelectionRange(start, start);
          insertImageMarkdown(textarea, imageUrl);
          options.onUploadComplete?.(imageUrl);
        })
        .catch((error) => {
          // Remove loading text on error
          textarea.value = originalValue;
          textarea.setSelectionRange(start, start);
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

  // Show loading indicator
  const loadingText = " (이미지 업로드 중...) ";
  const start = textarea.selectionStart;
  const originalValue = textarea.value;

  textarea.value =
    originalValue.substring(0, start) +
    loadingText +
    originalValue.substring(start);

  options.onUploadStart?.();

  // Upload image
  uploadImage(imageFile)
    .then((imageUrl) => {
      // Remove loading text and insert markdown
      textarea.value = originalValue;
      textarea.setSelectionRange(start, start);
      insertImageMarkdown(textarea, imageUrl);
      options.onUploadComplete?.(imageUrl);
    })
    .catch((error) => {
      // Remove loading text on error
      textarea.value = originalValue;
      textarea.setSelectionRange(start, start);
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
