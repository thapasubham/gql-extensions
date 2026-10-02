# GraphQL DevTools

A Chrome DevTools extension for inspecting GraphQL requests. It captures network traffic, parses GraphQL queries, mutations and subscriptions (including batched requests and persisted queries), and displays them in a dedicated DevTools panel.

## Features

- Captures GraphQL requests sent over HTTP (POST JSON, `application/graphql`, and GET with query params)
- Detects batched GraphQL requests
- Parses operation type (`query` / `mutation` / `subscription`) and operation name
- Surfaces GraphQL errors from responses
- JSON tree viewer for request/response payloads
- Copy requests as `curl` commands

## Development

```bash
npm install
npm run dev     # build in watch mode
npm run build   # production build
npm run check   # type-check with svelte-check
```

## Loading the extension in Chrome

1. Run `npm run build` (output goes to `dist/`).
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/` directory.
5. Open DevTools on any page and switch to the **GraphQL** panel.

## Project structure

- `src/devtools.ts` / `src/devtools.html` — registers the DevTools panel
- `src/panel/` — Svelte UI for the panel (`App.svelte`, `RequestList.svelte`, `RequestDetail.svelte`, `GraphQLView.svelte`, `JsonTree.svelte`)
- `src/lib/` — GraphQL parsing, formatting, and curl-export helpers
- `public/manifest.json` — Chrome extension manifest
