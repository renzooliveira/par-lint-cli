export class ValidationService {
  validate(value: number): string {
    if (value > 10) {
      return 'high';
    }
    return 'low';
  }

  check(name: string): boolean {
    if (!name) {
      return false;
    }
    return name.length > 0;
  }
}
