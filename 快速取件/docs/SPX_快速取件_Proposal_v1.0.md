# SPX 生成器－快速取件 Proposal v1.0

Status: Phase 3 Proposal — Awaiting Jamie Approval

## 1. Proposal 定位

本 Proposal 將正式 Requirement 與 Phase 2 Repository Investigation 結果轉成
「快速取件共通平台」可供 Phase 4 Coding 使用的技術方案。所有方案均須等
Jamie 核准後才能實作。

本 Proposal 的決策原則如下：

-   使用 GitHub Pages 可直接部署的 HTML、CSS、原生 JavaScript ES modules。
-   不建立 bundler、framework、backend、database、service worker 或 npm
    runtime architecture。
-   只設計共通平台與後續版位的接點，不製作或猜測 01～15 的正式視覺。
-   FSS BN 只作為已調查行為的唯讀參考，不形成 runtime dependency。
-   Requirement 是產品行為最高依據；FSS 與本 Proposal 不得覆蓋 Requirement。

選擇此方向是因為現有 SPX 與 FSS BN 都能以純靜態前端工作，且需求沒有需要
server-side 能力。更複雜的建置系統不會解決目前的產品問題，反而增加部署、
除錯與 Repository 維護成本。

## 2. Scope／Non-Scope

### 2.1 Scope

-   直接進入三欄 Workspace 的快速取件首頁。
-   15-item registry、左欄選取、鍵盤切換與安全的 14／15 狀態。
-   Workspace state、immutable update、subscription 與 Reset。
-   01～13 固定順序的右欄共通控制。
-   Editor、banwords、Excel Import、KV、顏色與 Logo mode。
-   Workspace JSON Snapshot／Restore。
-   Preview／Export 共用 renderer contract 與 unsupported fail-closed。
-   ZIP／encoder／命名架構。
-   後續專用 launcher 共用的 viewer/query contract。
-   Phase 4 共通平台、Phase 5 自驗與 Phase 6 人工驗證範圍。

### 2.2 Non-Scope

-   01～15 任一正式 geometry、typography、固定底圖、裝飾或 Logo／KV／文字
    位置。
-   判定哪些版位實際有 Logo。
-   14／15 已確認會有 Excel-managed data，但其 schema、mapping、欄位、controls
    與 rendering usage 尚未定義。
-   01～15 正式 renderer、正式輸出壓縮值與專用 `.command` launcher。
-   修改 SPX 第一層入口、`tools.json`、開獎秀、FSS、SPX AD 或 Locked
    Architecture。
-   對其他 SPX 工具新增 banwords 功能。

## 3. Repository facts

-   SPX root 是 `/Users/jamie/Documents/SPX`，branch `main`，本 Proposal
    開始時 HEAD 是 `721a90240ef70d0b4abab2187365167be82bc309`。
-   第一層 `tools.json` 已將快速取件導向 `快速取件/`，不需修改入口。
-   SPX 根層已有三個正式 WOFF2，可由快速取件以相對 URL 共用。
-   SPX 根層已有 `assets/banwords.xlsx`；其 SHA-256 基線是
    `0b88f82d75606a3ad3eaccf3dc03f05c3d34eb79f11bb3ab7e13e6128bfdf4c5`。
-   此 XLSX 的「禁用語」工作表以第 1 列欄名描述禁用語、替換、排除與提示；
    runtime 只讀這張表及所需欄位，不讀其他工作表的業務內容。
-   Repository 內沒有正式 Phase 2 Investigation 報告檔，也沒有 Phase 0 所提
    現況快速取件工單原檔。
-   FSS BN 已實證可參考三欄 grid、list keyboard handling、immutable-ish
    Workspace、IME-safe Editor、renderer routing、Preview fit、atomic import、
    JSZip export 與 launcher lifecycle。
-   FSS BN 的 Excel Import 不執行 banwords，也不做文字超限阻擋；Reset 沒有
    confirmation。快速取件依已修正 Requirement 採不同的 Reset 行為。

## 4. Architecture overview

資料流保持單向：

```text
DOM events / file input
        ↓
validator or parser builds candidate
        ↓
workspace.dispatch(action)
        ↓
pure reducer returns a new state
        ↓
subscribers render list / controls / preview status
        ↓
render service resolves item renderer
        ↓
same renderer path feeds Preview and Export
```

`app.js` 只組裝模組與 DOM event，不保存第二份 Workspace。`workspace.js` 是
唯一 authoritative state。Import、Restore 與 KV decode 都必須先在 state 外
完成 candidate，成功後只 dispatch 一次，避免半套更新。

這個結構對應 Requirement 的 atomic failure、即時 Preview 與完整 Reset。
不採 framework store 或事件匯流排，因為單頁、單 Workspace、固定控制數量用
小型 reducer＋subscriber 已足夠。

## 5. Proposed file tree

```text
快速取件/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── registry.js
│   ├── workspace.js
│   ├── editor.js
│   ├── banwords.js
│   ├── excel-import.js
│   ├── workspace-json.js
│   ├── kv.js
│   ├── color-control.js
│   ├── logo-mode.js
│   ├── renderer.js
│   ├── preview.js
│   ├── export.js
│   └── vendor/
│       ├── xlsx.full.min.js
│       ├── jszip.min.js
│       ├── LICENSE.sheetjs.txt
│       └── LICENSE.jszip.txt
├── launch/
│   └── viewer.html
└── docs/
    ├── SPX_快速取件_Phase0_完整需求整理.md
    ├── SPX_快速取件_Requirement_Specification_v1.0.md
    └── SPX_快速取件_Proposal_v1.0.md
```

下列路徑刻意不在共通平台 Phase 4 建立：

```text
快速取件/assets/              # 等正式 Logo／版位素材獲得裁決與來源
快速取件/js/renderers/        # 01 起逐項建立，未裁決前不放 placeholder
快速取件/launch/*.command     # 01 起逐項建立
```

模組按單一責任拆分，但不再建立額外 repository、package 或 config layer。
這比單一巨型 `app.js` 易驗證，也沒有引入 framework 或 build system。

## 6. 15-item registry

