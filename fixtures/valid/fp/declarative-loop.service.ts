export class DataService {
  getNames(users: { name: string; active: boolean }[]) {
    return users.filter(u => u.active).map(u => u.name);
  }

  sumPrices(items: { price: number }[]) {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
}
