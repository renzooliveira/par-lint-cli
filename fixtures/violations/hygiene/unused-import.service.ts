import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Injectable()
export class UnusedImportService {
  constructor(private http: HttpClient) {}

  loadData(): Observable<any> {
    return this.http.get('/data').pipe(map(d => d));
  }
}
