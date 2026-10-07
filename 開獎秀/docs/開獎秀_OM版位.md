# 開獎秀－OM版位

Status: Living（持續追加 OM 正式版位，非 Locked）

## 1. 文件目的／範圍

本文件是「開獎秀－OM」全部正式版位的集中規格。已完成的 OM 版位、共用規則、Manual Verification、Code Commit 與明確 deferred scope 均記錄於此；後續 OM 02、OM 03、OM 04……持續追加本文件，不為個別 OM 版位另建 MD。

本文件只記錄 OM-specific 的版位與 OM 共用規則。開獎秀平台／共用控制台治理以 `開獎秀/docs/開獎秀_正式規格.md` 為準；Locked Architecture 以 `docs/架構說明.md` 為準；線上／電子BN 以 `開獎秀/docs/開獎秀_線上電子BN版位.md` 為準。

## 2. Documentation Governance

- 本文件涵蓋 OM 全部正式版位，採 Living Spec。
- 未完成版位不得虛構 geometry、assets、renderer 或 verification 結果。
- 尚未完成的 OM 版位只能標示 `Not Implemented / Pending`，並以 repository 已存在且可確認的名稱／素材為依據。
- OM 版位 specific 詳細規格不回填至平台 Living Spec；平台文件只記錄 OM current-state 與共用治理。
- `docs/架構說明.md`、線上／電子BN 文件與受保護的 implementation 不因本文件更新而修改。

## 3. OM 共用規則

- OM 與線上／電子BN 共用平台控制台 shell 的架構邊界，但不因此共用版位集合或版位規格。
- 每個 OM 版位建立前，必須確認其 Photoshop source document 的實際 PPI、document pixel dimensions 與 Canvas dimensions。
- 只有 source document pixel dimensions 與 Canvas dimensions 相同時，才可視為 1:1 document-pixel → Canvas-pixel mapping。
- OM 版位的 typography numeric values 不得直接沿用 online-bn；必須依該版位實際 source evidence 判定。

## 4. Typography / Photoshop PPI Rule

當 Photoshop document pixel dimensions = Canvas pixel dimensions 時，正式 OM 字級規則為：

```text
fontSizePx = Photoshop pt × source document PPI / 72
```

不得把 OM 的 Photoshop pt 直接記為 `canvasPt`，也不得在未確認 source PPI 前假設所有 OM 都是 300 PPI。

Google_Pmax_1200x1200 已確認 source document 為 1200×1200、300 PPI，Canvas 為 1200×1200，因此為 1:1 mapping。其正式 `fontSizePx` 為：

| Field | Photoshop | Source PPI | `fontSizePx` |
|---|---:|---:|---:|
| title | 21.2pt | 300 | 88.33333333333333px |
| subtitle | 28.5pt | 300 | 118.75px |
| small1 | 10pt | 300 | 41.66666666666667px |
| small2 | 10pt | 300 | 41.66666666666667px |

本次 root cause：早期候選曾直接把 Photoshop pt 當作 browser Canvas pt，Manual Verification 顯示文字明顯過小。原因是 source document 為 300 PPI，而 browser CSS／Canvas pt 採 96 PPI reference semantics；相同 pt 數值不代表相同 document-pixel 字級。正式 implementation 改用 `fontSizePx`，依 source PPI 對應 Photoshop document pixel。

## 5. Rendering Semantics

- title：`ShopeeNotoSans(content)-Medium`，local 2×。
- subtitle：`ShopeeNotoSans(content)-Bold`，direct rendering。
- small1／small2：`ShopeeNotoSans(content)-Medium`，local 2×。
- Medium local 2× 只負責 rasterization／rendering quality，最終 logical font size 不變。
- Text positioning 使用 actualBoundingBox ink-box semantics。
- 不使用 auto-wrap 或 auto-shrink。
- 保留 fractional px。
- Renderer 的 Canvas font string 使用 `fontSizePx` 的 px 值。

## 6. Style Defaults

OM 所有版位共用下列預設色；版位若有明確裁決，應在本文件追加版位-specific 差異。

| Style | background | title | subtitle | small |
|---|---|---|---|---|
| smart-locker | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| store | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

small color 同時控制 small1 與 small2。

