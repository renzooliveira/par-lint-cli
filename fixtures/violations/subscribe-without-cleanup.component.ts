import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-leaky',
  template: '<div>leaky</div>',
})
export class LeakyComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('/api/data').subscribe((data) => {
      console.log(data);
    });

    this.http.get('/api/other').subscribe({
      next: (val) => console.log(val),
      error: (err) => console.error(err),
    });
  }
}
