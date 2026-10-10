// SPX 開獎秀 — 直播 08：案型字卡_直播獎項說明
// 表格／表格外文字框均為初始 Provisional 對位，待 Chrome 人工校正。

const pt = (value) => value * 300 / 72;
const box = (x, y, width, height) => Object.freeze({ x, y, width, height });

function textField(id, label, fieldBox, photoshopPt, family, colorKey, options = {}) {
  return Object.freeze({
    id, label, box: fieldBox, photoshopPt, fontSizePx: pt(photoshopPt), family, colorKey,
    align: "center", maxWidth: options.maxWidth ?? fieldBox.width,
    multiline: Boolean(options.multiline), maxLines: options.maxLines ?? 1,
    maxCharsPerLine: options.maxCharsPerLine ?? options.limit ?? null,
    limit: options.limit ?? null, lineGapPx: options.lineGapPx ?? 0,
    rendering: options.multiline ? "multiline" : "direct",
    provisional: true
  });
}

function tableField(id, label, path, fieldBox, photoshopPt, family, colorKey, options = {}) {
  return Object.freeze({
    ...textField(id, label, fieldBox, photoshopPt, family, colorKey, options),
    path: Object.freeze(path.split(".")),
    selectable: Boolean(options.selectable),
    autoWrapAfter: options.autoWrapAfter ?? null,
    headerRole: options.headerRole ?? null
  });
}

const headerBoxes = Object.freeze({
  prize: box(139, 345, 119, 54),
  amount: box(269, 345, 213, 54),
  method: box(496, 345, 212, 54),
  example: box(723, 345, 212, 54)
});

const rowBoxes = Object.freeze({
  special: box(136, 407, 807, 94),
  liveLimited: box(136, 507, 807, 73),
  first: box(136, 587, 807, 73),
  second: box(136, 668, 807, 73),
  third: box(136, 749, 807, 73),
  fourth: box(136, 830, 807, 73),
  fifth: box(136, 911, 807, 73)
});

const columns = Object.freeze({
  prize: Object.freeze({ x: 140, width: 117 }),
  amount: Object.freeze({ x: 269, width: 212 }),
  method: Object.freeze({ x: 498, width: 211 }),
  example: Object.freeze({ x: 725, width: 213 })
});

function cellBox(column, row, insetX = 3, insetY = 3) {
  return box(column.x + insetX, row.y + insetY, column.width - insetX * 2, row.height - insetY * 2);
}

function awardRow(id, label, defaults, row, options = {}) {
  const nameBox = cellBox(columns.prize, row, 2, 3);
  const amountBox = cellBox(columns.amount, row, 3, 3);
  const methodBox = cellBox(columns.method, row, 3, 3);
  const exampleBox = cellBox(columns.example, row, 3, 3);
  const fields = options.liveLimited
    ? [
        tableField(id + ".name", "獎項", "awards." + id + ".name", nameBox, 6, "bold", "prizeName", { multiline: true, maxLines: 2, autoWrapAfter: 3, maxWidth: nameBox.width, lineGapPx: 4 }),
        tableField(id + ".amount", "得獎金額", "awards." + id + ".amount", amountBox, 6.4, "bold", "amount", { limit: 6, maxWidth: amountBox.width }),
        tableField(id + ".limitedBig", "直播限定獎大字", "awards." + id + ".big", box(495, row.y + 5, 440, 37), 6, "medium", "limited", { maxWidth: 440 }),
        tableField(id + ".limitedSmall", "直播限定獎小字", "awards." + id + ".small", box(495, row.y + 40, 440, 29), 4.8, "regular", "limited", { maxWidth: 440 })
      ]
    : [
        tableField(id + ".name", "獎項", "awards." + id + ".name", nameBox, 6, "bold", "prizeName", { multiline: true, maxLines: 2, autoWrapAfter: 3, maxWidth: nameBox.width, lineGapPx: 2 }),
        tableField(id + ".amount", "得獎金額", "awards." + id + ".amount", amountBox, 6.4, "bold", "amount", { limit: 6, maxWidth: amountBox.width }),
        tableField(id + ".method", "中獎方式", "awards." + id + ".method", methodBox, 4.47, "medium", "body", { multiline: true, maxLines: 3, maxCharsPerLine: 11, selectable: true, lineGapPx: 2 }),
        tableField(id + ".example", "得獎範例", "awards." + id + ".example", exampleBox, 4.47, "medium", "body", { multiline: true, maxLines: 3, maxCharsPerLine: 11, selectable: true, lineGapPx: 2 })
      ];
  return Object.freeze({
    id, label, kind: options.liveLimited ? "live-limited" : "award",
    fields: Object.freeze(fields),
    defaultText: Object.freeze(defaults),
    provisional: true
  });
}

