import { toGraphQLRequests } from './lib/graphql';
import type { GraphQLRequest, PanelSink } from './types';

// The panel page only loads once its tab is first opened, so capture here
// (DevTools open) and buffer until the panel attaches.
let pending: GraphQLRequest[] = [];
let sink: PanelSink | null = null;

chrome.devtools.network.onRequestFinished.addListener(async (entry) => {
  const requests = await toGraphQLRequests(entry as chrome.devtools.network.Request);
  if (requests.length === 0) return;
  if (sink) sink.add(requests);
  else pending.push(...requests);
});

chrome.devtools.network.onNavigated.addListener(() => {
  if (sink) sink.navigated();
  else pending = [];
});

chrome.devtools.panels.create('GraphQL', '', 'panel.html', (panel) => {
  panel.onShown.addListener((win) => {
    if (sink) return;
    sink = (win as Window).attachSink?.() ?? null;
    if (sink && pending.length > 0) {
      sink.add(pending);
      pending = [];
    }
  });
});
