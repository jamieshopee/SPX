# 開獎秀－線上／電子BN版位

Status: Living（持續更新，非 Locked）

## 1. 文件定位與範圍

本文件是「開獎秀 → 線上／電子BN（`online-bn`）」的**版位層**正式規格文件，集中記錄 01～17 的正式版位規格與實作狀態。

**涵蓋範圍**

- 僅涵蓋 item `online-bn`。
- 涵蓋其兩個 style：智取櫃 `smart-locker`、門市 `store`。
- 未來 01～17 的版位規格一律寫入本文件。
- online-bn 版位層的實作架構（共用 layout engine、layout descriptor、Viewer layout context、正式 Console 的版位選擇）亦記錄於本文件。

**不涵蓋範圍**

- 不涵蓋 OM、直播、門市清單。
- 不涵蓋開獎秀平台／共通層架構。平台層（Interface 1／Interface 2、共用控制台 shell、item／style 導覽、registry 資料模型、fail-closed 總則、UI／responsive 規格等）一律以 `開獎秀/docs/開獎秀_正式規格.md` 為準。

**治理方式**

- 本文件不重複抄寫整份平台規格。只記錄 online-bn 版位層真正需要的共通規格，以及各版位的差異。
- 本文件與 `開獎秀_正式規格.md` 衝突時，平台層以 `開獎秀_正式規格.md` 為準；版位層以本文件為準。兩者皆不得覆蓋 `docs/架構說明.md`（Architecture Contract v1.0，Status: Locked）；若與該 Locked Contract 衝突，應停止並要求 Jamie 裁決。
- **不得為個別版位再建立獨立 MD。** 01～17 全部寫入本文件。
- 只有本文件明確記載為「已裁決」或「Implemented」的內容才成立。標記為 Pending 的版位一律視為尚未裁決，下一階段不得自行假設、不得自行補完。

## 2. 線上／電子BN 共通規格

本節只記錄目前已由 01、02、03、04 實作正式證明，且適合 online-bn 版位共用的內容。**尚未實作的 05～17 行為不得寫入本節，也不得視為已完成。**

### 2.1 Style

`online-bn` 支援兩個 style：`smart-locker`（智取櫃）與 `store`（門市）。

同一版位的兩個 style 共用**同一個 layout descriptor 與同一套共用 renderer**，不建立兩套 renderer。style 只決定以下幾項 style-specific 資料：

- 正式底圖（base asset）
- 底圖在正式畫布上的 placement
- 四個預設色（背景色／主標色／副標色／小字色）

其餘（畫布尺寸、文字 geometry、Logo geometry、字型、水平對齊、Logo Auto 規則、控制項形狀）同一版位的兩個 style 完全共用。

style context 沿用平台層既有的 URL query param，不新增第二套 style context：

```text
console.html?item=online-bn&style=smart-locker
console.html?item=online-bn&style=store
```

### 2.2 KV

目前 online-bn **沒有 KV upload**。無 KV 欄位、無 KV box、無 KV draw step、無 KV placeholder。

### 2.3 Logo

正式 Logo assets（online-bn 全版位共用）：

- 橘：`開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png`（1678 × 272）
- 白：`開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png`（1678 × 272）

Logo 模式三種：`Auto`／`Orange`／`White`。`Orange` 與 `White` 為強制指定；`Auto` 依目前背景色自動判定。

**Logo Auto 判定（sRGB linearization）**

```text
v = c / 255

linear = v <= 0.04045
       ? v / 12.92
       : ((v + 0.055) / 1.055) ^ 2.4

L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear

threshold = 0.498708

L >= 0.498708  →  橘 Logo（蝦皮大樂透_橘.png）
L <  0.498708  →  白 Logo（蝦皮大樂透_白.png）
```

判定輸入為目前背景色（完整六位 HEX）。非法 HEX 與未知模式一律 fail-closed。只保存 mode，不保存解算後的 variant；variant 於每次 render 當場解算。**不得建立第二套 luminance 判定，不得修改 threshold。**

Logo 的 contain fit 為全版位共通（`scale = min(boxW / srcW, boxH / srcH)`、不 crop、不 stretch、destination 座標不取整、垂直置中）；**水平對齊為 layout-specific**，見第 2.9 節。

### 2.4 文字 weighted count

正式規則：

| 類別 | unit |
|---|---|
| 中文漢字 | 1 |
| 英文 | 0.5 |
| 數字 | 0.5 |
| 符號 | 0.5 |

**不得寫成、也不得實作為「ASCII = 0.5／non-ASCII = 1」。** 全形標點屬符號，一律 0.5。

目前 implementation 以 Unicode `Script=Han` 判定中文漢字（`/\p{Script=Han}/u`），非漢字一律 0.5。因此 `，`、`。`、`！`、`？`、`：`、`；`、`（`、`）`、`/`、`-`、`%` 等符號均為 **0.5**，不是 1。

### 2.5 文字上限（online-bn 全版位共通）

| 元素 | limit |
|---|---|
| 主標 | 8 |
| 副標 | 7 |
| 小字 1 | 18 |
| 小字 2 | 18 |

此為 online-bn **全版位共通**的正式上限，不是單一版位值。計算規則依第 2.4 節。目前 01、02、03、04 皆採用此組上限。

### 2.6 預設色（online-bn 全版位共通）

| style | 背景色 | 主標 | 副標 | 小字 |
|---|---|---|---|---|
| `smart-locker` | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| `store` | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

此為 online-bn **全版位共通**的正式預設色。各 layout descriptor 各自表達一份，但產品規格上數值相同。

使用者可調整的顏色共四項：背景色、主標顏色、副標顏色、小字顏色。**小字 1 與小字 2 共用同一個小字顏色**，不提供第二個小字顏色控制。

