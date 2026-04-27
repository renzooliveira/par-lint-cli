export class TransformService {
  process(items: string[]) {
    return items.map(parseInt);
  }

  filter(values: number[]) {
    return values.filter(isFinite);
  }
}
