export class NoDeadCodeService {
  calculate(x: number) {
    if (x > 10) {
      return x * 2;
    }
    return -1;
  }
}
