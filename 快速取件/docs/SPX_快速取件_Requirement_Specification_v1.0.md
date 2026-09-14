# SPX 生成器－快速取件 Requirement Specification v1.0

Status: Phase 1 Requirement

## 1. 文件定位與依據

本文件是 SPX 生成器「快速取件」的正式 Requirement Specification。

本文件依據：

-   Jamie 已確認 PASS 的
    `docs/SPX_快速取件_Phase0_完整需求整理.md`。
-   Jamie 於 Phase 1 新增確認的「共通生成器平台先完成，01～15
    視覺版位後續逐項製作」開發邊界。
-   Jamie 於 Phase 1 新增確認的 FSS BN UI／操作邏輯參考邊界。

本文件只正式化需求，不定義尚未裁決的技術方案。Phase 2 Repository
Investigation、Phase 3 Proposal 與 Phase 4 Coding 均不屬於本文件建立階段。

## 2. Scope

Repository：`/Users/jamie/Documents/SPX`

本專案工作範圍：`/Users/jamie/Documents/SPX/快速取件/`

快速取件生成器的完整需求範圍包括：

-   共通三欄式生成器平台。
-   可承載 01～15 後續視覺版位的 UI、Workspace、Import、KV、顏色、Logo
    模式、Workspace JSON Snapshot／Restore、Reset、Preview／Renderer
    接口與 Export 架構。
-   01～15 共 15 個正式成品項目。
-   01～13 的共用 Workspace 資料與共用控制。
-   01～15 依序逐項製作、驗證與輸出。

## 3. Non-Scope 與既有系統邊界

-   不處理「開獎秀」。
-   不返工或修改已由 Jamie Phase 6 手動驗證 PASS 的 SPX 第一層入口。
-   不修改 SPX 第一層 `tools.json`。
-   不建立第二層首頁或額外選單。
-   不修改 `/Users/jamie/Documents/FSS`。
-   不修改 `/Users/jamie/Documents/SPX AD`。
-   不自行修改 `/Users/jamie/Documents/SPX/docs/架構說明.md` 所定義的
    Locked Architecture。Architecture Contract 是否需要修改仍是 Deferred
    Decision，未經 Jamie 裁決不得假定需要修改。
-   不因參考 FSS BN 而加入快速取件 Requirement 未要求的功能。
-   不在共通平台階段自行完成、猜測或發明 01～15 的實際 geometry、
    typography 或固定素材。
-   不在 14、15 實際製作前自行補完其特殊控制或資料需求。

## 4. 既有 SPX 第一層入口與共用資源

SPX 第一層入口已存在「快速取件」項目，目標為 `快速取件/`。使用者從
SPX 第一層點選「快速取件」後，必須直接進入快速取件三欄式工作介面，不得
建立第二層首頁或額外選單。

SPX 正式 accent 為 `#EE4D2D`。

SPX 平台共用禁用語來源為 `assets/banwords.xlsx`，其正式完整路徑為
`/Users/jamie/Documents/SPX/assets/banwords.xlsx`。快速取件必須使用此共用
資源，不得 runtime 依賴 `/Users/jamie/Documents/FSS/bn/assets/banwords.xlsx`，
也不得在 `快速取件/` 內建立 `banwords.xlsx` 副本。SPX 根層
`banwords.xlsx` 的實際 runtime 載入／衍生資料策略仍須留待 Phase 3 Proposal，
不得在本 Requirement 中自行決定。

快速取件原則上必須直接共用 SPX 根層下列正式 WOFF2 字型，不建立字型副本：

-   `fonts/ShopeeNotoSans(content)-Regular.woff2`
-   `fonts/ShopeeNotoSans(content)-Medium.woff2`
-   `fonts/ShopeeNotoSans(content)-Bold.woff2`

## 5. 開發策略：共通平台先行、視覺版位逐項後做

快速取件採以下開發邊界：

1.  先完成共通生成器平台，再製作 01～15 的視覺版位。
2.  共通平台必須先建立足以承載後續版位的 UI、Workspace、Import、KV、
    顏色、Logo 模式、JSON Restore、Reset、Preview／Renderer 接口與
    Export 架構。
3.  中間 Preview 可先建立共通容器與 renderer routing 架構，但不得為尚未
    逐項確認的版位自行發明 geometry。
