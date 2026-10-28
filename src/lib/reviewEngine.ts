/** Source offsets are the contract: unapproved text is never serialized again. */
export interface Field { name: string; start: number; end: number; valueStart: number; valueEnd: number; value: string; literal: string | null }
export type Issue = 'unclosed' | 'syntax' | 'duplicateField' | 'duplicateKey' | 'duplicateReference';
export interface Entry { id: number; type: string; key: string; start: number; end: number; fields: Field[]; issues: Issue[] }
export interface Document { source: string; entries: Entry[]; directives: number }
export interface Edit { start: number; end: number; text: string; kind: 'title' | 'journal' | 'format' }
export interface Decision { edits: Edit[]; reviewed: boolean }
const space = (c: string) => /\s/.test(c);
const escaped = (s: string, i: number) => { let n = 0; while (i > 0 && s[--i] === '\\') n++; return n % 2 === 1; };

function skip(s: string, i: number, limit = s.length): number {
  while (i < limit) {
    if (space(s[i]) || s[i] === ',') { i++; continue; }
    if (s[i] === '%') { while (i < limit && s[i] !== '\n') i++; continue; }
    break;
  }
  return i;
}

// Return the end of a balanced braced/quoted atom, including its delimiter.
function atomEnd(s: string, start: number, limit: number): number {
  const quoted = s[start] === '"';
  let depth = quoted ? 0 : 1;
  for (let i = start + 1; i < limit; i++) {
    if (escaped(s, i)) continue;
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (!quoted && depth === 0) return i + 1; if (depth < 0) return -1; }
    else if (quoted && s[i] === '"' && depth === 0) return i + 1;
  }
  return -1;
}

export function literalValue(value: string): string | null {
  if ((value[0] !== '{' && value[0] !== '"') || atomEnd(value, 0, value.length) !== value.length) return null;
  return value.slice(1, -1);
}

export function protectTitle(field: Field): string | null {
  if (field.literal === null) return null;
  const inner = field.literal;
  const trimmed = inner.trim();
  if (trimmed.startsWith('{') && atomEnd(trimmed, 0, trimmed.length) === trimmed.length) return field.value;
  return `{{${inner}}}`;
}

function readFields(s: string, start: number, end: number, entry: Entry) {
  let i = start;
  const names = new Set<string>();
  while ((i = skip(s, i, end)) < end) {
    const fieldStart = i;
    const match = /^[A-Za-z][\w-]*/.exec(s.slice(i, end));
    if (!match) { entry.issues.push('syntax'); return; }
    const name = match[0].toLowerCase(); i += match[0].length;
    while (i < end && space(s[i])) i++;
    if (s[i++] !== '=') { entry.issues.push('syntax'); return; }
    while (i < end && space(s[i])) i++;
    const valueStart = i;
    let expectAtom = true, lastEnd = i;
    while (i < end) {
      while (i < end && space(s[i])) i++;
      if (expectAtom) {
        if (s[i] === '{' || s[i] === '"') {
          const next = atomEnd(s, i, end);
          if (next < 0) { entry.issues.push('syntax'); return; }
          i = next;
        } else {
          const bare = /^[A-Za-z0-9_:+.\/-]+/.exec(s.slice(i, end));
          if (!bare) { entry.issues.push('syntax'); return; }
          i += bare[0].length;
        }
        lastEnd = i; expectAtom = false;
      } else if (s[i] === '#') { i++; expectAtom = true; }
      else break;
    }
    if (expectAtom) { entry.issues.push('syntax'); return; }
    if (i < end && s[i] !== ',' && s[i] !== '%') { entry.issues.push('syntax'); return; }
    if (names.has(name)) entry.issues.push('duplicateField');
    names.add(name);
    const value = s.slice(valueStart, lastEnd);
    entry.fields.push({ name, start: fieldStart, end: lastEnd, valueStart, valueEnd: lastEnd, value, literal: literalValue(value) });
  }
}

