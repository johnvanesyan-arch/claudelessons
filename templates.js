// templates.js — lesson templates, prompt library, source library
// Exposes: App.templates

window.App = window.App || {};

(function() {
  const $ = App.ui.$;
  const showError = App.ui.showError;
  const escapeHtml = App.ui.escapeHtml;

  const LESSON_TEMPLATES = {
    tv_fluency: {
      label: 'TV-show fluency lesson',
      desc: 'Builds a speaking-first lesson from a scene/script: chunks, dialogue work, repetition, fluency cycle, hot-seat, and homework.',
      prompt: `Build a speaking-first TV-show lesson from the source material. Use only the provided source material unless I explicitly ask for extra examples. Focus on functional chunks, natural spoken responses, short guided repetition, and fluency practice. Include: Overview, Warm-up, Language Bank, Dialogue, Grammar in context, Fluency Cycle, Hot-Seat, and Homework. Make the lesson practical for adult learners.`
    },
    vocab_chunks: {
      label: 'Vocabulary / chunks lesson',
      desc: 'Extracts useful phrases, collocations, idioms, discourse markers, and natural sentence frames from the material.',
      prompt: `Create a vocabulary-and-chunks lesson from the source material. Extract useful phrases, idioms, collocations, phrasal verbs, discourse markers, and natural sentence frames. For each item, give meaning, level, example in context, and a short speaking drill. Prioritize language students can reuse in real conversation.`
    },
    grammar_context: {
      label: 'Grammar in context',
      desc: 'Teaches grammar from the material instead of isolated textbook explanation.',
      prompt: `Create a grammar-in-context lesson based only on the source material. Identify the most useful grammar pattern in the text, explain form and meaning simply, show examples from the material, include common learner mistakes, and add controlled-to-free speaking practice.`
    },
    medical_interpreter: {
      label: 'Medical interpreter training',
      desc: 'Builds interpreter-oriented practice with terminology, accuracy checks, register, and role-play.',
      prompt: `Create a medical interpreter training lesson for the Armenian-English language pair. Focus on accurate meaning transfer, medical terminology, register, clarification strategies, memory retention, note-taking, and role-play. Include interpreter-specific drills and accuracy warnings. Do not invent clinical facts beyond the source material.`
    },
    speaking_exam: {
      label: 'Speaking exam prep',
      desc: 'Turns the material into examiner-style questions, answer frames, timed practice, and feedback rubrics.',
      prompt: `Create a speaking exam preparation lesson. Include likely examiner questions, model answer frames, timed practice rounds, follow-up questions, vocabulary support, pronunciation focus, and a simple feedback rubric. Prioritize fluent, organized answers over memorized scripts.`
    },
    arm_ru_learner: {
      label: 'Armenian/Russian learner lesson',
      desc: 'Adds L1-interference warnings and targeted support for Armenian/Russian-speaking learners.',
      prompt: `Create a lesson for Armenian/Russian-speaking English learners. Include likely L1 interference problems, pronunciation warnings, grammar mistakes, word-order issues, and translation-sensitive explanations. Keep the main lesson in English unless I request Armenian or Russian translations.`
    }
  };

  const PROMPT_LIBRARY_KEY = 'lesson_prompt_library';
  const SOURCE_LIBRARY_KEY = 'lesson_source_library';

  function previewTemplateDescription() {
    const key = $('templateSelect').value;
    const box = $('templateDescription');
    box.textContent = key && LESSON_TEMPLATES[key] ? LESSON_TEMPLATES[key].desc : '';
  }

  function applySelectedTemplate() {
    const key = $('templateSelect').value;
    if (!key || !LESSON_TEMPLATES[key]) { showError('Select a lesson template first.'); return; }
    const prompt = $('userPrompt');
    const templateText = LESSON_TEMPLATES[key].prompt;
    prompt.value = prompt.value.trim() ? templateText + '\n\nAdditional instructions:\n' + prompt.value.trim() : templateText;
  }

  // Prompt library
  function saveCurrentPrompt() {
    const text = $('userPrompt').value.trim();
    if (!text) { showError('Write a prompt before saving it.'); return; }
    const name = window.prompt('Prompt name:');
    if (!name || !name.trim()) return;
    const arr = App.kv.getJSON(PROMPT_LIBRARY_KEY, []).filter(p => p.name !== name.trim());
    arr.unshift({ id: 'p_' + Date.now(), name: name.trim(), text, createdAt: Date.now() });
    App.kv.setJSON(PROMPT_LIBRARY_KEY, arr);
    renderPromptLibrary();
  }

  function loadSavedPrompt() {
    const id = $('promptLibrarySelect').value;
    if (!id) { showError('Select a saved prompt first.'); return; }
    const item = App.kv.getJSON(PROMPT_LIBRARY_KEY, []).find(p => p.id === id);
    if (item) $('userPrompt').value = item.text;
  }

  function deleteSavedPrompt() {
    const id = $('promptLibrarySelect').value;
    if (!id) { showError('Select a saved prompt first.'); return; }
    if (!confirm('Delete this saved prompt?')) return;
    App.kv.setJSON(PROMPT_LIBRARY_KEY, App.kv.getJSON(PROMPT_LIBRARY_KEY, []).filter(p => p.id !== id));
    renderPromptLibrary();
  }

  function renderPromptLibrary() {
    const select = $('promptLibrarySelect');
    if (!select) return;
    const arr = App.kv.getJSON(PROMPT_LIBRARY_KEY, []);
    select.innerHTML = '<option value="">Select saved prompt...</option>' + arr.map(p =>
      `<option value="${p.id}">${escapeHtml(p.name)}</option>`
    ).join('');
  }

  // Source library
  function saveCurrentMaterial() {
    const title = $('materialTitle').value.trim();
    const text = $('material').value.trim();
    if (!text) { showError('Paste source material before saving it.'); return; }
    const fallback = title || window.prompt('Source material title:');
    if (!fallback || !fallback.trim()) return;
    const arr = App.kv.getJSON(SOURCE_LIBRARY_KEY, []).filter(m => m.title !== fallback.trim());
    arr.unshift({
      id: 'm_' + Date.now(),
      title: fallback.trim(),
      text,
      courseName: $('courseName').value.trim(),
      unitName: $('unitName').value.trim(),
      lessonNumber: $('lessonNumber').value.trim(),
      tags: $('lessonTags').value.trim(),
      createdAt: Date.now()
    });
    App.kv.setJSON(SOURCE_LIBRARY_KEY, arr);
    renderSourceLibrary();
  }

  function loadSourceMaterial() {
    const id = $('sourceLibrarySelect').value;
    if (!id) { showError('Select saved source material first.'); return; }
    const item = App.kv.getJSON(SOURCE_LIBRARY_KEY, []).find(m => m.id === id);
    if (!item) return;
    $('materialTitle').value = item.title || '';
    $('material').value = item.text || '';
    $('courseName').value = item.courseName || '';
    $('unitName').value = item.unitName || '';
    $('lessonNumber').value = item.lessonNumber || '';
    $('lessonTags').value = item.tags || '';
  }

  function deleteSourceMaterial() {
    const id = $('sourceLibrarySelect').value;
    if (!id) { showError('Select saved source material first.'); return; }
    if (!confirm('Delete this saved source material?')) return;
    App.kv.setJSON(SOURCE_LIBRARY_KEY, App.kv.getJSON(SOURCE_LIBRARY_KEY, []).filter(m => m.id !== id));
    renderSourceLibrary();
  }

  function renderSourceLibrary() {
    const select = $('sourceLibrarySelect');
    if (!select) return;
    const arr = App.kv.getJSON(SOURCE_LIBRARY_KEY, []);
    select.innerHTML = '<option value="">Select saved source material...</option>' + arr.map(m =>
      `<option value="${m.id}">${escapeHtml(m.title)}</option>`
    ).join('');
  }

  App.templates = {
    LESSON_TEMPLATES,
    previewTemplateDescription, applySelectedTemplate,
    saveCurrentPrompt, loadSavedPrompt, deleteSavedPrompt, renderPromptLibrary,
    saveCurrentMaterial, loadSourceMaterial, deleteSourceMaterial, renderSourceLibrary
  };

  // Expose for inline onclick
  window.previewTemplateDescription = previewTemplateDescription;
  window.applySelectedTemplate = applySelectedTemplate;
  window.saveCurrentPrompt = saveCurrentPrompt;
  window.loadSavedPrompt = loadSavedPrompt;
  window.deleteSavedPrompt = deleteSavedPrompt;
  window.saveCurrentMaterial = saveCurrentMaterial;
  window.loadSourceMaterial = loadSourceMaterial;
  window.deleteSourceMaterial = deleteSourceMaterial;
})();
