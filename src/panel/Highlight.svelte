<script lang="ts">
  let { text, term }: { text: string; term: string } = $props();

  const parts = $derived.by(() => {
    const t = term.trim();
    if (!t) return [{ text, match: false }];
    const lower = text.toLowerCase();
    const needle = t.toLowerCase();
    const result: { text: string; match: boolean }[] = [];
    let i = 0;
    while (i < text.length) {
      const idx = lower.indexOf(needle, i);
      if (idx === -1) {
        result.push({ text: text.slice(i), match: false });
        break;
      }
      if (idx > i) result.push({ text: text.slice(i, idx), match: false });
      result.push({ text: text.slice(idx, idx + needle.length), match: true });
      i = idx + needle.length;
    }
    return result;
  });
</script>

{#each parts as part, i (i)}{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}

<style>
  mark {
    background: var(--mark-bg);
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
