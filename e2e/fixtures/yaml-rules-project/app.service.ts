import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppService {
  loadData() {
    console.log('loading data');
    const result = fetch('/api/data');
    return result;
  }

  // ts-ignore usage for suggested_fix test
  // @ts-ignore
  badMethod() {
    return null;
  }
}
