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

本節記錄目前已由 01～15 實作正式證明、適合 online-bn 版位共用的內容，以及明確標示實作邊界的 Jamie 共通裁決。**16～17 仍為 Pending；共通裁決不代表其已實作。**

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

**第二 Logo（optional，06 導入）**

部分版位在主 Logo 之外另有一個固定 Logo（目前只有 06 的左下「直式蝦皮購物」）。它**不是獨立控制項**：

- 由 descriptor 的 optional `secondaryLogo` 宣告，contract 只有 `box`、`intrinsic`、`src.orange`／`src.white` 三項（第 2.12 節）。
- fit 與水平對齊完全沿用上述共通 contain 與該 layout 的 `horizontalAlign`。
- **variant 與主 Logo 共用同一次解算結果**：`resolveLogoVariant()` 每次 render 只呼叫一次，主 Logo 與第二 Logo 以同一個 variant 取用各自的橘／白素材。因此 `Auto`／`White`／`Orange` 三種模式下兩個 Logo **一律同步**。
- **不存在**第二組 Logo 控制項、第二個 `logoMode`、第二份 state、第二套 luminance 判定、第二個 threshold、第二次 Auto 解算。

未宣告 `secondaryLogo` 的版位（01～05）不載入、不繪製任何第二 Logo，行為與擴充前完全相同。

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

此為 online-bn **全版位共通**的正式上限，不是單一版位值。計算規則依第 2.4 節。目前 01、02、03、04、05、06、07 皆採用此組上限；08 與 09 只有副標一個文字欄位，其副標上限同樣為 7（第 11.10、12.10 節）。

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
| 05_IG | 70 / 88 / 40pt | **52.5 / 66 / 30pt** |
| 06_FB Post | 52 / 65 / 28pt | **39 / 48.75 / 21pt** |
| 07_OM與FEED | 70 / 88 / 35pt | **52.5 / 66 / 26.25pt** |
| 08_SKBN_APP左右 | —／39／—pt（只有副標） | **—／29.25／—pt** |
| 09_SKBN_APP中 | —／46／—pt（只有副標） | **—／34.5／—pt** |
| 10_SKBN_PC | —／28.5／—pt（只有副標） | **—／21.375／—pt** |
| 11_遊戲大廳 MSBN | 40 / 60 / 23pt | **30 / 45 / 17.25pt** |
| 12_TVBN_一般門市 | 83 / 97 / 38pt | **62.25 / 72.75 / 28.5pt** |
| 13_TVBN_智取店 | 89 / 122 / 53pt | **66.75 / 91.5 / 39.75pt** |
| 14_繳費機直式BN-立保 | 89 / 122 / 53pt | **66.75 / 91.5 / 39.75pt** |

換算結果為非整數時（如 03 的 `49.5pt`、`17.625pt`，04 的 `41.25pt`、`18.75pt`，05 的 `52.5pt`，06 的 `48.75pt`，07 的 `52.5pt`、`26.25pt`）一律**原值保留**，不得取整、不得改用 px。

此換算為 online-bn renderer 已採用的換算原則；**不代表 16～17 的字級已經決定**。各版位的 Photoshop source pt 與字重仍須由該版位實際調查後決定（01、03～07、11～15 的小字為 Medium、02 為 Regular，見第 2.11 節；08～10 沒有主標與小字，只有副標 Bold）。

### 2.9 水平對齊（layout-specific）

水平對齊**不是全域行為**，由各 layout descriptor 的 `horizontalAlign` 決定；垂直對齊則全版位一律為 ink-box center。

| 版位 | 對位 box 特徵 | `horizontalAlign` | Logo | 文字 |
|---|---|---|---|---|
| 01_DDcard BN | 五個 box 共用水平中心 265.5 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 02_Mall HBN | 五個 box 共用左緣 x=98 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 03_LPBN | 五個 box 共用左緣 x=58 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 04_POP UP | 五個 box 共用水平中心 290 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 05_IG | 五個 box 共用水平中心 450 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 06_FB Post | 五個 box 共用左緣 x=51 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 07_OM與FEED | 五個 box 共用水平中心 500 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 08_SKBN_APP左右 | **兩個** box 共用水平中心 179 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 09_SKBN_APP中 | **兩個** box 共用水平中心 242 | `center` | contain 後水平置中 | ink-box 水平置中 |
| 10_SKBN_PC | **兩個** box 共用左緣 x=17（水平中心 90／119 不同） | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 11_遊戲大廳 MSBN | 五個 box 共用左緣 x=135（水平中心 337／343 不同） | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 12_TVBN_一般門市 | 主 Logo 與四個文字 box 共用左緣 x=59 | `left` | contain 後左緣貼 box.x | ink 左緣對齊 box.x |
| 13_TVBN_智取店 | Logo／title／subtitle 中心 540；small1／small2 中心 **540.5** | `center` | contain 後水平置中 | 各自 box 的 ink 水平置中 |
| 14_繳費機直式BN-立保 | Logo／title／subtitle 中心 540；small1／small2 中心 **540.5** | `center` | contain 後水平置中 | 各自 box 的 ink 水平置中 |
| 15_繳費機直式BN-博辰 | Logo／文字共同中心 1350；secondaryLogo 另有右上固定 box | `center` | contain 後水平置中 | 各自 box 的 ink 水平置中 |

`left` 的實作語意為 **`inkLeft = -actualBoundingBoxLeft`、`x = box.x - inkLeft`**，使文字的**實際 ink 左緣精確對齊 `box.x`**；**不是單純設定 `textAlign = "left"` 後以 `box.x` 繪製**。Logo 的 `left` 則為 `destX = box.x`。

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
| 05_IG | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 1800 × 3200 |
| 06_FB Post | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2400 × 1260 |
| 07_OM與FEED | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2000 × 2000 |
| 08_SKBN_APP左右 | **（空）** | 副標（Bold） | **不建立** |
| 09_SKBN_APP中 | **（空）** | 副標（Bold） | **不建立** |
| 10_SKBN_PC | **（空）** | 副標（Bold） | **不建立** |
| 11_遊戲大廳 MSBN | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2400 × 760 |
| 12_TVBN_一般門市 | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 3198 × 2160 |
| 13_TVBN_智取店 | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2160 × 3840 |
| 14_繳費機直式BN-立保 | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 2160 × 3840 |
| 15_繳費機直式BN-博辰 | 主標（Medium）＋小字 1（Medium）＋小字 2（Medium） | 副標（Bold） | 5400 × 6760 |

前七者使用同一段共用程式；字重差異不影響 2× 機制。08 與 09 沒有 Medium 欄位，`supersampledFields` 為空陣列，engine 的 2× 層直接 early-return，**不建立 offscreen canvas**。

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
| 05_IG | Medium、Bold（**不載 Regular**） |
| 06_FB Post | Medium、Bold（**不載 Regular**） |
| 07_OM與FEED | Medium、Bold（**不載 Regular**） |
| 08_SKBN_APP左右 | **只有 Bold**（不載 Medium、不載 Regular） |
| 09_SKBN_APP中 | **只有 Bold**（不載 Medium、不載 Regular） |
| 10_SKBN_PC | **只有 Bold**（不載 Medium、不載 Regular） |
| 11_遊戲大廳 MSBN | Medium、Bold（**不載 Regular**） |
| 12_TVBN_一般門市 | Medium、Bold（**不載 Regular**） |
| 13_TVBN_智取店 | Medium、Bold（**不載 Regular**） |
| 14_繳費機直式BN-立保 | Medium、Bold（**不載 Regular**） |
| 15_繳費機直式BN-博辰 | Medium、Bold（**不載 Regular**） |

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
- optional QR 的 descriptor opt-in、geometry validation、local encoder 與 generated-image readiness（12 導入，見下）
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
| 05_IG | `開獎秀/01_線上電子BN/js/layout-05-ig.js` |
| 06_FB Post | `開獎秀/01_線上電子BN/js/layout-06-fb-post.js` |
| 07_OM與FEED | `開獎秀/01_線上電子BN/js/layout-07-om-feed.js` |
| 08_SKBN_APP左右 | `開獎秀/01_線上電子BN/js/layout-08-skbn-app-lr.js` |
| 09_SKBN_APP中 | `開獎秀/01_線上電子BN/js/layout-09-skbn-app-mid.js` |
| 10_SKBN_PC | `開獎秀/01_線上電子BN/js/layout-10-skbn-pc.js` |
| 11_遊戲大廳 MSBN | `開獎秀/01_線上電子BN/js/layout-11-msbn.js` |
| 12_TVBN_一般門市 | `開獎秀/01_線上電子BN/js/layout-12-tvbn-store.js` |
| 13_TVBN_智取店 | `開獎秀/01_線上電子BN/js/layout-13-tvbn-smart-store.js` |
| 14_繳費機直式BN-立保 | `開獎秀/01_線上電子BN/js/layout-14-payment-vertical.js` |
| 15_繳費機直式BN-博辰 | `開獎秀/01_線上電子BN/js/layout-15-payment-vertical-bochen.js` |

descriptor 欄位：`id`、`name`、`canvas`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc`，以及 **optional** 的 `background`、`secondaryLogo` 與 `qr`。

**背景模式（optional descriptor，04 導入）**

| `layout.background` | 行為 | 目前採用的版位 |
|---|---|---|
| 未宣告 | legacy：`fillRect(0, 0, canvas.width, canvas.height)` 填滿整張畫布 | 01、02、03、05、06、07、08、09、12、13、14 |
| `mode: "rounded-card"` | 畫布保持透明，只以背景色填 descriptor 指定的圓角卡片 | 04、10、11 |

此為 **backward-compatible 擴充**：`layout.background` 不存在時走與擴充前逐行相同的 legacy 分支，01／02／03 的 descriptor 皆未新增此欄位，背景行為與輸出完全未變（04 Regression Verification = PASS，見第 7.14 節）。05、06 與 07 亦未宣告此欄位，同樣走 legacy 分支（第 8.3、9.3、10.3 節）。

背景模式一律 **descriptor-driven**：engine **不得**依 `layout.id` hard-code 任何版位。`layout.background` 存在時執行最小 validation —— `mode` 必須為已知模式、必須有 `box`、`x`／`y`／`width`／`height`／`radius` 皆為有限數、`width` 與 `height` > 0、`0 <= radius <= min(width, height) / 2`、卡片幾何不得超出畫布範圍；任一不合法即 **fail-closed throw**，不降級、不自動修正。

**第二 Logo（optional descriptor，06 導入）**

| `layout.secondaryLogo` | 行為 | 目前採用的版位 |
|---|---|---|
| 未宣告 | 不載入、不繪製任何第二 Logo（與擴充前逐行相同） | 01～05、07～14 |
| 已宣告 | 主 Logo 之後、文字層之前，以**同一個 resolved variant** 多繪製一個 contain Logo | 06、15 |

contract 只有三個欄位：`box`、`intrinsic`、`src.orange`／`src.white`。**沒有** `mode`、`threshold`、state、controls、顏色、獨立 variant，也**不是** `logos` array 或泛用 multi-layer 框架 —— 目前只有一個 optional 第二 Logo，不為尚未裁決的情形預先抽象。

fit 一律沿用既有 `computeContainRect()` 與該 layout 的 `horizontalAlign`（垂直恆置中）；素材載入失敗或 intrinsic 不符，沿用既有 fail-closed，不另設 validator。變體同步規則見第 2.3 節。

此為 **backward-compatible 擴充**：主 Logo 既有區塊未重構，`layout.secondaryLogo` 未宣告時素材載入與繪製皆被跳過。06 的 Technical Self-Test 以 recording mock ctx 比對 engine 擴充前後 01～05 的 ctx 呼叫序列（5 版位 × 2 styles × 3 Logo 模式 = **30 組、合計 1194 筆**），結果**逐筆完全相同**（第 9.16 節）。

**目前有 01～15 十五個 descriptor。這不是 17 版位的 registry 或 plugin system，也未為 16～17 預先抽象。** 03 的加入未修改 `layout-engine.js`（0 modification）；04 僅為了上述背景能力對 engine 做最小擴充，未加入任何 04 專屬數值；05 的加入同樣未修改 `layout-engine.js`（0 modification）；06 僅為了上述第二 Logo 能力對 engine 做最小擴充，未加入任何 06 專屬數值；07 的加入未修改 `layout-engine.js`（0 modification）；08 的加入同樣未修改 `layout-engine.js`（0 modification），且證實既有 contract 可表達「單一文字欄位、空 `supersampledFields`、兩個 `colorFields`」的版位；09 的加入同樣未修改 `layout-engine.js`（0 modification），沿用 08 已證實的同一條 contract，**No new engine capability required**。10、11 亦沿用既有能力；12 導入下述 optional QR，版位數值仍只由 descriptor 提供；13、15 直接 reuse 既有能力；14 以 local Thin Derived Descriptor 共用 13 的 immutable nested contract，只覆寫版位 identity 與素材 URL，未擴充成 generic framework。13～15 的 Engine／Controls／QR Helpers Change 皆為 NO。

**QR（optional descriptor，12 導入）**

只有宣告 `qr` 的 descriptor 才啟用；contract 為 `box` 與 `defaultUrl`，目前由 12～15 使用。`createInitialState()` 只對 opt-in layout 新增 `qrUrl`，由 `qr.defaultUrl` 初始化。01～11 的 state shape 不增加 `qrUrl`，沒有 QR vendor load、encode 或 draw side effect。

共用 pipeline 順序為 background → style base → main Logo → optional secondaryLogo → optional QR → local 2× text layer → direct text。QR geometry 必須為畫布內、有限數、非零正方形；URL 空值／非法值跳過 QR，其餘 BN 正常 render；geometry、vendor、encoder 或 generated-image readiness failure 則整次 render reject，沿用 Preview fail-closed。URL utility、local vendor、readiness 與 control 的最小正式 contract 見第 15.14 節；不代表已實作工單、workspace 或 Export。

**12～17 QR default 與 future integration boundary（Jamie 正式裁決）**

12～17 的 QR default URL 目前統一為 `https://shopee.tw/m/spxlottery`。

- **已實作（12～15）**：descriptor `qr.defaultUrl` → `state.qrUrl`、QR control「縮址」與 renderer QR；16～17 尚未實作，仍為 Pending。
- **未來正式邊界**：工單「縮址」→ 對應版位 `qrUrl` → renderer QR。
- **Work-order integration：NOT IMPLEMENTED YET**。目前未實作正式工單縮址自動帶入；不得將上述邊界解讀為已可由工單帶入 QR，亦不新增工單 architecture 規格。

Logo Auto 的純邏輯維持獨立於 `開獎秀/01_線上電子BN/js/logo-auto.js`，engine 引用之，未修改。

### 2.13 Preview 與 renderer 來源

Preview 使用共用 engine 的正式 renderer，**不建立 Preview-only renderer**。`preview.js` 不綁定任何單一版位：canvas 尺寸與名稱一律取自傳入的 layout descriptor。正式 canvas 的 pixel size 固定，viewport 僅以 CSS display size 等比縮放（只縮不放），不改變 `canvas.width`／`canvas.height`。

`controls.js` 同樣不綁定單一版位：文字欄位、上限與顏色欄位一律由 descriptor 提供；weighted count、IME-safe、超限 rollback、色票驗證行為不變。

### 2.14 正式 Console 的版位選擇

正式 Console 左欄列出目前的正式版位 **01～15**（名稱見第 3 節；順序固定，新版位附加於末端），目前選中者標記 `aria-current="true"`。預設仍為 `01-ddcard-bn`。

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
viewer.html?layout=05-ig
viewer.html?layout=06-fb-post
viewer.html?layout=07-om-feed
viewer.html?layout=08-skbn-app-lr
viewer.html?layout=09-skbn-app-mid
viewer.html?layout=10-skbn-pc
viewer.html?layout=11-msbn
viewer.html?layout=12-tvbn-store
viewer.html?layout=13-tvbn-smart-store
viewer.html?layout=14-payment-vertical
viewer.html?layout=15-payment-vertical-bochen
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
| 05_IG | `launch/05_IG.command` | 100755 | `viewer.html?layout=05-ig` |
| 06_FB Post | `launch/06_FB Post.command` | 100755 | `viewer.html?layout=06-fb-post` |
| 07_OM與FEED | `launch/07_OM與FEED.command` | 100755 | `viewer.html?layout=07-om-feed` |
| 08_SKBN_APP左右 | `launch/08_SKBN_APP左右.command` | 100755 | `viewer.html?layout=08-skbn-app-lr` |
| 09_SKBN_APP中 | `launch/09_SKBN_APP中.command` | 100755 | `viewer.html?layout=09-skbn-app-mid` |
| 10_SKBN_PC | `launch/10_SKBN_PC.command` | 100755 | `viewer.html?layout=10-skbn-pc` |
| 11_遊戲大廳 MSBN | `launch/11_遊戲大廳 MSBN.command` | 100755 | `viewer.html?layout=11-msbn` |
| 12_TVBN_一般門市 | `launch/12_TVBN_一般門市.command` | 100755 | `viewer.html?layout=12-tvbn-store` |
| 13_TVBN_智取店 | `launch/13_TVBN_智取店.command` | 100755 | `viewer.html?layout=13-tvbn-smart-store` |
| 14_繳費機直式BN-立保 | `launch/14_繳費機直式BN-立保.command` | 100755 | `viewer.html?layout=14-payment-vertical` |
| 15_繳費機直式BN-博辰 | `launch/15_繳費機直式BN-博辰.command` | 100755 | `viewer.html?layout=15-payment-vertical-bochen` |

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

**套用範圍為 descriptor-driven（08 導入的 generic compatibility fix）**：`applySampleText(layout)` 依目前 `layout.textOrder` 迭代，只對該版位實際存在且上表有定義的欄位套用。01～07、11～15 的 `textOrder` 為四欄，Viewer 行為與 sample 內容**完全不變**；08、09 與 10 的 `textOrder` 只有 `subtitle`，因此只套副標。此為 Viewer 的相容性修正，**不是 renderer capability**，上表四句內容亦未更動。

**Viewer sample ≠ production default。** 正式 Console 的 `createInitialState().text` 一律為空字串（01～07、11～15 為四個欄位，08、09 與 10 只有 `subtitle`）。

### 2.17 目前共通層未涵蓋的項目

以下尚未裁決，不得自行補完：Excel 工單匯入、JSON workspace、Export／下載及其 encoder 與輸出格式，以及 16～17 除第 2.12 節共通 QR default 裁決外的版位規格。12～15 已使用的 local QR encoder 不等同 Export capability；正式工單縮址自動帶入仍為 NOT IMPLEMENTED YET。

