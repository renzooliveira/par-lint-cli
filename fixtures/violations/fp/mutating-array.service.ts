export class CartService {
  private items: string[] = [];

  addItem(item: string) {
    this.items.push(item);
  }

  removeFirst() {
    this.items.shift();
  }

  sortItems() {
    this.items.sort();
  }

  insertAt(index: number, item: string) {
    this.items.splice(index, 0, item);
  }

  reverseItems() {
    this.items.reverse();
  }
}