4.  第一階段平台實作不得自行完成或猜測 01～15 的實際視覺 geometry、
    typography 或固定素材。
5.  01～15 後續仍須依 01 → 02 → … → 15 的順序逐項製作及驗證。
6.  每個項目仍須提供專用 macOS `.command` launcher。
7.  Jamie 未明確宣告當項人工驗證 PASS 前，不得自行視為該項完成，也不得
    跳到下一項。
8.  14、15 的特殊控制仍須留待實際做到時討論，不得由共通平台階段自行
    補完。

共通平台先行不改變 01～15 最終成品需求，也不構成對任何未裁決版位規格的
預先裁決。

## 6. 三欄式 Workspace

### 6.1 整體版面

-   左側欄固定寬度。
-   右側欄固定寬度。
-   中間欄響應式。

### 6.2 左側欄

-   顯示 01～15。
-   每項顯示「編號＋項目名稱」。
-   不顯示縮圖。
-   可使用滑鼠點選。
-   支援鍵盤 ↑／↓ 依序切換。
-   使用鍵盤切換後，focus 必須跟隨目前選中項目；focused 且 selected 時只
    顯示 selected 本身的一套橘色選取視覺，不得再疊加第二層 focus 外框。
-   第一次進入時預設選中 `01_DDcard BN`。
-   選取狀態的視覺概念參考 FSS BN，但 accent 必須改為 SPX
    `#EE4D2D`。

### 6.3 中間欄與 Preview

-   顯示左側目前選取項目的 Preview。
-   Main Preview header 必須與左側清單採相同 display formatting：保留編號後
    的正式 underscore，並在 underscore 後增加 display spacing；此格式只限
    UI presentation layer，不得改變第 7 章的正式 registry name。
-   左側切換項目時必須立即切換 Preview。
-   Preview 必須依中間欄可用空間自適應縮放。
-   Preview 必須保持正式成品長寬比例，完整顯示、不裁切、不變形。
-   Preview 顯示倍率不得改變正式 Canvas／Export 像素尺寸。
-   右側任何會影響成品的操作均須即時反映於 Preview，不設額外「套用」
    按鈕。
-   即時反映範圍包括 KV 上傳／更換／移除、背景色、Logo 模式造成的 Logo
    切換、主標／副標／小字文字，以及主標／副標／小字顏色。

共通平台階段只需提供共通 Preview 容器與 renderer routing 架構；各項尚未
確認的實際 geometry 不得在此階段自行補完。

## 7. 15 個正式項目

| # | 正式項目名稱 | 尺寸 | 格式 |
|---:|---|---:|:---|
| 01 | `01_DDcard BN` | 531×792 | JPG |
| 02 | `02_HBN` | 1200×360 | JPG |
| 03 | `03_LPBN` | 1200×550 | JPG |
| 04 | `04_POP UP` | 580×720 | PNG |
| 05 | `05_IG` | 900×1600 | JPG |
| 06 | `06_FB Post` | 1200×630 | JPG |
| 07 | `07_TVBN_有人店` | 1599×1080 | JPG |
| 08 | `08_TVBN_智取店` | 1080×1920 | JPG |
| 09 | `09_TVBN_旗艦店` | 1920×1080 | JPG |
| 10 | `10_繳費機直式BN-立保` | 1080×1920 | JPG |
| 11 | `11_繳費機直式BN-博辰` | 2700×3380 | JPG |
| 12 | `12_繳費機下方BN-立保` | 1040×578 | JPG |
| 13 | `13_繳費機下方BN-博辰` | 984×309 | JPG |
| 14 | `14_AR` | 100×100 | JPG |
| 15 | `15_MSBN` | 1200×400 | JPG |

完整專案中的 15 張成品圖片必須直接使用上述正式項目名稱作為檔名，副檔名
依各項目正式格式。

## 8. 01～13 共用 Workspace 資料

01～13 必須共用：

-   同一張使用者上傳的 KV 圖。
-   同一個背景色。
-   同一個 Logo 模式。
-   同一組主標文字。
-   同一組副標文字。
-   同一組小字文字。
-   同一個主標顏色。
-   同一個副標顏色。
-   同一個小字顏色。

上述任一共用資料修改一次後，01～13 對應項目必須同步更新。

14、15 是否使用上述任何共用設定不得假定，必須留待實際製作 14、15 時
討論。

