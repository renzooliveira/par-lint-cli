export class UserService {
  createUser(name: string, email: string, age: number, role: string) {
    return { name, email, age, role };
  }

  updateUser(id: number, name: string, email: string, age: number, role: string, active: boolean) {
    return { id, name, email, age, role, active };
  }
}
