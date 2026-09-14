# SPX 生成器－快速取件 Phase 0 完整需求整理

Status: Phase 0 Review 日期：2026-09-09

> 本文件用於 GPT／Codex 接續工作時快速恢復上下文。 目前仍屬 Phase 0
> 需求整理，不代表 Requirement／Proposal 已建立，也不得據此直接進入
> Coding。 未經 Jamie 明確確認 Phase 0 完成前，不得進 Phase 1。

------------------------------------------------------------------------

## 1. 專案與工作範圍

Repository： `/Users/jamie/Documents/SPX`

本對話唯一工作範圍： `快速取件`

預定 route： `/Users/jamie/Documents/SPX/快速取件/`

目前 `快速取件/` 已由 Jamie 建立，現階段僅包含
`docs/SPX_快速取件_Phase0_完整需求整理.md`；其他快速取件程式、assets、launcher、Requirement、Proposal 尚未建立。

禁止： - 不處理「開獎秀」。 - 不返工已 Phase 6 PASS 的 SPX
第一層入口。 - 不修改 `/Users/jamie/Documents/FSS`。 - 不修改
`/Users/jamie/Documents/SPX AD`。 - 不修改 Locked
Architecture，除非新需求確實造成 Architecture Contract
必須變更，且需先由 Jamie 裁決。 - 不自行擴大需求。 - Phase 0
未完成前不得 Coding、建立其他快速取件程式／assets／launcher，或建立
Requirement／Proposal。

可於後續 Phase 2 要求 Codex 對 FSS 做唯讀 Investigation，但不得
write、format、copy-back、commit 或修改 FSS。

------------------------------------------------------------------------

## 2. 既有 SPX 第一層入口

SPX 第一層入口已完成並由 Jamie Phase 6 手動驗證
PASS，不得因快速取件返工。

第一個正式 Code Commit： `721a90240ef70d0b4abab2187365167be82bc309`
short：`721a902` message：`feat: add SPX entry platform`

Repository：SPX Branch：main GitHub Repository：Public

第一層 `tools.json` 已有： 1. 開獎秀 → `開獎秀/` 2. 快速取件 →
`快速取件/`

使用者從 SPX 第一層點「快速取件」後：
**直接進入快速取件三欄式工作介面。** 不建立第二層首頁或額外選單。

SPX 正式 accent： `#EE4D2D`

正式共用字型位於 SPX 根目錄： -
`fonts/ShopeeNotoSans(content)-Regular.woff2` -
`fonts/ShopeeNotoSans(content)-Medium.woff2` -
`fonts/ShopeeNotoSans(content)-Bold.woff2`

快速取件原則上直接共用根層正式字型，不建立字型副本。

------------------------------------------------------------------------

## 3. 開發流程

必須依序：

Phase 0：需求討論與裁決 Phase 1：Requirement Phase 2：Repository
Investigation Phase 3：Proposal Phase 4：Coding Phase 5：AI／Codex 自驗
Phase 6：Jamie 手動驗證 PASS Code Commit 必要時 Docs Update 必要時 Docs
Commit 最後由 Jamie 使用 GitHub Desktop Push

Jamie 未明確說 Phase 6 PASS 前，不得視為人工驗證完成。

GPT： - 需求分析與整理 - Phase 裁決 - 架構判斷 - Review Codex 回報 -
提供可一鍵複製貼給 Codex 的完整純文字指令

Codex： - Repository Precheck - 唯讀 Investigation - Coding -
Verification - Git 操作

不得要求 Jamie 自己操作 Terminal。

------------------------------------------------------------------------

## 4. 工具整體介面

快速取件共有 **15 個項目**。

介面風格、樣式與操作概念參考： `/Users/jamie/Documents/FSS/bn/`

但不得因「參考 FSS BN」自行假定未討論功能也要照搬。

FSS BN 原本綠色系的地方，快速取件改用： `#EE4D2D`

版面： - 左側欄固定寬度。 - 右側欄固定寬度。 - 中間欄響應式。

### 左側欄