## 9. 01～13 右側欄固定順序

01～13 的右側欄控制順序必須為：

1.  匯入工單 Excel 或 暫存檔
2.  上傳／移除 KV
3.  背景色設定
4.  Logo 模式（自動／橘色／白色）
5.  編輯文字＋顏色
6.  下載完整專案
7.  重設工作區域

第一張 card 將 Excel Import 與 Workspace JSON Restore 合併在同一 UI group，
但兩者仍是獨立功能及獨立 button，不得合併 handler。Card 只保留一行 status，
初始顯示「尚未匯入檔案」；每次成功後顯示最後一次成功匯入的來源資訊，失敗
或取消不得改寫現有 status。不完整 JSON 經確認並成功匯入時，亦依 JSON 成功
規則顯示來源資訊。Reset 確認並完成後，status 回到「尚未匯入檔案」。

14、15 沒有主標／副標／小字等文字編輯欄位。14、15 的右側控制內容必須
等到實際製作時再討論，不得提前套用 01～13。

## 10. Excel 工單 Import

### 10.1 基本需求

-   Phase 0 現況參考工單原檔為
    `【美術需求_SPX】快速取件活動宣傳素材_封測.xlsx`；此檔案只作為現況
    參考，不構成永久 mapping 或 Architecture Contract。
-   一份 Excel 必須可一次帶入全部 15 個項目的工單資料。
-   01～13 的主標／副標／小字是共用資料。
-   工單格式未來可能修改。
-   不得將現況中的 B15／B16／B17 等座標視為永久 mapping 或 Architecture
    Contract。
-   固定儲存格、欄位名稱辨識或其他 mapping／辨識策略仍是 Deferred
    Decision。

### 10.2 Workspace 更新邊界

-   Excel Import 只更新 Excel 負責的工單資料。
-   重新匯入 Excel 不得清除 KV、背景色、Logo 模式、主標顏色、副標顏色、
    小字顏色或其他非 Excel 管理的製作設定。
-   使用者在 Editor 人工修改文字時，只修改 Workspace，不回寫原始 Excel。
-   重新匯入 Excel 時，使用新工單內容覆蓋 Excel 負責的欄位。

### 10.3 判斷、缺漏與 atomic failure 邊界

-   對完全不是快速取件工單的 Excel，系統必須顯示錯誤提示並拒絕匯入；
    原有 Workspace 必須完全不變。
-   對確認是快速取件工單但部分資料缺漏的 Excel，系統仍須允許匯入，並以
    本次 Excel 的實際內容為準。
-   上述工單中缺漏或空白的欄位，匯入後必須清空對應 Workspace 值，不得
    保留舊值。
-   如何可靠判斷「快速取件工單」仍是 Deferred Decision。

### 10.4 超限文字

Excel Import 不因主標 8 字、副標 7 字或小字 14 字超限而拒絕或修改匯入
內容，超限內容原樣進入 Workspace。匯入後使用者在 Editor 編輯時，仍須依
第 11.2 節的正式 Editor 規則處理。

## 11. 文字規則（01～13）

-   主標：最多 8 字。
-   副標：最多 7 字。
-   小字：最多 14 字。

FSS BN 的小字原為 17 字；快速取件必須使用 14 字，不得沿用 17 字。

### 11.1 banwords

-   Editor 手動輸入主標、副標、小字時，必須使用 banwords；規則、判斷與
    提示行為可依 Phase 2 已調查的 FSS BN 現行 Editor pattern 作為參考。
-   Excel Import 不執行 banwords，不得因 banwords 拒絕或修改匯入內容；
    匯入後使用者在 Editor 編輯時，仍依前項正式 Editor 規則處理。
-   快速取件的正式 banwords 資料來源是
    `/Users/jamie/Documents/SPX/assets/banwords.xlsx`，不得 runtime 依賴
    `/Users/jamie/Documents/FSS/bn/assets/banwords.xlsx`，也不得複製 FSS
    `banwords.xlsx` 到 `快速取件/`。
-   SPX 根層 `banwords.xlsx` 的實際 runtime 載入／衍生資料策略仍留待
    Phase 3 Proposal，不得在 Requirement 中自行決定。

### 11.2 Editor