### 2.7 文字輸入行為

- **IME-safe**：composition 進行中不做超限判定與 rollback；`compositionend` 後完整驗證一次。
- **超限 rollback**：非組字期間輸入若超過該欄 limit，還原為上一個合法值，不更新 state、不重繪、不截斷字串、不彈窗。
- renderer 層**不得** auto-wrap、不得 auto-shrink。長度一律由控制層的 limit 保證。

### 2.8 Typography 共通原則

**Photoshop Character panel 的 source pt 與 Browser Canvas renderer 的 pt 不是同一個值，不得混為一談。**

- Photoshop 的 pt 是物理單位，落到 raster pixel 取決於文件解析度。
- CSS／Canvas 的 pt 由規範固定為 `1pt = 96/72 px`。

online-bn 的 renderer 正式採用與「快速取件」一致的換算：

```text
Canvas pt = Photoshop pt × 72 / 96
```

目前已套用此換算的版位：

| 版位 | Photoshop source | Canvas renderer |
|---|---|---|
| 01_DDcard BN | 40 / 60 / 24pt | 30 / 45 / 18pt |
| 02_Mall HBN | 40 / 60 / 24pt | 30 / 45 / 18pt |
| 03_LPBN | 52 / 66 / 23.5pt | **39 / 49.5 / 17.625pt** |
| 04_POP UP | 40 / 55 / 25pt | **30 / 41.25 / 18.75pt** |

換算結果為非整數時（如 03 的 `49.5pt`、`17.625pt`，04 的 `41.25pt`、`18.75pt`）一律**原值保留**，不得取整、不得改用 px。

此換算為 online-bn renderer 已採用的換算原則；**不代表 05～17 的字級已經決定**。各版位的 Photoshop source pt 與字重仍須由該版位實際調查後決定（01、03、04 的小字為 Medium、02 為 Regular，見第 2.11 節）。

### 2.9 水平對齊（layout-specific）

水平對齊**不是全域行為**，由各 layout descriptor 的 `horizontalAlign` 決定；垂直對齊則全版位一律為 ink-box center。

| 版位 | 對位 box 特徵 | `horizontalAlign` | Logo | 文字 |
|---|---|---|---|---|
| 01_DDcard BN | 五個 box 共用水平中心 265.5 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 02_Mall HBN | 五個 box 共用左緣 x=98 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 03_LPBN | 五個 box 共用左緣 x=58 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 04_POP UP | 五個 box 共用水平中心 290 | `center` | contain 後水平置中 | ink-box 水平置中 |

`left` 的實作語意為 **`x = box.x − actualBoundingBoxLeft`**，使文字的 ink 左緣精確落在 box 左緣；**不是單純設定 `textAlign = "left"` 後以 `box.x` 繪製**。Logo 的 `left` 則為 `destX = box.x`。

文字定位一律以 `actualBoundingBoxLeft/Right/Ascent/Descent` 量測，座標不取整。

### 2.10 local 2× supersampling

正式算繪採 renderer-local 2× supersampling：離屏 canvas 尺寸為 **該版位 canvas × 2**，搭配 `scale(2, 2)`、仍以正式畫布 geometry 繪製，再以 high-quality smoothing downsample 回正式 canvas。

**2× 層的成員由 layout descriptor 的 `supersampledFields` 決定，不由字重決定。** 不在該清單內的欄位列於 `directFields`，直接繪於正式 canvas。

| 版位 | `supersampledFields` | `directFields` | offscreen |
|---|---|---|---|
| 01_DDcard BN | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 1062 × 1584 |
| 02_Mall HBN | 主標（Medium）＋小字 1（Regular）＋小字 2（Regular） | 副標（Bold） | 2400 × 720 |
| 03_LPBN | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2400 × 1100 |
| 04_POP UP | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 1160 × 1440 |

四者使用同一段共用程式；字重差異不影響 2× 機制。

### 2.11 字型架構

共用 engine 支援三個字重，對應 SPX 根層既有正式 WOFF2：

| 字重 | family 別名 | 來源 |
|---|---|---|
| Regular | `LotteryShowNotoSans Regular` | `fonts/ShopeeNotoSans(content)-Regular.woff2` |
| Medium | `LotteryShowNotoSans Medium` | `fonts/ShopeeNotoSans(content)-Medium.woff2` |
| Bold | `LotteryShowNotoSans Bold` | `fonts/ShopeeNotoSans(content)-Bold.woff2` |

family 別名以 FontFace API 建立，不與 `console.css` 的 `"Shopee Noto Sans"` 共用，以便用 `document.fonts.check()` 做確定性 readiness gate。

**字型按該 layout 實際用到的字重註冊**，不一次載入全部：

| 版位 | 實際註冊字重 |
|---|---|
| 01_DDcard BN | Medium、Bold（**不載 Regular**） |
| 02_Mall HBN | Regular、Medium、Bold |
| 03_LPBN | Medium、Bold（**不載 Regular**） |
| 04_POP UP | Medium、Bold（**不載 Regular**） |

字型未就緒（`load()` 失敗或 `check()` 不過）一律 **render fail-closed**，不 fallback 系統字型、不產生半成品。

### 2.12 共用 renderer 架構：engine ＋ layout descriptor

目前 online-bn 的正式實作為「**共用 layout engine ＋ layout-specific descriptor**」。

**共用 engine**：`開獎秀/01_線上電子BN/js/layout-engine.js`，負責：

- FontFace 別名、按需註冊與 readiness gate（第 2.11 節）
- 素材載入快取與 intrinsic size 驗證
- 背景繪製（legacy full-canvas fill 或 descriptor 指定的 `rounded-card`，見下）
- contain 幾何計算
- ink-box 文字量測與繪製（水平 `center`／`left`、垂直 ink-box center）
- local 2× supersampling layer（第 2.10 節）
- 正式 render pipeline（Preview 與未來 Export 的唯一繪製來源）
- `createInitialState(layout, styleId)`