-   顯示 01～15。
-   每項顯示「編號＋項目名稱」。
-   不做縮圖。
-   可滑鼠點選。
-   支援鍵盤 ↑／↓ 依序切換。
-   第一次進入時預設選中 `01_DDcard BN`。
-   選取狀態視覺概念沿用 FSS BN，但 accent 改為 SPX `#EE4D2D`。

### 中間欄

-   顯示左側目前選取項目的 Preview。
-   左側切換時立即切換 Preview。
-   Preview 依中間欄可用空間自適應縮放。
-   保持正式成品長寬比例。
-   完整顯示，不裁切、不變形。
-   Preview 顯示倍率不得改變正式 Canvas／Export 像素尺寸。

### 即時 Preview

右側任何會影響成品的操作均即時反映 Preview，不設額外「套用」按鈕。

包含： - KV 上傳／更換／移除。 - 背景色。 - Logo 模式造成的 Logo
切換。 - 主標／副標／小字文字。 - 主標／副標／小字顏色。

------------------------------------------------------------------------

## 5. 15 個正式項目

目前工單原檔： `【美術需求_SPX】快速取件活動宣傳素材_封測.xlsx`

目前確認項目、尺寸、格式：

  \#   項目                            尺寸 格式
  ---- ------------------------ ----------- ------
  01   `01_DDcard BN`               531×792 JPG
  02   `02_HBN`                    1200×360 JPG
  03   `03_LPBN`                   1200×550 JPG
  04   `04_POP UP`                  580×720 PNG
  05   `05_IG`                     900×1600 JPG
  06   `06_FB Post`                1200×630 JPG
  07   `07_TVBN_有人店`           1599×1080 JPG
  08   `08_TVBN_智取店`           1080×1920 JPG
  09   `09_TVBN_旗艦店`           1920×1080 JPG
  10   `10_繳費機直式BN-立保`     1080×1920 JPG
  11   `11_繳費機直式BN-博辰`     2700×3380 JPG
  12   `12_繳費機下方BN-立保`      1040×578 JPG
  13   `13_繳費機下方BN-博辰`       984×309 JPG
  14   `14_AR`                      100×100 JPG
  15   `15_MSBN`                   1200×400 JPG

下載完整專案時，15
張圖片直接使用上述正式項目名稱作為檔名，副檔名依各項目正式格式。

------------------------------------------------------------------------

## 6. 01～13 共用資料

目前已明確確認，01～13 共用：

-   同一張使用者上傳的 KV 圖。
-   同一個背景色。
-   同一個 Logo 模式。
-   同一組主標文字。
-   同一組副標文字。
-   同一組小字文字。
-   同一個主標顏色。
-   同一個副標顏色。
-   同一個小字顏色。

修改一次後，01～13 對應項目同步更新。

14、15 是否使用上述任何共用設定，目前**一律不假定**，等實際做到 14、15
時再討論。

------------------------------------------------------------------------

## 7. 01～13 右側欄正式順序

目前順序鎖定：

1.  匯入工單 Excel 或 暫存檔
2.  上傳／移除 KV
3.  背景色設定
4.  Logo 模式
5.  編輯文字＋顏色
6.  下載完整專案
7.  重設工作區域

第一張 card 內的 Excel 與 JSON 為兩個獨立按鈕，共用單一 status；初始
顯示「尚未匯入檔案」，成功時顯示最後一次成功匯入來源，失敗或取消不覆蓋，
Reset 後回到初始 status。

14、15 沒有主標／副標／小字等文字編輯欄位。 14、15
的右側控制內容等實際做到時再討論，不得提前套用 01～13。

------------------------------------------------------------------------

## 8. Excel 工單 Import

### 基本需求

-   一份 Excel 一次帶入全部 15 個項目的工單資料。
-   01～13 的主標／副標／小字為共用資料。
-   工單格式未來可能修改。
-   Phase 0 **不鎖死 B15／B16／B17 等 Excel mapping**。
-   Import 採固定儲存格、欄位名稱辨識或其他方式，留待 Phase 2
    Investigation／Phase 3 Proposal 裁決。

目前工單可作為現況參考，但不得把目前座標直接視為永久 Architecture
Contract。

### Excel Import 對 Workspace 的影響

Excel Import **只更新 Excel 負責的工單資料**。

