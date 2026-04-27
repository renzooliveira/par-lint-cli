export class UniqueMethodsService {
  calculateTotal(items: number[]): number {
    return items.reduce((sum, item) => sum + item, 0);
  }

  formatName(first: string, last: string): string {
    return `${first.trim()} ${last.trim()}`;
  }

  isValid(value: unknown): boolean {
    return value !== null && value !== undefined;
  }
}
