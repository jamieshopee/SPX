# 開獎秀－線上／電子BN版位

Status: Living（持續更新，非 Locked）

## 1. 文件定位與範圍

本文件是「開獎秀 → 線上／電子BN（`online-bn`）」的**版位層**正式規格文件，集中記錄 01～17 的正式版位規格與實作狀態。

**涵蓋範圍**

- 僅涵蓋 item `online-bn`。
- 涵蓋其兩個 style：智取櫃 `smart-locker`、門市 `store`。
- 未來 01～17 的版位規格一律寫入本文件。

**不涵蓋範圍**

- 不涵蓋 OM、直播、門市清單。
- 不涵蓋開獎秀平台／共通層架構。平台層（Interface 1／Interface 2、共用控制台 shell、item／style 導覽、registry 資料模型、fail-closed 總則、UI／responsive 規格等）一律以 `開獎秀/docs/開獎秀_正式規格.md` 為準。

**治理方式**

- 本文件不重複抄寫整份平台規格。只記錄 online-bn 版位層真正需要的共通規格，以及各版位的差異。
- 本文件與 `開獎秀_正式規格.md` 衝突時，平台層以 `開獎秀_正式規格.md` 為準；版位層以本文件為準。兩者皆不得覆蓋 `docs/架構說明.md`（Architecture Contract v1.0，Status: Locked）；若與該 Locked Contract 衝突，應停止並要求 Jamie 裁決。
- **不得為個別版位再建立獨立 MD。** 01～17 全部寫入本文件。
- 只有本文件明確記載為「已裁決」或「Implemented」的內容才成立。標記為 Pending 的版位一律視為尚未裁決，下一階段不得自行假設、不得自行補完。

## 2. 線上／電子BN 共通規格

本節只記錄目前已由 01 實作正式證明、且適合 online-bn 版位共用的內容。**尚未實作的 02～17 行為不得寫入本節，也不得視為已完成。**

### 2.1 Style

`online-bn` 支援兩個 style：`smart-locker`（智取櫃）與 `store`（門市）。

兩個 style 共用**同一套正式版位 renderer 結構**，不建立兩套 renderer。style 只決定以下幾項 style-specific 資料：

- 正式底圖（base asset）
- 底圖在正式畫布上的 placement
- 四個預設色（背景色／主標色／副標色／小字色）

其餘（畫布尺寸、文字 geometry、Logo geometry、字型、Logo Auto 規則、控制項形狀）兩個 style 完全共用。

style context 沿用平台層既有的 URL query param，不新增第二套 style context：

```text
console.html?item=online-bn&style=smart-locker
console.html?item=online-bn&style=store
```

### 2.2 KV

目前 online-bn **沒有 KV upload**。無 KV 欄位、無 KV box、無 KV draw step、無 KV placeholder。

### 2.3 Logo

正式 Logo assets：

- 橘：`開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png`
- 白：`開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png`

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

### 2.5 文字輸入行為

- **IME-safe**：composition 進行中不做超限判定與 rollback；`compositionend` 後完整驗證一次。
- **超限 rollback**：非組字期間輸入若超過該欄 limit，還原為上一個合法值，不更新 state、不重繪、不截斷字串、不彈窗。
- renderer 層**不得** auto-wrap、不得 auto-shrink。長度一律由控制層的 limit 保證。

### 2.6 Typography 共通原則

**Photoshop Character panel 的 source pt 與 Browser Canvas renderer 的 pt 不是同一個值，不得混為一談。**

- Photoshop 的 pt 是物理單位，落到 raster pixel 取決於文件解析度。
- CSS／Canvas 的 pt 由規範固定為 `1pt = 96/72 px`。

online-bn 的 renderer 正式採用與「快速取件」一致的換算：

```text
Canvas pt = Photoshop pt × 72 / 96
```

01 的實際對應為 Photoshop source `40 / 60 / 24pt` → Canvas renderer `30 / 45 / 18pt`（詳見第 4 章）。

