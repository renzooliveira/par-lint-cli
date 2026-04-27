export function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2);
}

export function createTimestamp(): number {
  return Date.now();
}

export function buildEntry(name: string) {
  return { name, id: Math.random(), createdAt: Date.now() };
}
