import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({ selector: 'app-test', template: '' })
export class SubscribeOnInitComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('/data').subscribe(data => {
      console.log(data);
    });
  }
}