-   Editor 手動輸入超過主標 8 字、副標 7 字或小字 14 字時，其限制與提示
    方式必須完全沿用 FSS BN 現行 Editor 行為。
-   人工修改文字必須即時更新 Preview。
-   人工修改文字不得回寫原始 Excel。

## 12. KV 圖

### 12.1 共用與接受格式

-   01～13 共用同一張 KV。
-   使用規範要求使用者上傳透明背景 PNG，但系統不得強制只接受 PNG。
-   瀏覽器可正常解碼的圖片均可上傳，包括 PNG、JPG、WebP。
-   JPG 等沒有透明背景的圖片不得因缺乏透明背景而被拒絕；素材正確性由
    使用者負責。

### 12.2 顯示規則

-   KV 必須保持原始比例，只做等比例縮放。
-   KV 不得拉伸、變形或自行裁切。
-   每個項目的 KV geometry，包括位置、尺寸與顯示範圍，必須在逐項製作時
    由 Jamie 確認。
-   未上傳 KV 時不得放置預設 KV 或示意圖；KV 區域保持空白，其他已有元素
    正常顯示。

### 12.3 上傳、更換與移除

-   右側「上傳 KV」區塊可點擊開啟檔案選擇器，也支援 Drag & Drop。
-   KV drop zone 只顯示「點擊或拖曳圖片至此」，不得顯示格式說明文字。
-   只有右側「上傳 KV」區塊可以由 Drag & Drop 觸發 KV 上傳；拖到頁面
    其他區域不得觸發。
-   已有 KV 時再次上傳或拖入新圖片，必須直接以新 KV 取代舊 KV，不需額外
    確認，並同步更新 01～13。
-   「移除 KV」只清除共用 KV，使 01～13 回到無 KV 狀態；不得影響背景色、
    Logo 模式、文字或文字顏色。
-   「移除 KV」必須是明確的 button control；沒有 KV 時 disabled 且反灰，
    有 KV 時 enabled，移除後再次 disabled。

## 13. 顏色選擇器與預設顏色

所有需要讓使用者選色的地方必須使用同一套 browser-native
`<input type="color">`，並以圓形色票顯示目前顏色，包括背景色、主標顏色、
副標顏色與小字顏色。

顏色控制必須：

-   背景色卡片只顯示「03 背景色設定」標題與同列右側的圓形色票。
-   主標、副標、小字合併在「05 編輯文字＋顏色」單一卡片；三個欄位各自
    的圓形色票位於「主標／副標／小字」field label 同列右側，文字 Editor
    與字數計數位於下一列。
-   「主標／副標／小字」field label 的 font-size 必須與「編輯文字＋顏色」
    中文字相同；field label 原有 font-weight 必須保持不變。
-   點擊圓形色票時開啟瀏覽器／作業系統原生 color picker。
-   不顯示 HEX 或 RGB 文字輸入。
-   Workspace 仍只保存 canonical lowercase `#rrggbb`；色票必須與 Workspace
    雙向同步，不得建立第二套 color state。
-   修改後即時更新 Preview。

不得自行建立 Google-style custom color picker。滴管取色不是必要需求，
不得在未經裁決下自行加入。

預設顏色必須為：

-   背景色：`#fee1d6`
-   主標：`#e27646`
-   副標：`#c80c0c`
-   小字：`#e27646`

上述四個顏色是 Workspace 製作設定，不由 Excel 帶入；重新匯入 Excel 時
必須全部保留。

## 14. Logo 模式

系統內建兩種 Logo 素材：

-   橘色 Logo：`店到店_橘.png`
-   白色 Logo：`店到店_白.png`

控制名稱必須為「Logo 模式」，且固定提供：

-   自動
-   橘色
-   白色

預設模式為「自動」。

### 14.1 自動模式

自動模式必須依目前背景色決定使用橘色或白色 Logo，以取得較適當辨識度。
實際亮度／對比演算法與 threshold 是 Deferred Decision，須由 Phase 2
Investigation／Phase 3 Proposal 提出技術方案後交由 Jamie 裁決。

### 14.2 手動 override

-   模式為「橘色」時，強制所有實際有 Logo 的 01～13 使用橘色 Logo。
-   模式為「白色」時，強制所有實際有 Logo 的 01～13 使用白色 Logo。
-   人工指定橘色或白色後，即使背景色改變，也必須保持人工指定，不得由
    自動判斷覆蓋。
