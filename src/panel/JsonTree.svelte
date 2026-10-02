<script lang="ts">
  import { untrack } from 'svelte';
  import Self from './JsonTree.svelte';

  type Entry = [string | number, unknown];

  let {
    value,
    keyName = null,
    depth = 0,
  }: {
    value: unknown;
    keyName?: string | number | null;
    depth?: number;
  } = $props();

  let expanded = $state(untrack(() => depth === 0));

  function isExpandable(v: unknown): v is Record<string, unknown> | unknown[] {
    return v !== null && typeof v === 'object';
  }

  function isArrayValue(v: Record<string, unknown> | unknown[]): v is unknown[] {
    return Array.isArray(v);
  }

  function itemCount(v: Record<string, unknown> | unknown[]): number {
    return isArrayValue(v) ? v.length : Object.keys(v).length;
  }

  function itemLabel(n: number): string {
    return `${n} item${n === 1 ? '' : 's'}`;
  }

  function entries(v: Record<string, unknown> | unknown[]): Entry[] {
    return isArrayValue(v) ? v.map((item, i): Entry => [i, item]) : Object.entries(v);
  }

  function formatKey(k: string | number): string {
    return typeof k === 'string' ? `"${k}"` : String(k);
  }

  function formatPrimitive(v: unknown): string {
    return typeof v === 'string' ? JSON.stringify(v) : String(v);
  }

  function valueType(v: unknown): string {
    return v === null ? 'null' : typeof v;
  }
</script>

{#if isExpandable(value)}
  {@const openBrace = isArrayValue(value) ? '[' : '{'}
  {@const closeBrace = isArrayValue(value) ? ']' : '}'}
  <div class="node">
    <button class="row" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
      <span class="arrow" class:open={expanded}>▶</span>
      {#if keyName !== null}<span class="key">{formatKey(keyName)}</span><span class="punct"> : </span>{/if}
      <span class="brace">{openBrace}</span>
      {#if !expanded}
        <span class="ellipsis">…</span><span class="brace">{closeBrace}</span>
        <span class="count">{itemLabel(itemCount(value))}</span>
      {:else}
        <span class="count">{itemLabel(itemCount(value))}</span>
      {/if}
    </button>
    {#if expanded}
      <div class="children">
        {#each entries(value) as [k, v] (k)}
          <Self value={v} keyName={k} depth={depth + 1} />
        {/each}
      </div>
      <div class="row closing"><span class="brace">{closeBrace}</span></div>
    {/if}
  </div>
{:else}
  <div class="row leaf">
    <span class="arrow-spacer"></span>
    {#if keyName !== null}<span class="key">{formatKey(keyName)}</span><span class="punct"> : </span>{/if}
    <span class="value value-{valueType(value)}">{formatPrimitive(value)}</span>
  </div>
{/if}

<style>
  .node {
    font-family: var(--mono);
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 0;
    padding: 1px 0;
    width: 100%;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row.leaf,
  .row.closing {
    cursor: default;
  }
  .arrow,
  .arrow-spacer {
    display: inline-block;
    width: 13px;
    flex-shrink: 0;
  }
  .arrow {
    transition: transform 0.1s ease;
    font-size: 9px;
    color: var(--accent);
  }
  .arrow.open {
    transform: rotate(90deg);
  }
  .children {
    margin-left: 6px;
    padding-left: 7px;
    border-left: 1px solid var(--row-border);
  }
  .key {
    color: var(--json-key);
  }
  .punct,
  .brace {
    color: var(--muted);
  }
  .ellipsis {
    color: var(--muted);
    margin: 0 1px;
  }
  .count {
    color: var(--muted);
    font-style: italic;
    margin-left: 6px;
  }
  .value {
    margin-left: 0;
  }
  .value-string {
    color: var(--json-string);
  }
  .value-number,
  .value-boolean {
    color: var(--accent);
  }
  .value-null,
  .value-undefined {
    color: var(--muted);
  }
</style>
