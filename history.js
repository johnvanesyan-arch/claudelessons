// history.js — lesson history with IndexedDB storage, search, 7-day cleanup
// Exposes: App.history

window.App = window.App || {};

(function() {
  const $ = App.ui.$;
  const escapeHtml = App.ui.escapeHtml;
  const formatDate = App.ui.formatDate;

  const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const MAX_LESSONS = 100; // IndexedDB has room — was 50 in localStorage

  async function getAll() {
    return await App.storage.getAll();
  }

  async function save(lesson) {
    lesson.id = 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await App.storage.put(lesson);
    // Cap total count
    const all = await getAll();
    if (all.length > MAX_LESSONS) {
      const toRemove = all.slice(MAX_LESSONS);
      for (const l of toRemove) await App.storage.remove(l.id);
    }
    await renderHistory();
    return lesson;
  }

  async function cleanupOld() {
    const all = await getAll();
    const now = Date.now();
    for (const l of all) {
      if ((now - l.createdAt) >= HISTORY_TTL_MS) {
        await App.storage.remove(l.id);
      }
    }
  }

  function formatHistoryMeta(l) {
    const bits = [l.courseName, l.unitName, l.lessonNumber, l.materialTitle, l.lessonTags]
      .filter(Boolean).map(escapeHtml);
    return bits.length ? ' · ' + bits.join(' · ') : '';
  }

  function matchesSearch(lesson, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const haystack = [
      lesson.title, lesson.materialTitle, lesson.courseName,
      lesson.unitName, lesson.lessonNumber, lesson.lessonTags, lesson.prompt
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }

  async function renderHistory() {
    await cleanupOld();
    const arr = await getAll();
    const section = $('historySection');
    const list = $('historyList');
    const count = $('historyCount');
    const searchInput = $('historySearch');

    if (!arr.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    count.textContent = arr.length;

    const query = searchInput ? searchInput.value.trim() : '';
    const filtered = arr.filter(l => matchesSearch(l, query));

    if (!filtered.length) {
      list.innerHTML = '<div class="history-empty">No lessons match "' + escapeHtml(query) + '".</div>';
      return;
    }

    list.innerHTML = filtered.map(l => `
      <div class="history-item">
        <div class="history-info">
          <div class="history-item-title">${escapeHtml(l.title || 'Untitled')}</div>
          <div class="history-item-meta">${formatDate(l.createdAt)}${formatHistoryMeta(l)}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn" onclick="openHistoryLesson('${l.id}')" title="Open"><i class="ti ti-eye"></i></button>
          <button class="icon-btn" onclick="copyHistoryLesson('${l.id}')" title="Copy HTML"><i class="ti ti-copy"></i></button>
          <button class="icon-btn" onclick="downloadHistoryLesson('${l.id}')" title="Download"><i class="ti ti-download"></i></button>
          <button class="icon-btn danger" onclick="deleteHistoryLesson('${l.id}')" title="Delete"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  async function openHistoryLesson(id) {
    const lesson = await App.storage.get(id);
    if (!lesson) return;
    App.state.generatedHTML = App.runtime.ensureLessonRuntime(lesson.html);
    App.ui.activatePanel(4);
    $('generatingState').style.display = 'none';
    $('outputArea').style.display = 'block';
    $('editArea').style.display = 'none';
    $('outputNav').style.display = 'flex';
    App.frame.render(App.state.generatedHTML);
  }

  async function copyHistoryLesson(id) {
    const lesson = await App.storage.get(id);
    if (!lesson) return;
    const fixedHtml = App.runtime.ensureLessonRuntime(lesson.html);
    try { await navigator.clipboard.writeText(fixedHtml); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = fixedHtml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  async function downloadHistoryLesson(id) {
    const lesson = await App.storage.get(id);
    if (!lesson) return;
    const html = App.runtime.ensureLessonRuntime(lesson.html);
    const filename = App.ui.safeFileName(lesson.title || 'lesson', '.html');
    App.ui.downloadFile(filename, html, 'text/html;charset=utf-8');
  }

  async function deleteHistoryLesson(id) {
    if (!confirm('Delete this lesson?')) return;
    await App.storage.remove(id);
    await renderHistory();
  }

  App.history = {
    save, renderHistory, openHistoryLesson, copyHistoryLesson,
    downloadHistoryLesson, deleteHistoryLesson, cleanupOld
  };

  // Expose for inline onclick
  window.renderHistory = renderHistory;
  window.openHistoryLesson = openHistoryLesson;
  window.copyHistoryLesson = copyHistoryLesson;
  window.downloadHistoryLesson = downloadHistoryLesson;
  window.deleteHistoryLesson = deleteHistoryLesson;
})();
