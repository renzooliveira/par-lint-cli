export class OrderService {
  processOrder(order: any) {
    const address = order.getCustomerAddress();
    const city = address.city;
    return { city };
  }
}