engine **不持有任何版位數值**；canvas、geometry、字級、字重、顏色、素材路徑、上限一律由 descriptor 提供。

**layout descriptor**：

| 版位 | descriptor 檔案 |
|---|---|
| 01_DDcard BN | `開獎秀/01_線上電子BN/js/layout-01-ddcard-bn.js` |
| 02_Mall HBN | `開獎秀/01_線上電子BN/js/layout-02-mall-hbn.js` |
| 03_LPBN | `開獎秀/01_線上電子BN/js/layout-03-lpbn.js` |
| 04_POP UP | `開獎秀/01_線上電子BN/js/layout-04-pop-up.js` |

descriptor 欄位：`id`、`name`、`canvas`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc`，以及 **optional** 的 `background`。

**背景模式（optional descriptor，04 導入）**

| `layout.background` | 行為 | 目前採用的版位 |
|---|---|---|
| 未宣告 | legacy：`fillRect(0, 0, canvas.width, canvas.height)` 填滿整張畫布 | 01、02、03 |
| `mode: "rounded-card"` | 畫布保持透明，只以背景色填 descriptor 指定的圓角卡片 | 04 |

此為 **backward-compatible 擴充**：`layout.background` 不存在時走與擴充前逐行相同的 legacy 分支，01／02／03 的 descriptor 皆未新增此欄位，背景行為與輸出完全未變（04 Regression Verification = PASS，見第 7.14 節）。

背景模式一律 **descriptor-driven**：engine **不得**依 `layout.id` hard-code 任何版位。`layout.background` 存在時執行最小 validation —— `mode` 必須為已知模式、必須有 `box`、`x`／`y`／`width`／`height`／`radius` 皆為有限數、`width` 與 `height` > 0、`0 <= radius <= min(width, height) / 2`、卡片幾何不得超出畫布範圍；任一不合法即 **fail-closed throw**，不降級、不自動修正。

**目前有 01、02、03、04 四個 descriptor。這不是 17 版位的 registry 或 plugin system，也未為 05～17 預先抽象。** 03 的加入未修改 `layout-engine.js`（0 modification）；04 僅為了上述背景能力對 engine 做最小擴充，未加入任何 04 專屬數值。

Logo Auto 的純邏輯維持獨立於 `開獎秀/01_線上電子BN/js/logo-auto.js`，engine 引用之，未修改。

### 2.13 Preview 與 renderer 來源

Preview 使用共用 engine 的正式 renderer，**不建立 Preview-only renderer**。`preview.js` 不綁定任何單一版位：canvas 尺寸與名稱一律取自傳入的 layout descriptor。正式 canvas 的 pixel size 固定，viewport 僅以 CSS display size 等比縮放（只縮不放），不改變 `canvas.width`／`canvas.height`。

`controls.js` 同樣不綁定單一版位：文字欄位、上限與顏色欄位一律由 descriptor 提供；weighted count、IME-safe、超限 rollback、色票驗證行為不變。

### 2.14 正式 Console 的版位選擇

正式 Console 左欄列出目前的正式版位，目前為 **01_DDcard BN**、**02_Mall HBN**、**03_LPBN**、**04_POP UP**（順序固定，新版位附加於末端），目前選中者標記 `aria-current="true"`。

切換版位的行為：dispose 目前 session → 以新 layout 的 `createInitialState(layout, styleId)` 建立 state → 重新掛載 Preview 與 Controls。因此**切換版位後文字回空白、顏色回該 style 預設色**。

目前**沒有** layout state cache、沒有 localStorage／sessionStorage／history.state、沒有 JSON workspace。

正式 Console 的 URL context 仍只有 `item` 與 `style`；**版位選擇不寫入 URL**。

`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js` 未因版位選擇而變更。

### 2.15 Viewer 與 launcher

**Viewer 為 online-bn 全版位共用的單一頁面**：`開獎秀/01_線上電子BN/launch/viewer.html`，不為每個版位複製 HTML。

版位以 query 決定：

```text
viewer.html?layout=01-ddcard-bn
viewer.html?layout=02-mall-hbn
viewer.html?layout=03-lpbn
viewer.html?layout=04-pop-up
```

- 無 `layout` 參數 → 預設 `01-ddcard-bn`（維持既有 bookmark／launcher 相容）。
- **未知 layout → fail-closed**：顯示錯誤、清空 Preview 與 Controls、停用控制項，**不 fallback 到 01**。

Viewer 依 layout descriptor 取得：layout name、canvas 尺寸、mount 用的 layoutId、以及對位 overlay 來源（`alignmentOverlaySrc`），不再寫死任何單一版位。

**每個 online-bn 正式版位各有自己的 launcher**，供 Jamie 以 Finder 雙擊後在 Google Chrome 進行 Manual Verification：

| 版位 | launcher | mode | Viewer URL |
|---|---|---|---|
| 01_DDcard BN | `launch/01_DDcard BN.command` | 100755 | `viewer.html?layout=01-ddcard-bn` |
| 02_Mall HBN | `launch/02_Mall HBN.command` | 100755 | `viewer.html?layout=02-mall-hbn` |
| 03_LPBN | `launch/03_LPBN.command` | 100755 | `viewer.html?layout=03-lpbn` |
| 04_POP UP | `launch/04_POP UP.command` | 100755 | `viewer.html?layout=04-pop-up` |

所有 launcher **共用 port 4176** 與同一個 marker（`data-spx-lottery-show-online-bn-viewer="true"`），因此可互相安全重用同一個本機 server；**不為每個版位新增 port**。各 launcher 皆沿用既有安全機制：SPX Repository root 作為 document root、`.js`／`.css` 回 `Cache-Control: no-store`、marker 驗證後才重用、有限次數 readiness 輪詢、port 被非本工具程式占用即 fail-closed、`trap` 清理且只終止自己啟動的 server。

Viewer 與 launcher 是 **Manual Verification helper**，不是正式產品介面：

- Viewer 帶有固定 sample text 與對位 overlay，兩者僅供人工驗證。
- **正式 Console 的 initial text 為空字串**；Viewer 的 sample text 不是 production default，不得寫入正式 Console、workspace 或任何 schema。
- 對位圖只作 DOM overlay（`position: absolute`、`pointer-events: none`），不進正式 renderer、不改 canvas pixels。

### 2.16 Viewer Manual Verification sample（online-bn 全版位共通）

所有 online-bn 版位的 Viewer 使用同一組 sample text：

| 欄位 | sample text | weighted count / limit |
|---|---|---|
| 主標 | `12/12直播開獎` | 6.5 / 8 |
| 副標 | `取件最高抽百萬` | 7 / 7 |
| 小字 1 | `10/10-12/30下單，在到貨一天內取件限定` | 18 / 18 |
| 小字 2 | `百萬獎金均分，詳情依活動規則為準` | 15.5 / 18 |

sample text 經 Viewer 以既有 controls 的 input 事件寫入，完整走正式 weighted count 與 rollback 流程，**不 bypass 任何 validation**。

**Viewer sample ≠ production default。** 正式 Console 的 `createInitialState().text` 四個欄位（`title`、`subtitle`、`small1`、`small2`）一律為空字串。

### 2.17 目前共通層未涵蓋的項目

以下尚未裁決，不得自行補完：Excel 工單匯入、JSON workspace、Export／下載、encoder 與輸出格式、05～17 的任何規格。

## 3. 版位總表

| # | 版位名稱 | 狀態 |
|---|---|---|
| 01 | 01_DDcard BN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 02 | 02_Mall HBN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 03 | 03_LPBN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 04 | 04_POP UP | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 05 | 05_IG | Pending（未製作） |
| 06 | 06_FB Post | Pending（未製作） |
| 07 | 07_OM與FEED | Pending（未製作） |
| 08 | 08_SKBN_APP左右 | Pending（未製作） |
| 09 | 09_SKBN_APP中 | Pending（未製作） |
| 10 | 10_SKBN_PC | Pending（未製作） |
| 11 | 11_遊戲大廳 MSBN | Pending（未製作） |
| 12 | 12_TVBN_一般門市 | Pending（未製作） |
| 13 | 13_TVBN_智取店 | Pending（未製作） |
| 14 | 14_繳費機直式BN-立保 | Pending（未製作） |
| 15 | 15_繳費機直式BN-博辰 | Pending（未製作） |
| 16 | 16_繳費機下方BN-立保 | Pending（未製作） |
| 17 | 17_繳費機下方BN-博辰 | Pending（未製作） |

05～17 的名稱讀自 `開獎秀/01_線上電子BN/assets/` 下對位／智取櫃／門市三個目錄的素材檔名（三者命名一致）。這些名稱僅供定位，**尚未經正式裁決**；各版位的尺寸、geometry、字級、顏色與任何行為一律尚未調查、尚未設計。本表不構成對 05～17 的任何規格承諾。

05～17 的素材目前存在於 Repository 工作目錄但**尚未納入版本控制**，不屬於已完成範圍。

## 4. 01_DDcard BN

### 4.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `3c022a9ba75333fa53fc785f2c83fe6107967162` |
| Code Commit（short） | `3c022a9` |
| Commit message | `feat(lottery-show): add online BN DDcard layout` |
| Parent | `4c9bc177c2fc9069a986f9d547d61c489885c996` |

> 01 的正式規格與視覺輸出未因後續 02 導入共用架構而改變；其 rendering plumbing 的現況見第 4.12 節。

### 4.2 Canvas

正式畫布 **531 × 792**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 4.3 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/01_DDcard BN.png` | 531 × 792 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/01_DDcard BN.png` | 531 × 792 |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/01_DDcard BN.png` | 531 × 438 |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 4.4 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/01_DDcard BN.png` | 0 | 0 | 531 | 792 |
| `store` | `assets/門市/01_DDcard BN.png` | 0 | **354** | 531 | 438 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。store 底圖高 438，貼齊 531 × 792 畫布底部（354 + 438 = 792），畫布上方 354px 由背景色呈現。

### 4.5 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 531 × 792）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 531, 792)` — 背景色
2. `drawImage(base, x, y, w, h)` — style 正式底圖
3. Logo（contain ＋ 置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於同一張 2× 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

