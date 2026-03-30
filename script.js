const STORAGE_KEY  = 'my_tasks';
const THEME_KEY    = 'my_tasks_theme';
const ORDER_KEY    = 'my_tasks_cat_order';

const CATEGORIES = {
  work:     { label: '💼 업무', tagClass: 'tag-work',     fillId: 'fill-work',     countId: 'count-work' },
  personal: { label: '🏠 개인', tagClass: 'tag-personal', fillId: 'fill-personal', countId: 'count-personal' },
  study:    { label: '📚 공부', tagClass: 'tag-study',    fillId: 'fill-study',    countId: 'count-study' },
};

// ── 상태 ───────────────────────────────────────────────
let todos         = loadTodos();
let activeFilter  = 'all';
let categoryOrder = loadOrder();  // ['work', 'personal', 'study'] 순서 배열

// ── DOM ────────────────────────────────────────────────
const categoryStats  = document.getElementById('category-stats');
const todoInput      = document.getElementById('todo-input');
const categorySelect = document.getElementById('category-select');
const addBtn         = document.getElementById('add-btn');
const todoList       = document.getElementById('todo-list');
const filterBtns     = document.querySelectorAll('.filter-btn');
const clearBtn       = document.getElementById('clear-btn');
const themeCheckbox  = document.getElementById('theme-checkbox');
const themeLabel     = document.getElementById('theme-label');

const overallText = document.getElementById('overall-text');
const overallFill = document.getElementById('overall-fill');
const todayNum    = document.getElementById('today-num');

// ── localStorage ───────────────────────────────────────
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadOrder() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // 저장된 순서가 유효한 3개 키를 모두 포함하는지 검증
    const keys = Object.keys(CATEGORIES);
    if (parsed && parsed.length === keys.length && keys.every(k => parsed.includes(k))) {
      return parsed;
    }
  } catch { /* ignore */ }
  return Object.keys(CATEGORIES);  // 기본값: ['work', 'personal', 'study']
}

function saveOrder() {
  localStorage.setItem(ORDER_KEY, JSON.stringify(categoryOrder));
}

// ── 다크/라이트 모드 ────────────────────────────────────
function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeCheckbox.checked = isDark;
  themeLabel.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'dark');
}

themeCheckbox.addEventListener('change', () => {
  applyTheme(themeCheckbox.checked);
});

// ── 데이터 ─────────────────────────────────────────────
function createTodo(text, category) {
  return {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
    category,
    createdAt: new Date().toISOString(),
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

// ── 대시보드 렌더 ──────────────────────────────────────
function renderDashboard() {
  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  overallText.textContent = `${completed}/${total} 완료 (${pct}%)`;
  overallFill.style.width = pct + '%';

  const today = todayStr();
  const todayCount = todos.filter(t => t.createdAt.slice(0, 10) === today).length;
  todayNum.textContent = todayCount + '개';

  renderCategoryStats();
}

// ── 카테고리 카드 렌더 (순서 반영 + 드래그 바인딩) ────
function renderCategoryStats() {
  categoryStats.innerHTML = '';

  categoryOrder.forEach(key => {
    const meta       = CATEGORIES[key];
    const catTodos   = todos.filter(t => t.category === key);
    const catTotal   = catTodos.length;
    const catDone    = catTodos.filter(t => t.completed).length;
    const catPct     = catTotal === 0 ? 0 : Math.round((catDone / catTotal) * 100);

    const card = document.createElement('div');
    card.className   = 'cat-stat';
    card.draggable   = true;
    card.dataset.key = key;

    card.innerHTML = `
      <span class="cat-stat-label">${meta.label}</span>
      <span class="cat-stat-count">${catDone}/${catTotal}</span>
      <div class="mini-bar">
        <div class="mini-fill fill-${key}" style="width:${catPct}%"></div>
      </div>`;

    bindDrag(card);
    categoryStats.appendChild(card);
  });
}

// ── 드래그 앤 드롭 ─────────────────────────────────────
let dragSrcKey = null;  // 드래그 시작한 카드의 category key

function bindDrag(card) {
  card.addEventListener('dragstart', e => {
    dragSrcKey = card.dataset.key;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    categoryStats.querySelectorAll('.cat-stat').forEach(c => c.classList.remove('drag-over'));
  });

  card.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (card.dataset.key !== dragSrcKey) {
      categoryStats.querySelectorAll('.cat-stat').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', e => {
    e.preventDefault();
    const targetKey = card.dataset.key;
    if (!dragSrcKey || dragSrcKey === targetKey) return;

    // 순서 배열에서 src를 꺼내 target 위치에 삽입
    const srcIdx = categoryOrder.indexOf(dragSrcKey);
    const tgtIdx = categoryOrder.indexOf(targetKey);
    categoryOrder.splice(srcIdx, 1);
    categoryOrder.splice(tgtIdx, 0, dragSrcKey);

    saveOrder();
    renderCategoryStats();
    dragSrcKey = null;
  });
}

// ── 목록 렌더 ──────────────────────────────────────────
function renderList() {
  todoList.innerHTML = '';

  const filtered = activeFilter === 'all'
    ? todos
    : todos.filter(t => t.category === activeFilter);

  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-msg';
    li.textContent = '할 일이 없습니다.';
    todoList.appendChild(li);
    return;
  }

  filtered.forEach(todo => {
    const li = buildItem(todo);
    todoList.appendChild(li);
  });
}

function buildItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.completed ? ' completed' : '');
  li.dataset.id = todo.id;

  // 체크박스
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = todo.completed;
  cb.addEventListener('change', () => toggleTodo(todo.id));

  // 텍스트 (더블클릭 → 편집)
  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;
  span.title = '더블클릭하여 수정';
  span.addEventListener('dblclick', () => enterEditMode(li, todo));

  // 카테고리 태그
  const tag = document.createElement('span');
  tag.className = 'category-tag ' + CATEGORIES[todo.category].tagClass;
  tag.textContent = CATEGORIES[todo.category].label;

  // 삭제 버튼
  const delBtn = document.createElement('button');
  delBtn.className = 'del-btn';
  delBtn.textContent = '삭제';
  delBtn.addEventListener('click', () => deleteTodo(todo.id));

  li.append(cb, span, tag, delBtn);
  return li;
}

// ── 인라인 수정 ────────────────────────────────────────
function enterEditMode(li, todo) {
  const span = li.querySelector('.todo-text');
  if (!span) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = todo.text;
  input.maxLength = 100;

  li.replaceChild(input, span);
  input.focus();
  input.select();

  function save() {
    const newText = input.value.trim();
    if (newText && newText !== todo.text) {
      todos = todos.map(t => t.id === todo.id ? { ...t, text: newText } : t);
      saveTodos();
    }
    render();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { render(); }
  });
  input.addEventListener('blur', save);
}

// ── 전체 렌더 ──────────────────────────────────────────
function render() {
  renderDashboard();
  renderList();
}

// ── 기능 ───────────────────────────────────────────────
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }
  todos.push(createTodo(text, categorySelect.value));
  saveTodos();
  todoInput.value = '';
  todoInput.focus();
  render();
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

function clearCompleted() {
  const count = todos.filter(t => t.completed).length;
  if (count === 0) return;
  if (!confirm(`완료된 항목 ${count}개를 모두 삭제할까요?`)) return;
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
}

// ── 필터 ───────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
  });
});

// ── 이벤트 ─────────────────────────────────────────────
addBtn.addEventListener('click', addTodo);
clearBtn.addEventListener('click', clearCompleted);
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

// ── 키보드 단축키 ──────────────────────────────────────
// Alt+N : 입력창 포커스
// Alt+1 : 전체 필터  Alt+2 : 업무  Alt+3 : 개인  Alt+4 : 공부
const FILTER_KEYS = { '1': 'all', '2': 'work', '3': 'personal', '4': 'study' };

document.addEventListener('keydown', e => {
  if (!e.altKey) return;

  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    todoInput.focus();
    todoInput.select();
    return;
  }

  if (FILTER_KEYS[e.key]) {
    e.preventDefault();
    const filter = FILTER_KEYS[e.key];
    activeFilter = filter;
    filterBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    renderList();
  }
});

// ── 초기화 ─────────────────────────────────────────────
initTheme();
render();
