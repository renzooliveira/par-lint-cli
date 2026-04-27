export class HandledCatchService {
  async loadData() {
    try {
      const res = await fetch('/api/data');
      return res.json();
    } catch (e) {
      this.errorService.handle(e);
      return null;
    }
  }
}
