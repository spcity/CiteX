<div align="center">

# 📑 CiteX

### Browser-Local BibTeX Reviewer & Journal Abbreviation Normalizer

*Careful citations, one small step at a time.*

[![Live Demo](https://img.shields.io/badge/Live_Demo-citex.cosing.top-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://citex.cosing.top/)
[![GitHub Stars](https://img.shields.io/github/stars/spcity/CiteX?style=for-the-badge&logo=github&color=F59E0B&logoColor=white)](https://github.com/spcity/CiteX/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/spcity/CiteX?style=for-the-badge&logo=github&color=3B82F6&logoColor=white)](https://github.com/spcity/CiteX/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-FACC15.svg?style=for-the-badge)](LICENSE)
[![Indexed Journals](https://img.shields.io/badge/Indexed_Journals-20%2C448-8B5CF6?style=for-the-badge&logo=bookstack&logoColor=white)](#-data-metrics--overview)
[![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://citex.cosing.top/)

<p align="center">
  <img src="https://img.shields.io/badge/Standard-ISO_4_(LTWA)-0284C7?style=flat-square" alt="ISO 4" />
  <img src="https://img.shields.io/badge/Standard-JCR_Clarivate-7C3AED?style=flat-square" alt="JCR" />
  <img src="https://img.shields.io/badge/Privacy-100%25_Browser_Local-10B981?style=flat-square" alt="100% Local" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/github/issues/spcity/CiteX?style=flat-square&color=10B981" alt="Issues" />
  <a href="https://github.com/spcity/CiteX/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" /></a>
</p>

[**English**](README.md) · [**简体中文**](README_zh.md)

</div>

---

## 💡 Why CiteX?

When preparing manuscripts for top conferences and journals (IEEE, ACM, Nature, Elsevier, Springer), researchers frequently encounter two frustrating citation formatting traps:

1. **BibTeX Lowercase Truncation**: Standard BibTeX bibliography styles (`.bst`, such as `IEEEtran` and `plain`) automatically force title words into lowercase (sentence-case), ruthlessly converting domain acronyms like `DNA`, `CNN`, `BERT`, or `COVID-19` into `dna`, `cnn`, and `bert`.
2. **Journal Abbreviation Hell**: Author guidelines strictly mandate ISO 4 standard abbreviations. Manually checking Web of Science, PubMed, or LTWA for hundreds of references is tedious and prone to human error.
3. **Data Privacy Concerns**: Sending unpublished, confidential paper references to third-party cloud servers exposes critical research baselines, ongoing collaborations, and topic metadata.

**CiteX solves all of this inside your browser — with zero data upload.**

---

## ✨ Key Features

- **🔒 100% Client-Side Privacy**: Journal databases are pre-compressed with Gzip and loaded into browser memory. All regex parsing and matching occur on your local CPU. Your references never leave your machine.
- **📚 ISO 4 & JCR Abbreviation Matching**: Instant cross-matching against **20,448** authoritative journal entries. Compare full names with ISO 4 (LTWA) and JCR standards side by side.
- **🛡️ Intelligent Capitalization Protection**: Automatically wraps proper nouns and existing uppercase letters in double braces (`{{DNA}}`), preventing `.bst` style files from downgrading them.
- **🔍 Visible & Reviewable Diff View**: No "black-box" magic. Inspect side-by-side modifications with granular diffs. Step through entries with **"Accept & next"** for complete editorial peace of mind.
- **🎉 Interactive Completion Flow**: Automatic clipboard copy and instant `.bib` export upon reviewing all entries.
- **📱 Responsive & Resilient Layout**: Fully adaptable across ultra-wide monitors, laptops, and mobile screens without UI clipping.
- **🌐 Bilingual & Clean**: Fully localized in English and Simplified Chinese, clean aesthetic with zero intrusive ads.

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
git clone https://github.com/spcity/CiteX.git
cd CiteX

# Install dependencies
npm install
# or: pnpm install

# Start the local development server
npm run dev

# Build for production with SEO pre-rendering
npm run build
```

The production bundle will be generated in the `dist/` directory.


## 📊 Data Sources & Disclaimer

- **Data Sources**: The journal abbreviation database included in `public/journals.gz` contains 20,448 scholarly records curated from publicly accessible scholarly standards and library guidelines.
- **Disclaimer**: CiteX provides candidate matches and previews. Journal abbreviation rules may differ based on specific publisher guidelines. Authors are advised to always consult the target journal’s official Author Guidelines before final submission.

---

## 🤝 Contributing

Contributions are warmly welcome!
- **Found a missing or incorrect journal abbreviation?** Please submit a Pull Request or open an Issue with the full title and official ISO 4 / JCR abbreviation.
- **Have UI or feature suggestions?** Feel free to open a discussion!


---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