`registry.js` 匯出 frozen array。每筆固定含 `id`、`name`、`width`、`height`、
`format`、`controlsProfile`、`rendererKey` 與 `encoderOptions`。Phase 4 時所有
`rendererKey` 及 production `encoderOptions` 都是 `null`，代表尚未裁決，
不得指向 placeholder renderer。

| id | name | width | height | format | controlsProfile |
|---:|---|---:|---:|:---|:---|
| 01 | `01_DDcard BN` | 531 | 792 | jpg | shared-01-13 |
| 02 | `02_HBN` | 1200 | 360 | jpg | shared-01-13 |
| 03 | `03_LPBN` | 1200 | 550 | jpg | shared-01-13 |
| 04 | `04_POP UP` | 580 | 720 | png | shared-01-13 |
| 05 | `05_IG` | 900 | 1600 | jpg | shared-01-13 |
| 06 | `06_FB Post` | 1200 | 630 | jpg | shared-01-13 |
| 07 | `07_TVBN_有人店` | 1599 | 1080 | jpg | shared-01-13 |
| 08 | `08_TVBN_智取店` | 1080 | 1920 | jpg | shared-01-13 |
| 09 | `09_TVBN_旗艦店` | 1920 | 1080 | jpg | shared-01-13 |
| 10 | `10_繳費機直式BN-立保` | 1080 | 1920 | jpg | shared-01-13 |
| 11 | `11_繳費機直式BN-博辰` | 2700 | 3380 | jpg | shared-01-13 |
| 12 | `12_繳費機下方BN-立保` | 1040 | 578 | jpg | shared-01-13 |
| 13 | `13_繳費機下方BN-博辰` | 984 | 309 | jpg | shared-01-13 |
| 14 | `14_AR` | 100 | 100 | jpg | deferred |
| 15 | `15_MSBN` | 1200 | 400 | jpg | deferred |

14／15 確定未來存在 Excel-managed data；表中的 `deferred` 只表示其 data
schema、mapping 與 controls 尚未裁決，不表示 14／15 可能沒有工單資料。

Registry 是左欄、Canvas 尺寸、正式檔名、viewer allow-list 與 export preflight
的單一來源。它不包含 geometry 或 typography。選擇 registry 是為避免相同的
15 筆資料散落在 DOM、Preview 與 Export；不建立泛用 plugin system，因為目前
只有一個工具與固定 renderer contract。

## 7. Workspace schema

Runtime state v1：

```js
{
  selectedItemId: "01",
  shared: {
    text: { title: "", subtitle: "", small: "" },
    kv: null,
    colors: {
      background: "#fee1d6",
      title: "#e27646",
      subtitle: "#c80c0c",
      small: "#e27646"
    },
    logoMode: "auto"
  },
  excel: {
    sourceName: null,
    items: {
      "01": {}, "02": {}, "03": {}, "04": {}, "05": {},
      "06": {}, "07": {}, "08": {}, "09": {}, "10": {},
      "11": {}, "12": {}, "13": {}, "14": {}, "15": {}
    }
  }
}
```

`shared.kv` 為 `null` 或：

```js
{
  dataUrl: "data:image/...;base64,...",
  mimeType: "image/...",
  fileName: "original-name.ext",
  width: 1200,
  height: 900
}
```

不保存 computed Logo 顏色、decoded `ImageBitmap`、DOM node、Canvas、File object
或 object URL。這些都是 derived/runtime cache，不是 Workspace。

`excel.items` 預留 15 個受 registry 管理的 per-item data object。14／15 已確認
未來存在 Excel-managed data，但 schema、mapping、field names、cell addresses、
anchors、value types、controls、validation 與 rendering usage 均尚未裁決，因此
Phase 4 只保留明確的空 object extension point，不能自行增加欄位。此設計能承載
未來逐項 mapping，但不把未知需求抽象成任意 schema。

## 8. State transition model

`workspace.js` 提供：

-   `getState()`：只讀目前 state reference。
-   `subscribe(listener)`：回傳 unsubscribe function。
-   `dispatch(action)`：經 pure reducer 產生新 root state，無變更則保留原
    reference，不通知 listener。
-   `createInitialState()`：供首次開啟、Reset 與 incomplete JSON fallback
    共用，避免預設值漂移。

最小 action 集合：`SELECT_ITEM`、`UPDATE_TEXT`、`UPDATE_COLOR`、
`SET_LOGO_MODE`、`SET_KV`、`REMOVE_KV`、`COMMIT_EXCEL_IMPORT`、
`REPLACE_WORKSPACE`、`RESET`。

Reducer 只複製被改動的分支；Import／Restore 以已驗證完整 candidate 做單次
commit。開發模式可 shallow-freeze state 以抓 mutation，但不引入 immutable
library。這承接 FSS 的簡單 subscription 優點，同時把更新規則集中成可測試的
pure function。

## 9. 三欄 Workspace DOM／CSS

DOM 固定為：

```text
main.workspace-shell
├── aside.item-column
│   └── nav.item-list
├── section.preview-column
│   └── div.preview-viewport
└── aside.control-column
    └── div.control-scroll
```

CSS 使用 `grid-template-columns: 250px minmax(0, 1fr) 360px`，左右欄固定，
中欄吸收可用空間。頁面 `min-width: 1180px`，較窄視窗允許頁面水平捲動，
避免固定控制欄被壓壞；左右欄各自垂直捲動，中間 Preview 不由 Canvas 內容撐大。

此尺寸沿用已實證的 FSS BN layout 基準並改用 SPX accent `#EE4D2D`。不採拖拉
調整欄寬、container-query layout 或 mobile 重排，因 Requirement 只要求固定
左右欄與 responsive 中欄。

左欄由 registry 建立 15 個 button。Mouse click dispatch `SELECT_ITEM`。
Document keydown 只在非 composing，且 target 不是 item button 以外的
input／textarea／select／button 或 contenteditable 時處理 ArrowUp／ArrowDown。
切換在 01 與 15 端點 clamp，不循環，選中項設 `aria-current="true"` 並捲入
可視區；由 item button 鍵盤切換時 focus 一併移到新選中項。CSS 以
`:focus-visible` 保留非 selected item 的鍵盤可用性；focused 且 selected 時
不另畫 outline，只顯示 selected 本身的一套橘色選取視覺。