## 3. 版位總表

| # | 版位名稱 | 狀態 |
|---|---|---|
| 01 | 01_DDcard BN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 02 | 02_Mall HBN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 03 | 03_LPBN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 04 | 04_POP UP | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 05 | 05_IG | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 06 | 06_FB Post | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 07 | 07_OM與FEED | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 08 | 08_SKBN_APP左右 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 09 | 09_SKBN_APP中 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 10 | 10_SKBN_PC | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 11 | 11_遊戲大廳 MSBN | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 12 | 12_TVBN_一般門市 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 13 | 13_TVBN_智取店 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 14 | 14_繳費機直式BN-立保 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 15 | 15_繳費機直式BN-博辰 | **Implemented / Jamie Manual Verification PASS / Code Committed** |
| 16 | 16_繳費機下方BN-立保 | Pending（未製作） |
| 17 | 17_繳費機下方BN-博辰 | Pending（未製作） |

15～17 的名稱讀自 `開獎秀/01_線上電子BN/assets/` 下對位／智取櫃／門市三個目錄的素材檔名。15 已完成正式調查、規格、實作、Technical Self-Test、Jamie Manual Verification 與 Code Commit；16～17 名稱僅供定位，**尚未經正式裁決**，各版位的尺寸、geometry、字級、顏色等版位規格尚未調查、尚未設計。除第 2.12 節已記錄的共通 QR default URL 裁決外，本表不構成對 16～17 的版位規格承諾。

16～17 的素材目前存在於 Repository 工作目錄但**尚未納入版本控制**，不屬於已完成範圍。01～15 已 Implemented／Manual Verification PASS；下一個待製作版位為 **16**。

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

## 8. 05_IG

### 8.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `c9dd144d48e139add7f0d33513cd5dd92eeeb98d` |
| Code Commit（short） | `c9dd144` |
| Commit message | `feat(lottery-show): add online BN IG layout` |
| Parent | `5e94196809494b51166ee5776b3ce80b1473a5bc` |
| Docs Commit | Pending |

layout id：`05-ig`。

### 8.2 Canvas

正式畫布 **900 × 1600**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 8.3 背景

**05 不宣告 descriptor 的 `background` 欄位**，因此走第 2.12 節的 legacy 分支：`fillRect(0, 0, 900, 1600)` 填滿整張畫布，填色來源為 `state.colors.background`（即第 2.6 節的背景色控制項）。

05 **不使用** 04 的 `rounded-card` 模式；畫布無透明區、無圓角卡片。底圖未覆蓋的區域（畫布上緣至 y = 119，以及底圖本身的透明區）一律由背景色呈現。

### 8.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/05_IG.png` | 900 × 1600 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/05_IG.png` | **900 × 1481** |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/05_IG.png` | **900 × 1481** |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |

Logo 沿用 online-bn 全版位共用素材（第 2.3 節），未新增 05 專屬 Logo。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 8.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/05_IG.png` | 0 | **119** | 900 | 1481 |
| `store` | `assets/門市/05_IG.png` | 0 | **119** | 900 | 1481 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。兩張底圖寬度皆為 900（滿版寬，左緣貼齊畫布左緣 x = 0），高度皆為 1481，**底緣貼齊畫布底緣**（119 + 1481 = 1600）。畫布上方 119px 由背景色呈現。

兩個 style 的 placement 完全相同，差異只在底圖本身與預設色。

### 8.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 900 × 1600）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 900, 1600)` — 背景色
2. `drawImage(base, 0, 119, 900, 1481)` — style 正式底圖
3. Logo（contain ＋ 水平置中、垂直置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 1800 × 3200 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

四個文字 box 的垂直範圍為 486–551、569–654、668–706、716–754，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

右上「蝦皮購物」徽章、人物、場景、置物櫃、彩帶、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。**05 沒有 CTA。**

### 8.7 右上「蝦皮購物」徽章

| 項目 | 值 |
|---|---|
| 完整素材（含陰影）在畫布上的 geometry | **x = 739、y = 119、width = 161、height = 162** |
| 對位圖所標示的 box | x = 753、y = 128、width = 147、height = 134 |

**兩組數值不是同一個 geometry，不得混用**：對位圖的 `147 × 134` 是白卡／陰影內緣的對位參考，`161 × 162` 才是包含陰影的完整 baked 素材界線（兩者差值即陰影外擴量 x +14、y +9）。

責任歸屬：**smart-locker 由智取櫃底圖 baked、store 由門市底圖 baked**（兩張底圖在該區的美術逐像素 98.93% 相同）。因此 **renderer 不繪製徽章、descriptor 無徽章欄位、無徽章素材、無徽章 draw step**，`layout-engine.js` 為 0 modification。

### 8.8 Logo

| 項目 | 值 |
|---|---|
| box | x = 218、y = 383、width = 464、height = 74 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**高度受限**：`scale = min(464/1678, 74/272) = 74/272`，dest ≈ **456.5147 × 74**，`destX ≈ 221.7426`、`destY = 383`（垂直餘裕為 0）。

Photoshop 設計稿中的 Logo ink 寬約 464px，與 renderer 依共通 contain 規則得到的 **456.5147px** 有約 **7.4853px** 的水平差距。正式 renderer destination 一律為 **456.5147 × 74**；464 僅為 Photoshop 參考值，**不得寫成 renderer destination**。此差距已由 Jamie 於 Manual Verification 確認接受。

Logo 橘／白兩個 variant 的 geometry 一致，共用完全相同的 placement。模式與 Auto 判定依第 2.3 節。在 05 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 8.9 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 8.10 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 70pt | `52.5pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 88pt | `66pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` 40pt | `30pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（70 → 52.5、88 → 66、40 → 30）。`52.5pt` 為非整數 pt，**原值保留**，未取整為 52 或 53、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

**05 的小字字重為 Medium**（與 01、03、04 相同，與 02 的 Regular 不同），因此 05 只註冊 Medium 與 Bold，**不載入 Regular**（第 2.11 節）。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節）。**不得 auto-wrap、不得 auto-shrink。**

### 8.11 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 120 | 486 | 660 | 65 | ink-box center | ink-box center |
| 副標 | 120 | 569 | 660 | 85 | ink-box center | ink-box center |
| 小字 1 | 120 | 668 | 660 | 38 | ink-box center | ink-box center |
| 小字 2 | 120 | 716 | 660 | 38 | ink-box center | ink-box center |

**05 的五個 box（Logo ＋ 四個文字）共用同一水平中心 450（＝畫布中心）**，因此 05 的 `horizontalAlign` 為 `center`（與 01、04 相同，第 2.9 節）。

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行。四欄皆為單行，不 multiline。

### 8.12 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial text 為四個空字串。

### 8.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=05-ig` |
| Launcher | `開獎秀/01_線上電子BN/launch/05_IG.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/05_IG.png` |

05 與 01～04 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `05-ig`。Viewer 自動帶入第 2.16 節的共通 sample text；正式 Console 的 initial text 仍為四個空字串。

### 8.14 Implementation files

Code Commit `c9dd144` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/05_IG.png
A  開獎秀/01_線上電子BN/assets/智取櫃/05_IG.png
A  開獎秀/01_線上電子BN/assets/門市/05_IG.png
A  開獎秀/01_線上電子BN/js/layout-05-ig.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/05_IG.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_05_IG` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 僅更新 fail-closed 訊息中的合法值列舉字串。

**05 完全使用現有 descriptor contract，No new engine capability required。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`、`layout-02-mall-hbn.js`、`layout-03-lpbn.js`、`layout-04-pop-up.js`、`01_DDcard BN.command`、`02_Mall HBN.command`、`03_LPBN.command`、`04_POP UP.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/` 亦皆未修改。05 未新增 `backgroundIntrinsic` 欄位：`backgroundPlacement` 的 width／height 仍兼任底圖 intrinsic 的 fail-closed 期望值。

**不在本次 Code Commit 範圍**：06～17 的素材與四張未使用的舊 Logo 仍為 untracked，不屬於已完成範圍。

### 8.15 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 900 × 1600、三張素材 intrinsic 與 SHA-256、兩組 base placement `0,119,900×1481`、1:1／不 crop／不 stretch／底緣 1600、徽章 baked 於兩張底圖 `739,119,161×162` 且 Logo 與文字帶完全透明、descriptor 無徽章與 CTA 欄位、無 top-level `background` 故走 legacy `fillRect(0,0,900,1600)`、Logo box 與 contain `456.5147 × 74 @ (221.7426, 383)`、Logo Auto 與 threshold、四組文字 geometry 與中心 450、三組 font string 與 ×72/96 換算、`52.5pt` 原值保留、僅註冊 Medium＋Bold、2× offscreen 1800 × 3200 與成員、limits、版位清單與切換、Viewer layout context 與未知值 fail-closed、五個 launcher port 與 marker、`git diff --check`） |
| 01 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；geometry、typography、字型、顏色、Logo Auto、Viewer、launcher 均無 regression） |
| 02 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；含小字 Regular 與左對齊行為均無 regression） |
| 03 Regression Verification | **PASS**（descriptor 0 modification、無 `background` property、仍走 legacy full-canvas fill；左對齊 x=58 與非整數 pt 均無 regression） |
| 04 Regression Verification | **PASS**（descriptor 0 modification、**仍走 `rounded-card` 背景分支**、radius 40 與兩組 base placement 均無 regression） |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Canvas 900 × 1600、smart-locker 與 store 背景色、兩組底圖落位與底緣貼齊、右上徽章、Logo Auto、**Logo contain 約 7.4853px 水平差距確認接受**、主標／副標／小字 1／小字 2 字級與置中、對位 overlay、01～05 版位切換、01／02／03／04 視覺無 regression） |

三張 05 PNG 於 Code Commit 前後 SHA-256 不變：對位 `61d6437b3c721987cb1084f69bd4e4e7f2331b2b2b2e85d11664f6022347a553`、智取櫃 `f0118c68e8fdd20bc60a1ffdfc20f11997fc2cd41a94f2f5c4c0b0ceb97b70ae`、門市 `b31142e821f5c365988ca494d0ec67dcd36acb887f13dfe83c9788c20b8b0742`。

## 9. 06_FB Post

### 9.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `4e972fdf54f8015d8453e7d25179663971cfe8af` |
| Code Commit（short） | `4e972fd` |
| Commit message | `feat(lottery-show): add online BN FB Post layout` |
| Parent | `30709cb0578638aad6429a6c20170a70072387b5` |
| Docs Commit | Pending |

layout id：`06-fb-post`。

### 9.2 Canvas

正式畫布 **1200 × 630**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 9.3 背景

**06 不宣告 descriptor 的 `background` 欄位**，因此走第 2.12 節的 legacy 分支：`fillRect(0, 0, 1200, 630)` 填滿整張畫布，填色來源為 `state.colors.background`（即第 2.6 節的背景色控制項）。

06 **不使用** 04 的 `rounded-card` 模式；畫布無透明區、無圓角卡片。智取櫃底圖左半為透明、門市底圖只佔畫布右側，未覆蓋處一律由背景色呈現。

### 9.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 |
|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/06_FB Post.png` | 1200 × 630 |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/06_FB Post.png` | 1200 × 630 |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/06_FB Post.png` | **654 × 630** |
| 主 Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 |
| 主 Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 |
| 第二 Logo 橘 | `開獎秀/01_線上電子BN/assets/直式蝦皮購物_橘.png` | **83 × 112** |
| 第二 Logo 白 | `開獎秀/01_線上電子BN/assets/直式蝦皮購物_白.png` | **83 × 112** |

主 Logo 沿用 online-bn 全版位共用素材（第 2.3 節）。兩張直式蝦皮購物素材由兩個 style 共用，隨 06 Code Commit 首次納入版本控制。`assets/蝦皮購物_橘.png`／`_白.png`（橫式 1119 × 275）**06 不使用**。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 9.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/06_FB Post.png` | 0 | 0 | 1200 | 630 |
| `store` | `assets/門市/06_FB Post.png` | **546** | 0 | 654 | 630 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**。smart-locker 底圖滿版覆蓋整張畫布（其左半為透明，由背景色呈現）；store 底圖寬 654，**右對齊**貼齊畫布右緣（546 + 654 = 1200），畫布左側 546px 由背景色與文字區呈現。

### 9.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 1200 × 630）
2. style 正式底圖
3. 主 Logo（蝦皮大樂透）
4. 第二 Logo（左下直式蝦皮購物）
5. 主標
6. 副標
7. 小字 1
8. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 1200, 630)` — 背景色
2. `drawImage(base, x, y, w, h)` — style 正式底圖
3. 主 Logo（contain ＋ 左對齊、垂直置中）
4. **第二 Logo**（contain ＋ 左對齊、垂直置中）
5. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 2400 × 1260 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
6. 副標（Bold，直接繪於正式 canvas）

兩個 Logo 皆在文字層之前完成，且兩個 Logo box 互不重疊。四個文字 box 的垂直範圍為 261–310、323–385、396–424、431–459，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

人物、場景、置物櫃、店面、彩帶、彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。**06 沒有 CTA、沒有 badge。**

### 9.7 主 Logo

| 項目 | 值 |
|---|---|
| box | x = 51、y = 170、width = 452、height = 75 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平左對齊（destX = 51）**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(452/1678, 75/272) = 452/1678`，dest ≈ **452 × 73.2682**，`destX = 51`、`destY ≈ 170.8659`。

**box 的 `452 × 75` 是對位框，不是 renderer destination**；正式 destination 為 `452 × 73.2682`。

Logo 橘／白兩個 variant 的 geometry 一致。模式與 Auto 判定依第 2.3 節。在 06 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 9.8 第二 Logo（左下直式蝦皮購物）

06 是 online-bn **第一個需要第二個 Logo 的版位**，以第 2.12 節的 optional `secondaryLogo` 表達。它是 **renderer-owned 的 optional Logo**，不是 baked 素材、不是 badge、不是 CTA。

| 項目 | 值 |
|---|---|
| box | x = 28、y = 502、width = 82、height = 112 |
| intrinsic | **83 × 112** |
| 素材 | `assets/直式蝦皮購物_橘.png`／`_白.png`（兩 style 共用同一組） |
| fit | contain |
| 對齊 | 沿用 `layout.horizontalAlign = "left"`（destX = 28）、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 83 × 112 代入為**寬度受限**：`scale = min(82/83, 112/112) = 82/83`，dest ≈ **82 × 110.6506**，`destX = 28`、`destY ≈ 502.6747`。

Photoshop 設計稿中此 Logo 的 ink 高度為 112，與 renderer 依共通 contain 規則得到的 **110.6506** 有約 **1.35px** 的垂直差距。正式 renderer destination 一律為 `82 × 110.6506`；此差距已由 Jamie 於 Manual Verification 確認接受。

descriptor 的 `secondaryLogo` 只含 `box`、`intrinsic`、`src` 三項，**沒有** `mode`、threshold、state、controls、顏色或獨立 variant。

### 9.9 兩個 Logo 的 variant 同步

每次 render **只呼叫一次** `resolveLogoVariant(state.logoMode, state.colors.background)`，主 Logo 與第二 Logo 以**同一個** variant 取用各自的橘／白素材（第 2.3 節）：

| Logo 模式 | 背景 | resolved variant | 主 Logo | 第二 Logo |
|---|---|---|---|---|
| `Auto` | `#2660ad`（L = 0.117949） | `white` | 蝦皮大樂透_白 | 直式蝦皮購物_白 |
| `Auto` | `#ffda46`（L = 0.718450） | `orange` | 蝦皮大樂透_橘 | 直式蝦皮購物_橘 |
| `White` | 任意 | `white` | 白 | 白 |
| `Orange` | 任意 | `orange` | 橘 | 橘 |

**兩個 Logo 一律同步，不存在第二組控制項、第二個 `logoMode`、第二份 state、第二套 luminance 或第二個 threshold。** threshold 仍為第 2.3 節的 0.498708，`logo-auto.js` 未修改。

### 9.10 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 9.11 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 52pt | `39pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 65pt | `48.75pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` **28pt** | `21pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` **28pt** | `21pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（52 → 39、65 → 48.75、28 → 21）。`48.75pt` 為非整數 pt，**原值保留**，未取整、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

**06 的小字字重為 Medium**（與 01、03、04、05 相同，與 02 的 Regular 不同），因此 06 只註冊 Medium 與 Bold，**不載入 Regular**（第 2.11 節）。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節）。**不得 auto-wrap、不得 auto-shrink。**

### 9.12 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 51 | 261 | 405 | 49 | left ink | ink-box center |
| 副標 | 51 | 323 | 475 | 62 | left ink | ink-box center |
| 小字 1 | 51 | 396 | 475 | 28 | left ink | ink-box center |
| 小字 2 | 51 | 431 | 475 | 28 | left ink | ink-box center |

**06 的五個元素（主 Logo ＋ 四個文字）共用同一個水平 anchor `x = 51`。** 對位圖的這五個 box 共用左緣 51、水平中心各異（277.0／253.5／288.5），因此 06 的 `horizontalAlign` 為 `left`（第 2.9 節）。第二 Logo 的 box 左緣為 28，屬獨立元素，不在此對齊群組內。

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行；四欄皆為單行，不 multiline。

### 9.13 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial text 為四個空字串。

### 9.14 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=06-fb-post` |
| Launcher | `開獎秀/01_線上電子BN/launch/06_FB Post.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/06_FB Post.png` |

06 與 01～05 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `06-fb-post`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 06 專屬分支。Viewer 自動帶入第 2.16 節的共通 sample text；正式 Console 的 initial text 仍為四個空字串。

### 9.15 Implementation files

