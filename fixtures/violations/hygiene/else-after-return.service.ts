export class ValidationService {
  validate(value: number): string {
    if (value > 10) {
      return 'high';
    } else {
      return 'low';
    }
  }

  check(name: string): boolean {
    if (!name) {
      return false;
    } else {
      return name.length > 0;
    }
  }
}