01～13 的右欄依 Requirement 七張 control cards 直接由 HTML sections 呈現。
第一張 card 將 Excel 與 JSON 的獨立 file inputs／buttons 放在同一 UI group，
兩套 handler 保持獨立，並共用一行 display-only status：初始為「尚未匯入
檔案」，成功時更新為最後一次成功來源，失敗或取消不更新，Reset 後還原初始
文字；不完整 JSON 經確認並成功匯入時套用同一 JSON 成功顯示規則。03 是
「背景色設定」，色票在 card title 同列右側；05 是單一「編輯文字＋
顏色」卡片，主標、副標、小字各自的色票在 field label 同列右側，Editor 與
counter 在下一列。
Main Preview header 重用左欄既有 display-name helper，保留正式 underscore 並
在其後增加 display spacing；registry 正式名稱與 Viewer header 均不因此更動。
14／15 不套用此 profile，改走第 21 章的安全狀態。

## 10. Preview renderer contract

`renderer.js` 管理 renderer map，公開：

```js
registerRenderer(rendererKey, renderFunction)
renderItemToCanvas({ itemId, stateSnapshot }) -> Promise<HTMLCanvasElement>
```

正式 renderer function contract：

```js
async function render({ ctx, item, state, assets })
```

中央 service 先由 registry 建立全新 Canvas 並設定 backing dimensions 為
`item.width × item.height`，等待根層 WOFF2 與 renderer 宣告的正式 assets
完成，再呼叫 renderer。Renderer 不收到 Preview／Export purpose，避免兩條
geometry 分支。Renderer 不得改 Canvas 像素尺寸，也不得讀 DOM control 值。

選擇單一 contract 是為了保證 Preview 與 Export 同源。未採 class hierarchy、
render graph 或 scene DSL，因每項視覺尚未裁決，提前抽象只會把猜測固化。

## 11. Unsupported renderer fail-closed

當 item 的 `rendererKey` 是 `null`、未註冊、asset 載入失敗或 renderer throw：

-   Preview 清除舊 Canvas，顯示非成品狀態卡：「此版位尚未完成逐項視覺設定」
    與 item 名稱／正式尺寸／格式。
-   狀態卡不是 renderer、不是成品示意圖，也不進入 Export。
-   每次 async Preview 使用遞增 token；較舊 render 完成時不得覆蓋新選項。
-   Export 開始前先同步 preflight 15 個 renderer 與 encoder config。任何一項
    unsupported 時，整次 Export 在建立 ZIP 前停止，列出 item id，不產生
    partial ZIP、透明圖、空白圖或猜測圖。

這不是「內容完整度 gate」。Workspace 即使 KV／文字空白，只要 15 個正式
renderer 與 encoder 已就緒，仍可輸出。Fail-closed 只阻止尚未存在的成品實作
被假裝成正式輸出，因而同時符合固定 15 張輸出與禁止猜 geometry 的要求。

## 12. Editor architecture

01～13 共用三個 Editor field config：title 8、subtitle 7、small 14。單位計算逐
Unicode code point 走訪，ASCII code point `<= 0x7f` 計 0.5，其他計 1。

每個 field 的事件順序：

1.  `compositionstart` 標記 composing。
2.  composing 期間忽略 `input`，不跑 banwords、不計長度、不更新 Workspace。
3.  `compositionend` 只 commit 一次，並抑制同值 trailing input。
4.  commit 先呼叫 `applyBanwords(draft)`。
5.  再對轉換後文字計算單位。
6.  若超限，input rollback 到本次操作前的值、設 `aria-invalid`、顯示 inline
    error，Workspace 不更新。
7.  合法時同步 input 與 banwords 結果、更新 counter、單次 dispatch。

Excel 匯入的超限文字原樣顯示並以 inline 狀態指出目前超限，但 Import 不被
拒絕或修改。使用者後續 Editor commit 仍走上述流程。這不新增 Import
validation，只把 Requirement 的兩種來源行為分開。

架構沿用 FSS 已實證的 IME、banwords-before-length、last-value rollback 與
inline message pattern。未採 debounce、contenteditable 或 rich text，因即時
單行文字欄位不需要這些複雜度。

## 13. banwords runtime architecture

### 13.1 正式來源與載入

`banwords.js` 以 module-relative URL 指向
`../../assets/banwords.xlsx`，由瀏覽器 `fetch()` 取得 SPX 根層正式檔案，
轉為 `ArrayBuffer` 後交由本地 SheetJS 解析。它不 fetch FSS、不使用 CDN，
也不在 `快速取件/` 建立 XLSX 副本。

只讀工作表 `禁用語`。第 1 列必須能解析以下欄名：

-   `禁用語列表` → keyword
-   `改字` → replacement
-   `排除` → exclude
-   第四欄現行提示欄 → message

從第 2 列依原始順序建立 rules；keyword 空白列忽略。欄值轉 string，keyword
僅移除前後空白，replacement／exclude／message 保留內容語意。Header 缺失、
工作表缺失、fetch 或 parse 失敗時，Editor fail-closed：停用三個文字輸入並
顯示共用資源載入錯誤，不能靜默在無 banwords 下編輯。

### 13.2 判斷 engine

沿用 Phase 2 已實證的 FSS Editor pattern：依 rule order 處理、支援排除片段、
literal 與現行 regex-like keyword、替換或刪除、去重提示。無效 regex 退回
literal matching，不執行 XLSX 內任何程式碼或公式。

選擇 runtime 直接解析 XLSX，是因為 Requirement 指定此檔為正式來源，且
GitHub Pages 可靜態 fetch。它避免 build-time generator 與衍生 JS 漂移，也沒有
修改原始 XLSX。成本是首次載入約 1.18 MB XLSX 加 SheetJS；以單次 Promise
cache 解決重複解析，不再加入 cache layer 或 service worker。

Excel Import 明確不呼叫此 engine。

