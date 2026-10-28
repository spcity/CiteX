import { readFile, writeFile, mkdir } from 'node:fs/promises';

const origin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin.replace(/\/$/, '') : null;

const pages = {
  zh: [
    { path: '/', title: 'BibTeX 期刊缩写转换与标题保护 | CiteX', description: 'CiteX 在浏览器本地审核 BibTeX：保护标题大小写，比较 ISO 4 与 JCR 期刊缩写，并逐条预览每次修改。', heading: '浏览器内完成 BibTeX 审核', intro: 'CiteX 是一个面向科研写作者的浏览器本地工具，用于检查 BibTeX、保护标题大小写、比较期刊缩写，并在交给 LaTeX 前逐条确认结果。', sections: [{ heading: '主要功能', body: '粘贴 BibTeX 后，条目按原顺序展示；标题和期刊字段会高亮，ISO 4 或 JCR 缩写、双花括号标题保护和格式化结果都可以先预览再接受。' }, { heading: '本地处理', body: '转换、检查和期刊查询在当前浏览器完成，输入正文不会上传到 CiteX 服务。' }] },
    { path: '/journal-abbreviations/', title: '期刊缩写查询：ISO 4 与 JCR | CiteX', description: '按期刊全名、关键词或已有缩写查询 CiteX 的 ISO 4 与 JCR 对照，并复制匹配结果。', heading: '查询期刊缩写', intro: '使用期刊全名、部分关键词或已有缩写查找匹配记录，并对照 ISO 4 与 JCR 两种形式。', sections: [{ heading: '适合什么场景', body: '当投稿指南要求使用期刊缩写时，可以先在本页查找候选值，再按照目标期刊的作者指南做最终核对。' }, { heading: '查询方式', body: '查询支持部分词、大小写不敏感和常见标点归一化；相似刊名仍需要人工确认。' }] },
    { path: '/guides/', title: 'BibTeX 标题大小写与期刊缩写使用指南 | CiteX', description: '了解 BibTeX 双花括号标题保护、ISO 4 与 JCR 期刊缩写，以及 CiteX 的逐条审核流程。', heading: '先理解修改，再交给 LaTeX', intro: 'CiteX 把 BibTeX 修改拆成可见、可核对的步骤，帮助你理解标题大小写保护和期刊缩写替换。', sections: [{ heading: '标题保护', body: '双花括号用于保留标题中需要保持大写的字母或缩写；CiteX 不猜测你想要的标题大小写。' }, { heading: '期刊缩写', body: 'ISO 4 和 JCR 是两种不同的缩写形式，实际投稿时应以目标期刊的作者指南为准。' }] },
    { path: '/about-data/', title: '期刊缩写核对与本地处理说明 | CiteX', description: '了解 CiteX 中期刊缩写的核对建议，以及 BibTeX 转换和查询如何在浏览器本地完成。', heading: '使用缩写前先核对投稿要求', intro: '期刊缩写可能因投稿格式和出版商要求而不同，CiteX 提供查询和预览，最终选择应以目标期刊说明为准。', sections: [{ heading: '核对入口', body: '可以参考目标期刊作者指南、出版社说明和 ISSN LTWA，再比较 CiteX 查询到的 ISO 4 或 JCR 形式。' }, { heading: '本地处理', body: 'BibTeX 转换和期刊检索在当前浏览器执行，输入正文不会上传；刷新工具前请复制或下载结果。' }] },
  ],
  en: [
    { path: '/', title: 'BibTeX Journal Abbreviation Converter & Title Protection | CiteX', description: 'CiteX reviews BibTeX in your browser: protect title capitalization, compare ISO 4 and JCR journal abbreviations, and preview every change.', heading: 'Review BibTeX before LaTeX', intro: 'CiteX is a browser-local tool for researchers who need to inspect BibTeX, protect title capitalization, compare journal abbreviations, and approve changes one entry at a time.', sections: [{ heading: 'What it does', body: 'Paste BibTeX to see entries in order. Title and journal fields are highlighted, while title protection, ISO 4 or JCR replacements, and formatting remain visible before you accept them.' }, { heading: 'Local processing', body: 'Conversion, checks, and journal lookup run in the current browser. Your BibTeX body is not uploaded to CiteX.' }] },
    { path: '/journal-abbreviations/', title: 'Journal Abbreviation Search: ISO 4 & JCR | CiteX', description: 'Search CiteX by journal title, keywords, or an existing abbreviation, then compare and copy ISO 4 and JCR forms.', heading: 'Search journal abbreviations', intro: 'Search by a full journal title, partial keywords, or an existing abbreviation and compare ISO 4 with JCR forms.', sections: [{ heading: 'When to use it', body: 'Use the lookup when author guidelines require a journal abbreviation, then verify the candidate against the target journal instructions.' }, { heading: 'Search behavior', body: 'Partial words, case-insensitive matching, and common punctuation normalization are supported. Similar titles still need a manual check.' }] },
    { path: '/guides/', title: 'BibTeX Title Capitalization and Journal Abbreviation Guide | CiteX', description: 'Learn how BibTeX double braces protect capitalization, how ISO 4 and JCR abbreviations differ, and how CiteX reviews each entry.', heading: 'Understand each change before LaTeX', intro: 'CiteX turns BibTeX edits into visible, reviewable steps so you can check capitalization protection and journal replacement before exporting.', sections: [{ heading: 'Protecting titles', body: 'Double braces preserve letters or abbreviations that must stay uppercase. CiteX does not guess the capitalization you want.' }, { heading: 'Choosing an abbreviation', body: 'ISO 4 and JCR are different forms. Follow the author guidelines for the journal where you plan to submit.' }] },
    { path: '/about-data/', title: 'Journal Abbreviation Checks and Local Processing | CiteX', description: 'Read CiteX guidance for checking journal abbreviations and learn how BibTeX conversion and lookup run locally in your browser.', heading: 'Verify the target journal first', intro: 'Journal abbreviations can vary by submission style and publisher. CiteX provides lookup and preview; the target journal instructions remain the final reference.', sections: [{ heading: 'Where to verify', body: 'Check the target journal author guide, publisher instructions, and ISSN LTWA before choosing an ISO 4 or JCR form.' }, { heading: 'Local processing', body: 'BibTeX conversion and journal lookup run in the current browser. Your input body is not uploaded; copy or download results before refreshing.' }] },
  ],
};

