"use strict";

const toolList = document.querySelector("#tool-list");
const toolError = document.querySelector("#tool-error");
const errorMessage = "目前無法載入 SPX 工具清單，請稍後再試。";

function isValidToolList(tools) {
  return (
    Array.isArray(tools) &&
    tools.length > 0 &&
    tools.every(
      (tool) =>
        tool !== null &&
        typeof tool === "object" &&
        typeof tool.name === "string" &&
        tool.name.trim() !== "" &&
        typeof tool.path === "string" &&
        tool.path.trim() !== "",
    )
  );
}

function createToolCard(tool) {
  const card = document.createElement("a");
  card.className = "tool-card";
  card.href = tool.path.trim();
  card.textContent = tool.name.trim();
  return card;
}

function showLoadError(error) {
  console.error("Unable to load the SPX tool list.", error);
  toolList.replaceChildren();
  toolError.textContent = errorMessage;
  toolError.hidden = false;
}

async function loadTools() {
  try {
    const response = await fetch("./tools.json");

    if (!response.ok) {
      throw new Error(`Tool list request failed with status ${response.status}.`);
    }

    const tools = await response.json();

    if (!isValidToolList(tools)) {
      throw new TypeError("Tool list data is invalid.");
    }

    const cards = document.createDocumentFragment();

    for (const tool of tools) {
      cards.append(createToolCard(tool));
    }

    toolList.replaceChildren(cards);
    toolError.hidden = true;
  } catch (error) {
    showLoadError(error);
  }
}

loadTools();