export function parseDocument(source: string): Document {
  const entries: Entry[] = [];
  let directives = 0, i = 0;
  while (i < source.length) {
    if (source[i] === '%') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if (source[i] !== '@') { i++; continue; }
    const header = /^@(\w+)\s*([({])/.exec(source.slice(i));
    if (!header) { i++; continue; }
    const start = i, type = header[1].toLowerCase(), opening = header[2];
    i += header[0].length;
    const bodyStart = i;
    let depth = 0, quote = false, close = -1;
    for (; i < source.length; i++) {
      if (escaped(source, i)) continue;
      const c = source[i];
      if (c === '%' && depth === 0 && !quote) { while (i < source.length && source[i] !== '\n') i++; continue; }
      if (c === '"' && depth === 0) { quote = !quote; continue; }
      if (c === '{') { depth++; continue; }
      if (c === '}') {
        if (depth > 0) depth--;
        else if (opening === '{' && !quote) { close = i; break; }
      }
      if (c === ')' && opening === '(' && depth === 0 && !quote) { close = i; break; }
    }
    const end = close < 0 ? source.length : close + 1;
    i = end;
    if (['string', 'preamble', 'comment'].includes(type) && close >= 0) { directives++; continue; }
    const entry: Entry = { id: entries.length, type, key: '', start, end, fields: [], issues: [] };
    const comma = source.indexOf(',', bodyStart);
    if (close < 0) entry.issues.push('unclosed');
    if (comma < bodyStart || comma >= (close < 0 ? end : close)) entry.issues.push('syntax');
    else {
      entry.key = source.slice(bodyStart, comma).trim();
      if (!entry.key || /\s|[{}=]/.test(entry.key)) entry.issues.push('syntax');
      if (close >= 0) readFields(source, comma + 1, close, entry);
    }
    entries.push(entry);
  }
  const keys = new Map<string, Entry[]>(), references = new Map<string, Entry[]>();
  for (const entry of entries) {
    if (entry.key) keys.set(entry.key, [...(keys.get(entry.key) || []), entry]);
    const doi = entry.fields.find(f => f.name === 'doi')?.literal?.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi.org\//, '');
    const title = entry.fields.find(f => f.name === 'title')?.literal?.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    for (const key of [doi && `doi:${doi}`, title && `title:${title}`]) if (key) references.set(key, [...(references.get(key) || []), entry]);
  }
  for (const group of keys.values()) if (group.length > 1) group.forEach(e => e.issues.push('duplicateKey'));
  for (const group of references.values()) if (group.length > 1) group.forEach(e => { if (!e.issues.includes('duplicateReference')) e.issues.push('duplicateReference'); });
  return { source, entries, directives };
}

export const isSafe = (entry: Entry) => !entry.issues.some(i => ['syntax', 'unclosed', 'duplicateField'].includes(i));
export const fieldEdit = (field: Field, text: string, kind: 'title' | 'journal'): Edit => ({ start: field.valueStart, end: field.valueEnd, text, kind });

export function applyEdits(source: string, edits: Edit[]): string {
  let result = source, previous = source.length;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > previous) throw new Error('Overlapping or invalid edit');
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    previous = edit.start;
  }
  return result;
}

/** Formatting is opt-in and only touches complete, comment-free entries. */
export function formatEntry(source: string, entry: Entry, edits: Edit[]): string | null {
  if (!isSafe(entry)) return null;
  let gap = source.slice(entry.start, entry.fields[0]?.start ?? entry.end);
  for (let i = 0; i < entry.fields.length; i++) gap += source.slice(entry.fields[i].end, entry.fields[i + 1]?.start ?? entry.end);
  if (gap.includes('%')) return null;
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const fields = entry.fields.map((f, index) => {
    const replacement = edits.find(e => e.start === f.valueStart && e.end === f.valueEnd);
    const comma = index < entry.fields.length - 1 ? ',' : '';
    return `  ${f.name} = ${replacement?.text ?? f.value}${comma}`;
  });
  return `@${entry.type}{${entry.key},${eol}${fields.join(eol)}${fields.length ? eol : ''}}`;
}

export function exportDocument(document: Document, decisions: Record<number, Decision>): string {
  return applyEdits(document.source, Object.values(decisions).flatMap(d => d.edits));
}