## 14. Excel import architecture

### 14.1 Workbook identification

不依賴檔名。SheetJS 將各 worksheet 轉成 bounded two-dimensional values，對
識別用文字做 NFKC、trim、連續空白合併與 ASCII case-fold。某 worksheet 只有
同時符合以下條件才是候選：

1.  唯一找到 title、subtitle、small 三個 label anchors；現況 aliases 為
    `主標`／`主標題`、`副標`／`副標題`、`小字`／`保護文字`，label 可包含
    括號內字數說明。
2.  同一 worksheet 內至少有一個包含「快速取件」的文字 marker，或至少三個
    registry 正式項目名稱 marker。

零個候選代表非快速取件工單，atomic reject。多個候選代表 ambiguous，亦
atomic reject並列出 worksheet 名稱。這比固定 sheet name 或檔名可靠，也比
模糊分數模型可解釋、可測試。

### 14.2 Mapping strategy

每個 Excel-managed field 使用 descriptor：`fieldId`、`labelAliases`、
`valueOffset`、`scope`。Parser 在 used range 內找 normalized label；label 若是
merged range，value cell 是該 merged range 右方第一格，否則是 label 右方
第一格。因此現行 A15→B15、A16→B16、A17→B17 能被讀取，但 row／column
整體移動後仍可辨識。

Label 重複、value cell 越界或結構歧義時不猜。識別通過但 value blank 是合法
空白，candidate 對應欄位設 `""`，commit 後清除舊值。

後續每個版位只有在逐項資料需求裁決後，才在 registry 對應 item 加入明確
descriptor。14／15 確定未來存在 Excel-managed data，但 Phase 4 保持空
descriptor，不得推論 field names、cell addresses、anchors、value types 或
validation；等 14／15 Requirement 裁決後再擴充 mapping。這讓一份 workbook
最終能更新 15 項資料，但共通平台不先發明未知欄位。

不採永久 cell-address-only mapping，也不建立 OCR、AI inference 或可由使用者
任意配置的 mapping UI。Anchor＋relative value 是針對現況變動的最小穩健層。

### 14.3 Atomic candidate → commit 與 merge scope

流程固定為：讀檔 → parse workbook → identify sheet → resolve descriptors → 收集
errors → 從目前 state 建立 candidate → 只覆蓋 Excel-managed paths → validate
candidate shape → 單次 `COMMIT_EXCEL_IMPORT`。

任何 parse、識別或結構錯誤都不 dispatch。Excel-managed shared paths只有
`shared.text.title/subtitle/small`；per-item paths 只來自日後已裁決 descriptor。
KV、四個 colors、Logo mode、selected item 與其他非 Excel state從目前 state
保留。Excel Import 不執行 banwords、不計算 8／7／14 上限、不修改超限內容。

## 15. KV architecture

File picker 使用 `accept="image/*"` 作選檔提示，但不以 extension 或 MIME 字串
作唯一拒絕依據。Drop listeners 只掛在右欄 KV drop zone；頁面其他區域不註冊
drop-to-upload，並抑制瀏覽器把 drop image 導航開啟的預設行為。
Drop zone 的 DOM 顯示文字只有「點擊或拖曳圖片至此」。Remove 使用明確 button；
KV 為 `null` 時 disabled 且反灰，成功寫入 KV 後 enabled，移除後再次 disabled。

候選檔案先以 FileReader 轉 data URL，再用 `createImageBitmap(blob)`；不支援時
以 `Image` decode fallback。Decode 成功才建立含 natural width／height 的 KV
candidate 並單次 `SET_KV`。Decode 失敗時舊 KV 完全不變。新圖成功即取代舊圖，
不確認；Remove 只 dispatch `REMOVE_KV`。

State 保存 data URL，所以 JSON 可獨立恢復實際影像。Renderer 之後依正式
geometry 用 contain-style 等比例計算；共通平台只提供 decode/cache helper，
不決定任何 item 的位置、框或裁切。未採 IndexedDB、filesystem handle 或
server upload，因單次 Workspace Snapshot 已能滿足需求。

## 16. Color control architecture

每個顏色控制由同一 `color-control.js` factory 建立 native
`<input type="color">`，並以圓形色票呈現。背景色票位於「03 背景色設定」
card title 同列右側；主標、副標、小字與各自色票合併在單一「05 編輯文字＋
顏色」卡片，三個色票分別位於 field label 同列右側。沒有 HEX／RGB 文字
輸入、palette、eyedropper 或 custom color picker。
三個 field label 的 font-size 與「編輯文字＋顏色」中文字相同，原有
font-weight 不變；Editor、counter、色票尺寸與卡片結構均不調整。

Workspace 只保存 canonical lowercase `#rrggbb`；native picker 是既有 state
的單一 view，不建立第二套 color state：

-   picker input 合法時立即轉 canonical HEX 並 dispatch。
-   外部 state change（Reset／JSON Restore）會刷新 picker。

共用 factory 防止四組 conversion 規則漂移。使用 native picker 而非自行做
色盤 canvas，是因其已提供自由選色且不需引入大型 color library。

## 17. Logo Auto algorithm

Logo mode state 只保存 `auto | orange | white`。`resolveLogoVariant(mode,
backgroundHex)` 是 pure function。Manual 直接回傳指定 variant；Auto 使用
WCAG sRGB relative luminance：

1.  將每個 RGB channel 除以 255。
2.  `c <= 0.04045` 時用 `c / 12.92`，否則用
    `((c + 0.055) / 1.055) ^ 2.4`。
3.  `L = 0.2126R + 0.7152G + 0.0722B`。
4.  橘色代表色採 SPX accent `#EE4D2D`，其 `L ≈ 0.236744`；白色採
    `#FFFFFF`。
5.  兩者理論對比相等的背景門檻為 `L = 0.498708`。背景
    `L >= 0.498708` 選 orange，低於門檻選 white。等於門檻固定選 orange，
    避免浮點邊界不確定。

測試案例：

