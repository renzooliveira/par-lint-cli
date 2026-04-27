export class OrderRepository {
  findById(id: string) {
    return { id };
  }
}

export class InvoiceCalculator {
  calculateTotal(items: { price: number }[]) {
    return items.reduce((sum, i) => sum + i.price, 0);
  }
}
