export function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Never';

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function nextMonday7am(): string {
  const now = new Date();
  const next = new Date(now);
  const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
  next.setDate(next.getDate() + daysUntilMonday);
  next.setHours(7, 0, 0, 0);
  return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
