<script lang="ts">
  import { highlightGraphQL } from '../lib/graphqlFold';

  let { source }: { source: string } = $props();

  let expanded = $state(true);
</script>

<div class="graphql-view">
  <button class="toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
    <span class="arrow" class:open={expanded}>▶</span>
    Query
  </button>
  {#if expanded}
    <pre class="content">{@html highlightGraphQL(source)}</pre>
  {/if}
</div>

<style>
  .graphql-view {
    font-family: var(--mono);
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    padding: 2px 0;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
  }
  .arrow {
    display: inline-block;
    transition: transform 0.1s ease;
    font-size: 9px;
  }
  .arrow.open {
    transform: rotate(90deg);
  }
  .content {
    margin: 4px 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }
  .content :global(.tok-keyword) {
    color: var(--accent);
    font-weight: 600;
  }
  .content :global(.tok-string) {
    color: var(--json-string);
  }
  .content :global(.tok-variable) {
    color: var(--mutation);
  }
  .content :global(.tok-comment) {
    color: var(--muted);
    font-style: italic;
  }
</style>
