import { Component } from '@angular/core';

@Component({ selector: 'app-derived', template: '' })
export class DerivedStateComponent {
  items: any[] = [];
  filteredItems: any[] = [];
  totalCount = 0;
  activeCount = 0;

  ngOnInit() {
    this.filteredItems = this.items.filter(i => i.active);
    this.totalCount = this.items.length;
    this.activeCount = this.filteredItems.length;
  }
}
