export class CounterService {
  calculate(items: number[]) {
    const total = items.reduce((sum, item) => sum + item, 0);
    const count = items.length;
    const result = Math.round(total / count);
    return result;
  }
}
