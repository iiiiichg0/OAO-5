// 유틸
const $ = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));
const KEY = 'rp_board_posts_v1';

const sample = [
  { id: crypto.randomUUID(), title: '공지: 사이트 개설', category: '공지', tags: ['#공지','#배포'], content: '첫 게시물입니다. 환영합니다!', date: new Date().toISOString() },
  { id: crypto.randomUUID(), title: '씬로그: 병동의 속삭임', category: '씬로그', tags: ['#병동','#달빛'], content: '노엘과 잭슨의 조용한 대화…', date: new Date(Date.now()-864e5).toISOString() },
  { id: crypto.randomUUID(), title: '자유: 팬아트 공유', category: '자유', tags: ['#팬아트'], content: '새 일러스트를 올려봅니다!', date: new Date(Date.now()-2*864e5).toISOString() },
];

function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
function initSeed(){ if (load().length === 0) save(sample); }

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }
function linkify(s){ return s.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer noopener">$1</a>'); }
function mdLite(text=''){ return linkify(escapeHtml(text)).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>'); }

// ── 삭제 관련 ────────────────────────────────────────────────────────────────
function deletePost(id){
  const list = load();
  const next = list.filter(p => p.id !== id);
  save(next);
  // 목록 갱신 + 뷰어 초기화
  const activeCat = $('.chip.active')?.dataset.cat || 'all';
  renderList({ query: $('#searchInput').value, cat: activeCat });
  if (next[0]) openPost(next[0].id);
  else $('#viewer').innerHTML = '<h1>게시글 없음</h1><p>왼쪽 상단의 <strong>글쓰기</strong>로 새 글을 작성하세요.</p>';
}

function clearAll(){
  if (!confirm('정말 모든 게시글을 삭제할까요? (이 브라우저에서만)')) return;
  save([]);
  renderList();
  $('#viewer').innerHTML = '<h1>게시글 없음</h1><p>왼쪽 상단의 <strong>글쓰기</strong>로 새 글을 작성하세요.</p>';
}

// 렌더링
function renderList({query='', cat='all'} = {}){
  const list = load();
  const q = query.trim().toLowerCase();
  const filtered = list.filter(p=>{
    const catOK = (cat==='all') ? true : (p.category===cat);
    const hay = (p.title + ' ' + p.tags.join(' ') + ' ' + p.content).toLowerCase();
    const qOK = q ? hay.includes(q) : true;
    return catOK && qOK;
  }).sort((a,b)=> new Date(b.date) - new Date(a.date));

  const ul = $('#postList');
  ul.innerHTML = filtered.map(p => `
    <li class="post-item" data-id="${p.id}" tabindex="0" aria-label="${escapeHtml(p.title)}">
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="meta">${p.category} · ${new Date(p.date).toLocaleString()}</div>
      <div class="meta">${p.tags.join(' ')}</div>
      <div style="margin-top:.3rem;">
        <button class="btn small" data-act="open" data-id="${p.id}">열기</button>
        <button class="btn danger small" data-act="del" data-id="${p.id}">삭제</button>
      </div>
    </li>
  `).join('');

  if (filtered[0]) openPost(filtered[0].id);
  else $('#viewer').innerHTML = '<h1>게시글 없음</h1><p>왼쪽 상단의 <strong>글쓰기</strong>로 새 글을 작성하세요.</p>';
}

function openPost(id){
  const p = load().find(x=>x.id===id);
  if (!p) return;
  const html = `
    <div class="toolbar">
      <button class="btn danger" id="deleteCurrentBtn" data-id="${p.id}">이 글 삭제</button>
    </div>
    <h1>${escapeHtml(p.title)}</h1>
    <p class="meta">${p.category} · ${new Date(p.date).toLocaleString()} · ${p.tags.join(' ')}</p>
    <div>${mdLite(p.content)}</div>
  `;
  $('#viewer').innerHTML = html;

    // 현재 글 삭제 버튼
  $('#deleteCurrentBtn').addEventListener('click', ()=>{
    if (confirm('이 글을 삭제할까요?')) deletePost(p.id);
  });
}

function bindListClicks(){
  $('#postList').addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'open') openPost(id);
    if (act === 'del') { if (confirm('이 글을 삭제할까요?')) deletePost(id); }
  });
  // Enter로도 열기
  $('#postList').addEventListener('keydown', e=>{
    if (e.key === 'Enter') {
      const li = e.target.closest('.post-item');
      if (li) openPost(li.dataset.id);
    }
  });


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
function setupFilters(){
  $$('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderList({ query: $('#searchInput').value, cat: btn.dataset.cat });
    });
  });
  $('#searchInput').addEventListener('input', ()=>{
    const active = $('.chip.active')?.dataset.cat || 'all';
    renderList({ query: $('#searchInput').value, cat: active });
  });
}

// 테마/기본 세팅
function applyTheme(){
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.toggle('dark', t === 'dark');
}
function toggleTheme(){
  const t = localStorage.getItem('theme') || 'light';
  const next = t === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', next); applyTheme();
}

document.addEventListener('DOMContentLoaded', ()=>{
  $('#year') && ($('#year').textContent = new Date().getFullYear());
  initSeed();
  setupDialog();
  setupFilters();
  bindListClicks();
  renderList();
  applyTheme();
  $('#themeToggle')?.addEventListener('click', toggleTheme);
  $('#clearAllBtn')?.addEventListener('click', clearAll);
});