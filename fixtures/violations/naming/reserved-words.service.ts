export class OrderService {
  processOrder() {
    const data = {};
    const result = this.validate(data);
    const status = 'pending';
    const type = 'express';
    const value = 100;
    const item = { name: 'test' };
    return { result, status, type, value, item };
  }

  private validate(input: unknown) {
    return !!input;
  }
}
