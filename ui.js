// ui.js — UI helpers: stepper, panels, errors, profiles, lesson type chips, API key
// Exposes: App.ui

window.App = window.App || {};

(function() {
  function $(id) { return document.getElementById(id); }

  function showError(msg) {
    const b = $('errorBox');
    b.textContent = msg;
    b.style.display = 'block';
    setTimeout(() => { b.style.display = 'none'; }, 6000);
  }

  function activatePanel(n) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    $('panel' + n).classList.add('active');
    for (let i = 1; i <= 4; i++) {
      const dot = $('dot' + i);
      const lbl = $('lbl' + i);
      dot.className = 'step-dot';
      lbl.className = 'step-label';
      if (i < n) {
        dot.classList.add('done');
        dot.innerHTML = '<i class="ti ti-check" style="font-size:13px"></i>';
      } else if (i === n) {
        dot.classList.add('active');
        dot.textContent = i;
        lbl.classList.add('active');
      } else {
        dot.textContent = i;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 1) return Math.floor(diffMs / 60000) + ' min ago';
    if (diffH < 24) return Math.floor(diffH) + 'h ago';
    return Math.floor(diffH / 24) + 'd ago';
  }

  function safeFileName(name, ext) {
    const base = (name || 'lesson')
      .toLowerCase()
      .replace(/[^a-z0-9а-яёհ-ֆ԰-֏]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'lesson';
    return base + ext;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // API key UI
  function getApiKey() { return App.kv.get('anthropic_api_key', ''); }

  function saveApiKey() {
    const key = $('apiKeyInput').value.trim();
    const err = $('apiKeyError');
    if (!key) { err.textContent = 'Please enter an API key.'; err.style.display = 'block'; return; }
    if (!key.startsWith('sk-')) { err.textContent = 'Invalid format — key should start with "sk-".'; err.style.display = 'block'; return; }
    App.kv.set('anthropic_api_key', key);
    $('apiKeySection').style.display = 'none';
    $('apiKeyInput').value = '';
  }

  function checkApiKey() {
    $('apiKeySection').style.display = getApiKey() ? 'none' : 'block';
  }

  // Profile
  function saveProfile() {
    const name = $('profileName').value.trim();
    if (!name) { showError('Enter a profile name before saving.'); return; }
    const profile = {
      name,
      age: $('age').value,
      nativeLang: $('nativeLang').value,
      level: $('level').value,
      goals: $('goals').value,
      struggles: $('struggles').value,
      interests: $('interests').value,
      notes: $('notes').value
    };
    const all = App.kv.getJSON('lessonProfiles', {});
    all[name] = profile;
    App.kv.setJSON('lessonProfiles', all);
    renderProfileChips();
    const b = $('savedBanner');
    b.textContent = 'Profile "' + name + '" saved.';
    b.style.display = 'block';
    setTimeout(() => { b.style.display = 'none'; }, 3000);
  }

  function loadProfile(name) {
    const all = App.kv.getJSON('lessonProfiles', {});
    const p = all[name];
    if (!p) return;
    $('profileName').value = p.name || '';
    $('age').value = p.age || '';
    $('nativeLang').value = p.nativeLang || '';
    $('level').value = p.level || '';
    $('goals').value = p.goals || '';
    $('struggles').value = p.struggles || '';
    $('interests').value = p.interests || '';
    $('notes').value = p.notes || '';
    const b = $('savedBanner');
    b.textContent = 'Profile "' + name + '" loaded.';
    b.style.display = 'block';
    setTimeout(() => { b.style.display = 'none'; }, 3000);
  }

  function renderProfileChips() {
    const all = App.kv.getJSON('lessonProfiles', {});
    const keys = Object.keys(all);
    const container = $('savedProfiles');
    if (!keys.length) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.innerHTML = keys.map(k =>
      `<span class="chip" onclick="loadProfile('${k.replace(/'/g, "\\'")}')">
        <i class="ti ti-user"></i>${escapeHtml(k)}
      </span>`
    ).join('');
  }

  function toggleLessonType(chip, text) {
    const prompt = $('userPrompt');
    if (chip.classList.contains('active')) {
      chip.classList.remove('active');
      prompt.value = prompt.value.replace('[' + text + '] ', '').replace(text + ' ', '');
    } else {
      chip.classList.add('active');
      prompt.value = '[' + text + '] ' + prompt.value;
    }
  }

  App.ui = {
    $, showError, activatePanel, escapeHtml, formatDate, safeFileName, downloadFile,
    getApiKey, saveApiKey, checkApiKey,
    saveProfile, loadProfile, renderProfileChips, toggleLessonType
  };

  // Expose handlers used by inline onclick in HTML
  window.saveApiKey = saveApiKey;
  window.saveProfile = saveProfile;
  window.loadProfile = loadProfile;
  window.toggleLessonType = toggleLessonType;
})();
