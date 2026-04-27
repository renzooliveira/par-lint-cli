import { Injectable, signal } from '@angular/core';

@Injectable()
export class MissingAsReadonlyService {
  public count = signal(0);
  public name = signal('test');

  increment() {
    this.count.update(v => v + 1);
  }
}
