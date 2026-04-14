/* ─── CONTRACTION TIMER APP ─── */

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════

const state = {
  contractions: [],     // { startTime, endTime, duration, interval }
  contractionStart: null, // timestamp ms — set while active
  isActive: false,
  timerInterval: null,  // active contraction tick
  restInterval: null,   // rest-between tick
};

const STORAGE_KEY = 'contraction-timer-v1';

// ═══════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════

const timerDisplay = document.getElementById('timer-display');
const timerLabel   = document.getElementById('timer-label');
const timerSub     = document.getElementById('timer-sub');
const timerCard    = document.getElementById('timer-card');
const btnStart     = document.getElementById('btn-start');
const btnStop      = document.getElementById('btn-stop');
const statusBanner = document.getElementById('status-banner');
const statusIcon   = document.getElementById('status-icon');
const statusText   = document.getElementById('status-text');
const hospitalCard = document.getElementById('hospital-card');
const hospitalTitle= document.getElementById('hospital-title');
const hospitalRule = document.getElementById('hospital-rule');
const logBody      = document.getElementById('log-body');

const btnUndo     = document.getElementById('btn-undo');

const statCount   = document.getElementById('stat-count');
const statAvgDur  = document.getElementById('stat-avg-dur');
const statAvgFreq = document.getElementById('stat-avg-freq');
const statLastDur = document.getElementById('stat-last-dur');

// ═══════════════════════════════════════
// CHART SETUP
// ═══════════════════════════════════════

const durationCtx  = document.getElementById('durationChart').getContext('2d');
const frequencyCtx = document.getElementById('frequencyChart').getContext('2d');

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500, easing: 'easeOutBounce' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0D0D0D',
      titleFont: { family: 'Anton, sans-serif', size: 13 },
      bodyFont:  { family: 'Nunito, sans-serif', size: 12, weight: '700' },
      padding: 10,
      cornerRadius: 6,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { family: 'Anton, sans-serif', size: 11 }, color: '#0D0D0D' },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { family: 'Nunito, sans-serif', size: 11, weight: '700' }, color: '#0D0D0D' },
      beginAtZero: true,
    },
  },
};

const durationChart = new Chart(durationCtx, {
  type: 'bar',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: '#0D0D0D', borderWidth: 2, borderRadius: 6 }] },
  options: {
    ...chartDefaults,
    scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display: true, text: 'seconds', font: { family: 'Nunito, sans-serif', weight: '700', size: 11 } } } },
  },
});

