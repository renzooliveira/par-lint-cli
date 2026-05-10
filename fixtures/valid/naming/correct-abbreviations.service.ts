export class NetworkService {
  getHttpUrl() {
    return '';
  }

  parseXmlData() {
    return {};
  }

  getUserById(id: string) { return id; }
  getApiUrl() { return ''; }
}

const SEVERITY_RANK = { error: 0, warning: 1, info: 2 };
const DEFAULT_ALLOWLIST = new Set(['foo']);
const ALL_RULES = [];
const YAML_LOADER_VERSION = '1.0.0';
