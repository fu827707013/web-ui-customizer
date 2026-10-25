/**
 * Clipboard helper.
 *
 * `navigator.clipboard` needs a secure context and a user gesture, and CloudCLI
 * is often served over plain http on a LAN address, where the API is simply
 * absent. The fallback covers that case with the classic hidden-textarea trick.
 */

export type CopyResult = 'copied' | 'failed';

function copyWithTextarea(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Off-screen but still focusable: a `display: none` node cannot be selected.
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

/** Copies `text`, preferring the async Clipboard API and falling back to execCommand. */
export async function copyText(text: string): Promise<CopyResult> {
  if (!text) return 'failed';

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      // Permission denied or a non-secure context — fall through to the fallback.
    }
  }

  return copyWithTextarea(text) ? 'copied' : 'failed';
}