兩者的差異只在第 4／5 步：主標、小字 1、小字 2 同屬 2× 層，因此在程式中同一步落版，副標在其後。四個文字 box 的垂直範圍為 170–207、221–278、296–318、325–347，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

CTA、人物、場景、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。

### 4.6 Logo

| 項目 | 值 |
|---|---|
| box | x = 77、y = 89、width = 377、height = 64 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。01 的水平對齊為 `center`（第 2.9 節）。

### 4.7 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 4.8 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 60pt | `45pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` 24pt | `18pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` 24pt | `18pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`。字型別名與按需註冊依第 2.11 節；01 只註冊 Medium 與 Bold，**不載 Regular**。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層與文字定位依第 2.10、2.9 節；01 的文字水平對齊為 ink-box center。**不得 auto-wrap、不得 auto-shrink。**

### 4.9 文字 geometry

| 元素 | x | y | width | height |
|---|---|---|---|---|
| 主標 | 90 | 170 | 351 | 37 |
| 副標 | 43 | 221 | 445 | 57 |
| 小字 1 | 43 | 296 | 445 | 22 |
| 小字 2 | 43 | 325 | 445 | 22 |

五個 box（含 Logo）共用同一水平中心 265.5。小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。

### 4.10 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。

### 4.11 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=01-ddcard-bn` |
| Launcher | `開獎秀/01_線上電子BN/launch/01_DDcard BN.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/01_DDcard BN.png` |

