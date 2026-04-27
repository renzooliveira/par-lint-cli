export class EmptyCatchService {
  async loadData() {
    try {
      const res = await fetch('/api/data');
      return res.json();
    } catch (e) {
    }
  }

  parseJson(raw: string) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
}
