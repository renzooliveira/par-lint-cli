export class OrderService {
  processOrder(order: any) {
    const city = order.customer.address.city;
    const zip = order.customer.address.zipCode;
    const managerName = order.department.manager.profile.name;
    return { city, zip, managerName };
  }
}
