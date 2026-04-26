export class UserService {
  createUser(name: string, email: string, age: number, active: boolean, role: string) {
    return { name, email, age, active, role };
  }

  simpleMethod(id: string) {
    return id;
  }
}
