import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AllImportsUsedService {
  constructor(private http: HttpClient) {}

  loadData() {
    return this.http.get('/data');
  }
}
