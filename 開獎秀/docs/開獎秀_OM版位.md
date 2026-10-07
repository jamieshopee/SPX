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

OM standalone Viewer：`開獎秀/02_OM/viewer.html`，目前支援 `Google_Pmax_1200x1200`、`Google_Pmax_1200x628`、`Google_Pmax_960x1200`、`Line OA`、`Line Voom`、`Pixnet_Side sticker_side image`、`Pixnet_Side sticker_Banner` 與 `Yahoo_mbbanner`，透過 layout routing 選擇 active descriptor。

目前支援：smart-locker／store、alignment overlay、overlay opacity、text editing、weighted text validation、runtime background color、title／subtitle／small color、logoMode Auto／Orange／White 與 Reset。Runtime background 先 fill Canvas，再繪製 style base asset；runtime text colors 即時 rerender；Auto Logo 使用 current runtime background。

OM 01 Launcher：`開獎秀/02_OM/launch/01_Google_Pmax_1200x1200.command`。

OM 02 Launcher：`開獎秀/02_OM/launch/02_Google_Pmax_1200x628.command`。

OM 03 Launcher：`開獎秀/02_OM/launch/03_Google_Pmax_960x1200.command`。

OM 04 Launcher：`開獎秀/02_OM/launch/04_Line_OA.command`。

OM 05 Launcher：`開獎秀/02_OM/launch/05_Line_Voom.command`。

OM 06 Launcher：`開獎秀/02_OM/launch/06_Pixnet_Side_sticker_side_image.command`。

OM 07 Launcher：`開獎秀/02_OM/launch/07_Pixnet_Side_sticker_Banner.command`。

OM 08 Launcher：`開獎秀/02_OM/launch/08_Yahoo_mbbanner.command`。

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
| 06 | Pixnet_Side sticker_side image | 260×480 | Implemented | PASS | `8c8610e` |
| 07 | Pixnet_Side sticker_Banner | 672×560 | Implemented | PASS | `99b1fef` |
| 08 | Yahoo_mbbanner | 300×250 | Implemented | PASS | `336a8ac` |

未完成版位不預先列為 Implemented；若未來需要列出，必須標示 `Not Implemented / Pending`。

### 10.1 OM Console Integration

OM01～OM08 已全部正式掛入 shared console，使用既有 `開獎秀/console.html`：

```text
console.html?item=om&style=smart-locker
console.html?item=om&style=store
```

左欄固定順序：

1. `Google_Pmax_1200x1200`
2. `Google_Pmax_1200x628`
3. `Google_Pmax_960x1200`
4. `Line OA`
5. `Line Voom`
6. `Pixnet_Side sticker_side image`
7. `Pixnet_Side sticker_Banner`
8. `Yahoo_mbbanner`

style 由 URL context 固定為 `smart-locker` 或 `store`，不是右欄 control。OM01～OM08 直接 consumption existing descriptors；shared renderer `開獎秀/02_OM/js/renderer.js`、OM01～OM08 descriptors 與 standalone Viewer 均 unchanged。

OM console 使用 shared shell：左欄 `250px`、中欄 Preview、右欄 `360px`、工作區 `100vh`、`body` `min-width: 1180px`。`開獎秀/js/console.js` 依 `item=om` dynamic import `開獎秀/02_OM/js/console-om.js`；`開獎秀/02_OM/css/om-console.css` 只在 OM mount 時載入。online-bn 不載入 OM module／CSS；live 維持 untouched／empty-state precedent。

OM01～OM08 共用同一組 editable state semantics：text.title、text.subtitle、text.small1、text.small2、colors.background、colors.title、colors.subtitle、colors.small 與 logoMode；state 僅在目前頁面 session 內共享，不使用 localStorage、sessionStorage 或跨頁 persistence。各 layout 的 descriptor、geometry、Canvas、asset placement 與 text box 仍獨立。OM standalone descriptor defaults 保留供 standalone Viewer；shared OM Console 初次進入的四個文字欄位為 empty string。OM common text limits 為 Title 8、Subtitle 7、Small1 18、Small2 18；weighted count 為 Han = 1、non-Han = 0.5；IME-safe，超限 rollback。

OM 右欄最終為：

