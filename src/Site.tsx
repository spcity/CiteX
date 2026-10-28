import { useEffect, useState } from 'react';
import App from './App';
import { journalManager, JournalData } from './lib/journalLoader';
import { Language, Locale, routePath, useLanguage } from './i18n';

const routes = ['/journal-abbreviations/', '/guides/', '/about-data/'];
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

function LanguageToggle({ locale }: { locale: Locale }) {
  const target = locale === 'zh' ? '/en' : '';
  return <button className="cx-language-toggle" onClick={() => { localStorage.setItem('citex-locale', locale === 'zh' ? 'en' : 'zh'); location.href = `${target}${location.pathname.replace(/^\/en/, '') || '/'}`; }} aria-label={locale === 'zh' ? 'Switch to English' : '切换为中文'}>{locale === 'zh' ? 'EN' : '中文'}</button>;
}

function GitHubLink() {
  return (
    <a
      href="https://github.com/spcity/CiteX"
      target="_blank"
      rel="noopener noreferrer"
      className="cx-github-btn"
      aria-label="GitHub Repository"
      title="GitHub - spcity/CiteX"
    >
      <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      <span>GitHub</span>
    </a>
  );
}

function Header({ path, locale }: { path: string; locale: Locale }) {
  const { t } = useLanguage();
  const links: [string, string, string][] = [['/', t('BibTeX 工具', 'BibTeX tool'), t('BibTeX tool', 'BibTeX tool')], ['/journal-abbreviations/', t('期刊缩写查询', 'Journal search'), t('Journal search', 'Journal search')], ['/guides/', t('使用指南', 'Guides'), t('Guides', 'Guides')], ['/about-data/', t('数据说明', 'Data'), t('Data', 'Data')]];
  return <header className="cx-site-header"><a className="cx-brand" href={routePath('/', locale)}><strong>CiteX</strong><span className="cx-brand-meta"><span className="cx-brand-tagline">{t('论文引用，小处严谨。', 'Careful citations, one small step at a time.')}</span><small className="cx-gift-top">A gift for xues💗</small></span></a><nav aria-label={t('网站导航', 'Site navigation')}>{links.map(([url, label]) => <a key={url} href={routePath(url, locale)} aria-current={path === url ? 'page' : undefined}>{label}</a>)}<GitHubLink /><LanguageToggle locale={locale} /></nav></header>;
}