## 7. Default Text

OM 所有版位共用下列 default text：

| Field | Default text |
|---|---|
| title | `12/12直播開獎` |
| subtitle | `取件最高抽百萬` |
| small1 | `10/10-12/30下單，在到貨一天內取件限定` |
| small2 | `百萬獎金均分，詳情依活動規則為準` |

## 8. Logo Contract

OM 只有一個 `logoMode`：`Auto`、`Orange`、`White`。Main Logo 使用共用 resolved variant；若版位 descriptor 有 Shopping Logo，Main Logo 與 Shopping Logo 共用同一個 resolved variant。不建立 `shoppingLogoMode`、`secondaryLogoMode` 或第二套 Auto threshold。

Main Logo：

- `assets/蝦皮大樂透_橘.png`
- `assets/蝦皮大樂透_白.png`

Shopping Logo：

- `assets/直式蝦皮購物_橘.png`
- `assets/直式蝦皮購物_白.png`

Auto 依目前 runtime background color 判斷，threshold 為 `0.498708`。亮度公式為 sRGB relative luminance；`L >= 0.498708` 使用 Orange，否則使用 White。

## 9. Viewer / Launcher Precedent

OM standalone Viewer：`開獎秀/02_OM/viewer.html`，目前支援 `Google_Pmax_1200x1200`、`Google_Pmax_1200x628`、`Google_Pmax_960x1200`、`Line OA` 與 `Line Voom`，透過 layout routing 選擇 active descriptor。

目前支援：smart-locker／store、alignment overlay、overlay opacity、text editing、weighted text validation、runtime background color、title／subtitle／small color、logoMode Auto／Orange／White 與 Reset。Runtime background 先 fill Canvas，再繪製 style base asset；runtime text colors 即時 rerender；Auto Logo 使用 current runtime background。

OM 01 Launcher：`開獎秀/02_OM/launch/01_Google_Pmax_1200x1200.command`。

OM 02 Launcher：`開獎秀/02_OM/launch/02_Google_Pmax_1200x628.command`。

OM 03 Launcher：`開獎秀/02_OM/launch/03_Google_Pmax_960x1200.command`。

OM 04 Launcher：`開獎秀/02_OM/launch/04_Line_OA.command`。

- repo-root local server
- marker check
- fail-closed
- Chrome launch
- executable mode `755`
- port `4177`

OM port `4177` 與 online-bn port `4176` 刻意分離。後續每個 OM layout 預期各自具有可雙擊 Chrome 開啟的 launcher，除非 Jamie 另行裁決。

## 10. 已完成版位總表

| No. | Layout | Canvas | Status | Manual Verification | Code Commit |
|---:|---|---|---|---|---|
| 01 | Google_Pmax_1200x1200 | 1200×1200 | Implemented | PASS | `9dbdfc2` |
| 02 | Google_Pmax_1200x628 | 1200×628 | Implemented | PASS | `e292ff8` |
| 03 | Google_Pmax_960x1200 | 960×1200 | Implemented | PASS | `ed2762d` |
| 04 | Line OA | 1040×1040 | Implemented | PASS | `e9b3d6d` |
| 05 | Line Voom | 1080×1080 | Implemented | PASS | `b2537ba` |

未完成版位不預先列為 Implemented；若未來需要列出，必須標示 `Not Implemented / Pending`。

## 11. Google_Pmax_1200x1200 正式規格

### 11.1 Canvas / Photoshop source

- Photoshop document：1200×1200、300 PPI
- Canvas：1200×1200
- Document pixel → Canvas pixel：1:1

### 11.2 Typography

| Field | Font | Photoshop | Canvas | Rendering |
|---|---|---:|---:|---|
| title | ShopeeNotoSans(content)-Medium | 21.2pt @ 300 PPI | 88.33333333333333px | local 2× |
| subtitle | ShopeeNotoSans(content)-Bold | 28.5pt @ 300 PPI | 118.75px | direct |
| small1 | ShopeeNotoSans(content)-Medium | 10pt @ 300 PPI | 41.66666666666667px | local 2× |
| small2 | ShopeeNotoSans(content)-Medium | 10pt @ 300 PPI | 41.66666666666667px | local 2× |

### 11.3 Geometry

