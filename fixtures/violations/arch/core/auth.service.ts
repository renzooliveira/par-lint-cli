import { Injectable } from '@angular/core';
import { UserStore } from '../../features/user/user.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private userStore: UserStore) {}
}