const template = await readFile('dist/index.html', 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const pageUrl = path => origin ? `${origin}${path}` : path;
const languagePath = (locale, path) => locale === 'en' ? `/en${path}` : path;

function staticContent(locale, meta) {
  const localePages = pages[locale];
  const navigation = localePages.map(page => `<a href="${languagePath(locale, page.path)}">${escape(page.title.split(' | ')[0])}</a>`).join(' · ');
  const sections = meta.sections.map(section => `<section><h2>${escape(section.heading)}</h2><p>${escape(section.body)}</p></section>`).join('');
  return `<header style="display:flex;justify-content:space-between;align-items:center;padding:18px 4vw;border-bottom:1px solid #e2e8f0;font-family:system-ui"><a href="${languagePath(locale, '/') }" style="font-weight:700;color:#1d4ed8">CiteX</a><nav style="display:flex;gap:12px;align-items:center"><a href="https://github.com/spcity/CiteX" target="_blank" rel="noopener noreferrer">GitHub</a>${locale === 'en' ? `<a href="${meta.path}">中文</a>` : `<a href="/en${meta.path}">English</a>`}</nav></header><main style="max-width:900px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.8"><nav aria-label="${locale === 'en' ? 'Site navigation' : '网站导航'}">${navigation}</nav><h1>${escape(meta.heading)}</h1><p>${escape(meta.intro)}</p>${sections}<noscript>${locale === 'en' ? 'Interactive features require JavaScript.' : '交互工具需要 JavaScript。启用后可以本地处理和查询。'}</noscript></main><footer style="padding:24px;text-align:center;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;font-family:system-ui">CiteX · <a href="https://github.com/spcity/CiteX" target="_blank" rel="noopener noreferrer">GitHub</a></footer>`;
}

function structuredData(locale, meta, outputPath) {
  const url = pageUrl(outputPath);
  const homePath = locale === 'en' ? '/en/' : '/';
  const graph = [
    { '@type': 'WebSite', '@id': `${pageUrl(homePath)}#website`, name: 'CiteX', url: pageUrl(homePath), inLanguage: locale === 'en' ? 'en' : 'zh-CN' },
    { '@type': meta.path === '/' ? 'WebApplication' : 'WebPage', '@id': `${url}#webpage`, name: meta.title, url, description: meta.description, isPartOf: { '@id': `${pageUrl(homePath)}#website` }, inLanguage: locale === 'en' ? 'en' : 'zh-CN' },
  ];
  if (meta.path === '/') Object.assign(graph[1], { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript for interactive review', featureList: locale === 'en' ? ['Browser-local BibTeX review', 'ISO 4 and JCR journal abbreviation comparison', 'BibTeX title capitalization protection'] : ['浏览器本地 BibTeX 审核', 'ISO 4 与 JCR 期刊缩写对照', 'BibTeX 标题大小写保护'] });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

for (const locale of ['zh', 'en']) {
  for (const meta of pages[locale]) {
    const outputPath = languagePath(locale, meta.path);
    const canonical = pageUrl(outputPath);
    const alternates = origin ? `<link rel="alternate" hreflang="zh-CN" href="${pageUrl(meta.path)}" /><link rel="alternate" hreflang="en" href="${pageUrl(`/en${meta.path}`)}" /><link rel="alternate" hreflang="x-default" href="${pageUrl(meta.path)}" />` : '';
    const seo = `<meta property="og:site_name" content="CiteX" /><meta property="og:title" content="${escape(meta.title)}" /><meta property="og:description" content="${escape(meta.description)}" /><meta property="og:type" content="website" /><meta property="og:url" content="${escape(canonical)}" /><meta property="og:locale" content="${locale === 'en' ? 'en_US' : 'zh_CN'}" /><meta name="twitter:card" content="summary" />${origin ? `<link rel="canonical" href="${escape(canonical)}" />${alternates}` : ''}${structuredData(locale, meta, outputPath)}`;
    const html = template.replace(/<title>.*?<\/title>/, `<title>${escape(meta.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(meta.description)}" />`)
      .replace('<div id="root"></div>', `<div id="root">${staticContent(locale, meta)}</div>`)
      .replace('<html lang="zh-CN">', `<html lang="${locale === 'en' ? 'en' : 'zh-CN'}">`)
      .replace('</head>', `${seo}</head>`);
    await mkdir(`dist${outputPath}`, { recursive: true });
    await writeFile(`dist${outputPath}index.html`, html);
  }
}

const allPaths = [...pages.zh.map(page => page.path), ...pages.en.map(page => `/en${page.path}`)];
await writeFile('dist/404.html', '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="robots" content="noindex"><title>页面不存在 | CiteX</title><h1>页面不存在</h1><a href="/">返回 CiteX</a></html>');
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`);
if (origin) {
  const urls = allPaths.map(path => `<url><loc>${escape(pageUrl(path))}</loc><changefreq>monthly</changefreq><priority>${path === '/' || path === '/en/' ? '1.0' : '0.7'}</priority></url>`).join('');
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
} else console.log('SITE_URL unset: configure the production domain to generate canonical links and sitemap.');
console.log('Generated bilingual SEO pages, structured data, robots.txt, and sitemap when SITE_URL is set.');