此換算目前**僅經 01 驗證**。本文件只記錄它是 online-bn renderer 已採用的換算原則；**不代表 02～17 的字級已經決定**。各版位的 Photoshop source pt 仍須由該版位實際調查後決定。

### 2.7 Medium 字重的算繪方式

主標與小字所使用的 Medium 字重，採 renderer-local 2× supersampling：`MEDIUM_RENDER_SCALE = 2`，以 2× 離屏 canvas 搭配 `scale(2, 2)`、仍以正式畫布 geometry 繪製，再以 high-quality smoothing downsample 回正式 canvas。Bold 字重不進此層，直接繪於正式 canvas。

文字定位採 ink-box centering（以 `actualBoundingBoxLeft/Right/Ascent/Descent` 量測，於正式 box 內水平與垂直置中），座標不取整。

### 2.8 Preview 與 renderer 來源

Preview 使用正式 renderer，不建立 Preview-only renderer。正式 canvas 的 pixel size 固定，viewport 僅以 CSS display size 等比縮放，不改變 canvas pixel size。

### 2.9 Viewer／launcher 的定位

每個 online-bn 正式版位各有自己的 Manual Verification Viewer 與 launcher，供 Jamie 以 Finder 雙擊後在 Google Chrome 進行 Preview／Manual Verification。

Viewer 與 launcher 是 **Manual Verification helper**，不是正式產品介面：

- Viewer 可帶有固定 sample text 與對位 overlay，兩者僅供人工驗證。
- **正式 Console 的 initial text 為空字串**；Viewer 的 sample text 不是 production default，不得寫入正式 Console、workspace 或任何 schema。
- 對位圖只作 DOM overlay，不進正式 renderer、不改 canvas pixels。

### 2.10 目前共通層未涵蓋的項目

以下尚未裁決，不得自行補完：Excel 工單匯入、JSON workspace、Export／下載、encoder 與輸出格式、跨版位共用 renderer 的抽象層、02～17 的任何規格。

## 3. 版位總表

| # | 版位名稱 | 狀態 |
|---|---|---|
| 01 | 01_DDcard BN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 02 | 02_Mall HBN | Pending（未製作） |
| 03 | 03_LPBN | Pending（未製作） |
| 04 | 04_POP UP | Pending（未製作） |
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

02～17 的名稱讀自 `開獎秀/01_線上電子BN/assets/` 下對位／智取櫃／門市三個目錄的素材檔名（三者命名一致）。這些名稱僅供定位，**尚未經正式裁決**；各版位的尺寸、geometry、字級、顏色與任何行為一律尚未調查、尚未設計。本表不構成對 02～17 的任何規格承諾。

02～17 的素材目前存在於 Repository 工作目錄但**尚未納入版本控制**，不屬於已完成範圍。

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
4. **Medium 層**：主標 ＋ 小字 1 ＋ 小字 2 於同一張 2× 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

兩者的差異只在第 4／5 步：主標、小字 1、小字 2 同屬 Medium 2× 層，因此在程式中同一步落版，副標在其後。四個文字 box 的垂直範圍為 170–207、221–278、296–318、325–347，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

CTA、人物、場景、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。

### 4.6 Logo

| 項目 | 值 |
|---|---|
| box | x = 77、y = 89、width = 377、height = 64 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | 水平置中、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。

### 4.7 預設色

| style | 背景色 | 主標 | 副標 | 小字 |
|---|---|---|---|---|
| `smart-locker` | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| `store` | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

使用者可調整的顏色共四項：背景色、主標顏色、副標顏色、小字顏色。**小字 1 與小字 2 共用同一個小字顏色**，不提供第二個小字顏色控制。

### 4.8 Typography