function JournalSearch() {
  const { t } = useLanguage();
  const [query, setQuery] = useState(() => new URLSearchParams(location.hash.slice(1)).get('q') || '');
  const [journals, setJournals] = useState<readonly JournalData[]>([]);
  const [status, setStatus] = useState('loading'); const [page, setPage] = useState(0); const [message, setMessage] = useState('');
  const load = () => { setStatus('loading'); journalManager.loadData().then(() => { setJournals(journalManager.getJournals()); setStatus('ready'); }).catch(() => setStatus('error')); };
  useEffect(load, []);
  const q = normalize(query); const results = q ? journals.map(journal => ({ journal, values: [journal.name, journal.iso, journal.jcr].map(normalize) })).map(row => ({ ...row, score: row.values.some(v => v === q) ? 0 : row.values.some(v => v.includes(q)) ? 1 : row.values.some(v => q.split(' ').every(word => v.includes(word))) ? 2 : 3 })).filter(row => row.score < 3).sort((a, b) => a.score - b.score || a.journal.name.localeCompare(b.journal.name)) : journals.map(journal => ({ journal, score: 0 }));
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); setMessage(`${t('已复制：', 'Copied: ')}${value}`); } catch { setMessage(t('复制失败，请手动复制。', 'Copy failed; please copy manually.')); } };
  return <section className="cx-content"><p className="cx-eyebrow">JOURNAL ABBREVIATION SEARCH</p><h1>{t('找到期刊缩写，直接复制。', 'Find a journal abbreviation and copy it.')}</h1><p>{t('输入期刊全名、部分关键词或已有缩写，对照 ISO 4 与 JCR 数据记录。查询在浏览器本地完成。', 'Search by a full title, keywords, or an existing abbreviation. Compare ISO 4 and JCR records locally in your browser.')}</p><label className="cx-label" htmlFor="journal-query">{t('期刊名称或缩写', 'Journal title or abbreviation')}</label><input id="journal-query" className="cx-search" value={query} placeholder={t('例如 Nature、evolutionary computation…', 'For example Nature or evolutionary computation…')} onChange={event => { setQuery(event.target.value); setPage(0); history.replaceState(null, '', `${location.pathname}${event.target.value ? `#q=${encodeURIComponent(event.target.value)}` : ''}`); }} /><p className="cx-muted">{t('支持部分词匹配，忽略大小写和常见标点；相似结果请核对完整刊名。', 'Partial words are supported; case and common punctuation are ignored. Check the complete title for similar results.')} <a href={routePath('/about-data/', useLanguage().locale)}>{t('查看数据来源', 'View data sources')}</a></p>{status === 'loading' && <p role="status">{t('正在加载期刊数据库…', 'Loading journal data…')}</p>}{status === 'error' && <p role="alert">{t('数据库加载失败。', 'Database loading failed.')} <button onClick={load}>{t('重新加载', 'Retry')}</button></p>}<p role="status" aria-live="polite">{message}</p>{status === 'ready' && <><div className="cx-result-bar"><span>{t(`共 ${results.length.toLocaleString()} 条结果`, `${results.length.toLocaleString()} results`)}</span><a href={routePath('/', useLanguage().locale)}>{t('批量处理 BibTeX →', 'Process BibTeX →')}</a></div>{!results.length ? <p className="cx-empty">{t('未找到匹配期刊。试试更短的关键词。', 'No matching journal found. Try shorter keywords.')}</p> : <div className="cx-table-scroll"><table><thead><tr><th>{t('期刊全名', 'Full title')}</th><th>ISO 4</th><th>JCR</th></tr></thead><tbody>{results.slice(page * 50, (page + 1) * 50).map(({ journal }, i) => <tr key={`${page}-${i}`}><td>{journal.name}</td>{(['iso', 'jcr'] as const).map(mode => <td key={mode}><span>{journal[mode] || t('暂无记录', 'No record')}</span>{journal[mode] && <button onClick={() => copy(journal[mode])}>{t('复制', 'Copy')}</button>}</td>)}</tr>)}</tbody></table></div>}{results.length > 0 && <div className="cx-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>← {t('上一页', 'Previous')}</button><span>{t(`第 ${page + 1} / ${Math.ceil(results.length / 50)} 页`, `Page ${page + 1} / ${Math.ceil(results.length / 50)}`)}</span><button disabled={(page + 1) * 50 >= results.length} onClick={() => setPage(page + 1)}>{t('下一页', 'Next')} →</button></div>}</>}</section>;
}

function Guides() { const { t } = useLanguage(); return <article className="cx-content cx-article"><p className="cx-eyebrow">GUIDES</p><h1>{t('用之前，先知道会改什么。', 'Know what changes before you apply them.')}</h1><h2>{t('如何处理 BibTeX？', 'How does BibTeX review work?')}</h2><p>{t('粘贴内容后，所有条目会按原顺序显示。标题和期刊字段会高亮，点击每条的按钮预览修改，再点击“接受并下一条”。', 'After you paste, every entry appears in order. Title and journal fields are highlighted. Preview a change, then choose “Accept & next”.')}</p><h2>{t('双花括号保护什么？', 'What do double braces protect?')}</h2><p>{t('它保护标题已有的大小写，不会自动纠正大小写。整标题保护也会阻止参考文献样式改变普通单词的大小写。', 'They protect existing capitalization; they do not guess the correct capitalization. Protecting a whole title can also prevent a bibliography style from changing ordinary words.')}</p><pre>{'title = {DNA analysis with Python}\n→\ntitle = {{DNA analysis with Python}}'}</pre><h2>{t('选择 ISO 还是 JCR？', 'ISO or JCR?')}</h2><p>{t('先看投稿期刊的作者指南。ISO 4 是标题词缩写标准；JCR 栏展示数据库中的 JCR 缩写形式。', 'Start with the target journal’s author guide. ISO 4 is a title-word abbreviation standard; the JCR column shows the database’s JCR form.')}</p><p><a href="/">{t('打开 BibTeX 工具 →', 'Open the BibTeX tool →')}</a></p></article>; }

function AboutData() { const { t } = useLanguage(); return <article className="cx-content cx-article"><p className="cx-eyebrow">DATA & SOURCES</p><h1>{t('使用时，先核对投稿要求。', 'Check the target journal before using an abbreviation.')}</h1><h2>{t('如何核对缩写？', 'How should you verify an abbreviation?')}</h2><p>{t('以投稿期刊作者指南为起点，结合出版社说明和 ISSN 记录核对。', 'Start with the target journal’s author guide, then check publisher instructions and ISSN records.')} <a href="https://portal.issn.org/ltwa">ISSN LTWA</a> · <a href="https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/">UBC Woodward Library</a></p><h2>{t('本地处理', 'Local processing')}</h2><p>{t('BibTeX 转换和期刊检索在当前浏览器执行，不上传输入正文。刷新主工具前请复制结果。', 'BibTeX conversion and journal search run in this browser. Your input text is not uploaded. Copy your result before refreshing the tool.')}</p></article>; }

function SiteContent() {
  const stored = (localStorage.getItem('citex-locale') as Locale | null); const rawPath = location.pathname.replace(/\/$/, '') || '/'; const locale: Locale = rawPath === '/en' || rawPath.startsWith('/en/') ? 'en' : stored === 'en' ? 'en' : 'zh'; const path = rawPath.replace(/^\/en(?=\/|$)/, '') || '/';
  return <Language.Provider value={locale}><Header path={path} locale={locale} />{path === '/' ? <App /> : path === '/journal-abbreviations' ? <JournalSearch /> : path === '/guides' ? <Guides /> : path === '/about-data' ? <AboutData /> : <section className="cx-content"><h1>{locale === 'zh' ? '页面不存在' : 'Page not found'}</h1><a href={routePath('/', locale)}>{locale === 'zh' ? '返回 CiteX' : 'Back to CiteX'}</a></section>}<footer className="cx-footer"><span>CiteX · <a href={routePath('/about-data/', locale)}>{locale === 'zh' ? '数据与隐私说明' : 'Data and privacy'}</a> · <a href="https://github.com/spcity/CiteX" target="_blank" rel="noopener noreferrer">GitHub</a></span></footer></Language.Provider>;
}

export default function Site() { return <SiteContent />; }
