import { Injectable } from '@angular/core';

interface Order {
  status: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  processOrder(order: Order) {
    // Bad: mutating entity properties directly from outside
    order.status = 'processed';
    order.total = order.total * 1.1;
  }

  updateUser(user: any) {
    user.name = 'new name';
    user.email = 'new@email.com';
    user.role = 'admin';
  }
}