| Element | x | y | width | height |
|---|---:|---:|---:|---:|
| Title | 191 | 248 | 820 | 82 |
| Subtitle | 191 | 352 | 820 | 111 |
| Small1 | 191 | 492 | 820 | 41 |
| Small2 | 191 | 543 | 820 | 41 |
| Main Logo | 297 | 123 | 605 | 98 |
| Shopping Logo | 1073 | 25 | 100 | 136 |
| smart-locker background | 0 | 9 | 1200 | 1191 |
| store background | 0 | 625 | 1200 | 575 |

以上 geometry 已 Manual Verification PASS。

### 11.4 Background asset placement

- smart-locker base：intrinsic 1200×1191、1:1、bottom aligned，`x=0, y=9`。
- store base：intrinsic 1200×575、1:1、bottom aligned，`x=0, y=625`。
- 不使用 stretch、cover 或重新縮放填滿 Canvas。

## 12. Google_Pmax_1200x628 正式規格

### 12.1 Canvas / Photoshop source

- Photoshop document：1200×628、300 PPI
- Canvas：1200×628
- Document pixel → Canvas pixel：1:1

### 12.2 Typography

| Field | Font | Photoshop | Canvas | Rendering |
|---|---|---:|---:|---|
| title | ShopeeNotoSans(content)-Medium | 14pt @ 300 PPI | 58.333333333333336px | local 2× |
| subtitle | ShopeeNotoSans(content)-Bold | 19pt @ 300 PPI | 79.16666666666667px | direct |
| small1 | ShopeeNotoSans(content)-Medium | 7pt @ 300 PPI | 29.166666666666668px | local 2× |
| small2 | ShopeeNotoSans(content)-Medium | 7pt @ 300 PPI | 29.166666666666668px | local 2× |

Descriptor property：`fontSizePx`。不得記錄為 `canvasPt` 或 browser pt。

### 12.3 Geometry — Manual Verified

| Element | x | y | width | height |
|---|---:|---:|---:|---:|
| Main Lottery Logo | 42 | 192 | 359 | 58 |
| Title | 42 | 267 | 532 | 54 |
| Subtitle | 42 | 339 | 532 | 75 |
| Small1 | 42 | 429 | 532 | 28 |
| Small2 | 42 | 464 | 532 | 28 |

以上 geometry 已 Manual Verification PASS。

### 12.4 Background asset placement

| Style | Asset intrinsic | Placement |
|---|---:|---|
| smart-locker | 602×628 | `x=598, y=0, width=602, height=628` |
| store | 585×628 | `x=615, y=0, width=585, height=628` |

兩者皆為 native 1:1、right aligned、full height；不使用 stretch、cover、contain scaling 或 crop。

### 12.5 Shopping Logo difference

Shopping Logo 已 baked into smart-locker／store base assets。OM 02 不繪製 Shopping Logo、不建立 Shopping Logo geometry、不載入 Shopping Logo runtime assets，也沒有獨立 Shopping Logo mode。`logoMode` 只控制 Main Lottery Logo。

### 12.6 Main Logo / assets

- Main Logo 使用共用 `logoMode`：Auto／Orange／White。
- Auto threshold：`0.498708`，依 runtime background color 判斷。
- Main Logo assets：`蝦皮大樂透_橘.png`、`蝦皮大樂透_白.png`。
- OM 02 Manual Verification：PASS。

### 12.7 Implementation / verification

- Technical Self-Test：PASS
- OM 01 Regression：PASS
- Code Commit full：`e292ff869e0a6be222a0e36578014e8ba0bea374`
- Code Commit short：`e292ff8`
- Code Commit message：`feat(lottery-show): add OM Google Pmax 1200x628 layout`
- Code Commit parent：`5546c12a45d20aa4120e5dc1932efe9ac879e1ff`
- Committed paths：7（4 implementation files + 3 OM 02 assets）

### 12.8 Viewer / launcher

- Viewer：`開獎秀/02_OM/viewer.html`，支援 OM 01／OM 02 layout routing。
- Launcher：`開獎秀/02_OM/launch/02_Google_Pmax_1200x628.command`。
- Port：`4177`，repo-root server、marker check、fail-closed、Chrome、mode `755`。