| Section | 名稱 | 狀態 |
|---:|---|---|
| 01 | 匯入工單 Excel 或暫存檔 | IMPLEMENTED：Excel／JSON |
| 02 | 背景色設定 | IMPLEMENTED |
| 03 | Logo 模式 | IMPLEMENTED：Auto／Orange／White |
| 04 | 編輯文字＋顏色 | IMPLEMENTED：title／subtitle／small1／small2 與 title／subtitle／shared small color |
| 05 | 下載完整專案 | IMPLEMENTED：current URL style |
| 06 | 重設工作區域 | IMPLEMENTED；只 reset current selected layout |

OM 沒有 QR Code section。若 layout 有 renderer-drawn `secondaryLogo`，它與 Main Logo 共用同一個 `logoMode`，不建立獨立 control。

Final Manual Verification：PASS。已確認中央 `PREVIEW／預覽` header 移除、右側 `CONTROLS／操作` header 移除、左欄 keyboard selected 單橘框、QR Code section 移除、Excel／JSON button visual size 一致、Section 04 四個 text input visible width 一致，以及 OM01～OM08 smart-locker／store 均 PASS。

Code Commit：

- Full：`bb73eac2a438e8d92e0565e39a64f58bcb9458a2`
- Short：`bb73eac`
- Message：`feat(lottery-show): integrate OM console`
- Parent：`067e306fa1e62788d348b81a975ab2d23e927d9e`
- Committed paths：`開獎秀/js/console.js`、`開獎秀/02_OM/js/console-om.js`、`開獎秀/02_OM/css/om-console.css`
- Manual Verification：PASS
- Docs Commit：Pending；本次 Documentation Update 尚未建立 commit。

### 10.2 OM Work Order／Workspace／Export Current State

OM Work Order Excel、shared editable state、Workspace JSON 與完整專案下載已完成，並通過 Technical Self-Test 與 Jamie Manual Verification。

- Excel 固定讀取 Sheet `美術工單_OM`，使用正式 workbook identity markers、NFKC anchor normalization、merge-aware structural value lookup；四個欄位完整解析與 weighted limits 驗證成功後才 atomic commit。空白文字是合法值；公式／display region 不作為 canonical import source。
- Excel 成功匯入只更新 shared text，保留目前 shared colors 與 logoMode；active Preview、Section 04 inputs、counters 與 OM01～OM08 同步更新。
- Workspace JSON format 為 `SPX Lottery Show OM Workspace`、version `1`、item `om`，保存 styleId、activeLayoutId、shared text、shared colors 與 logoMode；unknown extra fields 可忽略，required field／style／layout／weighted validation fail closed。style mismatch 必須拒絕並顯示 `暫存檔樣式與目前樣式不一致`。
- Reset 回到目前 URL style defaults：shared text 為 empty string，colors 與 logoMode 回正式預設；不回到 JSON snapshot。
- Section 05 只輸出目前 URL style：8 個 layout images 加 1 個 Workspace JSON，ZIP 精確 9 entries；OM04／OM06 使用 native lossless PNG 並保留 alpha，其餘 6 個輸出使用 native Canvas JPEG quality 1.0。
- Export 使用 immutable snapshot 與既有 `renderLayoutToCanvas({ layout, styleId, state })`，逐一 offscreen render，不切換 active layout；busy guard、dimension／encoding／ZIP failure 均 fail closed，不產生 partial-success ZIP。

Code Commit：

- Full：`3c31a84eaadfd0333bde37f0b433ea65fcab879c`
- Short：`3c31a84`
- Message：`feat(lottery-show): add OM workspace and project export`
- Parent：`8abda94c9a50fa52be106c7d680ad7921cb658ea`
- Scope：`開獎秀/02_OM/js/console-om.js`、`開獎秀/02_OM/js/export.js`、`開獎秀/02_OM/js/work-order-import.js`、`開獎秀/02_OM/js/workspace.js`
- Manual Verification：PASS
- Docs Commit：Pending；本次 Documentation Update 尚未建立 commit。

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

