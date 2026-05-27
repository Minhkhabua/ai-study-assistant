bash

cat > /mnt/user-data/outputs/script.js << 'JSEOF'
/* ============================================================
   NEURAL STUDY — script.js  (Upgraded Task System v2)
   ============================================================ */

// ─── CONSTANTS ────────────────────────────────────────────────
const LS_TASKS_KEY  = 'ns_tasks_v2';
const LS_THEME_KEY  = 'ns_theme';
const LS_POMO_KEY   = 'ns_pomodoro';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ─── DEFAULT SEED TASKS ───────────────────────────────────────
const SEED_TASKS = [
  { id: 1, title: 'Review Chapter 4 — Calculus Integration', subject: 'Math',       priority: 'high',   deadline: futureDateStr(2),  done: false, createdAt: Date.now() - 86400000 * 2 },
  { id: 2, title: 'Lab report: Acid-Base Titration',          subject: 'Chemistry',  priority: 'high',   deadline: futureDateStr(1),  done: false, createdAt: Date.now() - 86400000 },
  { id: 3, title: 'Read Shakespeare — Hamlet Act III',         subject: 'Literature', priority: 'medium', deadline: futureDateStr(5),  done: true,  createdAt: Date.now() - 86400000 * 3 },
  { id: 4, title: "Newton's Laws problem set",                 subject: 'Physics',    priority: 'medium', deadline: futureDateStr(3),  done: false, createdAt: Date.now() - 3600000 * 5 },
  { id: 5, title: 'Mitosis vs Meiosis diagram',                subject: 'Biology',    priority: 'low',    deadline: futureDateStr(7),  done: false, createdAt: Date.now() - 3600000 * 2 },
];

function futureDateStr(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// ─── STATE ────────────────────────────────────────────────────
const state = {
  theme:      localStorage.getItem(LS_THEME_KEY) || 'dark',
  tasks:      loadTasks(),
  taskFilter: 'all',
  taskSort:   'created',
  nextId:     0,   // set after loadTasks
  timer: {
    running: false, mode: 25,
    totalSeconds: 1500, remaining: 1500,
    interval: null, pomosToday: 0, pomosTotal: 14, pomosGoal: 4,
  },
};

state.nextId = state.tasks.length
  ? Math.max(...state.tasks.map(t => t.id)) + 1
  : 6;

// ─── PERSISTENCE ──────────────────────────────────────────────
function loadTasks() {
  try {
    const raw = localStorage.getItem(LS_TASKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return JSON.parse(JSON.stringify(SEED_TASKS)); // fresh copy of seeds
}

function saveTasks() {
  try { localStorage.setItem(LS_TASKS_KEY, JSON.stringify(state.tasks)); }
  catch (_) {}
}

// ─── ELEMENT REFS ─────────────────────────────────────────────
const $ = id => document.getElementById(id);
const sidebar         = $('sidebar');
const sidebarOverlay  = $('sidebarOverlay');
const menuToggle      = $('menuToggle');
const sidebarClose    = $('sidebarClose');
const themeToggle     = $('themeToggle');
const pageTitle       = $('pageTitle');
const pageSubtitle    = $('pageSubtitle');
const addTaskBtn      = $('addTaskBtn');
const addTaskForm     = $('addTaskForm');
const cancelTaskBtn   = $('cancelTaskBtn');
const submitTaskBtn   = $('submitTaskBtn');
const taskInput       = $('taskInput');
const taskPriority    = $('taskPriority');
const taskSubject     = $('taskSubject');
const taskDeadline    = $('taskDeadline');
const taskListFull    = $('taskListFull');
const taskEmpty       = $('taskEmpty');
const sortSelect      = $('sortSelect');
const playBtn         = $('playBtn');
const resetBtn        = $('resetBtn');
const skipBtn         = $('skipBtn');
const timerDigits     = $('timerDigits');
const timerModeLabel  = $('timerModeLabel');
const ringProgress    = $('ringProgress');
const pomosToday      = $('pomosToday');
const pomosTotal      = $('pomosTotal');
const pomosGoal       = $('pomosGoal');
const sessionDots     = $('sessionDots');
const chartBars       = $('chartBars');
const chartLabels     = $('chartLabels');
const quickTaskList   = $('quickTaskList');
const heatmap         = $('heatmap');

// ─── SECTION META ─────────────────────────────────────────────
const sectionMeta = {
  dashboard: { title: 'Dashboard',      subtitle: 'Welcome back, Alex — you\'re on a 7-day streak 🔥' },
  tasks:     { title: 'Task Manager',   subtitle: 'All your study tasks, deadlines, and priorities' },
  timer:     { title: 'Pomodoro Timer', subtitle: 'Deep focus sessions with structured breaks' },
  progress:  { title: 'Progress',       subtitle: 'Monitor your mastery across all subjects' },
  notes:     { title: 'Notes',          subtitle: 'Coming soon — AI-powered smart notes' },
  ai:        { title: 'AI Tutor',       subtitle: 'Your personal neural learning assistant' },
};

// ─── NAVIGATION ───────────────────────────────────────────────
function navigate(section) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  const target = $(`section-${section}`);
  if (target) {
    target.classList.add('active');
  } else {
    showToast('🚧 Coming soon!');
    $('section-dashboard').classList.add('active');
    document.querySelector('.nav-item[data-section="dashboard"]')?.classList.add('active');
    return;
  }
  const meta = sectionMeta[section] || { title: section, subtitle: '' };
  pageTitle.textContent    = meta.title;
  pageSubtitle.textContent = meta.subtitle;
  closeSidebar();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.section); });
});

