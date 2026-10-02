<script lang="ts">
  import type { GraphQLOperationType } from '../types';
  import { store } from './store.svelte';
  import RequestList from './RequestList.svelte';
  import RequestDetail from './RequestDetail.svelte';

  const OPERATION_TYPES: GraphQLOperationType[] = ['query', 'mutation', 'subscription', 'unknown'];
  const TYPE_LABELS: Record<GraphQLOperationType, string> = {
    query: 'Queries',
    mutation: 'Mutations',
    subscription: 'Subscriptions',
    unknown: 'Other',
  };

  const ENABLED_TYPES_KEY = 'enabledTypes';

  let search = $state('');
  let enabledTypes = $state<Record<GraphQLOperationType, boolean>>({
    query: true,
    mutation: true,
    subscription: true,
    unknown: true,
  });
  let errorsOnly = $state(false);
  let selectedId = $state<string | null>(null);

  chrome.storage.local.get(ENABLED_TYPES_KEY, (result) => {
    const saved = result[ENABLED_TYPES_KEY] as Partial<Record<GraphQLOperationType, boolean>> | undefined;
    if (saved) {
      enabledTypes = { ...enabledTypes, ...saved };
    }
  });

  $effect(() => {
    chrome.storage.local.set({ [ENABLED_TYPES_KEY]: enabledTypes });
  });

  const filtered = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return store.requests.filter(
      (r) =>
        enabledTypes[r.operationType] &&
        (!errorsOnly || r.error) &&
        (!term ||
          (r.operationName ?? '').toLowerCase().includes(term) ||
          r.url.toLowerCase().includes(term) ||
          (r.query ?? '').toLowerCase().includes(term)),
    );
  });

  const selected = $derived(store.requests.find((r) => r.id === selectedId) ?? null);
</script>

<div class="app">
  <header class="toolbar">
    <button onclick={() => store.clear()} title="Clear requests">Clear</button>
    <input type="search" placeholder="Filter by operation, URL or query" bind:value={search} />
    <label><input type="checkbox" bind:checked={errorsOnly} /> Errors only</label>
    <label>
      <input
        type="checkbox"
        checked={store.preserveLog}
        onchange={(e) => store.setPreserveLog(e.currentTarget.checked)}
      /> Preserve log
    </label>
    <span class="count">{filtered.length} / {store.requests.length}</span>
  </header>

  <main>
    <RequestList requests={filtered} {selectedId} {search} onselect={(id) => (selectedId = id)} />
    {#if selected}
      <RequestDetail request={selected} onclose={() => (selectedId = null)} />
    {/if}
  </main>

  <footer class="statusbar">
    <div class="type-toggle-group">
      {#each OPERATION_TYPES as type (type)}
        <label class="type-toggle {type}" class:off={!enabledTypes[type]}>
          <input type="checkbox" bind:checked={enabledTypes[type]} />
          <span class="dot"></span>
          {TYPE_LABELS[type]}
        </label>
      {/each}
    </div>
  </footer>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border);
    background: var(--toolbar-bg);
  }
  input[type='search'] {
    flex: 1 1 200px;
    min-width: 0;
  }
  .count {
    margin-left: auto;
    color: var(--muted);
  }
  main {
    flex: 1;
    display: flex;
    min-height: 0;
  }
  .statusbar {
    display: flex;
    justify-content: flex-start;
    padding: 6px 8px;
    border-top: 1px solid var(--border);
    background: var(--toolbar-bg);
  }
  .type-toggle-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 999px;
    background: #2d2e31;
  }
  .type-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    color: #e8eaed;
    cursor: pointer;
    user-select: none;
  }
  .type-toggle input {
    display: none;
  }
  .type-toggle .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-color);
    flex-shrink: 0;
  }
  .type-toggle.off {
    opacity: 0.4;
  }
</style>
