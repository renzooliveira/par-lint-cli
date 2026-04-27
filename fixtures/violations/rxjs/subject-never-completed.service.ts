import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private action$ = new Subject<string>();
  private state$ = new BehaviorSubject<number>(0);

  emit(value: string) {
    this.action$.next(value);
  }

  setState(value: number) {
    this.state$.next(value);
  }
}
