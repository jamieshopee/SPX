// SPX 開獎秀 — 直播 06 Phase 2 Preview 局部反選互動層

import {
  getMultilineTextGeometry,
  getTextBoundaryIndex,
  getTextRangePixelBounds,
  isTextRangeFullySelected,
  updateTextRange
} from "./renderer-01.js";

const SELECTABLE_FIELDS = Object.freeze(["block1", "block2"]);

function codePointLength(value) {
  return Array.from(String(value ?? "")).length;
}

function ensureRanges(state, field, lineCount) {
  state.textRanges ||= {};
  state.textRanges[field.id] ||= Array.from({ length: lineCount }, () => []);
  while (state.textRanges[field.id].length < lineCount) state.textRanges[field.id].push([]);
  return state.textRanges[field.id];
}

export function mountLive06TextSelection({ container, canvas, layout, getState, render }) {
  if (layout.id !== "06") return () => {};
  const context = canvas.getContext("2d");
  if (!context) throw new Error("06 Preview 無法建立文字選取 Canvas context。");

  container.classList.add("live-06-selection-host");
  const selectionLayer = document.createElement("div");
  selectionLayer.className = "live-06-selection-layer";
  const interactionLayer = document.createElement("div");
  interactionLayer.className = "live-06-interaction-layer";
  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = "live-06-selection-action";
  actionButton.hidden = true;
  container.append(selectionLayer, interactionLayer, actionButton);

  let drag = null;
  let pending = null;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function lineGeometry(fieldId, lineIndex) {
    const state = getState();
    const field = layout.text[fieldId];
    const geometry = getMultilineTextGeometry(context, state.text[fieldId] ?? "", field);
    return geometry?.[lineIndex] ?? null;
  }

  function hitTest(point) {
    const state = getState();
    for (const fieldId of SELECTABLE_FIELDS) {
      const field = layout.text[fieldId];
      const geometry = getMultilineTextGeometry(context, state.text[fieldId] ?? "", field) ?? [];
      for (const line of geometry) {
        if (line.text === "") continue;
        if (point.y < line.inkTop || point.y > line.inkBottom) continue;
        if (point.x < line.inkLeft || point.x > line.inkRight) continue;
        return {
          fieldId,
          lineIndex: line.lineIndex,
          index: getTextBoundaryIndex(context, line, point.x)
        };
      }
    }
    return null;
  }

  function clearVisuals() {
    selectionLayer.replaceChildren();
    actionButton.hidden = true;
    pending = null;
  }

  function selectionBounds(fieldId, lineIndex, start, end) {
    const line = lineGeometry(fieldId, lineIndex);
    if (!line) return null;
    return getTextRangePixelBounds(context, line, start, end);
  }

  function addSelectionMark(selection) {
    if (!selection || selection.end <= selection.start) return null;
    const bounds = selectionBounds(selection.fieldId, selection.lineIndex, selection.start, selection.end);
    if (!bounds) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const hostRect = container.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const mark = document.createElement("span");
    mark.className = "live-06-selection-mark";
    mark.style.left = `${canvasRect.left - hostRect.left + bounds.left * scaleX}px`;
    mark.style.top = `${canvasRect.top - hostRect.top + bounds.top * scaleY}px`;
    mark.style.width = `${Math.max(1, (bounds.right - bounds.left) * scaleX)}px`;
    mark.style.height = `${Math.max(1, (bounds.bottom - bounds.top) * scaleY)}px`;
    selectionLayer.append(mark);
    return bounds;
  }

  function showAction(selection) {
    const bounds = addSelectionMark(selection);
    if (!bounds) {
      actionButton.hidden = true;
      return;
    }
    const state = getState();
    const field = layout.text[selection.fieldId];
    const text = state.text[selection.fieldId] ?? "";
    const lineLength = codePointLength(String(text).split("\n")[selection.lineIndex] ?? "");
    const ranges = ensureRanges(state, field, field.maxLines)[selection.lineIndex] ?? [];
    const fullySelected = isTextRangeFullySelected(ranges, selection.start, selection.end, lineLength);
    pending = { ...selection, mode: fullySelected ? "remove" : "add" };
    actionButton.textContent = fullySelected ? "取消反選" : "套用反選";
    actionButton.hidden = false;
    const canvasRect = canvas.getBoundingClientRect();
    const hostRect = container.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    actionButton.style.left = `${canvasRect.left - hostRect.left + bounds.left * scaleX}px`;
    actionButton.style.top = `${Math.max(4, canvasRect.top - hostRect.top + bounds.top * scaleY - 42)}px`;
  }

  function showDrag(selection) {
    selectionLayer.replaceChildren();
    actionButton.hidden = true;
    addSelectionMark(selection);
  }

  function sameLine(left, right) {
    return Boolean(left && right && left.fieldId === right.fieldId && left.lineIndex === right.lineIndex);
  }

  interactionLayer.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const point = canvasPoint(event);
    const hit = point ? hitTest(point) : null;
    clearVisuals();
    if (!hit) return;
    drag = { pointerId: event.pointerId, anchor: hit, current: hit };
    interactionLayer.setPointerCapture(event.pointerId);
    showDrag({ ...hit, start: hit.index, end: hit.index });
  });

  interactionLayer.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = canvasPoint(event);
    const hit = point ? hitTest(point) : null;
    drag.current = sameLine(drag.anchor, hit) ? hit : null;
    if (!drag.current) {
      selectionLayer.replaceChildren();
      return;
    }
    const start = Math.min(drag.anchor.index, drag.current.index);
    const end = Math.max(drag.anchor.index, drag.current.index);
    showDrag({ fieldId: drag.anchor.fieldId, lineIndex: drag.anchor.lineIndex, start, end });
  });

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const active = drag;
    drag = null;
    if (interactionLayer.hasPointerCapture(event.pointerId)) interactionLayer.releasePointerCapture(event.pointerId);
    if (!active.current || !sameLine(active.anchor, active.current)) {
      selectionLayer.replaceChildren();
      return;
    }
    const start = Math.min(active.anchor.index, active.current.index);
    const end = Math.max(active.anchor.index, active.current.index);
    if (end <= start) {
      selectionLayer.replaceChildren();
      return;
    }
    showAction({ fieldId: active.anchor.fieldId, lineIndex: active.anchor.lineIndex, start, end });
  }

  interactionLayer.addEventListener("pointerup", finishDrag);
  interactionLayer.addEventListener("pointercancel", finishDrag);

  actionButton.addEventListener("click", () => {
    if (!pending) return;
    const state = getState();
    const field = layout.text[pending.fieldId];
    const text = state.text[pending.fieldId] ?? "";
    const lineLength = codePointLength(String(text).split("\n")[pending.lineIndex] ?? "");
    const rangesByLine = ensureRanges(state, field, field.maxLines);
    rangesByLine[pending.lineIndex] = updateTextRange(
      rangesByLine[pending.lineIndex], pending.start, pending.end, pending.mode, lineLength
    );
    clearVisuals();
    Promise.resolve(render()).catch(() => {});
  });

  const onKeyDown = (event) => {
    if (event.key !== "Escape") return;
    drag = null;
    clearVisuals();
  };
  document.addEventListener("keydown", onKeyDown);

  return () => {
    drag = null;
    document.removeEventListener("keydown", onKeyDown);
    selectionLayer.remove();
    interactionLayer.remove();
    actionButton.remove();
    container.classList.remove("live-06-selection-host");
  };
}
