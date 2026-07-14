const MIN_NUM = 1;
const MAX_NUM = 100;
const MAX_ATTEMPTS = 7;

const attemptsValueEl = document.getElementById("attemptsValue");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const submitBtn = document.getElementById("submitBtn");
const resultEl = document.getElementById("result");
const resultTextEl = document.getElementById("resultText");
const restartBtn = document.getElementById("restartBtn");

let secret = 0;
let attemptsLeft = MAX_ATTEMPTS;
let over = false;

function randomSecret() {
  return Math.floor(Math.random() * (MAX_NUM - MIN_NUM + 1)) + MIN_NUM;
}

function setStatus(text, tone) {
  statusTextEl.textContent = text;
  statusEl.className = "status" + (tone ? " " + tone : "");
}

function renderAttempts() {
  attemptsValueEl.textContent = attemptsLeft;
}

function parseGuess(raw) {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isInteger(num)) return null;
  return num;
}

function endGame(tone, message) {
  over = true;
  guessInput.disabled = true;
  submitBtn.disabled = true;
  setStatus(message, tone);
  resultTextEl.textContent = `${message} 정답은 ${secret}이었어요.`;
  resultEl.classList.remove("hidden");
}

function handleGuess(e) {
  e.preventDefault();
  if (over) return;

  const guess = parseGuess(guessInput.value);
  const isValid = guess !== null && guess >= MIN_NUM && guess <= MAX_NUM;

  attemptsLeft -= 1;
  renderAttempts();

  if (!isValid) {
    setStatus(`${MIN_NUM}~${MAX_NUM} 사이의 정수를 입력해주세요`, "warning");
    guessInput.value = "";
    guessInput.focus();
    if (attemptsLeft <= 0) {
      endGame("lose", "기회를 다 썼어요 😢");
    }
    return;
  }

  if (guess === secret) {
    endGame("win", "정답입니다! 🎉");
    return;
  }

  if (guess < secret) {
    setStatus("더 높아요! Up ↑", "up");
  } else {
    setStatus("더 낮아요! Down ↓", "down");
  }

  guessInput.value = "";
  guessInput.focus();

  if (attemptsLeft <= 0) {
    endGame("lose", "기회를 다 썼어요 😢");
  }
}

function startGame() {
  secret = randomSecret();
  attemptsLeft = MAX_ATTEMPTS;
  over = false;

  guessInput.disabled = false;
  submitBtn.disabled = false;
  guessInput.value = "";
  resultEl.classList.add("hidden");

  setStatus("숫자를 입력하고 확인을 눌러보세요", "");
  renderAttempts();
  guessInput.focus();
}

guessForm.addEventListener("submit", handleGuess);
restartBtn.addEventListener("click", startGame);

startGame();
