const BOARD_PATH = "../../knowledge-base/ops/kanban-cards.json";

const columns = [
  { key: "ready", label: "Ready" },
  { key: "running", label: "Running" },
  { key: "blocked", label: "Blocked" },
  { key: "review", label: "Review" },
  { key: "scheduled", label: "Scheduled" },
  { key: "done", label: "Done" }
];

const state = {
  cards: [],
  filtered: []
};

const els = {
  board: document.querySelector("#board"),
  searchInput: document.querySelector("#searchInput"),
  ownerFilter: document.querySelector("#ownerFilter"),
  areaFilter: document.querySelector("#areaFilter"),
  focusFilter: document.querySelector("#focusFilter"),
  refreshButton: document.querySelector("#refreshButton"),
  totalCount: document.querySelector("#totalCount"),
  blockedCount: document.querySelector("#blockedCount"),
  reviewCount: document.querySelector("#reviewCount"),
  ownerCount: document.querySelector("#ownerCount"),
  ownerLane: document.querySelector("#ownerLane"),
  codexLane: document.querySelector("#codexLane"),
  ownerLaneCount: document.querySelector("#ownerLaneCount"),
  codexLaneCount: document.querySelector("#codexLaneCount"),
  detailPanel: document.querySelector("#detailPanel"),
  closeDetail: document.querySelector("#closeDetail"),
  copyPrompt: document.querySelector("#copyPrompt"),
  loadError: document.querySelector("#loadError")
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function display(value, fallback = "Not specified") {
  return String(value || "").trim() || fallback;
}

function escapeHtml(value) {
  return display(value, "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function isOwnerWaiting(card) {
  return normalize(card.owner).includes("owner") || normalize(card.owner).includes("anil");
}

function isCodexExecutable(card) {
  return normalize(card.owner).includes("codex") && ["ready", "todo"].includes(normalize(card.status));
}

function statusKey(card) {
  const status = normalize(card.status);
  if (status === "todo" || !status) return "ready";
  return status;
}

function sortCards(cards) {
  return [...cards].sort((a, b) => {
    const aOwner = isOwnerWaiting(a) ? 0 : 1;
    const bOwner = isOwnerWaiting(b) ? 0 : 1;
    if (aOwner !== bOwner) return aOwner - bOwner;
    return display(a.id).localeCompare(display(b.id));
  });
}

function uniqueOptions(cards, key) {
  const values = [...new Set(cards.map((card) => display(card[key], "Unassigned")))];
  return values.sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, label, values) {
  const current = select.value;
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = label;
  select.append(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });

  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function updateMetrics(cards) {
  els.totalCount.textContent = cards.length;
  els.blockedCount.textContent = cards.filter((card) => statusKey(card) === "blocked").length;
  els.reviewCount.textContent = cards.filter((card) => statusKey(card) === "review").length;
  els.ownerCount.textContent = cards.filter((card) => isOwnerWaiting(card) && statusKey(card) !== "done").length;
}

function cardMatchesSearch(card, query) {
  if (!query) return true;
  const haystack = [
    card.id,
    card.title,
    card.status,
    card.owner,
    card.area,
    card.next_action,
    card.acceptance,
    card.blocked_reason,
    ...(card.evidence || [])
  ].join(" ");
  return normalize(haystack).includes(query);
}

function applyFilters() {
  const query = normalize(els.searchInput.value);
  const owner = els.ownerFilter.value;
  const area = els.areaFilter.value;
  const focus = els.focusFilter.value;

  state.filtered = state.cards.filter((card) => {
    if (!cardMatchesSearch(card, query)) return false;
    if (owner !== "all" && display(card.owner, "Unassigned") !== owner) return false;
    if (area !== "all" && display(card.area, "Unassigned") !== area) return false;
    if (focus === "owner" && !(isOwnerWaiting(card) && statusKey(card) !== "done")) return false;
    if (focus === "codex" && !isCodexExecutable(card)) return false;
    if (focus === "blocked" && statusKey(card) !== "blocked") return false;
    if (focus === "review" && statusKey(card) !== "review") return false;
    return true;
  });

  render();
}

function renderMiniLane(container, countEl, cards) {
  container.innerHTML = "";
  countEl.textContent = cards.length;

  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nothing here right now.";
    container.append(empty);
    return;
  }

  cards.slice(0, 5).forEach((card) => {
    const item = document.createElement("button");
    item.className = "mini-item";
    item.type = "button";
    const title = document.createElement("strong");
    title.textContent = `${card.id} - ${card.title}`;
    const next = document.createElement("span");
    next.textContent = display(card.next_action);
    item.append(title, next);
    item.addEventListener("click", () => openDetail(card));
    container.append(item);
  });
}

function renderBoard(cards) {
  els.board.innerHTML = "";
  const columnTemplate = document.querySelector("#columnTemplate");
  const cardTemplate = document.querySelector("#cardTemplate");

  columns.forEach((column) => {
    const columnNode = columnTemplate.content.firstElementChild.cloneNode(true);
    const columnCards = sortCards(cards.filter((card) => statusKey(card) === column.key));
    columnNode.querySelector("h2").textContent = column.label;
    columnNode.querySelector(".column-header span").textContent = columnCards.length;

    const cardContainer = columnNode.querySelector(".cards");
    if (!columnCards.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No cards";
      cardContainer.append(empty);
    }

    columnCards.forEach((card) => {
      const cardNode = cardTemplate.content.firstElementChild.cloneNode(true);
      cardNode.dataset.status = statusKey(card);
      cardNode.querySelector(".card-id").textContent = `${display(card.id)} | ${display(card.area, "No area")}`;
      cardNode.querySelector("strong").textContent = display(card.title);
      cardNode.querySelector(".card-meta").textContent = `Owner: ${display(card.owner, "Unassigned")}`;
      cardNode.querySelector(".card-next").textContent = display(card.next_action, "No next action recorded");
      cardNode.addEventListener("click", () => openDetail(card));
      cardContainer.append(cardNode);
    });

    els.board.append(columnNode);
  });
}

function render() {
  updateMetrics(state.cards);
  renderMiniLane(
    els.ownerLane,
    els.ownerLaneCount,
    sortCards(state.cards.filter((card) => isOwnerWaiting(card) && statusKey(card) !== "done"))
  );
  renderMiniLane(
    els.codexLane,
    els.codexLaneCount,
    sortCards(state.cards.filter(isCodexExecutable))
  );
  renderBoard(state.filtered);
}

function evidenceHtml(card) {
  const evidence = card.evidence || [];
  if (!evidence.length) return "No evidence recorded.";
  return `<ul class="evidence-list">${evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function executionPrompt(card) {
  return [
    `Take Kanban card ${card.id} and execute it.`,
    `Title: ${card.title}`,
    `Owner: ${display(card.owner, "Unassigned")}`,
    `Area: ${display(card.area, "Unassigned")}`,
    `Next action: ${display(card.next_action, "No next action recorded")}`,
    `Acceptance: ${display(card.acceptance, "No acceptance criteria recorded")}`,
    "Before closing, update Hermes Kanban and export the repo backup."
  ].join("\n");
}

function openDetail(card) {
  document.querySelector("#detailStatus").textContent = `${statusKey(card)} | ${display(card.id)}`;
  document.querySelector("#detailTitle").textContent = display(card.title);
  document.querySelector("#detailOwner").textContent = display(card.owner, "Unassigned");
  document.querySelector("#detailArea").textContent = display(card.area, "Unassigned");
  document.querySelector("#detailNext").textContent = display(card.next_action, "No next action recorded.");
  document.querySelector("#detailAcceptance").textContent = display(card.acceptance, "No acceptance criteria recorded.");
  document.querySelector("#detailEvidence").innerHTML = evidenceHtml(card);
  document.querySelector("#detailPrompt").value = executionPrompt(card);
  els.detailPanel.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  els.detailPanel.setAttribute("aria-hidden", "true");
}

async function copyPrompt() {
  const prompt = document.querySelector("#detailPrompt").value;
  try {
    await navigator.clipboard.writeText(prompt);
    els.copyPrompt.textContent = "Copied";
    window.setTimeout(() => {
      els.copyPrompt.textContent = "Copy prompt";
    }, 1200);
  } catch {
    document.querySelector("#detailPrompt").select();
  }
}

async function loadBoard() {
  els.loadError.hidden = true;
  const response = await fetch(`${BOARD_PATH}?t=${Date.now()}`);
  if (!response.ok) throw new Error(`Could not load ${BOARD_PATH}`);

  state.cards = await response.json();
  state.filtered = state.cards;
  fillSelect(els.ownerFilter, "All owners", uniqueOptions(state.cards, "owner"));
  fillSelect(els.areaFilter, "All areas", uniqueOptions(state.cards, "area"));
  applyFilters();
}

function bindEvents() {
  [els.searchInput, els.ownerFilter, els.areaFilter, els.focusFilter].forEach((el) => {
    el.addEventListener("input", applyFilters);
  });
  els.refreshButton.addEventListener("click", loadBoard);
  els.closeDetail.addEventListener("click", closeDetail);
  els.detailPanel.addEventListener("click", (event) => {
    if (event.target === els.detailPanel) closeDetail();
  });
  els.copyPrompt.addEventListener("click", copyPrompt);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });
}

bindEvents();
loadBoard().catch((error) => {
  console.error(error);
  els.loadError.hidden = false;
});
