<script lang="ts">
  import type { GraphQLOperationType, GraphQLRequest } from '../types';
  import { formatBytes, formatDuration } from '../lib/format';
  import Highlight from './Highlight.svelte';

  const TYPE_LETTERS: Record<GraphQLOperationType, string> = {
    query: 'Q',
    mutation: 'M',
    subscription: 'S',
    unknown: 'O',
  };

  let {
    requests,
    selectedId,
    search = '',
    onselect,
  }: {
    requests: GraphQLRequest[];
    selectedId: string | null;
    search?: string;
    onselect: (id: string) => void;
  } = $props();

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const current = requests.findIndex((r) => r.id === selectedId);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = requests[Math.max(0, Math.min(requests.length - 1, current + step))];
    if (next) onselect(next.id);
  }

  function scrollIntoViewIfSelected(row: HTMLElement, selected: boolean) {
    if (selected) row.scrollIntoView({ block: 'nearest' });
    return {
      update(isSelected: boolean) {
        if (isSelected) row.scrollIntoView({ block: 'nearest' });
      },
    };
  }
</script>

<div class="list">
  <!-- {#if requests.length === 0}
    <p class="empty">No GraphQL requests yet. Interact with the page or reload it.</p>
  {:else} -->
    <table role="grid" tabindex="0" {onkeydown}>
      <thead>
        <tr>
          <th>Operation</th>
          <th>Status</th>
          <th>Time</th>
          <th>Size</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
      {#each requests as request, index (request.id)}
          <tr
            class:selected={request.id === selectedId}
            class:background={index% 2 === 0}
            class:error={!!request.error}
            onclick={() => onselect(request.id)}
            use:scrollIntoViewIfSelected={request.id === selectedId}
          >
            <td class="name" title={request.url}>
              <span class="badge {request.operationType}" title={request.operationType}>
                {TYPE_LETTERS[request.operationType]}
              </span>
              <Highlight text={request.operationName ?? '(anonymous)'} term={search} />
            </td>
            <td>{request.status || '—'}</td>
            <td>{formatDuration(request.duration)}</td>
            <td>{formatBytes(request.responseSize)}</td>
            <td>{request.url}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  <!-- {/if} -->
</div>

<style>
  .list {
    flex: 1;
    overflow: auto;
    min-width: 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    outline: none;
  }
  th {
    position: sticky;
    top: 0;
    text-align: left;
    font-weight: normal;
    color: var(--muted);
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--border);
    padding: 3px 6px;
  }
  td {
    padding: 3px 6px;
    white-space: nowrap;
    border-bottom: 1px solid var(--row-border);
  }
  th:not(:last-child),
  td:not(:last-child) {
    border-right: 1px solid var(--row-border);
  }
  td.name {
    max-width: 0;
    width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  tbody tr {
    cursor: pointer;
  }
  tr.background {
    background: var(--row-alt-bg);
  }
  tbody tr:hover {
    background: var(--hover);
  }
  tr.error td {
    color: var(--error);
  }
  tr.selected,
  tr.selected:hover {
    background: var(--selected);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 6px;
    border-radius: 5px;
    color: var(--chip-color);
    background: #343435;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    vertical-align: middle;
  }
</style>
