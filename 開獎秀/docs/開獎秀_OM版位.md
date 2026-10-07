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

OM standalone Viewer：`開獎秀/02_OM/viewer.html`，目前支援 `Google_Pmax_1200x1200`、`Google_Pmax_1200x628` 與 `Google_Pmax_960x1200`，透過 layout routing 選擇 active descriptor。

目前支援：smart-locker／store、alignment overlay、overlay opacity、text editing、weighted text validation、runtime background color、title／subtitle／small color、logoMode Auto／Orange／White 與 Reset。Runtime background 先 fill Canvas，再繪製 style base asset；runtime text colors 即時 rerender；Auto Logo 使用 current runtime background。

OM 01 Launcher：`開獎秀/02_OM/launch/01_Google_Pmax_1200x1200.command`。

OM 02 Launcher：`開獎秀/02_OM/launch/02_Google_Pmax_1200x628.command`。

OM 03 Launcher：`開獎秀/02_OM/launch/03_Google_Pmax_960x1200.command`。

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

## 14. Assets

| Asset | Path | Intrinsic |
|---|---|---:|
| Alignment overlay | `開獎秀/02_OM/assets/對位/Google_Pmax_1200x1200.png` | 1200×1200 |
| smart-locker base | `開獎秀/02_OM/assets/智取櫃/Google_Pmax_1200x1200.png` | 1200×1191 |
| store base | `開獎秀/02_OM/assets/門市/Google_Pmax_1200x1200.png` | 1200×575 |
| Main Logo Orange | `開獎秀/02_OM/assets/蝦皮大樂透_橘.png` | 1678×272 |
| Main Logo White | `開獎秀/02_OM/assets/蝦皮大樂透_白.png` | 1678×272 |
| Shopping Logo Orange | `開獎秀/02_OM/assets/直式蝦皮購物_橘.png` | 83×112 |
| Shopping Logo White | `開獎秀/02_OM/assets/直式蝦皮購物_白.png` | 83×112 |

## 15. Code Commit / Manual Verification

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

## 16. Explicitly Deferred Work

- OM 其餘 layouts（OM 04+）
- OM 正式 Console integration
- OM Excel import
- OM JSON workspace
- OM formal Export
- OM ZIP
- OM 全版位整合

Google_Pmax_1200x1200 與 Google_Pmax_1200x628 standalone baselines 完成，不等於 OM item 全部完成。

## 17. 後續 OM 版位追加治理

新增 OM 版位時，先確認 source document 實際 PPI、document／Canvas dimensions、assets、geometry、typography 與 Manual Verification scope，再追加本文件對應章節與 completed layout table。未完成工作不得宣稱 Implemented；每個版位的 Code Commit 與 Manual Verification 必須以實際 repository evidence 記錄。
