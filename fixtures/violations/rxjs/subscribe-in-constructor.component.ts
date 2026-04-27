import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({ selector: 'app-test', template: '' })
export class SubscribeConstructorComponent {
  constructor(private http: HttpClient) {
    this.http.get('/data').subscribe(data => {
      console.log(data);
    });
  }
}
