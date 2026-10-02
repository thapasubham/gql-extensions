import type { GraphQLRequest, PanelSink } from '../types';

class RequestStore implements PanelSink {
  requests = $state.raw<GraphQLRequest[]>([]);
  preserveLog = $state(false);

  add(requests: GraphQLRequest[]) {
    this.requests = [...this.requests, ...requests];
  }

  navigated() {
    if (!this.preserveLog) this.clear();
  }

  clear() {
    this.requests = [];
  }
}

export const store = new RequestStore();
