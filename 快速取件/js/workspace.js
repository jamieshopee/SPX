import { ITEMS, isItemId } from "./registry.js";
import { countTextUnits } from "./editor.js";

export const DEFAULT_COLORS = Object.freeze({
  background: "#fee1d6",
  title: "#e27646",
  subtitle: "#c80c0c",
  small: "#e27646"
});

// 14_AR 專屬欄位（Jamie 裁決）：line1／line2 存於既有 Excel-managed container；
// 15 維持空白 deferred structure。
export const AR_ITEM_ID = "14";
export const AR_TEXT_FIELDS = Object.freeze(["line1", "line2"]);
// 14 唯一文字上限（Jamie 裁決）：兩行合計 <= 5.5（沿既有 ASCII=0.5／Non-ASCII=1 加權），
// 無每行獨立上限。
export const AR_COMBINED_LIMIT = 5.5;

export function countArCombinedUnits(line1, line2) {
  return countTextUnits(line1) + countTextUnits(line2);
}

// 15_MSBN 專屬欄位（Jamie 裁決）：六欄存於既有 Excel-managed container。
// 五個文字欄逐欄獨立上限（沿既有 ASCII=0.5／Non-ASCII=1 加權，不合計）；
// days 不走 weighted limit，canonical 僅 ""｜"1"～"9"（不允許 0、10+、任意文字）。
export const MSBN_ITEM_ID = "15";
export const MSBN_TEXT_FIELDS = Object.freeze([
  "mainTitle",
  "smallTitle",
  "subtitle",
  "smallLine1",
  "smallLine2"
]);
export const MSBN_TEXT_LIMITS = Object.freeze({
  mainTitle: 7,
  smallTitle: 10,
  subtitle: 8,
  smallLine1: 18,
  smallLine2: 18
});
export const MSBN_DAYS_FIELD = "days";
export const MSBN_DAYS_VALUES = Object.freeze(["", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export function isMsbnDaysValue(value) {
  return MSBN_DAYS_VALUES.includes(value);
}

export function emptyMsbnData() {
  return { mainTitle: "", days: "", smallTitle: "", subtitle: "", smallLine1: "", smallLine2: "" };
}

function emptyItemData() {
  return Object.fromEntries(
    ITEMS.map(({ id }) => [
      id,
      id === AR_ITEM_ID ? { line1: "", line2: "" } : id === MSBN_ITEM_ID ? emptyMsbnData() : {}
    ])
  );
}

export function createInitialState() {
  return {
    selectedItemId: "01",
    shared: {
      text: { title: "", subtitle: "", small: "" },
      kv: null,
      colors: { ...DEFAULT_COLORS },
      logoMode: "auto"
    },
    excel: {
      sourceName: null,
      items: emptyItemData()
    }
  };
}

function reduce(state, action) {
  switch (action.type) {
    case "SELECT_ITEM":
      if (!isItemId(action.itemId) || state.selectedItemId === action.itemId) return state;
      return { ...state, selectedItemId: action.itemId };

    case "UPDATE_TEXT": {
      if (!["title", "subtitle", "small"].includes(action.field)) return state;
      if (state.shared.text[action.field] === action.value) return state;
      return {
        ...state,
        shared: {
          ...state.shared,
          text: { ...state.shared.text, [action.field]: action.value }
        }
      };
    }

    // 14_AR 專屬文字（Jamie 裁決）：只允許 itemId="14"、field=line1/line2；
    // 以更新後兩行合計 <= 5.5 准駁，超限即 no-op（不寫入 Workspace）。
    // 15_MSBN（Jamie 裁決）：whitelist 六欄；五個文字欄逐欄獨立上限（超限 no-op）、
    // days 僅接受 canonical（非法 no-op）。14 既有 combined <= 5.5 邏輯不變。
    case "UPDATE_ITEM_TEXT": {
      if (action.itemId === MSBN_ITEM_ID) {
        const { field } = action;
        const value = String(action.value ?? "");
        if (field === MSBN_DAYS_FIELD) {
          if (!isMsbnDaysValue(value)) return state;
        } else if (MSBN_TEXT_FIELDS.includes(field)) {
          if (countTextUnits(value) > MSBN_TEXT_LIMITS[field]) return state;
        } else {
          return state;
        }
        const current = state.excel.items[MSBN_ITEM_ID];
        if (current[field] === value) return state;
        return {
          ...state,
          excel: {
            ...state.excel,
            items: { ...state.excel.items, [MSBN_ITEM_ID]: { ...current, [field]: value } }
          }
        };
      }
      if (action.itemId !== AR_ITEM_ID) return state;
      if (!AR_TEXT_FIELDS.includes(action.field)) return state;
      const current = state.excel.items[AR_ITEM_ID];
      const value = String(action.value ?? "");
      if (current[action.field] === value) return state;
      const next = { ...current, [action.field]: value };
      if (countArCombinedUnits(next.line1, next.line2) > AR_COMBINED_LIMIT) return state;
      return {
        ...state,
        excel: {
          ...state.excel,
          items: { ...state.excel.items, [AR_ITEM_ID]: next }
        }
      };
    }

    case "UPDATE_COLOR": {
      if (!Object.hasOwn(DEFAULT_COLORS, action.field)) return state;
      if (state.shared.colors[action.field] === action.value) return state;
      return {
        ...state,
        shared: {
          ...state.shared,
          colors: { ...state.shared.colors, [action.field]: action.value }
        }
      };
    }

    case "SET_LOGO_MODE":
      if (!["auto", "orange", "white"].includes(action.mode)) return state;
      if (state.shared.logoMode === action.mode) return state;
      return { ...state, shared: { ...state.shared, logoMode: action.mode } };

    case "SET_KV":
      return { ...state, shared: { ...state.shared, kv: structuredClone(action.kv) } };

    case "REMOVE_KV":
      if (state.shared.kv === null) return state;
      return { ...state, shared: { ...state.shared, kv: null } };

    case "COMMIT_EXCEL_IMPORT": {
      const nextText = action.sharedText;
      const sameText = ["title", "subtitle", "small"].every(
        (field) => state.shared.text[field] === nextText[field]
      );
      if (sameText && state.excel.sourceName === action.sourceName) return state;
      return {
        ...state,
        shared: { ...state.shared, text: { ...nextText } },
        excel: {
          sourceName: action.sourceName,
          items: structuredClone(action.items || state.excel.items)
        }
      };
    }

    case "REPLACE_WORKSPACE":
      return structuredClone(action.state);

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

export function createWorkspace() {
  let state = createInitialState();
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispatch(action) {
      const nextState = reduce(state, action);
      if (nextState === state) return false;
      state = nextState;
      listeners.forEach((listener) => listener(state, action.type));
      return true;
    }
  };
}

export const workspaceReducer = reduce;