不得因重新匯入 Excel 清除： - KV。 - 背景色。 - Logo 模式。 -
主標顏色。 - 副標顏色。 - 小字顏色。 - 其他非 Excel 管理的製作設定。

人工在 Editor 修改文字，只修改 Workspace，不回寫原始 Excel。

重新匯入 Excel 時，以新工單內容覆蓋 Excel 負責的欄位。

### 工單判斷與錯誤

完全不是快速取件工單的 Excel： - 跳錯誤提示。 - 拒絕匯入。 - 原本
Workspace 完全不動。

確認是快速取件工單，但部分資料缺漏： - 仍允許匯入。 - 以本次 Excel
的實際內容為準。 - 缺漏／空白的工單欄位匯入後清空，不保留舊 Workspace
值。

### 字數超限

Excel 匯入文字超限的處理： **完全沿用 FSS BN 現行 Excel Import 行為。**

Phase 2 必須由 Codex 唯讀 Investigation FSS BN
實際行為，不得憑記憶重新設計。

------------------------------------------------------------------------

## 9. 文字規則（01～13）

共用文字：

-   主標：最多 8 字。
-   副標：最多 7 字。
-   小字：最多 14 字。

其中 FSS BN 小字原為 17，快速取件明確改為 14。

### banwords

Editor 手動輸入主標／副標／小字時使用 banwords；規則、判斷與提示行為可
參考 Phase 2 已調查的 FSS BN 現行 Editor pattern。Excel Import 不執行
banwords。

快速取件的正式資料來源為 `/Users/jamie/Documents/SPX/assets/banwords.xlsx`；
不得 runtime 依賴 `/Users/jamie/Documents/FSS/bn/assets/banwords.xlsx`，也不得將
FSS `banwords.xlsx` 複製到 `快速取件/`。不得修改 FSS。

### Editor

手動輸入超過： - 主標 8 - 副標 7 - 小字 14

其限制與提示方式： **完全沿用 FSS BN 現行 Editor 行為。**

文字人工修改即時 Preview，不回寫 Excel。

------------------------------------------------------------------------

## 10. KV 圖

### 共用規則

01～13 共用同一張 KV。

使用規範要求使用者上傳： **透明背景 PNG**

但系統本身不強制只接受 PNG。

瀏覽器可正常解碼的圖片，例如： - PNG - JPG - WebP

均可上傳。

JPG 等沒有透明背景時，不因缺乏透明背景而拒絕，素材正確性由使用者負責。

### 顯示規則

KV： - 保持原始比例。 - 只做等比例縮放。 - 不拉伸。 - 不變形。 -
不自行裁切。

每個項目的 KV geometry（位置／尺寸／顯示範圍）在逐項製作時由 Jamie
指定。

尚未上傳 KV 時： - 不放預設 KV。 - 不放示意圖。 - KV 區域保持空白。 -
其他已有元素正常顯示。

### 上傳操作

右側「上傳 KV」區塊： - 可點擊開啟檔案選擇器。 - 可 Drag & Drop。

Drag & Drop **只有右側「上傳 KV」區塊可以觸發**。
拖到頁面其他區域不得觸發 KV 上傳。

已有 KV 時再上傳／拖入新圖片： - 直接以新 KV 取代舊 KV。 -
不需要額外確認。 - 01～13 全部同步更新。

提供「移除 KV」： - 只清除共用 KV。 - 01～13 回到無 KV 狀態。 -
不影響背景色、Logo 模式、文字或文字顏色。

------------------------------------------------------------------------

## 11. 顏色選擇器

所有需要讓使用者選擇顏色的地方，一律使用同一套 browser-native
`<input type="color">`，並以圓形色票顯示目前顏色。

目前包含： - 背景色。 - 主標顏色。 - 副標顏色。 - 小字顏色。

點擊圓形色票時開啟瀏覽器／作業系統原生 color picker，不顯示 HEX 或 RGB
文字輸入；Workspace 保存 canonical lowercase `#rrggbb`，修改後即時
Preview。

滴管取色目前**不是必要需求**，不在 Phase 0 自行加入。

### 預設顏色

-   背景色：`#fee1d6`
-   主標：`#e27646`
-   副標：`#c80c0c`
-   小字：`#e27646`

