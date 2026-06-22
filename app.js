(() => {
  const boardEl = document.querySelector("[data-board]");
  const timerEl = document.querySelector("[data-timer]");
  const livesEl = document.querySelector("[data-lives]");
  const statusEl = document.querySelector("[data-status]");
  const toastEl = document.querySelector("[data-toast]");
  const difficultyEl = document.querySelector("[data-difficulty]");
  const noteBtn = document.querySelector("[data-note]");
  const modeBtns = document.querySelectorAll("[data-mode]");
  const recordsBtn = document.querySelector("[data-records]");
  const recordsPanel = document.querySelector("[data-records-panel]");
  const closeRecordsBtn = document.querySelector("[data-close-records]");
  const rankClassicEl = document.querySelector("[data-rank-classic]");
  const rankDailyEl = document.querySelector("[data-rank-daily]");
  const achievementsEl = document.querySelector("[data-achievements]");

  const btnNew = document.querySelector("[data-newgame]");
  const btnCheck = document.querySelector("[data-check]");
  const btnHint = document.querySelector("[data-hint]");
  const btnUndo = document.querySelector("[data-undo]");
  const btnClear = document.querySelector("[data-clear]");

  const SAVE_KEY = "sudoku.current.v2";
  const STATS_KEY = "sudoku.stats.v2";

  const DIFF = {
    easy: 40,
    medium: 48,
    hard: 56,
  };

  let solution = Array(81).fill(0);
  let puzzle = Array(81).fill(0);
  let values = Array(81).fill(0);
  let notes = Array.from({ length: 81 }, () => new Set());
  let selected = -1;
  let noteMode = false;
  let history = [];
  let timer = 0;
  let timerId = null;
  let fixed = new Set();
  let lives = 3;
  let gameMode = "classic";
  let gameOver = false;
  let gameSeed = null;

  const showToast = (msg) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.hidden = true;
    }, 1500);
  };

  const formatTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const mulberry32 = (seed) => {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const hashString = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const getStats = () => {
    try {
      const d = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      return {
        classicBest: d.classicBest || {},
        dailyBest: d.dailyBest || {},
        achievements: d.achievements || [],
      };
    } catch {
      return { classicBest: {}, dailyBest: {}, achievements: [] };
    }
  };

  const saveStats = (stats) => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  };

  const unlockAchievement = (id, label) => {
    const stats = getStats();
    if (!stats.achievements.some((a) => a.id === id)) {
      stats.achievements.push({ id, label, at: new Date().toISOString() });
      saveStats(stats);
      showToast(`成就达成：${label}`);
      renderRecords();
    }
  };

  const renderRecords = () => {
    const stats = getStats();
    rankClassicEl.innerHTML = "";
    rankDailyEl.innerHTML = "";
    achievementsEl.innerHTML = "";

    ["easy", "medium", "hard"].forEach((d) => {
      const li = document.createElement("li");
      li.textContent = `${d}：${
        stats.classicBest[d] ? formatTime(stats.classicBest[d]) : "暂无"
      }`;
      rankClassicEl.appendChild(li);
    });

    const dailyKeys = Object.keys(stats.dailyBest).sort().slice(-5).reverse();
    if (!dailyKeys.length) {
      const li = document.createElement("li");
      li.textContent = "暂无记录";
      rankDailyEl.appendChild(li);
    } else {
      dailyKeys.forEach((k) => {
        const li = document.createElement("li");
        li.textContent = `${k}：${formatTime(stats.dailyBest[k])}`;
        rankDailyEl.appendChild(li);
      });
    }

    if (!stats.achievements.length) {
      const li = document.createElement("li");
      li.textContent = "暂无成就";
      achievementsEl.appendChild(li);
    } else {
      stats.achievements.forEach((a) => {
        const li = document.createElement("li");
        li.textContent = `${a.label}`;
        achievementsEl.appendChild(li);
      });
    }
  };

  const idx = (r, c) => r * 9 + c;
  const rowCol = (i) => [Math.floor(i / 9), i % 9];

  const isValidAt = (arr, i, val) => {
    if (val === 0) return true;
    const [r, c] = rowCol(i);
    for (let x = 0; x < 9; x++) {
      const ri = idx(r, x);
      const ci = idx(x, c);
      if (ri !== i && arr[ri] === val) return false;
      if (ci !== i && arr[ci] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        const bi = idx(rr, cc);
        if (bi !== i && arr[bi] === val) return false;
      }
    }
    return true;
  };

  const findEmpty = (arr) => arr.findIndex((v) => v === 0);

  const shuffle = (arr, rng = Math.random) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const solve = (arr, rng = Math.random) => {
    const i = findEmpty(arr);
    if (i === -1) return true;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    for (const n of nums) {
      if (isValidAt(arr, i, n)) {
        arr[i] = n;
        if (solve(arr, rng)) return true;
      }
    }
    arr[i] = 0;
    return false;
  };

  const makeSolvedBoard = (rng = Math.random) => {
    const arr = Array(81).fill(0);
    solve(arr, rng);
    return arr;
  };

  const makePuzzle = (solved, removeCount, rng = Math.random) => {
    const p = solved.slice();
    const positions = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
    for (let i = 0; i < removeCount; i++) {
      p[positions[i]] = 0;
    }
    return p;
  };

  const renderLives = () => {
    const full = "❤";
    const empty = "♡";
    let t = "";
    for (let i = 0; i < 3; i++) t += i < lives ? full : empty;
    livesEl.textContent = t.split("").join(" ");
  };

  const saveCurrentGame = () => {
    const data = {
      solution,
      puzzle,
      values,
      notes: notes.map((s) => [...s]),
      selected,
      noteMode,
      timer,
      lives,
      mode: gameMode,
      difficulty: difficultyEl.value,
      gameOver,
      seed: gameSeed,
      date: formatDate(new Date()),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  };

  const loadCurrentGame = () => {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!d) return false;
      if (!Array.isArray(d.solution) || d.solution.length !== 81) return false;
      if (d.mode === "daily" && d.date !== formatDate(new Date())) return false;
      solution = d.solution;
      puzzle = d.puzzle;
      values = d.values;
      notes = (d.notes || []).map((a) => new Set(a));
      selected = d.selected ?? -1;
      noteMode = !!d.noteMode;
      timer = d.timer ?? 0;
      lives = d.lives ?? 3;
      gameMode = d.mode || "classic";
      gameOver = !!d.gameOver;
      gameSeed = d.seed || null;
      difficultyEl.value = d.difficulty || "medium";
      fixed = new Set();
      puzzle.forEach((v, i) => {
        if (v !== 0) fixed.add(i);
      });
      noteBtn.textContent = `笔记模式: ${noteMode ? "开" : "关"}`;
      timerEl.textContent = formatTime(timer);
      updateModeUI();
      renderLives();
      return true;
    } catch {
      return false;
    }
  };

  const renderCell = (cell, i) => {
    const v = values[i];
    const isGiven = fixed.has(i);
    cell.className = "cell";
    if (isGiven) cell.classList.add("given");
    if (i === selected) cell.classList.add("selected");

    if (selected >= 0) {
      const [sr, sc] = rowCol(selected);
      const [r, c] = rowCol(i);
      const sameBlock = Math.floor(sr / 3) === Math.floor(r / 3) && Math.floor(sc / 3) === Math.floor(c / 3);
      if (r === sr || c === sc || sameBlock) cell.classList.add("peer");
      if (values[selected] !== 0 && values[selected] === v) cell.classList.add("same");
      if (i === selected) cell.classList.remove("peer");
    }

    const valid = isValidAt(values, i, v);
    if (v !== 0 && !valid) cell.classList.add("error");

    cell.textContent = "";
    const oldNotes = cell.querySelector(".notes");
    if (oldNotes) oldNotes.remove();

    if (v !== 0) {
      cell.textContent = String(v);
    } else if (notes[i].size) {
      const notesEl = document.createElement("div");
      notesEl.className = "notes";
      for (let n = 1; n <= 9; n++) {
        const s = document.createElement("span");
        s.textContent = notes[i].has(n) ? String(n) : "";
        notesEl.appendChild(s);
      }
      cell.appendChild(notesEl);
    }
  };

  const render = () => {
    const cells = boardEl.querySelectorAll(".cell");
    cells.forEach((cell, i) => renderCell(cell, i));
  };

  const saveHistory = () => {
    history.push({
      values: values.slice(),
      notes: notes.map((s) => new Set([...s])),
      selected,
    });
    if (history.length > 200) history.shift();
  };

  const setStatus = (text) => {
    statusEl.textContent = text;
  };

  const checkWin = () => {
    const full = values.every((v) => v !== 0);
    if (!full) return false;
    for (let i = 0; i < 81; i++) {
      if (values[i] !== solution[i]) return false;
    }
    return true;
  };

  const finishGame = (win) => {
    clearInterval(timerId);
    gameOver = true;
    saveCurrentGame();

    if (!win) {
      setStatus("生命值耗尽，挑战失败。点击新游戏再来一局。");
      showToast("本局失败");
      return;
    }

    setStatus(`恭喜通关！用时 ${formatTime(timer)}`);
    showToast("你完成了数独！");
    const stats = getStats();
    if (gameMode === "daily") {
      const day = formatDate(new Date());
      const prev = stats.dailyBest[day];
      if (!prev || timer < prev) stats.dailyBest[day] = timer;
    } else {
      const d = difficultyEl.value;
      const prev = stats.classicBest[d];
      if (!prev || timer < prev) stats.classicBest[d] = timer;
    }
    saveStats(stats);
    if (gameMode === "daily") unlockAchievement("daily_finish", "完成首次每日挑战");
    if (gameMode === "classic" && difficultyEl.value === "hard") unlockAchievement("hard_finish", "完成困难难度");
    if (timer <= 300) unlockAchievement("speed_5min", "5 分钟内通关");
    renderRecords();
  };

  const placeNumber = (n) => {
    if (selected < 0 || fixed.has(selected) || gameOver) return;
    saveHistory();
    if (noteMode) {
      const bag = notes[selected];
      if (bag.has(n)) bag.delete(n);
      else bag.add(n);
    } else {
      values[selected] = n;
      notes[selected].clear();
      if (values[selected] !== solution[selected]) {
        lives = Math.max(0, lives - 1);
        renderLives();
        showToast(`填错了，剩余 ${lives} 条命`);
        if (lives === 0) {
          render();
          finishGame(false);
          return;
        }
      }
    }
    render();
    saveCurrentGame();

    if (!noteMode && values[selected] === solution[selected]) {
      boardEl.children[selected].classList.add("solved");
      setTimeout(() => boardEl.children[selected]?.classList.remove("solved"), 260);
    }

    if (checkWin()) {
      finishGame(true);
    }
  };

  const clearCell = () => {
    if (selected < 0 || fixed.has(selected) || gameOver) return;
    saveHistory();
    values[selected] = 0;
    notes[selected].clear();
    render();
    saveCurrentGame();
  };

  const giveHint = () => {
    if (gameOver) return;
    const empties = [];
    for (let i = 0; i < 81; i++) if (values[i] === 0) empties.push(i);
    if (!empties.length) return showToast("没有可提示的空格了");
    const i = empties[Math.floor(Math.random() * empties.length)];
    saveHistory();
    values[i] = solution[i];
    notes[i].clear();
    selected = i;
    render();
    saveCurrentGame();
    showToast("已给出一个提示");
  };

  const checkBoard = () => {
    let errors = 0;
    for (let i = 0; i < 81; i++) {
      if (values[i] !== 0 && values[i] !== solution[i]) errors++;
    }
    if (errors === 0) showToast("目前没有错误");
    else showToast(`发现 ${errors} 处错误`);
    setStatus(errors ? "继续加油，修正错误后更容易通关。" : "状态很好，继续完成所有格子。");
    render();
  };

  const undo = () => {
    const last = history.pop();
    if (!last) return showToast("没有可撤销的操作");
    values = last.values;
    notes = last.notes;
    selected = last.selected;
    render();
    saveCurrentGame();
  };

  const startTimer = () => {
    clearInterval(timerId);
    timerEl.textContent = formatTime(timer);
    timerId = setInterval(() => {
      if (gameOver) return;
      timer += 1;
      timerEl.textContent = formatTime(timer);
      saveCurrentGame();
    }, 1000);
  };

  const buildBoard = () => {
    boardEl.innerHTML = "";
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const i = idx(r, c);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.setAttribute("data-row", String(r));
        cell.setAttribute("data-col", String(c));
        cell.addEventListener("click", () => {
          selected = i;
          render();
        });
        boardEl.appendChild(cell);
      }
    }
  };

  const updateModeUI = () => {
    modeBtns.forEach((btn) => {
      const active = btn.dataset.mode === gameMode;
      btn.classList.toggle("primary", active);
    });
    difficultyEl.disabled = gameMode === "daily";
  };

  const newGame = (mode = gameMode) => {
    gameMode = mode;
    const dailyDate = formatDate(new Date());
    const seedString = mode === "daily" ? `daily-${dailyDate}` : `${Date.now()}-${Math.random()}`;
    gameSeed = seedString;
    const rng = mulberry32(hashString(seedString));
    const remove = mode === "daily" ? 52 : DIFF[difficultyEl.value] ?? DIFF.medium;
    solution = makeSolvedBoard(rng);
    puzzle = makePuzzle(solution, remove, rng);
    values = puzzle.slice();
    fixed = new Set();
    values.forEach((v, i) => {
      if (v !== 0) fixed.add(i);
    });
    notes = Array.from({ length: 81 }, () => new Set());
    history = [];
    selected = -1;
    gameOver = false;
    lives = 3;
    timer = 0;
    renderLives();
    updateModeUI();
    setStatus(mode === "daily" ? `今日挑战 ${dailyDate} 已开始` : "已开始新局，祝你好运！");
    startTimer();
    render();
    saveCurrentGame();
  };

  const bindEvents = () => {
    document.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => placeNumber(Number(btn.dataset.key)));
    });

    btnNew.addEventListener("click", () => newGame(gameMode));
    btnCheck.addEventListener("click", checkBoard);
    btnHint.addEventListener("click", giveHint);
    btnUndo.addEventListener("click", undo);
    btnClear.addEventListener("click", clearCell);

    noteBtn.addEventListener("click", () => {
      noteMode = !noteMode;
      noteBtn.textContent = `笔记模式: ${noteMode ? "开" : "关"}`;
      showToast(noteMode ? "笔记模式已开启" : "笔记模式已关闭");
      saveCurrentGame();
    });

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (!mode) return;
        newGame(mode);
      });
    });

    recordsBtn.addEventListener("click", () => {
      renderRecords();
      recordsPanel.hidden = false;
    });
    closeRecordsBtn.addEventListener("click", () => {
      recordsPanel.hidden = true;
    });
    recordsPanel.addEventListener("click", (e) => {
      if (e.target === recordsPanel) recordsPanel.hidden = true;
    });

    window.addEventListener("keydown", (e) => {
      if (e.key >= "1" && e.key <= "9") placeNumber(Number(e.key));
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") clearCell();
      if (e.key.toLowerCase() === "n") {
        noteMode = !noteMode;
        noteBtn.textContent = `笔记模式: ${noteMode ? "开" : "关"}`;
      }
      if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey)) undo();
      if (e.key.startsWith("Arrow") && selected >= 0) {
        e.preventDefault();
        let [r, c] = rowCol(selected);
        if (e.key === "ArrowUp") r = (r + 8) % 9;
        if (e.key === "ArrowDown") r = (r + 1) % 9;
        if (e.key === "ArrowLeft") c = (c + 8) % 9;
        if (e.key === "ArrowRight") c = (c + 1) % 9;
        selected = idx(r, c);
        render();
      }
    });
  };

  buildBoard();
  bindEvents();
  renderRecords();
  const restored = loadCurrentGame();
  if (!restored) newGame("classic");
  else startTimer();
  render();
})();

