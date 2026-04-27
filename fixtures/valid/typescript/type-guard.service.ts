interface User {
  name: string;
  age: number;
}

function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'name' in data;
}

function getUser(data: unknown): User | null {
  if (isUser(data)) {
    return data;
  }
  return null;
}