Viewer 提供智取櫃／門市切換、版位切換與對位圖 overlay（顯示／隱藏、透明度），並自動帶入第 2.16 節的共通 sample text。正式 Console 的 initial text 仍為四個空字串。

### 4.12 Implementation files

01 的原始 Code Commit `3c022a9` 涵蓋 15 paths（13 A ＋ 2 M）：

```text
A  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/js/layout-01-ddcard-bn.js
A  開獎秀/01_線上電子BN/js/logo-auto.js
A  開獎秀/01_線上電子BN/js/preview.js
A  開獎秀/01_線上電子BN/js/controls.js
A  開獎秀/01_線上電子BN/css/online-bn.css
A  開獎秀/01_線上電子BN/launch/viewer.html
A  開獎秀/01_線上電子BN/launch/01_DDcard BN.command
A  開獎秀/01_線上電子BN/assets/對位/01_DDcard BN.png
A  開獎秀/01_線上電子BN/assets/智取櫃/01_DDcard BN.png
A  開獎秀/01_線上電子BN/assets/門市/01_DDcard BN.png
A  開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png
A  開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png
M  開獎秀/console.html
M  開獎秀/js/console.js
```

**Current state（02 導入後）**：01 的 rendering plumbing 已改為共用架構 —— `layout-01-ddcard-bn.js` 現在是 **01 的 layout descriptor**（純資料，不含繪製邏輯），繪製一律由共用的 `layout-engine.js` 執行（第 2.12 節）。此變更隨 Code Commit `931c522` 進入版本控制，**01 的正式數值與視覺輸出完全未變**，01 Regression Verification = PASS（第 5.13 節）。

**Shared console integration**：`console.html` 只新增三個掛載點 id；`console.js` 只在 `item.id === "online-bn"` 時動態 import online-bn 版位模組。OM 與直播走不到該 import，不載入 online-bn 的 JS 與 CSS，三欄維持既有 empty state。`開獎秀/js/registry.js` 與 `開獎秀/css/console.css` 未修改。online-bn 專屬 CSS 由版位模組於 mount 時動態載入一次，`console.html` 不靜態引用。

### 4.13 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | PASS（Code Commit 前完成：語法檢查、renderer 常數與 geometry 斷言、Logo Auto 與 threshold、weighted count 與四句 sample 驗算、素材 intrinsic size、context isolation、既有 console／Interface／門市清單回歸） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Viewer 四欄自動帶入、小字 1 完整保留且 18/18 不被 rollback、Preview 正常、Typography 修正後正確、智取櫃 PASS、門市 PASS） |

## 5. 02_Mall HBN

### 5.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `931c52261a4813c39c2bf3007c93888278cc53ed` |
| Code Commit（short） | `931c522` |
| Commit message | `feat(lottery-show): add online BN Mall HBN layout` |
| Parent | `7b7740c1d72502e3c03a92715204a8be36d3411f` |
| Docs Commit | Pending |

### 5.2 Canvas

正式畫布 **1200 × 360**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 5.3 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/02_Mall HBN.png` | 1200 × 360 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/02_Mall HBN.png` | 1200 × 360 |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/02_Mall HBN.png` | **1153 × 360** |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |

Logo 沿用 online-bn 全版位共用素材（第 2.3 節），未新增 02 專屬 Logo。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 5.4 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/02_Mall HBN.png` | 0 | 0 | 1200 | 360 |
| `store` | `assets/門市/02_Mall HBN.png` | **47** | 0 | 1153 | 360 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。store 底圖寬 1153，**右對齊**貼齊 1200 × 360 畫布右緣（47 + 1153 = 1200），畫布左側 47px 由背景色呈現。

### 5.5 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 1200 × 360）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 1200, 360)` — 背景色
2. `drawImage(base, x, y, w, h)` — style 正式底圖
3. Logo（contain ＋ 左對齊、垂直置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 2400 × 720 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

四個文字 box 的垂直範圍為 153–189、200–256、273–294、302–323，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

CTA、人物、場景、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。

### 5.6 Logo

| 項目 | 值 |
|---|---|
| box | x = 98、y = 96、width = 351、height = 50 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平左對齊（destX = 98）**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**高度受限**：`scale = min(351/1678, 50/272) = 50/272`，dest 約 **308.4559 × 50**，`destX = 98`、`destY = 96`。水平餘裕約 42.544px 全部留在 box 右側，**不左右平分**。

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。在 02 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 5.7 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 5.8 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 60pt | `45pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Regular` 24pt | `18pt "LotteryShowNotoSans Regular"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Regular` 24pt | `18pt "LotteryShowNotoSans Regular"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`。

**02 的小字字重為 Regular**，與 01 的 Medium 不同；這是 02 與 01 的正式差異之一。02 註冊 Regular、Medium、Bold 三個字重（第 2.11 節），使用 SPX 根層既有 WOFF2，未新增字型檔。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節），因此 02 的 Regular 小字同樣進入 2× 層。**不得 auto-wrap、不得 auto-shrink。**

### 5.9 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 98 | 153 | 351 | 37 | left ink | ink-box center |
| 副標 | 98 | 200 | 445 | 57 | left ink | ink-box center |
| 小字 1 | 98 | 273 | 445 | 22 | left ink | ink-box center |
| 小字 2 | 98 | 302 | 445 | 22 | left ink | ink-box center |