Code Commit `4e972fd` 實際涵蓋的檔案，共 10 paths（3 M ＋ 7 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/06_FB Post.png
A  開獎秀/01_線上電子BN/assets/智取櫃/06_FB Post.png
A  開獎秀/01_線上電子BN/assets/門市/06_FB Post.png
A  開獎秀/01_線上電子BN/assets/直式蝦皮購物_橘.png
A  開獎秀/01_線上電子BN/assets/直式蝦皮購物_白.png
A  開獎秀/01_線上電子BN/js/layout-06-fb-post.js
A  開獎秀/01_線上電子BN/launch/06_FB Post.command
M  開獎秀/01_線上電子BN/js/layout-engine.js
M  開獎秀/01_線上電子BN/js/online-bn.js
M  開獎秀/01_線上電子BN/launch/viewer.html
```

三個 M 的性質：

- **`layout-engine.js`** 新增第 2.12 節的 optional `secondaryLogo` 能力，實作邊界只有兩處 —— `Promise.all` 增加一個條件式素材載入（未宣告時為 `null`，不呼叫 `loadImage`），以及主 Logo 之後一段 guarded 的 contain 繪製，沿用既有 `computeContainRect()` 與**同一個 resolved variant**。**主 Logo 既有區塊未重構**，未加入 `logos` array、未加入泛用 multi-logo framework、未新增第二組 control／state／threshold，engine 內不含任何 06 專屬數值。
- **`online-bn.js`** 新增 `LAYOUT_06_FB_POST` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解。
- **`viewer.html`** 僅更新 fail-closed 訊息中的合法值列舉字串。

**0 modification**：`layout-01-ddcard-bn.js`、`layout-02-mall-hbn.js`、`layout-03-lpbn.js`、`layout-04-pop-up.js`、`layout-05-ig.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css`、`01_DDcard BN.command`、`02_Mall HBN.command`、`03_LPBN.command`、`04_POP UP.command`、`05_IG.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`04_門市清單/`。

**不在本次 Code Commit 範圍**：07～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 9.16 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 1200 × 630、五張素材 intrinsic 與 SHA-256、兩組 base placement `0,0,1200×630` 與 `546,0,654×630`、1:1／不 crop／不 stretch、無 top-level `background` 故走 legacy `fillRect(0,0,1200,630)`、主 Logo box 與 contain `452 × 73.2682 @ (51, 170.8659)`、`secondaryLogo` box／intrinsic 與 contain `82 × 110.6506 @ (28, 502.6747)`、單一 resolved variant 同時驅動兩個 Logo、Auto／White／Orange 六種組合皆同步、無第二組 control／state／luminance／threshold、四組文字 geometry 與共用左緣 51、三組 font string 與 ×72/96 換算、僅註冊 Medium＋Bold、2× offscreen 2400 × 1260 與成員、limits、版位清單與切換、Viewer layout context 與未知值 fail-closed、六個 launcher port 與 marker、`git diff --check`） |
| 01～05 Regression Verification | **PASS**（五份 descriptor 與五個 launcher blob 0 modification；皆未宣告 `secondaryLogo`，不載入也不繪製第二 Logo；背景分支 01／02／03／05 legacy、04 rounded-card 均未變） |
| Engine backward compatibility | **PASS** —— 以 recording mock ctx 比對 `layout-engine.js` 擴充前後，01～05 × 2 styles × 3 Logo 模式共 **30 組、合計 1194 筆 ctx 呼叫**，結果**逐筆完全相同**（無額外載入、無額外 `drawImage`／`save`／`restore`／`imageSmoothing` 設定）。此為程式化序列比對，**不等同**瀏覽器視覺自動化測試。 |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Canvas 1200 × 630、smart-locker 與 store 背景色、兩組底圖落位（滿版／右對齊）、主 Logo、左下直式蝦皮購物 Logo、**Auto／White／Orange 三種模式下兩個 Logo 同步**、**第二 Logo contain 約 1.35px 垂直差距確認接受**、主標／副標／小字 1／小字 2 字級與左對齊、對位 overlay、01～06 版位切換、01～05 視覺無 regression） |

小字字級於 Manual Verification 階段由 Jamie 正式調整為 Photoshop 28pt → Canvas 21pt，調整後 Technical Recheck 與 Manual Verification 皆 PASS；第 9.11 節為現行唯一正式值。

五張 06 相關素材於 Code Commit 前後 SHA-256 不變：對位 `e253396810c6ef9886846f10f87b877ded3b89d7ba7e24b9e1b9f09af87f69e1`、智取櫃 `51c67e17e0ba43205ff0bca773e17c4f173fbc78c4d0268c2147ba9be9d2eec4`、門市 `60f448c36369058a8728a97e9f63cc49a40662001f8194f7752523fd8a060021`、直式蝦皮購物_橘 `576d215a3aef3eda3a43cfe3b9e6b2f939b77d4c7e55c051f9d38cd48efd18a3`、直式蝦皮購物_白 `fe0e2f12475d8d33f8726b41ffa4ab21ac524a4a1ce7d2664023ac1d956ea4f9`。

## 10. 07_OM與FEED

### 10.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| 06 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `dfc2ab390fe89699116791a13a6a65552af7086f` |
| Code Commit（short） | `dfc2ab3` |
| Commit message | `feat(lottery-show): add online BN OM and FEED layout` |
| Parent | `6c80d3b9ea9b1fc31ba91608388ccb644519b988` |
| Docs Commit | Pending |

layout id：`07-om-feed`。

### 10.2 Canvas

正式畫布 **1000 × 1000**（online-bn 第一個正方形版位）。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 10.3 背景

**07 不宣告 descriptor 的 `background` 欄位**，因此走第 2.12 節的 legacy 分支：`fillRect(0, 0, 1000, 1000)` 填滿整張畫布，填色來源為 `state.colors.background`（即第 2.6 節的背景色控制項）。

07 **不使用** 04 的 `rounded-card` 模式；畫布無透明區、無圓角卡片。兩張底圖都只覆蓋畫布下半（smart 之上尚有 499px、store 之上尚有 501px），未覆蓋處與底圖自身的透明處一律由背景色呈現。

### 10.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/07_OM與FEED.png` | 1000 × 1000 | `f2018b438c8e3c2fb26328f2f43fdfe398803635cb355d516de9676601a24717` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/07_OM與FEED.png` | **1000 × 501** | `4d25e17bcf3648a784975fbe08ddc9e4212bf1ba0d759393ead748d03320924a` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/07_OM與FEED.png` | **1000 × 499** | `65a1756ad372766e91232d1f6406432950523b652637fa203b146de4364d8ca9` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

Logo 沿用 online-bn 全版位共用素材（第 2.3 節），未新增 07 專屬 Logo。**兩張底圖高度不同（501 / 499）。**

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 10.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/07_OM與FEED.png` | 0 | **499** | 1000 | 501 |
| `store` | `assets/門市/07_OM與FEED.png` | 0 | **501** | 1000 | 499 |

兩者皆以原尺寸 1:1 繪製，**不 stretch、不 crop**，滿版寬（x = 0、width = 1000）、**底緣貼齊畫布底緣**（499 + 501 = 1000；501 + 499 = 1000）。

**兩個 style 的 y 不同：smart-locker 為 499、store 為 501**（因底圖高度相差 2px），不得寫成同一值。

### 10.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 1000 × 1000）
2. style 正式底圖
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 1000, 1000)` — 背景色
2. `drawImage(base, 0, y, 1000, h)` — style 正式底圖
3. Logo（contain ＋ 水平置中、垂直置中）
4. **2× 層**：主標 ＋ 小字 1 ＋ 小字 2 於 2000 × 2000 離屏 canvas 繪製後，以單次 `drawImage` 合批貼回
5. 副標（Bold，直接繪於正式 canvas）

四個文字 box 的垂直範圍為 221–286、304–388、403–437、446–480，**兩兩不重疊**，因此合批與語意順序的算繪結果等價。

人物、置物櫃、店面、彩帶、$1,000,000 彩券等視覺元素**已 baked into style 底圖**，renderer 不個別繪製。

### 10.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 249、y = 119、width = 502、height = 81 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**高度受限**：`scale = min(502/1678, 81/272) = 81/272`，dest ≈ **499.6985 × 81**，`destX ≈ 250.1507`、`destY = 119`（垂直餘裕為 0）。

**box 的 `502 × 81` 是對位框，不是 renderer destination**；正式 destination 為 `499.6985 × 81`，水平留白共約 2.3015px。descriptor 只宣告 `box`、`intrinsic`、`src`，destination 由共用的 `computeContainRect()` 推導，未硬編。

Logo 橘／白兩個 variant 的 geometry 一致。模式與 Auto 判定依第 2.3 節。在 07 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 10.8 預設色

依第 2.6 節的 online-bn 全版位共通預設色：smart-locker `#2660ad`／`#fffac8`／`#fff000`／`#fffac8`；store `#ffda46`／`#472704`／`#eb1717`／`#472704`。

### 10.9 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` 70pt | `52.5pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` 88pt | `66pt "LotteryShowNotoSans Bold"` | 否 |
| 小字 1 | `ShopeeNotoSans(content)-Medium` 35pt | `26.25pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` 35pt | `26.25pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（70 → 52.5、88 → 66、35 → 26.25）。`52.5pt` 與 `26.25pt` 為非整數 pt，**原值保留**，未取整、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

**07 的小字字重為 Medium**（與 01、03、04、05、06 相同，與 02 的 Regular 不同），因此 07 只註冊 Medium 與 Bold，**不載入 Regular**（第 2.11 節）。字型未就緒即 render fail-closed，不 fallback 系統字型。

2× 層成員由 descriptor 決定、不由字重決定（第 2.10 節）。**不得 auto-wrap、不得 auto-shrink。**

### 10.10 文字 geometry 與水平對齊

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 170 | 221 | 660 | 65 | ink-box center | ink-box center |
| 副標 | 170 | 304 | 660 | 84 | ink-box center | ink-box center |
| 小字 1 | 170 | 403 | 660 | 34 | ink-box center | ink-box center |
| 小字 2 | 170 | 446 | 660 | 34 | ink-box center | ink-box center |

**07 的五個 box（Logo ＋ 四個文字）共用同一水平中心 500（＝畫布中心）**，因此 07 的 `horizontalAlign` 為 `center`（與 01、04、05 相同，第 2.9 節）。

小字 1 與小字 2 是**兩個獨立文字欄位**，不是同一欄自動換行；四欄皆為單行，不 multiline、不 wrap、不 auto-shrink。

### 10.11 文字上限

依第 2.5 節的 online-bn 全版位共通上限：主標 8、副標 7、小字 1 18、小字 2 18。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5，以 `\p{Script=Han}` 判定）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial text 為四個空字串；Viewer 自動帶入第 2.16 節的共通 sample text。

### 10.12 Renderer-owned 元素

07 **沒有** `secondaryLogo`、CTA、badge、額外文字或任何額外 renderer-owned graphic。descriptor 的 top-level 欄位精確為 `id`、`name`、`canvas`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc` 十二項，不含 `background` 與 `secondaryLogo`。

06 雖已建立 optional `secondaryLogo` 能力（第 2.12 節），**07 不使用**；人物、置物櫃、店面、彩帶、彩券與其他裝飾一律 baked into style 底圖。

### 10.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=07-om-feed` |
| Launcher | `開獎秀/01_線上電子BN/launch/07_OM與FEED.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/07_OM與FEED.png` |

07 與 01～06 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `07-om-feed`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 07 專屬分支。

### 10.14 Implementation files

Code Commit `dfc2ab3` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/07_OM與FEED.png
A  開獎秀/01_線上電子BN/assets/智取櫃/07_OM與FEED.png
A  開獎秀/01_線上電子BN/assets/門市/07_OM與FEED.png
A  開獎秀/01_線上電子BN/js/layout-07-om-feed.js
A  開獎秀/01_線上電子BN/launch/07_OM與FEED.command
M  開獎秀/01_線上電子BN/js/online-bn.js
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_07_OM_FEED` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 僅更新 fail-closed 訊息中的合法值列舉字串。

**07 完全使用現有 descriptor contract，NO engine change。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`～`layout-06-fb-post.js`、`01_DDcard BN.command`～`06_FB Post.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`開獎秀/04_門市清單/` 亦皆未修改。07 未新增 `backgroundIntrinsic` 欄位：`backgroundPlacement` 的 width／height 仍兼任底圖 intrinsic 的 fail-closed 期望值。

**不在本次 Code Commit 範圍**：08～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 10.15 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 1000 × 1000、三張素材 intrinsic 與 SHA-256、兩組 base placement `0,499,1000×501` 與 `0,501,1000×499` 且 y 不同、底緣皆為 1000、1:1／不 crop／不 stretch、無 top-level `background` 故走 legacy `fillRect(0,0,1000,1000)`、無 `secondaryLogo`、Logo box 與 contain `499.6985 × 81 @ (250.1507, 119)` 且未硬編 destination、四組文字 geometry 與五個 box 共用中心 500、三組 font string 與 ×72/96 換算、`52.5pt` 與 `26.25pt` 原值保留、僅註冊 Medium＋Bold、2× offscreen 2000 × 2000 與成員、limits、預設色、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、七個 launcher port 與 marker、`git diff --check`） |
| 01～06 Regression Verification | **PASS**（六份 descriptor 與六個 launcher blob 0 modification；背景分支 01／02／03／05／06 legacy、04 rounded-card 均未變；06 的 `secondaryLogo` 行為未受影響） |
| Engine boundary | **NO engine change** —— `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆 0 modification，07 完全以現有 descriptor contract 表達 |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（Canvas 1000 × 1000、smart-locker 與 store 背景色、兩組底圖貼底位置、Logo、主標／副標／小字 1／小字 2 字級與置中、整體對位 overlay、Logo modes Auto／White／Orange 且 Auto 下 smart → white、store → orange、01～07 版位切換、01～06 視覺無 regression） |

三張 07 素材於 Code Commit 前後 SHA-256 不變（值見第 10.4 節），`git diff --check HEAD^ HEAD` PASS。

## 11. 08_SKBN_APP左右

### 11.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| 06 Regression Verification | **PASS** |
| 07 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `9552492b8b765dfcfc8f7fb192b47607884626d1` |
| Code Commit（short） | `9552492` |
| Commit message | `feat(lottery-show): add online BN SKBN APP LR layout` |
| Parent | `36d3e1ce76e274d611fa4691f4040f0a0ef62566` |
| Docs Commit | Pending |

layout id：`08-skbn-app-lr`。

**08 是 online-bn 第一個「非五元素」版位**：renderer-owned 的只有主 Logo 與副標兩個元素，沒有主標、小字 1、小字 2。

### 11.2 Canvas

正式畫布 **358 × 360**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 11.3 背景

**08 不宣告 descriptor 的 `background` 欄位**，因此走第 2.12 節的 legacy 分支：`fillRect(0, 0, 358, 360)` 填滿整張畫布，填色來源為 `state.colors.background`。

畫面上的白色圓角外框**是 baked into style 底圖的美術**，不是 04 的 `rounded-card` renderer background；08 **不使用** `rounded-card` 模式，畫布本身不保持透明。底圖的透明窗（框內上半部）讓背景色顯現。

### 11.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/08_SKBN_APP左右.png` | 358 × 360 | `cb3a049c6ec8d74f761dc23407001c24ac1aed41b9294a1914344499a95529b7` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/08_SKBN_APP左右.png` | 358 × 360 | `b180625bac3790b6e74b10b860c50b75d8bbe8bc03a03ae97db315de8604f307` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/08_SKBN_APP左右.png` | 358 × 360 | `0d57e519e73898ca4d26c512222bb4324618ee3f4cf268250f83feceee15a7b8` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

**三張 08 素材於 Code Commit 前後 SHA-256 完全不變**；Logo 沿用 online-bn 全版位共用素材（第 2.3 節）。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 11.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/08_SKBN_APP左右.png` | 0 | 0 | 358 | 360 |
| `store` | `assets/門市/08_SKBN_APP左右.png` | 0 | 0 | 358 | 360 |

兩者 placement **完全相同**，皆為原尺寸 1:1、**full canvas**（intrinsic 等於畫布），**不 stretch、不 crop**。

### 11.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 358 × 360）
2. style 正式底圖
3. Logo
4. 副標

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 358, 360)` — 背景色
2. `drawImage(base, 0, 0, 358, 360)` — style 正式底圖
3. Logo（contain ＋ 水平置中、垂直置中）
4. 副標（Bold，直接繪於正式 canvas）

**08 沒有 2× 層**：`supersampledFields` 為空陣列，engine 的 supersampling layer 直接 early-return，不建立 offscreen canvas（第 11.9 節）。

### 11.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 68、y = 43、width = 222、height = 36 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(222/1678, 36/272) = 222/1678`，dest ≈ **222 × 35.9857**，`destX = 68`、`destY ≈ 43.0072`。

**box 的 `222 × 36` 是對位框，不是 renderer destination**；descriptor 只宣告 `box`、`intrinsic`、`src`，destination 由共用的 `computeContainRect()` 推導，**未硬編**。

Logo 橘／白兩個 variant 的 geometry 一致。模式與 Auto 判定依第 2.3 節；在 08 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。

### 11.8 文字 geometry

08 的 renderer text **精確只有副標一欄**，`textOrder` 為 `["subtitle"]`；**不存在**主標、小字 1、小字 2。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 副標 | 41 | 89 | 276 | 38 | ink-box center | ink-box center |

副標 box 與 Logo box 的水平中心皆為 **179（＝畫布中心 358 / 2）**，因此 08 的 `horizontalAlign` 為 `center`（第 2.9 節）。單行，不 multiline、不 wrap、不 auto-shrink。

### 11.9 Typography 與文字算繪

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 副標 | `ShopeeNotoSans(content)-Bold` **39pt** | `29.25pt "LotteryShowNotoSans Bold"` | 否 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（39 → 29.25）。`29.25pt` 為非整數 pt，**原值保留**，未取整為 29 或 30、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

- `supersampledFields`：**`[]`**（空陣列）
- `directFields`：**`["subtitle"]`**
- 08 **不建立 2× text layer、不建立 offscreen text canvas**
- `layoutFontFamilies`：**`["bold"]`** —— 只載入 Bold，**不載 Medium、不載 Regular**

字型未就緒即 render fail-closed，不 fallback 系統字型。**不得 auto-wrap、不得 auto-shrink。**

### 11.10 文字上限與輸入行為

副標上限依第 2.5 節的 online-bn 全版位共通值：**7**。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5，以 `\p{Script=Han}` 判定）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial subtitle 為**空字串**。

### 11.11 顏色

08 的 `colorFields` **精確只有兩項**：`background`、`subtitle`。

| style | 背景色 | 副標 |
|---|---|---|
| `smart-locker` | `#2660ad` | `#fff000` |
| `store` | `#ffda46` | `#eb1717` |

數值沿用第 2.6 節的 online-bn 全版位共通預設色。**08 沒有主標與小字 renderer text，因此不提供主標顏色與小字顏色控制**；`defaultColors` 亦只記錄上述兩鍵。

Logo mode 沿用共通 `Auto`／`Orange`／`White`，threshold **0.498708**；Auto 下 smart（`#2660ad`）→ **white**、store（`#ffda46`）→ **orange**。

### 11.12 Renderer-owned 與 baked-in 元素

