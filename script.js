// =============================================================
// CONFIG: paste your Render backend URL here (no trailing slash)
// Example: "https://quiz-backend-xyz.onrender.com"
// =============================================================
const API_URL = "https://quiz-backend-o3ev.onrender.com";

// ---- State ----
let mode = "subject";       // "subject" | "pdf"
let pdfId = null;
let askedQuestions = [];
let currentQuestion = null;
let selectedAnswer = null;
let score = 0;
let answered = 0;
let totalTarget = 10;

// ---- Elements ----
const $ = (id) => document.getElementById(id);
const tabs = document.querySelectorAll(".tab");
const subjectPane = $("subject-pane");
const pdfPane = $("pdf-pane");

const setupSection = $("setup-section");
const quizSection = $("quiz-section");
const resultSection = $("result-section");

const subjectSel = $("subject");
const customSubj = $("custom-subject");
const difficultySel = $("difficulty");
const numQuestionsSel = $("num-questions");

const pdfFile = $("pdf-file");
const uploadBtn = $("upload-btn");
const uploadStatus = $("upload-status");

const startBtn = $("start-btn");
const setupStatus = $("setup-status");

const quizTitle = $("quiz-title");
const scorePill = $("score-pill");
const progressBar = $("progress-bar");
const questionText = $("question-text");
const optionsBox = $("options");
const submitBtn = $("submit-btn");
const nextBtn = $("next-btn");
const quitBtn = $("quit-btn");
const feedback = $("feedback");

const resultScore = $("result-score");
const resultMsg = $("result-msg");
const restartBtn = $("restart-btn");

// ---- Helpers ----
function setStatus(el, msg, kind = "info") {
  el.className = "status " + kind;
  el.textContent = msg;
}
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function updateScore() {
  scorePill.textContent = `Score: ${score} / ${answered}`;
  progressBar.style.width = `${(answered / totalTarget) * 100}%`;
}

// ---- Tabs ----
tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  mode = t.dataset.mode;
  if (mode === "subject") { show(subjectPane); hide(pdfPane); }
  else { hide(subjectPane); show(pdfPane); }
}));

// ---- Upload PDF ----
uploadBtn.addEventListener("click", async () => {
  const file = pdfFile.files[0];
  if (!file) return setStatus(uploadStatus, "Please choose a PDF first.", "error");
  uploadBtn.disabled = true;
  setStatus(uploadStatus, "Uploading…", "info");
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
    const data = await res.json();
    pdfId = data.pdf_id;
    setStatus(uploadStatus, `✅ Loaded: ${data.pages} pages, ${data.chars} chars.`, "success");
  } catch (e) {
    setStatus(uploadStatus, `❌ ${e.message}`, "error");
  } finally {
    uploadBtn.disabled = false;
  }
});

// ---- Start Quiz ----
startBtn.addEventListener("click", async () => {
  if (mode === "pdf" && !pdfId) {
    return setStatus(setupStatus, "Upload a PDF first.", "error");
  }
  // reset
  askedQuestions = [];
  score = 0;
  answered = 0;
  totalTarget = parseInt(numQuestionsSel.value, 10);
  setStatus(setupStatus, "", "info");

  const subjectLabel = mode === "subject"
    ? (customSubj.value.trim() || subjectSel.value)
    : "PDF Quiz";
  quizTitle.textContent = `Quiz · ${subjectLabel}`;

  hide(setupSection);
  hide(resultSection);
  show(quizSection);
  updateScore();
  await loadQuestion();
});

// ---- Load question ----
async function loadQuestion() {
  selectedAnswer = null;
  submitBtn.disabled = true;
  show(submitBtn);
  hide(nextBtn);
  feedback.textContent = "";
  feedback.className = "status";
  questionText.textContent = "Loading question…";
  optionsBox.innerHTML = "";

  const body = {
    mode,
    asked: askedQuestions,
    difficulty: difficultySel.value,
  };
  if (mode === "pdf") {
    body.pdf_id = pdfId;
  } else {
    body.subject = customSubj.value.trim() || subjectSel.value;
  }

  try {
    const res = await fetch(`${API_URL}/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentQuestion = await res.json();
    askedQuestions.push(currentQuestion.question);
    renderQuestion();
  } catch (e) {
    questionText.textContent = "Failed to load question.";
    setStatus(feedback, e.message, "error");
  }
}

function renderQuestion() {
  questionText.textContent = currentQuestion.question;
  optionsBox.innerHTML = "";
  ["A", "B", "C", "D"].forEach((key) => {
    const text = currentQuestion.options[key] ?? "";
    const div = document.createElement("div");
    div.className = "option";
    div.dataset.key = key;
    div.innerHTML = `<span class="label">${key}</span><span>${text}</span>`;
    div.addEventListener("click", () => selectOption(key, div));
    optionsBox.appendChild(div);
  });
}

function selectOption(key, el) {
  if (submitBtn.classList.contains("hidden")) return;
  selectedAnswer = key;
  document.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  submitBtn.disabled = false;
}

// ---- Submit ----
submitBtn.addEventListener("click", async () => {
  if (!selectedAnswer) return;
  submitBtn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: currentQuestion, user_answer: selectedAnswer }),
    });
    const data = await res.json();
    answered += 1;
    if (data.correct) score += 1;
    updateScore();

    document.querySelectorAll(".option").forEach((o) => {
      const k = o.dataset.key;
      if (k === data.correct_answer) o.classList.add("correct");
      else if (k === selectedAnswer) o.classList.add("wrong");
    });

    setStatus(
      feedback,
      data.correct
        ? `✅ Correct! ${data.explanation || ""}`
        : `❌ Wrong. Correct: ${data.correct_answer}. ${data.explanation || ""}`,
      data.correct ? "success" : "error"
    );

    hide(submitBtn);
    if (answered >= totalTarget) {
      nextBtn.textContent = "See Results →";
    } else {
      nextBtn.textContent = "Next Question →";
    }
    show(nextBtn);
  } catch (e) {
    setStatus(feedback, `Error: ${e.message}`, "error");
    submitBtn.disabled = false;
  }
});

// ---- Next ----
nextBtn.addEventListener("click", () => {
  if (answered >= totalTarget) {
    finish();
  } else {
    loadQuestion();
  }
});

// ---- Quit ----
quitBtn.addEventListener("click", () => {
  if (confirm("Quit this quiz?")) finish();
});

function finish() {
  hide(quizSection);
  show(resultSection);
  resultScore.textContent = `${score} / ${answered}`;
  const pct = answered ? Math.round((score / answered) * 100) : 0;
  let msg = "";
  if (pct >= 80) msg = "🌟 Excellent work!";
  else if (pct >= 60) msg = "👍 Good job — keep practising.";
  else if (pct >= 40) msg = "🙂 Not bad — try again to improve.";
  else msg = "📚 Keep studying — you've got this.";
  resultMsg.textContent = `${msg} (${pct}%)`;
}

// ---- Restart ----
restartBtn.addEventListener("click", () => {
  hide(resultSection);
  show(setupSection);
});
