import { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { useLanguage } from './i18n';
import { journalManager } from './lib/journalLoader';
import {
  applyEdits,
  Decision,
  Document,
  Entry,
  Edit,
  exportDocument,
  fieldEdit,
  formatEntry,
  parseDocument,
  protectTitle,
} from './lib/reviewEngine';

const sample = `@article{smith2024,
  author = {Alex Smith},
  title = {AI and DNA: A Practical Review},
  journal = {Nature Reviews Microbiology},
  year = {2024},
  doi = {10.1000/example}
}

@article{garcia2023,
  author = {Maria Garcia and Lee Chen},
  title = {Machine Learning for RNA Structure Prediction},
  journal = {Nature},
  volume = {621},
  pages = {101--108},
  year = {2023}
}

@inproceedings{kim2020,
  author = {Jin Kim},
  title = {Efficient Optimization with Graph-Based Methods},
  booktitle = {Proceedings of ICML},
  year = {2020}
}

@article{patel2022,
  author = {Ravi Patel},
  title = {A Survey of Neural Networks in Medical Imaging},
  journal = {IEEE Transactions on Pattern Analysis and Machine Intelligence},
  volume = {44},
  year = {2022}
}

@article{nguyen2021,
  author = {Linh Nguyen},
  title = {Climate Change and Coastal Ecosystems},
  journal = {Global Change Biology},
  year = {2021}
}

@article{lee2019,
  author = {Sora Lee},
  title = {Reproducible Workflows for Scientific Computing},
  journal = {Nature Methods},
  year = {2019}
}`;

const samplePlaceholder = sample;

type JournalMode = 'iso' | 'jcr';

function literalReplacement(fieldValue: string, value: string) {
  if (fieldValue.trimStart().startsWith('"')) return `"${value}"`;
  return `{${value}}`;
}

function upsertFieldEdit(decision: Decision | undefined, edit: Edit): Decision {
  const edits = (decision?.edits || []).filter(existing => existing.kind !== 'format' && !(existing.start === edit.start && existing.end === edit.end));
  return { edits: [...edits, edit], reviewed: decision?.reviewed ?? false };
}

function EntryBlock({
  document,
  entry,
  active,
  decision,
  setRef,
  onCopyCitation,
  copiedCitation,
  t,
}: {
  document: Document;
  entry: Entry;
  active: boolean;
  decision?: Decision;
  setRef: (node: HTMLElement | null) => void;
  onCopyCitation: (key: string) => void;
  copiedCitation: string | null;
  t: (zh: string, en: string) => string;
}) {
  const source = document.source.slice(entry.start, entry.end);
  const lines: { text: string; start: number }[] = [];
  let offset = entry.start;
  source.split('\n').forEach(text => {
    lines.push({ text, start: offset });
    offset += text.length + 1;
  });
  const titleEdit = decision?.edits.find(edit => edit.kind === 'title');
  const journalEdit = decision?.edits.find(edit => edit.kind === 'journal');
  const issueText = entry.issues.length ? t('需要先检查：', 'Check before editing: ') + entry.issues.join(', ') : '';

  return <article ref={setRef} className={`cx-entry-block ${active ? 'is-active' : 'is-ghost'} ${decision?.reviewed ? 'is-reviewed' : ''}`} data-entry-id={entry.id}>
    <div className="cx-entry-marker"><span>#{String(entry.id + 1).padStart(2, '0')}</span>{entry.key ? <button className="cx-citation-chip" onClick={() => onCopyCitation(entry.key)} title={t('复制 LaTeX 引用', 'Copy LaTeX citation')} aria-label={t(`复制引用 \\cite{${entry.key}}`, `Copy citation \\cite{${entry.key}}`)}><code>{`\\cite{${entry.key}}`}</code><small>{copiedCitation === entry.key ? t('已复制', 'Copied') : t('复制', 'Copy')}</small></button> : <span className="cx-citation-missing">{t('无引用键', 'untitled')}</span>}<em>{active ? t('当前检查', 'Current') : decision?.reviewed ? t('已确认', 'Reviewed') : t('待检查', 'Pending')}</em></div>
    <div className="cx-entry-text">
      {lines.map((line, index) => {
        const lineEnd = line.start + line.text.length;
        const field = entry.fields.find(candidate => candidate.valueStart < lineEnd + 1 && candidate.valueEnd > line.start);
        const fieldClass = field?.name === 'title' ? 'field-title' : field?.name === 'journal' ? 'field-journal' : '';
        const changed = (field && ((field.name === 'title' && titleEdit) || (field.name === 'journal' && journalEdit)));
        return <div key={`${entry.id}-${index}`} className={`cx-document-line ${fieldClass}`}><span>{line.text}</span>{changed && <small className="cx-changed-value">{t('已预览修改', 'previewed')}</small>}</div>;
      })}
    </div>
    {issueText && <div className="cx-issues">{issueText}</div>}
  </article>;
}

export default function App() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [document, setDocument] = useState<Document | null>(null);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [active, setActive] = useState(0);
  const [dbState, setDbState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const refs = useRef(new Map<number, HTMLElement>());
  const entryListRef = useRef<HTMLDivElement | null>(null);
  const wheelLock = useRef(false);
  const scrollAnimation = useRef<number | null>(null);

  useEffect(() => {
    globalThis.document.body.classList.add('cx-tool-page');
    return () => globalThis.document.body.classList.remove('cx-tool-page');
  }, []);

  useEffect(() => {
    journalManager.loadData().then(() => setDbState('ready')).catch(() => setDbState('error'));
  }, []);

  const activeEntry = document?.entries[active] || null;
  const activeDecision = activeEntry ? decisions[activeEntry.id] : undefined;
  const activePreview = useMemo(() => {
    if (!document || !activeEntry) return '';
    const source = document.source.slice(activeEntry.start, activeEntry.end);
    const formatEdit = activeDecision?.edits.find(edit => edit.kind === 'format');
    if (formatEdit) return formatEdit.text;
    const localEdits = (activeDecision?.edits || []).map(edit => ({ ...edit, start: edit.start - activeEntry.start, end: edit.end - activeEntry.start }));
    return localEdits.length ? applyEdits(source, localEdits) : source;
  }, [document, activeEntry, activeDecision]);
  const output = document ? exportDocument(document, decisions) : '';
  const reviewed = document ? document.entries.filter(entry => decisions[entry.id]?.reviewed).length : 0;
  const duplicateKeys = useMemo(() => {
    if (!document) return [] as [string, number][];
    const counts = new Map<string, number>();
    document.entries.forEach(entry => { if (entry.key) counts.set(entry.key, (counts.get(entry.key) || 0) + 1); });
    return [...counts.entries()].filter(([, count]) => count > 1);
  }, [document]);

  const goToEntry = (id: number) => {
    if (!document) return;
    const next = Math.max(0, Math.min(id, document.entries.length - 1));
    setActive(next);
    const container = entryListRef.current;
    const target = refs.current.get(next);
    if (!container || !target) { wheelLock.current = false; return; }
    const targetTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    const centeredTop = targetTop - (container.clientHeight - target.offsetHeight) / 2;
    const destination = Math.max(0, Math.min(centeredTop, container.scrollHeight - container.clientHeight));
    if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
    const start = container.scrollTop;
    const distance = destination - start;
    if (Math.abs(distance) < 1) { wheelLock.current = false; return; }
    const startedAt = performance.now();
    const duration = 280;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      container.scrollTop = start + distance * eased;
      if (progress < 1) scrollAnimation.current = requestAnimationFrame(animate);
      else { container.scrollTop = destination; scrollAnimation.current = null; wheelLock.current = false; }
    };
    scrollAnimation.current = requestAnimationFrame(animate);
  };

  const handleEntryWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!document || !event.deltaY) return;
    event.preventDefault();
    if (wheelLock.current) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(active + direction, document.entries.length - 1));
    if (next === active) return;
    wheelLock.current = true;
    goToEntry(next);
  };

  const analyze = (text = input) => {
    const next = parseDocument(text);
    if (!next.entries.length) return;
    setDocument(next);
    setDecisions({});
    setActive(0);
    if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
    scrollAnimation.current = null;
    wheelLock.current = false;
    entryListRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const updateDecision = (id: number, updater: (decision: Decision | undefined) => Decision) => setDecisions(current => ({ ...current, [id]: updater(current[id]) }));
  const protect = (entry: Entry) => {
    const field = entry.fields.find(candidate => candidate.name === 'title');
    const value = field ? protectTitle(field) : null;
    if (!field || value === null) return;
    updateDecision(entry.id, decision => upsertFieldEdit(decision, fieldEdit(field, value, 'title')));
  };
  const chooseJournal = (entry: Entry, mode: JournalMode) => {
    const field = entry.fields.find(candidate => candidate.name === 'journal');
    if (!field) return;
    const abbreviation = mode === 'iso' ? journalManager.getISOAbbreviation(field.literal || '') : journalManager.getJCRAbbreviation(field.literal || '');
    if (!abbreviation) return;
    updateDecision(entry.id, decision => upsertFieldEdit(decision, fieldEdit(field, literalReplacement(field.value, abbreviation), 'journal')));
  };
  const format = (entry: Entry) => {
    if (!document) return;
    const current = decisions[entry.id]?.edits.filter(edit => edit.kind !== 'format') || [];
    const formatted = formatEntry(document.source, entry, current);
    if (!formatted) return;
    setDecisions(state => ({ ...state, [entry.id]: { edits: [{ start: entry.start, end: entry.end, text: formatted, kind: 'format' }], reviewed: state[entry.id]?.reviewed ?? false } }));
  };
  const accept = async (entry: Entry) => {
    const nextDecisions = { ...decisions, [entry.id]: { edits: decisions[entry.id]?.edits || [], reviewed: true } };
    setDecisions(nextDecisions);
    if (document && entry.id < document.entries.length - 1) {
      const next = entry.id + 1;
      window.setTimeout(() => goToEntry(next), 20);
    } else if (document && entry.id === document.entries.length - 1) {
      const finalResult = exportDocument(document, nextDecisions);
      if (finalResult) {
        try {
          await navigator.clipboard.writeText(finalResult);
          setCopied(true);
        } catch {
          // Fallback if clipboard API restricted
        }
      }
      setIsCompletedModalOpen(true);
    }
  };
  const copyResult = async () => { if (!output) return; try { await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } };
  const copyCitation = async (key: string) => { try { await navigator.clipboard.writeText(`\\cite{${key}}`); setCopiedCitation(key); window.setTimeout(() => setCopiedCitation(current => current === key ? null : current), 1400); } catch { setCopiedCitation(null); } };
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' })); const a = globalThis.document.createElement('a'); a.href = url; a.download = 'citex-output.bib'; a.click(); URL.revokeObjectURL(url); };
  const reset = () => { setInput(''); setDocument(null); setDecisions({}); setActive(0); setCopied(false); setIsCompletedModalOpen(false); if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current); scrollAnimation.current = null; wheelLock.current = false; entryListRef.current?.scrollTo({ top: 0, behavior: 'auto' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return <main className={`cx-tool ${!document ? 'cx-tool-input-mode' : 'cx-tool-review-mode'}`}>
    <section className="cx-tool-hero"><div><p className="cx-eyebrow">{t('逐条审核工作区', 'ENTRY REVIEW WORKSPACE')}</p><h1>{t('看见每一次修改，再交给 LaTeX。', 'See every change before LaTeX sees it.')}</h1></div><span className="cx-local-badge">● {dbState === 'ready' ? t('本地数据库就绪', 'Local database ready') : dbState === 'error' ? t('数据库加载失败', 'Database unavailable') : t('正在加载本地数据', 'Loading local data')}</span></section>
    <section className={`cx-review-layout ${!document ? 'is-input-mode' : 'is-review-mode'}`}>
      <aside className="cx-review-sidebar"><div className="cx-progress"><span>{t('审核进度', 'Review progress')}</span><strong>{reviewed} / {document?.entries.length || 0}</strong><div className="cx-progress-track"><i style={{ width: `${document?.entries.length ? reviewed / document.entries.length * 100 : 0}%` }} /></div><small>{t(`已确认 ${reviewed} 条修改`, `${reviewed} reviewed`)}</small></div>{document && <div className={`cx-duplicate-notice ${duplicateKeys.length ? 'has-duplicates' : 'is-clear'}`} role="status" aria-live="polite">{duplicateKeys.length ? <><strong>{t('发现重复引用键', 'Duplicate citation keys')}</strong><span>{t(`共 ${duplicateKeys.length} 个键重复`, `${duplicateKeys.length} repeated key${duplicateKeys.length === 1 ? '' : 's'}`)}</span><code>{duplicateKeys.map(([key, count]) => `${key} ×${count}`).join(' · ')}</code><small>{t('仅提示，不会修改内容。', 'Notice only; nothing is changed.')}</small></> : <><strong>{t('引用键检查通过', 'Citation key check passed')}</strong><span>{t('未发现重复引用键', 'No duplicate citation keys found')}</span></>}</div>}<div className="cx-sidebar-actions"><button disabled={!output} onClick={copyResult}>{copied ? t('已复制', 'Copied') : t('复制结果', 'Copy result')}</button><button disabled={!output} onClick={download}>{t('下载 .bib', 'Download .bib')}</button><button onClick={reset}>{t('重新开始', 'Start over')}</button><p className="cx-reset-note">{t('重新开始会清空当前修改，请先复制或下载结果。', 'Start over clears your current edits. Copy or download the result first.')}</p></div><div className="cx-legend"><p><span className="dot title" />{t('标题字段', 'Title field')}</p><p><span className="dot journal" />{t('期刊字段', 'Journal field')}</p><p><span className="dot change" />{t('已预览修改', 'Previewed change')}</p></div></aside>
      <div className="cx-entry-column">
        <div className="cx-entry-list" ref={entryListRef} onWheel={handleEntryWheel}>
          {!document ? <div className="cx-inline-input-stage"><div className="cx-list-head"><div><strong>{t('粘贴你的 BibTeX', 'Paste your BibTeX')}</strong><span>{t('输入后点击开始审核；灰色示例只作为格式提示。', 'Paste your entries, then start the review. Gray examples are format hints.')}</span></div><span>{t('本地处理，不上传正文', 'Processed locally')}</span></div><textarea aria-label={t('BibTeX 输入', 'BibTeX input')} value={input} onChange={event => setInput(event.target.value)} placeholder={samplePlaceholder} spellCheck={false} /><div className="cx-inline-start-actions"><button className="cx-primary" disabled={!input.trim()} onClick={() => analyze()}>{t('开始审核 →', 'Start review →')}</button><button className="cx-secondary" onClick={() => { setInput(sample); analyze(sample); }}>{t('载入示例', 'Load example')}</button></div></div> : <><div className="cx-list-head"><div><strong>{t('完整 BibTeX 文本', 'Full BibTeX document')}</strong><span>{t('滚动一次切换一条；右侧只跟随当前条目。', 'One wheel step changes one entry; the right panel follows it.')}</span></div><span>#{String(active + 1).padStart(2, '0')} / {document.entries.length}</span></div>{document.entries.map(entry => <EntryBlock key={entry.id} document={document} entry={entry} active={entry.id === active} decision={decisions[entry.id]} setRef={node => { if (node) refs.current.set(entry.id, node); else refs.current.delete(entry.id); }} onCopyCitation={copyCitation} copiedCitation={copiedCitation} t={t} />)}</>}
        </div>
        {document && <nav className="cx-entry-dots" aria-label={t('条目导航', 'Entry navigation')}>{document.entries.map(entry => <button key={entry.id} className={`cx-entry-dot ${entry.id === active ? 'is-active' : ''} ${decisions[entry.id]?.reviewed ? 'is-reviewed' : ''}`} onClick={() => goToEntry(entry.id)} aria-label={t(`跳转到第 ${entry.id + 1} 条`, `Go to entry ${entry.id + 1}`)} title={t(`第 ${entry.id + 1} 条 · ${entry.key}`, `Entry ${entry.id + 1} · ${entry.key}`)}><span /></button>)}</nav>}
      </div>
      <aside className="cx-output"><div className="cx-output-head"><strong>{t('当前条目与结果预览', 'Active entry and result')}</strong><span>{document && activeEntry ? `#${String(activeEntry.id + 1).padStart(2, '0')} / ${document.entries.length}` : t('等待输入', 'Waiting')}</span></div>{document && activeEntry ? <div className="cx-floating-actions"><button className={activeDecision?.edits.some(edit => edit.kind === 'title') ? 'selected title-action' : ''} onClick={() => protect(activeEntry)} disabled={!activeEntry.fields.some(field => field.name === 'title')}>{t('标题加双花括号', 'Protect title')}</button><div className="cx-floating-journals"><button className={activeDecision?.edits.some(edit => edit.kind === 'journal' && edit.text.includes(journalManager.getISOAbbreviation(activeEntry.fields.find(field => field.name === 'journal')?.literal || '') || '___')) ? 'selected iso' : ''} onClick={() => chooseJournal(activeEntry, 'iso')}>{t('ISO 4 缩写', 'ISO 4')}</button><button className={activeDecision?.edits.some(edit => edit.kind === 'journal' && edit.text.includes(journalManager.getJCRAbbreviation(activeEntry.fields.find(field => field.name === 'journal')?.literal || '') || '___')) ? 'selected jcr' : ''} onClick={() => chooseJournal(activeEntry, 'jcr')}>{t('JCR 缩写', 'JCR')}</button></div><button onClick={() => format(activeEntry)}>{t('格式化当前条目', 'Format current entry')}</button><button className={`cx-floating-next ${activeEntry.id === document.entries.length - 1 ? 'is-finish-step' : ''}`} onClick={() => accept(activeEntry)}>{activeEntry.id === document.entries.length - 1 ? (reviewed === document.entries.length ? t('✓ 已全部完成 · 复制/查看结果', '✓ All finished · View/copy result') : t('接受并完成 ✓', 'Accept & finish ✓')) : t('接受并进入下一条 →', 'Accept & next →')}</button></div> : <div className="cx-output-empty">{t('开始审核后，这里只显示当前条目的原文与修改结果。', 'After you start, this panel shows only the active entry and its result.')}</div>}<pre>{activePreview}</pre></aside>
    </section>
    {isCompletedModalOpen && (
      <div className="cx-modal-backdrop" onClick={() => setIsCompletedModalOpen(false)}>
        <div className="cx-modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="cx-modal-icon">🎉</div>
          <h2>{t('所有参考文献审核完成！', 'All entries reviewed!')}</h2>
          <p className="cx-modal-desc">
            {copied
              ? t('最终 BibTeX 已自动复制到你的剪贴板，可直接粘贴到 LaTeX / Overleaf 中！', 'The updated BibTeX has been copied to your clipboard. Paste it directly into your LaTeX or Overleaf project!')
              : t('所有参考文献已全部确认完毕，你可以直接复制结果或下载 .bib 文件。', 'All references have been confirmed. You can now copy the result or download the .bib file.')}
          </p>
          <div className="cx-modal-actions">
            <button className={`cx-modal-primary ${copied ? 'is-copied' : ''}`} onClick={copyResult}>
              {copied ? t('✓ 已复制到剪贴板', '✓ Copied to clipboard') : t('📋 复制完整 BibTeX', '📋 Copy BibTeX')}
            </button>
            <button className="cx-modal-secondary" onClick={download}>
              {t('📥 下载 .bib 文件', '📥 Download .bib')}
            </button>
          </div>
          <button className="cx-modal-close-btn" onClick={() => setIsCompletedModalOpen(false)}>
            {t('返回工作区检查', 'Back to workspace')}
          </button>
        </div>
      </div>
    )}
  </main>;
}