| background | relative L | orange contrast | white contrast | Auto |
|:---|---:|---:|---:|:---|
| `#fee1d6` | 0.797763 | 2.957 | 1.239 | orange |
| `#000000` | 0.000000 | 5.735 | 21.000 | white |
| `#FFFFFF` | 1.000000 | 3.662 | 1.000 | orange |
| `#808080` | 0.215861 | 1.079 | 3.949 | white |
| `#BBBBBB` | 0.496933 | 1.907 | 1.920 | white |
| `#BCBCBC` | 0.502886 | 1.928 | 1.899 | orange |
| `#EE4D2D` | 0.236744 | 1.000 | 3.662 | white |

這是依背景色可重現且容易單元測試的決策。未分析 Logo PNG 每個 pixel，因
asset 尚未納入且 pixel sampling 會增加透明度、抗鋸齒與 cache 複雜度。Mode
改變只觸發 state update；computed variant 不寫入 JSON。哪些 renderer 使用
Logo 仍由逐項裁決。

## 18. JSON schema and restore flow

### 18.1 Format v1

```json
{
  "format": "SPX Quick Pickup Workspace",
  "version": 1,
  "selectedItemId": "01",
  "shared": {
    "text": { "title": "", "subtitle": "", "small": "" },
    "kv": null,
    "colors": {
      "background": "#fee1d6",
      "title": "#e27646",
      "subtitle": "#c80c0c",
      "small": "#e27646"
    },
    "logoMode": "auto"
  },
  "excel": {
    "sourceName": null,
    "items": {
      "01": {}, "02": {}, "03": {}, "04": {}, "05": {},
      "06": {}, "07": {}, "08": {}, "09": {}, "10": {},
      "11": {}, "12": {}, "13": {}, "14": {}, "15": {}
    }
  }
}
```

Required fields 是上述全部 key；`kv` 必須存在但可為 `null`。Text 必須是
string，colors 必須是完整 HEX，logoMode 必須在 allow-list，selected id 必須
在 registry，items 必須只以 registry id 建立 JSON-safe plain object。KV object
必須有合法 image data URL、MIME、檔名、正整數 width／height，且實際 decode
成功。

14／15 的 item data key 是 required extension container，因兩項已確認未來會有
Excel-managed data；在 schema 尚未裁決的 v1 共通平台中，其合法內容只能是
明確的 empty／deferred structure `{}`，不得虛構正式欄位。未來須等 14／15
Requirement 裁決後再定義 schema 與相應 versioning 影響。

### 18.2 Validation levels

-   `reject`：JSON syntax error、root 非 object、format 不符、version 不等於 1。
    顯示 inline error，Workspace 不變。
-   `complete`：所有 required field 型別與值均合法，KV 若存在可 decode。單次
    `REPLACE_WORKSPACE` 完整覆蓋。
-   `incomplete`：format/version 正確，但 required field 缺少或值無效。先建立
    issue list 與 fallback candidate，未確認前不 dispatch。

Unknown keys 在 v1 忽略，不執行、不寫入 state。未採 FSS schema，避免把其
Type、threshold、countdown 等無關欄位帶入快速取件。

### 18.3 Deterministic incomplete fallback

Candidate 從 `createInitialState()` 開始，逐欄 overlay JSON 中「存在且個別
合法」的已知值：

-   缺失／無效 selectedItemId → `01`。
-   缺失／無效 text → 對應空字串。
-   缺失／無效 color → 對應 Requirement default。
-   缺失／無效 logoMode → `auto`。
-   缺失、無效或 decode 失敗的 KV → `null`。
-   缺失／無效 sourceName → `null`。
-   缺失／無效 item entry → 對應 `{}`；其他合法 item entries保留。

提示文字：`暫存檔缺少或包含無效資料，系統將以初始值補齊列出的欄位。仍要匯入嗎？`
後接 issue list。使用 native `window.confirm`：Cancel 不 dispatch；OK 才單次
replace candidate。整個 parse、KV decode、classification 與 candidate build
均先完成，確保 atomic restore。

選擇 field-level overlay 是因它可預測、可列出且不需要 schema migration
framework。Version 不符直接拒絕，避免在沒有 migration contract 時猜轉換。

## 19. Reset flow

Reset 採 native `window.confirm`，提示文字固定為：

> 確定要重設工作區域嗎？已匯入的工單、KV、文字與顏色設定將回到初始狀態。此操作無法復原。

Cancel 不 dispatch，任何 Workspace reference 與欄值完全不變。OK 才 dispatch
`RESET`，reducer 直接回傳 `createInitialState()`：選中 01、Excel data 與 KV
清空、三組文字空白、四組顏色回 defaults、Logo mode 回 auto、Preview 由新
state 重繪或顯示 01 unsupported 狀態。

選 native confirm 是因 Reset 只有單一 yes/no 決策，瀏覽器已提供鍵盤、focus
與 blocking semantics。Custom modal 會增加 focus trap、Escape、backdrop 與
accessibility 實作，對此需求沒有額外價值。

## 20. Export／ZIP architecture

`export.js` 取得一次 immutable state snapshot 與一次 local date code，先執行
15-item preflight。Preflight 通過後依 registry 01→15 順序逐項：建立新 Canvas、
走 `renderItemToCanvas`、走 encoder、立即把 Blob 加入 JSZip，避免重用 Preview
Canvas 或同一 Canvas。

ZIP 內固定包含：

-   `01_DDcard BN.jpg` 至 `15_MSBN.jpg`，名稱、格式依 registry，其中 04 是
    `04_POP UP.png`。
-   `快速取件_MMDD.json`。

ZIP 本身為 `快速取件_MMDD.zip`。`MMDD` 用同一個 `new Date()` 的本機
`getMonth()+1` 與 `getDate()`，各自 `padStart(2, "0")`。不使用 UTC。

JSZip 以 Blob 輸出。JPEG／PNG 已壓縮，因此 ZIP 可使用 JSZip 預設或
DEFLATE level 6；這只影響 ZIP container，不改圖片像素或 encoder 品質。
任何 render／encode 失敗都中止整次 download，不提供 partial ZIP。

## 21. JPG／PNG encoder 與 72 DPI

