// lesson-runtime.js — defensive tab/iframe runtime
// Exposes: App.runtime.ensureLessonRuntime, App.runtime.forceLessonTabs, App.runtime.getSource

window.App = window.App || {};

(function() {

  function getLessonRuntimeSource() {
    return `(function(){
  var DEBUG = false;
  function log(){ if (DEBUG && window.console) console.log.apply(console, arguments); }
  function norm(value){
    return String(value || '')
      .toLowerCase()
      .replace(/&/g,' and ')
      .replace(/[_\\s]+/g,'-')
      .replace(/[^a-z0-9-]/g,'-')
      .replace(/-+/g,'-')
      .replace(/(^-|-$)/g,'')
      .replace(/^(tab|section|panel|content)-/,'')
      .replace(/-(tab|section|panel|content)$/,'');
  }
  function cleanLabel(value){ return String(value || '').replace(/\\s+/g,' ').trim(); }
  function unique(arr){ return Array.from(new Set(arr.filter(Boolean))); }
  function visibleEnough(el){
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('script,style')) return false;
    return cleanLabel(el.textContent).length > 0 || el.children.length > 0;
  }
  function isBeforeStart(el){
    var k = norm((el.id || '') + ' ' + (el.className || '') + ' ' + cleanLabel(el.textContent).slice(0,100));
    return k.indexOf('before-you-start') !== -1 || k.indexOf('before-start') !== -1;
  }
  function aliasKeys(key){
    var map = {
      'warm-up':['warm-up','warmup','warm'],
      'warmup':['warm-up','warmup','warm'],
      'language-bank':['language-bank','languagebank','language','vocabulary','vocab','chunks','phrases'],
      'dialogue':['dialogue','dialog','conversation','script'],
      'fluency-cycle':['fluency-cycle','fluency','cycle'],
      'hot-seat':['hot-seat','hotseat','hot','discussion','debate'],
      'homework':['homework','home-work','assignment'],
      'overview':['overview','meta','metadata','sequence','timeline','lesson-overview'],
      'grammar':['grammar','grammar-note','grammar-in-context'],
      'repetition':['repetition','repeat','drill','drills','practice']
    };
    return unique([key].concat(map[key] || []));
  }
  function tabKey(tab){
    var ds = tab.dataset || {};
    var raw = ds.tab || ds.target || tab.getAttribute('aria-controls') || tab.getAttribute('href') || tab.id || tab.textContent || '';
    return norm(String(raw).replace(/^#/, ''));
  }
  function sectionKeys(section){
    var ds = section.dataset || {};
    var heading = section.querySelector ? section.querySelector('h1,h2,h3,h4,h5,h6,[data-title],.section-title,.tab-title') : null;
    var keys = [
      ds.section, ds.tabContent, ds.panel, ds.tab, ds.target,
      section.getAttribute('aria-labelledby'), section.id,
      heading ? heading.textContent : '',
      section.getAttribute('data-title')
    ];
    return unique(keys.map(function(v){ return norm(String(v || '').replace(/^#/, '')); }));
  }
  function looksLikeTab(el){
    if (!visibleEnough(el) || isBeforeStart(el)) return false;
    var label = cleanLabel(el.textContent);
    if (label.length > 40) return false;
    if (el.matches('[data-tab],[role="tab"],.tab,.nav-tab,.tab-button,.lesson-tab')) return true;
    if (el.matches('button,a') && el.closest('.tabs,.tab-nav,.nav-tabs,.lesson-tabs,nav,[role="tablist"],.navigation,.tabbar')) return true;
    return false;
  }
  function collectTabs(){
    var selectors = [
      '[data-tab]', '[role="tab"]', '.tab', '.nav-tab', '.tab-button', '.lesson-tab',
      '.tabs button', '.tab-nav button', '.nav-tabs button', '.lesson-tabs button', '.navigation button', '.tabbar button',
      '.tabs a', '.tab-nav a', '.nav-tabs a', '.lesson-tabs a', '.navigation a', '.tabbar a'
    ];
    return unique(Array.from(document.querySelectorAll(selectors.join(',')))).filter(looksLikeTab);
  }
  function explicitTargetFor(tab){
    var key = tabKey(tab);
    var rawTargets = [
      tab.dataset ? tab.dataset.tab : '',
      tab.dataset ? tab.dataset.target : '',
      tab.getAttribute('aria-controls'),
      tab.getAttribute('href')
    ].filter(Boolean).map(function(v){ return String(v).replace(/^#/, ''); });
    for (var i=0; i<rawTargets.length; i++) {
      var id = rawTargets[i];
      var target = document.getElementById(id) || document.querySelector('[data-section="'+id+'"],[data-tab-content="'+id+'"],[data-panel="'+id+'"]');
      if (target) return target;
    }
    var aliases = aliasKeys(key);
    for (var j=0; j<aliases.length; j++) {
      var a = aliases[j];
      var el = document.getElementById(a) || document.querySelector('[data-section="'+a+'"],[data-tab-content="'+a+'"],[data-panel="'+a+'"]');
      if (el) return el;
    }
    return null;
  }
  function collectSections(tabs){
    var selectors = [
      '[data-section]', '[data-tab-content]', '[data-panel]', '[role="tabpanel"]',
      '.section', '.tab-content', '.tab-pane', '.tab-panel', '.lesson-section', '.content-section',
      '#overview','#warmup','#warm-up','#language-bank','#languageBank','#dialogue','#grammar','#fluency-cycle','#hot-seat','#homework','#repetition'
    ];
    var sections = unique(Array.from(document.querySelectorAll(selectors.join(','))))
      .filter(function(el){ return visibleEnough(el) && !isBeforeStart(el) && !tabs.some(function(t){ return t === el || el.contains(t); }); });
    return sections;
  }
  function mapTabsToSections(tabs, sections){
    var map = new Map();
    tabs.forEach(function(t){
      var target = explicitTargetFor(t);
      if (target) { map.set(t, target); return; }
      var key = tabKey(t);
      var aliases = aliasKeys(key);
      for (var i=0; i<sections.length; i++) {
        var sk = sectionKeys(sections[i]);
        if (sk.some(function(k){ return aliases.indexOf(k) !== -1; })) { map.set(t, sections[i]); break; }
      }
    });
    // Positional fallback
    var unmatched = tabs.filter(function(t){ return !map.has(t); });
    var unused = sections.filter(function(s){ return !Array.from(map.values()).includes(s); });
    unmatched.forEach(function(t, i){ if (unused[i]) map.set(t, unused[i]); });
    return map;
  }
  function activateBySection(targetSection, tabs, sections, map){
    sections.forEach(function(s){ s.style.display = (s === targetSection) ? '' : 'none'; });
    tabs.forEach(function(t){ t.classList.toggle('active', map.get(t) === targetSection); });
    try { window.parent.postMessage({ type: 'lesson-frame-resize' }, '*'); } catch(e) {}
  }
  function init(){
    var tabs = collectTabs();
    var sections = collectSections(tabs);
    log('tabs:', tabs.length, 'sections:', sections.length);
    try { window.parent.postMessage({ type: 'lesson-frame-qa', tabs: tabs.length, sections: sections.length }, '*'); } catch(e) {}
    if (!tabs.length || !sections.length) return;
    var map = mapTabsToSections(tabs, sections);
    tabs.forEach(function(t){
      t.style.cursor = 'pointer';
      if (t.dataset.lgBound === '1') return;
      t.dataset.lgBound = '1';
      t.addEventListener('click', function(e){
        e.preventDefault();
        var target = map.get(t);
        if (target) activateBySection(target, tabs, sections, map);
      });
    });
    var first = map.get(tabs[0]) || sections[0];
    if (first) activateBySection(first, tabs, sections, map);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Re-run shortly after for late-rendered DOM
  setTimeout(init, 200);
})();`;
  }

  function ensureLessonRuntime(html) {
    if (!html) return '';
    const marker = 'lesson-generator-tab-runtime-v2';
    if (html.includes(marker)) return html;

    const runtime = '\n<style id="lesson-generator-tab-runtime-v2-style">\n' +
      '.tab.active,.nav-tab.active,.tab-button.active,[data-tab].active,[role="tab"].active{color:#7F77DD!important;border-bottom:2px solid #7F77DD!important;}\n' +
      '.tab,.nav-tab,.tab-button,[data-tab],[role="tab"]{cursor:pointer;}\n' +
      '</style>\n' +
      '<' + 'script id="lesson-generator-tab-runtime-v2">\n' + getLessonRuntimeSource() + '\n<' + '/script>';

    return html + runtime;
  }

  function forceLessonTabs(doc) {
    if (!doc) return;
    const script = doc.createElement('script');
    script.textContent = getLessonRuntimeSource();
    doc.body.appendChild(script);
  }

  App.runtime = { ensureLessonRuntime, forceLessonTabs, getSource: getLessonRuntimeSource };
})();
