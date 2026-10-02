import type { GraphQLOperationType, GraphQLRequest } from '../types';

type NetworkEntry = chrome.devtools.network.Request;

interface GraphQLPayload {
  query?: string;
  operationName?: string | null;
  variables?: unknown;
  extensions?: Record<string, unknown>;
}

interface OperationDef {
  type: GraphQLOperationType;
  name: string | null;
}

let batchCounter = 0;

function parseJson(text: string | null | undefined): unknown {
  if (text == null || text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isPayload(value: unknown): value is GraphQLPayload {
  if (typeof value !== 'object' || value === null) return false;
  const { query, extensions } = value as GraphQLPayload;
  const persisted = typeof extensions === 'object' && extensions !== null && 'persistedQuery' in extensions;
  return typeof query === 'string' || persisted;
}

function extractPayloads(request: NetworkEntry['request']): { payloads: GraphQLPayload[]; batched: boolean } {
  const none = { payloads: [], batched: false };

  if (request.method === 'GET') {
    let params: URLSearchParams;
    try {
      params = new URL(request.url).searchParams;
    } catch {
      return none;
    }
    const payload: GraphQLPayload = {
      query: params.get('query') ?? undefined,
      operationName: params.get('operationName'),
      variables: parseJson(params.get('variables')),
      extensions: parseJson(params.get('extensions')) as GraphQLPayload['extensions'],
    };
    return isPayload(payload) ? { payloads: [payload], batched: false } : none;
  }

  const text = request.postData?.text;
  if (!text) return none;
  if ((request.postData?.mimeType ?? '').includes('application/graphql')) {
    return { payloads: [{ query: text }], batched: false };
  }

  const body = parseJson(text);
  const list = Array.isArray(body) ? body : [body];
  if (list.length === 0 || !list.every(isPayload)) return none;
  return { payloads: list, batched: Array.isArray(body) };
}

// Collects the text before each top-level selection set, e.g. "query Foo($id: ID!)".
function definitionHeads(source: string): string[] {
  const heads: string[] = [];
  let head = '';
  let braces = 0;
  let parens = 0;
  let inString = false;
  let inComment = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (inComment) {
      if (c === '\n') inComment = false;
      continue;
    }
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '#') {
      inComment = true;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (braces > 0) {
      if (c === '{') braces++;
      else if (c === '}') braces--;
      continue;
    }
    if (c === '{' && parens === 0) {
      heads.push(head.trim());
      head = '';
      braces = 1;
      continue;
    }
    if (c === '(') parens++;
    else if (c === ')') parens--;
    head += c;
  }
  return heads;
}

const HEAD_PATTERN = /^(query|mutation|subscription)\b\s*([_A-Za-z][_0-9A-Za-z]*)?/;

function parseDefinitions(query: string): OperationDef[] {
  return definitionHeads(query).flatMap((head): OperationDef[] => {
    if (head === '') return [{ type: 'query', name: null }];
    const match = HEAD_PATTERN.exec(head);
    return match ? [{ type: match[1] as GraphQLOperationType, name: match[2] ?? null }] : [];
  });
}

export function resolveOperation(payload: GraphQLPayload): OperationDef {
  const name = payload.operationName ?? null;
  if (!payload.query) return { type: 'unknown', name };
  const defs = parseDefinitions(payload.query);
  const match = (name && defs.find((d) => d.name === name)) || defs[0];
  return { type: match?.type ?? 'unknown', name: name ?? match?.name ?? null };
}

function getContent(entry: NetworkEntry): Promise<string> {
  return new Promise((resolve) => {
    entry.getContent((content, encoding) => {
      if (!content) return resolve('');
      if (encoding !== 'base64') return resolve(content);
      const bytes = Uint8Array.from(atob(content), (ch) => ch.charCodeAt(0));
      resolve(new TextDecoder().decode(bytes));
    });
  });
}

function graphqlErrors(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  return errors
    .map((e) => (typeof e?.message === 'string' ? e.message : JSON.stringify(e)))
    .join('; ');
}

function headerMap(headers: { name: string; value: string }[]): Record<string, string> {
  return Object.fromEntries(headers.map((h) => [h.name.toLowerCase(), h.value]));
}

export async function toGraphQLRequests(entry: NetworkEntry): Promise<GraphQLRequest[]> {
  const { payloads, batched } = extractPayloads(entry.request);
  if (payloads.length === 0) return [];

  const text = await getContent(entry);
  const parsed = parseJson(text);
  const status = entry.response.status;
  const batchId = ++batchCounter;

  return payloads.map((payload, index) => {
    const operation = resolveOperation(payload);
    const responseBody = batched && Array.isArray(parsed) ? parsed[index] : (parsed ?? text);
    const httpError = status === 0 ? 'Request failed' : status >= 400 ? `HTTP ${status}` : undefined;

    return {
      id: `${batchId}-${index}`,
      timestamp: Date.parse(entry.startedDateTime),
      url: entry.request.url,
      method: entry.request.method,
      operationType: operation.type,
      operationName: operation.name,
      query: payload.query ?? null,
      variables: payload.variables,
      requestHeaders: headerMap(entry.request.headers),
      responseHeaders: headerMap(entry.response.headers),
      status,
      duration: entry.time,
      requestSize: entry.request.bodySize,
      responseSize: entry.response.content.size,
      requestBody: payload,
      responseBody,
      error: graphqlErrors(responseBody) ?? httpError,
    };
  });
}
