// ── State ────────────────────────────────────────────────────────────────────
const state = {
  extractedText: "",
  quizData: null,
  mode: "mcq",
  difficulty: "easy",
  fcIndex: 0,
};

// ── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const inputSection   = $("input-section");
const configSection  = $("config-section");
const resultsSection = $("results-section");

// ── Tab Switching ─────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    $(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ── File Drop Zone ────────────────────────────────────────────────────────────
const dropZone  = $("drop-zone");
const fileInput = $("file-input");

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

function setFile(file) {
  fileInput._selectedFile = file;
  $("file-name").textContent = `📎 ${file.name}`;
}

// ── Option Buttons ────────────────────────────────────────────────────────────
document.querySelectorAll(".opt-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = btn.dataset.field;
    document.querySelectorAll(`.opt-btn[data-field="${field}"]`).forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state[field] = btn.dataset.val;
  });
});

// ── Extract ───────────────────────────────────────────────────────────────────
$("extract-btn").addEventListener("click", async () => {
  const statusEl = $("extract-status");
  const btn = $("extract-btn");
  const activeTab = document.querySelector(".tab.active").dataset.tab;

  setStatus(statusEl, "loading", "Extracting text…");
  btn.disabled = true;

  try {
    let res;
    if (activeTab === "file") {
      const file = fileInput._selectedFile || fileInput.files[0];
      if (!file) { setStatus(statusEl, "error", "Please select a file."); return; }
      const fd = new FormData();
      fd.append("file", file);
      res = await fetch("/api/extract", { method: "POST", body: fd });
    } else {
      const url = $("url-input").value.trim();
      if (!url) { setStatus(statusEl, "error", "Please enter a URL."); return; }
      res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    }

    const data = await res.json();
    if (!res.ok) { setStatus(statusEl, "error", data.error); return; }

    state.extractedText = data.text;
    setStatus(statusEl, "success", `✓ Extracted ${data.char_count.toLocaleString()} characters.`);
    configSection.classList.remove("hidden");
    configSection.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    setStatus(statusEl, "error", "Network error. Is the server running?");
  } finally {
    btn.disabled = false;
  }
});

// ── Generate ──────────────────────────────────────────────────────────────────
$("generate-btn").addEventListener("click", async () => {
  const statusEl = $("generate-status");
  const btn = $("generate-btn");

  setStatus(statusEl, "loading", "Generating quiz… this may take a moment.");
  btn.disabled = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: state.extractedText,
        mode: state.mode,
        difficulty: state.difficulty,
        topic_filter: $("topic-filter").value.trim(),
        count: parseInt($("count-input").value) || 5,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setStatus(statusEl, "error", data.error); return; }

    state.quizData = data;
    renderResults(data);
    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth" });
    setStatus(statusEl, "success", "");
  } catch (e) {
    setStatus(statusEl, "error", "Network error.");
  } finally {
    btn.disabled = false;
  }
});

// ── Render Results ────────────────────────────────────────────────────────────
function renderResults(data) {
  // Topics
  if (data.topics) {
    const lines = data.topics.split("\n");
    let html = "<ul>";
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const content = trimmed.replace(/^[-*+]\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/&amp;/g, "&");
      if (trimmed.match(/^[-*+]\s+[-*+]\s/) || line.startsWith("  ") || line.startsWith("\t")) {
        html += `<li style="margin-left:1.2rem">${content}</li>`;
      } else if (trimmed.match(/^[-*+]/)) {
        html += `<li><strong>${content}</strong></li>`;
      } else {
        html += `<li>${content}</li>`;
      }
    });
    html += "</ul>";
    $("topics-text").innerHTML = html;
    $("topics-box").classList.remove("hidden");
  }

  const mcqSection = $("mcq-section");
  const fcSection  = $("flashcard-section");
  mcqSection.classList.add("hidden");
  fcSection.classList.add("hidden");
  $("mcq-score").classList.add("hidden");

  if (data.questions) {
    renderMCQs(data.questions);
    mcqSection.classList.remove("hidden");
  }
  if (data.flashcards) {
    renderFlashcards(data.flashcards);
    fcSection.classList.remove("hidden");
  }
}

function renderMCQs(questions) {
  const list = $("mcq-list");
  list.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "mcq-item";
    div.dataset.answer = q.answer;
    div.innerHTML = `
      <div class="question">${i + 1}. ${q.question}</div>
      <div class="mcq-options">
        ${Object.entries(q.options).map(([k, v]) => `
          <label class="mcq-option">
            <input type="radio" name="q${i}" value="${k}" />
            <span><strong>${k}.</strong> ${v}</span>
          </label>`).join("")}
      </div>
      <div class="explanation">💡 ${q.explanation}</div>`;
    list.appendChild(div);
  });
}

$("submit-mcq").addEventListener("click", () => {
  const items = document.querySelectorAll(".mcq-item");
  let score = 0;
  items.forEach((item) => {
    const correct = item.dataset.answer;
    const selected = item.querySelector(`input[type="radio"]:checked`);
    const explanation = item.querySelector(".explanation");
    explanation.style.display = "block";

    item.querySelectorAll(".mcq-option").forEach((opt) => {
      const val = opt.querySelector("input").value;
      if (val === correct) opt.classList.add("correct");
      else if (selected && val === selected.value) opt.classList.add("wrong");
    });

    if (selected && selected.value === correct) score++;
  });

  const scoreEl = $("mcq-score");
  const pct = Math.round((score / items.length) * 100);
  scoreEl.textContent = `Score: ${score} / ${items.length} (${pct}%)`;
  scoreEl.classList.remove("hidden");
  $("submit-mcq").disabled = true;
});

// ── Flashcards ────────────────────────────────────────────────────────────────
function renderFlashcards(cards) {
  state.fcIndex = 0;
  state.fcCards = cards;
  showCard(0);

  $("flashcard").onclick = () => $("flashcard").classList.toggle("flipped");
  $("fc-prev").onclick = () => { if (state.fcIndex > 0) showCard(--state.fcIndex); };
  $("fc-next").onclick = () => { if (state.fcIndex < cards.length - 1) showCard(++state.fcIndex); };
}

function showCard(i) {
  const card = state.fcCards[i];
  $("fc-front").textContent = card.front;
  $("fc-back").textContent  = card.back;
  $("fc-counter").textContent = `${i + 1} / ${state.fcCards.length}`;
  $("flashcard").classList.remove("flipped");
}

// ── Export ────────────────────────────────────────────────────────────────────
$("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.quizData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quiz.json";
  a.click();
});

// ── Restart ───────────────────────────────────────────────────────────────────
$("restart-btn").addEventListener("click", () => {
  state.extractedText = "";
  state.quizData = null;
  $("file-name").textContent = "";
  $("url-input").value = "";
  $("topic-filter").value = "";
  $("extract-status").textContent = "";
  $("generate-status").textContent = "";
  $("submit-mcq").disabled = false;
  configSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(el, type, msg) {
  el.className = `status ${type}`;
  el.innerHTML = type === "loading"
    ? `<span class="loader"></span>${msg}`
    : msg;
}
