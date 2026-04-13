/* ─── CONTRACTION TIMER APP ─── */

// ── State ──
const state = {
  contractions: [],   // { startTime, endTime, duration, interval }
  timerInterval: null,
  contractionStart: null,
  isActive: false,
  elapsedSeconds: 0,
};

// ── DOM refs ──
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

// Stats
const statCount   = document.getElementById('stat-count');
const statAvgDur  = document.getElementById('stat-avg-dur');
const statAvgFreq = document.getElementById('stat-avg-freq');
const statLastDur = document.getElementById('stat-last-dur');

// ── Chart setup ──
const durationCtx   = document.getElementById('durationChart').getContext('2d');
const frequencyCtx  = document.getElementById('frequencyChart').getContext('2d');

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
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: '#0D0D0D',
      borderWidth: 2,
      borderRadius: 6,
    }],
  },
  options: {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      annotation: undefined,
    },
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        title: { display: true, text: 'seconds', font: { family: 'Nunito, sans-serif', weight: '700', size: 11 } },
      },
    },
  },
});

const frequencyChart = new Chart(frequencyCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: 'rgba(0,207,255,0.25)',
      borderColor: '#0D0D0D',
      borderWidth: 3,
      pointBackgroundColor: [],
      pointBorderColor: '#0D0D0D',
      pointBorderWidth: 2,
      pointRadius: 6,
      fill: true,
      tension: 0.4,
    }],
  },
  options: {
    ...chartDefaults,
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        title: { display: true, text: 'minutes', font: { family: 'Nunito, sans-serif', weight: '700', size: 11 } },
      },
    },
  },
});

// ── Timer helpers ──
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatHHMM(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Start contraction ──
function startContraction() {
  if (state.isActive) return;

  state.isActive = true;
  state.contractionStart = Date.now();
  state.elapsedSeconds = 0;

  timerCard.classList.add('active');
  timerLabel.textContent = 'CONTRACTION';
  timerSub.textContent   = 'Contraction in progress…';
  btnStart.disabled = true;
  btnStop.disabled  = false;

  addRipple(btnStart);

  state.timerInterval = setInterval(() => {
    state.elapsedSeconds = Math.floor((Date.now() - state.contractionStart) / 1000);
    timerDisplay.textContent = formatTime(state.elapsedSeconds);

    // Live colour feedback while timing
    if (state.elapsedSeconds >= 60) {
      timerDisplay.style.color = '#FF1744';
    } else if (state.elapsedSeconds >= 45) {
      timerDisplay.style.color = '#FF6D00';
    } else {
      timerDisplay.style.color = '';
    }
  }, 250);
}

// ── Stop contraction ──
function stopContraction() {
  if (!state.isActive) return;

  clearInterval(state.timerInterval);
  state.isActive = false;

  const endTime  = Date.now();
  const duration = Math.floor((endTime - state.contractionStart) / 1000);

  // Calculate interval since last contraction's START time
  let interval = null;
  if (state.contractions.length > 0) {
    const prev = state.contractions[state.contractions.length - 1];
    interval = (state.contractionStart - prev.startTime) / 60000; // minutes
  }

  const contraction = {
    startTime: state.contractionStart,
    endTime,
    duration,
    interval,
  };

  state.contractions.push(contraction);

  timerCard.classList.remove('active');
  timerLabel.textContent = 'LAST';
  timerDisplay.textContent = formatTime(duration);
  timerDisplay.style.color = '';
  timerSub.textContent = `Contraction #${state.contractions.length} recorded`;
  btnStart.disabled = false;
  btnStop.disabled  = true;

  addRipple(btnStop);

  updateStats();
  updateCharts();
  updateLog(contraction);
  updateStatus();
}

// ── Reset ──
function resetAll() {
  if (state.isActive) {
    clearInterval(state.timerInterval);
    state.isActive = false;
  }

  state.contractions = [];
  state.contractionStart = null;
  state.elapsedSeconds = 0;

  timerCard.classList.remove('active');
  timerLabel.textContent    = 'READY';
  timerDisplay.textContent  = '00:00';
  timerDisplay.style.color  = '';
  timerSub.textContent      = 'Press START to begin a contraction';
  btnStart.disabled = false;
  btnStop.disabled  = true;

  // Reset stats
  animateStat(statCount,   '0');
  animateStat(statAvgDur,  '—');
  animateStat(statAvgFreq, '—');
  animateStat(statLastDur, '—');

  // Clear charts
  durationChart.data.labels   = [];
  durationChart.data.datasets[0].data = [];
  durationChart.data.datasets[0].backgroundColor = [];
  durationChart.update();

  frequencyChart.data.labels   = [];
  frequencyChart.data.datasets[0].data = [];
  frequencyChart.data.datasets[0].pointBackgroundColor = [];
  frequencyChart.update();

  // Reset log
  logBody.innerHTML = '<tr class="log-empty"><td colspan="5">No contractions recorded yet</td></tr>';

  // Reset status
  setStatus('ok', '✓', 'Keep timing — you\'re doing great!');
  setHospital('ok', 'MONITORING', '5-1-1 Rule: contractions every 5 min, lasting 1 min, for 1 hour');
}

// ── Stats ──
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
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('bump');
}

