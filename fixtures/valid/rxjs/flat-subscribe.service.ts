import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';

@Injectable()
export class FlatSubscribeService {
  constructor(private http: HttpClient) {}

  loadData() {
    this.http.get('/users').pipe(
      switchMap(users => this.http.get('/roles'))
    ).subscribe(roles => {
      console.log(roles);
    });
  }
}
