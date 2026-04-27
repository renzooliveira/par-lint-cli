export class CatchOnlyConsoleService {
  async loadData() {
    try {
      const res = await fetch('/api/data');
      return res.json();
    } catch (e) {
      console.error(e);
    }
  }

  parse(raw: string) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.log(err);
    }
  }
}
