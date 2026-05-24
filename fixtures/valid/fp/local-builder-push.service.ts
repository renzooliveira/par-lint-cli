export class LocalBuilderPushService {
  buildItems(): string[] {
    const items: string[] = [];
    items.push('one');
    items.push('two');
    return items;
  }

  collect(data: number[]): number[] {
    const result = [];
    for (const d of data) {
      result.push(d * 2);
    }
    return result;
  }
}
