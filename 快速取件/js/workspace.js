import { ITEMS, isItemId } from "./registry.js";

export const DEFAULT_COLORS = Object.freeze({
  background: "#fee1d6",
  title: "#e27646",
  subtitle: "#c80c0c",
  small: "#e27646"
});

function emptyItemData() {
  return Object.fromEntries(ITEMS.map(({ id }) => [id, {}]));
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
