import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-old-inject',
  template: '<p>old</p>',
})
export class OldInjectComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}
}