Implementation：`開獎秀/02_OM/js/layout-05-line-voom.js`。Shared Viewer：`開獎秀/02_OM/viewer.html`。Shared Renderer：`開獎秀/02_OM/js/renderer.js`，OM05 未修改。Launcher：`開獎秀/02_OM/launch/05_Line_Voom.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。OM01～OM04 regression PASS。OM05 standalone Viewer／renderer baseline 與 OM Console integration 均已完成；Console integration current state 見第 10.1 節。Image Generation：NO；Images Modified By Codex：NO。

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

OM01～OM08、OM Work Order、Workspace JSON、完整專案 Export 與 ZIP 已完成；本文件目前沒有另列 OM Phase C deferred implementation。後續新增版位或功能仍須依 Jamie 裁決後追加，不得自行假設。

## 19. 後續 OM 版位追加治理

新增 OM 版位時，先確認 source document 實際 PPI、document／Canvas dimensions、assets、geometry、typography 與 Manual Verification scope，再追加本文件對應章節與 completed layout table。未完成工作不得宣稱 Implemented；每個版位的 Code Commit 與 Manual Verification 必須以實際 repository evidence 記錄。

## 20. Pixnet_Side sticker_side image 正式規格

### 20.1 Identity / Canvas / Status

- Layout：Pixnet_Side sticker_side image
- Status：Implemented / Technical Self-Test PASS / Manual Verification PASS
- Canvas：260×480
- Final output：260×480 PNG
- Photoshop source：300 PPI
- Photoshop document pixel → Canvas pixel：1:1
- Typography conversion：`fontSizePx = Photoshop pt × 300 / 72`
- Renderer 使用 px；不得使用 browser pt。

Code Commit：

- Full：`8c8610ee960f52dc919fa81a314aa63c6763bfed`
- Short：`8c8610e`
- Message：`feat(lottery-show): add OM Pixnet Side Sticker layout`
- Parent：`24d1c0655773bc97cbe8132929541f48a3346795`
- Docs Commit：Pending；不得虛構 Docs Commit hash。

### 20.2 Typography

| Field | Photoshop | `fontSizePx` | Font | Rendering |
|---|---:|---:|---|---|
| Title | 5.7pt @ 300 PPI | 23.75px | ShopeeNotoSans(content)-Medium | local 2× |
| Subtitle | 7pt @ 300 PPI | 29.166666666666668px | ShopeeNotoSans(content)-Bold | direct |
| Small1 | 2.8pt @ 300 PPI | 11.666666666666666px | ShopeeNotoSans(content)-Medium | local 2× |
| Small2 | 2.8pt @ 300 PPI | 11.666666666666666px | ShopeeNotoSans(content)-Medium | local 2× |

Medium local 2× 只負責 rendering quality，final logical scale = 1。沿用 actualBoundingBox ink-box semantics；不使用 auto-wrap 或 auto-shrink。

### 20.3 Background / Geometry

OM06 使用 descriptor-driven rounded `backgroundShape`，背景色取 `state.colors.background`；Canvas 外部保持透明，不使用 full-Canvas background。

| Object | x | y | width | height | radius |
|---|---:|---:|---:|---:|---:|
| BackgroundShape | 8 | 55 | 245 | 409 | 20 |

| Object | x | y | width | height |
|---|---:|---:|---:|---:|
| Main Lottery Logo | 49 | 76 | 162 | 26 |
| Smart-locker base | 8 | 4 | 245 | 476 |
| Store base | 4 | 4 | 253 | 476 |
| Title | 26 | 112 | 206 | 22 |
| Subtitle | 26 | 140 | 207 | 28 |
| Small1 | 19 | 175 | 221 | 11 |
| Small2 | 19 | 189 | 221 | 11 |

Smart-locker source intrinsic：245×476。Store source intrinsic：253×476。Source intrinsic dimensions 與 destination placement 分開記錄。

Secondary Logo：NONE。上方 Shopee 袋體與相關視覺屬於 style base content，不是 renderer-drawn Vertical Shopee Logo。

### 20.4 Assets / Logo Behavior

- Overlay：`開獎秀/02_OM/assets/對位/Pixnet_Side sticker_side image.png`，260×480，SHA-256 `a8488fc0f998c3bd3532e9151ee127c0612e0004dbf77a4b34de4c88f43dfd67`。
- Smart-locker：`開獎秀/02_OM/assets/智取櫃/Pixnet_Side sticker_side image.png`，245×476，SHA-256 `3e1bb37cf11105cc6b531185806410719961902bf653dad57a5b9d13e1239999`。
- Store：`開獎秀/02_OM/assets/門市/Pixnet_Side sticker_side image.png`，253×476，SHA-256 `bbaee9422be84906119600409fe1221fff2dbfc8271c3a319d0e81f980742507`。
- Main Lottery Logo：`開獎秀/02_OM/assets/蝦皮大樂透_橘.png`、`開獎秀/02_OM/assets/蝦皮大樂透_白.png`。

Main Lottery Logo 為 renderer-drawn，與 OM 共用唯一 `logoMode`：Auto／Orange／White；Auto threshold `0.498708`。OM06 沒有 renderer-drawn secondaryLogo。

### 20.5 Defaults / Viewer / Verification

OM06 沿用 OM 共用 text limits：Title 8、Subtitle 7、Small1 18、Small2 18；weighted count：Han = 1、non-Han = 0.5。Smart-locker defaults 為 background `#2660ad`、title `#fffac8`、subtitle `#fff000`、small `#fffac8`；Store defaults 為 background `#ffda46`、title `#472704`、subtitle `#eb1717`、small `#472704`。Default text 沿用本文件第 7 節。