**02 的五個元素（Logo ＋ 四個文字）共用同一個水平 anchor `x = 98`**，與 01 的共用水平中心不同。對位圖的五個 box 共用左緣 x=98、水平中心各異（273.5／320.5），因此 02 的 `horizontalAlign` 為 `left`（第 2.9 節）。

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。

### 5.10 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。

### 5.11 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=02-mall-hbn` |
| Launcher | `開獎秀/01_線上電子BN/launch/02_Mall HBN.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/02_Mall HBN.png` |

02 與 01 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）。Viewer 自動帶入第 2.16 節的共通 sample text；正式 Console 的 initial text 仍為四個空字串。

### 5.12 Implementation files

Code Commit `931c522` 實際涵蓋的檔案，共 13 paths（7 M ＋ 6 A）：

```text
A  開獎秀/01_線上電子BN/js/layout-engine.js
A  開獎秀/01_線上電子BN/js/layout-02-mall-hbn.js
A  開獎秀/01_線上電子BN/launch/02_Mall HBN.command
A  開獎秀/01_線上電子BN/assets/對位/02_Mall HBN.png
A  開獎秀/01_線上電子BN/assets/智取櫃/02_Mall HBN.png
A  開獎秀/01_線上電子BN/assets/門市/02_Mall HBN.png
M  開獎秀/01_線上電子BN/js/layout-01-ddcard-bn.js
M  開獎秀/01_線上電子BN/js/preview.js
M  開獎秀/01_線上電子BN/js/controls.js
M  開獎秀/01_線上電子BN/js/online-bn.js
M  開獎秀/01_線上電子BN/css/online-bn.css
M  開獎秀/01_線上電子BN/launch/viewer.html
M  開獎秀/01_線上電子BN/launch/01_DDcard BN.command
```

七個 M 的性質：`layout-01-ddcard-bn.js` 改為 01 descriptor（數值未變）；`preview.js`／`controls.js` 解除 01 硬綁、改由 layout 驅動；`online-bn.js` 支援 01／02 版位清單與切換；`online-bn.css` 補版位按鈕未選中態的最小樣式；`viewer.html` 改為共用 Viewer ＋ `?layout=` context；`01_DDcard BN.command` 明確帶入 `?layout=01-ddcard-bn`。

`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`開獎秀/01_線上電子BN/js/logo-auto.js` 皆未修改。

**不在本次 Code Commit 範圍**：03～17 的素材與四張未使用的舊 Logo 仍為 untracked，不屬於已完成範圍。

### 5.13 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 尺寸、三張素材 intrinsic、兩組 base placement、Logo contain 與左對齊、四組文字 geometry 與 x=98 anchor、三組 font string 與 pt 換算、Regular 註冊、2× offscreen 2400 × 720 與成員、limits、四句 sample 計數、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、兩個 launcher port 與 marker、`git diff --check`） |
| 01 Regression Verification | **PASS**（01 canvas、兩組 base placement、Logo box 與水平置中、文字 ink center、30/45/18pt 與小字 Medium、01 不載 Regular、2× 成員與 1062 × 1584、limits、預設色、Logo Auto threshold、對位 overlay、weighted count 規則、01 launcher 可用、共用 console shell 與 Interface／門市清單未受影響） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（四行文字與 Logo 左緣對齊、小字 Regular、smart-locker 視覺、store 右貼齊、Logo Auto、對位 overlay 對位、01↔02 切換、01 無 regression） |

## 6. 03_LPBN

### 6.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `676f5a0d3d78eb07dc87942b26f80a0b0e15e31c` |
| Code Commit（short） | `676f5a0` |
| Commit message | `feat(lottery-show): add online BN LPBN layout` |
| Parent | `5b1943dc325b7557b05513de4a0113c918314e6e` |
| Docs Commit | Pending |

layout id：`03-lpbn`。

### 6.2 Canvas

正式畫布 **1200 × 550**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 6.3 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/03_LPBN.png` | 1200 × 550 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/03_LPBN.png` | 1200 × 550 |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/03_LPBN.png` | **688 × 550** |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |

Logo 沿用 online-bn 全版位共用素材（第 2.3 節），未新增 03 專屬 Logo。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 6.4 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/03_LPBN.png` | 0 | 0 | 1200 | 550 |
| `store` | `assets/門市/03_LPBN.png` | **512** | 0 | 688 | 550 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。store 底圖寬 688，**右對齊**貼齊 1200 × 550 畫布右緣（512 + 688 = 1200），畫布左側 512px 由背景色與文字區呈現。

### 6.5 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 1200 × 550）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 1200, 550)` — 背景色
2. `drawImage(base, x, y, w, h)` — style 正式底圖
3. Logo（contain ＋ 左對齊、垂直置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 2400 × 1100 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

四個文字 box 的垂直範圍為 240–288、300–361、374–395、402–423，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

CTA、人物、場景、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。

### 6.6 Logo

| 項目 | 值 |
|---|---|
| box | x = 58、y = 162、width = 375、height = 61 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平左對齊（destX = 58）**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(375/1678, 61/272) = 375/1678`，dest ≈ **375 × 60.7867**，`destX = 58`、`destY ≈ 162.1067`。水平餘裕為 0，因此 `left` 與 `center` 的 destX 同為 58；descriptor 仍統一宣告 `horizontalAlign: "left"`，與四個文字欄位一致。

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。在 03 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 6.7 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 6.8 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 52pt | `39pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 66pt | `49.5pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` 23.5pt | `17.625pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` 23.5pt | `17.625pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`。`49.5pt` 與 `17.625pt` 為非整數 pt，**原值保留**，未取整、未改用 px。

