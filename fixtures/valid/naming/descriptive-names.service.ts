export class ProcessService {
  processOrder() {
    const orderTotal = 10;
    const createdAt = new Date();
    const userName = 'John';
    const itemCount = 42;

    if (orderTotal > 5) {
      return itemCount;
    }
    return userName;
  }

  iterate(items: number[]) {
    for (let i = 0; i < items.length; i++) {
      console.log(items[i]);
    }
  }
}
