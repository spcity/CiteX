<div align="center">

# 📑 CiteX

### Browser-Local BibTeX Reviewer & Journal Abbreviation Normalizer

*Careful citations, one small step at a time.*

[![Live Demo](https://img.shields.io/badge/Demo-citex.cosing.top-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://citex.cosing.top/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local-10B981?style=for-the-badge&logo=shield&logoColor=white)](#-privacy-first-architecture)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/your-username/citex/pulls)

[**English**](README.md) · [**简体中文**](README_zh.md)

</div>

---

## 💡 Why CiteX?

When preparing manuscripts for top conferences and journals (IEEE, ACM, Nature, Elsevier), researchers frequently encounter two frustrating citation formatting traps:

1. **BibTeX Lowercase Truncation**: Standard BibTeX bibliography styles (`.bst`) automatically force title words into lowercase (sentence-case), ruthlessly converting domain acronyms like `DNA`, `CNN`, `BERT`, or `COVID-19` into `dna`, `cnn`, and `bert`.
2. **Journal Abbreviation Hell**: Submission guidelines strictly mandate ISO 4 standard abbreviations. Manually checking Web of Science, PubMed, or LTWA for hundreds of references is tedious and prone to human error.
3. **Data Privacy Concerns**: Sending unpublished, confidential paper references to third-party cloud servers exposes critical research baselines, ongoing collaborations, and topic metadata.

**CiteX solves all of this inside your browser — with zero data upload.**

---

## ✨ Key Features

- **🔒 100% Client-Side Privacy**: Journal databases are pre-compressed with Gzip and loaded into browser memory. All regex parsing and matching occur on your local CPU. Your references never leave your machine.
- **📚 ISO 4 & JCR Abbreviation Matching**: Instant cross-matching against tens of thousands of authoritative journal entries. Compare full names with ISO 4 (LTWA) and JCR standards side by side.
- **🛡️ Intelligent Capitalization Protection**: Automatically wraps proper nouns and existing uppercase letters in double braces (`{{DNA}}`), preventing `.bst` style files from downgrading them.
- **🔍 Visible & Reviewable Diff View**: No "black-box" magic. Inspect side-by-side modifications with granular diffs. Step through entries with **"Accept & next"** for complete editorial peace of mind.
- **🌐 Bilingual & Responsive**: Fully localized in English and Simplified Chinese, clean aesthetic with zero intrusive ads.

---

## 🚀 Live Demo

Experience the tool directly at: **[https://citex.cosing.top/](https://citex.cosing.top/)**

---

## 🛠️ Quick Start (Local Development)

### Prerequisites
- Node.js >= 18.0.0
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/citex.git
cd citex

# Install dependencies
npm install
# or: pnpm install

# Start the local development server
npm run dev

# Build for production with SEO pre-rendering
npm run build
```

The production bundle will be generated in the `dist/` directory.

---

## 📊 Data Sources & Disclaimer

- **Data Sources**: The journal abbreviation database included in `public/journals.gz` contains over 20,000 scholarly records curated from publicly accessible scholarly standards and library guidelines, including the [ISSN List of Title Word Abbreviations (LTWA)](https://portal.issn.org/ltwa) and [UBC Woodward Library Journal Abbreviations](https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/).
- **Disclaimer**: CiteX provides candidate matches and previews. Journal abbreviation rules may differ based on specific publisher guidelines. Authors are advised to always consult the target journal’s official Author Guidelines before final submission.

---

## 🤝 Contributing

Contributions are warmly welcome!
- **Found a missing or incorrect journal abbreviation?** Please submit a Pull Request or open an Issue with the full title and official ISO 4 / JCR abbreviation.
- **Have UI or feature suggestions?** Feel free to open a discussion!

---

## 💗 Acknowledgement

> *"A gift for xues💗"*

CiteX was originally designed as a gift by an independent developer for his partner to save her time while formatting paper references. We hope it saves you valuable hours before your next submission deadline!

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
