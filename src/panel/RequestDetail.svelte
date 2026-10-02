<script lang="ts">
  import type { GraphQLRequest } from '../types';
  import { formatBytes, formatDuration, formatJson } from '../lib/format';
  import { buildCurlCommand } from '../lib/curl';
  import JsonTree from './JsonTree.svelte';
  import GraphQLView from './GraphQLView.svelte';

  let { request, onclose }: { request: GraphQLRequest; onclose: () => void } = $props();

  const TABS = ['Query', 'Variables', 'Response', 'Headers'] as const;
  let tab = $state<(typeof TABS)[number]>('Query');
  let variablesView = $state<'tree' | 'raw'>('tree');
  let responseView = $state<'tree' | 'raw'>('tree');
  let copiedLabel = $state<string | null>(null);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    copiedLabel = label;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedLabel = null), 1200);
  }
</script>

{#snippet headerList(headers: Record<string, string>)}
  <dl>
    {#each Object.entries(headers) as [name, value] (name)}
      <dt>{name}</dt>
      <dd>{value}</dd>
    {/each}
  </dl>
{/snippet}

<section class="detail">
  <nav class="tabs">
    {#each TABS as t (t)}
      <button class:active={tab === t} onclick={() => (tab = t)}>{t}</button>
    {/each}
    <div class="actions">
      {#if tab === 'Query'}
        <button class="copy" onclick={() => copy(buildCurlCommand(request), 'Copied cURL')}>
          {copiedLabel === 'Copied cURL' ? 'Copied!' : 'Copy as cURL'}
        </button>
      {:else if tab === 'Variables'}
        {#if request.variables !== null && typeof request.variables === 'object'}
          <div class="view-toggle">
            <button class:active={variablesView === 'tree'} onclick={() => (variablesView = 'tree')}>Tree</button>
            <button class:active={variablesView === 'raw'} onclick={() => (variablesView = 'raw')}>Raw</button>
          </div>
        {/if}
      {:else if tab === 'Response'}
        {#if request.responseBody !== null && typeof request.responseBody === 'object'}
          <div class="view-toggle">
            <button class:active={responseView === 'tree'} onclick={() => (responseView = 'tree')}>Tree</button>
            <button class:active={responseView === 'raw'} onclick={() => (responseView = 'raw')}>Raw</button>
          </div>
        {/if}
        <button class="copy" onclick={() => copy(formatJson(request.responseBody), 'Copied response')}>
          {copiedLabel === 'Copied response' ? 'Copied!' : 'Copy'}
        </button>
      {/if}
    </div>
    <button class="close" title="Close" onclick={onclose}>×</button>
  </nav>

  {#if request.error}
    <div class="error-banner">{request.error}</div>
  {/if}

  <div class="body">
    {#if tab === 'Query'}
      {#if request.query}
        <GraphQLView source={request.query} />
      {:else if request.requestBody !== null && typeof request.requestBody === 'object'}
        <JsonTree value={request.requestBody} />
      {:else}
        <pre>{formatJson(request.requestBody)}</pre>
      {/if}
    {:else if tab === 'Variables'}
      {#if request.variables !== null && typeof request.variables === 'object' && variablesView === 'tree'}
        <JsonTree value={request.variables} />
      {:else}
        <pre>{formatJson(request.variables)}</pre>
      {/if}
    {:else if tab === 'Response'}
      {#if request.responseBody !== null && typeof request.responseBody === 'object' && responseView === 'tree'}
        <JsonTree value={request.responseBody} />
      {:else}
        <pre>{formatJson(request.responseBody)}</pre>
      {/if}
    {:else}
      <h4>General</h4>
      {@render headerList({
        URL: request.url,
        Method: request.method,
        Status: String(request.status),
        Started: new Date(request.timestamp).toLocaleTimeString(),
        Duration: formatDuration(request.duration),
        'Request size': formatBytes(request.requestSize),
        'Response size': formatBytes(request.responseSize),
      })}
      <h4>Response headers</h4>
      {@render headerList(request.responseHeaders)}
      <h4>Request headers</h4>
      {@render headerList(request.requestHeaders)}
    {/if}
  </div>
</section>

<style>
  .detail {
    flex: 0 0 55%;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-left: 1px solid var(--border);
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--toolbar-bg);
  }
  .tabs button {
    border: none;
    background: none;
    padding: 5px 10px;
    color: var(--muted);
    border-bottom: 2px solid transparent;
  }
  .tabs button.active {
    color: var(--fg);
    border-bottom-color: var(--accent);
  }
  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
  }
  .view-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 3px;
    overflow: hidden;
    margin-right: 6px;
  }
  .view-toggle button {
    border: none;
    background: var(--bg);
    color: var(--muted);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 0;
  }
  .view-toggle button + button {
    border-left: 1px solid var(--border);
  }
  .view-toggle button.active {
    background: var(--selected);
    color: var(--fg);
  }
  .tabs .copy {
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--bg);
    color: var(--fg);
    font-size: 11px;
    padding: 2px 8px;
  }
  .tabs .close {
    margin-left: 8px;
    font-size: 15px;
  }
  .error-banner {
    padding: 4px 8px;
    color: var(--error);
    background: var(--error-bg);
    border-bottom: 1px solid var(--border);
  }
  .body {
    flex: 1;
    overflow: auto;
    padding: 6px 8px;
  }
  pre {
    margin: 0;
    font-family: var(--mono);
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }
  h4 {
    margin: 10px 0 4px;
    font-weight: 600;
  }
  h4:first-child {
    margin-top: 2px;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(100px, max-content) 1fr;
    gap: 2px 12px;
    margin: 0;
  }
  dt {
    color: var(--muted);
    padding-right: 10px;
    border-right: 1px solid var(--row-border);
  }
  dd {
    margin: 0;
    word-break: break-all;
    user-select: text;
  }
</style>
