import type { GraphQLRequest, PanelSink } from '../types';

const PRESERVE_LOG_KEY = 'preserveLog';
const MAX_REQUESTS = 1000;

class RequestStore implements PanelSink {
  requests = $state.raw<GraphQLRequest[]>([]);
  preserveLog = $state(true);

  constructor() {
    chrome.storage.local.get(PRESERVE_LOG_KEY, (result) => {
      if (typeof result[PRESERVE_LOG_KEY] === 'boolean') {
        this.preserveLog = result[PRESERVE_LOG_KEY];
      }
    });
  }

  setPreserveLog(value: boolean) {
    this.preserveLog = value;
    chrome.storage.local.set({ [PRESERVE_LOG_KEY]: value });
  }

  add(requests: GraphQLRequest[]) {
    const combined = [...this.requests, ...requests];
    this.requests = combined.length > MAX_REQUESTS ? combined.slice(combined.length - MAX_REQUESTS) : combined;
  }

  navigated() {
    if (!this.preserveLog) this.clear();
  }

  clear() {
    this.requests = [];
  }
}

export const store = new RequestStore();