**renderer-owned 精確只有**：主 Logo、副標（再加上共通的 legacy background fill 與 style base）。

**baked into style base**（renderer 不另繪製）：白色圓角外框、人物、智取櫃、門市店面、彩帶、$1,000,000 彩券、**紅色播放 icon**、其他裝飾。

08 **沒有** `secondaryLogo`、CTA、badge、主標、小字 1、小字 2，或任何其他 renderer-owned graphic。descriptor 的 top-level 欄位精確為 `id`、`name`、`canvas`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc` 十二項。

### 11.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=08-skbn-app-lr` |
| Launcher | `開獎秀/01_線上電子BN/launch/08_SKBN_APP左右.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/08_SKBN_APP左右.png` |

08 與 01～07 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `08-skbn-app-lr`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 08 專屬分支。Viewer 依 `textOrder` 自動帶入副標 sample（第 2.16 節）。

### 11.14 Viewer generic sample fix（08 導入的共用相容性修正）

**修改前**：`applySampleText()` 固定依 `SAMPLE_TEXT` 的四個欄位查 input，缺任一欄即中止；此假設在 08（只有副標）不再成立。

**修改後**：`applySampleText(layout)` 依 **`layout.textOrder`** 迭代，只對該版位實際存在、且 `SAMPLE_TEXT` 有定義的欄位套值；`#obn-text-<id>` lookup、`input.value`、`input` 事件 dispatch 與 boolean 回傳語意**全部維持既有行為**。

| 版位 | `textOrder` | Viewer 自動帶入 |
|---|---|---|
| 01～07 | `title`、`subtitle`、`small1`、`small2` | **四欄，行為與內容完全不變** |
| 08 | `subtitle` | 只套副標 |

**`SAMPLE_TEXT` 四句內容未更動**；**沒有 hardcode 08**、**沒有 08-specific branch**；Console 的 initial text 不受影響；unknown layout 仍 fail-closed；alignment overlay 仍 descriptor-driven。

這是 **Viewer 的 generic compatibility fix，不是新的 renderer capability，也不是 engine change**。

### 11.15 Implementation files

Code Commit `9552492` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/08_SKBN_APP左右.png
A  開獎秀/01_線上電子BN/assets/智取櫃/08_SKBN_APP左右.png
A  開獎秀/01_線上電子BN/assets/門市/08_SKBN_APP左右.png
A  開獎秀/01_線上電子BN/js/layout-08-skbn-app-lr.js
A  開獎秀/01_線上電子BN/launch/08_SKBN_APP左右.command
M  開獎秀/01_線上電子BN/js/online-bn.js
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_08_SKBN_APP_LR` 的 import 並將其附加於 `LAYOUTS` 末端（`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 更新 fail-closed 訊息的合法值列舉字串，並套用第 11.14 節的 generic sample fix。

**NO engine change。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`～`layout-07-om-feed.js`、`01_DDcard BN.command`～`07_OM與FEED.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`開獎秀/04_門市清單/` 亦皆未修改。08 未新增任何 engine capability。

**不在本次 Code Commit 範圍**：09～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 11.16 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 358 × 360、三張素材 intrinsic 與 SHA-256、兩組 base placement 皆 `0,0,358×360` 且相同、1:1／full canvas／不 crop／不 stretch、無 top-level `background` 故走 legacy `fillRect(0,0,358,360)`、Logo box 與 contain `222 × 35.9857 @ (68, 43.0072)` 且未硬編 destination、副標 box `41,89,276×38`、兩個 box 共用中心 179、`photoshopPt 39` → `canvasPt 29.25` 且 `canvasPt === photoshopPt × 72/96`、font string `29.25pt "LotteryShowNotoSans Bold"`、`textOrder` 只有 subtitle、`supersampledFields` 為空且不建立 offscreen、`directFields` 只有 subtitle、`colorFields` 與 `defaultColors` 皆只有 background 與 subtitle、`layoutFontFamilies` 為 `["bold"]`、`createInitialState().text` 為 `{ subtitle: "" }`、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、八個 launcher port 與 marker、`git diff --check`） |
| 01～07 Regression Verification | **PASS**（七份 descriptor 與七個 launcher blob 0 modification；背景分支 01／02／03／05／06／07 legacy、04 rounded-card 均未變；06 的 `secondaryLogo` 行為未受影響；以 recording mock ctx 錄製 01～07 × 2 styles × 3 modes 共 42 組、1680 筆 ctx 呼叫，其中 01～05 的 30 組可與 engine 擴充前基準逐筆比對，結果完全相同） |
| Viewer generic sample fix regression | **PASS**（01～07 仍依四欄 `textOrder` 帶入四句 sample，內容與順序不變；08 只帶入副標；`SAMPLE_TEXT` 未更動；無 08 hardcode） |
| Engine boundary | **NO engine change** —— `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆 0 modification |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（smart-locker 與 store 的背景、白色圓角外框、底圖、Logo、副標、紅色播放 icon、整體 overlay 對位；Logo modes Auto／White／Orange，Auto 下 smart → white、store → orange；Viewer 中 08 自動帶入副標 sample；正式 Console 的 08 initial subtitle 空白；01～08 版位切換正常；01～07 視覺無 regression，且 Viewer 在舊版位仍自動帶入四欄 sample） |

`git diff --check HEAD^ HEAD` PASS。

## 12. 09_SKBN_APP中

### 12.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| 06 Regression Verification | **PASS** |
| 07 Regression Verification | **PASS** |
| 08 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `cef130086df2e9fac3e2c59d364e11b7a1af27ae` |
| Code Commit（short） | `cef1300` |
| Commit message | `feat(lottery-show): add online BN SKBN APP mid layout` |
| Parent | `6eb97cf5e964524bea4ffae3ee4a278ae647f625` |
| Docs Commit | Pending |

layout id：`09-skbn-app-mid`。

09 與 08 同為「非五元素」版位：renderer-owned 的只有主 Logo 與副標兩個元素，沒有主標、小字 1、小字 2。

### 12.2 Canvas

正式畫布 **484 × 360**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 12.3 背景

**09 不宣告 descriptor 的 `background` 欄位**，因此走第 2.12 節的 legacy 分支：`fillRect(0, 0, 484, 360)` 填滿整張畫布，填色來源為 `state.colors.background`。

畫面上的白色圓角外框**是 baked into style 底圖的美術**，不是 04 的 `rounded-card` renderer background；09 **不使用** `rounded-card` 模式，畫布本身不保持透明。底圖的透明窗（框內上半部）讓背景色顯現。

### 12.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/09_SKBN_APP中.png` | 484 × 360 | `305bb4aa458ee221183c6a1570489eca7852481b41619141944100aa84b2dd1c` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/09_SKBN_APP中.png` | 484 × 360 | `dcd396c34d14f440d7707f262518d550665a6ff6e3d1c29ea56a0cb91f989ec3` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/09_SKBN_APP中.png` | 484 × 360 | `c179e5c84fee5c89d12283952e02ac1074bee123ca11767d489e8e8e290e8e71` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

**三張 09 素材於 Code Commit 前後 SHA-256 完全不變**；Logo 沿用 online-bn 全版位共用素材（第 2.3 節）。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分；其 `0,0,484×360` 外框為 safe-area 標記，不是 renderer box。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 12.5 底圖 placement

| style | 底圖 | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/09_SKBN_APP中.png` | 0 | 0 | 484 | 360 |
| `store` | `assets/門市/09_SKBN_APP中.png` | 0 | 0 | 484 | 360 |

兩者 placement **完全相同**，皆為原尺寸 1:1、**full canvas**（intrinsic 等於畫布），**不 stretch、不 crop、不 offset**。

### 12.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 背景色（填滿整張 484 × 360）
2. style 正式底圖
3. Logo
4. 副標

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRect(0, 0, 484, 360)` — 背景色
2. `drawImage(base, 0, 0, 484, 360)` — style 正式底圖
3. Logo（contain ＋ 水平置中、垂直置中）
4. 副標（Bold，直接繪於正式 canvas）

**09 沒有 2× 層**：`supersampledFields` 為空陣列，engine 的 supersampling layer 直接 early-return，不建立 offscreen canvas（第 12.9 節）。

### 12.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 131、y = 33、width = 222、height = 36 |
| intrinsic | 1678 × 272 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平置中**、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(222/1678, 36/272) = 222/1678`，dest ≈ **222 × 35.9857**，`destX = 131`、`destY ≈ 33.0072`。

**box 的 `222 × 36` 是對位框，不是 renderer destination**；descriptor 只宣告 `box`、`intrinsic`、`src`，destination 由共用的 `computeContainRect()` 推導，**未硬編**。

Logo 橘／白兩個 variant 的 geometry 一致。模式與 Auto 判定依第 2.3 節；在 09 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。**不宣告 `secondaryLogo`。**

### 12.8 文字 geometry

09 的 renderer text **精確只有副標一欄**，`textOrder` 為 `["subtitle"]`；**不存在**主標、小字 1、小字 2。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 副標 | 80 | 81 | 324 | 44 | ink-box center | ink-box center |

副標 box 與 Logo box 的水平中心皆為 **242（＝畫布中心 484 / 2）**，因此 09 的 `horizontalAlign` 為 `center`（第 2.9 節）。單行，不 multiline、不 wrap、不 auto-shrink。

### 12.9 Typography 與文字算繪

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 副標 | `ShopeeNotoSans(content)-Bold` **46pt** | `34.5pt "LotteryShowNotoSans Bold"` | 否 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（46 → 34.5）。`34.5pt` 為非整數 pt，**原值保留**，未取整為 34 或 35、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

- `supersampledFields`：**`[]`**（空陣列）
- `directFields`：**`["subtitle"]`**
- 09 **不建立 2× text layer、不建立 offscreen text canvas**
- `layoutFontFamilies`：**`["bold"]`** —— 只載入 Bold，**不載 Medium、不載 Regular**

字型未就緒即 render fail-closed，不 fallback 系統字型。**不得 auto-wrap、不得 auto-shrink。**

### 12.10 文字上限與輸入行為

副標上限依第 2.5 節的 online-bn 全版位共通值：**7**。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5，以 `\p{Script=Han}` 判定）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial subtitle 為**空字串**。

### 12.11 顏色

09 的 `colorFields` **精確只有兩項**：`background`、`subtitle`。

| style | 背景色 | 副標 |
|---|---|---|
| `smart-locker` | `#2660ad` | `#fff000` |
| `store` | `#ffda46` | `#eb1717` |

數值沿用第 2.6 節的 online-bn 全版位共通預設色。**09 沒有主標與小字 renderer text，因此不提供主標顏色與小字顏色控制**；`defaultColors` 亦只記錄上述兩鍵。

Logo mode 沿用共通 `Auto`／`Orange`／`White`，threshold **0.498708**；Auto 下 smart-locker（`#2660ad`）→ **white**、store（`#ffda46`）→ **orange**。**無 09-specific Logo mode。**

### 12.12 Renderer-owned 與 baked-in 元素

**renderer-owned 精確只有**：主 Logo、副標（再加上共通的 legacy background fill 與 style base）。

**baked into style base**（renderer 不另繪製）：白色圓角外框、人物、智取櫃、門市店面、彩帶、$1,000,000 彩券、**播放 icon**、其他裝飾。

09 **沒有** `secondaryLogo`、CTA、badge、主標、小字 1、小字 2，或任何其他 renderer-owned graphic。descriptor 的 top-level 欄位精確為 `id`、`name`、`canvas`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc` 十二項。

### 12.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=09-skbn-app-mid` |
| Launcher | `開獎秀/01_線上電子BN/launch/09_SKBN_APP中.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/09_SKBN_APP中.png` |

09 與 01～08 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `09-skbn-app-mid`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 09 專屬分支。

Viewer sample 沿用 08 導入的 descriptor-driven `applySampleText(layout)`（第 2.16、11.14 節）：09 的 `textOrder` 只有 `subtitle`，因此**只帶入副標 sample**；本次**未修改** sample architecture、**未修改** `SAMPLE_TEXT` 四句內容、**無 09-specific branch**。01～07 仍四欄 sample、08 仍 subtitle-only。

### 12.14 Implementation files

Code Commit `cef1300` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/09_SKBN_APP中.png
A  開獎秀/01_線上電子BN/assets/智取櫃/09_SKBN_APP中.png
A  開獎秀/01_線上電子BN/assets/門市/09_SKBN_APP中.png
A  開獎秀/01_線上電子BN/js/layout-09-skbn-app-mid.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/09_SKBN_APP中.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_09_SKBN_APP_MID` 的 import 並將其附加於 `LAYOUTS` 末端（順序 01→09，`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 僅更新 fail-closed 訊息的合法值列舉字串（加入 `09-skbn-app-mid`）。**未擴張 registry／storage／URL persistence／selection architecture。**

**Engine Change = NO。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`～`layout-08-skbn-app-lr.js`、`01_DDcard BN.command`～`08_SKBN_APP左右.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`開獎秀/04_門市清單/` 亦皆未修改。09 未新增任何 engine capability。

**不在本次 Code Commit 範圍**：10～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 12.15 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 484 × 360、三張素材 intrinsic 與 SHA-256、兩組 base placement 皆 `0,0,484×360` 且相同、1:1／full canvas／不 crop／不 stretch／不 offset、無 top-level `background` 故走 legacy `fillRect(0,0,484,360)`、Logo box 與 contain `222 × 35.9857 @ (131, 33.0072)` 且未硬編 destination、副標 box `80,81,324×44`、兩個 box 共用中心 242、`photoshopPt 46` → `canvasPt 34.5` 且 `canvasPt === photoshopPt × 72/96`、font string `34.5pt "LotteryShowNotoSans Bold"`、`textOrder` 只有 subtitle、`supersampledFields` 為空且不建立 offscreen、`directFields` 只有 subtitle、`colorFields` 與 `defaultColors` 皆只有 background 與 subtitle、`layoutFontFamilies` 為 `["bold"]`、`createInitialState().text` 為 `{ subtitle: "" }`、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、九個 launcher port 與 marker；**protected scope 0 modification、三張 PNG SHA 不變、無第 8 path、`git diff --check` PASS**） |
| 01～08 Regression Verification | **PASS**（八份 descriptor 與八個 launcher blob 0 modification；背景分支 01／02／03／05／06／07／08 legacy、04 rounded-card 均未變；06 的 `secondaryLogo` 與 08 的 subtitle-only 行為未受影響） |
| Viewer sample regression | **PASS**（01～07 仍四欄 sample、08 仍 subtitle-only、09 只帶副標；`SAMPLE_TEXT` 與 generic architecture 未更動） |
| Engine boundary | **NO engine change** —— `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆 0 modification |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（smart-locker 與 store 畫面、背景、白色圓角外框、底圖、Logo、副標、播放 icon、alignment overlay 對位；Logo modes Auto／White／Orange，Auto 下 smart → white、store → orange；Viewer 中 09 自動帶入副標 sample；正式 Console 的 09 initial subtitle 空白；01～09 版位切換正常；01～08 無 regression；舊 Viewer sample regression 正常） |

`git diff --check HEAD^ HEAD` PASS。

## 13. 10_SKBN_PC

### 13.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| 06 Regression Verification | **PASS** |
| 07 Regression Verification | **PASS** |
| 08 Regression Verification | **PASS** |
| 09 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `5ab1ec70348cd57cf9edd039dd397f3aa4e5f360` |
| Code Commit（short） | `5ab1ec7` |
| Commit message | `feat(lottery-show): add online BN SKBN PC layout` |
| Parent | `8a4bfa7ffefa6bd8a5f3cf59b5f995d9faca73fd` |
| Docs Commit | Pending |

layout id：`10-skbn-pc`。

10 與 08、09 同為「非五元素」版位：renderer-owned 的只有主 Logo 與副標兩個元素，沒有主標、小字 1、小字 2。

10 是繼 04 之後**第二個使用 `rounded-card` 背景模式**的版位；該模式為 04 已導入的既有能力，**10 未新增任何 engine capability**。

### 13.2 Canvas

正式畫布 **400 × 110**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 13.3 背景（圓角卡片）

**10 不使用 full-canvas 背景填色。** 畫布本身保持透明，背景色只填一張圓角卡片：

| 項目 | 值 |
|---|---|
| 模式 | `rounded-card`（第 2.12 節的 optional `layout.background`，04 precedent） |
| x | 8 |
| y | 7 |
| width | 384 |
| height | 96 |
| radius | **10** |
| 卡片外 | **transparent**（不填色、不繪製任何內容） |

填色來源為 `state.colors.background`，即第 2.6 節的背景色控制項；10 未新增第二個背景色欄位。radius `10` 為 **Canvas geometry 值，不是 typography pt**，因此**不套用** `× 72 / 96` 換算。

此模式沿用 04 既有實作（`validateBackground()` ＋ `fillRoundedCard()`），**04 的 `radius: 40` 與其既有行為完全未受影響**。01、02、03、05、06、07、08、09 的 descriptor 未宣告 `background`，仍為 legacy full-canvas fill（第 2.12 節）。

### 13.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/10_SKBN_PC.png` | 400 × 110 RGBA | `3a6aef158eb11bb02e2d42d963f8db3252e5a397a30c58f0e605419f5e930156` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/10_SKBN_PC.png` | 172 × 96 | `9a6b990f7297ef1cd12b9f2baf5515de4f58ba6c2fc93e3d1f50c3ca8b46381f` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/10_SKBN_PC.png` | 163 × 96 | `437b9d4d160139eb5d9d06dafbe3a9489210f52144b6a570065b1685d87b1532` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

**三張 10 素材於 Code Commit 前後 SHA-256 完全不變**；Logo 沿用 online-bn 全版位共用素材（第 2.3 節）。

10 是 online-bn 第一個**兩張 style 底圖 intrinsic 彼此不同、且皆小於畫布**的版位（172 × 96 與 163 × 96）。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分；其圓角卡片範圍為 safe-area／背景參考，已由 descriptor 的 `background` 欄位表達，**不另建 renderer element**。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 13.5 底圖 placement

