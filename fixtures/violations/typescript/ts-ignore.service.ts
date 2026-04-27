export class DataService {
  // @ts-ignore
  getValue(): string {
    return 42;
  }

  // @ts-expect-error
  process() {
    return undefined as string;
  }
}
