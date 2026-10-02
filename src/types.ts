export type GraphQLOperationType = 'query' | 'mutation' | 'subscription' | 'unknown';

export interface GraphQLRequest {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  operationType: GraphQLOperationType;
  operationName: string | null;
  query: string | null;
  variables: unknown;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  requestBody: unknown;
  responseBody: unknown;
  error?: string;
}

export interface PanelSink {
  add(requests: GraphQLRequest[]): void;
  navigated(): void;
}

declare global {
  interface Window {
    attachSink?: () => PanelSink;
  }
}