共通 encoder adapter 使用 Canvas `toBlob`：PNG 為 `image/png`；JPG 為
`image/jpeg` 並要求 registry 提供已由逐項階段核准的 quality。Phase 4
production registry 暫不填 JPG quality，因此 Export preflight fail-closed。
PNG 先使用瀏覽器 native lossless encoder；若後續某版位有容量上限，再於該項
Proposal 評估 UPNG/pako，不提前加入。

共通平台不寫入 72 DPI metadata。Web 成品的正式規格是 pixel dimensions，DPI
metadata 不改變 pixels，Requirement 也未要求 72 DPI。Renderer／encoder
contract 保留可選的 post-encode metadata hook；若某版位後續明確要求 72 DPI，
再加入 byte-level patch 並做該格式測試。

這個選擇避免把 FSS 的特定容量 gate、quality floor、UPNG 與 72 DPI 規則誤套
到快速取件。它仍提供完整 encoder 架構，但不提前裁決逐項輸出參數。

## 22. Preview／Export consistency 與 responsive fit

Preview 與 Export 都呼叫同一 `renderItemToCanvas({itemId, stateSnapshot})`。
Preview 不把畫面 Canvas 傳給 Export，Export 也不讀 CSS display size。

Preview fit 只設定 Canvas CSS width／height：

```text
scale = min(availableWidth / item.width,
            availableHeight / item.height,
            1)
displayWidth  = item.width  × scale
displayHeight = item.height × scale
```

Backing `canvas.width/height` 保持 registry pixel dimensions。中欄以
`ResizeObserver` 監看 preview viewport，只重算現存 Canvas display size，不
重新建立 geometry。`scale` 上限 1 避免低解析 Canvas 被 CSS 放大；若 Jamie
後續希望大畫面放大，屬 display UX 調整，不影響 contract。

## 23. 14／15 fail-closed behavior

14／15 可正常被 mouse／keyboard 選取，左欄 selected state 與中間 item metadata
更新。因 `controlsProfile="deferred"`：

-   右欄不顯示或套用 01～13 的七張 control cards。
-   顯示文字「此版位控制將於逐項製作時確認」，不建立 title／subtitle／small
    fields，也不暗示共用 KV／colors／Logo。
-   Preview 走 unsupported renderer 狀態卡。
-   Workspace／JSON 保留空的 registry-managed item data extension container，
    但不讀取或推論任何尚未定義的 field，不 throw、不 crash。

14／15 確定未來存在 Excel-managed data；此處的空白容器與安全 UI 只承載該
事實，不是 schema、mapping、controls 或 renderer behavior 的決策。

## 24. Launcher／viewer architecture

共用 viewer 路徑提案：`快速取件/launch/viewer.html?item=01`。Query 只接受
兩位 `01`～`15`；名稱、尺寸與 rendererKey 一律由 registry 解析。缺參數、未知
id 或 renderer unsupported 時顯示明確錯誤，不 fallback 到其他項。

後續每個 `.command`：

-   從自身路徑解析 SPX root，不硬編 Jamie home path。
-   使用 `127.0.0.1:4175` 與 `/usr/bin/python3 -m http.server` 從 SPX root
    serve，避開既有 SPX 4174 與 FSS 4173。
-   先以固定 HTML marker 檢查 viewer readiness；port 被非本工具程序占用時
    fail-closed，不 kill 不明程序。
-   URL 為 `http://127.0.0.1:4175/快速取件/launch/viewer.html?item=NN`，
    對 path 正確 URL encode。
-   明確用 `/usr/bin/open -a "Google Chrome" URL`。
-   trap 只停止自身啟動的 server；若已存在正確 viewer server，只開頁面。

Phase 4 共通平台只建立 `viewer.html` contract，不建立 01～15 command。每項
renderer 到其逐項 Phase 並通過實作自驗時才建立該項 launcher，Jamie PASS 前
不進下一項。

## 25. Third-party dependency plan

Phase 4 只需要：

-   SheetJS `xlsx.full.min.js` 0.20.3，供 Excel 工單與根層 banwords XLSX 解析。
-   JSZip `jszip.min.js` 3.10.1，供完整專案 ZIP。

將 FSS 中已驗證的這兩個第三方 distribution bytes 與各自 license 複製到
`快速取件/js/vendor/`，保留 Apache-2.0（SheetJS）與 MIT／GPL dual license
文字；快速取件選擇 JSZip MIT 條款。複製前後比對 SHA-256：SheetJS
`cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`，JSZip
`acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e`。

這是第三方 vendor reuse，不複製 FSS app code 或 banwords XLSX，也不修改 FSS。
不使用相對路徑連到 FSS，不使用 CDN，確保 GitHub Pages 與本機 launcher 都能
獨立執行。不引入 pako／UPNG，除非逐項輸出容量需求日後明確成立。

## 26. Architecture Contract impact assessment

Locked Architecture 已允許快速取件自行管理內部程式與版位，也已規定快速取件
15 個版位及根層共用字型。因此三欄 UI、registry、Workspace、renderer、JSON、
vendor 與 launcher 都不需修改 Contract。

Contract 原本明寫「除正式 Web 字型外，目前不建立其他跨工具共用依賴」。
正式 Requirement 已把 `/Users/jamie/Documents/SPX/assets/banwords.xlsx` 定位為
「SPX 平台共用禁用語來源」。Jamie 已核准 Architecture 更新，本輪已對 Locked
Architecture 做最小修改：

1.  在共用資源原則加入 SPX 根層 `assets/banwords.xlsx` 是平台共用禁用語
    source-of-truth。
2.  說明各工具只有在自身 Requirement 要求時才可使用，不代表所有工具自動
    增加 banwords 功能。
3.  說明工具不得保存此 XLSX 副本，但可各自管理 parser／runtime 衍生策略。

理由是正式資源位置已跨出快速取件工具邊界；更新後 Locked Contract 與
Requirement 已一致。此項核准只涵蓋根層 fonts 與 `assets/banwords.xlsx` 兩類
已核准共用資源，不代表可建立更多未核准的 shared resources，也不替開獎秀
新增 banwords 功能需求。

## 27. Phase 4 exact coding scope

