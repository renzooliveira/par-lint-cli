export class OrderService {
  processOrder() {
    const orderPayload = {};
    const validationResult = this.validate(orderPayload);
    const orderStatus = 'pending';
    const shippingType = 'express';
    const totalAmount = 100;
    const orderItem = { name: 'test' };
    return { validationResult, orderStatus, shippingType, totalAmount, orderItem };
  }

  private validate(input: unknown) {
    return !!input;
  }
}
