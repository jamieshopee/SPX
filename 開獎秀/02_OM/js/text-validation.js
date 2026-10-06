// SPX 開獎秀 — OM 01 weighted text validation

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
  if (units > field.limit) throw new Error(`${field.label}超過 ${field.limit} 字限制。`);
  return { value: normalized, units };
}

export function isWithinLimit(value, field) {
  return countTextUnits(value) <= field.limit;
}