Jamie 核准本 Proposal 後，Phase 4 共通平台只實作：

1.  第 5 章列出的共通平台檔案與兩個 vendor dependency／license。
2.  三欄 Workspace、15-item registry、預設 01、mouse 與 keyboard navigation。
3.  01～13 七張固定順序 control cards；14／15 deferred safe UI 與空白、可擴充的
    registry-managed item data container。
4.  Workspace reducer／subscription／initial state／Reset confirmation。
5.  根層 WOFF2 references，不複製 fonts。
6.  根層 banwords XLSX runtime loader、FSS pattern engine 與 Editor 8／7／14。
7.  Excel identification、anchor mapping、candidate merge 與 atomic commit；
    Phase 4 只 mapping 已確認的 shared text fields。
8.  KV picker／drop zone／decode／replace／remove／data URL state。
9.  四組圓形 native picker 與 Workspace canonical color 同步。
10. Logo mode state 與 Auto pure function／test cases；不放 Logo geometry。
11. JSON v1 serialize／validate／complete restore／incomplete confirm fallback。
12. Renderer registry、unsupported Preview、stale token、responsive fit helper。
13. Export preflight、encoder adapters、JSZip／local MMDD／JSON packaging code；
    因 renderer 與 JPG quality 未裁決，production export 預期 fail-closed。
14. 共用 viewer query allow-list；不建立任何 `.command`。

Phase 4 不建立任何正式 renderer、placeholder Canvas art、Logo／KV geometry、
正式 Logo asset、逐項素材或 launcher。共通平台驗證 PASS 只代表平台 contract
可承載後續版位，不代表 15 張成品已完成。

## 28. Phase 5 AI／Codex verification plan

### 28.1 Static／module checks

-   `git diff --check`、HTML／CSS／JS syntax、所有 module path 與 vendor license。
-   registry 恰有 15 個唯一 id，名稱、尺寸、格式逐項比對 Requirement。
-   搜尋禁止的 FSS runtime path、CDN、font copy、geometry constants、placeholder
    renderer 與 01～15 command。

### 28.2 Pure behavior tests

-   Reducer 每個 action 不 mutation previous state；no-op 不通知；Reset 回完整
    initial state。
-   count units：ASCII 0.5、中文 1、混合與 surrogate code point。
-   Editor：composition、trailing input、banwords-before-length、rollback、inline
    error、Workspace no-update。
-   banwords loader：正確 sheet／header、替換、排除、invalid regex fallback、
    resource failure fail-closed。
-   color：native picker 更新 canonical lowercase HEX，Reset／JSON Restore 後
    picker 與 Workspace 同步。
-   Logo：第 17 章所有案例與 threshold 邊界。
-   JSON：complete、malformed、wrong format/version、每個 required field missing、
    invalid KV、cancel、confirm fallback、single atomic replace。
-   Excel：moved anchors、merged label、blank value、duplicate label、非工單、
    ambiguous worksheets、超限原樣、banwords 不執行、非 Excel state 保留。
-   KV：picker/drop scope、decode failure atomic、replace、remove、JSON round-trip。
-   renderer：unsupported、throw、stale async result、Canvas exact pixels、fit 只改
    CSS size。
-   export：preflight 先於 ZIP、unsupported 不產檔、MMDD local date、registry
    ordering 與 filenames；以測試注入 renderer／encoder 驗證單一路徑，但不把
    test renderer 登記為 production renderer。

### 28.3 Browser verification

以本機靜態 server 在 Google Chrome 測試首次載入、根層 resource URL、三欄
捲動、keyboard ignore rules、IME、file inputs、ResizeObserver 與 viewer invalid
query。測試不得寫入 FSS 或啟動 FSS launcher。

## 29. Phase 6 Jamie manual validation checklist

-   從 SPX 第一層點快速取件，直接進三欄介面，沒有第二層 landing page。
-   左欄名稱與順序 01～15 正確，預設 01，mouse 與 ↑／↓ 行為符合預期。
-   左右欄固定、中欄 responsive；不同視窗尺寸沒有裁切控制欄。
-   01～13 右欄七張 cards 順序正確；01 合併 Excel／JSON buttons 並只保留
    最後一次成功匯入的單一 status；03 為「背景色設定」且色票位於 title
    同列右側；05 為單一「編輯文字＋顏色」卡片，三個 field label 同列右側
    各有獨立圓形色票；14／15 安全顯示 deferred 且不 crash。
-   四組預設色正確，圓形 native picker 與 Workspace 雙向同步，無 HEX／RGB
    文字輸入、palette／eyedropper。
-   Logo mode 有 Auto／橘色／白色，default Auto；背景測試色結果符合第 17 章，
    manual mode 不隨背景變化，切回 Auto 才重新判斷。
-   Editor 中文 IME 正常；banwords 替換／提示、8／7／14 rollback 與 inline error
    符合預期。
-   Excel 合法檔更新 shared text；blank 清空；超限與 banwords 原樣；KV、colors、
    Logo mode 保留；錯誤工單不改 Workspace。
-   KV 可點選及限定區域 drop，非 PNG 可 decode，replace／remove 正確，其他
    state 不受影響。
-   JSON 完整 restore、錯誤 reject、不完整 cancel／confirm fallback 與 KV
    實際圖片 restore 正確。
-   Reset cancel 完全不變，confirm 完整回初始狀態，提示文字可接受。
-   選未完成 renderer 顯示明確狀態，不出現猜測視覺；Download preflight 不產
    partial／placeholder ZIP。
-   Jamie 明確宣告共通平台 Phase 6 PASS 前，不開始 01。

## 30. Risks／mitigations

