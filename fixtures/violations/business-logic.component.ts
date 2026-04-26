import { Component } from '@angular/core';

@Component({ selector: 'app-order', template: '' })
export class OrderComponent {
  orders: any[] = [];
  filteredOrders: any[] = [];

  filterOrders(status: string) {
    if (status === 'active') {
      this.filteredOrders = this.orders.filter(o => o.active);
    } else if (status === 'completed') {
      this.filteredOrders = this.orders.filter(o => o.completed);
    } else if (status === 'pending') {
      this.filteredOrders = this.orders.filter(o => !o.active && !o.completed);
    }

    try {
      this.filteredOrders.sort((a, b) => a.date - b.date);
    } catch (e) {
      console.error(e);
    }

    switch (this.filteredOrders.length) {
      case 0: console.log('empty'); break;
      case 1: console.log('single'); break;
      default: console.log('multiple');
    }
  }
}
