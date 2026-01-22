export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const [localPart, domain] = trimmed.split('@');

  if (!localPart || !domain) {
    return trimmed;
  }

  const cleanLocalPart = localPart.split('+')[0];
  return `${cleanLocalPart}@${domain}`;
}