-   只有切回「自動」後，才重新依背景色判斷。
-   Logo 模式只影響實際有 Logo 的版位；沒有 Logo 的版位不受影響。

## 15. Workspace JSON Snapshot／Restore

### 15.1 Snapshot

-   「下載完整專案」ZIP 內必須包含一份 Workspace JSON 暫存檔。
-   JSON 定位為完整 Workspace Snapshot／Restore。
-   JSON 必須保存下載當下的完整工作狀態，包括使用者實際上傳的 KV 圖
    本身。
-   使用者只匯入 JSON 即可恢復保存當下的完整工作狀態，不須重新上傳 KV。
-   JSON 必須保存 Logo 模式，即 auto／orange／white 的概念，不得只保存
    當下計算出的 Logo 顏色。
-   實際 JSON schema 與 versioning 是 Deferred Decision。

### 15.2 Restore 與 atomic failure 邊界

-   JSON 格式正確且必要資料完整時，成功匯入並完整覆蓋目前 Workspace。
-   JSON 格式錯誤或確認不是快速取件暫存檔時，必須顯示提示並拒絕匯入；
    原有 Workspace 必須完全不變。
-   確認是快速取件暫存檔、JSON 格式正確但缺少必要資料時，必須先保持
    Workspace 不變，顯示資料不完整提示，並讓使用者決定是否仍要匯入。
-   使用者選擇取消時，Workspace 必須完全不變。
-   使用者選擇仍要匯入時，才執行 Restore。
-   缺少資料且使用者仍選擇匯入時，各欄位的 fallback 是 Deferred
    Decision。

## 16. 下載完整專案與 Export

-   無論部分項目是否有內容，均允許下載完整專案。
-   不得加入「15 項全部有內容才能下載」之類的 validation gate。
-   每次下載必須固定輸出 01～15 共 15 張最終成品圖片，以及 1 份完整
    Workspace JSON。
-   ZIP 檔名為 `快速取件_MMDD.zip`。
-   JSON 檔名為 `快速取件_MMDD.json`。
-   `MMDD` 使用使用者執行下載當下的本機日期，ZIP 與 JSON 必須使用同一個
    `MMDD`。例如 9 月 9 日為 `快速取件_0909.zip` 與
    `快速取件_0909.json`。
-   15 張圖片直接使用第 7 章所列正式項目名稱作為檔名，副檔名依各項目的
    正式輸出格式。
-   即使某項沒有 KV、文字或其他內容，仍須依當下 Workspace 狀態正常渲染
    並輸出該項圖片。
-   各項 JPG／PNG 的品質、壓縮與其他輸出參數是 Deferred Decision，須在
    逐項製作時確認。

共通平台階段必須先建立足以承載上述行為的 Export 架構，但不得藉此發明
尚未逐項確認的視覺版位內容。

## 17. 重設工作區域

「重設工作區域」必須使快速取件完整回到第一次開啟時的初始狀態，包括：

-   清除已匯入工單資料。
-   清除已上傳 KV。
-   主標／副標／小字回到初始空白。
-   背景色回到 `#fee1d6`。
-   主標色回到 `#e27646`。
-   副標色回到 `#c80c0c`。
-   小字色回到 `#e27646`。
-   Logo 模式回到「自動」。
-   Preview 回到初始狀態。
-   其他後續被正式定義為 Workspace 狀態的資料亦恢復初始值。

按下「重設工作區域」時，必須先顯示確認提示；只有使用者確認後，才執行上述
完整 Reset。使用者取消時，Workspace 必須完全不變。確認流程的實際技術方式、
最終提示文字與 UI 視覺須留待 Phase 3 Proposal，不得在本 Requirement 中
自行決定。

## 18. FSS BN UI／操作邏輯參考邊界

快速取件共通生成器平台的 UI 樣式與操作邏輯，以現行
`/Users/jamie/Documents/FSS/bn/` 作為主要參考基準，但參考 FSS BN 不代表
整包複製。

必須遵守：

1.  只有快速取件 Requirement 已要求的功能與互動可以參考或沿用 FSS BN。
2.  FSS BN 未被快速取件需求要求的功能，不得因為 FSS 有就自行加入。
3.  FSS BN 綠色系視覺在快速取件必須改用 SPX accent `#EE4D2D`。
4.  快速取件自己的 Workspace、Excel Import、KV、背景色、Logo 模式、文字
    顏色、JSON、Export 等行為，以本 Requirement 為最高依據。
