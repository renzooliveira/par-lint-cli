export class CounterService {
  calculate(items: number[]) {
    let total = 0;
    let count = 0;
    for (const item of items) {
      total = total + item;
      count = count + 1;
    }
    let result = total / count;
    result = Math.round(result);
    return result;
  }
}
