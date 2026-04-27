export class CartService {
  private items: readonly string[] = [];

  addItem(item: string) {
    this.items = [...this.items, item];
  }

  sortItems() {
    this.items = [...this.items].sort();
  }

  filterItems(predicate: (item: string) => boolean) {
    this.items = this.items.filter(predicate);
  }
}
