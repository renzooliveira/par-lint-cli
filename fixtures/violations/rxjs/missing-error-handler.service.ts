import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class MissingErrorHandlerService {
  constructor(private http: HttpClient) {}

  loadData() {
    this.http.get('/data').subscribe(data => {
      console.log(data);
    });

    this.http.get('/other').subscribe(val => this.process(val));
  }

  process(val: any) {}
}