## 13. Google_Pmax_960x1200 正式規格

### 13.1 Canvas / Photoshop source

- Photoshop document：960×1200、300 PPI
- Canvas：960×1200
- Document pixel → Canvas pixel：1:1

### 13.2 Typography

| Field | Font | Photoshop | Canvas | Rendering |
|---|---|---:|---:|---|
| title | ShopeeNotoSans(content)-Medium | 19pt @ 300 PPI | 79.16666666666667px | local 2× |
| subtitle | ShopeeNotoSans(content)-Bold | 25.5pt @ 300 PPI | 106.25px | direct |
| small1 | ShopeeNotoSans(content)-Medium | 9pt @ 300 PPI | 37.5px | local 2× |
| small2 | ShopeeNotoSans(content)-Medium | 9pt @ 300 PPI | 37.5px | local 2× |

Formal conversion：`fontSizePx = Photoshop pt × 300 / 72`。Descriptor 使用 `fontSizePx`，不得記錄為 `canvasPt`、browser pt 或 rounded integer px。Medium local 2× 只提升 rasterization quality，final logical scale = 1。

### 13.3 Geometry — Manual Verified / LOCKED

| Element | x | y | width | height |
|---|---:|---:|---:|---:|
| Main Lottery Logo | 178 | 131 | 607 | 92 |
| Shopping Logo | 829 | 27 | 100 | 136 |
| Title | 71 | 245 | 820 | 74 |
| Subtitle | 71 | 338 | 820 | 100 |
| Small1 | 71 | 464 | 820 | 36 |
| Small2 | 71 | 511 | 820 | 36 |

以上 geometry 已通過 Jamie Manual Verification，狀態為 Manual Verified / LOCKED。

### 13.4 Background asset placement — Manual Verified / LOCKED

| Style | Asset intrinsic | Placement | Semantics |
|---|---:|---|---|
| smart-locker | 960×634 | `x=0, y=566, width=960, height=634` | native 1:1、full width、bottom aligned |
| store | 960×631 | `x=0, y=569, width=960, height=631` | native 1:1、full width、bottom aligned |

不使用 stretch、cover、contain-scale 或 crop。以上 placement 已通過 Jamie Manual Verification。

### 13.5 Assets

| Asset | Path | Intrinsic |
|---|---|---:|
| Alignment overlay | `開獎秀/02_OM/assets/對位/Google_Pmax_960x1200.png` | 960×1200 |
| smart-locker base | `開獎秀/02_OM/assets/智取櫃/Google_Pmax_960x1200.png` | 960×634 |
| store base | `開獎秀/02_OM/assets/門市/Google_Pmax_960x1200.png` | 960×631 |
| Main Logo Orange / White | `開獎秀/02_OM/assets/蝦皮大樂透_橘.png` / `_白.png` | 1678×272 |
| Shopping Logo Orange / White | `開獎秀/02_OM/assets/直式蝦皮購物_橘.png` / `_白.png` | 83×112 |

### 13.6 Logo contract

- Main Lottery Logo：renderer-drawn。
- Shopping Logo：renderer-drawn，使用 `secondaryLogo` semantics。
- Main Logo 與 Shopping Logo 共用 `logoMode`：Auto／Orange／White。
- Auto threshold：`0.498708`，依 runtime background color 判斷；兩個 Logo 同步切換。
- Shopping Logo Independent Control：NO；不得建立 `shoppingLogoMode` 或 `secondaryLogoMode`。

### 13.7 Common defaults / default text

沿用本文件第 6、7 節 OM common defaults 與 default text。

### 13.8 Renderer / Viewer / launcher

- 沿用 existing shared OM renderer；OM03 Code Implementation：0 diff。
- 保留 caller-provided descriptor、optional `secondaryLogo`、shared `logoMode`、fractional `fontSizePx`、actualBoundingBox positioning、Medium local 2×、Bold direct 與 runtime background Auto logic。
- Viewer：`開獎秀/02_OM/viewer.html`，僅新增 OM03 descriptor import、layout routing / mapping 與 marker。
- Descriptor：`開獎秀/02_OM/js/layout-03-google-pmax-960x1200.js`。
- Launcher：`開獎秀/02_OM/launch/03_Google_Pmax_960x1200.command`。
- Launcher：port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。

