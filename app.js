document.addEventListener('DOMContentLoaded', () => {
  // --- Modal Setup ---
  const modal      = document.getElementById('modal');
  const modalMsg   = document.getElementById('modal-message');
  const modalClose = document.getElementById('modal-close');
  function showModal(text) {
    modalMsg.textContent = text;
    modal.classList.remove('hidden');
  }
  modalClose.onclick = () => modal.classList.add('hidden');

  // --- Audio & DOM Refs ---
  const clickSound      = document.getElementById('click-sound');
  const winSound        = document.getElementById('win-sound');

  const secretInputs    = [...document.querySelectorAll('#secret-picker input')];
  const startBtn        = document.getElementById('start-btn');
  const howtoBtn        = document.getElementById('howto-btn');
  const howtoSection    = document.getElementById('how-to-play');
  const backBtn         = document.getElementById('back-btn');
  const secretError     = document.getElementById('secret-error');

  const setupSection    = document.getElementById('game-setup');
  const playSection     = document.getElementById('game-play');

  const userPanel       = document.getElementById('user-panel');
  const compPanel       = document.getElementById('computer-panel');

  const userGuessRow    = document.getElementById('user-guess-row');
  const userSubmitBtn   = document.getElementById('user-submit-btn');
  const userFeedback    = document.getElementById('user-feedback');
  const userAttemptsP   = document.getElementById('user-attempts');
  const userHistoryBody = document.getElementById('user-history-body');
  const userProgress    = document.getElementById('user-progress');
  const guessError      = document.getElementById('guess-error');

  const compAttemptsP   = document.getElementById('computer-attempts');
  const compGuessP      = document.getElementById('computer-guess');
  const compFeedback    = document.getElementById('computer-feedback');
  const compHistoryBody = document.getElementById('computer-history-body');
  const compProgress    = document.getElementById('computer-progress');

  // --- Game State ---
  let userSecret, compSecret;
  let userAttempts = 0, compAttempts = 0;
  let possibleSecrets = [];
  let previousGuesses = [];

  // --- Helpers ---
  function isValidSecret() {
    const vals = secretInputs.map(i => i.value.trim());
    if (vals.some(v => !/^[0-9]$/.test(v))) return false;
    return new Set(vals).size === 4;
  }

  function generateRandomSecret() {
    const s = [];
    while (s.length < 4) {
      const n = Math.floor(Math.random() * 10);
      if (!s.includes(n)) s.push(n);
    }
    return s;
  }

  function generateAllSecrets() {
    const arr = [], digits = [...Array(10).keys()];
    function backtrack(path) {
      if (path.length === 4) {
        arr.push([...path]);
        return;
      }
      for (let d of digits) {
        if (!path.includes(d)) {
          path.push(d);
          backtrack(path);
          path.pop();
        }
      }
    }
    backtrack([]);
    return arr;
  }

  function evaluateCounts(secret, guess) {
    let dead = 0, injured = 0;
    for (let i = 0; i < 4; i++) {
      if (guess[i] === secret[i]) dead++;
      else if (secret.includes(guess[i])) injured++;
    }
    return { dead, injured };
  }

  function updateAttempts(el, count) {
    el.textContent = `Attempts: ${count}`;
  }

  function updateProgress(container, deadCount) {
    container.querySelectorAll('.segment').forEach((seg, i) => {
      seg.classList.toggle('filled', i < deadCount);
    });
  }

  function addToHistory(tbody, guess, counts) {
    const tr = document.createElement('tr');
    tr.classList.add('fade-in');
    tr.innerHTML = `
      <td>${guess.join(' ')}</td>
      <td>${counts.dead} dead, ${counts.injured} injured</td>
    `;
    tbody.appendChild(tr);
    const histDiv = tbody.closest('.history');
    histDiv.scrollTop = histDiv.scrollHeight;
  }

  // --- How to Play Toggle ---
  howtoBtn.onclick = () => {
    setupSection.hidden = true;
    howtoSection.hidden = false;
  };
  backBtn.onclick = () => {
    howtoSection.hidden = true;
    setupSection.hidden = false;
  };

  // --- Secret Input Validation & Auto-Advance ---
  secretInputs.forEach((inp, idx) => {
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.maxLength = 1;
    inp.classList.add('digit-input');
    inp.addEventListener('input', () => {
      // strip non-digit
      inp.value = inp.value.replace(/\D/, '');
      // enable start if valid
      startBtn.disabled = !isValidSecret();
      // show duplicate error
      const vals = secretInputs.map(i => i.value);
      if (vals.every(v => v !== '') && new Set(vals).size < 4) {
        secretError.textContent = 'Digits must be unique';
      } else {
        secretError.textContent = '';
      }
      // auto-advance
      if (inp.value.length === 1 && idx < secretInputs.length - 1) {
        secretInputs[idx + 1].focus();
      }
    });
  });

  // --- Start Game ---
  startBtn.onclick = () => {
    userSecret       = secretInputs.map(i => parseInt(i.value, 10));
    compSecret       = generateRandomSecret();
    possibleSecrets  = generateAllSecrets();
    previousGuesses  = [];

    setupSection.hidden = true;
    playSection.hidden  = false;

  // **New:** show the user’s secret**
  document.getElementById('user-secret').textContent =
  'Secret: ' + userSecret.join(' ');

    userAttempts = 0;
    compAttempts = 0;
    updateAttempts(userAttemptsP, userAttempts);
    updateAttempts(compAttemptsP, compAttempts);
    nextUserGuess();
  };

  // --- User’s Turn ---
  function nextUserGuess() {
    userPanel.classList.add('active');
    compPanel.classList.remove('active');
    clickSound.play();

    guessError.textContent = '';
    userSubmitBtn.disabled = true;
    userFeedback.textContent = '';
    userGuessRow.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.maxLength = 1;
      inp.classList.add('digit-input');

      inp.addEventListener('input', () => {
        // strip non-digit
        inp.value = inp.value.replace(/\D/, '');
        // auto-advance
        if (inp.value.length === 1 && inp.nextElementSibling) {
          inp.nextElementSibling.focus();
        }
        // inline duplicate check
        const vals = [...userGuessRow.querySelectorAll('input')]
          .map(i => i.value)
          .filter(v => v !== '');
        if (new Set(vals).size < vals.length) {
          guessError.textContent = 'No duplicate digits allowed';
        } else {
          guessError.textContent = '';
        }
        userSubmitBtn.disabled =
          vals.length < 4 || new Set(vals).size < 4;
      });

      userGuessRow.appendChild(inp);
    }

    // focus first
    const first = userGuessRow.querySelector('input');
    if (first) first.focus();
  }

  userSubmitBtn.onclick = () => {
    clickSound.play();

    const vals = [...userGuessRow.querySelectorAll('input')].map(i => i.value);
    const guess = vals.map(v => parseInt(v, 10));

    // enforce unique digits
    if (new Set(vals).size < 4) {
      return showModal('Please enter 4 unique digits.');
    }
    // enforce no repeat guess
    if (previousGuesses.some(g => g.join() === guess.join())) {
      return showModal(`You already guessed ${guess.join(' ')}.`);
    }
    previousGuesses.push(guess);

    userAttempts++;
    updateAttempts(userAttemptsP, userAttempts);

    const counts = evaluateCounts(compSecret, guess);
    userFeedback.textContent = `${counts.dead} dead, ${counts.injured} injured`;
    updateProgress(userProgress, counts.dead);
    addToHistory(userHistoryBody, guess, counts);

    if (counts.dead === 4) {
      winSound.play();
      if (navigator.vibrate) navigator.vibrate(200);
      return showModal(`You win in ${userAttempts} guesses!`);
    }

    setTimeout(computerTurn, 500);
  };

  // --- Computer’s Turn ---
  function computerTurn() {
    userPanel.classList.remove('active');
    compPanel.classList.add('active');
    clickSound.play();

    compGuessP.textContent = 'Computer is thinking…';
    compFeedback.textContent = '';

    setTimeout(() => {
      compAttempts++;
      updateAttempts(compAttemptsP, compAttempts);

      const idx       = Math.floor(Math.random() * possibleSecrets.length);
      const compGuess = possibleSecrets.splice(idx, 1)[0];

      compGuessP.textContent = `Computer guesses: ${compGuess.join(' ')}`;
      const counts = evaluateCounts(userSecret, compGuess);
      compFeedback.textContent = `${counts.dead} dead, ${counts.injured} injured`;
      updateProgress(compProgress, counts.dead);
      addToHistory(compHistoryBody, compGuess, counts);

      if (counts.dead === 4) {
        winSound.play();
        if (navigator.vibrate) navigator.vibrate(200);
        return showModal(`Computer wins in ${compAttempts} guesses!`);
      }
      nextUserGuess();
    }, 1000);
  }

  // --- Register Service Worker ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