| style | 底圖 | x | y | width | height | 右緣 | 下緣 |
|---|---|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/10_SKBN_PC.png` | 220 | 7 | 172 | 96 | 392 | 103 |
| `store` | `assets/門市/10_SKBN_PC.png` | 229 | 7 | 163 | 96 | 392 | 103 |

兩者皆為原尺寸 **1:1**，**不 stretch、不 crop**。兩張底圖皆上緣貼卡片頂 `y = 7`、右緣貼卡片右 `392`；因門市底圖比智取櫃窄 9px，**兩 style 的 x 必然不同（220 vs 229）**，不得為了共用而強迫統一。

### 13.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 圓角卡片背景色（`8,7,384×96`、radius 10；卡片外透明）
2. style 正式底圖（右側插圖）
3. Logo
4. 副標

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRoundedCard(8, 7, 384, 96, radius 10)` — 背景色，**無 full-canvas `fillRect`**
2. `drawImage(base, 220, 7, 172, 96)`／`drawImage(base, 229, 7, 163, 96)` — style 正式底圖
3. Logo（contain ＋ 水平靠左、垂直置中）
4. 副標（Bold，直接繪於正式 canvas）

**10 沒有 2× 層**：`supersampledFields` 為空陣列，engine 的 supersampling layer 直接 early-return，不建立 offscreen canvas（第 13.9 節）。

### 13.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 17、y = 24、width = 146、height = 24 |
| intrinsic | 1678 × 272 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平靠左**（`destX = box.x`）、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(146/1678, 24/272) = 146/1678`，dest ≈ **146.0000 × 23.6663**，`destX = 17.0000`、`destY ≈ 24.1669`。

**box 的 `146 × 24` 是對位框，不是 renderer destination**；descriptor 只宣告 `box`、`intrinsic`、`src`，destination 由共用的 `computeContainRect()` 推導，**未硬編**。

Logo 橘／白兩個 variant 的 geometry 一致，**兩 style 亦共用同一組 Logo geometry**（不建立 per-style Logo geometry）。模式與 Auto 判定依第 2.3 節；在 10 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。**不宣告 `secondaryLogo`。**

### 13.8 文字 geometry

10 的 renderer text **精確只有副標一欄**，`textOrder` 為 `["subtitle"]`；**不存在**主標、小字 1、小字 2。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 副標 | 17 | 56 | 204 | 29 | ink 左緣對齊 box.x | ink-box center |

Logo box 與副標 box **共用左緣 x = 17**，而兩者的水平中心分別為 90 與 119、皆不等於畫布中心 200，因此 10 的 `horizontalAlign` 為 `left`（第 2.9 節）。依既有 engine 的 left ink-box positioning，實際 ink 左緣精確落在 `box.x`；engine 內部為 `inkLeft = -actualBoundingBoxLeft`、`x = box.x - inkLeft`。單行，不 multiline、不 wrap、不 auto-shrink。

### 13.9 Typography 與文字算繪

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 副標 | `ShopeeNotoSans(content)-Bold` **28.5pt** | `21.375pt "LotteryShowNotoSans Bold"` | 否 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（28.5 → 21.375）。`21.375pt` 為非整數 pt，**原值保留**，未取整為 21、21.4、21.5 或 22、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

本值為 Jamie Manual Verification 後鎖定的**最終正式值**。Manual Verification 階段由 Photoshop 30pt 調整為 28.5pt（Canvas 由 22.5pt 調整為 21.375pt）；30 / 22.5 僅屬 Manual Verification 前的中間實作，**不是最終規格**。該次調整只改動 `layout-10-skbn-pc.js` 的 `photoshopPt` 與 `canvasPt` 兩個值（及同檔內對應註解），box、Logo、背景、placement、顏色、上限等皆未變動。

- `supersampledFields`：**`[]`**（空陣列）
- `directFields`：**`["subtitle"]`**
- 10 **不建立 2× text layer、不建立 offscreen text canvas**
- `layoutFontFamilies`：**`["bold"]`** —— 只載入 Bold，**不載 Medium、不載 Regular**

字型未就緒即 render fail-closed，不 fallback 系統字型。**不得 auto-wrap、不得 auto-shrink。**

### 13.10 文字上限與輸入行為

副標上限依第 2.5 節的 online-bn 全版位共通值：**7**。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5，以 `\p{Script=Han}` 判定）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial subtitle 為**空字串**。

### 13.11 顏色

10 的 `colorFields` **精確只有兩項**：`background`、`subtitle`。

| style | 背景色 | 副標 |
|---|---|---|
| `smart-locker` | `#2660ad` | `#fff000` |
| `store` | `#ffda46` | `#eb1717` |

數值沿用第 2.6 節的 online-bn 全版位共通預設色。**10 沒有主標與小字 renderer text，因此不提供主標顏色與小字顏色控制**；`defaultColors` 亦只記錄上述兩鍵。右側顏色控制精確只有「背景色」與「副標顏色」兩項。

Logo mode 沿用共通 `Auto`／`Orange`／`White`，threshold **0.498708**；Auto 下 smart-locker（`#2660ad`）→ **white**、store（`#ffda46`）→ **orange**。**無 10-specific Logo mode。**

### 13.12 Renderer-owned 與 baked-in 元素

**renderer-owned 精確只有**：主 Logo、副標（再加上 descriptor-driven 的 `rounded-card` 背景與 style base）。

**baked into style base**（renderer 不另繪製）：右側人物、智取櫃／門市店面、彩券、**紅色播放 icon**、右側其他裝飾。

10 **沒有** `secondaryLogo`、CTA、badge、主標、小字 1、小字 2，或任何其他 renderer-owned graphic。descriptor 的 top-level 欄位精確為 `id`、`name`、`canvas`、`background`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc` 十三項。

### 13.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=10-skbn-pc` |
| Launcher | `開獎秀/01_線上電子BN/launch/10_SKBN_PC.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/10_SKBN_PC.png` |

10 與 01～09 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `10-skbn-pc`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 10 專屬分支。

Viewer sample 沿用 08 導入的 descriptor-driven `applySampleText(layout)`（第 2.16、11.14 節）：10 的 `textOrder` 只有 `subtitle`，因此**只帶入副標 sample**；本次**未修改** sample architecture、**未修改** `SAMPLE_TEXT` 四句內容、**無 10-specific branch**。01～07 仍四欄 sample、08 與 09 仍 subtitle-only。

### 13.14 Implementation files

Code Commit `5ab1ec7` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/10_SKBN_PC.png
A  開獎秀/01_線上電子BN/assets/智取櫃/10_SKBN_PC.png
A  開獎秀/01_線上電子BN/assets/門市/10_SKBN_PC.png
A  開獎秀/01_線上電子BN/js/layout-10-skbn-pc.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/10_SKBN_PC.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_10_SKBN_PC` 的 import 並將其附加於 `LAYOUTS` 末端（順序 01→10，`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 僅更新 fail-closed 訊息的合法值列舉字串（加入 `10-skbn-pc`）。**未擴張 registry／storage／URL persistence／selection architecture。**

**Engine Change = NO。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`～`layout-09-skbn-app-mid.js`、`01_DDcard BN.command`～`09_SKBN_APP中.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`開獎秀/04_門市清單/` 亦皆未修改。10 的 `rounded-card` 直接沿用 04 既有能力，**未新增任何 engine capability**。

**不在本次 Code Commit 範圍**：11～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 13.15 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 400 × 110、三張素材 intrinsic 與 SHA-256、`background` 為 `rounded-card` 且 box `8,7,384×96`／radius 10 並通過 `validateBackground()`、卡片外維持透明且無 full-canvas `fillRect`、兩組 base placement `220,7,172×96` 與 `229,7,163×96` 皆 1:1 且 x 不同、右緣同為 392、Logo box `17,24,146×24` 與 contain `146.0000 × 23.6663 @ (17.0000, 24.1669)` 且未硬編 destination、副標 box `17,56,204×29`、兩個 box 共用左緣 17 故 `horizontalAlign` 為 `left`、`photoshopPt 28.5` → `canvasPt 21.375` 且 `canvasPt === photoshopPt × 72/96`、font string `21.375pt "LotteryShowNotoSans Bold"`、`textOrder` 只有 subtitle、`supersampledFields` 為空且六組渲染組合皆未建立 offscreen、`directFields` 只有 subtitle、`colorFields` 與 `defaultColors` 皆只有 background 與 subtitle、`layoutFontFamilies` 為 `["bold"]`、`createInitialState().text` 為 `{ subtitle: "" }`、無 `secondaryLogo`／CTA／badge、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、十個 launcher port 與 marker、launcher `bash -n` 與 index mode 100755；**protected scope 0 modification、三張 PNG SHA 不變、無第 8 path、`git diff --check` PASS**） |
| 01～09 Regression Verification | **PASS**（九份 descriptor 與九個 launcher blob 0 modification；以 recording mock ctx 錄製 01～09 × 2 style × 3 Logo mode 共 54 組合、1,860 次繪製呼叫，與前一輪錄製逐行 byte-identical） |
| 04 rounded-card regression | **PASS**（04 的 `moveTo(93,27)` ＋ 四段 `arcTo(…, 40)` 與 radius 40 完全未變；10 使用同一能力未改變 04 行為） |
| 06 secondaryLogo regression | **PASS**（第二 Logo 與主 Logo variant 同步行為未受影響） |
| 08／09 subtitle-only regression | **PASS** |
| Viewer sample regression | **PASS**（01～07 仍四欄 sample、08 與 09 仍 subtitle-only、10 只帶副標；`SAMPLE_TEXT` 與 generic architecture 未更動） |
| Engine boundary | **NO engine change** —— `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆 0 modification |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（smart-locker 與 store 畫面、400 × 110 畫布、卡片外透明、圓角卡片 `8,7,384×96` radius 10、兩組 style base 位置、Logo、副標、播放 icon、alignment overlay 對位、Logo 與副標左緣同線；Logo modes Auto／White／Orange，Auto 下 smart → white、store → orange；背景色與副標色控制；Viewer 中 10 自動帶入副標 sample；正式 Console 的 10 initial subtitle 空白；01～10 版位切換正常；01～09 無 regression；04 rounded-card、08／09 subtitle-only、舊 Viewer sample regression 皆正常。**最終 typography 鎖定為 Photoshop 28.5pt／Canvas 21.375pt**） |

`git diff --check HEAD^ HEAD` PASS。

## 14. 11_遊戲大廳 MSBN

### 14.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Phase A Repository Investigation | **PASS** |
| Phase B Requirement / Proposal | **PASS** |
| Phase C Coding | **PASS** |
| Technical Self-Test | **PASS** |
| 01 Regression Verification | **PASS** |
| 02 Regression Verification | **PASS** |
| 03 Regression Verification | **PASS** |
| 04 Regression Verification | **PASS** |
| 05 Regression Verification | **PASS** |
| 06 Regression Verification | **PASS** |
| 07 Regression Verification | **PASS** |
| 08 Regression Verification | **PASS** |
| 09 Regression Verification | **PASS** |
| 10 Regression Verification | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `b3b064d7f8eca8072a18b9d86389bdf31a5f02f7` |
| Code Commit（short） | `b3b064d` |
| Commit message | `feat(lottery-show): add online BN game lobby MSBN layout` |
| Parent | `2cd78a6953df4d40c80c2fa62419c345c69b9d5e` |
| Docs Commit | Pending |

layout id：`11-msbn`。

11 回到 01～07 的「五元素」結構：renderer-owned 的對位元素為主 Logo、主標、副標、小字 1、小字 2；同時是繼 04、10 之後**第三個使用 `rounded-card` 背景模式**的版位。該模式為既有能力，**11 未新增任何 engine capability**。

### 14.2 Canvas

正式畫布 **1200 × 380**。renderer 不得修改 canvas 尺寸；繪製後以斷言確認尺寸未變。

### 14.3 背景（圓角卡片）

**11 不使用 full-canvas 背景填色。** 畫布本身保持透明，背景色只填一張圓角卡片：

| 項目 | 值 |
|---|---|
| 模式 | `rounded-card`（第 2.12 節的 optional `layout.background`，04／10 precedent） |
| x | 55 |
| y | 7 |
| width | 1090 |
| height | 366 |
| radius | **34** |
| 卡片外 | **transparent**（不填色、不繪製任何內容） |

填色來源為 `state.colors.background`，即第 2.6 節的背景色控制項；11 未新增第二個背景色欄位。radius `34` 為 **Canvas geometry 值，不是 typography pt**，因此**不套用** `× 72 / 96` 換算。

卡片左右邊距各 55、上下邊距各 7，即卡片在畫布中水平與垂直皆置中。此模式沿用既有實作（`validateBackground()` ＋ `fillRoundedCard()`），**04 的 `radius: 40` 與 10 的 `radius: 10` 及其既有行為完全未受影響**。01、02、03、05、06、07、08、09 的 descriptor 未宣告 `background`，仍為 legacy full-canvas fill（第 2.12 節）。

### 14.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/11_遊戲大廳 MSBN.png` | 1200 × 380 RGBA | `b1f650b100b693bf5e411694ce8c7b006406f5a61ec66aae435fdfd52de679e5` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/11_遊戲大廳 MSBN.png` | 1090 × 366 | `2467bb91d23695373c41f9219ce8ebd9ffc5d5a08b32a7f48df5a9de05d34d5e` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/11_遊戲大廳 MSBN.png` | 1090 × 366 | `9c71eaa42fe339a998b68e3a9f87c6adf536c06263d540fad925a9fede569025` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

**三張 11 素材於 Code Commit 前後 SHA-256 完全不變**；Logo 沿用 online-bn 全版位共用素材（第 2.3 節）。

兩張 style 底圖 intrinsic 相同（1090 × 366）但內容不同；兩者自身即帶圓角輪廓與白色外框 rim，且框內大面積為透明窗，讓 rounded-card 背景色顯現。

對位圖只供 Manual Verification Viewer 作 DOM overlay，不是 renderer 或輸出的一部分；其圓角卡片範圍已由 descriptor 的 `background` 欄位表達，**不另建 renderer element**。

素材載入失敗、或素材 intrinsic size 與上表不符，一律 render fail-closed。

### 14.5 底圖 placement

| style | 底圖 | x | y | width | height | 右緣 | 下緣 |
|---|---|---|---|---|---|---|---|
| `smart-locker` | `assets/智取櫃/11_遊戲大廳 MSBN.png` | 55 | 7 | 1090 | 366 | 1145 | 373 |
| `store` | `assets/門市/11_遊戲大廳 MSBN.png` | 55 | 7 | 1090 | 366 | 1145 | 373 |

兩者皆為原尺寸 **1:1**，**不 stretch、不 crop**，placement 與圓角卡片完全重合。兩 style 的 placement 數值雖相同，仍**各自在 descriptor 宣告**，不抽共用常數。

### 14.6 Draw order

**視覺／語意層級**（設計上的疊放順序）：

1. 圓角卡片背景色（`55,7,1090×366`、radius 34；卡片外透明）
2. style 正式底圖（右側插圖與白色外框 rim）
3. Logo
4. 主標
5. 副標
6. 小字 1
7. 小字 2

**實際 Canvas draw sequence**（renderer 的執行順序）：

1. `fillRoundedCard(55, 7, 1090, 366, radius 34)` — 背景色，**無 full-canvas `fillRect`**
2. `drawImage(base, 55, 7, 1090, 366)` — style 正式底圖
3. Logo（contain ＋ 水平靠左、垂直置中）
4. 第二 Logo 步驟：descriptor 未宣告 `secondaryLogo`，**完全跳過**
5. local 2× 文字層（主標、小字 1、小字 2，皆 Medium；offscreen 2400 × 760）
6. direct 文字（副標，Bold，直接繪於正式 canvas）

### 14.7 Logo

| 項目 | 值 |
|---|---|
| box | x = 135、y = 65、width = 404、height = 66 |
| intrinsic | 1678 × 272 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | **水平靠左**（`destX = box.x`）、垂直置中 |
| 規則 | 不 crop、不 stretch、destination 座標不取整 |

以素材 1678 × 272 代入為**寬度受限**：`scale = min(404/1678, 66/272) = 404/1678`，dest ≈ **404.0000 × 65.4875**，`destX = 135.0000`、`destY ≈ 65.2563`。

**box 的 `404 × 66` 是對位框，不是 renderer destination**；descriptor 只宣告 `box`、`intrinsic`、`src`，destination 由共用的 `computeContainRect()` 推導，**未硬編**。

Logo 橘／白兩個 variant 的 geometry 一致，兩 style 亦共用同一組 Logo geometry。模式與 Auto 判定依第 2.3 節；在 11 的預設色下：`#2660ad` → 白 Logo、`#ffda46` → 橘 Logo。**不宣告 `secondaryLogo`。**

### 14.8 預設色

| style | 背景色 | 主標 | 副標 | 小字 |
|---|---|---|---|---|
| `smart-locker` | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| `store` | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

數值完全沿用第 2.6 節的 online-bn 全版位共通預設色。`colorFields` 為 `background`、`title`、`subtitle`、`small` 四項，右側控制沿用既有四欄版位行為，**無 11-specific color control、無色彩例外**。

Logo mode 沿用共通 `Auto`／`Orange`／`White`，threshold **0.498708**；Auto 下 smart-locker（`#2660ad`）→ **white**、store（`#ffda46`）→ **orange**。**無 11-specific Logo mode。**

### 14.9 Typography

| 元素 | Photoshop source | Canvas renderer | 2× 層 |
|---|---|---|---|
| 主標 | `ShopeeNotoSans(content)-Medium` **40pt** | `30pt "LotteryShowNotoSans Medium"` | 是 |
| 副標 | `ShopeeNotoSans(content)-Bold` **60pt** | `45pt "LotteryShowNotoSans Bold"` | 否（direct） |
| 小字 1 | `ShopeeNotoSans(content)-Medium` **23pt** | `17.25pt "LotteryShowNotoSans Medium"` | 是 |
| 小字 2 | `ShopeeNotoSans(content)-Medium` **23pt** | `17.25pt "LotteryShowNotoSans Medium"` | 是 |

換算依第 2.8 節的 `Canvas pt = Photoshop pt × 72 / 96`（40 → 30、60 → 45、**23 → 17.25**）。主標與副標換算後為整數，小字的 `17.25pt` 為非整數 pt，**原值保留**，未取整為 17／17.5／18、未改用 px。Photoshop source pt **不得直接作為 Canvas pt**。

**小字字級的 Manual Verification 覆蓋：** Phase B 最初規劃為 Photoshop 24pt／Canvas 18pt；Jamie 於 Manual Verification 階段正式要求調整為 **Photoshop 23pt／Canvas 17.25pt**，並經重新 Technical Self-Test 與 Jamie Manual Verification **PASS**。24 / 18 僅屬 Manual Verification 前的中間規劃值，**不是最終規格**；上表的 23 / 17.25 為 11 的最終正式值。該次調整只改動 `layout-11-msbn.js` 中 small1／small2 的 `photoshopPt` 與 `canvasPt`（及同檔內對應註解），box、Logo、背景、placement、顏色、上限等皆未變動。