Viewer：`開獎秀/02_OM/viewer.html`，沿用 `.canvas-wrap` checkerboard presentation；checkerboard 只顯示 Canvas transparent margins，不畫入 Canvas pixels 或 output。Implementation descriptor：`開獎秀/02_OM/js/layout-06-pixnet-side-sticker-side-image.js`。Shared Renderer：`開獎秀/02_OM/js/renderer.js`，OM06 未修改。Launcher：`開獎秀/02_OM/launch/06_Pixnet_Side_sticker_side_image.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。

OM06 Technical Self-Test：PASS。OM06 Manual Verification：PASS。OM01～OM05 Regression：PASS。BackgroundShape、transparent Canvas margins、checkerboard、Main Logo mode 與 shared logoMode 均 PASS。OM06 standalone Viewer／renderer baseline 與 OM Console integration 均已完成；Console integration current state 見第 10.1 節。Image Generation：NO；Images Modified By Codex：NO。

## 21. Pixnet_Side sticker_Banner 正式規格

### 21.1 Identity / Canvas / Status

- Layout：Pixnet_Side sticker_Banner
- Status：Implemented / Technical Self-Test PASS / Manual Verification PASS
- Canvas：672×560
- Final output：672×560 PNG
- Photoshop source：300 PPI
- Photoshop document pixel → Canvas pixel：1:1
- Typography conversion：`fontSizePx = Photoshop pt × 300 / 72`
- Renderer 使用 px；不得使用 browser pt。

Code Commit：

- Full：`99b1fef8670dbfc40c9510f926d1dd1c12f7d8d1`
- Short：`99b1fef`
- Message：`feat(lottery-show): add OM Pixnet Side Sticker Banner layout`
- Parent：`d87cb72c1ef659900a3077ef2f0291ff75bff6cc`
- Docs Commit：Pending；不得虛構 Docs Commit hash。

### 21.2 Typography

| Field | Photoshop | `fontSizePx` | Font | Rendering |
|---|---:|---:|---|---|
| Title | 9pt @ 300 PPI | 37.5px | ShopeeNotoSans(content)-Medium | local 2× |
| Subtitle | 12.4pt @ 300 PPI | 51.666666666666664px | ShopeeNotoSans(content)-Bold | direct |
| Small1 | 4.5pt @ 300 PPI | 18.75px | ShopeeNotoSans(content)-Medium | local 2× |
| Small2 | 4.5pt @ 300 PPI | 18.75px | ShopeeNotoSans(content)-Medium | local 2× |

Medium local 2× 只負責 rendering quality，final logical scale = 1。沿用 actualBoundingBox ink-box semantics；不使用 auto-wrap 或 auto-shrink。

### 21.3 Background / Geometry

OM07 使用 full Canvas editable background，Canvas 外部沒有透明 margin；不使用 `backgroundShape`。

| Object | x | y | width | height |
|---|---:|---:|---:|---:|
| Smart-locker base | 0 | 232 | 672 | 328 |
| Store base | 0 | 237 | 672 | 323 |
| Main Lottery Logo | 166 | 20 | 340 | 43 |
| Vertical Shopee Logo | 594 | 17 | 59 | 81 |
| Title | 106 | 76 | 459 | 35 |
| Subtitle | 106 | 122 | 459 | 51 |
| Small1 | 106 | 185 | 459 | 18 |
| Small2 | 106 | 207 | 459 | 18 |

Smart-locker source intrinsic：672×328。Store source intrinsic：672×323。Source intrinsic dimensions 與 destination placement 分開記錄；上述 geometry 已通過 Jamie Manual Verification。

### 21.4 Assets / Logo Behavior

- Overlay：`開獎秀/02_OM/assets/對位/Pixnet_Side sticker_Banner.png`，672×560，SHA-256 `a2090884d142c858b409d99a9adb33d5c1f030135d2f0cc8a5be6b5fe2413de6`。
- Smart-locker：`開獎秀/02_OM/assets/智取櫃/Pixnet_Side sticker_Banner.png`，672×328，SHA-256 `665d18d8fbbf1ba9c34f8f2d496ac29491acb83c5ef8d4f454e8b0ada201f544`。
- Store：`開獎秀/02_OM/assets/門市/Pixnet_Side sticker_Banner.png`，672×323，SHA-256 `6942b4c8907051b5d0813827a6e23b7c2d1247ef9872fc4478e3b0ae2d101e6d`。
- Main Lottery Logo：`開獎秀/02_OM/assets/蝦皮大樂透_橘.png`、`開獎秀/02_OM/assets/蝦皮大樂透_白.png`。
- Vertical Shopee Logo：`開獎秀/02_OM/assets/直式蝦皮購物_橘.png`、`開獎秀/02_OM/assets/直式蝦皮購物_白.png`。

Main Lottery Logo 與 Vertical Shopee Logo 均為 renderer-drawn，兩者共用唯一 `logoMode`：Auto／Orange／White；Auto threshold `0.498708`。White 會同時使用白色版本，Orange 會同時使用橘色版本，Auto 會使用同一 resolved variant；不存在 independent secondary Logo control。

### 21.5 Defaults / Viewer / Verification

OM07 沿用 OM 共用 text limits：Title 8、Subtitle 7、Small1 18、Small2 18；weighted count：Han = 1、non-Han = 0.5。Smart-locker defaults 為 background `#2660ad`、title `#fffac8`、subtitle `#fff000`、small `#fffac8`；Store defaults 為 background `#ffda46`、title `#472704`、subtitle `#eb1717`、small `#472704`。Default text 沿用本文件第 7 節。

