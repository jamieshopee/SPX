// SPX 開獎秀 — 線上／電子BN：共用文字驗證
// ---------------------------------------------------------------------------
// 手動 Controls 與 Excel 工單匯入共用同一套 weighted-count contract。
// 不保存 state、不碰 DOM、不依賴任何 layout id。
// ---------------------------------------------------------------------------

const HAN_PATTERN = /\p{Script=Han}/u;

export function countTextUnits(value) {
  let units = 0;
  for (const character of String(value ?? "")) {
    units += HAN_PATTERN.test(character) ? 1 : 0.5;
  }
  return units;
}

export function formatUnits(units) {
  return Number.isInteger(units) ? String(units) : units.toFixed(1);
}

export function validateTextField(value, field) {
  const normalized = String(value ?? "");
  const units = countTextUnits(normalized);
  if (units > field.limit) {
    throw new Error(`${field.label}超過 ${field.limit} 字限制。`);
  }
  return { value: normalized, units };
}

export function validateTextValues(values, fields) {
  const validated = {};
  fields.forEach((field) => {
    validated[field.id] = validateTextField(values[field.id], field).value;
  });
  return validated;
}
