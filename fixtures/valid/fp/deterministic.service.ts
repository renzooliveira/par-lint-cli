export function generateId(random: () => number): string {
  return 'id-' + random().toString(36).slice(2);
}

export function createTimestamp(now: () => number): number {
  return now();
}
