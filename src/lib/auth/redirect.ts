export function safeRelativePath(raw: string | undefined): string | null {
  if (raw === undefined || raw === '') {
    return null;
  }
  const s = raw.trim();
  if (s === '' || !s.startsWith('/') || s.startsWith('//')) {
    return null;
  }
  if (s.includes('://') || s.includes('\\')) {
    return null;
  }
  if (s.includes('\n') || s.includes('\r')) {
    return null;
  }
  return s;
}
