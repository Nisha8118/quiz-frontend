// ============================================================
// CONFIG: replace with your Render backend URL (no trailing /).
// Example: "https://quiz-backend-xyz.onrender.com"
// ============================================================
const API_URL = "https://quiz-backend-o3ev.onrender.com";

// ---- State ----
let pdfId = null;
let currentQuestion = null;
let selectedAnswer = null;
let askedQuestions = [];
let score = 0;
let total = 0;

// ---- Elements ----
const $ = (id) => document.getElementById(id);
const uploadBtn = $("upload-btn");
const pdfFile = $("pdf-file");
const uploadStatus = $("upload-status");
const uploadSection = $("upload-section");
const quizSection = $("quiz-section");
const questionText = $("question-text");
const optionsBox = $("options");
const submitBtn = $("submit-btn");
const nextBtn = $("next-btn");
const restartBtn = $("restart-btn");
const feedback = $("feedback");
const scorePill = $("score-pill");

// ---- Helpers ----
function setStatus(el, msg, kind = "info") {
  el.className = "status " + kind;
  el.textContent = msg;
}

function updateScore() {
  scorePill.textContent = `Score: ${score} / ${total}`;
}

// ---- Upload ----
uploadBtn.addEventListener("click", async () => {
  const file = pdfFile.files[0];
  if (!file) return setStatus(uploadStatus, "Please choose a PDF first.", "error");

  uploadBtn.disabled = true;
  setStatus(uploadStatus, "Uploading and reading PDF…", "info");

  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/upload`, { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    const data = await res.json();
    pdfId = data.pdf_id;
    setStatus(uploadStatus, `✅ Uploaded: ${data.pages} pages, ${data.chars} chars.`, "success");
    uploadSection.classList.add("hidden");
    quizSection.classList.remove("hidden");
    score = 0; total = 0; askedQuestions = [];
    updateScore();
    await loadQuestion();
  } catch (e) {
    setStatus(uploadStatus, `❌ Upload failed: ${e.message}`, "error");
  } finally {
    uploadBtn.disabled = false;
  }
});

// ---- Load question ----
async function loadQuestion() {
  selectedAnswer = null;
  submitBtn.disabled = true;
  submitBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  feedback.textContent = "";
  feedback.className = "status";
  questionText.textContent = "Loading question…";
  optionsBox.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_id: pdfId, asked: askedQuestions }),
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
  if (submitBtn.classList.contains("hidden")) return; // already answered
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
    total += 1;
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
        : `❌ Wrong. Correct answer: ${data.correct_answer}. ${data.explanation || ""}`,
      data.correct ? "success" : "error"
    );

    submitBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
  } catch (e) {
    setStatus(feedback, `Error: ${e.message}`, "error");
    submitBtn.disabled = false;
  }
});

// ---- Next ----
nextBtn.addEventListener("click", loadQuestion);

// ---- Restart ----
restartBtn.addEventListener("click", () => {
  pdfId = null;
  pdfFile.value = "";
  uploadStatus.textContent = "";
  uploadSection.classList.remove("hidden");
  quizSection.classList.add("hidden");
});
