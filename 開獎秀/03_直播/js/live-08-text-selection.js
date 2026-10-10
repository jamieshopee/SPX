// SPX 開獎秀 — 直播 08 一般獎項文字局部反選

import {
  getMultilineTextGeometry,
  getTextBoundaryIndex,
  getTextRangePixelBounds,
  isTextRangeFullySelected,
  updateTextRange
} from "./renderer-01.js";

function getPath(root, path) {
  return path.reduce((value, key) => value?.[key], root);
}

function codePointLength(value) {
  return Array.from(String(value ?? "")).length;
}

export function clearLive08TextRangesForField(state, fieldId, lineCount = 3) {
  if (!state || !fieldId) return;
  state.textRanges ||= {};
  state.textRanges[fieldId] = Array.from({ length: lineCount }, () => []);
}

function ensureRanges(state, fieldId, lineCount) {
  state.textRanges ||= {};
  state.textRanges[fieldId] ||= Array.from({ length: lineCount }, () => []);
  while (state.textRanges[fieldId].length < lineCount) state.textRanges[fieldId].push([]);
  return state.textRanges[fieldId];
}

export function mountLive08TextSelection({ container, canvas, layout, getState, render }) {
  if (layout.id !== "08" || !layout.awardTable) return () => {};
  const context = canvas.getContext("2d");
  if (!context) throw new Error("08 Preview 無法建立文字選取 Canvas context。");

  container.classList.add("live-08-selection-host");
  const selectionLayer = document.createElement("div");
  selectionLayer.className = "live-08-selection-layer";
  const interactionLayer = document.createElement("div");
  interactionLayer.className = "live-08-interaction-layer";
  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = "live-08-selection-action";
  actionButton.hidden = true;
  container.append(selectionLayer, interactionLayer, actionButton);

  let drag = null;
  let pending = null;
  const fields = layout.awardTable.selectableFields;

  function getFieldText(field) {
    return String(getPath(getState().text, field.path) ?? "");
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function getLine(field, lineIndex) {
    const geometry = getMultilineTextGeometry(context, getFieldText(field), field.geometry) ?? [];
    return geometry[lineIndex] ?? null;
  }

  function hitTest(point) {
    for (const field of fields) {
      const geometry = getMultilineTextGeometry(context, getFieldText(field), field.geometry) ?? [];
      for (const line of geometry) {
        if (!line.text || point.y < line.inkTop || point.y > line.inkBottom) continue;
        if (point.x < line.inkLeft || point.x > line.inkRight) continue;
        return { fieldId: field.id, lineIndex: line.lineIndex, index: getTextBoundaryIndex(context, line, point.x) };
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
    const field = fields.find((item) => item.id === fieldId);
    const line = field ? getLine(field, lineIndex) : null;
    return line ? getTextRangePixelBounds(context, line, start, end) : null;
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
    mark.className = "live-08-selection-mark";
    mark.style.left = (canvasRect.left - hostRect.left + bounds.left * scaleX) + "px";
    mark.style.top = (canvasRect.top - hostRect.top + bounds.top * scaleY) + "px";
    mark.style.width = Math.max(1, (bounds.right - bounds.left) * scaleX) + "px";
    mark.style.height = Math.max(1, (bounds.bottom - bounds.top) * scaleY) + "px";
    selectionLayer.append(mark);
    return bounds;
  }

  function showAction(selection) {
    const bounds = addSelectionMark(selection);
    if (!bounds) {
      actionButton.hidden = true;
      return;
    }
    const field = fields.find((item) => item.id === selection.fieldId);
    const ranges = ensureRanges(getState(), field.id, field.geometry.maxLines)[selection.lineIndex] ?? [];
    const lineLength = codePointLength(getFieldText(field).split("\n")[selection.lineIndex] ?? "");
    const fullySelected = isTextRangeFullySelected(ranges, selection.start, selection.end, lineLength);
    pending = { ...selection, mode: fullySelected ? "remove" : "add" };
    actionButton.textContent = fullySelected ? "取消反選" : "套用反選";
    actionButton.hidden = false;
    const canvasRect = canvas.getBoundingClientRect();
    const hostRect = container.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    actionButton.style.left = (canvasRect.left - hostRect.left + bounds.left * scaleX) + "px";
    actionButton.style.top = Math.max(4, canvasRect.top - hostRect.top + bounds.top * scaleY - 42) + "px";
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
    clearVisuals();
    const point = canvasPoint(event);
    const hit = point ? hitTest(point) : null;
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
    const point = canvasPoint(event);
    const hit = point ? hitTest(point) : null;
    active.current = sameLine(active.anchor, hit) ? hit : null;
    drag = null;
    if (interactionLayer.hasPointerCapture(event.pointerId)) interactionLayer.releasePointerCapture(event.pointerId);
    if (!active.current) {
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
    const field = fields.find((item) => item.id === pending.fieldId);
    const ranges = ensureRanges(getState(), field.id, field.geometry.maxLines);
    const lineLength = codePointLength(getFieldText(field).split("\n")[pending.lineIndex] ?? "");
    ranges[pending.lineIndex] = updateTextRange(
      ranges[pending.lineIndex], pending.start, pending.end, pending.mode, lineLength
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
    container.classList.remove("live-08-selection-host");
  };
}
