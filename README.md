# PixelBoard

> 一款专为 **Minecraft** 贴图设计的高效像素画编辑器 | A pixel art editor for Minecraft texture creation

基于 **Electron + Vue 3 + Vite** 构建 | Built with **Electron + Vue 3 + Vite**

## 特性

- **像素级编辑** — 画笔、橡皮擦、洪水填充、取色器，精准控制每个像素
- **灵活画布** — 8×8 到 256×256 可调，默认 16×16（Minecraft 标准尺寸）
- **棋盘格背景** — 透明/白色像素清晰可辨
- **自适应缩放** — 自动铺满视口，支持 25%~400% 百分比缩放和鼠标滚轮缩放
- **丰富调色板** — 60 种颜色按色相梯度排列，每行同一色系的明度变体
- **常用色** — 20 种预设常用色，自动在最前方追加最近使用的 8 个颜色
- **可滚动面板** — 调色板和常用色区域均支持滚动
- **导出设置** — 支持 PNG / JPEG / WebP / BMP 格式，自定义倍率（1×~256×），非透明格式可指定背景色
- **无边框窗口** — macOS 风格三色圆点控制，沉浸式暗色主题
- **黑白灰配色** — 简洁统一的单色 UI

## 使用方法

```bash
# 安装依赖
yarn install

# 构建前端
yarn build

# 启动应用
yarn start

# 一键构建并启动
yarn dev:electron
```

## 设置

点击顶部 **设置** 按钮弹出模态对话框，包含两个标签页：

| 标签 | 选项 |
|------|------|
| **画布设置** | 画布宽度（8-256）、画布高度（8-256）、缩放比例（25%~400%） |
| **保存设置** | 导出格式（PNG / JPEG / WebP / BMP）、背景颜色、导出倍率（1×~256×） |

PNG 和 WebP 支持透明通道，此时背景颜色选项显示为灰色且不可点击。

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用壳 |
| Vue 3 (Composition API) | UI 框架 |
| Vite | 构建工具 |
| Canvas 2D | 像素渲染 |
| ResizeObserver | 自适应缩放 |

## 项目结构

```
PixelBoard/
├── src/
│   ├── components/
│   │   ├── TopBar.vue          # 顶部导航栏
│   │   ├── ToolPanel.vue       # 左侧工具栏
│   │   ├── CanvasArea.vue      # 中间画布区域
│   │   └── ColorPanel.vue      # 右侧颜色面板
│   ├── composables/
│   │   └── usePixelEditor.js   # 核心编辑器逻辑
│   ├── App.vue                 # 根组件 + 设置弹窗
│   └── main.js                 # Vue 入口
├── main.js                     # Electron 主进程
├── index.html                  # 入口 HTML + 全局样式
├── vite.config.js              # Vite 配置
└── package.json
```