- `supersampledFields`：**`["title", "small1", "small2"]`**（三個 Medium 走 local 2×）
- `directFields`：**`["subtitle"]`**（Bold 直接繪於正式 canvas）
- `layoutFontFamilies`：**`["medium", "bold"]`** —— 不載 Regular
- `SUPERSAMPLE_SCALE` = 2 → offscreen **2400 × 760**

字型未就緒即 render fail-closed，不 fallback 系統字型。**不得 auto-wrap、不得 auto-shrink。**

### 14.10 文字 geometry 與水平對齊

`textOrder` 為 `["title", "subtitle", "small1", "small2"]`。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| 主標 | 135 | 145 | 404 | 37 | ink 左緣對齊 box.x | ink-box center |
| 副標 | 135 | 197 | 416 | 56 | ink 左緣對齊 box.x | ink-box center |
| 小字 1 | 135 | 268 | 416 | 23 | ink 左緣對齊 box.x | ink-box center |
| 小字 2 | 135 | 296 | 416 | 23 | ink 左緣對齊 box.x | ink-box center |

Logo box 與四個文字 box **共用左緣 x = 135**，而水平中心為 337／343、皆不等於畫布中心 600，因此 11 的 `horizontalAlign` 為 `left`（第 2.9 節）。依既有 engine 的 left ink-box positioning（`inkLeft = -actualBoundingBoxLeft`、`x = box.x - inkLeft`），實際 ink 左緣精確落在 `box.x`。單行，不 multiline、不 wrap、不 auto-shrink。

**已知觀察（非缺陷、未處理）：** 小字 1 在 weighted count 達上限 18 時，實際 ink 右緣可能超出對位 box 右緣約 29px。依共通規則 single line／no wrap／no auto-shrink，renderer 不裁切；對位 box 僅為設計對位框。Jamie Manual Verification 已實機確認可接受，因此未縮字、未改 box、未裁切、未新增 auto-shrink。

### 14.11 文字上限

依第 2.5 節的 online-bn 全版位共通值：主標 **8**、副標 **7**、小字 1 **18**、小字 2 **18**。weighted count 依第 2.4 節（漢字 1、英文／數字／符號 0.5，以 `\p{Script=Han}` 判定）。IME-safe 與超限 rollback 依第 2.7 節。正式 Console 的 initial text 四欄皆為**空字串**。

### 14.12 Renderer-owned 與 baked-in 元素

**renderer-owned**（完整 render component 計 7 項）：rounded-card 背景、style base、主 Lottery Logo、主標、副標、小字 1、小字 2。若以「對位元素」計則為 5 項（Logo ＋ 四個文字欄）。

**baked into style base**（renderer 不另繪製）：白色圓角外框 rim、右側人物、智取櫃／門市場景、彩帶、$1,000,000 彩券、**紅色播放 icon**、右側其他裝飾。

11 **沒有** `secondaryLogo`、CTA、badge 或任何其他 renderer-owned graphic。descriptor 的 top-level 欄位精確為 `id`、`name`、`canvas`、`background`、`horizontalAlign`、`logo`、`textOrder`、`text`、`supersampledFields`、`directFields`、`colorFields`、`styles`、`alignmentOverlaySrc` 十三項。

### 14.13 Manual Verification Viewer

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=11-msbn` |
| Launcher | `開獎秀/01_線上電子BN/launch/11_遊戲大廳 MSBN.command`（100755、port 4176） |
| 對位 overlay | `assets/對位/11_遊戲大廳 MSBN.png` |

11 與 01～10 共用同一個 Viewer 頁面，以 `?layout=` 區分（第 2.15 節）；未知 layout 仍 fail-closed，合法值列舉已加入 `11-msbn`；overlay 由 descriptor 的 `alignmentOverlaySrc` 取得，未新增 11 專屬分支。

Viewer sample 沿用 08 導入的 descriptor-driven `applySampleText(layout)`（第 2.16、11.14 節）：11 的 `textOrder` 為四欄，因此**自然帶入既有四句 sample**；本次**未修改** sample architecture、**未修改** `SAMPLE_TEXT` 四句內容、**無 11-specific branch**。01～07 仍四欄 sample，08、09、10 仍 subtitle-only。

### 14.14 Implementation files

Code Commit `b3b064d` 實際涵蓋的檔案，共 7 paths（2 M ＋ 5 A）：

```text
A  開獎秀/01_線上電子BN/assets/對位/11_遊戲大廳 MSBN.png
A  開獎秀/01_線上電子BN/assets/智取櫃/11_遊戲大廳 MSBN.png
A  開獎秀/01_線上電子BN/assets/門市/11_遊戲大廳 MSBN.png
A  開獎秀/01_線上電子BN/js/layout-11-msbn.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/11_遊戲大廳 MSBN.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 的性質：`online-bn.js` 新增 `LAYOUT_11_MSBN` 的 import 並將其附加於 `LAYOUTS` 末端（順序 01→11，`DEFAULT_LAYOUT_ID` 維持 `01-ddcard-bn`），另同步兩行版位數現況註解；`viewer.html` 僅更新 fail-closed 訊息的合法值列舉字串（加入 `11-msbn`）。**未擴張 registry／storage／URL persistence／selection architecture。**

**Engine Change = NO。** `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆為 **0 modification**；`layout-01-ddcard-bn.js`～`layout-10-skbn-pc.js`、`01_DDcard BN.command`～`10_SKBN_PC.command`、`開獎秀/console.html`、`開獎秀/js/console.js`、`開獎秀/css/console.css`、`開獎秀/js/registry.js`、`快速取件/`、`開獎秀/04_門市清單/` 亦皆未修改。11 的 `rounded-card` 與 local 2× 皆直接沿用既有能力，**未新增任何 engine capability**。

**不在本次 Code Commit 範圍**：12～17 的素材與兩張未使用的橫式舊 Logo 仍為 untracked，不屬於已完成範圍。

### 14.15 Verification 記錄

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 1200 × 380、三張素材 intrinsic 與 SHA-256、`background` 為 `rounded-card` 且 box `55,7,1090×366`／radius 34 並通過 `validateBackground()`、卡片外維持透明且無 full-canvas `fillRect`、兩組 base placement 皆 `55,7,1090×366` 且 1:1、Logo box `135,65,404×66` 與 contain `404.0000 × 65.4875 @ (135.0000, 65.2563)` 且未硬編 destination、四個文字 box 與 Logo 共用左緣 135 故 `horizontalAlign` 為 `left`、`photoshopPt 40/60/23/23` → `canvasPt 30/45/17.25/17.25` 且各自 `=== photoshopPt × 72/96`、font string `30pt`／`45pt`／`17.25pt` 正確、`textOrder` 四欄、`supersampledFields` 為三個 Medium 且 offscreen `2400 × 760`、`directFields` 只有 subtitle、`colorFields` 與 `defaultColors` 皆為四項、`layoutFontFamilies` 為 `["medium","bold"]`、`createInitialState().text` 四欄皆空、無 `secondaryLogo`／CTA／badge、Logo Auto 與 threshold、版位清單與切換、Viewer layout context 與未知值 fail-closed、十一個 launcher port 與 marker、launcher `bash -n` 與 index mode 100755；**protected scope 0 modification、三張 PNG SHA 不變、無第 8 path、`git diff --check` PASS**） |
| 01～10 Regression Verification | **PASS**（十份 descriptor 與十個 launcher blob 0 modification；以 recording mock ctx 錄製 01～10 × 2 style × 3 Logo mode 共 60 組合、2,004 次繪製呼叫，與前一輪有效 baseline 逐行 byte-identical） |
| 04 rounded-card regression | **PASS**（`moveTo(93,27)` ＋ 四段 `arcTo(…, 40)`，radius 40 不變） |
| 10 rounded-card regression | **PASS**（`moveTo(18,7)` ＋ 四段 `arcTo(…, 10)`，radius 10 與副標 `21.375pt` 不變） |
| 06 secondaryLogo regression | **PASS** |
| 08／09／10 subtitle-only regression | **PASS**（各 `fillText` 一次、皆無 offscreen） |
| Viewer sample regression | **PASS**（01～07 仍四欄 sample、08／09／10 仍 subtitle-only、11 四欄；`SAMPLE_TEXT` 與 generic architecture 未更動） |
| Engine boundary | **NO engine change** —— `layout-engine.js`、`preview.js`、`controls.js`、`logo-auto.js`、`css/online-bn.css` 皆 0 modification |
| Browser visual verification | 由 **Jamie 實機 Manual Verification PASS** 認定（非自動化 browser test） |
| Jamie Manual Verification | **PASS**（smart-locker 與 store 畫面、1200 × 380 畫布、卡片外透明、圓角卡片 `55,7,1090×366` radius 34、兩組 style base 位置、Logo contain 與左緣對齊、主標／副標／小字 1／小字 2、播放 icon、alignment overlay 對位、五個元素左緣同線；Logo modes Auto／White／Orange，Auto 下 smart → white、store → orange；四項顏色控制；Viewer 中 11 自動帶入四句 sample；正式 Console 的 11 initial 四欄空白；字數上限 8／7／18／18；01～11 版位切換正常；01～10 無 regression；04 與 10 rounded-card、06 secondaryLogo、08／09／10 subtitle-only、舊 Viewer sample regression 皆正常。**最終 typography 鎖定為主標 40→30pt、副標 60→45pt、小字 23→17.25pt**） |

`git diff --check HEAD^ HEAD` PASS。

## 15. 12_TVBN_一般門市

### 15.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Phase A Repository Investigation | **PASS** |
| Phase B Requirement / Proposal | **COMPLETE / PASS** |
| Phase C Coding | **COMPLETE** |
| Technical Self-Test | **PASS** |
| 01～11 Regression Verification | **PASS** |
| QR Machine Decode | **PASS** |
| Jamie Manual Camera Scan | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `5b665e8bbfc38315673a478493ca7410d3289b7a` |
| Code Commit（short） | `5b665e8` |
| Commit message | `feat(lottery-show): add online BN TVBN store layout` |
| Commit body | 空 |
| Parent | `d2d85da257c837f4d9db07bab459032fe288053a` |
| Docs Commit | Pending |

layout id：`12-tvbn-store`。兩個 style 為 `smart-locker` 與 `store`，共用 descriptor `開獎秀/01_線上電子BN/js/layout-12-tvbn-store.js` 與共用 renderer。12 是 online-bn **第一個使用正式 QR capability 的版位**；所有正式數值以本節 Code Commit 中的 implementation 為準。

### 15.2 Canvas

正式畫布 **1599 × 1080**。renderer 不改變正式 canvas 尺寸；Preview 僅以 CSS display size 等比縮放。

### 15.3 背景

12 不宣告 `background`，沿用 legacy **full-canvas background fill**：`fillRect(0, 0, 1599, 1080)`，填色來源為 `state.colors.background`。**不是 `rounded-card` layout**；底圖未覆蓋處及透明處由背景色呈現。

### 15.4 正式素材

| 角色 | 路徑（相對 Repository root） | 尺寸 | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/12_TVBN_一般門市.png` | 1599 × 1080 | `e50c63cc3f4f451280cb0bdaa8e14860067a0528c70b11518d9199d045192f4e` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/12_TVBN_一般門市.png` | 1599 × 1080 | `f7601e3ca1b7f08a663a5dac699214f5372d31af9540af2db9e05604681d4cdb` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/12_TVBN_一般門市.png` | 1539 × 1080 | `81da90c1630ee338fd9db4cddd9007160674e3c44aeca46b02b3303de51c918d` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

三張 12 PNG 於 Code Commit 前後 SHA-256 不變；對位圖僅供 Viewer DOM overlay，不進正式 renderer。底圖與 Logo 沿用 static asset readiness／intrinsic validation，載入失敗或尺寸不符即 render fail-closed。

### 15.5 底圖 placement

| style | intrinsic | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | 1599 × 1080 | 0 | 0 | 1599 | 1080 |
| `store` | 1539 × 1080 | 60 | 0 | 1539 | 1080 |

兩者皆為原尺寸 **1:1、no stretch、no crop**。store 向右平移 60，右緣 `60 + 1539 = 1599`，不把底圖拉成全畫布寬。

### 15.6 Draw order

**實際 Canvas draw sequence**：

1. background（full-canvas fill）
2. style base（第 15.5 節的 1:1 placement）
3. main Logo（contain、水平 left、垂直 center）
4. optional secondaryLogo（12 未宣告，跳過）
5. optional QR（URL 有效才繪製）
6. local 2× title／small1／small2（offscreen 3198 × 2160，合批貼回）
7. direct subtitle

01～11 未宣告 `qr`，沒有 QR draw operation；既有第二 Logo、rounded-card 與 subtitle-only 分支不受影響。

### 15.7 Main Logo

| 項目 | 值 |
|---|---|
| box | `(59,242,702,113)` |
| intrinsic | 1678 × 272 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | horizontal left、vertical center |
| 模式 | Auto／Orange／White |
| Auto threshold | **0.498708** |
| 預設 Auto 結果 | smart-locker → white；store → orange |

使用既有 `蝦皮大樂透_橘.png`／`蝦皮大樂透_白.png`。由共用 `computeContainRect()` 計算 destination，約為 **`(59,242,697.110294,113)`**；此為推導結果，**不是 hardcoded destination**。不 crop、不 stretch、不取整。12 **無 `secondaryLogo`**。

### 15.8 預設色

| style | background | title | subtitle | small |
|---|---|---|---|---|
| `smart-locker` | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| `store` | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

沿用共通四項顏色控制。small1／small2 共用 `small` color，無第二組小字顏色。

### 15.9 Typography — FINAL

| 元素 | Photoshop source | Canvas renderer | Render path |
|---|---|---|---|
| title | `ShopeeNotoSans(content)-Medium` **83pt** | `62.25pt "LotteryShowNotoSans Medium"` | local 2× |
| subtitle | `ShopeeNotoSans(content)-Bold` **97pt** | `72.75pt "LotteryShowNotoSans Bold"` | direct |
| small1 | `ShopeeNotoSans(content)-Medium` **38pt** | `28.5pt "LotteryShowNotoSans Medium"` | local 2× |
| small2 | `ShopeeNotoSans(content)-Medium` **38pt** | `28.5pt "LotteryShowNotoSans Medium"` | local 2× |

正式換算：`Canvas pt = Photoshop pt × 72 / 96`；83 → 62.25、97 → 72.75、**38 → 28.5**。非整數 pt 原值保留，不取整、不改用 px。

- `supersampledFields`：`["title","small1","small2"]`
- `directFields`：`["subtitle"]`
- `SUPERSAMPLE_SCALE`：**2**；offscreen：**3198 × 2160**
- 只註冊 Medium／Bold，不載入 Regular；字型未就緒即 fail-closed。

**Manual Verification 修改歷史：** Jamie 將 small1／small2 的 Photoshop **40pt → 38pt**、Canvas **30pt → 28.5pt**；後續 metadata correction 同步 `photoshopPt: 38`，`canvasPt: 28.5` 不變。舊值僅為修改歷史，不是正式規格。geometry、font family、local 2×、上限、顏色、Logo 與 QR 皆未因該次字級調整改動。

### 15.10 文字 geometry 與水平對齊

`textOrder`：`["title","subtitle","small1","small2"]`。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| title | 59 | 396 | 691 | 79 | left ink | ink-box center |
| subtitle | 59 | 499 | 690 | 92 | left ink | ink-box center |
| small1 | 59 | 615 | 690 | 39 | left ink | ink-box center |
| small2 | 59 | 660 | 690 | 39 | left ink | ink-box center |

主 Logo 與四個文字 box 共用左緣 59；`horizontalAlign: "left"`，沿用 engine 的實際 ink 左緣對齊，不只設定 `textAlign`。四欄皆為 **single line、no wrap、no auto-shrink**，垂直以 ink-box center 定位。

### 15.11 文字上限與輸入行為

title／subtitle／small1／small2 的 limits 為 **8／7／18／18**。weighted count：Han = 1、non-Han = 0.5（Unicode `Script=Han`）；沿用 IME-safe、超限 rollback。正式 Console initial text 四欄空白；Viewer 使用既有 generic four-field `SAMPLE_TEXT`，不是 production default。

### 15.12 Renderer-owned 與 baked-in 元素

renderer-owned：full-canvas background、style base、main Logo、QR pattern、title、subtitle、small1、small2。

**QR 白卡 `(60,746,220,310)`、掃碼標語與底部蝦皮購物全部 baked into base asset**，不是 renderer graphic，也不是 `secondaryLogo`。人物、場景、彩券及其他底圖美術不另行繪製。Renderer 在白卡內只繪製 QR pattern（含 encoder 輸出的 quiet zone），display box 為 **`(60,785,220,220)`**。

### 15.13 Manual Verification Viewer 與 launcher

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=12-tvbn-store` |
| Launcher | `開獎秀/01_線上電子BN/launch/12_TVBN_一般門市.command` |
| Git mode | **100755** |
| 對位 overlay | `assets/對位/12_TVBN_一般門市.png` |

Viewer 共用既有頁面與 descriptor-driven `applySampleText(layout)`，12 自然帶入四句 sample；未知 layout fail-closed，無 12-specific sample branch。

獨立 launcher 沿用 **127.0.0.1、port 4176、SPX repo root** 作 document root，以 Python `ThreadingHTTPServer` 提供服務；JS／CSS 回 `Cache-Control: no-store`。驗證既有 Viewer marker `data-spx-lottery-show-online-bn-viewer="true"` 後才重用 server，以 **Google Chrome** 開啟 `viewer.html?layout=12-tvbn-store`。port 被其他服務占用、readiness 或啟動失敗時 fail-closed；trap **只清理由自身啟動的 server**，不終止重用的 server。

### 15.14 QR capability／URL／state／control

**Descriptor opt-in 與 state**

12 宣告 `qr.box: (60,785,220,220)` 與 `qr.defaultUrl: "https://shopee.tw/m/spxlottery"`。只有 descriptor 宣告 `qr` 才啟用；`createInitialState()` 由 `descriptor.qr.defaultUrl` 初始化 `qrUrl`。01～11 不新增 `qrUrl`，不載入 QR vendor、不 encode、不 draw QR。

**URL utility**

`js/qr-url-utils.js` 提供 `normalize`、`validate`、`isEmpty`：先 trim，拒絕 embedded whitespace；未含 `://` 時補 `https://`，交由 `new URL()` 解析，只接受解析後的 `http:`／`https:`，有效值使用 `url.href`。空值與非法值的 `normalize` 都回傳 `null`，`isEmpty` 區分 UI feedback；`validate` 回傳有效與否。此 utility 無 DOM、Canvas、state 或 network side effect。

