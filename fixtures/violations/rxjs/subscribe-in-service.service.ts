import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  loadData() {
    this.http.get('/api/data').subscribe(data => {
      console.log(data);
    });
  }
}