### 13.9 Verification / Code Commit

- Repository Investigation：PASS
- Phase B Proposal：PASS
- Phase C：PASS
- Technical Self-Test：PASS
- OM 01 Regression：PASS
- OM 02 Regression：PASS
- Jamie Manual Verification：PASS
- Renderer Modified：NO
- Renderer Redesign：NO
- Image Generation：NO
- Image Modification：NO
- Code Commit full：`ed2762d7d2a7b7b273a0a58b04285df8507c03bc`
- Code Commit short：`ed2762d`
- Code Commit message：`feat(lottery-show): add OM Google Pmax 960x1200 layout`
- Code Commit parent：`2747eeb5f9bfca4f0b642ba9f342b099b15cd6e1`
- Commit body：EMPTY
- Committed paths：6
- Docs Commit：Pending；不得虛構 Docs Commit hash。

## 14. Line OA 正式規格

### 14.1 Identity / Canvas

- Layout：Line OA
- Status：Implemented / Manual Verification PASS
- Canvas：1040×1040
- Final output：1040×1040 PNG
- Photoshop source：300 PPI
- Photoshop document pixel → Canvas pixel：1:1

Code Commit：

- Full：`e9b3d6d0a8a0238cd28d6bdea386839ce19cb6ce`
- Short：`e9b3d6d`
- Message：`feat(lottery-show): add OM Line OA layout`
- Parent：`07d11a15fe717a7c14c48f7607108cd817817143`
- Docs Commit：Pending

### 14.2 Background Shape

OM04 使用固定 Canvas 內的可變色 rounded background shape；shape 外區域保持透明。

| x | y | width | height | radius |
|---:|---:|---:|---:|---:|
| 12 | 12 | 1016 | 989 | 30 |

Background color 使用既有 `state.colors.background`。這是 OM04 descriptor-driven optional `backgroundShape`；OM01～OM03 未定義 `backgroundShape` 時，維持既有 full-canvas background 行為。

### 14.3 Background Assets

Smart-locker base：`開獎秀/02_OM/assets/智取櫃/Line OA.png`

- Placement：`x=12, y=548, width=1016, height=471`
- Manual Verification：PASS

Store base：`開獎秀/02_OM/assets/門市/Line OA.png`

- Source intrinsic dimensions：1016×833
- Destination placement：`x=12, y=197, width=1016, height=822`
- SHA-256：`54874c456239e08fbb767be7348aa1b44552454e96450f75812364b4d981e91e`
- Manual Verification：PASS

Source intrinsic dimensions 與 destination placement 是不同概念；不得把 destination 1016×822 寫成 source PNG 必須為 1016×822。

Overlay：`開獎秀/02_OM/assets/對位/Line OA.png`，intrinsic 1040×1039。Canonical output Canvas 仍為 1040×1040。

### 14.4 Logo Geometry / Contract

Main Lottery Logo：`x=257, y=131, width=526, height=81`。

Shopping Logo：`x=883, y=42, width=102, height=140`。

兩者由 renderer 繪製並共用唯一 `logoMode`：Auto／Orange／White。Auto 沿用 OM 共用規則：linearized sRGB relative luminance，threshold `0.498708`；`L >= threshold` 使用 Orange，否則使用 White。不得建立 Shopping Logo 獨立控制。

### 14.5 Text Geometry / Typography

| Field | x | y | width | height | Photoshop | `fontSizePx` | Font | Rendering |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Title | 166 | 244 | 711 | 68 | 17.5pt @ 300 PPI | 72.91666666666667px | ShopeeNotoSans(content)-Medium | local 2× |
| Subtitle | 166 | 329 | 711 | 87 | 22pt @ 300 PPI | 91.66666666666667px | ShopeeNotoSans(content)-Bold | direct |
| Small1 | 166 | 433 | 711 | 37 | 9.5pt @ 300 PPI | 39.583333333333336px | ShopeeNotoSans(content)-Medium | local 2× |
| Small2 | 166 | 482 | 711 | 37 | 9.5pt @ 300 PPI | 39.583333333333336px | ShopeeNotoSans(content)-Medium | local 2× |

