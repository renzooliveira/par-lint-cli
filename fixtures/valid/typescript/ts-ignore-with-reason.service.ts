export class DataService {
  // @ts-ignore -- legacy API returns wrong type until v3 migration
  getValue(): string {
    return 42 as any;
  }
}