上述四個顏色屬於 Workspace 製作設定，**不由 Excel 帶入**。

重新匯入 Excel 時四個顏色全部保留。

------------------------------------------------------------------------

## 12. Logo

系統內建兩種 Logo 素材： - 橘色 Logo：`店到店_橘.png` - 白色
Logo：`店到店_白.png`

Logo 控制名稱： **Logo 模式**

固定三種模式： - 自動 - 橘色 - 白色

預設： **自動**

### 自動模式

系統依目前背景色判斷應使用橘色或白色 Logo，以取得較適當辨識度。

深淺色／亮度演算法與臨界值： **Phase 0 不決定。** 留待 Phase 2
Investigation／Phase 3 Proposal 提出技術方案後由 Jamie 裁決。

### 手動 override

Logo 模式＝橘色： - 強制所有有 Logo 的 01～13 使用橘色 Logo。

Logo 模式＝白色： - 強制所有有 Logo 的 01～13 使用白色 Logo。

人工指定橘色／白色後，即使背景色改變： - 保持人工指定。 -
不被自動判斷覆蓋。

切回「自動」後： - 才重新依背景色判斷。

只有實際有 Logo 的版位受 Logo 模式影響。 沒有 Logo 的版位不受影響。

------------------------------------------------------------------------

## 13. Workspace 暫存 JSON

「下載完整專案」ZIP 內必須包含一份 Workspace JSON 暫存檔。

JSON 定位： **完整 Workspace Snapshot／Restore。**

必須能恢復下載當下的完整工作狀態，包括使用者實際上傳的 KV 圖本身。

因此只拿 JSON 回來匯入後： - 不需要重新上傳 KV。 -
應可恢復保存當下的完整工作狀態。

JSON 需保存 Logo **模式**（auto／orange／white
的概念），不是只保存當下計算出的 Logo 顏色。

實際 JSON schema 留待 Proposal，不在 Phase 0 自行定義。

### Restore 規則

JSON 格式正確、必要資料完整： - 成功匯入。 - 完整覆蓋目前 Workspace。

JSON 格式錯誤，或確認不是快速取件暫存檔： - 跳提示。 - 拒絕匯入。 - 原本
Workspace 完全不動。

確認是快速取件暫存檔、JSON 格式正確，但缺少必要資料： - 先不修改
Workspace。 - 跳提示告知資料不完整。 - 讓使用者決定是否仍要匯入。 -
選擇取消 → Workspace 完全不動。 - 選擇仍要匯入 → 才執行 Restore。

缺少資料時實際 fallback（預設值／空值／其他）目前尚未裁決，留待 JSON
schema 確定時處理。

------------------------------------------------------------------------

## 14. 下載完整專案

無論部分項目是否有內容，都允許下載完整專案。

不得增加「15 項全部有內容才能下載」之類的 validation gate。

每次下載必須輸出： - 01～15 共 15 張最終成品圖片。 - 1 份完整 Workspace
JSON。

ZIP： `快速取件_MMDD.zip`

JSON： `快速取件_MMDD.json`

`MMDD`： - 使用者執行下載當下的本機日期。 - ZIP 與 JSON 使用同一個
MMDD。

例如 9 月 9 日： - `快速取件_0909.zip` - `快速取件_0909.json`

15 張成品圖片： - 直接使用 15 個正式項目名稱當檔名。 -
副檔名依各項目正式輸出格式。

即使某些項目沒有 KV／文字等內容： - 該項仍依當下 Workspace
狀態正常渲染。 - 仍然輸出該項圖片。

各項 JPG／PNG
的實際輸出參數、品質／壓縮等細節，逐項製作時再確認，不在目前全域 Phase 0
自行假定。

------------------------------------------------------------------------

## 15. 重設工作區域

「重設工作區域」： **完整回到快速取件第一次開啟時的初始狀態。**

包含： - 清除已匯入工單資料。 - 清除已上傳 KV。 -
主標／副標／小字回到初始空白。 - 背景色回到 `#fee1d6`。 - 主標色回到
`#e27646`。 - 副標色回到 `#c80c0c`。 - 小字色回到 `#e27646`。 - Logo
模式回到「自動」。 - Preview 回到初始狀態。 - 其他後續被正式定義為
Workspace 狀態的資料亦應恢復初始值。