// ── Charts ──
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

  // Duration chart
  const durations = cs.map(c => c.duration);
  const durColors = durations.map(durationColor);

  durationChart.data.labels = labels;
  durationChart.data.datasets[0].data = durations;
  durationChart.data.datasets[0].backgroundColor = durColors;
  durationChart.update();

  // Frequency chart — only entries with known interval
  const freqLabels = [];
  const freqData   = [];
  const freqColors = [];

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

// ── Log ──
function updateLog(contraction) {
  // Remove empty placeholder
  const empty = logBody.querySelector('.log-empty');
  if (empty) empty.remove();

  const n        = state.contractions.length;
  const status   = contractionStatus(contraction);
  const interval = contraction.interval !== null
    ? contraction.interval.toFixed(1)
    : '—';

  const row = document.createElement('tr');
  row.className = `log-${status.level} new-row`;
  row.innerHTML = `
    <td>${n}</td>
    <td>${formatHHMM(new Date(contraction.startTime))}</td>
    <td>${contraction.duration}s</td>
    <td>${interval} min</td>
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

// ── Status banner + hospital indicator ──
function updateStatus() {
  const cs = state.contractions;
  const n  = cs.length;

  if (n === 0) return;

  // Use last 6 contractions for assessment
  const recent   = cs.slice(-6);
  const avgDur   = recent.reduce((s, c) => s + c.duration, 0) / recent.length;
  const intervals= recent.filter(c => c.interval !== null).map(c => c.interval);
  const avgFreq  = intervals.length ? intervals.reduce((s, v) => s + v, 0) / intervals.length : Infinity;

  // 5-1-1 rule: ≤5 min apart, ≥60s long, for ≥1 hour (we approximate with enough data)
  const rule511 = avgFreq <= 5 && avgDur >= 60;
  const closeToRule = avgFreq <= 7 || avgDur >= 45;

  if (rule511 || (n >= 3 && avgFreq <= 5 && avgDur >= 45)) {
    setStatus('danger', '🚨', 'GO TO THE HOSPITAL NOW! Contractions are frequent and long.');
    setHospital('danger', 'GO TO HOSPITAL!', '5-1-1 Rule met: contractions ≤ 5 min apart, ≥ 45 seconds long.');
  } else if (closeToRule) {
    setStatus('warn', '⚠️', 'Call your provider! Contractions are getting closer or longer.');
    setHospital('warn', 'CALL YOUR PROVIDER', 'Contractions are ≤ 7 min apart or ≥ 45 seconds — getting close to the 5-1-1 rule.');
  } else {
    setStatus('ok', '✓', `${n} contraction${n === 1 ? '' : 's'} recorded. Keep monitoring.`);
    setHospital('ok', 'MONITORING', '5-1-1 Rule: contractions every 5 min, lasting 1 min, for 1 hour — then go!');
  }
}

function setStatus(level, icon, text) {
  statusBanner.className = `status-banner status-${level}`;
  statusIcon.textContent = icon;
  statusText.textContent = text;
}

function setHospital(level, title, rule) {
  hospitalCard.className = `hospital-card ${level === 'ok' ? '' : level}`;
  hospitalTitle.textContent = title;
  hospitalRule.textContent  = rule;
}

// ── Ripple effect ──
function addRipple(btn) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  ripple.style.width  = ripple.style.height = `${size}px`;
  ripple.style.left   = `${btn.offsetWidth / 2  - size / 2}px`;
  ripple.style.top    = `${btn.offsetHeight / 2 - size / 2}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ── Keyboard shortcut: Space = start/stop ──
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    if (state.isActive) {
      stopContraction();
    } else {
      startContraction();
    }
  }
});

// ── Init ──
btnStop.disabled = true;
