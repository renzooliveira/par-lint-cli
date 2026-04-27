export class AwaitedPromiseService {
  async save() {
    await this.http.post('/save', { data: 1 });
    const res = await fetch('/api/notify');
    return res.json();
  }
}
