import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
}

export class UserApiService {
  getAll(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  findById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
