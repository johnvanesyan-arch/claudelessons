// app.js — orchestration: prompt building, generation flow, iframe rendering,
// raw edit, cancel, download, print, init
// Exposes: App.frame, App.state, plus top-level handlers used by inline onclick

window.App = window.App || {};
App.state = { generatedHTML: '', currentController: null, originalHTMLForEdit: '' };

(function() {
  const $ = App.ui.$;
  const showError = App.ui.showError;
  const activatePanel = App.ui.activatePanel;

  // ============ PROMPT BUILDING ============
  function buildSystemPrompt() {
    const fields = {
      age: $('age').value.trim(),
      native: $('nativeLang').value.trim(),
      level: $('level').value,
      goals: $('goals').value.trim(),
      struggles: $('struggles').value.trim(),
      interests: $('interests').value.trim(),
      notes: $('notes').value.trim(),
      duration: $('duration').value.trim(),
      matTitle: $('materialTitle').value.trim(),
      courseName: $('courseName').value.trim(),
      unitName: $('unitName').value.trim(),
      lessonNumber: $('lessonNumber').value.trim(),
      lessonTags: $('lessonTags').value.trim(),
      material: $('material').value.trim(),
      override: $('overridePrompt').value.trim()
    };

    let studentBlock = '=== STUDENT PROFILE ===\n';
    if (fields.age) studentBlock += `Age/group: ${fields.age}\n`;
    if (fields.native) studentBlock += `Native language: ${fields.native}\n`;
    if (fields.level) studentBlock += `English level: ${fields.level}\n`;
    if (fields.goals) studentBlock += `Goals: ${fields.goals}\n`;
    if (fields.struggles) studentBlock += `Struggles/weaknesses: ${fields.struggles}\n`;
    if (fields.interests) studentBlock += `Interests/context: ${fields.interests}\n`;
    if (fields.notes) studentBlock += `Additional notes: ${fields.notes}\n`;
    if (fields.duration) studentBlock += `Lesson duration: ${fields.duration} minutes\n`;

    let lessonMetaBlock = '=== LESSON ORGANIZATION ===\n';
    if (fields.courseName) lessonMetaBlock += `Course/project: ${fields.courseName}\n`;
    if (fields.unitName) lessonMetaBlock += `Unit: ${fields.unitName}\n`;
    if (fields.lessonNumber) lessonMetaBlock += `Lesson: ${fields.lessonNumber}\n`;
    if (fields.lessonTags) lessonMetaBlock += `Tags: ${fields.lessonTags}\n`;

    let materialBlock = '=== LESSON MATERIAL ===\n';
    if (fields.matTitle) materialBlock += `Title: ${fields.matTitle}\n\n`;
    materialBlock += fields.material;

    let overrideBlock = '';
    if (fields.override) {
      overrideBlock = `\n\n=== OVERRIDE — HIGHEST PRIORITY ===\nThe following instructions OVERRIDE all default rules, formatting requirements, section structures, and output specifications defined above. Apply them unconditionally, even if they conflict with any prior instruction:\n\n${fields.override}\n\nThese override instructions take absolute precedence over everything else.`;
    }

    return `You are an expert EFL/ESL lesson designer. Generate a complete, structured English lesson.

${studentBlock}

${lessonMetaBlock}

${materialBlock}

=== DEFAULT OUTPUT REQUIREMENTS ===
Generate a complete self-contained HTML lesson widget. Single HTML block — no DOCTYPE, no html/head/body tags. All CSS and JS inline.

REQUIRED STRUCTURE:
1. BEFORE YOU START box (always visible at top):
   - Fluency goal (one sentence)
   - Thing to avoid (one sentence)
   - What to say to student (quoted, styled box)

2. Navigation tabs (one per applicable section):
   - Overview: lesson metadata grid + sequence timeline
   - Warm-up: prompt cards with sentence starters
   - Language bank: chunk cards with Russian translations grouped A/B/C
   - Dialogue: three sub-tabs: Full / Gap-fill / Practice steps
   - Fluency cycle: three round cards with timing pills, instructions, sample answers
   - Hot-seat: setup card, support phrases, devil's advocate prompts, timed rounds, rescue moves, feedback checklist
   - Homework: task box with required phrases highlighted, self-check items, follow-up note, reflection questions

TAB IMPLEMENTATION (mandatory — tabs MUST work when clicked):
- Each tab button: <button class="tab" data-tab="overview">Overview</button>
- Each section: <div class="section" data-section="overview">...</div>
- Tab IDs/data-tab values must be lowercase, hyphen-separated (e.g. "language-bank", "fluency-cycle", "hot-seat")
- Use addEventListener click handlers, not inline onclick.

DESIGN RULES:
- CSS variables for all colors (light/dark mode safe)
- Purple (#7F77DD) accent for active tab + key phrases
- Color-coded rounds: green (#639922) = round 1, purple (#7F77DD) = round 2, amber (#BA7517) = round 3
- Coral (#D85A30) left border for devil's advocate prompts
- Flat, minimal — NO gradients, NO box-shadows
- Font size minimum 13px
- No emoji${overrideBlock}

Generate ONLY the HTML block, nothing else. Start with a <style> tag.`;
  }

  function buildLessonTitle(userPrompt) {
    const parts = [
      $('courseName').value.trim(),
      $('unitName').value.trim(),
      $('lessonNumber').value.trim(),
      $('materialTitle').value.trim()
    ].filter(Boolean);
    return parts.join(' — ') || (userPrompt || '').slice(0, 60) || 'Untitled lesson';
  }

  // ============ GENERATION FLOW ============
  function validateBeforeGenerate() {
    if (!App.ui.getApiKey()) {
      showError('No API key saved. Enter your key in the box at the top.');
      return false;
    }
    if (!$('material').value.trim()) { showError('Please paste the lesson material in step 2.'); activatePanel(2); return false; }
    if (!$('userPrompt').value.trim()) { showError('Please enter a prompt in step 3.'); activatePanel(3); return false; }
    return true;
  }

  function goStep(n) {
    if (n === 4) {
      if (!validateBeforeGenerate()) return;
      activatePanel(4);
      generateLesson();
      return;
    }
    activatePanel(n);
  }

  async function generateLesson() {
    // Reset UI state
    $('generatingState').style.display = 'block';
    $('outputArea').style.display = 'none';
    $('editArea').style.display = 'none';
    $('outputNav').style.display = 'none';
    $('streamStatus').textContent = 'Connecting to Claude...';
    $('streamProgressBar').style.width = '0%';
    App.state.generatedHTML = '';

    const userPrompt = $('userPrompt').value.trim();
    const systemPrompt = buildSystemPrompt();
    let chunkCount = 0;

    App.state.currentController = App.api.generateStream(systemPrompt, userPrompt, {
      onStart: () => {
        $('streamStatus').textContent = 'Generating...';
      },
      onChunk: (text, accumulated) => {
        chunkCount++;
        // Visual progress: bar fills based on accumulated length, capped
        const pct = Math.min(95, (accumulated.length / 12000) * 100);
        $('streamProgressBar').style.width = pct + '%';
        $('streamStatus').textContent = `Generating... ${accumulated.length.toLocaleString()} chars`;
      },
      onDone: async (fullText) => {
        $('streamProgressBar').style.width = '100%';
        const cleaned = fullText.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
        App.state.generatedHTML = App.runtime.ensureLessonRuntime(cleaned);

        // Save to history
        try {
          await App.history.save({
            title: buildLessonTitle(userPrompt),
            materialTitle: $('materialTitle').value.trim(),
            courseName: $('courseName').value.trim(),
            unitName: $('unitName').value.trim(),
            lessonNumber: $('lessonNumber').value.trim(),
            lessonTags: $('lessonTags').value.trim(),
            prompt: userPrompt,
            html: App.state.generatedHTML,
            createdAt: Date.now()
          });
        } catch (e) {
          showError('Lesson generated but could not be saved to history: ' + e.message);
        }

        $('generatingState').style.display = 'none';
        $('outputArea').style.display = 'block';
        $('outputNav').style.display = 'flex';
        App.frame.render(App.state.generatedHTML);
        App.state.currentController = null;
      },
      onError: (err) => {
        $('generatingState').style.display = 'none';
        showError('Generation failed: ' + err.message);
        activatePanel(3);
        App.state.currentController = null;
      }
    });
  }

  function cancelGeneration() {
    if (App.state.currentController) {
      App.state.currentController.abort();
      App.state.currentController = null;
    }
  }

  // ============ IFRAME RENDERING ============
  function renderInFrame(html) {
    const frame = $('lessonFrame');
    const safeHtml = App.runtime.ensureLessonRuntime(html);
    frame.srcdoc = safeHtml;
    frame.onload = () => {
      try {
        App.runtime.forceLessonTabs(frame.contentDocument);
        resizeFrame();
      } catch (e) {}
    };
  }

  function resizeFrame() {
    const frame = $('lessonFrame');
    try {
      const doc = frame.contentDocument;
      const h = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.offsetHeight
      );
      frame.style.height = Math.max(h + 40, 600) + 'px';
    } catch (e) {}
  }

  App.frame = { render: renderInFrame, resize: resizeFrame };

  // ============ EDIT / COPY / DOWNLOAD / PRINT ============
  function copyOutput() {
    if (!App.state.generatedHTML) return;
    navigator.clipboard.writeText(App.state.generatedHTML).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = App.state.generatedHTML;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  function downloadHTML() {
    if (!App.state.generatedHTML) { showError('No generated lesson to download.'); return; }
    App.ui.downloadFile(
      App.ui.safeFileName(buildLessonTitle('lesson'), '.html'),
      App.state.generatedHTML,
      'text/html;charset=utf-8'
    );
  }

  function printLesson() {
    if (!App.state.generatedHTML) { showError('No generated lesson to print.'); return; }
    const w = window.open('', '_blank');
    if (!w) { showError('Popup blocked. Allow popups to print.'); return; }
    w.document.open();
    w.document.write('<!DOCTYPE html><html><head><title>Lesson</title></head><body>' + App.state.generatedHTML + '</body></html>');
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  }

  function startRawEdit() {
    if (!App.state.generatedHTML) return;
    App.state.originalHTMLForEdit = App.state.generatedHTML;
    $('editTextarea').value = App.state.generatedHTML;
    $('outputArea').style.display = 'none';
    $('editArea').style.display = 'block';
  }

  function applyRawEdits() {
    const newHtml = $('editTextarea').value;
    App.state.generatedHTML = App.runtime.ensureLessonRuntime(newHtml);
    $('editArea').style.display = 'none';
    $('outputArea').style.display = 'block';
    App.frame.render(App.state.generatedHTML);
  }

  function cancelRawEdit() {
    $('editTextarea').value = '';
    $('editArea').style.display = 'none';
    $('outputArea').style.display = 'block';
  }

  function newLesson() {
    $('material').value = '';
    $('materialTitle').value = '';
    $('lessonNumber').value = '';
    $('lessonTags').value = '';
    $('userPrompt').value = '';
    $('overridePrompt').value = '';
    $('duration').value = '';
    document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    activatePanel(1);
  }

  // ============ MESSAGES FROM IFRAME ============
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'lesson-frame-resize') App.frame.resize();
    if (event.data.type === 'lesson-frame-qa') {
      if (event.data.tabs > 0 && event.data.sections === 0) {
        showError("QA warning: tabs were found but no matching sections. Regenerate or simplify the prompt.");
      }
    }
  });

  // ============ INIT ============
  async function init() {
    // Migrate old localStorage history to IndexedDB (one-time)
    await App.storage.migrateFromLocalStorage();

    App.ui.checkApiKey();
    App.ui.renderProfileChips();
    App.templates.renderPromptLibrary();
    App.templates.renderSourceLibrary();
    App.templates.previewTemplateDescription();
    await App.history.renderHistory();
  }

  // Expose top-level handlers for inline onclick in HTML
  window.goStep = goStep;
  window.cancelGeneration = cancelGeneration;
  window.copyOutput = copyOutput;
  window.downloadHTML = downloadHTML;
  window.printLesson = printLesson;
  window.startRawEdit = startRawEdit;
  window.applyRawEdits = applyRawEdits;
  window.cancelRawEdit = cancelRawEdit;
  window.newLesson = newLesson;

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