未實作 work-order parser、workspace、jobs、history 或 shortening API。未來工單「縮址」可覆蓋同一個 `qrUrl`，**不代表目前已實作工單串接**。

**Local vendor 與 rendering**

`js/qr-code.js` 按需載入 SPX 本機 vendored **soldair/node-qrcode browser bundle**（`vendor/qrcode.js`，MIT license 見 `vendor/LICENSE.qrcode.txt`），不使用 CDN。SPX AD 僅為已驗證 QR 來源參考，正式 vendor 已納入 SPX，**SPX runtime 不依賴 SPX AD repository**；SPX AD 沒有被本次 implementation 修改。

Encoder 使用 `QRCode.toDataURL()`，error correction **M**、foreground **black**、background **white**；不覆寫 library default **margin 4／scale 4**。generated image 等待 load 與可用的 `decode()` readiness，intrinsic 必須 > 0 且 square，**不要求 intrinsic 220 × 220**，亦不進 static asset cache。

Canvas2D 將完整 QR source 繪於 descriptor box；以局部 `save()`／`restore()` 包住 `imageSmoothingEnabled = false`，不影響其他 drawing。geometry 必須為畫布內、有限數、非零正方形。

**Failure boundary**

| 情況 | 正式行為 |
|---|---|
| 空 URL | 不 load vendor、不 encode、不 draw QR；其餘 BN 正常 render |
| 非法 URL | 不 load vendor、不 encode、不 draw QR；其餘 BN 正常 render |
| vendor／encoder／generated-image readiness failure | 整次 render reject，沿用 Preview fail-closed |
| invalid QR geometry | 整次 render reject，沿用 Preview fail-closed |

**Controls**

`controls.js` 僅對宣告 `qr` 的 layout 顯示「縮址」（目前只有 12），input 為 `type=text`、`inputmode=url`，initial 為 `https://shopee.tw/m/spxlottery`。

- 有效輸入：normalized URL → `qrUrl` → redraw。
- 空值：`qrUrl=""`，不畫 QR。
- 非法輸入：raw input 留供修正，顯示 feedback／`aria-invalid`，`qrUrl=""`，清除舊 QR。
- 合法 blur：回寫 normalized URL。

`online-bn.css` 只增加 QR invalid／feedback 樣式。沒有 shortening API、縮址按鈕、history、download、QR style controls 或 advanced QR settings。

### 15.15 Implementation files

Code Commit `5b665e8` 實際涵蓋 **14 paths（5 M ＋ 9 A）**：

```text
A  開獎秀/01_線上電子BN/assets/對位/12_TVBN_一般門市.png
A  開獎秀/01_線上電子BN/assets/智取櫃/12_TVBN_一般門市.png
A  開獎秀/01_線上電子BN/assets/門市/12_TVBN_一般門市.png
M  開獎秀/01_線上電子BN/css/online-bn.css
M  開獎秀/01_線上電子BN/js/controls.js
A  開獎秀/01_線上電子BN/js/layout-12-tvbn-store.js
M  開獎秀/01_線上電子BN/js/layout-engine.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/js/qr-code.js
A  開獎秀/01_線上電子BN/js/qr-url-utils.js
A  開獎秀/01_線上電子BN/launch/12_TVBN_一般門市.command
M  開獎秀/01_線上電子BN/launch/viewer.html
A  開獎秀/01_線上電子BN/vendor/LICENSE.qrcode.txt
A  開獎秀/01_線上電子BN/vendor/qrcode.js
```

`layout-engine.js` 為 descriptor opt-in QR 做最小整合；controls／CSS 提供 opt-in 縮址欄位。`online-bn.js` 附加 12 descriptor，順序 01→12、預設仍為 `01-ddcard-bn`；`viewer.html` 同步合法 layout 列舉。未擴張 registry、storage、URL persistence 或 sample architecture；01～11 descriptor、既有 launcher、`preview.js` 與 `logo-auto.js` 未修改。13～17 素材及兩張未使用橫式 Logo 仍為 untracked，不在本次 Code Commit 範圍。

### 15.16 Verification 記錄

以下為 Code Commit 前已完成的 Technical／Manual Verification 與提交檢查紀錄，不代表 Documentation Update 重新執行 render tests。

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（canvas 1599 × 1080、兩組 base placement、Logo contain、四個文字 box、最終 typography／metadata、local 2× 與 direct 分工、文字上限、顏色、QR geometry／URL／state／controls／readiness／failure boundary、Viewer 與 launcher） |
| 01～11 Regression Verification | **PASS**（11 layouts × 2 styles × 3 Logo modes = **66 組**，**2,852 recording operations** 與 12 導入前的 HEAD baseline 完全一致；01～11 無 QR state／vendor／encode／draw side effect） |
| 12 render | **PASS**（2 styles × 3 Logo modes = **6 組**） |
| QR Machine Decode | **PASS**（正式 **220 × 220** QR 成功解碼為 `https://shopee.tw/m/spxlottery`） |
| Manual Verification Fix | **PASS**（small1／small2 最終 `photoshopPt: 38`、`canvasPt: 28.5`；geometry 與 QR 不變，metadata correction 後 descriptor contract／syntax PASS） |
| Jamie Manual Camera Scan | **PASS**（Jamie 確認） |
| Jamie Manual Verification | **PASS**（Jamie 確認，最終字級以第 15.9 節為準） |
| Code Commit scope／integrity | **PASS**（精確 14 paths、launcher 100755、三張 committed PNG SHA 正確、vendor／license 與已驗證來源 byte-identical） |
| SPX AD Integrity | **PASS**（唯讀來源，Files Modified 0、Stage 0、Commit NO、Push NO） |

**Vendored-license note：** `vendor/LICENSE.qrcode.txt` 保持與已驗證第三方 MIT license 來源 byte-identical，包含原始 EOF blank line。Code Commit 的完整 `git diff --cached --check` 與提交後 `git diff --check HEAD^ HEAD` 均僅回報該 license 的 `new blank line at EOF`，已核准為 **Accepted Vendored-License Whitespace Exception**；排除該 exact path 後，其餘 13 paths whitespace errors = **0**。未修改 license、未變更 Git config，**不是 repository 全域忽略 whitespace**。

## 16. 13_TVBN_智取店

### 16.1 Status 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | Implemented |
| Phase A Repository Investigation | **PASS** |
| Phase B Requirement / Proposal | **COMPLETE / PASS** |
| Requirement / Decision List | LOCKED / EMPTY |
| Phase C Coding | **COMPLETE** |
| Technical Self-Test | **PASS** |
| 13 Render Matrix | **6 / 6 PASS** |
| QR Machine Decode | **6 / 6 PASS** |
| 01～12 Regression Verification | **72 / 72 PASS** |
| Jamie Manual Verification | **PASS** |
| Jamie Manual Camera Scan | **PASS** |
| Code Commit（full） | `a624afde94a29f3bc522dbd77c4a642b89ca6be8` |
| Code Commit（short） | `a624afd` |
| Commit message | `feat(lottery-show): add online BN smart store TVBN layout` |
| Commit body | 空 |
| Parent | `dc0cf915cdf15c72c1fb86683fffd8ae0e089a2a` |
| Docs Commit | Pending |

layout id：`13-tvbn-smart-store`。兩個 style 為 `smart-locker` 與 `store`，共用 descriptor `開獎秀/01_線上電子BN/js/layout-13-tvbn-smart-store.js` 與共用 renderer。13 直接 reuse 12 已完成的 QR capability，不建立第二套 QR system。

### 16.2 Canvas

正式畫布 **1080 × 1920**。renderer 不改變正式 canvas 尺寸；Preview 僅以 CSS display size 等比縮放。

### 16.3 背景

13 不宣告 `background`，沿用 legacy **full-canvas background fill**：`fillRect(0, 0, 1080, 1920)`，填色來源為 `state.colors.background`。不是 `rounded-card`；底圖未覆蓋處與透明處由背景色呈現。

### 16.4 正式素材

| 角色 | 路徑（相對 Repository root） | intrinsic | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/13_TVBN_智取店.png` | 1080 × 1920 | `3101c8388025707137865f7bdb982a20204ef7f49f9d9599924fb60842593ac0` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/13_TVBN_智取店.png` | 1080 × 1100 | `6948e014846a730f6963d3f984fe6e2bd6955458452bd7bb99c2d751b7b0a242` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/13_TVBN_智取店.png` | 1080 × 1147 | `6d5fedf21525e2ec2dc544c989903a5beaadde193fe319a26867c78d701e3eb6` |
| Logo 橘 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_橘.png` | 1678 × 272 | — |
| Logo 白 | `開獎秀/01_線上電子BN/assets/蝦皮大樂透_白.png` | 1678 × 272 | — |

三張 13 PNG **未修改 bytes**，只是於 Code Commit 納入版本控制；stage 前、staged 與 committed SHA-256 均與 locked values 一致。對位圖僅供 Viewer DOM overlay，不進正式 renderer。底圖與 Logo 沿用既有 static asset readiness／intrinsic validation。

### 16.5 底圖 placement

| style | intrinsic | x | y | width | height |
|---|---|---|---|---|---|
| `smart-locker` | 1080 × 1100 | 0 | 820 | 1080 | 1100 |
| `store` | 1080 × 1147 | 0 | 773 | 1080 | 1147 |

正式 placement 分別為 **`(0,820,1080,1100)`**、**`(0,773,1080,1147)`**。兩者皆為原尺寸 **1:1、no stretch、no crop**，底緣皆為 1920。

### 16.6 Draw order

**實際 Canvas draw sequence**：

1. background（full-canvas fill）
2. style base（第 16.5 節的 1:1 placement）
3. main Logo（contain、horizontal center、vertical center）
4. optional secondaryLogo（13 為 none，未宣告，跳過）
5. optional QR（URL 有效才繪製）
6. local 2× fields：title／small1／small2（offscreen 2160 × 3840，合批貼回）
7. direct subtitle

### 16.7 Main Logo

| 項目 | 值 |
|---|---|
| box | `(212,220,656,105)` |
| intrinsic | 1678 × 272 |
| fit | contain（`scale = min(boxW / srcW, boxH / srcH)`） |
| 對齊 | horizontal center、vertical center |
| 模式 | Auto／Orange／White |
| Auto threshold | **0.498708** |
| 預設 Auto 結果 | smart-locker → white；store → orange |

沿用既有 `蝦皮大樂透_橘.png`／`蝦皮大樂透_白.png`。destination 由 engine 的 `computeContainRect()` 依 box 與 intrinsic 計算，**不是 hardcoded destination contract**；不 crop、不 stretch、不取整。13 **無 renderer `secondaryLogo`**；右下蝦皮購物已 baked into base。

### 16.8 預設色

| style | background | title | subtitle | small |
|---|---|---|---|---|
| `smart-locker` | `#2660ad` | `#fffac8` | `#fff000` | `#fffac8` |
| `store` | `#ffda46` | `#472704` | `#eb1717` | `#472704` |

沿用共通四項顏色控制；small1／small2 共用 `small` color，無第二組小字顏色。

### 16.9 Typography — FINAL

| 元素 | Photoshop source | Canvas renderer | Render path |
|---|---|---|---|
| title | `ShopeeNotoSans(content)-Medium` **89pt** | `66.75pt "LotteryShowNotoSans Medium"` | local 2× |
| subtitle | `ShopeeNotoSans(content)-Bold` **122pt** | `91.5pt "LotteryShowNotoSans Bold"` | direct |
| small1 | `ShopeeNotoSans(content)-Medium` **53pt** | `39.75pt "LotteryShowNotoSans Medium"` | local 2× |
| small2 | `ShopeeNotoSans(content)-Medium` **53pt** | `39.75pt "LotteryShowNotoSans Medium"` | local 2× |

正式換算：`Canvas pt = Photoshop pt × 72 / 96`；**89 × 72 / 96 = 66.75**、**122 × 72 / 96 = 91.5**、**53 × 72 / 96 = 39.75**。非整數 pt 原值保留，不取整、不改用 px；Photoshop source pt 不直接作為 Canvas pt。

- `supersampledFields`：`["title","small1","small2"]`
- `directFields`：`["subtitle"]`
- `SUPERSAMPLE_SCALE`：**2**；offscreen：**2160 × 3840**
- 只註冊 Medium／Bold，不載入 Regular；沿用既有 local 2× 機制與字型 readiness gate。

### 16.10 文字 geometry 與水平對齊

`textOrder`：`["title","subtitle","small1","small2"]`。

| 元素 | x | y | width | height | 水平 | 垂直 |
|---|---|---|---|---|---|---|
| title | 212 | 356 | 656 | 84 | ink-box center | ink-box center |
| subtitle | 115 | 468 | 850 | 115 | ink-box center | ink-box center |
| small1 | 71 | 615 | 939 | 51 | ink-box center | ink-box center |
| small2 | 71 | 681 | 939 | 51 | ink-box center | ink-box center |

正式 boxes：title `(212,356,656,84)`、subtitle `(115,468,850,115)`、small1 `(71,615,939,51)`、small2 `(71,681,939,51)`。

`horizontalAlign: "center"`；文字皆為 horizontal center、vertical ink-box center。Logo／title／subtitle box 水平中心為 540；**small1／small2 box center = 71 + 939 / 2 = 540.5**，不得改成 540。四欄為 **single line、no wrap、no auto-shrink**，小字為兩個獨立欄位。

### 16.11 文字上限與輸入行為

title／subtitle／small1／small2 的 limits 為 **8／7／18／18**。沿用 common weighted count：**Han = 1、non-Han = 0.5**（Unicode `Script=Han`）、IME-safe 與超限 rollback。正式 Console initial 四欄空白；Viewer 沿用第 2.16 節的 **generic four-field `SAMPLE_TEXT`**，不是 production default，無 13-specific sample architecture。

### 16.12 Renderer-owned 與 baked-in 元素

renderer-owned：full-canvas background、style base、main Logo、QR pattern、title、subtitle、small1、small2。

**QR white card `(52,1690,160,190)`、下方「掃碼逛活動頁」與右下蝦皮購物全部 baked into base**，renderer 不重畫；右下品牌不是 `secondaryLogo`。人物、場景、彩券及其他底圖美術亦不另行繪製。QR renderer 只繪製 QR pattern（含 encoder quiet zone），box 為 **`(52,1690,160,160)`**。

### 16.13 Manual Verification Viewer 與 launcher

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=13-tvbn-smart-store` |
| Launcher | `開獎秀/01_線上電子BN/launch/13_TVBN_智取店.command` |
| Git mode | **100755** |
| 對位 overlay | `assets/對位/13_TVBN_智取店.png` |

Viewer 沿用共用頁面、generic sample 與 descriptor-driven overlay；missing layout 仍 default 01，unknown 仍 fail-closed。`online-bn.js` 僅新增 descriptor import／附加於 `LAYOUTS` 與同步現況註解，`DEFAULT_LAYOUT_ID` 不變；切換版位沿用 reset-to-default。

Launcher 沿用 **127.0.0.1、port 4176、SPX repo root、Python ThreadingHTTPServer、JS/CSS no-store、既有 Viewer marker、Google Chrome**。驗證 marker 後才重用 server；非合法服務占用時 fail-closed，trap 只清理由自身啟動的 server。

### 16.14 QR capability／URL／state／control

13 宣告 `qr.box: (52,1690,160,160)`、`qr.defaultUrl: "https://shopee.tw/m/spxlottery"`。直接沿用 12 已完成的 `js/qr-url-utils.js`、`js/qr-code.js`、`vendor/qrcode.js` 與共用 engine／controls，不建立新 QR system；default 與未來工單邊界依第 2.12 節。

- 有效 URL：normalize → validate → encode → draw。
- 空 URL／非法 URL：不 load vendor、不 encode、不 draw QR；其餘 BN 正常 render。
- vendor／encoder／generated-image readiness failure、invalid QR geometry：render reject，沿用 Preview fail-closed。
- QR draw 使用局部 `save()` → `imageSmoothingEnabled=false` → `drawImage` → `restore()`，不影響其他 drawing。
- 縮址 control：initial 為 default URL；有效值 normalize 並 redraw；empty 清空 `qrUrl`；invalid 顯示 feedback／`aria-invalid` 並清除舊 QR；合法 blur 回寫 normalized URL。

**Engine Change = NO；Controls Change = NO；QR Helpers Change = NO；vendor／license 未修改。** 正式工單「縮址」→ `qrUrl` 自動帶入為 **NOT IMPLEMENTED YET**，不代表目前已串接工單。

### 16.15 Implementation files

Code Commit `a624afd` 實際涵蓋 **7 paths（5 A ＋ 2 M）**：

```text
A  開獎秀/01_線上電子BN/assets/對位/13_TVBN_智取店.png
A  開獎秀/01_線上電子BN/assets/智取櫃/13_TVBN_智取店.png
A  開獎秀/01_線上電子BN/assets/門市/13_TVBN_智取店.png
A  開獎秀/01_線上電子BN/js/layout-13-tvbn-smart-store.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/13_TVBN_智取店.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 僅為 13 最小 registration／合法值提示同步與現況註解；未改 DEFAULT_LAYOUT_ID、state／controls／registry／sample architecture。Engine、controls、CSS、QR helpers、vendor／license、01～12 descriptors／launchers、平台 shell 與其他 docs 皆未修改。三張素材只是納入版本控制，**Asset Integrity = PASS**；14～17 素材及兩張未使用橫式 Logo 仍為 untracked。

### 16.16 Verification 記錄