function headerCell(id, label, fieldBox, bigText, smallText = "") {
  const bigField = tableField(
    `header.${id}.big`, `${label}大字`, `headers.${id}.big`, fieldBox,
    6, "bold", "header", { maxWidth: fieldBox.width, headerRole: "big" }
  );
  const smallField = tableField(
    `header.${id}.small`, `${label}小字`, `headers.${id}.small`, fieldBox,
    3.2, "regular", "header", { maxWidth: fieldBox.width, headerRole: "small" }
  );
  return Object.freeze({ id, label, box: fieldBox, bigField, smallField, lineGapPx: 4 });
}

const headerGroups = Object.freeze([
  headerCell("prize", "獎項", headerBoxes.prize),
  headerCell("amount", "得獎金額", headerBoxes.amount),
  headerCell("method", "中獎方式", headerBoxes.method),
  headerCell("example", "得獎範例", headerBoxes.example)
]);
const headers = Object.freeze(headerGroups.flatMap((group) => [group.bigField, group.smallField]));

const rows = Object.freeze([
  awardRow("special", "特別獎", {
    name: "特別獎", amount: "NT$1,000,000",
    method: "手機號碼後六碼\n與當期開獎六碼完全相同\n+特別號+當期開獎門市",
    example: "用戶手機號碼為\n0988-127646\n取件松菸旗艦店 17:25"
  }, rowBoxes.special),
  awardRow("liveLimited", "直播限定獎", {
    name: "直播限定獎", amount: "NT$100,000",
    big: "直播時現場抽出", small: "（無須對應手機號碼、取件門市）"
  }, rowBoxes.liveLimited, { liveLimited: true }),
  awardRow("first", "頭獎", {
    name: "頭獎", amount: "NT$10,000",
    method: "手機號碼後六碼\n與當期開獎六碼完全相同\n+當期開獎門市",
    example: "用戶手機號碼為\n0988-646172\n取件門市為松菸旗艦店"
  }, rowBoxes.first),
  awardRow("second", "貳獎", {
    name: "貳獎", amount: "999蝦幣",
    method: "手機號碼後六碼\n與當期開獎五碼完全相同\n+當期開獎門市",
    example: "用戶手機號碼為\n0988-636172\n取件門市為松菸旗艦店"
  }, rowBoxes.second),
  awardRow("third", "參獎", {
    name: "參獎", amount: "100蝦幣",
    method: "手機號碼後六碼\n與當期開獎四碼完全相同\n+當期開獎門市",
    example: "用戶手機號碼為\n0988-639172\n取件門市為松菸旗艦店"
  }, rowBoxes.third),
  awardRow("fourth", "肆獎", {
    name: "肆獎", amount: "10蝦幣",
    method: "手機號碼後六碼\n與當期開獎三碼完全相同\n+當期開獎門市",
    example: "用戶手機號碼為\n0988-639872\n取件門市為松菸旗艦店"
  }, rowBoxes.fourth),
  awardRow("fifth", "伍獎", {
    name: "伍獎", amount: "5蝦幣",
    method: "手機號碼後六碼\n與當期開獎二碼完全相同\n+當期開獎門市",
    example: "用戶手機號碼為\n0988-639832\n取件門市為松菸旗艦店"
  }, rowBoxes.fifth)
]);

const editorSections = Object.freeze([
  Object.freeze({
    id: "headers", label: "欄位標題",
    fields: Object.freeze([
      ...headerGroups.flatMap((group) => [group.bigField, group.smallField].map((field) => Object.freeze({
        id: field.id, label: field.label, path: field.path.join("."), maxLines: 1
      })))
    ])
  }),
  ...rows.map((row) => Object.freeze({
    id: row.id, label: row.label,
    fields: Object.freeze(row.fields.map((field) => Object.freeze({
      id: field.id, label: field.label, path: field.path.join("."),
      multiline: field.multiline, maxLines: field.maxLines,
      limit: field.limit, maxCharsPerLine: field.maxCharsPerLine,
      selectable: field.selectable
    })))
  }))
]);

