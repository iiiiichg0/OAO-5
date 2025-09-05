// 유틸
const $ = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));
const KEY = 'rp_board_posts_v1';

const sample = [
  { id: crypto.randomUUID(), title: '공지: 사이트 개설', category: '공지', tags: ['#공지','#배포'], content: '첫 게시물입니다. 환영합니다!', date: new Date().toISOString() },
  { id: crypto.randomUUID(), title: '씬로그: 병동의 속삭임', category: '씬로그', tags: ['#병동','#달빛'], content: '노엘과 잭슨의 조용한 대화…', date: new Date(Date.now()-864e5).toISOString() },
  { id: crypto.randomUUID(), title: '자유: 팬아트 공유', category: '자유', tags: ['#팬아트'], content: '새 일러스트를 올려봅니다!', date: new Date(Date.now()-2*864e5).toISOString() },
];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
function initSeed() {
  const cur = load();
  if (cur.length === 0) save(sample);
}

// 렌더링
function renderList({query='', cat='all'} = {}) {
  const list = load();
  const q = query.trim().toLowerCase();
  const filtered = list.filter(p => {
    const matchesCat = (cat === 'all') ? true : (p.category === cat);
    const hay = (p.title + ' ' + p.tags.join(' ') + ' ' + p.content).toLowerCase();
    const matchesQ = q ? hay.includes(q) : true;
    return matchesCat && matchesQ;
  }).sort((a,b)=> new Date(b.date)-new Date(a.date));

  const ul = $('#postList');
  ul.innerHTML = filtered.map(p => `
    <li class="post-item" data-id="${p.id}" tabindex="0" aria-label="${p.title}">
      <div class="title">${p.title}</div>
      <div class="meta">${p.category} · ${new Date(p.date).toLocaleString()}</div>
      <div class="meta">${p.tags.join(' ')}</div>
    </li>
  `).join('');

  // 첫 글 자동 선택(있을 때)
  if (filtered[0]) openPost(filtered[0].id);
}

function mdLite(text='') {
  // 아주 간단한 마크다운: **굵게**, *기울임*, 줄바꿈
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function openPost(id) {
  const p = load().find(x => x.id === id);
  if (!p) return;
  const html = `
    <h1>${p.title}</h1>
    <p class="meta">${p.category} · ${new Date(p.date).toLocaleString()} · ${p.tags.join(' ')}</p>
    <div>${mdLite(p.content)}</div>
  `;
  $('#viewer').innerHTML = html;
}

function bindListClicks() {
  $('#postList').addEventListener('click', e => {
    const li = e.target.closest('.post-item');
    if (!li) return;
    openPost(li.dataset.id);
  });
  $('#postList').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const li = e.target.closest('.post-item');
      if (li) openPost(li.dataset.id);
    }
  });
}

// 글쓰기
function setupDialog() {
  const dlg = $('#postDialog');
  $('#newPostBtn').addEventListener('click', ()=> dlg.showModal());
  $('#postForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const post = {
      id: crypto.randomUUID(),
      title: String(fd.get('title')).trim(),
      category: String(fd.get('category')),
      tags: String(fd.get('tags')||'').split(/[,\\s]+/).filter(Boolean),
      content: String(fd.get('content')).trim(),
      date: new Date().toISOString(),
    };
    const list = load(); list.unshift(post); save(list);
    dlg.close();
    // 필터/검색 상태 유지한 채 목록 갱신
    const active = $('.chip.active')?.dataset.cat || 'all';
    renderList({ query: $('#searchInput').value, cat: active });
  });
}

// 필터/검색
function setupFilters() {
  $$('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList({ query: $('#searchInput').value, cat: btn.dataset.cat });
    });
  });
  $('#searchInput').addEventListener('input', () => {
    const active = $('.chip.active')?.dataset.cat || 'all';
    renderList({ query: $('#searchInput').value, cat: active });
  });
}

// 테마
function applyTheme() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.toggle('dark', t === 'dark');
}
function toggleTheme() {
  const t = localStorage.getItem('theme') || 'light';
  const next = t === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', next);
  applyTheme();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  initSeed();
  setupDialog();
  setupFilters();
  bindListClicks();
  renderList();
  applyTheme();
  $('#themeToggle')?.addEventListener('click', toggleTheme);
});