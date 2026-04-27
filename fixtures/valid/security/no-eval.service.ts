export class SafeService {
  execute(data: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(data));
  }
}