const allFields = Object.freeze([...headers, ...rows.flatMap((row) => row.fields)]);

export const LIVE_08_LAYOUT = Object.freeze({
  id: "08",
  name: "案型字卡_直播獎項說明",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  outputName: "案型字卡_直播獎項說明.jpg",
  textOrder: Object.freeze(["qualification", "qualificationNote", "footerNote"]),
  defaultText: Object.freeze({
    qualification: "符合特別獎資格之得獎者將共同均分獎金",
    qualificationNote: "（假設當期開獎號碼為621746，取件門市為松菸旗艦店，特別號為17）",
    footerNote: "•以上獎項如於當期無符合資格之得獎人，獎金不累計至下期。",
    headers: Object.freeze({
      prize: Object.freeze({ big: "獎項", small: "" }),
      amount: Object.freeze({ big: "得獎金額", small: "" }),
      method: Object.freeze({ big: "中獎方式", small: "" }),
      example: Object.freeze({ big: "得獎範例", small: "(並非實際開獎結果，僅供得獎說明)" })
    }),
    awards: Object.freeze(Object.fromEntries(rows.map((row) => [row.id, row.defaultText])))
  }),
  text: Object.freeze({
    qualification: textField("qualification", "表格上方資格說明", box(145, 238, 790, 52), 10, "bold", "qualification", { maxWidth: 790 }),
    qualificationNote: textField("qualificationNote", "上方括號小字", box(145, 287, 790, 38), 5.8, "regular", "qualificationNote", { maxWidth: 790 }),
    footerNote: textField("footerNote", "表格下方註記", box(145, 996, 790, 48), 6.5, "medium", "footerNote", { maxWidth: 790 })
  }),
  colorFields: Object.freeze([Object.freeze({ id: "background", label: "背景色" })]),
  awardTable: Object.freeze({
    provisional: true,
    headerBoxes,
    headerGroups,
    headers,
    rows,
    fields: allFields,
    editorSections,
    headerTypography: Object.freeze({
      threshold: 6,
      short: Object.freeze({ fontSizePx: pt(6), family: "bold" }),
      long: Object.freeze({ fontSizePx: pt(3.2), family: "regular" })
    }),
    colors: Object.freeze({
      header: "#5d2b22", prizeName: "#5d2b22", amount: "#ee4d2d",
      body: "#3c3c3c", limited: "#5d2b22", highlight: "#ee4d2d"
    }),
    fontFields: Object.freeze([
      Object.freeze({ fontSizePx: pt(6), family: "bold" }),
      Object.freeze({ fontSizePx: pt(3.2), family: "regular" }),
      Object.freeze({ fontSizePx: pt(6.4), family: "bold" }),
      Object.freeze({ fontSizePx: pt(4.47), family: "medium" }),
      Object.freeze({ fontSizePx: pt(4.8), family: "regular" })
    ]),
    selectableFields: Object.freeze(allFields
      .filter((field) => field.selectable)
      .map((field) => Object.freeze({ id: field.id, path: field.path, geometry: field })))
  }),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({
        background: "#2660ad", qualification: "#ffffff", qualificationNote: "#ffffff",
        footerNote: "#ffffff", highlight: "#ee4d2d", header: "#5d2b22",
        prizeName: "#5d2b22", amount: "#ee4d2d", body: "#3c3c3c", limited: "#5d2b22"
      }),
      backgroundSrc: new URL("../assets/智取櫃/案型字卡_直播獎項說明.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 125, width: 1080, height: 1795 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({
        background: "#ffda46", qualification: "#ffffff", qualificationNote: "#ffffff",
        footerNote: "#ffffff", highlight: "#ee4d2d", header: "#5d2b22",
        prizeName: "#5d2b22", amount: "#ee4d2d", body: "#3c3c3c", limited: "#5d2b22"
      }),
      backgroundSrc: new URL("../assets/門市/案型字卡_直播獎項說明.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 125, width: 1080, height: 1795 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/案型字卡_直播獎項說明.png", import.meta.url)
});

export function getLive08Style(styleId) {
  return LIVE_08_LAYOUT.styles[styleId] ?? null;
}
