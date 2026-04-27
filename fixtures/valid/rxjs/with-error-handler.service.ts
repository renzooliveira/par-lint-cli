import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Injectable()
export class WithErrorHandlerService {
  constructor(private http: HttpClient) {}

  loadData() {
    this.http.get('/data').pipe(
      catchError(err => of(null))
    ).subscribe(data => {
      console.log(data);
    });
  }
}