| 元素 | Photoshop source | Canvas renderer | local 2× |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 60pt | `45pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` 24pt | `18pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` 24pt | `18pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.6 節的 `Canvas pt = Photoshop pt × 72 / 96`。`LotteryShowNotoSans Medium`／`LotteryShowNotoSans Bold` 是 renderer 內以 FontFace API 建立的 family 別名，指向 SPX 根層正式 WOFF2（`fonts/ShopeeNotoSans(content)-Medium.woff2`、`fonts/ShopeeNotoSans(content)-Bold.woff2`）。字型未就緒即 render fail-closed，不 fallback 系統字型。

Medium 層採 `MEDIUM_RENDER_SCALE = 2` 的 local 2× supersampling，並保留現行 ink-box centering。**不得 auto-wrap、不得 auto-shrink。**

### 4.9 文字 geometry

| 元素 | x | y | width | height |
|---|---|---|---|---|
| 主標 | 90 | 170 | 351 | 37 |
| 副標 | 43 | 221 | 445 | 57 |
| 小字 1 | 43 | 296 | 445 | 22 |
| 小字 2 | 43 | 325 | 445 | 22 |

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。

### 4.10 文字上限

| 元素 | limit |
|---|---|
| 主標 | 8 |
| 副標 | 7 |
| 小字 1 | 18 |
| 小字 2 | 18 |

計算規則依第 2.4 節（中文漢字 1；英文／數字／符號 0.5）。

### 4.11 Manual Verification Viewer

| 項目 | 路徑 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html` |
| Launcher | `開獎秀/01_線上電子BN/launch/01_DDcard BN.command` |

Viewer 提供智取櫃／門市切換與對位圖 overlay（顯示／隱藏、透明度），並自動帶入固定 sample text：

| 欄位 | sample text | weighted count / limit |
|---|---|---|
| 主標 | `12/12直播開獎` | 6.5 / 8 |
| 副標 | `取件最高抽百萬` | 7 / 7 |
| 小字 1 | `10/10-12/30下單，在到貨一天內取件限定` | 18 / 18 |
| 小字 2 | `百萬獎金均分，詳情依活動規則為準` | 15.5 / 18 |

**這四句只是 Manual Verification Viewer 的 sample text。** 正式 Console 的 `createInitialState().text` 仍為四個空字串（`title`、`subtitle`、`small1`、`small2` 皆為 `""`），Viewer sample 不是 production default。sample text 經 Viewer 以既有 controls 的 input 事件寫入，完整走正式 weighted count 與 rollback 流程，不 bypass 任何 validation。

### 4.12 Implementation files

Code Commit `3c022a9` 實際涵蓋的檔案：

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

共 15 paths（13 A ＋ 2 M）。

**Shared console integration**：`console.html` 只新增三個掛載點 id；`console.js` 只在 `item.id === "online-bn"` 時動態 import online-bn 版位模組。OM 與直播走不到該 import，不載入 online-bn 的 JS 與 CSS，三欄維持既有 empty state。`開獎秀/js/registry.js` 與 `開獎秀/css/console.css` 未修改。online-bn 專屬 CSS 由版位模組於 mount 時動態載入一次，`console.html` 不靜態引用。

**不在本次 Code Commit 範圍**：02～17 的素材與四張未使用的舊 Logo 仍為 untracked，不屬於已完成範圍。

### 4.13 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | PASS（Code Commit 前完成：語法檢查、renderer 常數與 geometry 斷言、Logo Auto 與 threshold、weighted count 與四句 sample 驗算、素材 intrinsic size、context isolation、既有 console／Interface／門市清單回歸） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Viewer 四欄自動帶入、小字 1 完整保留且 18/18 不被 rollback、Preview 正常、Typography 修正後正確、智取櫃 PASS、門市 PASS） |

## 5. 目前仍未決項目

以下尚未裁決，下一階段不得自行假設：

- 02～17 的全部規格：尺寸、素材、geometry、字級、顏色、文字欄位與上限、Photoshop source pt。
- online-bn 的 Excel 工單 schema 與匯入流程。
- online-bn 的 JSON／workspace 資料結構。
- online-bn 的 Export、encoder、輸出格式與檔名規則。
- 跨版位 renderer／geometry 是否共用、如何共用。
- 02～17 的 Viewer／launcher 與其 port 配置。
- 02～17 素材納入版本控制的時機與範圍。