以下保留 Phase C、Jamie Manual Verification 與 Code Commit 已完成的紀錄，**不代表 Documentation Update 重新執行 render tests**。

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS**（descriptor contract、Canvas、base／dynamic geometry、small center 540.5、typography、local 2×／direct、colors、Logo、QR、controls、Viewer、launcher、asset／protected-path integrity） |
| 13 Render Matrix | **6 / 6 PASS**（2 styles × 3 Logo modes；Canvas 1080 × 1920、base、Logo contain／variant、四欄文字／顏色與 QR） |
| QR Machine Decode | **6 / 6 PASS**（正式 Canvas 的 `(52,1690,160,160)` QR 區域） |
| Decoded URL | `https://shopee.tw/m/spxlottery` |
| QR Boundary Tests | **PASS**（empty／invalid skip、vendor／encoder／image readiness／geometry failure reject、正常及 draw exception 後 smoothing restore） |
| 01～12 Regression Verification | **72 / 72 PASS**（12 layouts × 2 styles × 3 Logo modes；停用 GPU／Canvas acceleration 後，與導入 13 前的 HEAD baseline `dc0cf915cdf15c72c1fb86683fffd8ae0e089a2a` 完整 RGBA SHA-256 一致） |
| Controls／Viewer regression | **PASS**（01～11 無 QR control／state；12 QR 行為不變；13 縮址驗證、IME／rollback、切換 reset、generic sample、overlay、missing default 01、unknown fail-closed；01～12 Viewer snapshots 與 baseline 一致） |
| Launcher verification | **PASS**（syntax／executable／precedent；記憶體內替身測試 reuse／foreign-port fail-closed／only-own cleanup；既有 4176 server marker 與 JS/CSS no-store 實測通過，未終止既有 server） |
| Jamie Manual Verification | **PASS**（Jamie 確認 13 視覺正確） |
| Jamie Manual Camera Scan | **PASS**（Jamie 確認 QR 手機實際可掃描） |
| Code Commit scope／integrity | **PASS**（7 paths、5 A／2 M、launcher 100755、三張 committed PNG SHA 正確；`git diff --check HEAD^ HEAD` PASS，無 whitespace exception） |
| Engine／Controls／QR Helpers | **NO change**；直接 reuse 既有共用能力 |

**Regression 首次差異紀錄：** 首次硬體加速 regression 執行時，12 smart-locker 三組曾出現 pixel difference；停用 GPU／Canvas acceleration 後，72 / 72 與上述 HEAD baseline RGBA SHA-256 一致。**目前沒有證據支持將首次差異描述為 renderer bug**，也未為此修改 renderer。此輪未使用持久化 regression harness，未回報 recording operation count，未留下持久化測試圖片。

## 17. 14_繳費機直式BN-立保

### 17.1 Status、identity 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | **Implemented / PASS** |
| Phase A Repository Investigation | **COMPLETE** |
| Phase B Requirement / Proposal | **COMPLETE** |
| Phase C Coding | **COMPLETE** |
| Technical Self-Test | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | `90d7accf1b75c6fcfbec2801f4850d7fe94005b3` |
| Code Commit（short） | `90d7acc` |
| Commit message | `feat(lottery-show): add online BN payment vertical layout` |
| Commit body | 空 |
| Parent | `547151ea7105a181309ff95251f7780fd24e0cde` |
| Scope | **7 paths（5 A ＋ 2 M）** |
| Docs Commit | **Pending** |

14 的正式 identity 為：name `14_繳費機直式BN-立保`、layout id `14-payment-vertical`、descriptor `開獎秀/01_線上電子BN/js/layout-14-payment-vertical.js`、export `LAYOUT_14_PAYMENT_VERTICAL`。13 與 14 在正式 Console 左欄為兩個獨立 selector items；14 不是 13 的 hidden alias，也不共用 13 identity。

### 17.2 與 13 的 rendering contract 關係

**14 Rendering Contract = 13_TVBN_智取店 Rendering Contract。** Canvas、base placement、Logo／文字 geometry、typography、alignment、limits、colors、Logo modes、QR geometry／default URL、draw order 與 controls behavior 均沿用第 16 章鎖定的正式 contract。以下為 14 的必要摘要；未重複列出的細節以第 16 章為準。

| 項目 | 14 正式值 |
|---|---|
| Canvas | **1080 × 1920** |
| smart-locker base | `(0,820,1080,1100)` |
| store base | `(0,773,1080,1147)` |
| Main Logo box | `(212,220,656,105)` |
| title box | `(212,356,656,84)` |
| subtitle box | `(115,468,850,115)` |
| small1 box | `(71,615,939,51)` |
| small2 box | `(71,681,939,51)` |
| limits | title／subtitle／small1／small2 = **8／7／18／18** |
| QR | `(52,1690,160,160)`；default `https://shopee.tw/m/spxlottery` |

| 元素 | Photoshop source | Canvas renderer | Render path |
|---|---|---|---|
| title | Medium **89pt** | **66.75pt** | local 2× |
| subtitle | Bold **122pt** | **91.5pt** | direct |
| small1 | Medium **53pt** | **39.75pt** | local 2× |
| small2 | Medium **53pt** | **39.75pt** | local 2× |

`horizontalAlign` 為 `center`；`supersampledFields` 為 `['title','small1','small2']`，`directFields` 為 `['subtitle']`。字型、色彩、Logo Auto／Orange／White、full-canvas background、實際 draw order、QR 與 controls 的 fail-closed 行為均與第 16 章相同。這是共用正式 rendering contract，不代表 13、14 的素材 bytes 相同。

### 17.3 14 自有正式素材與 Phase A comparison

| 角色 | 路徑（相對 Repository root） | intrinsic | SHA-256 |
|---|---|---|---|
| 對位圖 | `開獎秀/01_線上電子BN/assets/對位/14_繳費機直式BN-立保.png` | 1080 × 1920 | `3101c8388025707137865f7bdb982a20204ef7f49f9d9599924fb60842593ac0` |
| smart-locker 底圖 | `開獎秀/01_線上電子BN/assets/智取櫃/14_繳費機直式BN-立保.png` | 1080 × 1100 | `fba5bb432e7fa37e27c9b5695951c5058207275448f70735eae7beddab2d4190` |
| store 底圖 | `開獎秀/01_線上電子BN/assets/門市/14_繳費機直式BN-立保.png` | 1080 × 1147 | `635e7e5a301432bab9459c975505f24c5af31016da3c4f2def5b07ebbc0724c5` |

Phase A 與 13 素材比較：

| 素材 | byte-identical | RGBA identical | RGBA pixel difference |
|---|---|---|---|
| 對位圖 | YES | YES | 0 |
| smart-locker 底圖 | NO | NO | **4 pixels** |
| store 底圖 | NO | NO | **6 pixels** |

因此 14 必須使用自己的三條 asset paths。這是 **Formal Asset Content Difference**，不是 **Rendering Contract Difference**；不得把 14 描述為直接使用 13 assets。

### 17.4 Thin Derived Descriptor

14 採 **THIN DERIVED DESCRIPTOR**，目的只是在 13／14 rendering contract 完全相同時避免維護兩份 geometry、typography、QR 與 Logo contract：

- 由 `LAYOUT_13_TVBN_SMART_STORE` 作局部 shallow composition。
- 建立 14 自己的 frozen top-level descriptor object、frozen `styles` object 與兩個 frozen style wrappers。
- 共用 13 已 frozen 的 immutable nested rendering contract。
- 僅覆寫 `id`、`name`、`alignmentOverlaySrc`、smart-locker `backgroundSrc` 與 store `backgroundSrc`。
- 13 descriptor **未修改**。

這只是 **13 → 14 的 local composition**；不是 generic alias framework、global inheritance architecture、registry redesign，也未替 15～17 預先抽象。

### 17.5 Viewer、launcher 與 selector

| 項目 | 值 |
|---|---|
| Viewer | `開獎秀/01_線上電子BN/launch/viewer.html?layout=14-payment-vertical` |
| Launcher | `開獎秀/01_線上電子BN/launch/14_繳費機直式BN-立保.command` |
| Git mode | **100755** |
| 對位 overlay | `assets/對位/14_繳費機直式BN-立保.png` |

13、14 各自註冊為獨立 selector item，切換時沿用既有 dispose → fresh `createInitialState()` → remount 行為；兩者各自解析自己的 asset paths。Viewer、launcher、port 4176 與安全機制仍沿用共通實作。

### 17.6 Engine／Controls／QR 與工單邊界

**Engine Change = NO；Controls Change = NO；QR Helpers Change = NO；CSS Change = NO；Vendor Change = NO；13 Descriptor Change = NO。** 14 沿用既有 optional QR capability，default URL 為 `https://shopee.tw/m/spxlottery`。

Work-order Integration 仍為 **NOT IMPLEMENTED YET**。未來正式邊界維持「工單 `縮址` → `qrUrl`」，不得解讀為目前已完成工單串接。

### 17.7 Implementation files

Code Commit `90d7acc` 實際涵蓋 **7 paths（5 A ＋ 2 M）**：

```text
A  開獎秀/01_線上電子BN/assets/對位/14_繳費機直式BN-立保.png
A  開獎秀/01_線上電子BN/assets/智取櫃/14_繳費機直式BN-立保.png
A  開獎秀/01_線上電子BN/assets/門市/14_繳費機直式BN-立保.png
A  開獎秀/01_線上電子BN/js/layout-14-payment-vertical.js
M  開獎秀/01_線上電子BN/js/online-bn.js
A  開獎秀/01_線上電子BN/launch/14_繳費機直式BN-立保.command
M  開獎秀/01_線上電子BN/launch/viewer.html
```

兩個 M 只完成 14 的最小 registration／合法值提示同步與現況註解。Engine、controls、QR helpers、CSS、vendor、13 descriptor 與其他版位皆未修改；三張 14 assets 已以鎖定 SHA 納入版本控制，**Asset Integrity = PASS**。

### 17.8 Verification 與 Jamie Manual Verification 記錄

以下保留 Phase C、Jamie Manual Verification 與 Code Commit 已完成的紀錄，**不代表 Documentation Update 重新執行 render tests**。

| 項目 | 結果 |
|---|---|
| Phase A／B／C | **COMPLETE／COMPLETE／COMPLETE** |
| Technical Self-Test | **PASS** |
| 14 Render Matrix | **6 / 6 PASS** |
| QR Machine Decode | **6 / 6 PASS** |
| Decoded URL | `https://shopee.tw/m/spxlottery` |
| 13 ↔ 14 Switching | **PASS** |
| 01～13 Regression | **78 / 78 PASS** |
| Controls Regression | **PASS** |
| Viewer Verification | **PASS** |
| Launcher Verification | **PASS** |
| Protected Paths | **PASS** |
| Asset Integrity | **PASS** |
| Image Modification | **NO** |
| Jamie Manual Verification | **PASS** |

Jamie 明確人工確認：左側 13／14 為獨立項目、14 可正常選取、smart-locker Preview 正常、store Preview 正常、14 與 13 共用同一視覺 contract、13 ↔ 14 切換正常。本紀錄不延伸為 Jamie 未回報的相機掃描或其他主觀視覺結論。

## 18. 15_繳費機直式BN-博辰

### 18.1 Status、identity 與 Code Commit

| 項目 | 值 |
|---|---|
| Status | **Implemented / PASS** |
| Phase A Repository Investigation | **COMPLETE** |
| Phase B Requirement / Proposal | **COMPLETE** |
| Phase C Coding | **COMPLETE** |
| Technical Self-Test | **PASS** |
| Jamie Manual Verification | **PASS** |
| Code Commit（full） | 59c518cb56085fca67190ab212fbbf557e338014 |
| Code Commit（short） | 59c518c |
| Commit message | feat(lottery-show): add online BN Bochen payment layout |
| Commit body | 空 |
| Parent | 0bfeabc6354605a31223e5900cf1efda82bd5186 |
| Scope | **9 paths（7 A ＋ 2 M）** |
| Docs Commit | **Pending** |

15 的正式 identity：15_繳費機直式BN-博辰、layout id 15-payment-vertical-bochen、descriptor 開獎秀/01_線上電子BN/js/layout-15-payment-vertical-bochen.js、export LAYOUT_15_PAYMENT_VERTICAL_BOCHEN。15 是獨立 selector item，採 Independent Descriptor；分類為 Existing Contract + New Geometry / Assets。

### 18.2 Canvas、正式素材與 placement

正式畫布：**2700 × 3380**。

| 角色 | 路徑 | intrinsic | SHA-256 |
|---|---|---|---|
| 對位圖 | 開獎秀/01_線上電子BN/assets/對位/15_ 繳費機直式BN-博辰.png | 2700 × 3380 | 9f3a06bedf9ef4be8096fbfff379b387a5c587175a8b308a306eabc79160743f |
| smart-locker 底圖 | 開獎秀/01_線上電子BN/assets/智取櫃/15_ 繳費機直式BN-博辰.png | 2700 × 1873 | a53ae4705892eea7a4ce10a70af4685e497b98b65aa1fd44b13cec1d61d3f319 |
| store 底圖 | 開獎秀/01_線上電子BN/assets/門市/15_繳費機直式BN-博辰.png | 2700 × 1794 | 876fa85a4c237a25fb43a9b4d5f101b64c5829d5273d86b040c024a3b5fea842 |
| 蝦皮購物橘 | 開獎秀/01_線上電子BN/assets/蝦皮購物_橘.png | 1119 × 275 | 89fbb241c535b27591a8be1be3f7d90ed7c89625b21a1de2b2030192ed58e3df |
| 蝦皮購物白 | 開獎秀/01_線上電子BN/assets/蝦皮購物_白.png | 1119 × 275 | 70d4fc122b1d4a3ca628cee19a816b5bd5a8d62ed1edb57a53ac6cf19400566d |

檔名中的實際空格必須保留。對位圖僅供 Viewer overlay；底圖皆為 1:1、no stretch、no crop、bottom aligned：smart-locker (0,1507,2700,1873)、store (0,1586,2700,1794)。

### 18.3 Logo、文字與色彩

主 Logo 使用蝦皮大樂透橘／白，intrinsic 1678 × 272，box (513,276,1674,280)，contain。15 新增右上 Shopee Shopping secondaryLogo，使用蝦皮購物橘／白，intrinsic 1119 × 275，box (2107,65,529,131)，contain；不是直式蝦皮購物 Logo。

Logo mode 只有 Auto／Orange／White；主 Logo 與 secondaryLogo 共用同一次 resolved variant。Auto threshold 為 0.498708；smart-locker → White，store → Orange；沒有獨立 control、state 或第二套 luminance 判定。

四個文字 box 均為 center，沿用 ink-box center semantics，共同中心 x = 1350。

| 元素 | box | Font | Photoshop source | Canvas renderer | Render path |
|---|---|---|---:|---:|---|
| title | (513,609,1674,184) | ShopeeNotoSans(content)-Medium | 200pt | 150pt | local 2× |
| subtitle | (350,866,2000,259) | ShopeeNotoSans(content)-Bold | 275pt | 206.25pt | direct |
| small1 | (289,1218,2122,112) | ShopeeNotoSans(content)-Medium | 120pt | 90pt | local 2× |
| small2 | (289,1357,2122,112) | ShopeeNotoSans(content)-Medium | 120pt | 90pt | local 2× |

換算：Canvas pt = Photoshop pt × 72 / 96；非整數原值保留。textOrder 為 ['title','subtitle','small1','small2']，limits 為 8／7／18／18，weighted count 為 Han = 1、non-Han = 0.5，沿用 IME-safe rollback、single line、no wrap、no auto-shrink。

supersampledFields 為 ['title','small1','small2']，directFields 為 ['subtitle']，SUPERSAMPLE_SCALE = 2，local 2× offscreen 為 5400 × 6760。只註冊 Medium／Bold，不載入 Regular。

smart-locker 預設色：#2660ad／#fffac8／#fff000／#fffac8；store：#ffda46／#472704／#eb1717／#472704。15 沒有新增 specific color controls。

### 18.4 QR、draw order 與 work-order boundary

正式 QR renderer box 為 (132,2760,430,430)，default URL 為 https://shopee.tw/m/spxlottery。Base 已包含 white card 與「掃碼逛活動頁」，renderer 只繪製 QR image，不重畫白卡或標語。

原始 source geometry 2538 / 2761 / 429 / 430 不屬於正式 2700 × 3380 renderer coordinates，不採用；(186,2814,324,324) 是 reference QR 黑色 modules bbox，不是 renderer box，亦不採用。

Draw order 沿用 background → style base → main Logo → optional secondaryLogo → optional QR → local 2× fields → direct subtitle。15 啟用 secondaryLogo 與 QR；Engine、Controls、QR Helpers、CSS 均未修改。Work-order「縮址」→ qrUrl 仍為 NOT IMPLEMENTED。

### 18.5 Console、Viewer、launcher 與 Verification

15 於 Console LAYOUTS 中註冊於 14 後方，DEFAULT_LAYOUT_ID 仍為 01；切換沿用 fresh initial state。共用 Viewer 使用 ?layout=15-payment-vertical-bochen，missing layout 仍為 01，unknown layout fail-closed。

Launcher 為 launch/15_繳費機直式BN-博辰.command，mode 100755；沿用 127.0.0.1、port 4176、Python ThreadingHTTPServer、Viewer marker、JS／CSS no-store、Google Chrome、foreign-port fail-closed 與 only-own-server cleanup。

| 項目 | 結果 |
|---|---|
| Technical Self-Test | **PASS** |
| 15 Render Matrix | **6 / 6 PASS** |
| QR Machine Decode | **6 / 6 PASS**，URL 為 https://shopee.tw/m/spxlottery |
| 14 ↔ 15 Switching | **PASS** |
| 01～14 Regression | **84 / 84 PASS** |
| Controls／Viewer／Launcher Verification | **PASS** |
| Asset Integrity／Protected Paths | **PASS** |
| Jamie Manual Verification | **PASS** |

Code Commit 59c518c 實際涵蓋 9 paths（7 A ＋ 2 M）：三張 15 layout PNG、兩張水平蝦皮購物 Logo、15 descriptor、15 launcher，以及 online-bn.js、viewer.html 的最小變更。未包含 docs、Engine、Controls、QR helpers、CSS、vendor、01～14、16～17 或直式蝦皮購物 Logo。

## 19. 目前仍未決項目

以下尚未裁決，下一階段不得自行假設：

- 16～17 除第 2.12 節共通 QR default URL 裁決外的版位規格：尺寸、素材、geometry、字級、字重、顏色、文字欄位、Photoshop source pt。
- online-bn 的 Excel 工單 schema 與匯入流程；已裁決的「縮址」→ `qrUrl` 邊界不代表串接完成，Work-order integration **NOT IMPLEMENTED YET**。
- online-bn 的 JSON／workspace 資料結構。
- online-bn 的 Export、Export encoder、輸出格式與檔名規則（不含第 15.14 節已完成的 local QR encoder）。
- 跨版位是否需要保留各自 state（目前切換版位即重設，見第 2.14 節）。
- 16～17 的 launcher 檔案（Viewer 已為共用，port 沿用 4176）。
- 16～17 素材納入版本控制的時機與範圍。

下一個待製作版位：**16**（16_繳費機下方BN-立保）—— **Pending / NOT STARTED**，尚未開始任何調查、設計或實作。
