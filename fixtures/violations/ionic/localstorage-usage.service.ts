export class StorageService {
  save(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  load(key: string) {
    return localStorage.getItem(key);
  }
}
