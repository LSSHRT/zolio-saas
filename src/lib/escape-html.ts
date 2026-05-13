/**
 * Escape a string for safe interpolation inside HTML content.
 *
 * Use this whenever user-supplied text ends up in a context that
 * gets parsed as HTML (mail bodies, server-rendered fragments,
 * dangerouslySetInnerHTML, etc.).
 *
 * Order matters: `&` MUST be replaced first so we don't double-encode
 * the entity that subsequent replacements introduce.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
