import { Observable, of, Subject } from 'rxjs';

export class UserService {
  users$ = new Subject<string[]>();
  loading$ = new Subject<boolean>();
  data$: Observable<any> = of([]);
  error$ = new Subject<string>();

  getUsers(): Observable<string[]> {
    return this.users$;
  }
}