重設採 native `window.confirm`。使用者確認後才執行完整 Reset；使用者取消時，
Workspace 必須完全不變。

------------------------------------------------------------------------

## 16. 逐項版位製作方式

快速取件採： **一個項目一個項目製作與驗證。**

順序： 01 → 02 → 03 → ... → 15

不得一次自行完成全部 15 項。

每個項目必須提供專用 macOS `.command` 啟動檔，供 Jamie 雙擊後直接使用
Google Chrome 開啟該項目的驗證畫面。

每項需讓 Jamie 實際確認可能包含： - KV geometry。 - Logo geometry。 -
主標 geometry／typography。 - 副標 geometry／typography。 - 小字
geometry／typography。 - 固定底圖／裝飾素材（若該項需要）。 - 顏色。 -
實際排版。 - 其他該項特殊規格。

每項的： - 固定素材。 - 版型構成。 - KV 位置／尺寸。 - Logo
位置／尺寸。 - 主標／副標／小字位置。 - font weight。 - font size。 -
alignment。 - 其他 geometry。

均在實際製作該項時由 Jamie 確認。

**不得因 01 的規格自行推論 02～15。**

Jamie 沒有明確說該項 Phase 6 PASS： - 不得視為完成。 -
不得自行跳到下一項。

14、15 的右側欄與特殊需求： - 到實際製作 14、15 時重新進行需求確認。 -
不得直接套用 01～13。

------------------------------------------------------------------------

## 17. 尚未裁決／留待後續 Phase 的事項

以下不是遺漏，而是刻意不在目前 Phase 0 提前決定：

1.  Excel Import 的永久 mapping／辨識策略。
2.  如何可靠判斷「快速取件工單」。
3.  Logo 自動模式的背景亮度演算法與 threshold。
4.  Workspace JSON schema 與 versioning。
5.  JSON 缺資料且使用者仍選擇匯入時，各缺失欄位的 fallback。
6.  01～15 各項實際 geometry。
7.  01～15 各項 typography。
8.  01～15 是否需要固定底圖／裝飾素材。
9.  各項 JPG／PNG Export 的品質、壓縮與其他輸出細節。
10. 14、15 的右側控制與特殊資料需求。
11. 每項專用 launcher 的實際技術實作方式／route 參數。
12. 是否需要 Architecture Contract 修改；目前沒有裁決需要修改。

上述事項應在適當 Phase 或逐項製作時討論，不得由 GPT／Codex 自行補完。

------------------------------------------------------------------------

## 18. Phase 2 必查的 FSS BN 唯讀參考

進入 Phase 2 後，可要求 Codex對：

`/Users/jamie/Documents/FSS/bn/`

做唯讀 Investigation，至少確認快速取件明確要求沿用的部分：

-   三欄介面與互動的現行實作。
-   左側滑鼠選取與鍵盤 ↑／↓。
-   Editor IME／字數限制現行行為。
-   `banwords.xlsx` 的實際位置、載入、判斷與提示行為。
-   Excel Import 超限的實際處理。
-   重設工作區域的確認提示與實際行為。
-   Preview 自適應顯示方式。
-   Workspace／JSON Restore 可參考的現行做法。
-   ZIP 命名與完整專案 Export 可參考的現行做法。
-   逐版位 launcher／viewer 可參考的現行方式。

FSS 僅能唯讀參考： **禁止任何 write、format、copy-back、commit
或其他修改。**

------------------------------------------------------------------------

## 19. 當前 Phase 裁決

目前狀態： **仍為 Phase 0。**

本文件是目前已討論內容的完整整理，用於 Jamie Review 與後續 GPT／Codex
防錯亂。

目前不得：

-   建立其他快速取件程式／assets／launcher。
-   Coding。
-   建 Requirement。
-   建 Proposal。
-   叫 Codex 開始修改 Repository。
-   修改 Locked Architecture。

下一步應由 Jamie Review 本文件： - 若有漏掉或錯誤 → 繼續 Phase 0
修正。 - 若 Jamie 明確確認 Phase 0 完成 → 才進 Phase 1 Requirement。
