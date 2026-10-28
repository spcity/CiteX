<div align="center">

# 📑 CiteX

### 浏览器本地 BibTeX 审核与期刊缩写转换工具

*论文引用，小处严谨。*

[![在线体验](https://img.shields.io/badge/在线演示-citex.cosing.top-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://citex.cosing.top/)
[![开源协议: MIT](https://img.shields.io/badge/开源协议-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![隐私安全: 100% 本地运算](https://img.shields.io/badge/隐私保护-100%25%20本地离线-10B981?style=for-the-badge&logo=shield&logoColor=white)](#-纯本地隐私架构)
[![欢迎贡献](https://img.shields.io/badge/PRs-欢迎提交-brightgreen?style=for-the-badge)](https://github.com/your-username/citex/pulls)

[**English**](README.md) · [**简体中文**](README_zh.md)

</div>

---

## 💡 为什么需要 CiteX？

在向顶刊或知名学术会议（IEEE、ACM、Nature、Elsevier 等）投稿时，科研人员经常在参考文献排版上遇到两大痛点：

1. **BibTeX 自动降小写**：标准的 BibTeX 样式文件（`.bst`）为了统一格式，默认会将标题中的所有单词强制降为小写，导致 `DNA`、`CNN`、`BERT`、`COVID-19` 等专有名词被无情降为 `dna`, `cnn`, `bert`。
2. **期刊缩写地狱**：投稿指南通常强制要求使用 ISO 4 规范缩写。面对上百篇引文，去 PubMed、Web of Science 或 LTWA 手工核对不仅枯燥易漏，还极费时间。
3. **未发表引文隐私隐患**：将处于保密期或初审阶段的参考文献上传至第三方云端服务器，存在敏感研究方向和证据链泄露的风险。

**CiteX 让所有转换与审核都在浏览器本地完成，数据绝不上传。**

---

## ✨ 核心特性

- **🔒 100% 浏览器本地运算**：期刊数据库以 Gzip 压缩预载到浏览器内存，正则解析与匹配完全由本地 CPU 承担。未发表论文的引文**绝不离开你的电脑**。
- **📚 ISO 4 与 JCR 规范缩写对照**：内置数万条权威学术期刊对应数据，一键比对期刊全称、ISO 4（LTWA 标准）与 JCR 缩写形式。
- **🛡️ 智能双花括号保护大写**：一键为标题中的已有大写和专有名词补充双花括号（`{{DNA}}`），彻底根治 LaTeX 模板乱吞大写的毛病。
- **🔍 拒绝黑盒，逐条 Diff 可视化确认**：类似代码审核的侧边栏高亮视窗，改了哪里一清二楚。支持「接受并下一条」逐项核验，确保学术严谨。
- **🌐 中英双语，清爽无广告**：支持一键切换中英文语言界面，无任何多余弹窗与广告骚扰。

---

## 🚀 在线体验

免安装直接打开浏览器使用：**[https://citex.cosing.top/](https://citex.cosing.top/)**

---

## 🛠️ 本地开发指南

### 环境准备
- Node.js >= 18.0.0
- npm / pnpm / yarn

### 操作命令

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/citex.git
cd citex

# 2. 安装项目依赖
npm install
# 或者：pnpm install

# 3. 启动本地开发服务
npm run dev

# 4. 打包构建（包含双语静态预渲染与 SEO 生成）
npm run build
```

打包完成后，构建产物将输出在 `dist/` 目录下。

---

## 📊 数据说明与免责声明

- **数据来源**：本项目内嵌的 `public/journals.gz` 期刊缩写数据包含 20,000 余条学术记录，整理自公开学术标准与公共图书馆指南，包括 [ISSN LTWA 词标缩写表](https://portal.issn.org/ltwa) 与 [UBC Woodward Library 期刊缩写索引](https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/)。
- **免责声明**：CiteX 提供客观数据对照与预览。不同出版商和投稿期刊的具体要求可能存在微调，实际投稿前请务必以目标期刊最新的《作者指南》（Author Guidelines）为最终准则。

---

## 🤝 参与贡献

非常欢迎学术界朋友参与共同维护！
- **发现冷门期刊未收录或缩写有误？** 欢迎直接提交 Pull Request 或发起 Issue，补充期刊全称及对应 ISO 4 / JCR 缩写。
- **有新功能提议或体验改进意见？** 欢迎在 Discussions 中随时交流！

---

## 💗 致谢与彩蛋

> *"A gift for xues💗"*

CiteX 最初是独立开发者为赶毕业论文的女友制作的一个贴心小工具。现在我们把它公开并免费分享给所有科研人员，愿大家赶投 DDL 时少熬几个夜，参考文献排版一次过！

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
