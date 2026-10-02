import type { GraphQLRequest } from '../types';

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildCurlCommand(request: GraphQLRequest): string {
  const parts = [`curl ${shellEscape(request.url)}`];

  if (request.method && request.method.toUpperCase() !== 'GET') {
    parts.push(`-X ${request.method.toUpperCase()}`);
  }

  for (const [name, value] of Object.entries(request.requestHeaders)) {
    parts.push(`-H ${shellEscape(`${name}: ${value}`)}`);
  }

  const bodyText =
    typeof request.requestBody === 'string'
      ? request.requestBody
      : request.requestBody !== undefined
        ? JSON.stringify(request.requestBody)
        : request.query
          ? JSON.stringify({
              query: request.query,
              variables: request.variables,
              operationName: request.operationName,
            })
          : undefined;

  if (bodyText !== undefined) {
    parts.push(`--data-raw ${shellEscape(bodyText)}`);
  }

  return parts.join(' \\\n  ');
}