5.  01～15 的 geometry、typography、固定素材不得從 FSS BN 推論。
6.  FSS Repository 在後續 Phase 2 僅允許唯讀 Investigation。
7.  Phase 1 不得開始 Investigation FSS 程式碼。
8.  永遠不得因快速取件修改 `/Users/jamie/Documents/FSS`。

進入 Phase 2 後，FSS BN 的唯讀 Investigation 至少須確認快速取件明確要求
沿用的下列現行行為：

-   三欄介面與互動。
-   左側滑鼠選取與鍵盤 ↑／↓。
-   Editor IME／字數限制。
-   Editor banwords 的規則、判斷與提示 pattern，以及 Excel Import 不執行
    banwords 的現行行為。
-   Excel Import 超限處理。
-   FSS BN Reset 直接執行且不含確認的現況；快速取件不得沿用此點。
-   Preview 自適應顯示。
-   Workspace／JSON Restore 可參考做法。
-   ZIP 命名與完整專案 Export 可參考做法。
-   逐版位 launcher／viewer 可參考方式。

上述 Investigation 僅可唯讀，禁止 write、format、copy-back、commit 或任何
其他修改。

## 19. 逐項版位製作與驗證

-   01～15 必須依 01 → 02 → 03 → … → 15 順序逐項製作與驗證，不得一次
    自行完成全部 15 項。
-   每項必須提供專用 macOS `.command` 啟動檔，供 Jamie 雙擊後直接使用
    Google Chrome 開啟該項驗證畫面。
-   每項需由 Jamie 實際確認的內容可能包括 KV geometry、Logo geometry、
    主標／副標／小字 geometry 與 typography、固定底圖／裝飾素材、顏色、
    實際排版及其他特殊規格。
-   每項的固定素材、版型構成、KV 與 Logo 的位置／尺寸、各文字的位置、
    font weight、font size、alignment 及其他 geometry，均須在實際製作該項
    時由 Jamie 確認。
-   不得因 01 的規格自行推論 02～15。
-   Jamie 未明確宣告當項 Phase 6 人工驗證 PASS 前，不得視為完成，也不得
    跳到下一項。
-   14、15 的右側欄與特殊需求必須在實際製作 14、15 時重新確認，不得直接
    套用 01～13。

## 20. Phase 流程與操作邊界

開發流程必須依序為：Phase 0 需求討論與裁決 → Phase 1 Requirement →
Phase 2 Repository Investigation → Phase 3 Proposal → Phase 4 Coding →
Phase 5 AI／Codex 自驗 → Phase 6 Jamie 手動驗證 PASS → Code Commit →
必要時 Docs Update／Docs Commit → 最後由 Jamie 使用 GitHub Desktop Push。

-   Jamie 未明確宣告 Phase 6 PASS 前，不得視為人工驗證完成。
-   GPT 負責需求分析與整理、Phase 裁決、架構判斷、Review Codex 回報，並
    提供可交付 Codex 的完整指令。
-   Codex 負責 Repository Precheck、唯讀 Investigation、Coding、Verification
    與 Git 操作，但只能在 Jamie 已明確允許的相應 Phase 及範圍內執行。
-   不得要求 Jamie 自行操作 Terminal。

## 21. 明確 Non-Goals

下列項目不是目前已決定的需求或本 Phase 的交付內容：

-   在 Requirement 中選定任何 Deferred Decision 的技術方案。
-   直接實作共通平台或任一視覺版位。
-   在未經逐項確認前完成 01～15 的 geometry、typography 或固定素材。
-   從 FSS BN 推論快速取件未要求的功能或版位規格。
-   將 Google 簡報選色 UI 逐像素複製。
-   強制 KV 只能使用 PNG。
-   提供滴管取色。
-   在完整專案下載前要求 15 項都有內容。
-   人工編輯後回寫原始 Excel。
-   在 14、15 實際製作前定義其特殊控制或資料需求。
-   建立第二層首頁或額外選單。
-   修改 SPX 第一層入口、FSS、SPX AD 或 Locked Architecture。

## 22. Acceptance Criteria

