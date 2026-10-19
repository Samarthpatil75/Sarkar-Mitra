/**
 * Sarkar Mitra - Text Sanitization Helpers
 * 
 * Ensures internal data verification markers like "[VERIFY]" are never displayed
 * in citizen-facing UI or spoken by the voice assistant.
 */

export function stripVerifyTags(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\[?VERIFY\]?/gi, '').replace(/\s+/g, ' ').trim();
}

export function formatAfterSubmitLines(text) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\[?VERIFY\]?/gi, '').trim();
  return clean.split('\n').map(line => line.trim()).filter(Boolean);
}
