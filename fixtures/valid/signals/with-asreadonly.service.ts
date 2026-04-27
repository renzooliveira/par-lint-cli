import { Injectable, signal } from '@angular/core';

@Injectable()
export class WithAsReadonlyService {
  private _count = signal(0);
  public count = this._count.asReadonly();

  increment() {
    this._count.update(v => v + 1);
  }
}
