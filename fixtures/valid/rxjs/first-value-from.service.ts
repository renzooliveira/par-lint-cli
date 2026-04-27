import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FirstValueFromService {
  constructor(private http: HttpClient) {}

  async loadData() {
    const data = await firstValueFrom(this.http.get('/data'));
    return data;
  }
}
