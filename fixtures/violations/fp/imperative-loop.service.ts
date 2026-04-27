export class DataService {
  getNames(users: { name: string; active: boolean }[]) {
    const names: string[] = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i]!.active) {
        names.push(users[i]!.name);
      }
    }
    return names;
  }

  sumPrices(items: { price: number }[]) {
    let total = 0;
    for (const item of items) {
      total += item.price;
    }
    return total;
  }
}