Viewer：`開獎秀/02_OM/viewer.html`。Implementation descriptor：`開獎秀/02_OM/js/layout-07-pixnet-side-sticker-banner.js`。Shared Renderer：`開獎秀/02_OM/js/renderer.js`，OM07 未修改。Launcher：`開獎秀/02_OM/launch/07_Pixnet_Side_sticker_Banner.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。

OM07 Technical Self-Test：PASS。OM07 Manual Verification：PASS。OM01～OM06 Regression：PASS。Full Canvas background、Smart／Store base placement、Main Logo、Vertical Shopee Logo、shared logoMode 與無 independent secondary Logo control 均 PASS。OM07 standalone Viewer／renderer baseline 與 OM Console integration 均已完成；Console integration current state 見第 10.1 節。Image Generation：NO；Images Modified By Codex：NO。

## 22. Yahoo_mbbanner 正式規格

### 22.1 Identity / Canvas / Status

- Layout：Yahoo_mbbanner
- Status：Implemented / Technical Self-Test PASS / Manual Verification PASS
- Canvas：300×250
- Final output：300×250 PNG
- Photoshop source：300 PPI
- Photoshop document pixel → Canvas pixel：1:1
- Typography conversion：`fontSizePx = Photoshop pt × 300 / 72`
- Renderer 使用 px；不得使用 browser pt。

Code Commit：

- Full：`336a8acd0fa84b50a01089e6edeeeb08c05fbe4f`
- Short：`336a8ac`
- Message：`feat(lottery-show): add OM Yahoo mbbanner layout`
- Parent：`1d68739cbac4081e7a732232a7212e99effcf68a`
- Docs Commit：Pending；不得虛構 Docs Commit hash。

### 22.2 Typography

| Field | Photoshop | `fontSizePx` | Font | Rendering |
|---|---:|---:|---|---|
| Title | 5pt @ 300 PPI | 20.833333333333332px | ShopeeNotoSans(content)-Medium | local 2× |
| Subtitle | 6.8pt @ 300 PPI | 28.333333333333332px | ShopeeNotoSans(content)-Bold | direct |
| Small1 | 2.5pt @ 300 PPI | 10.416666666666666px | ShopeeNotoSans(content)-Medium | local 2× |
| Small2 | 2.5pt @ 300 PPI | 10.416666666666666px | ShopeeNotoSans(content)-Medium | local 2× |

Medium local 2× 只負責 rendering quality，final logical scale = 1。沿用 actualBoundingBox ink-box semantics；不使用 auto-wrap 或 auto-shrink。

### 22.3 Background / Geometry

OM08 使用 full Canvas editable background，Canvas 外部沒有透明 margin；不使用 `backgroundShape`。

| Object | x | y | width | height |
|---|---:|---:|---:|---:|
| Smart-locker base | 0 | 130 | 300 | 120 |
| Store base | 0 | 133 | 300 | 117 |
| Main Lottery Logo | 76 | 10 | 148 | 24 |
| Vertical Shopee Logo | 264 | 7 | 28 | 39 |
| Title | 47 | 40 | 206 | 20 |
| Subtitle | 47 | 67 | 206 | 26 |
| Small1 | 47 | 100 | 206 | 10 |
| Small2 | 47 | 112 | 206 | 10 |

Smart-locker source intrinsic：300×120。Store source intrinsic：300×117。兩者原尺寸 1:1 並貼齊 Canvas 底部。上述 geometry 與 center ink-box alignment 已通過 Jamie Manual Verification。

### 22.4 Assets / Logo Behavior

- Overlay：`開獎秀/02_OM/assets/對位/Yahoo_mbbanner.png`，300×250，SHA-256 `c1cd27e9ae8027028f1563d4f8b23af68705da87d88fa3e7ad7a9de3d15dd37d`。
- Smart-locker：`開獎秀/02_OM/assets/智取櫃/Yahoo_mbbanner.png`，300×120，SHA-256 `7b209f4abc8772d0718c15255042b50aa19c3d097abdf4f2a4da81e6fbd2d23b`。
- Store：`開獎秀/02_OM/assets/門市/Yahoo_mbbanner.png`，300×117，SHA-256 `5970b5cf7bb38dc7b2f6d803db0ff7729f19aff73493396ed565fec22dcea2b`。
- Main Lottery Logo：`開獎秀/02_OM/assets/蝦皮大樂透_橘.png`、`開獎秀/02_OM/assets/蝦皮大樂透_白.png`。
- Vertical Shopee Logo：`開獎秀/02_OM/assets/直式蝦皮購物_橘.png`、`開獎秀/02_OM/assets/直式蝦皮購物_白.png`。

Main Lottery Logo 與 Vertical Shopee Logo 均為 renderer-drawn，兩者共用唯一 `logoMode`：Auto／Orange／White；Auto threshold `0.498708`。White 會同時使用白色版本，Orange 會同時使用橘色版本，Auto 會使用同一 resolved variant；不存在 independent secondary Logo control。

### 22.5 Defaults / Viewer / Verification

OM08 沿用 OM 共用 text limits：Title 8、Subtitle 7、Small1 18、Small2 18；weighted count：Han = 1、non-Han = 0.5。Smart-locker defaults 為 background `#2660ad`、title `#fffac8`、subtitle `#fff000`、small `#fffac8`；Store defaults 為 background `#ffda46`、title `#472704`、subtitle `#eb1717`、small `#472704`。Default text 沿用本文件第 7 節。

Viewer：`開獎秀/02_OM/viewer.html`。Implementation descriptor：`開獎秀/02_OM/js/layout-08-yahoo-mbbanner.js`。Shared Renderer：`開獎秀/02_OM/js/renderer.js`，OM08 未修改。Launcher：`開獎秀/02_OM/launch/08_Yahoo_mbbanner.command`，port `4177`、repo-root server、marker check、fail-closed、Chrome、mode `755`。

OM08 Technical Self-Test：PASS。OM08 Manual Verification：PASS。OM01～OM07 Regression：PASS。Full Canvas background、Smart／Store base placement、Main Logo、Vertical Shopee Logo、shared logoMode 與無 independent secondary Logo control 均 PASS。OM08 standalone Viewer／renderer baseline 與 OM Console integration 均已完成；Console integration current state 見第 10.1 節。Image Generation：NO；Images Modified By Codex：NO。
