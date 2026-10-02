const TOKEN_RE =
  /(#[^\n]*)|("""[\s\S]*?"""|"(?:\\.|[^"\\])*")|(\$[_A-Za-z][_0-9A-Za-z]*)|\b(query|mutation|subscription|fragment|on|true|false|null)\b/g;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightGraphQL(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    out += escapeHtml(text.slice(last, m.index));
    const [full, comment, str, variable, keyword] = m;
    if (comment) out += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    else if (str) out += `<span class="tok-string">${escapeHtml(str)}</span>`;
    else if (variable) out += `<span class="tok-variable">${escapeHtml(variable)}</span>`;
    else if (keyword) out += `<span class="tok-keyword">${escapeHtml(keyword)}</span>`;
    last = m.index! + full.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}