**03 的小字字重為 Medium**（與 01 相同，與 02 的 Regular 不同），因此 03 只註冊 Medium 與 Bold，**不載入 Regular**（第 2.11 節）。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節）。**不得 auto-wrap、不得 auto-shrink。**

### 6.9 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 58 | 240 | 405 | 49 | left ink | ink-box center |
| 副標 | 58 | 300 | 475 | 62 | left ink | ink-box center |
| 小字 1 | 58 | 374 | 475 | 22 | left ink | ink-box center |
| 小字 2 | 58 | 402 | 475 | 22 | left ink | ink-box center |

**03 的五個元素（Logo ＋ 四個文字）共用同一個水平 anchor `x = 58`。** 對位圖的五個 box 共用左緣 x=58、水平中心各異（245.5／260.5／295.5），因此 03 的 `horizontalAlign` 為 `left`（第 2.9 節）。

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。

### 6.10 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。

### 6.11 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=03-lpbn` |
| Launcher | `開獎秀/01_線上電子BN/launch/03_LPBN.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/03_LPBN.png` |

03 與 01、02 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）。Viewer 自動帶入第 2.16 節的共通 sample text；正式 Console 的 initial text 仍為四個空字串。

### 6.12 Implementation files

Code Commit `676f5a0` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/03_LPBN.png
A  開獎秀/01_線上電子BN/assets/智取櫃/03_LPBN.png
A  開獎秀/01_線上電子BN/assets/門市/03_LPBN.png
A  開獎秀/01_線上電子BN/js/layout-03-lpbn.js
A  開獎秀/01_線上電子BN/launch/03_LPBN.command
M  開獎秀/01_線上電子BN/js/online-bn.js
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_03_LPBN` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`）；`viewer.html` 僅更新 fail-closed 訊息中的合法值列舉字串。

**`layout-engine.js` 為 0 modification**；`layout-01-ddcard-bn.js`、`layout-02-mall-hbn.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css`、`01_DDcard BN.command`、`02_Mall HBN.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js` 亦皆未修改。

**不在本次 Code Commit 範圍**：04～17 的素材與四張未使用的舊 Logo 仍為 untracked，不屬於已完成範圍。

### 6.13 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 尺寸、三張素材 intrinsic、兩組 base placement、Logo contain 與左對齊、四組文字 geometry 與 x=58 anchor、三組 font string 與 ×72/96 換算、非整數 pt 保留、僅註冊 Medium＋Bold、2× offscreen 2400 × 1100 與成員、limits、四句 sample 計數、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、三個 launcher port 與 marker、`git diff --check`） |
| 01 Regression Verification | **PASS**（canvas、兩組 base placement、Logo box 與水平置中、文字 ink center、30/45/18pt 與小字 Medium、不載 Regular、2× 成員與 1062 × 1584、limits、預設色、對位 overlay、launcher 可用） |
| 02 Regression Verification | **PASS**（canvas、兩組 base placement、Logo box 與左對齊、30/45/18pt 與小字 Regular、載 Regular＋Medium＋Bold、2× 成員與 2400 × 720、limits、預設色、對位 overlay、launcher 可用） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Canvas 1200 × 550、共通 Viewer sample 帶入、Logo ＋ 四組文字共同 x=58 左對齊、03 typography、小字 Medium、smart-locker 視覺、store 原尺寸右對齊、Logo Auto、對位 overlay、01／02／03 版位切換、01 與 02 無 regression） |

## 7. 04_POP UP

### 7.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `5e8511211e6cbfec0a4420ad91d1dc8f99659053` |
| Code Commit（short） | `5e85112` |
| Commit message | `feat(lottery-show): add online BN POP UP layout` |
| Parent | `c10934552f691b0cdfa7b488824a2bb6e5510e7b` |
| Docs Commit | Pending |

layout id：`04-pop-up`。

### 7.2 Canvas

正式畫布 **580 × 720**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 7.3 背景（圓角卡片）

**04 不使用 full-canvas 背景填色。** 畫布本身保持透明，背景色只填一張圓角卡片：

| 項目 | 值 |
|---|---|
| 模式 | `rounded-card`（第 2.12 節的 optional `layout.background`） |
| x | 53 |
| y | 27 |
| width | 475 |
| height | 658 |
| radius | **40** |
| 卡片外 | **transparent**（不填色、不繪製任何內容） |

填色來源為 `state.colors.background`，即第 2.6 節的背景色控制項；04 未新增第二個背景色欄位。radius `40` 為 **Canvas geometry 值，不是 typography pt**，因此**不套用** `× 72 / 96` 換算。

01、02、03 的 descriptor 未宣告 `background`，仍為 legacy full-canvas fill（第 2.12 節）。

### 7.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/04_POP UP.png` | 580 × 720 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/04_POP UP.png` | **475 × 347** |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/04_POP UP.png` | **475 × 338** |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |

