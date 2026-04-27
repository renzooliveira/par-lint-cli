export class TransformService {
  process(items: string[]) {
    return items.map((x) => parseInt(x));
  }

  filter(values: number[]) {
    return values.filter((v) => isFinite(v));
  }
}
