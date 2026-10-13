// SPX 開獎秀 — live editor workspace JSON contract.

export const LIVE_WORKSPACE_FORMAT = "SPX Lottery Show Live Workspace";
export const LIVE_WORKSPACE_VERSION = 1;

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function exactKeys(value, template, path) {
  if (!isPlainObject(value) || !isPlainObject(template)) throw new Error(`${path} 格式無效。`);
  const expected = Object.keys(template).sort();
  const actual = Object.keys(value).sort();
  if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index])) {
    throw new Error(`${path} 欄位與目前版位格式不符。`);
  }
}

function validateValueShape(value, template, path) {
  if (isPlainObject(template)) {
    exactKeys(value, template, path);
    Object.entries(template).forEach(([key, nestedTemplate]) => {
      validateValueShape(value[key], nestedTemplate, `${path}.${key}`);
    });
    return;
  }
  if (typeof template === "string") {
    if (typeof value !== "string") throw new Error(`${path} 必須是文字。`);
    return;
  }
  if (typeof template === "number" || typeof template === "boolean") {
    if (typeof value !== typeof template) throw new Error(`${path} 型別無效。`);
    return;
  }
  if (template === null) {
    if (value !== null) throw new Error(`${path} 型別無效。`);
    return;
  }
  throw new Error(`${path} 工作區結構不支援。`);
}

function validateRangeList(value, text, path) {
  if (!Array.isArray(value)) throw new Error(`${path} 格式無效。`);
  const length = Array.from(String(text ?? "")).length;
  value.forEach((range, index) => {
    if (!isPlainObject(range) || Object.keys(range).length !== 2 ||
        !Number.isInteger(range.start) || !Number.isInteger(range.end) ||
        range.start < 0 || range.end <= range.start || range.end > length) {
      throw new Error(`${path}[${index}] 選取範圍無效。`);
    }
  });
}

function pathValue(root, path) {
  return path.reduce((value, key) => value?.[key], root);
}

function countTextUnits(value) {
  let units = 0;
  for (const character of String(value ?? "")) units += /\p{Script=Han}/u.test(character) ? 1 : 0.5;
  return units;
}

function validateTextLimits(layout, state) {
  Object.values(layout.text).forEach((field) => {
    const value = String(state.text[field.id] ?? "");
    if (field.multiline) {
      const lines = value.split("\n");
      if (lines.length > field.maxLines || lines.some((line) => countTextUnits(line) > field.maxCharsPerLine)) {
        throw new Error(`layoutStates.${layout.id}.text.${field.id} 超過行數或加權字數限制。`);
      }
    } else if (field.limit != null && countTextUnits(value) > field.limit) {
      throw new Error(`layoutStates.${layout.id}.text.${field.id} 超過 ${field.limit} 字限制。`);
    }
  });
  layout.stepGroups?.forEach((group) => group.rows.forEach((field) => {
    const value = String(state.text.steps[group.id][field.id] ?? "");
    if (field.multiline) {
      const lines = value.split("\n");
      if (lines.length > field.maxLines || lines.some((line) => countTextUnits(line) > field.maxCharsPerLine)) {
        throw new Error(`layoutStates.${layout.id}.text.steps.${group.id}.${field.id} 超過行數或加權字數限制。`);
      }
    } else if (field.limit != null && countTextUnits(value) > field.limit) {
      throw new Error(`layoutStates.${layout.id}.text.steps.${group.id}.${field.id} 超過 ${field.limit} 字限制。`);
    }
  }));
  layout.awardTable?.fields.forEach((field) => {
    const value = String(pathValue(state.text, field.path) ?? "");
    const lines = value.split("\n");
    if (field.limit != null && countTextUnits(value) > field.limit) throw new Error(`layoutStates.08.text.${field.id} 超過加權字數限制。`);
    if (field.multiline && (lines.length > field.maxLines || (field.maxCharsPerLine && lines.some((line) => countTextUnits(line) > field.maxCharsPerLine)))) {
      throw new Error(`layoutStates.08.text.${field.id} 超過行數或加權字數限制。`);
    }
    if (field.autoWrapAfter) {
      const wrappedLineCount = lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(Array.from(line).length / field.autoWrapAfter)), 0);
      if (wrappedLineCount > field.maxLines) throw new Error(`layoutStates.08.text.${field.id} 超過自動換行限制。`);
    }
  });
}

function validateSelectionRanges(layout, state) {
  if (layout.id === "06") {
    Object.values(layout.text).filter((field) => field.multiline).forEach((field) => {
      const lines = String(state.text[field.id] ?? "").split("\n");
      const rangeLines = state.textRanges[field.id];
      rangeLines.forEach((ranges, lineIndex) => {
        validateRangeList(ranges, lines[lineIndex] ?? "", `layoutStates.06.textRanges.${field.id}[${lineIndex}]`);
      });
    });
  }
  if (layout.id === "08") {
    layout.awardTable.selectableFields.forEach((field) => {
      const lines = String(pathValue(state.text, field.path) ?? "").split("\n");
      state.textRanges[field.id].forEach((ranges, lineIndex) => {
        validateRangeList(ranges, lines[lineIndex] ?? "", `layoutStates.08.textRanges.${field.id}[${lineIndex}]`);
      });
    });
  }
}