Logo 沿用 online-bn 全版位共用素材（第 2.3 節），未新增 04 專屬 Logo。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 7.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/04_POP UP.png` | 53 | **353** | 475 | 347 |
| `store` | `assets/門市/04_POP UP.png` | 53 | **362** | 475 | 338 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。兩張底圖寬度皆為 475，左緣貼齊卡片左緣 `x = 53`；高度不同，但**底緣一致對齊 `y = 699`**（353 + 347 = 362 + 338 = 699）。

底圖下緣 699 低於卡片底緣 684（27 + 658），即底圖中的「看更多」CTA **跨出圓角卡片下緣**，此為正式設計，**不裁切、不內縮**。

### 7.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色圓角卡片（53, 27, 475 × 658、radius 40；卡片外透明）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. 圓角卡片路徑 ＋ `fill()` — 背景色（**非** `fillRect(0, 0, 580, 720)`）
2. `drawImage(base, x, y, w, h)` — style 正式底圖
3. Logo（contain ＋ 水平置中、垂直置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 1160 × 1440 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

四個文字 box 的垂直範圍為 172–210、223–275、286–311、320–345，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

CTA（「看更多」）、人物、場景、彩券等視覺元素**已 baked into style 底圖**，renderer **不個別繪製 CTA**：descriptor 無 CTA 欄位、無 CTA 素材、無 CTA draw step。

### 7.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 134、y = 103、width = 313、height = 48 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**高度受限**：`scale = min(313/1678, 48/272) = 48/272`，dest ≈ **296.1176 × 48**，`destX ≈ 142.4412`、`destY = 103`（垂直餘裕為 0）。

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。在 04 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 7.8 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 7.9 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 55pt | `41.25pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` **25pt** | `18.75pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` **25pt** | `18.75pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（40 → 30、55 → 41.25、25 → 18.75）。`41.25pt` 與 `18.75pt` 為非整數 pt，**原值保留**，未取整、未改用 px。

**04 的小字字重為 Medium**（與 01、03 相同，與 02 的 Regular 不同），因此 04 只註冊 Medium 與 Bold，**不載入 Regular**（第 2.11 節）。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節）。**不得 auto-wrap、不得 auto-shrink。**

### 7.10 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 134 | 172 | 313 | 38 | ink-box center | ink-box center |
| 副標 | 85 | 223 | 410 | 52 | ink-box center | ink-box center |
| 小字 1 | 85 | 286 | 410 | 25 | ink-box center | ink-box center |
| 小字 2 | 85 | 320 | 410 | 25 | ink-box center | ink-box center |

**04 的五個 box（Logo ＋ 四個文字）共用同一水平中心 290（＝畫布中心）**，因此 04 的 `horizontalAlign` 為 `center`（與 01 相同，第 2.9 節）。

可編輯文字欄位共 **4 個**。小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。

### 7.11 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5）。

### 7.12 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=04-pop-up` |
| Launcher | `開獎秀/01_線上電子BN/launch/04_POP UP.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/04_POP UP.png` |

04 與 01、02、03 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）。Viewer 自動帶入第 2.16 節的共通 sample text；正式 Console 的 initial text 仍為四個空字串。

### 7.13 Implementation files

Code Commit `5e85112` 實際涵蓋的檔案，共 8 paths（3 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/04_POP UP.png
A  開獎秀/01_線上電子BN/assets/智取櫃/04_POP UP.png
A  開獎秀/01_線上電子BN/assets/門市/04_POP UP.png
A  開獎秀/01_線上電子BN/js/layout-04-pop-up.js
M  開獎秀/01_線上電子BN/js/layout-engine.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/04_POP UP.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

三個 M 的性質：`layout-engine.js` 新增第 2.12 節的 optional `background` 能力（backward-compatible，未宣告時走與擴充前逐行相同的 legacy 分支，engine 內不含任何 04 專屬數值）；`online-bn.js` 新增 `LAYOUT_04_POP_UP` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`）；`viewer.html` 僅更新 fail-closed 訊息中的合法值列舉字串。

**`layout-01-ddcard-bn.js`、`layout-02-mall-hbn.js`、`layout-03-lpbn.js` 為 0 modification**；`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css`、`01_DDcard BN.command`、`02_Mall HBN.command`、`03_LPBN.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js` 亦皆未修改。

**不在本次 Code Commit 範圍**：05～17 的素材與四張未使用的舊 Logo 仍為 untracked，不屬於已完成範圍。

### 7.14 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 尺寸、透明畫布與圓角卡片 53,27,475×658 radius 40、背景 validation fail-closed、三張素材 intrinsic、兩組 base placement 與共同底緣 699、CTA baked（descriptor 無 CTA 欄位）、Logo contain 與水平置中、四組文字 geometry 與中心 290、三組 font string 與 ×72/96 換算、非整數 pt 保留、僅註冊 Medium＋Bold、2× offscreen 1160 × 1440 與成員、limits、四句 sample 計數、預設色、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、四個 launcher port 與 marker、`git diff --check`） |
| 01 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；canvas、兩組 base placement、Logo、30/45/18pt、2× 1062 × 1584、limits、預設色、Logo Auto、Viewer、launcher 均無 regression） |
| 02 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；canvas、兩組 base placement、左對齊、30/45/18pt 與小字 Regular、2× 2400 × 720、limits、預設色、Logo Auto、Viewer、launcher 均無 regression） |
| 03 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；canvas、兩組 base placement、左對齊 x=58、39/49.5/17.625pt、2× 2400 × 1100、limits、預設色、Logo Auto、Viewer、launcher 均無 regression） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Canvas 580 × 720、卡片外透明、圓角卡片 radius 40、smart-locker 與 store 視覺、CTA 跨出卡片下緣正確、Logo、四行文字置中、小字 25pt → 18.75pt、Logo Auto、對位 overlay、01～04 版位切換、01／02／03 視覺無 regression） |

## 8. 目前仍未決項目

以下尚未裁決，下一階段不得自行假設：

- 05～17 的全部規格：尺寸、素材、geometry、字級、字重、顏色、文字欄位、Photoshop source pt。
- online-bn 的 Excel 工單 schema 與匯入流程。
- online-bn 的 JSON／workspace 資料結構。
- online-bn 的 Export、encoder、輸出格式與檔名規則。
- 跨版位是否需要保留各自 state（目前切換版位即重設，見第 2.14 節）。
- 05～17 的 launcher 檔案（Viewer 已為共用，port 沿用 4176）。
- 05～17 素材納入版本控制的時機與範圍。
