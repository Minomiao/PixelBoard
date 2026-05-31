# 操作时序记录

## 2026-05-20

### 图标样式优化
1. 去除所有按钮图标边框 — `.top-btn`、`.tool-btn` 的 `border` 改为 `none`，`.tool-btn.active` 移除 `border-color`
2. 图标颜色统一为白色 — `fill: white`，SVG path 硬编码 `fill="white"`
3. 顶部栏按钮去除文字标签 — "设置"、"保存"文字移除，改用 `title` 属性悬浮提示

### 背景参考图功能
4. TopBar 新增「导入背景参考图」按钮（图片图标）
5. `usePixelEditor` 新增 `backgroundImage` ref、`loadBackgroundImage()`、`clearBackground()`
6. 画布渲染改为三层结构：背景图 → 半透明棋盘格 → 不透明像素
7. 新增关闭背景图按钮（×），仅在有背景时显示

### TypeScript 迁移
8. `usePixelEditor.js` → `usePixelEditor.ts`，添加 `PixelFileData`、`Tool`、`PixelGrid`、`PixelPos` 接口
9. `TopBar.vue` script → `lang="ts"`，props/emits 全部类型化
10. `App.vue` script → `lang="ts"`，`canvasAreaComp` 类型化为 `InstanceType`

### 项目保存 / 导出区分
11. 新增 `saveProject()` — 保存为 `.pixel` JSON 文件（包含每个像素颜色）
12. 新增 `loadProject(file)` — 从 `.pixel` 文件导入，还原画布
13. 原 `saveCanvas()` 重命名为 `exportImage()`，语义区分保存与导出
14. TopBar 新增「保存项目」「导入项目」「导出图片」三个按钮

### 顶部栏下拉菜单重构
15. 按钮按功能分组：「设置」「文件▾」「背景▾」
16. 文件菜单：保存项目 / 导入项目 / 分隔线 / 导出图片
17. 背景菜单：导入参考图 / 关闭参考图（红色 hover）
18. CSS 下拉菜单样式：hover 展开、箭头旋转动画、平滑过渡

### 打包与发布
19. `package.json` 添加 `"signAndEditExecutable": false` 修复 Windows 打包 winCodeSign 符号链接错误
20. 创建 `v1.0.0` tag 并推送
21. 创建 `RELEASE.md`（仅功能描述）
22. `.gitignore` 忽略自身及 `RELEASE.md`
23. 清理 `workplace/`、`date/` IDE 元数据目录
