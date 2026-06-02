const API_URL = "https://quiz-backend-o3ev.onrender.com";
let mode = "subject";       
let pdfId = null;
let askedQuestions = [];
let currentQuestion = null;
let selectedAnswer = null;
let scoreChart = null;
let historyChart = null;
let score = 0;
let weakQuestions = [];
let strongQuestions = [];
let correctStreak = 0;
let wrongStreak = 0;
let timer = null;
let timeLeft = 30;
let questionTimes = [];
let answered = 0;
let totalTarget = 10;
let questionType = "mixed";
let timeLimit = 30;
let timerInterval = null;
const $ = (id) => document.getElementById(id);
const tabs = document.querySelectorAll(".tab");
const subjectPane = $("subject-pane");
const pdfPane = $("pdf-pane");
const questionTypeSel = $("question-type");
const timerSelect = $("timer-select");
const timerEl = $("timer");
const textAnswer = $("text-answer");
const setupSection = $("setup-section");
const quizSection = $("quiz-section");
const resultSection = $("result-section");
const subjectSel = $("subject");
const customSubj = { value: "" };
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
const accuracyPercent = $("accuracy-percent");
const correctCount = $("correct-count");
const wrongCount = $("wrong-count");
const difficultyResult = $("difficulty-result");
const questionsTotal = $("questions-total");
const recommendationText = $("recommendation-text");
const avgTime =
$("avg-time");
const fastestTime =
$("fastest-time");
const slowestTime =
$("slowest-time");
const performanceGrade =
$("performance-grade");
const weakTopics =$("weak-topics");
const strongTopics =$("strong-topics");
const questionCounter = $("question-counter");
const difficultyBadge = $("difficulty-badge");
const exploreBtn = $("explore-btn");
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
function startTimer() {
  clearInterval(timer);
  const timerEl = document.getElementById("timer");
  timerEl.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (!submitBtn.disabled) {
        submitBtn.click();
      }
    }
  }, 1000);
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
  questionType = questionTypeSel.value;
timeLimit = parseInt(timerSelect.value);
  if (mode === "pdf" && !pdfId) {
    return setStatus(setupStatus, "Upload a PDF first.", "error");
  }
  // reset
  askedQuestions = [];
  score = 0;
  answered = 0;
  questionTimes = [];
  weakQuestions = [];
strongQuestions = [];
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
  question_type: questionType,
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
    questionCounter.textContent =
`Question ${answered + 1} / ${totalTarget}`;
difficultyBadge.textContent =
difficultySel.value.toUpperCase();
    askedQuestions.push(currentQuestion.question);
    renderQuestion();
    timeLeft = parseInt(document.getElementById("timer-select").value);
    startTimer();
  } catch (e) {
    questionText.textContent = "Failed to load question.";
    setStatus(feedback, e.message, "error");
  }
}
function renderQuestion() {
  questionText.classList.remove(
  "question-animation"
);
void questionText.offsetWidth;
questionText.classList.add(
  "question-animation"
);
questionText.textContent =
currentQuestion.question;
  optionsBox.innerHTML = "";
  const textInput = document.getElementById("text-answer");
  textInput.classList.add("hidden");
  if (currentQuestion.type === "mcq") {
    ["A", "B", "C", "D"].forEach((key) => {
      const text = currentQuestion.options[key] ?? "";
      const div = document.createElement("div");
      div.className = "option";
      div.dataset.key = key;
      div.innerHTML = `
        <span class="label">${key}</span>
        <span>${text}</span>
      `;
      div.addEventListener("click", () => selectOption(key, div));
      optionsBox.appendChild(div);
    });
  }
  else {
    textInput.classList.remove("hidden");
    textInput.value = "";
    textInput.focus();
    textInput.oninput = () => {
      selectedAnswer = textInput.value.trim();
      submitBtn.disabled = selectedAnswer.length === 0;
    };
  }
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
  const timeUsed =
timeLimit - timeLeft;
questionTimes.push(timeUsed);
  clearInterval(timer);
  submitBtn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: currentQuestion, user_answer: selectedAnswer }),
    });
    const data = await res.json();
    answered += 1;
