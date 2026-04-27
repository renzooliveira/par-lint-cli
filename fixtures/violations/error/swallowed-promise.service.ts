export class SwallowedPromiseService {
  save() {
    this.http.post('/save', { data: 1 });
    fetch('/api/notify');
  }

  async doWork() {
    await this.http.post('/work', {});
  }
}
