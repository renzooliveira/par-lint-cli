import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export class OrderEntity {
  private http = inject(HttpClient);

  save() {
    return this.http.post('/api/orders', this);
  }
}
