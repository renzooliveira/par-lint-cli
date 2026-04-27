interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  role: string;
}

export class UserService {
  createUser(options: CreateUserOptions) {
    return options;
  }

  getById(id: number) {
    return { id };
  }
}
