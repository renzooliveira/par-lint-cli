export class DeadCodeService {
  calculate(x: number) {
    if (x > 10) {
      return x * 2;
      const extra = x + 1;
      console.log(extra);
    }
    throw new Error('Invalid');
    return -1;
  }
}
