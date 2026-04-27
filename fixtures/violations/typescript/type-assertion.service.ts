interface User {
  name: string;
  age: number;
}

function getUser(data: unknown): User {
  return data as User;
}

function process(value: any) {
  const result = value as string;
  return (result as unknown) as number;
}