document.querySelectorAll('[data-section]:not(.nav-item)').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.section); });
});

// ─── SIDEBAR ──────────────────────────────────────────────────
const openSidebar  = () => { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); };
const closeSidebar = () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); };
menuToggle.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });

// ─── THEME ────────────────────────────────────────────────────
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS_THEME_KEY, theme);
}
themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
setTheme(state.theme);

// ─── COUNTING ANIMATION ───────────────────────────────────────
function animateCount(el, target, duration = 1200) {
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function initCounters() {
  document.querySelectorAll('.count').forEach(el => animateCount(el, +el.dataset.target));
}

// ─── WEEKLY CHART ─────────────────────────────────────────────
const chartData = [
  { day: 'Mon', hours: 3.5 }, { day: 'Tue', hours: 5.0 },
  { day: 'Wed', hours: 2.0 }, { day: 'Thu', hours: 6.5 },
  { day: 'Fri', hours: 4.0 }, { day: 'Sat', hours: 7.0 },
  { day: 'Sun', hours: 3.0 },
];
const maxHours = Math.max(...chartData.map(d => d.hours));

function buildChart() {
  chartBars.innerHTML = chartLabels.innerHTML = '';
  chartData.forEach((d, i) => {
    const hPct   = (d.hours / maxHours) * 100;
    const isToday = i === new Date().getDay() - 1;
    const wrap   = Object.assign(document.createElement('div'), { className: 'chart-bar-wrap' });
    const bar    = Object.assign(document.createElement('div'), { className: 'chart-bar' });
    const val    = Object.assign(document.createElement('span'), { className: 'chart-bar-val', textContent: `${d.hours}h` });
    bar.style.cssText = `height:0%;background:linear-gradient(180deg,${isToday ? 'rgba(155,89,255,0.9)' : 'rgba(0,245,255,0.7)'},rgba(0,245,255,0.15));`;
    bar.appendChild(val);
    wrap.appendChild(bar);
    chartBars.appendChild(wrap);
    const lbl = Object.assign(document.createElement('div'), { className: 'chart-label', textContent: d.day });
    chartLabels.appendChild(lbl);
    setTimeout(() => {
      bar.style.transition = `height 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`;
      bar.style.height = `${hPct}%`;
    }, 200);
  });
}

// ─── UTILITIES ────────────────────────────────────────────────
const priorityColor = p => ({ high: '#ff6b9d', medium: '#ffc107', low: '#43e97b' }[p] || '#7c8aaa');
const escapeHtml    = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function isOverdue(task) {
  if (!task.deadline || task.done) return false;
  return new Date(task.deadline + 'T23:59:59') < new Date();
}

function formatDeadline(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr + 'T00:00:00');
  const now  = new Date();
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff}d`;
}

function formatTimeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1)   return 'Just now';
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return `${Math.floor(diff/1440)}d ago`;
}

function getSorted(tasks) {
  return [...tasks].sort((a, b) => {
    if (state.taskSort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (state.taskSort === 'deadline') {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    return b.createdAt - a.createdAt; // newest first
  });
}

function getFiltered() {
  const today = new Date().toISOString().split('T')[0];
  return getSorted(state.tasks).filter(t => {
    if (state.taskFilter === 'pending') return !t.done;
    if (state.taskFilter === 'done')    return  t.done;
    if (state.taskFilter === 'overdue') return isOverdue(t);
    return true;
  });
}

// ─── TASK COUNTS & PROGRESS ───────────────────────────────────
function updateTaskMeta() {
  const all     = state.tasks.length;
  const done    = state.tasks.filter(t => t.done).length;
  const pending = all - done;
  const overdue = state.tasks.filter(isOverdue).length;
  const pct     = all ? Math.round((done / all) * 100) : 0;

  $('countAll').textContent     = all;
  $('countPending').textContent = pending;
  $('countDone').textContent    = done;
  $('countOverdue').textContent = overdue;

  $('taskProgressLabel').textContent = `${done} of ${all} tasks complete`;
  $('taskProgressPct').textContent   = `${pct}%`;
  $('taskProgressFill').style.width  = `${pct}%`;

  // update dashboard stat card (task completion)
  const countEl = document.querySelector('.count[data-target="89"]');
  if (countEl) { countEl.dataset.target = pct; countEl.textContent = pct; }
}

// ─── QUICK TASKS (Dashboard) ──────────────────────────────────
function buildQuickTasks() {
  quickTaskList.innerHTML = '';
  const items = state.tasks.filter(t => !t.done).slice(0, 4);
  if (!items.length) {
    quickTaskList.innerHTML = '<li style="font-size:13px;color:var(--text-muted);padding:8px 0;">All caught up! 🎉</li>';
    return;
  }
  items.forEach(task => {
    const li = document.createElement('li');
    li.className = 'quick-task';
    li.innerHTML = `
      <div class="qt-check ${task.done ? 'checked' : ''}"></div>
      <span class="qt-text">${escapeHtml(task.title)}</span>
      <span class="qt-sub">${task.subject}</span>
      <span class="qt-priority" style="background:${priorityColor(task.priority)}"></span>`;
    li.addEventListener('click', () => { task.done = !task.done; task.updatedAt = Date.now(); saveTasks(); buildQuickTasks(); buildTaskList(); updateTaskMeta(); });
    quickTaskList.appendChild(li);
  });
}

// ─── FULL TASK LIST ───────────────────────────────────────────
function buildTaskList() {
  taskListFull.innerHTML = '';
  const tasks = getFiltered();

  taskEmpty.style.display   = tasks.length ? 'none' : 'block';
  taskListFull.style.display = tasks.length ? 'flex'  : 'none';

  tasks.forEach((task, idx) => {
    const overdue  = isOverdue(task);
    const dlText   = formatDeadline(task.deadline);
    const agoText  = formatTimeAgo(task.createdAt);

    const item = document.createElement('div');
    item.className = [
      'task-item',
      task.done     ? 'done' : '',
      `priority-${task.priority}`,
      overdue       ? 'overdue' : '',
    ].filter(Boolean).join(' ');
    item.dataset.id = task.id;
    item.style.animationDelay = `${idx * 40}ms`;

    item.innerHTML = `
      <div class="task-check ${task.done ? 'done' : ''}" data-action="toggle"></div>
      <div class="task-body">
        <div class="task-title-text">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="task-subject-tag">${escapeHtml(task.subject)}</span>
          <span class="priority-pill ${task.priority}">${task.priority}</span>
          ${dlText ? `<span class="task-deadline">${escapeHtml(dlText)}</span>` : ''}
        </div>
      </div>
      <span class="task-created">${agoText}</span>
      <div class="task-actions">
        <button class="task-action-btn" data-action="toggle" title="${task.done ? 'Reopen' : 'Complete'}">
          ${task.done ? '↩' : '✓'}
        </button>
        <button class="task-action-btn del" data-action="delete" title="Delete">✕</button>
      </div>`;

    // event delegation via dataset
    item.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'toggle') toggleTask(task.id, item);
      if (btn.dataset.action === 'delete') deleteTask(task.id, item);
    });

    taskListFull.appendChild(item);
  });

  updateTaskMeta();
}

function toggleTask(id, itemEl) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.updatedAt = Date.now();
  saveTasks();
  // soft re-render so animation plays cleanly
  buildTaskList();
  buildQuickTasks();
  showToast(task.done ? '✅ Task complete!' : '↩ Reopened');
}

function deleteTask(id, itemEl) {
  itemEl.classList.add('removing');
  itemEl.addEventListener('animationend', () => {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    buildTaskList();
    buildQuickTasks();
    showToast('🗑 Task removed');
  }, { once: true });
}

// ─── ADD TASK FORM ────────────────────────────────────────────
addTaskBtn.addEventListener('click', () => {
  addTaskForm.classList.toggle('open');
  if (addTaskForm.classList.contains('open')) {
    taskInput.focus();
    // default deadline = tomorrow
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    taskDeadline.value = tmr.toISOString().split('T')[0];
  }
});

cancelTaskBtn.addEventListener('click', () => { addTaskForm.classList.remove('open'); });

submitTaskBtn.addEventListener('click', submitTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitTask(); });

function submitTask() {
  const title = taskInput.value.trim();
  if (!title) { taskInput.focus(); taskInput.style.borderColor = 'var(--pink)'; setTimeout(() => taskInput.style.borderColor = '', 900); return; }

  const task = {
    id:        state.nextId++,
    title,
    subject:   taskSubject.value,
    priority:  taskPriority.value,
    deadline:  taskDeadline.value || null,
    done:      false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  state.tasks.unshift(task);
  saveTasks();

  taskInput.value = '';
  taskDeadline.value = '';
  taskPriority.value = 'medium';
  addTaskForm.classList.remove('open');

  buildTaskList();
  buildQuickTasks();
  showToast('📌 Task added!');
}

// ─── FILTERS ──────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.taskFilter = btn.dataset.filter;
    buildTaskList();
  });
});

// ─── SORT ─────────────────────────────────────────────────────
sortSelect.addEventListener('change', () => {
  state.taskSort = sortSelect.value;
  buildTaskList();
});

// ─── POMODORO ─────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 95; // r = 95

function updateRing() {
  const p = state.timer.remaining / state.timer.totalSeconds;
  ringProgress.style.strokeDashoffset = CIRC * (1 - p);
}

const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

function updateTimerDisplay() { timerDigits.textContent = fmt(state.timer.remaining); updateRing(); }

function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  playBtn.querySelector('.icon-play').style.display  = 'none';
  playBtn.querySelector('.icon-pause').style.display = 'block';
  state.timer.interval = setInterval(() => {
    state.timer.remaining--;
    updateTimerDisplay();
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      state.timer.running = false;
      playBtn.querySelector('.icon-play').style.display  = 'block';
      playBtn.querySelector('.icon-pause').style.display = 'none';
      if (state.timer.mode === 25) {
        state.timer.pomosToday++; state.timer.pomosTotal++;
        pomosToday.textContent = state.timer.pomosToday;
        pomosTotal.textContent = state.timer.pomosTotal;
        buildSessionDots();
        showToast('🎉 Focus session complete!');
      } else {
        showToast('⏰ Break over — back to focus!');
      }
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(state.timer.interval);
  state.timer.running = false;
  playBtn.querySelector('.icon-play').style.display  = 'block';
  playBtn.querySelector('.icon-pause').style.display = 'none';
}

function resetTimer() { pauseTimer(); state.timer.remaining = state.timer.totalSeconds; updateTimerDisplay(); }

function setMode(min, label) {
  pauseTimer();
  state.timer.mode = min;
  state.timer.totalSeconds = state.timer.remaining = min * 60;
  timerModeLabel.textContent = label;
  updateTimerDisplay();
}

playBtn.addEventListener('click',  () => state.timer.running ? pauseTimer() : startTimer());
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click',  () => {
  resetTimer();
  const next = state.timer.mode === 25 ? [5, 'SHORT BREAK'] : [25, 'FOCUS SESSION'];
  setMode(...next);
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', +b.dataset.mode === state.timer.mode));
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const labels = { 25: 'FOCUS SESSION', 5: 'SHORT BREAK', 15: 'LONG BREAK' };
    setMode(+btn.dataset.mode, labels[btn.dataset.mode]);
  });
});

function buildSessionDots() {
  sessionDots.innerHTML = '';
  for (let i = 0; i < state.timer.pomosGoal; i++) {
    const d = document.createElement('div');
    d.className = `session-dot ${i < state.timer.pomosToday ? 'done' : ''}`;
    sessionDots.appendChild(d);
  }
}

// ─── HEATMAP ──────────────────────────────────────────────────
function buildHeatmap() {
  heatmap.innerHTML = '';
  for (let i = 0; i < 35; i++) {
    const v    = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 5);
    const hrs  = [0,1,2,4,6][v];
    const cell = Object.assign(document.createElement('div'), { className: `heat-cell heat-${v}` });
    cell.dataset.val = hrs;
    cell.title       = `${hrs} hours`;
    heatmap.appendChild(cell);
  }
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  buildChart();
  buildQuickTasks();
  buildTaskList();
  buildSessionDots();
  buildHeatmap();
  updateTimerDisplay();
  initCounters();
  updateTaskMeta();

  pomosToday.textContent = state.timer.pomosToday;
  pomosTotal.textContent = state.timer.pomosTotal;
  pomosGoal.textContent  = state.timer.pomosGoal;

  // Staggered entrance
  document.querySelectorAll('.stat-card, .card, .prog-info-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(14px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 80 + i * 55);
  });
}

document.addEventListener('DOMContentLoaded', init);
JSEOF
echo "Done"