export interface IUserService {
  getUsers(): string[];
}

export interface IAuthProvider {
  login(user: string): boolean;
}

export interface UserRepository {
  findAll(): string[];
}
