import { Preferences } from '@capacitor/preferences';

export class StorageService {
  async save(key: string, value: string) {
    await Preferences.set({ key, value });
  }

  async load(key: string) {
    const { value } = await Preferences.get({ key });
    return value;
  }
}
