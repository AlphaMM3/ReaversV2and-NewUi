(() => {
  if (window.__AG_ANNOTATOR_LOADED__) return;
  window.__AG_ANNOTATOR_LOADED__ = true;

  const API = '/__local__/annotations';
  let active = false;
  let listOpen = false;
  let annotations = [];
  let hoveredEl = null;
  let draftTarget = null;
  let editingId = null;

  const host = document.createElement('div');
  host.id = '__ag_ann_root';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
      .hover-box {
        position: fixed; pointer-events: none; border: 2px dashed #f59e0b;
        background: rgba(245, 158, 11, 0.12); border-radius: 6px;
        transition: all 60ms ease-out; display: none; z-index: 1;
      }
      .hover-label {
        position: absolute; top: -24px; left: 0; background: #111827; color: #fef3c7;
        font-size: 11px; padding: 2px 7px; border-radius: 4px; white-space: nowrap;
        max-width: 280px; overflow: hidden; text-overflow: ellipsis;
      }
      .toolbar {
        position: fixed; right: 16px; bottom: 72px; pointer-events: auto;
        display: flex; align-items: center; gap: 6px; z-index: 50;
        background: #0f172a; color: #f8fafc; padding: 6px 8px;
        border-radius: 999px; box-shadow: 0 10px 25px rgba(0,0,0,0.28);
        border: 1px solid rgba(255,255,255,0.14);
      }
      @media (min-width: 900px) { .toolbar { bottom: 18px; } }
      .btn {
        border: 0; cursor: pointer; border-radius: 999px; font-size: 12.5px;
        font-weight: 600; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px;
        transition: background 120ms ease;
      }
      .btn-toggle { background: #1e293b; color: #e2e8f0; }
      .btn-toggle.on { background: #f59e0b; color: #111827; }
      .btn-list { background: #065f46; color: #ecfdf5; }
      .badge {
        background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 999px; font-size: 11px;
      }
      .pin {
        position: fixed; pointer-events: auto; width: 24px; height: 24px;
        border-radius: 999px; background: #dc2626; color: #fff; font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        border: 2px solid #fff; box-shadow: 0 3px 10px rgba(0,0,0,0.3); z-index: 20;
      }
      .pin.resolved { background: #059669; opacity: 0.72; }
      .modal-backdrop {
        position: fixed; inset: 0; background: rgba(15,23,42,0.45); pointer-events: auto;
        display: none; align-items: center; justify-content: center; padding: 16px; z-index: 60;
      }
      .modal-backdrop.open { display: flex; }
      .card {
        width: 100%; max-width: 440px; background: #fff; color: #0f172a;
        border-radius: 14px; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      }
      .card h3 { margin: 0 0 6px; font-size: 16px; }
      .meta {
        font-size: 11.5px; color: #475569; background: #f1f5f9; padding: 8px 10px;
        border-radius: 8px; margin-bottom: 10px; word-break: break-word;
      }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .chip {
        border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 999px;
        padding: 4px 10px; font-size: 11.5px; cursor: pointer; font-weight: 600;
      }
      .chip.sel { background: #0f172a; color: #fff; border-color: #0f172a; }
      textarea {
        width: 100%; min-height: 92px; border: 1px solid #cbd5e1; border-radius: 8px;
        padding: 10px; font-size: 13.5px; resize: vertical; outline: none;
      }
      textarea:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.15); }
      .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
      .btn-sec { background: #e2e8f0; color: #1e293b; border-radius: 8px; padding: 8px 14px; }
      .btn-pri { background: #059669; color: #fff; border-radius: 8px; padding: 8px 14px; }
      .btn-del { background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 8px 12px; margin-right: auto; }
      .btn-res { background: #d1fae5; color: #065f46; border-radius: 8px; padding: 8px 12px; }
      .drawer {
        position: fixed; top: 0; right: 0; bottom: 0; width: min(400px, 94vw);
        background: #fff; color: #0f172a; pointer-events: auto; z-index: 55;
        box-shadow: -8px 0 30px rgba(0,0,0,0.2); display: none; flex-direction: column;
      }
      .drawer.open { display: flex; }
      .drawer-head {
        padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
        display: flex; align-items: center; justify-content: space-between;
      }
      .drawer-sub { padding: 8px 16px; background: #ecfdf5; color: #065f46; font-size: 12px; border-bottom: 1px solid #d1fae5; }
      .drawer-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .item {
        border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #f8fafc;
      }
      .item.resolved { opacity: 0.7; background: #f1f5f9; }
      .item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
      .tag { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #e0f2fe; color: #0369a1; }
      .tag.resolved { background: #d1fae5; color: #065f46; }
      .item-note { font-size: 13px; margin: 6px 0; white-space: pre-wrap; }
      .item-el { font-size: 11px; color: #64748b; word-break: break-all; }
      .item-btns { display: flex; gap: 6px; margin-top: 8px; }
      .mini { font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 0; cursor: pointer; font-weight: 600; }
      .toast {
        position: fixed; left: 50%; bottom: 130px; transform: translateX(-50%);
        background: #111827; color: #fff; padding: 8px 14px; border-radius: 999px;
        font-size: 12.5px; display: none; z-index: 70;
      }
    </style>
    <div class="hover-box" id="hoverBox"><div class="hover-label" id="hoverLabel"></div></div>
    <div id="pinsLayer"></div>
    <div class="toolbar">
      <button type="button" class="btn btn-toggle" id="toggleBtn">📌 Annotate: OFF</button>
      <button type="button" class="btn btn-list" id="listBtn">📋 Notes <span class="badge" id="countBadge">0</span></button>
    </div>
    <div class="modal-backdrop" id="modal">
      <div class="card">
        <h3 id="modalTitle">নোট লিখুন (Pin Feedback)</h3>
        <div class="meta" id="modalMeta"></div>
        <div class="chips" id="chips">
          <button type="button" class="chip sel" data-cat="UI / Design">UI / Design</button>
          <button type="button" class="chip" data-cat="Bug / Fix">Bug / Fix</button>
          <button type="button" class="chip" data-cat="Feature / Logic">Feature / Logic</button>
          <button type="button" class="chip" data-cat="Text / Bangla">Text / Bangla</button>
        </div>
        <textarea id="noteInput" placeholder="এখানে লিখুন এখানে কী পরিবর্তন বা উন্নতি করতে হবে..."></textarea>
        <div class="actions">
          <button type="button" class="btn btn-del" id="delBtn" style="display:none;">Delete</button>
          <button type="button" class="btn btn-res" id="resolveBtn" style="display:none;">Resolve</button>
          <button type="button" class="btn btn-sec" id="cancelBtn">Cancel</button>
          <button type="button" class="btn btn-pri" id="saveBtn">Save Pin</button>
        </div>
      </div>
    </div>
    <div class="drawer" id="drawer">
      <div class="drawer-head">
        <strong>📌 Saved Annotations</strong>
        <button type="button" class="mini" id="closeDrawer" style="background:#e2e8f0;">Close</button>
      </div>
      <div class="drawer-sub">সব নোট অটোমেটিক <b>local/ANNOTATIONS.md</b> ফাইলে সেভ হচ্ছে।</div>
      <div class="drawer-body" id="drawerBody"></div>
    </div>
    <div class="toast" id="toast"></div>
  `;

  const $ = (id) => shadow.getElementById(id);
  const hoverBox = $('hoverBox');
  const hoverLabel = $('hoverLabel');
  const pinsLayer = $('pinsLayer');
  const toggleBtn = $('toggleBtn');
  const listBtn = $('listBtn');
  const countBadge = $('countBadge');
  const modal = $('modal');
  const modalTitle = $('modalTitle');
  const modalMeta = $('modalMeta');
  const noteInput = $('noteInput');
  const delBtn = $('delBtn');
  const resolveBtn = $('resolveBtn');
  const cancelBtn = $('cancelBtn');
  const saveBtn = $('saveBtn');
  const drawer = $('drawer');
  const drawerBody = $('drawerBody');
  const toastEl = $('toast');

  let selectedCat = 'UI / Design';
  let toastTimer = null;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 2200);
  }

  function currentContext() {
    const authVisible = !document.getElementById('auth')?.classList.contains('hidden');
    const title = authVisible ? 'Login Screen' : (document.getElementById('pageTitle')?.textContent?.trim() || 'Dashboard');
    const activeNav = document.querySelector('#nav .active, #bottomNav .active')?.textContent?.trim() || '';
    const userText = document.getElementById('loggedUser')?.textContent?.trim() || '';
    return { panelTitle: title, activeNav, userText, authVisible };
  }

  function escapeCss(v) {
    return window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function getSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + escapeCss(el.id);
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift('#' + escapeCss(cur.id)); break; }
      let seg = cur.tagName.toLowerCase();
      if (cur.dataset && cur.dataset.panel) seg += `[data-panel="${escapeCss(cur.dataset.panel)}"]`;
      else if (cur.getAttribute('name')) seg += `[name="${escapeCss(cur.getAttribute('name'))}"]`;
      else {
        const cls = Array.from(cur.classList).filter(c => !c.startsWith('is-')).slice(0, 2);
        if (cls.length) seg += '.' + cls.map(escapeCss).join('.');
        const parent = cur.parentElement;
        if (parent) {
          const same = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
          if (same.length > 1) seg += `:nth-of-type(${same.indexOf(cur) + 1})`;
        }
      }
      parts.unshift(seg);
      if (cur.tagName === 'BODY') break;
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function describeEl(el) {
    const tag = el.tagName.toLowerCase();
    const text = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    return text ? `${tag} — "${text}"` : getSelector(el);
  }

  function setActive(next) {
    active = next;
    toggleBtn.classList.toggle('on', active);
    toggleBtn.textContent = active ? '📌 Annotate: ON' : '📌 Annotate: OFF';
    document.body.style.cursor = active ? 'crosshair' : '';
    if (!active) hoverBox.style.display = 'none';
  }

  function isOwnEvent(e) {
    return e.composedPath().includes(host);
  }

  function openModalForNew(el, clientX, clientY) {
    editingId = null;
    hoverBox.style.display = 'none';
    const ctx = currentContext();
    const r = el.getBoundingClientRect();
    draftTarget = {
      panelTitle: ctx.panelTitle,
      activeNav: ctx.activeNav,
      userText: ctx.userText,
      selector: getSelector(el),
      tagName: el.tagName.toLowerCase(),
      elementText: (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 140),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      scrollY: Math.round(window.scrollY),
      rect: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
      clickPoint: { x: Math.round(clientX), y: Math.round(clientY) },
    };
    modalTitle.textContent = 'নোট লিখুন (New Pin)';
    modalMeta.innerHTML = `<b>Page:</b> ${escapeHtml(ctx.panelTitle)} &nbsp;|&nbsp; <b>Element:</b> ${escapeHtml(describeEl(el))}`;
    noteInput.value = '';
    delBtn.style.display = 'none';
    resolveBtn.style.display = 'none';
    selectCategory('UI / Design');
    modal.classList.add('open');
    setTimeout(() => noteInput.focus(), 30);
  }

  function openModalForEdit(item) {
    editingId = item.id;
    draftTarget = item;
    modalTitle.textContent = `Pin #${item.pinNumber || ''} আপডেট করুন`;
    modalMeta.innerHTML = `<b>Page:</b> ${escapeHtml(item.panelTitle)} &nbsp;|&nbsp; <b>Selector:</b> ${escapeHtml(item.selector)}`;
    noteInput.value = item.note || '';
    delBtn.style.display = 'inline-flex';
    resolveBtn.style.display = 'inline-flex';
    resolveBtn.textContent = item.status === 'resolved' ? 'Reopen' : 'Resolve';
    selectCategory(item.category || 'UI / Design');
    modal.classList.add('open');
    setTimeout(() => noteInput.focus(), 30);
  }

  function selectCategory(cat) {
    selectedCat = cat;
    shadow.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c.dataset.cat === cat));
  }

  function renderPins() {
    pinsLayer.innerHTML = '';
    const ctx = currentContext();
    const visible = annotations.filter(a => a.status !== 'resolved' && a.panelTitle === ctx.panelTitle);
    visible.forEach((item) => {
      let target = null;
      try { target = document.querySelector(item.selector); } catch {}
      if (!target) return;
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'pin' + (item.status === 'resolved' ? ' resolved' : '');
      pin.textContent = String(item.pinNumber);
      pin.title = `[${item.category}] ${item.note}`;
      const left = Math.min(window.innerWidth - 28, Math.max(4, r.right - 14));
      const top = Math.min(window.innerHeight - 28, Math.max(4, r.top - 10));
      pin.style.left = left + 'px';
      pin.style.top = top + 'px';
      pin.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openModalForEdit(item);
      });
      pinsLayer.appendChild(pin);
    });
  }

  function renderDrawer() {
    countBadge.textContent = String(annotations.filter(a => a.status !== 'resolved').length);
    if (!annotations.length) {
      drawerBody.innerHTML = '<div style="color:#64748b;font-size:13px;padding:12px;">এখনো কোনো পিন/নোট যোগ করা হয়নি। উপরে <b>Annotate: OFF</b> বাটনে ক্লিক করে চালু করুন, তারপর পেজের যেকোনো জায়গায় ক্লিক করুন।</div>';
      return;
    }
    drawerBody.innerHTML = '';
    annotations.forEach((a) => {
      const isResolved = a.status === 'resolved';
      const card = document.createElement('div');
      card.className = 'item' + (isResolved ? ' resolved' : '');
      card.innerHTML = `
        <div class="item-top">
          <strong>#${escapeHtml(a.pinNumber)} · ${escapeHtml(a.panelTitle)}</strong>
          <span class="tag${isResolved ? ' resolved' : ''}">${escapeHtml(a.category || 'Note')}${isResolved ? ' · Done' : ''}</span>
        </div>
        <div class="item-note"></div>
        <div class="item-el"></div>
        <div class="item-btns">
          <button type="button" class="mini" data-act="edit" style="background:#e2e8f0;color:#0f172a;">Edit</button>
          <button type="button" class="mini" data-act="toggle" style="background:${isResolved ? '#fef3c7;color:#92400e' : '#d1fae5;color:#065f46'};">${isResolved ? 'Reopen' : 'Resolve'}</button>
          <button type="button" class="mini" data-act="delete" style="background:#fee2e2;color:#b91c1c;">Delete</button>
        </div>
      `;
      card.querySelector('.item-note').textContent = a.note;
      card.querySelector('.item-el').textContent = `${a.elementText || a.selector} (${a.viewport})`;
      card.querySelector('[data-act="edit"]').onclick = () => openModalForEdit(a);
      card.querySelector('[data-act="toggle"]').onclick = () => toggleAnnotationStatus(a.id, isResolved ? 'open' : 'resolved');
      card.querySelector('[data-act="delete"]').onclick = () => deleteAnnotation(a.id);
      drawerBody.appendChild(card);
    });
  }

  async function loadAnnotations() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      annotations = await res.json();
      renderDrawer();
      renderPins();
    } catch {}
  }

  async function saveAnnotation() {
    const note = noteInput.value.trim();
    if (!note) { showToast('অনুগ্রহ করে নোট লিখুন'); return; }
    if (editingId) {
      const res = await fetch(`${API}/${encodeURIComponent(editingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, category: selectedCat }),
      });
      if (!res.ok) { showToast('আপডেট করা যায়নি'); return; }
      modal.classList.remove('open');
      await loadAnnotations();
      showToast('Pin আপডেট হয়েছে');
      return;
    }
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draftTarget, category: selectedCat, note }),
    });
    if (!res.ok) { showToast('সেভ করা যায়নি'); return; }
    modal.classList.remove('open');
    setActive(false);
    await loadAnnotations();
    showToast('নোট সেভ হয়েছে (local/ANNOTATIONS.md)');
  }

  async function toggleAnnotationStatus(id, status) {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { showToast('স্ট্যাটাস পরিবর্তন করা যায়নি'); return; }
    modal.classList.remove('open');
    await loadAnnotations();
    showToast(status === 'resolved' ? 'Resolved হিসেবে চিহ্নিত হয়েছে' : 'আবার Open করা হয়েছে');
  }

  async function deleteAnnotation(id) {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) { showToast('ডিলিট করা যায়নি'); return; }
    modal.classList.remove('open');
    await loadAnnotations();
    showToast('Pin ডিলিট হয়েছে');
  }

  toggleBtn.addEventListener('click', () => setActive(!active));
  listBtn.addEventListener('click', () => {
    listOpen = !listOpen;
    drawer.classList.toggle('open', listOpen);
  });
  $('closeDrawer').addEventListener('click', () => {
    listOpen = false;
    drawer.classList.remove('open');
  });
  shadow.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => selectCategory(c.dataset.cat));
  });
  cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
  saveBtn.addEventListener('click', saveAnnotation);
  resolveBtn.addEventListener('click', () => {
    if (editingId && draftTarget) {
      toggleAnnotationStatus(editingId, draftTarget.status === 'resolved' ? 'open' : 'resolved');
    }
  });
  delBtn.addEventListener('click', () => { if (editingId) deleteAnnotation(editingId); });

  document.addEventListener('mousemove', (e) => {
    if (!active || modal.classList.contains('open')) return;
    if (isOwnEvent(e)) { hoverBox.style.display = 'none'; return; }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === host || host.contains(el) || el === document.documentElement) {
      hoverBox.style.display = 'none';
      return;
    }
    hoveredEl = el;
    const r = el.getBoundingClientRect();
    hoverBox.style.display = 'block';
    hoverBox.style.left = r.left + 'px';
    hoverBox.style.top = r.top + 'px';
    hoverBox.style.width = r.width + 'px';
    hoverBox.style.height = r.height + 'px';
    hoverLabel.textContent = describeEl(el);
  }, true);

  document.addEventListener('click', (e) => {
    if (!active || modal.classList.contains('open')) return;
    if (isOwnEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const el = hoveredEl || document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === host || host.contains(el)) return;
    openModalForNew(el, e.clientX, e.clientY);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) modal.classList.remove('open');
      else if (active) setActive(false);
    }
  });

  let pinTimer = null;
  const schedulePins = () => {
    clearTimeout(pinTimer);
    pinTimer = setTimeout(renderPins, 120);
  };
  window.addEventListener('scroll', schedulePins, true);
  window.addEventListener('resize', schedulePins);
  new MutationObserver(schedulePins).observe(document.body, { childList: true, subtree: true, attributes: true });

  loadAnnotations();
})();
