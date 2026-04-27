import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ToPromiseService {
  constructor(private http: HttpClient) {}

  async loadData() {
    const data = await this.http.get('/data').toPromise();
    return data;
  }
}
