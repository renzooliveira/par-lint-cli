import { Observable, of, Subject } from 'rxjs';

export class UserService {
  // Has $ on some, not on others — inconsistent
  users$ = new Subject<string[]>();
  loading = new Subject<boolean>();
  data: Observable<any> = of([]);
  error$ = new Subject<string>();

  getUsers(): Observable<string[]> {
    return this.users$;
  }
}