正式規則：`fontSizePx = Photoshop pt × 300 / 72`。Renderer 使用 px；Medium local 2× 只負責 rasterization quality，最終 logical scale = 1，不使用 browser pt。

沿用 OM 共用 text semantics：actualBoundingBox ink-box positioning、不 auto-wrap、不 auto-shrink、weighted text validation（Han = 1、non-Han = 0.5）。文字上限為 Title 8、Subtitle 7、Small1 18、Small2 18。

### 14.6 Defaults / Viewer / Launcher / Verification

Smart-locker defaults：background `#2660ad`、title `#fffac8`、subtitle `#fff000`、small `#fffac8`。

Store defaults：background `#ffda46`、title `#472704`、subtitle `#eb1717`、small `#472704`。

Default text 沿用本文件第 7 節。Viewer 為 `開獎秀/02_OM/viewer.html`，支援 OM04 layout routing 與 checkerboard presentation；checkerboard 只存在 viewer presentation layer，不進入 Canvas pixel output 或 Export output。Launcher 為 `開獎秀/02_OM/launch/04_Line_OA.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。

Renderer 記錄目前正式行為：descriptor-driven optional `backgroundShape`；OM04 Store source 1016×833 可繪製至 destination 1016×822；OM01～OM03 Regression PASS。OM04 Smart、OM04 Store 與 OM04 overall Manual Verification 均 PASS。Image Generation：NO；Images Modified By Codex：NO。

## 15. Line Voom 正式規格

### 15.1 Identity / Canvas

- Layout：Line Voom
- Status：Implemented / Technical Self-Test PASS / Manual Verification PASS
- Canvas：1080×1080
- Final output：1080×1080 PNG
- Photoshop source：300 PPI
- Photoshop document pixel → Canvas pixel：1:1
- Typography conversion：`fontSizePx = Photoshop pt × 300 / 72`
- Renderer 使用 px；不得使用 browser pt。

Code Commit：

- Full：`b2537ba9d2beeb1fdb081ba292837fd60098b7af`
- Short：`b2537ba`
- Message：`feat(lottery-show): add OM Line Voom layout`
- Parent：`b3b151b00b014b1203f0cc1bd3e76ac80de2eec8`
- Docs Commit：Pending；不得虛構 Docs Commit hash。

### 15.2 Typography

| Field | Photoshop | `fontSizePx` | Font | Rendering |
|---|---:|---:|---|---|
| Title | 18pt @ 300 PPI | 75px | ShopeeNotoSans(content)-Medium | local 2× |
| Subtitle | 23pt @ 300 PPI | 95.83333333333333px | ShopeeNotoSans(content)-Bold | direct |
| Small1 | 10pt @ 300 PPI | 41.66666666666667px | ShopeeNotoSans(content)-Medium | local 2× |
| Small2 | 10pt @ 300 PPI | 41.66666666666667px | ShopeeNotoSans(content)-Medium | local 2× |

Medium local 2× 只負責 rendering quality，final logical scale = 1。沿用 actualBoundingBox ink-box semantics；不使用 auto-wrap 或 auto-shrink。

### 15.3 Geometry / Background

| Object | x | y | width | height |
|---|---:|---:|---:|---:|
| Main Lottery Logo | 263 | 121 | 554 | 90 |
| Vertical Shopee Logo | 929 | 25 | 107 | 146 |
| Title | 171 | 242 | 738 | 69 |
| Subtitle | 171 | 329 | 738 | 90 |
| Small1 | 171 | 435 | 738 | 39 |
| Small2 | 171 | 485 | 738 | 39 |
| Smart-locker base | 0 | 0 | 1080 | 1080 |
| Store base | 0 | 550 | 1080 | 530 |

Background：full Canvas editable background；OM05 不使用 `backgroundShape`。

### 15.4 Assets / Logo Behavior

- Overlay：`開獎秀/02_OM/assets/對位/Line Voom.png`，1080×1080，SHA-256 `2623e4d99e44243ceea86b4e5223b6258f517cb4dbd31bfb250c2a1cc551d21a`。
- Smart-locker：`開獎秀/02_OM/assets/智取櫃/Line Voom.png`，1080×1080，SHA-256 `bdd51f660494f9f80d74692785ef42402d36ec2514934b6574d05ef8e37bd1ff`。
- Store：`開獎秀/02_OM/assets/門市/Line Voom.png`，1080×530，SHA-256 `5886a9852dd45b171d8fa276ecdbaef56fac1ff62611cb0c3cfa291e0e5f488b`。
- Main Lottery Logo：`開獎秀/02_OM/assets/蝦皮大樂透_橘.png`、`開獎秀/02_OM/assets/蝦皮大樂透_白.png`。
- Vertical Shopee Logo：`開獎秀/02_OM/assets/直式蝦皮購物_橘.png`、`開獎秀/02_OM/assets/直式蝦皮購物_白.png`。

Main Lottery Logo 與 Vertical Shopee Logo 共用唯一 `logoMode`：Auto／Orange／White；Auto threshold `0.498708`。Vertical Shopee Logo 不建立獨立控制。

### 15.5 Defaults / Verification

OM05 沿用 OM 共用 text limits：Title 8、Subtitle 7、Small1 18、Small2 18；weighted count：Han = 1、non-Han = 0.5。Smart-locker defaults 為 background `#2660ad`、title `#fffac8`、subtitle `#fff000`、small `#fffac8`；Store defaults 為 background `#ffda46`、title `#472704`、subtitle `#eb1717`、small `#472704`。Default text 沿用本文件第 7 節。