const frequencyChart = new Chart(frequencyCtx, {
  type: 'line',
  data: { labels: [], datasets: [{ data: [], backgroundColor: 'rgba(0,207,255,0.25)', borderColor: '#0D0D0D', borderWidth: 3, pointBackgroundColor: [], pointBorderColor: '#0D0D0D', pointBorderWidth: 2, pointRadius: 6, fill: true, tension: 0.4 }] },
  options: {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      tooltip: {
        ...chartDefaults.plugins.tooltip,
        callbacks: {
          label: ctx => ` ${formatMinSec(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        title: { display: true, text: 'mm:ss', font: { family: 'Nunito, sans-serif', weight: '700', size: 11 } },
        ticks: {
          ...chartDefaults.scales.y.ticks,
          callback: val => formatMinSec(val),
        },
      },
    },
  },
});

// ═══════════════════════════════════════
// LOCALSTORAGE
// ═══════════════════════════════════════

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    contractions: state.contractions,
    contractionStart: state.contractionStart,
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.contractions = saved.contractions || [];
    state.contractionStart = saved.contractionStart || null;
  } catch {
    // corrupt data — ignore
  }
}

// ═══════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatHHMM(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Convert a float number of minutes to "MM:SS"
function formatMinSec(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ═══════════════════════════════════════
// REST COUNTER (between contractions)
// ═══════════════════════════════════════

function startRestCounter() {
  stopRestCounter();
  const lastEnd = state.contractions.length > 0
    ? state.contractions[state.contractions.length - 1].endTime
    : null;

  if (!lastEnd) return;

  timerCard.classList.remove('active');
  timerCard.classList.add('resting');
  timerLabel.textContent = 'REST';

  function tick() {
    const elapsed = Math.floor((Date.now() - lastEnd) / 1000);
    timerDisplay.textContent = formatTime(elapsed);
    timerDisplay.style.color = '';

    if (elapsed < 60) {
      timerSub.textContent = 'Resting — press START when the next contraction begins';
    } else {
      const mins = (elapsed / 60).toFixed(1);
      timerSub.textContent = `${mins} min rest so far`;
    }
  }

  tick();
  state.restInterval = setInterval(tick, 500);
}

function stopRestCounter() {
  if (state.restInterval) {
    clearInterval(state.restInterval);
    state.restInterval = null;
  }
  timerCard.classList.remove('resting');
}

// ═══════════════════════════════════════
// START CONTRACTION
// ═══════════════════════════════════════

function startContraction() {
  if (state.isActive) return;

  stopRestCounter();

  state.isActive = true;
  state.contractionStart = Date.now();

  saveState();

  timerCard.classList.add('active');
  timerLabel.textContent = 'CONTRACTION';
  timerSub.textContent   = 'Contraction in progress…';
  timerDisplay.style.color = '';
  btnStart.disabled = true;
  btnStop.disabled  = false;

  addRipple(btnStart);

  state.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.contractionStart) / 1000);
    timerDisplay.textContent = formatTime(elapsed);

    if (elapsed >= 60) {
      timerDisplay.style.color = '#FF1744';
    } else if (elapsed >= 45) {
      timerDisplay.style.color = '#FF6D00';
    } else {
      timerDisplay.style.color = '';
    }
  }, 250);
}

// ═══════════════════════════════════════
// STOP CONTRACTION
// ═══════════════════════════════════════

function stopContraction() {
  if (!state.isActive) return;

  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.isActive = false;

  const endTime  = Date.now();
  const duration = Math.floor((endTime - state.contractionStart) / 1000);

  let interval = null;
  if (state.contractions.length > 0) {
    const prev = state.contractions[state.contractions.length - 1];
    interval = (state.contractionStart - prev.startTime) / 60000;
  }

  const contraction = { startTime: state.contractionStart, endTime, duration, interval };
  state.contractions.push(contraction);
  state.contractionStart = null;

  saveState();
  updateUndoButton();

  timerCard.classList.remove('active');
  timerDisplay.style.color = '';
  btnStart.disabled = false;
  btnStop.disabled  = true;

  addRipple(btnStop);

  updateStats();
  updateCharts();
  updateLog(contraction);
  updateStatus();
  startRestCounter();
}

// ═══════════════════════════════════════
// RESET
// ═══════════════════════════════════════

function resetAll() {
  if (state.isActive) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.isActive = false;
  }
  stopRestCounter();

  state.contractions = [];
  state.contractionStart = null;
  localStorage.removeItem(STORAGE_KEY);
  updateUndoButton();

  timerCard.classList.remove('active', 'resting');
  timerLabel.textContent   = 'READY';
  timerDisplay.textContent = '00:00';
  timerDisplay.style.color = '';
  timerSub.textContent     = 'Press START to begin a contraction';
  btnStart.disabled = false;
  btnStop.disabled  = true;

  animateStat(statCount,   '0');
  animateStat(statAvgDur,  '—');
  animateStat(statAvgFreq, '—');
  animateStat(statLastDur, '—');

  durationChart.data.labels = [];
  durationChart.data.datasets[0].data = [];
  durationChart.data.datasets[0].backgroundColor = [];
  durationChart.update();

  frequencyChart.data.labels = [];
  frequencyChart.data.datasets[0].data = [];
  frequencyChart.data.datasets[0].pointBackgroundColor = [];
  frequencyChart.update();

  logBody.innerHTML = '<tr class="log-empty"><td colspan="5">No contractions recorded yet</td></tr>';

  setStatus('ok', '✓', 'Keep timing — you\'re doing great!');
  setHospital('ok', 'MONITORING', 'Stay home during early labour — rest, eat lightly, keep hydrated.\n\nCall your maternity unit when contractions are regular, every 5 min, lasting ≥ 45 sec.\n\nCall immediately for: waters breaking · any bleeding · reduced baby movements · or if you are worried.');
}

// ═══════════════════════════════════════
// STATS
// ═══════════════════════════════════════

function updateStats() {
  const cs = state.contractions;
  const n  = cs.length;

  animateStat(statCount, String(n));
  animateStat(statLastDur, String(cs[n - 1].duration));

  const avgDur = Math.round(cs.reduce((s, c) => s + c.duration, 0) / n);
  animateStat(statAvgDur, String(avgDur));

  const intervals = cs.filter(c => c.interval !== null).map(c => c.interval);
  if (intervals.length > 0) {
    const avgFreq = (intervals.reduce((s, v) => s + v, 0) / intervals.length).toFixed(1);
    animateStat(statAvgFreq, String(avgFreq));
  }
}

function animateStat(el, value) {
  el.textContent = value;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

// ═══════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════

function durationColor(s) {
  if (s >= 60) return '#FF1744';
  if (s >= 45) return '#FF6D00';
  return '#00E676';
}

function freqColor(min) {
  if (min <= 5)  return '#FF1744';
  if (min <= 10) return '#FF6D00';
  return '#00E676';
}

function updateCharts() {
  const cs     = state.contractions;
  const labels = cs.map((_, i) => `#${i + 1}`);

  durationChart.data.labels = labels;
  durationChart.data.datasets[0].data = cs.map(c => c.duration);
  durationChart.data.datasets[0].backgroundColor = cs.map(c => durationColor(c.duration));
  durationChart.update();

  const freqLabels = [], freqData = [], freqColors = [];
  cs.forEach((c, i) => {
    if (c.interval !== null) {
      freqLabels.push(`#${i} → #${i + 1}`);
      freqData.push(parseFloat(c.interval.toFixed(2)));
      freqColors.push(freqColor(c.interval));
    }
  });

  frequencyChart.data.labels = freqLabels;
  frequencyChart.data.datasets[0].data = freqData;
  frequencyChart.data.datasets[0].pointBackgroundColor = freqColors;
  frequencyChart.update();
}

// ═══════════════════════════════════════
// LOG
// ═══════════════════════════════════════

function buildLog() {
  logBody.innerHTML = '';
  if (state.contractions.length === 0) {
    logBody.innerHTML = '<tr class="log-empty"><td colspan="5">No contractions recorded yet</td></tr>';
    return;
  }
  // Render all rows (newest first, no animation on restore)
  [...state.contractions].reverse().forEach((c, ri) => {
    const i = state.contractions.length - 1 - ri;
    appendLogRow(c, i + 1, false);
  });
}

function updateLog(contraction) {
  const empty = logBody.querySelector('.log-empty');
  if (empty) empty.remove();
  appendLogRow(contraction, state.contractions.length, true);
}

function appendLogRow(contraction, n, animate) {
  const status   = contractionStatus(contraction);
  const interval = contraction.interval !== null ? formatMinSec(contraction.interval) : '—';
  const row = document.createElement('tr');
  row.className = `log-${status.level}${animate ? ' new-row' : ''}`;
  row.innerHTML = `
    <td>${n}</td>
    <td>${formatHHMM(new Date(contraction.startTime))}</td>
    <td>${contraction.duration}s</td>
    <td>${interval}</td>
    <td><span class="badge badge-${status.level}">${status.label}</span></td>
  `;
  logBody.prepend(row);
}

function contractionStatus(c) {
  const durDanger  = c.duration >= 60;
  const durWarn    = c.duration >= 45;
  const freqDanger = c.interval !== null && c.interval <= 5;
  const freqWarn   = c.interval !== null && c.interval <= 10;

  if (durDanger || freqDanger) return { level: 'danger', label: 'ALERT' };
  if (durWarn   || freqWarn)   return { level: 'warn',   label: 'WATCH' };
  return                               { level: 'ok',    label: 'OK' };
}

// ═══════════════════════════════════════
// NHS HOSPITAL GUIDANCE
// Based on: nhs.uk/pregnancy/labour-and-birth
//
// STAY HOME  — irregular, >10 min apart, <45s
// CALL UNIT  — regular pattern forming, 5–10 min apart, or ≥45s duration
// GO NOW     — every ≤5 min, lasting ≥45s, consistently (3+ contractions)
//
// Always call immediately for: waters breaking, heavy bleeding,
// reduced baby movements, or if you are worried at any point.
// ═══════════════════════════════════════

function updateStatus() {
  const cs = state.contractions;
  const n  = cs.length;

  if (n === 0) {
    setStatus('ok', '✓', 'Keep timing — you\'re doing great!');
    setHospital('ok', 'MONITORING', 'Stay home during early labour — rest, eat lightly, keep hydrated.\n\nCall your maternity unit when contractions are regular, every 5 min, lasting ≥ 45 sec.\n\nCall immediately for: waters breaking · any bleeding · reduced baby movements · or if you are worried.');
    return;
  }

  // Assess the most recent contractions (up to last 6)
  const recent    = cs.slice(-6);
  const avgDur    = recent.reduce((s, c) => s + c.duration, 0) / recent.length;
  const intervals = recent.filter(c => c.interval !== null).map(c => c.interval);
  const avgFreq   = intervals.length ? intervals.reduce((s, v) => s + v, 0) / intervals.length : Infinity;
  const lastFreq  = intervals.length ? intervals[intervals.length - 1] : Infinity;

  // NHS: go to hospital — contractions every 5 min, lasting ≥45s, established pattern (3+)
  const goNow = n >= 3 && avgFreq <= 5 && avgDur >= 45;

  // NHS: call maternity unit — contractions getting regular (5–10 min) or lasting ≥45s
  const callUnit = (avgFreq <= 10 && avgFreq > 5 && avgDur >= 30)
                || (avgDur >= 45)
                || (lastFreq <= 5 && n >= 2);

  if (goNow) {
    setStatus('danger', '🚨', 'Go to your maternity unit now — contractions are regular, frequent and strong.');
    setHospital('danger', 'GO TO HOSPITAL', 'NHS: contractions every ≤ 5 min, lasting ≥ 45 sec. Go to your maternity unit or call 999 if needed.\n\nAlso go immediately if: waters break · heavy bleeding · baby not moving normally.');
  } else if (callUnit) {
    setStatus('warn', '📞', 'Call your midwife or maternity unit — contractions are establishing.');
    setHospital('warn', 'CALL YOUR MIDWIFE', 'NHS: contractions are getting regular (every 5–10 min) or lasting ≥ 45 sec — call your maternity unit now.\n\nCall immediately if: waters break · heavy bleeding · baby not moving normally · you\'re worried.');
  } else {
    const msg = n === 1
      ? '1 contraction recorded. Keep timing — call your midwife if you\'re unsure.'
      : `${n} contractions recorded. Keep monitoring — contractions are still irregular or mild.`;
    setStatus('ok', '✓', msg);
    setHospital('ok', 'MONITORING', 'Stay home during early labour — rest, eat lightly, keep hydrated.\n\nCall your maternity unit when contractions are regular, every 5 min, lasting ≥ 45 sec.\n\nCall immediately for: waters breaking · any bleeding · reduced baby movements · or if you are worried.');
  }
}

function setStatus(level, icon, text) {
  statusBanner.className = `status-banner status-${level}`;
  statusIcon.textContent = icon;
  statusText.textContent = text;
}

function setHospital(level, title, rule) {
  hospitalCard.className = `hospital-card${level !== 'ok' ? ' ' + level : ''}`;
  hospitalTitle.textContent = title;
  hospitalRule.textContent  = rule;
}

// ═══════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════

function exportCSV() {
  const cs = state.contractions;
  if (cs.length === 0) return;

  const rows = [
    ['#', 'Start Time', 'Duration (s)', 'Interval (mm:ss)', 'Status'],
    ...cs.map((c, i) => {
      const status = contractionStatus(c);
      const interval = c.interval !== null ? formatMinSec(c.interval) : '';
      const startTime = new Date(c.startTime).toLocaleString();
      return [i + 1, startTime, c.duration, interval, status.label];
    }),
  ];

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `contractions-${new Date().toISOString().slice(0, 16).replace('T', '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════
// UNDO
// ═══════════════════════════════════════

function updateUndoButton() {
  btnUndo.disabled = state.contractions.length === 0;
}

function undoLast() {
  if (state.contractions.length === 0) return;

  state.contractions.pop();
  saveState();

  // If resting between contractions, update the rest counter
  if (!state.isActive) {
    stopRestCounter();
    if (state.contractions.length > 0) {
      startRestCounter();
    } else {
      timerCard.classList.remove('resting');
      timerLabel.textContent   = 'READY';
      timerDisplay.textContent = '00:00';
      timerSub.textContent     = 'Press START to begin a contraction';
    }
  }

  if (state.contractions.length > 0) {
    updateStats();
    updateCharts();
  } else {
    animateStat(statCount,   '0');
    animateStat(statAvgDur,  '—');
    animateStat(statAvgFreq, '—');
    animateStat(statLastDur, '—');
    durationChart.data.labels = [];
    durationChart.data.datasets[0].data = [];
    durationChart.data.datasets[0].backgroundColor = [];
    durationChart.update();
    frequencyChart.data.labels = [];
    frequencyChart.data.datasets[0].data = [];
    frequencyChart.data.datasets[0].pointBackgroundColor = [];
    frequencyChart.update();
  }

  buildLog();
  updateStatus();
  updateUndoButton();
}

// ═══════════════════════════════════════
// RIPPLE
// ═══════════════════════════════════════

function addRipple(btn) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  ripple.style.width  = ripple.style.height = `${size}px`;
  ripple.style.left   = `${btn.offsetWidth  / 2 - size / 2}px`;
  ripple.style.top    = `${btn.offsetHeight / 2 - size / 2}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ═══════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    state.isActive ? stopContraction() : startContraction();
  }
});

// ═══════════════════════════════════════
// RESTORE FROM LOCALSTORAGE
// ═══════════════════════════════════════

function restoreFromStorage() {
  loadState();

  const n = state.contractions.length;
  updateUndoButton();

  if (n === 0 && !state.contractionStart) {
    // Nothing saved — default init state
    btnStop.disabled = true;
    return;
  }

  // Rebuild UI from saved data
  updateStats();
  updateCharts();
  buildLog();
  updateStatus();

  if (state.contractionStart) {
    // Was mid-contraction when page closed/refreshed — resume it
    state.isActive = true;
    timerCard.classList.add('active');
    timerLabel.textContent = 'CONTRACTION';
    timerSub.textContent   = 'Contraction in progress…';
    btnStart.disabled = true;
    btnStop.disabled  = false;

    state.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.contractionStart) / 1000);
      timerDisplay.textContent = formatTime(elapsed);
      if (elapsed >= 60)      timerDisplay.style.color = '#FF1744';
      else if (elapsed >= 45) timerDisplay.style.color = '#FF6D00';
      else                    timerDisplay.style.color = '';
    }, 250);

  } else if (n > 0) {
    // Between contractions — show rest counter
    btnStart.disabled = false;
    btnStop.disabled  = true;
    startRestCounter();
  }
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════

btnStop.disabled = true;
restoreFromStorage();