| Risk | Mitigation |
|:---|:---|
| 根層 XLSX 約 1.18 MB，首次載入有延遲 | 單次 Promise cache；Editor 載入前 disabled；不加 service worker |
| XLSX 欄名或 sheet 被改動 | 明確 header validation 與 inline resource error；不靜默退回舊資料 |
| 工單 layout 移動 | label-anchor＋relative cell；不綁 row number |
| 工單誤判 | 快速取件 marker／registry markers 加三個唯一 anchors；ambiguous reject |
| Excel 超限 state 與 Editor limit 不同 | Import 原樣；Editor 才套 banwords／limit；UI 清楚標示目前超限 |
| 大型 KV 使 JSON／ZIP 變大 | data URL 是完整 restore 的必要成本；不另加未要求的 size limit |
| async image/font render race | candidate decode、font wait、preview token、fresh export Canvas |
| 未完成 renderer 被誤輸出 | registry null、Preview status card、Export all-item preflight |
| Browser encoder 產出差異 | per-item encoder options 與 fixture 後續逐項確認；common phase 不宣稱 final bytes |
| Native confirm 文字無法自訂視覺 | Reset／incomplete restore 只需 binary decision，先換取可靠最小實作 |
| 未核准資源被誤當成平台共用資源 | Architecture 只列 root fonts 與 `assets/banwords.xlsx`；其他資源仍須個別裁決 |

## 31. Explicit deferred per-item visual decisions

下列內容不因本 Proposal 而獲得裁決：

-   01～15 geometry、typography、fixed background／decoration。
-   各項 KV／Logo／title／subtitle／small 的位置、尺寸、字級、字重、對齊。
-   哪些項目有 Logo，以及正式 Logo asset 的來源與落點。
-   每項 JPG quality、PNG compression、容量限制與是否需要 DPI metadata。
-   14／15 已確認存在的 Excel-managed data 之 schema、mapping、field names、
    cell addresses、anchors、value types、validation、右欄 controls、rendering
    usage 與 visual composition。
-   每項 renderer module 與專用 `.command` 的實際建立，仍依 01→15 gate。

## 32. Acceptance criteria

本 Proposal 可進 Phase 4 的條件：

-   Jamie 核准本 Proposal 的純靜態模組架構、JSON v1、Excel anchors、Logo
    threshold、native confirmations、vendor plan 與 fail-closed 定義。
-   第 26 章 banwords Architecture Contract 更新已由 Jamie 核准並完成最小文件
    更新。
-   Phase 4 只做第 27 章，沒有 renderer geometry、assets 或 launcher 擴張。

共通平台 Phase 4／5／6 完成條件：

-   UI、state、Import、KV、colors、Logo mode、JSON、Reset 與 renderer／Export
    contracts 均通過第 28、29 章。
-   15-item registry 完全精確；01～13 共用 state 與右欄順序正確。
-   14／15 具有明確空白的 item data extension container，且與所有 unsupported
    renderer 都安全 fail-closed。
-   FSS、SPX AD、開獎秀與 SPX 第一層保持零修改。
-   Jamie 明確宣告共通平台人工驗證 PASS，才開始 01 的逐項 Phase。

## 33. File-by-file implementation plan

| File | Phase 4 responsibility | Requirement mapping |
|:---|:---|:---|
| `快速取件/index.html` | 三欄 semantic DOM、01～13 七張控制 cards 與 file inputs | 直接進 Workspace、三欄、控制順序 |
| `快速取件/css/styles.css` | 250／responsive／360 grid、scroll、SPX accent、fit/status UI | 三欄、Preview fit、FSS UI 參考邊界 |
| `快速取件/js/app.js` | 組裝 Workspace、views、events、resource startup | 單一入口、即時更新 |
| `快速取件/js/registry.js` | 15 筆正式 metadata、profiles、null renderer/config | 名稱／尺寸／格式、14／15 data extension 與 controls deferred |
| `快速取件/js/workspace.js` | initial state、reducer、dispatch、subscribe | 共用 state、atomic updates、Reset |
| `快速取件/js/editor.js` | IME、count、banwords-first、rollback、inline messages | 8／7／14、FSS Editor pattern |
| `快速取件/js/banwords.js` | fetch／parse 根層 XLSX、rule engine、failure state | SPX 共用來源、Editor banwords |
| `快速取件/js/excel-import.js` | identify、anchor mapping、candidate merge／commit | 一份工單、atomic、preserve non-Excel state |
| `快速取件/js/workspace-json.js` | v1 serialize／validate／fallback／atomic restore | 完整 Snapshot／Restore、KV、Logo mode |
| `快速取件/js/kv.js` | picker／drop-zone／decode／data URL | browser-decodable、replace／remove、比例資料 |
| `快速取件/js/color-control.js` | 圓形 native picker／canonical sync | 四組自由選色與 defaults |
| `快速取件/js/logo-mode.js` | mode enum、WCAG luminance resolver | Auto／manual behavior |
| `快速取件/js/renderer.js` | renderer map、Canvas creation、font/assets wait、errors | single rendering contract、no geometry guess |
| `快速取件/js/preview.js` | async token、unsupported status、CSS fit | 即時切換、完整 fit、display scale only |
| `快速取件/js/export.js` | preflight、fresh Canvas、encoder adapters、JSZip、MMDD | 固定 15＋JSON 的最終架構 |
| `快速取件/js/vendor/xlsx.full.min.js` | local SheetJS 0.20.3 | GitHub Pages XLSX parsing |
| `快速取件/js/vendor/jszip.min.js` | local JSZip 3.10.1 | 完整專案 ZIP |
| `快速取件/js/vendor/LICENSE.*.txt` | vendor license retention | Repository independence／license |
| `快速取件/launch/viewer.html` | item query allow-list、same registry／renderer、errors | 後續專用 launcher 共用 viewer |

本 Proposal 不授權建立上述檔案；只有 Jamie 明確核准並開始 Phase 4 後，才可按
第 27 章實作。

## 34. Decision Resolved／Approved

Jamie 已正式核准：

-   將 SPX 根層 `assets/banwords.xlsx` 正式加入 Locked Architecture Contract，
    定位為「SPX 平台共用禁用語 source-of-truth」。本輪已完成第 26 章所述的
    Architecture 最小文件更新。

Jamie Decision Required remaining items：None。Logo threshold、JSON fallback、
Excel mapping、confirmation、vendor 與 fail-closed 方案均已在本 Proposal 提出
明確選擇，待 Jamie 對 Proposal 整體 Review／Approval，不另留下未定技術分支。