### 22.1 共通平台與介面

-   共通平台具備足以承載後續版位的 UI、Workspace、Import、KV、顏色、Logo
    模式、JSON Restore、Reset、Preview／Renderer 接口及 Export 架構。
-   平台為固定左右欄、響應式中間欄的三欄介面。
-   左欄完整列出 01～15，預設選中 01，支援滑鼠及鍵盤 ↑／↓ 切換。
-   Preview 自適應、保持正式比例、完整顯示，且操作變更即時反映。
-   共通平台沒有自行發明任何尚未確認版位的 geometry、typography 或固定
    素材。

### 22.2 Workspace 與控制

-   01～13 的 KV、背景色、Logo 模式、三組文字與三組文字顏色確實共用並
    同步更新。
-   01～13 右側欄依第 9 章七張 cards 順序呈現。
-   主標、副標、小字分別限制為 8、7、14 字；Editor 使用 banwords 並遵守
    字數限制，Excel Import 不執行 banwords，也不因超限拒絕或修改匯入內容。
-   KV 可點選或在指定區塊 Drag & Drop，上傳後可直接替換或移除；其他頁面
    區域不觸發上傳。
-   KV 保持比例，不拉伸、不變形、不自行裁切。
-   背景色使用「03 背景色設定」標題同列右側的圓形 native 色票；主標、
    副標、小字置於單一「05 編輯文字＋顏色」卡片，且各 field label 同列
    右側有獨立圓形 native 色票，不顯示 HEX／RGB 文字輸入，並即時更新
    Preview。
-   背景、主標、副標、小字的預設色依序為 `#fee1d6`、`#e27646`、
    `#c80c0c`、`#e27646`。
-   Logo 模式具有自動、橘色、白色三種模式，預設自動；手動 override 的
    保持與切回自動行為符合第 14 章。

### 22.3 Import、Restore、Reset 與 Export

-   一份 Excel 可帶入 15 項工單資料，並遵守第 10 章的更新與 atomic
    failure 邊界。
-   Workspace JSON 包含完整工作狀態及實際 KV，保存 Logo 模式，並遵守
    完整、錯誤及缺資料三種 Restore 流程。
-   Reset 前先顯示確認提示，使用者確認後才完整恢復第 17 章所列初始狀態；
    使用者取消時 Workspace 完全不變。
-   無論內容是否完整，下載固定產生 15 張成品圖片及 1 份 Workspace JSON。
-   ZIP、JSON 與 15 張圖片的名稱、日期及副檔名規則符合第 7、16 章。

### 22.4 邊界與逐項驗證

-   FSS BN 只在 Requirement 要求的範圍內作為 UI／操作邏輯參考，且只允許
    唯讀 Investigation；FSS 不被修改。
-   SPX 第一層入口、`tools.json`、SPX AD 及 Locked Architecture 不被自行
    修改。
-   01～15 依指定順序逐項製作，每項有專用 macOS `.command` launcher。
-   每項在 Jamie 明確宣告人工驗證 PASS 前不視為完成，也不進入下一項。
-   14、15 的共用設定、特殊控制及資料需求仍保持 Deferred。

## 23. Open Decisions／Deferred Decisions

以下事項刻意保持未裁決，不得由 Requirement、Investigation 或實作人員自行
補完：

1.  Excel Import 的永久 mapping／辨識策略。
2.  如何可靠判斷「快速取件工單」。
3.  Logo Auto 的背景亮度／對比演算法與 threshold。
4.  Workspace JSON schema 與 versioning。
5.  不完整 JSON 在使用者仍選擇匯入時，各缺失欄位的 fallback。
6.  01～15 各項實際 geometry。
7.  01～15 各項實際 typography。
8.  01～15 是否需要固定底圖／裝飾素材及其內容。
9.  各項 JPG／PNG Export 的品質、壓縮與其他輸出參數。
10. 14、15 的特殊右側控制與資料需求。
11. 每項專用 launcher 的實際技術方式與 route 參數。
12. Architecture Contract 是否需要修改；目前不得假定需要修改。

上述事項須在適當 Phase 或逐項製作時提出方案並由 Jamie 裁決。Phase 2 可做
唯讀 Repository Investigation；Phase 3 才能提出 Proposal。在 Jamie 明確
指示進入相應 Phase 前，不得提前進行。