Implementation：`開獎秀/02_OM/js/layout-05-line-voom.js`。Shared Viewer：`開獎秀/02_OM/viewer.html`。Shared Renderer：`開獎秀/02_OM/js/renderer.js`，OM05 未修改。Launcher：`開獎秀/02_OM/launch/05_Line_Voom.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。OM01～OM04 regression PASS。Console integration 保持 Pending；OM05 為 standalone Viewer／renderer baseline，不代表正式 Console integration 完成。Image Generation：NO；Images Modified By Codex：NO。

## 16. Assets

| Asset | Path | Intrinsic |
|---|---|---:|
| Alignment overlay | `開獎秀/02_OM/assets/對位/Google_Pmax_1200x1200.png` | 1200×1200 |
| smart-locker base | `開獎秀/02_OM/assets/智取櫃/Google_Pmax_1200x1200.png` | 1200×1191 |
| store base | `開獎秀/02_OM/assets/門市/Google_Pmax_1200x1200.png` | 1200×575 |
| Main Logo Orange | `開獎秀/02_OM/assets/蝦皮大樂透_橘.png` | 1678×272 |
| Main Logo White | `開獎秀/02_OM/assets/蝦皮大樂透_白.png` | 1678×272 |
| Shopping Logo Orange | `開獎秀/02_OM/assets/直式蝦皮購物_橘.png` | 83×112 |
| Shopping Logo White | `開獎秀/02_OM/assets/直式蝦皮購物_白.png` | 83×112 |

## 17. Code Commit / Manual Verification

Implementation：DONE

Technical Self-Test：PASS

Manual Verification：PASS

Code Commit：

- Full：`9dbdfc2f0b065d17c61dd91c5228dd59b7349906`
- Short：`9dbdfc2`
- Message：`feat(lottery-show): add OM Google Pmax layout`
- Parent：`2d48ab8d2d791844e8f0f4b44d76b8ac69df03be`
- Committed paths：12（5 個 OM implementation files + 7 個 OM 01 runtime assets）

Docs Commit：尚未建立；不得虛構 Docs Commit hash。

## 18. Explicitly Deferred Work

- OM 其餘 layouts（OM 06+）
- OM 正式 Console integration
- OM Excel import
- OM JSON workspace
- OM formal Export
- OM ZIP
- OM 全版位整合

Google_Pmax_1200x1200、Google_Pmax_1200x628、Google_Pmax_960x1200 與 Line OA standalone baselines 完成，不等於 OM item 全部完成。

## 19. 後續 OM 版位追加治理

新增 OM 版位時，先確認 source document 實際 PPI、document／Canvas dimensions、assets、geometry、typography 與 Manual Verification scope，再追加本文件對應章節與 completed layout table。未完成工作不得宣稱 Implemented；每個版位的 Code Commit 與 Manual Verification 必須以實際 repository evidence 記錄。
