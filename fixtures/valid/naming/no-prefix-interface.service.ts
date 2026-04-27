export interface UserService {
  getUsers(): string[];
}

export interface AuthProvider {
  login(user: string): boolean;
}