function validateStateShape(layout, candidate, createInitialState, styleId, validateState) {
  const template = createInitialState(styleId, layout);
  exactKeys(candidate, template, `layoutStates.${layout.id}`);
  validateValueShape(candidate.text, template.text, `layoutStates.${layout.id}.text`);
  exactKeys(candidate.colors, template.colors, `layoutStates.${layout.id}.colors`);
  Object.entries(candidate.colors).forEach(([key, value]) => {
    if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) {
      throw new Error(`layoutStates.${layout.id}.colors.${key} 顏色格式無效。`);
    }
  });
  if (!new Set(["auto", "orange", "white"]).has(candidate.logoMode)) {
    throw new Error(`layoutStates.${layout.id}.logoMode 無效。`);
  }

  if (template.textRanges) {
    exactKeys(candidate.textRanges, template.textRanges, `layoutStates.${layout.id}.textRanges`);
    Object.entries(template.textRanges).forEach(([key, templateLines]) => {
      const candidateLines = candidate.textRanges[key];
      const legacyExampleField = layout.id === "08"
        ? layout.awardTable.selectableFields.find((field) => field.id === key && field.id.endsWith(".example"))
        : null;
      const legacyThreeLineExample = Array.isArray(candidateLines) && legacyExampleField &&
        templateLines.length === 4 && candidateLines.length === 3 &&
        String(pathValue(candidate.text, legacyExampleField.path)).split("\n").length <= 3;
      if (!Array.isArray(candidateLines) || (candidateLines.length !== templateLines.length && !legacyThreeLineExample)) {
        throw new Error(`layoutStates.${layout.id}.textRanges.${key} 行數無效。`);
      }
      if (legacyThreeLineExample) candidateLines.push([]);
      candidateLines.forEach((ranges, lineIndex) => {
        if (!Array.isArray(ranges)) throw new Error(`layoutStates.${layout.id}.textRanges.${key}[${lineIndex}] 格式無效。`);
      });
    });
    validateSelectionRanges(layout, candidate);
  }

  validateTextLimits(layout, candidate);
  validateState(layout, candidate);
  return clone(candidate);
}

export function serializeLiveWorkspace({ styleId, activeLayoutId, layouts, states }) {
  const layoutStates = Object.fromEntries(layouts.map((layout) => {
    const state = states.get(layout.id);
    if (!state) throw new Error(`缺少 ${layout.id} 版位工作狀態。`);
    return [layout.id, clone(state)];
  }));
  return JSON.stringify({
    format: LIVE_WORKSPACE_FORMAT,
    version: LIVE_WORKSPACE_VERSION,
    item: "live",
    styleId,
    activeLayoutId,
    layoutStates
  }, null, 2);
}

export function parseLiveWorkspaceJson(text, {
  currentStyleId,
  layouts,
  createInitialState,
  validateState
}) {
  let source;
  try {
    source = JSON.parse(text);
  } catch (_error) {
    throw new Error("工作區 JSON 格式錯誤。");
  }
  if (!isPlainObject(source) || source.format !== LIVE_WORKSPACE_FORMAT) throw new Error("檔案不是直播工作區 JSON。");
  if (source.version !== LIVE_WORKSPACE_VERSION) throw new Error(`不支援的工作區版本（目前為 ${LIVE_WORKSPACE_VERSION}）。`);
  const topLevelKeys = ["activeLayoutId", "format", "item", "layoutStates", "styleId", "version"].sort();
  const sourceKeys = Object.keys(source).sort();
  if (sourceKeys.length !== topLevelKeys.length || topLevelKeys.some((key, index) => key !== sourceKeys[index])) {
    throw new Error("工作區 JSON 欄位不完整或包含未知欄位。");
  }
  if (source.item !== "live") throw new Error("工作區 item 無效。");
  if (source.styleId !== currentStyleId) throw new Error("工作區樣式與目前樣式不一致。");
  const layoutIds = layouts.map((layout) => layout.id);
  if (!layoutIds.includes(source.activeLayoutId)) throw new Error("activeLayoutId 無效。");
  exactKeys(source.layoutStates, Object.fromEntries(layoutIds.map((id) => [id, true])), "layoutStates");

  const restored = new Map();
  layouts.forEach((layout) => {
    restored.set(layout.id, validateStateShape(
      layout,
      source.layoutStates[layout.id],
      createInitialState,
      currentStyleId,
      validateState
    ));
  });
  return { styleId: currentStyleId, activeLayoutId: source.activeLayoutId, states: restored };
}