if (data.correct){
  score += 1;
  strongQuestions.push(
    currentQuestion.question
  );
  correctStreak++;
  wrongStreak = 0;
}
else{
  weakQuestions.push(
    currentQuestion.question
  );
  wrongStreak++;
  correctStreak = 0;
}
    if(correctStreak >= 3){
  if(difficultySel.value === "easy"){
      difficultySel.value = "medium";
  }
  else if(difficultySel.value === "medium"){
      difficultySel.value = "hard";
  }
  difficultyBadge.textContent =
  difficultySel.value.toUpperCase();
  correctStreak = 0;
  setStatus(
    feedback,
    "🚀 Great performance! AI increased difficulty to HARD.",
    "success"
  );
}
if(wrongStreak >= 2){
  if(difficultySel.value === "hard"){
      difficultySel.value = "medium";
  }
  else if(difficultySel.value === "medium"){
      difficultySel.value = "easy";
  }
  difficultyBadge.textContent =
  difficultySel.value.toUpperCase();
  wrongStreak = 0;
  setStatus(
    feedback,
    "📚 AI adjusted difficulty to MEDIUM to improve learning.",
    "info"
  );
}
    updateScore();
    let accuracy = score / answered;
let insight = "";
if(accuracy >= 0.8){
    insight =
    "🧠 Strong understanding detected.";
}
else if(accuracy >= 0.5){
    insight =
    "📈 Improving steadily.";
}
else{
    insight =
    "📚 Focus on fundamentals.";
}
    if (currentQuestion.type === "mcq") {
  document.querySelectorAll(".option").forEach((o) => {
    const k = o.dataset.key;
    if (k === data.correct_answer) {
      o.classList.add("correct");
    }
    else if (k === selectedAnswer) {
      o.classList.add("wrong");
    }
  });
}
    setStatus(
  feedback,
  data.correct
  ? `✅ Correct!
     ${data.explanation || ""}
     ${insight}`
  : `❌ Wrong.
     Correct: ${data.correct_answer}
     ${data.explanation || ""}
     ${insight}`,
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
  clearInterval(timer);
  hide(quizSection);
  show(resultSection);
  resultScore.textContent = `${score} / ${answered}`;
  const pct =answered
? Math.round((score / answered) * 100)
: 0;
accuracyPercent.textContent =
`${pct}%`;
  document
.getElementById(
"accuracy-fill"
).style.width =
pct + "%";
correctCount.textContent =
score;
wrongCount.textContent =
answered - score;
difficultyResult.textContent =
difficultySel.value.toUpperCase();
questionsTotal.textContent =
answered;
  const totalTime =
questionTimes.reduce(
(a,b)=>a+b,
0
);
const averageTime =
questionTimes.length
? Math.round(
totalTime /
questionTimes.length
)
: 0;
const fastest =
questionTimes.length
? Math.min(...questionTimes)
: 0;
const slowest =
questionTimes.length
? Math.max(...questionTimes)
: 0;
avgTime.textContent =
averageTime + "s";
fastestTime.textContent =
fastest + "s";
slowestTime.textContent =
slowest + "s";
  let grade = "F";
if(pct >= 90){
 grade = "A+";
}
else if(pct >= 80){
 grade = "A";
}
else if(pct >= 70){
 grade = "B";
}
else if(pct >= 60){
 grade = "C";
}
else if(pct >= 50){
 grade = "D";
}
performanceGrade.textContent =
grade;
if(
grade === "A+" ||
grade === "A"
){
 performanceGrade.style.color =
 "#10b981";
}
else if(
grade === "B" ||
grade === "C"
){
 performanceGrade.style.color =
 "#f59e0b";
}
else{
 performanceGrade.style.color =
 "#ef4444";
}
  const weakPreview =
weakQuestions
.slice(0,3)
.map(q => `• ${q}`)
.join("<br>");
const strongPreview =
strongQuestions
.slice(0,3)
.map(q => `• ${q}`)
.join("<br>");
weakTopics.innerHTML =
`<h4>❌ Weak Areas</h4>
${weakPreview || "None"}`;
strongTopics.innerHTML =
`<h4>✅ Strong Areas</h4>
${strongPreview || "None"}`;
  if (pct >= 80){
  recommendationText.textContent =
  "Excellent performance. Move to HARD difficulty and advanced topics.";
}
else if (pct >= 60){
  recommendationText.textContent =
  "Good performance. Revise the weak areas shown above and retry.";
}
else{
  recommendationText.textContent =
  "Focus on the weak areas identified by AI before attempting higher difficulty questions.";
}
  let msg = "";
if (pct >= 80)
  msg = "🌟 Excellent work!";
else if (pct >= 60)
  msg = "👍 Good job — keep practising.";
else if (pct >= 40)
  msg = "🙂 Not bad — try again to improve.";
else
  msg = "📚 Keep studying — you've got this.";
resultMsg.textContent = `${msg} (${pct}%)`;
  const history =
JSON.parse(
localStorage.getItem(
"quizHistory"
) || "[]"
);
history.unshift({
subject:
mode === "subject"
? subjectSel.value
: "PDF Quiz",
score,
answered,
accuracy:pct,
difficulty:
difficultySel.value,
date:
new Date()
.toLocaleString()
});
localStorage.setItem(
"quizHistory",
JSON.stringify(history)
);
  const ctx =
document
.getElementById("scoreChart")
.getContext("2d");
if(scoreChart){
  scoreChart.destroy();
}
scoreChart =
new Chart(ctx, {
type: "pie",
data: {
labels: [
"Correct",
"Wrong"
],
datasets: [{
data: [
score,
answered - score
],
backgroundColor: [
"#10b981",
"#ef4444"
]
}]
},
options: {
responsive: true,
plugins: {
legend: {
labels: {
color: "#ffffff"
}
}
}
}
});
  loadHistory();
  drawHistoryChart();
}
// ---- Restart ----
restartBtn.addEventListener("click", () => {
  hide(resultSection);
  show(setupSection);
});
exploreBtn.addEventListener("click", () => {
  setupSection.scrollIntoView({
    behavior: "smooth"
  });
});
function loadHistory(){
const historyList =
document.getElementById(
"history-list"
);
const history =
JSON.parse(
localStorage.getItem(
"quizHistory"
) || "[]"
);
if(history.length === 0){
historyList.innerHTML =
"No quiz attempts yet.";
return;
}
historyList.innerHTML =
history
.slice(0,10)
.map(item => `
<div class="history-item">
<strong>${item.subject}</strong>
<br>
Score:
${item.score}/${item.answered}
<br>
Accuracy:
${item.accuracy}%
<br>
Difficulty:
${item.difficulty}
<br>
${item.date}
</div>
`)
.join("");
}
loadHistory();
drawHistoryChart();
function drawHistoryChart(){
const history =
JSON.parse(
localStorage.getItem(
"quizHistory"
) || "[]"
);
const chartData =
history
.slice(0,10)
.reverse();
const labels =
chartData.map(
(_,index) =>
`Quiz ${index+1}`
);
const scores =
chartData.map(
item =>
item.accuracy
);
const canvas =
document.getElementById(
"historyChart"
);
if(!canvas) return;
const ctx =
canvas.getContext("2d");
if(historyChart){
historyChart.destroy();
}
historyChart =
new Chart(ctx,{
type:"line",
data:{
labels,
datasets:[{
label:"Accuracy %",
data:scores,
borderColor:"#3b82f6",
backgroundColor:
"rgba(59,130,246,.2)",
fill:true,
tension:0.3
}]
},
options:{
responsive:true,
scales:{
y:{
min:0,
max:100,
ticks:{
color:"#ffffff"
}
},
x:{
ticks:{
color:"#ffffff"
}
}
},
plugins:{
legend:{
labels:{
color:"#ffffff"
}
}
}
}
});
}
