export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly total: number,
  ) {}

  isValid() {
    return this.total > 0;
  }
}
