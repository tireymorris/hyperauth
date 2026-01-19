export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const [localPart, domain] = trimmed.split('@');

  if (!localPart || !domain) {
    return trimmed;
  }

  const cleanLocalPart = localPart.split('+')[0];
  return `${cleanLocalPart}@${domain}`;
}

export function getEmailDomain(email: string): string {
  const normalized = normalizeEmail(email);
  const domain = normalized.split('@')[1];
  return domain || '';
}

export function getEmailUsername(email: string): string {
  const normalized = normalizeEmail(email);
  const username = normalized.split('@')[0];
  return username || 'User';
}
