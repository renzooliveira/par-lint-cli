import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class NestedSubscribeService {
  constructor(private http: HttpClient) {}

  loadData() {
    this.http.get('/users').subscribe(users => {
      this.http.get('/roles').subscribe(roles => {
        console.log(users, roles);
      });
    });
  }
}
