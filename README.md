# 角色卡 · Character Cards

Owlbear Rodeo 第三方插件 — 把 D&D 5E 中文角色卡（xlsx）导入场景，DM/玩家在地图上即可查看六维、技能、武器、法术、特性等。

## 功能亮点

- **xlsx 一键导入** — 上传基于「悲灵 ver.」模板（v1.0.0 / v1.0.12）填好的角色卡，服务端自动解析，DM 全员可见
- **绑定 token** — 右键场景中的 IMAGE 选「绑定角色卡」，关联以后任何人选中这个 token 都会在右下浮起小信息面板
- **小信息面板** — 名称 / 种族·职业 / HP·AC·先攻·DC·熟练 / 六维 + 嵌入的技能加值（熟练金色，专精绿色高亮）/ 武器表 / 法术攻击
- **侧边栏总览面板** — 展开式角色卡列表，可切换查看不同角色的完整渲染图（PNG）
- **保留状态** — 关闭面板不卸载 iframe，再打开秒切
- **自动卡 toggle** — 一键关闭"选中角色就弹小卡"的行为

## 架构

```
xlsx (悲灵模板)
   │ upload
   ▼
character-cards-server (Flask + openpyxl)   →  data.json
   │
   │ render
   ▼
character_card.png (matplotlib)
   │
   ▼
obr.dnd.center/characters/<roomId>/<cardId>/
   │
   ▼
OBR plugin iframe ← 拉取 + 渲染
```

服务端代码见 [`character-cards-server/`](https://github.com/FullPeople/character-cards-server)（独立仓库）。本仓库只含浏览器端。

## 模板版本兼容

- v1.0.0 — 旧版，主要 sheet 一体化
- v1.0.12 — 新版，「起源」sheet 拆出个人背景，「种族」sheet 改为词典查表
- 自动通过 sheet 结构识别（有「起源」sheet → v1.0.12）

## 同作者插件

- [先攻追踪](https://github.com/FullPeople/Full_initiative_tracker) — 顶部居中横向卡槽，玩家可自助结束回合
- [怪物图鉴](https://github.com/FullPeople/bestiary) — 5etools 中文镜像怪物搜索 + 一键拖入
- [时停](https://github.com/FullPeople/time-stop) — DM 暂停玩家操作的应急按钮
- [聚焦](https://github.com/FullPeople/focus-camera) — 一键摄像头同步到选中位置

## 开发

```bash
npm install
npm run dev     # 启动 HTTPS 开发服务器
npm run build   # 构建生产版本
```

## 部署

部署到 `https://obr.dnd.center/character-cards/`，manifest 在 `https://obr.dnd.center/character-cards/manifest.json`。

## 许可证

[PolyForm Noncommercial License 1.0.0](./LICENSE) —— 详见 LICENSE 文件。

**通俗说明**（仅供理解，以 LICENSE 全文为准）：

- ✅ **可以**：自由查看、修改、二次创作、非商用分发
- ✅ **必须**：保留 `Required Notice: Copyright (c) 2026 FullPeople` 这一行
- ❌ **不允许**：任何商业用途（售卖、盈利产品、收费部署等）
- ✅ 个人 / TRPG 团队 / 爱好者 / 学校 / 公益使用 **均允许**
- ✅ 非商用衍生品可以闭源、可重新分发

### 第三方资源声明

「悲灵 ver.」xlsx 角色卡模板版权归原作者悲灵所有；本插件仅作为该模板的**消费方**（解析读取，不在仓库中分发模板本身）。模板本身不属于本许可证范围。
