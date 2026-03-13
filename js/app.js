import SceneManager from './sceneManager.js';
import { categories, findScene } from './scenes/index.js';
import { renderConceptMap } from './conceptMap.js';

class App {
  constructor() {
    this.viewport = document.getElementById('viewport');
    this.sceneManager = null;
    this._sliderDefs = [];
    this._toggleDefs = [];
    this.buildSidebar();
    this.setupControls();
    this.setupSearch();
    this.setupMobile();
    this.setupFormulaSheet();
    this.setupConceptMap();
    this.initSceneManager();
    this.loadInitialScene();
  }

  initSceneManager() {
    try {
      this.sceneManager = new SceneManager(this.viewport);
    } catch (err) {
      console.error('Failed to initialize 3D scene manager:', err);
    }
  }

  loadInitialScene() {
    const firstCat = categories.find(c => c.id !== 'sandbox');
    const first = firstCat?.scenes?.[0];
    if (first) this.loadScene(first.id);
  }

  buildSidebar() {
    const nav = document.getElementById('sidebar-nav');
    for (const cat of categories) {
      const catEl = document.createElement('div');
      catEl.className = 'nav-category';
      const titleEl = document.createElement('div');
      titleEl.className = 'nav-category-title';
      titleEl.innerHTML = `<span class="arrow">&#9660;</span>${cat.title}`;
      titleEl.addEventListener('click', () => catEl.classList.toggle('collapsed'));
      catEl.appendChild(titleEl);
      const items = document.createElement('div');
      items.className = 'nav-items';
      for (const s of cat.scenes) {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.textContent = s.title;
        item.dataset.sceneId = s.id;
        item.addEventListener('click', () => {
          this.loadScene(s.id);
          document.getElementById('sidebar').classList.remove('open');
          document.getElementById('overlay-backdrop').classList.remove('visible');
        });
        items.appendChild(item);
      }
      catEl.appendChild(items);
      nav.appendChild(catEl);
    }
  }

  loadScene(sceneId) {
    if (!this.sceneManager) return;
    const result = findScene(sceneId);
    if (!result) return;
    const { scene: def } = result;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.sceneId === sceneId);
    });
    document.getElementById('scene-title').textContent = def.title;
    document.getElementById('scene-desc').textContent = def.description;
    this.renderEquations(def.equations || []);
    this._sliderDefs = def.sliders || [];
    this._toggleDefs = def.toggles || [];
    this._currentSceneDef = def;

    if (def.isSandbox) {
      this._loadSandbox(def);
      return;
    }

    const params = this.createSliders(this._sliderDefs);
    const toggles = this.createToggles(this._toggleDefs);
    this.renderLimits(def.limits || [], params);
    const ac = document.getElementById('anim-controls');
    const pb = document.getElementById('play-pause-btn');
    if (def.animate) {
      ac.classList.remove('hidden');
      if (pb) pb.textContent = this.sceneManager.isPlaying ? '\u23F8' : '\u25B6';
    } else {
      ac.classList.add('hidden');
    }
    this.sceneManager.loadScene(def, params, toggles);
  }

  _loadSandbox(def) {
    const ac = document.getElementById('anim-controls');
    ac.classList.add('hidden');
    document.getElementById('limits-section').innerHTML = '';

    const sandboxToggles = { showArrows: true, showLines: false, showEquipotential: false };
    const toggleContainer = document.getElementById('toggle-buttons');
    toggleContainer.innerHTML = '';
    for (const [key, label] of [['showArrows', 'E Vectors'], ['showLines', 'Field Lines'], ['showEquipotential', 'Equipotential']]) {
      const btn = document.createElement('button');
      btn.className = 'toggle-btn' + (sandboxToggles[key] ? ' active' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        sandboxToggles[key] = !sandboxToggles[key];
        btn.classList.toggle('active');
        if (this._sandboxState) this._sandboxState.rebuild();
      });
      toggleContainer.appendChild(btn);
    }

    const params = {};
    this.sceneManager.loadScene(def, params, sandboxToggles);
    this._sandboxState = this.sceneManager.currentState;

    const sliderC = document.getElementById('sliders');
    sliderC.innerHTML = '';

    let currentSign = 1;
    let currentMag = 1;
    let editing = false;

    const updateNextQ = () => {
      if (this._sandboxState) this._sandboxState.setNextChargeQ(currentSign * currentMag);
    };

    const syncControls = () => {
      const q = currentSign * currentMag;
      updateNextQ();
      if (editing) {
        const state = this._sandboxState;
        if (state && state.getSelected() >= 0) {
          state.updateChargeValue(state.getSelected(), q);
        }
      }
    };

    const setModeLabel = () => {
      modeLabel.textContent = editing
        ? 'Editing selected charge (click ground or Esc to deselect)'
        : 'Next charge to place — click the grid';
      modeLabel.className = 'sandbox-mode-label' + (editing ? ' sandbox-mode-editing' : '');
    };

    const enterEditMode = (charge) => {
      editing = true;
      currentSign = charge.q >= 0 ? 1 : -1;
      currentMag = Math.round(Math.abs(charge.q) * 10) / 10 || 1;
      magInp.value = currentMag;
      magVal.textContent = currentMag.toFixed(1);
      btnPos.className = 'sandbox-sign-btn' + (currentSign > 0 ? ' active-positive' : '');
      btnNeg.className = 'sandbox-sign-btn' + (currentSign < 0 ? ' active-negative' : '');
      updateNextQ();
      delBtn.classList.remove('hidden');
      setModeLabel();
    };

    const exitEditMode = () => {
      editing = false;
      delBtn.classList.add('hidden');
      setModeLabel();
    };

    const modeLabel = document.createElement('div');
    modeLabel.className = 'sandbox-mode-label';
    modeLabel.textContent = 'Next charge to place — click the grid';
    sliderC.appendChild(modeLabel);

    const chargeSignRow = document.createElement('div');
    chargeSignRow.className = 'sandbox-control-row';
    const signLabel = document.createElement('span');
    signLabel.className = 'sandbox-label';
    signLabel.textContent = 'Charge sign:';
    chargeSignRow.appendChild(signLabel);

    const btnPos = document.createElement('button');
    btnPos.className = 'sandbox-sign-btn active-positive';
    btnPos.textContent = '+';
    const btnNeg = document.createElement('button');
    btnNeg.className = 'sandbox-sign-btn';
    btnNeg.textContent = '−';
    btnPos.addEventListener('click', () => {
      currentSign = 1;
      btnPos.className = 'sandbox-sign-btn active-positive';
      btnNeg.className = 'sandbox-sign-btn';
      syncControls();
    });
    btnNeg.addEventListener('click', () => {
      currentSign = -1;
      btnNeg.className = 'sandbox-sign-btn active-negative';
      btnPos.className = 'sandbox-sign-btn';
      syncControls();
    });
    chargeSignRow.append(btnPos, btnNeg);
    sliderC.appendChild(chargeSignRow);

    const magRow = document.createElement('div');
    magRow.className = 'slider-group';
    const magLabelRow = document.createElement('div');
    magLabelRow.className = 'slider-label';
    const magName = document.createElement('span');
    magName.textContent = 'Charge |q|';
    const magVal = document.createElement('span');
    magVal.className = 'slider-value';
    magVal.textContent = '1.0';
    magLabelRow.append(magName, magVal);
    magRow.appendChild(magLabelRow);
    const magInp = document.createElement('input');
    magInp.type = 'range'; magInp.min = 0.5; magInp.max = 5; magInp.step = 0.5; magInp.value = 1;
    magInp.addEventListener('input', () => {
      currentMag = parseFloat(magInp.value);
      magVal.textContent = currentMag.toFixed(1);
      syncControls();
    });
    magRow.appendChild(magInp);
    sliderC.appendChild(magRow);

    const delBtn = document.createElement('button');
    delBtn.className = 'sandbox-delete-btn hidden';
    delBtn.textContent = 'Delete selected charge';
    delBtn.addEventListener('click', () => {
      const state = this._sandboxState;
      if (state && state.getSelected() >= 0) {
        state.removeCharge(state.getSelected());
      }
    });
    sliderC.appendChild(delBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'sandbox-clear-btn';
    clearBtn.textContent = 'Clear all charges';
    clearBtn.addEventListener('click', () => {
      if (this._sandboxState) this._sandboxState.clearAll();
    });
    sliderC.appendChild(clearBtn);

    this._sandboxState.setOnSelect((idx, charge) => enterEditMode(charge));
    this._sandboxState.setOnDeselect(() => exitEditMode());
    updateNextQ();
  }

  _renderMixedText(text, container) {
    const parts = text.split(/(\$[^$]+\$)/g);
    for (const part of parts) {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const span = document.createElement('span');
        katex.render(part.slice(1, -1), span, { throwOnError: false, displayMode: false });
        container.appendChild(span);
      } else if (part) {
        container.appendChild(document.createTextNode(part));
      }
    }
  }

  renderEquations(equations) {
    const c = document.getElementById('equations-section');
    c.innerHTML = '';
    if (!equations.length) return;
    const h = document.createElement('h3');
    h.textContent = 'Equations';
    c.appendChild(h);
    for (const eq of equations) {
      const card = document.createElement('div');
      card.className = 'equation-card';

      const labelRow = document.createElement('div');
      labelRow.className = 'equation-label-row';
      const lbl = document.createElement('div');
      lbl.className = 'equation-label';
      lbl.textContent = eq.label;
      labelRow.appendChild(lbl);

      let derivContainer = null;
      if (eq.derivation?.length) {
        derivContainer = document.createElement('div');
        derivContainer.className = 'derivation-container';
        const btn = document.createElement('button');
        btn.className = 'derivation-toggle';
        btn.innerHTML = '<span class="toggle-arrow">&#9654;</span> Derive';
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          derivContainer.classList.toggle('open');
        });
        labelRow.appendChild(btn);
      }
      card.appendChild(labelRow);

      const math = document.createElement('div');
      math.className = 'equation-math';
      katex.render(eq.latex, math, { throwOnError: false, displayMode: true });
      card.appendChild(math);

      if (derivContainer) {
        const steps = document.createElement('div');
        steps.className = 'derivation-steps';
        eq.derivation.forEach((s, i) => {
          const step = document.createElement('div');
          step.className = 'derivation-step';
          const stepLbl = document.createElement('div');
          stepLbl.className = 'derivation-step-label';
          if (s.ref) {
            const link = document.createElement('span');
            link.className = 'derivation-ref-link';
            link.textContent = `${i + 1}. `;
            this._renderMixedText(s.step, link);
            link.addEventListener('click', () => this.loadScene(s.ref));
            stepLbl.appendChild(link);
          } else {
            this._renderMixedText(`${i + 1}. ${s.step}`, stepLbl);
          }
          step.appendChild(stepLbl);
          const stepMath = document.createElement('div');
          stepMath.className = 'derivation-step-math';
          katex.render(s.latex, stepMath, { throwOnError: false, displayMode: true });
          step.appendChild(stepMath);
          steps.appendChild(step);
        });
        derivContainer.appendChild(steps);
        card.appendChild(derivContainer);
      }

      c.appendChild(card);
    }
  }

  renderLimits(limits, params) {
    const sec = document.getElementById('limits-section');
    sec.innerHTML = '';
    if (!limits.length) return;
    const h = document.createElement('h3');
    h.className = 'limits-heading';
    h.textContent = 'Limiting Cases';
    sec.appendChild(h);
    const row = document.createElement('div');
    row.className = 'limits-row';
    sec.appendChild(row);
    const bannerSlot = document.createElement('div');
    sec.appendChild(bannerSlot);

    for (const lim of limits) {
      const pill = document.createElement('button');
      pill.className = 'limit-pill';
      pill.textContent = lim.label;
      pill.addEventListener('click', () => this._animateLimit(lim, params, pill, bannerSlot));
      row.appendChild(pill);
    }
  }

  _animateLimit(lim, params, pill, bannerSlot) {
    const sliderIdx = this._sliderDefs.findIndex(d => d.id === lim.slider);
    if (sliderIdx === -1) return;
    const inp = document.querySelectorAll('#sliders input[type="range"]')[sliderIdx];
    const valSpan = document.querySelectorAll('#sliders .slider-value')[sliderIdx];
    if (!inp) return;

    pill.classList.add('animating');
    bannerSlot.innerHTML = '';

    const startVal = parseFloat(inp.value);
    const endVal = lim.target;
    const duration = 800;
    const startTime = performance.now();
    const sliderDef = this._sliderDefs[sliderIdx];

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const v = startVal + (endVal - startVal) * eased;
      inp.value = v;
      params[sliderDef.id] = v;
      valSpan.textContent = `${parseFloat(v.toFixed(2))}${sliderDef.unit ? ' ' + sliderDef.unit : ''}`;
      this.onParamsChanged(params, null);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        pill.classList.remove('animating');
        this._showLimitBanner(lim, bannerSlot);
      }
    };
    requestAnimationFrame(tick);
  }

  _showLimitBanner(lim, bannerSlot) {
    bannerSlot.innerHTML = '';
    const banner = document.createElement('div');
    banner.className = 'limit-banner';
    banner.textContent = lim.annotation;
    if (lim.ref) {
      banner.textContent = lim.annotation + '  ';
      const link = document.createElement('span');
      link.className = 'limit-ref-link';
      link.textContent = '→ Go to scene';
      link.addEventListener('click', () => this.loadScene(lim.ref));
      banner.appendChild(link);
    }
    bannerSlot.appendChild(banner);
  }

  createSliders(defs) {
    const c = document.getElementById('sliders');
    c.innerHTML = '';
    const params = {};
    for (const d of defs) {
      params[d.id] = d.default;
      const g = document.createElement('div');
      g.className = 'slider-group';
      const row = document.createElement('div');
      row.className = 'slider-label';
      const name = document.createElement('span');
      name.textContent = d.label;
      const val = document.createElement('span');
      val.className = 'slider-value';
      val.textContent = `${d.default}${d.unit ? ' ' + d.unit : ''}`;
      row.append(name, val);
      g.appendChild(row);
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = d.min; inp.max = d.max;
      inp.step = d.step || 0.1; inp.value = d.default;
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        params[d.id] = v;
        val.textContent = `${v}${d.unit ? ' ' + d.unit : ''}`;
        this.onParamsChanged(params, null);
      });
      g.appendChild(inp);
      c.appendChild(g);
    }
    return params;
  }

  createToggles(defs) {
    const c = document.getElementById('toggle-buttons');
    c.innerHTML = '';
    const toggles = {};
    for (const d of defs) {
      toggles[d.id] = d.default;
      const btn = document.createElement('button');
      btn.className = 'toggle-btn' + (d.default ? ' active' : '');
      btn.textContent = d.label;
      btn.addEventListener('click', () => {
        toggles[d.id] = !toggles[d.id];
        btn.classList.toggle('active');
        this.onParamsChanged(null, toggles);
      });
      c.appendChild(btn);
    }
    return toggles;
  }

  onParamsChanged(params, toggles) {
    if (!this.sceneManager) return;
    // Always read current values from DOM to avoid stale closures
    params = {};
    const inps = document.querySelectorAll('#sliders input[type="range"]');
    inps.forEach((inp, i) => {
      if (this._sliderDefs[i]) params[this._sliderDefs[i].id] = parseFloat(inp.value);
    });
    if (!toggles) {
      toggles = {};
      const btns = document.querySelectorAll('#toggle-buttons .toggle-btn');
      btns.forEach((b, i) => {
        if (this._toggleDefs[i]) toggles[this._toggleDefs[i].id] = b.classList.contains('active');
      });
    }
    this.sceneManager.updateParams(params, toggles);
  }

  setupFormulaSheet() {
    const overlay = document.getElementById('formula-sheet-overlay');
    const btnOpen = document.getElementById('btn-formula-sheet');
    const btnClose = document.getElementById('formula-sheet-close');
    const btnPrint = document.getElementById('formula-sheet-print');
    const selectAll = document.getElementById('formula-sheet-select-all');
    const derivToggle = document.getElementById('formula-sheet-derivations');
    const chapContainer = document.getElementById('formula-sheet-chapters');
    const content = document.getElementById('formula-sheet-content');
    if (!overlay || !btnOpen) return;

    const checkboxes = [];
    for (const cat of categories) {
      if (!cat.scenes.some(s => s.equations?.length)) continue;
      const lbl = document.createElement('label');
      lbl.className = 'overlay-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.catIdx = String(categories.indexOf(cat));
      cb.addEventListener('change', () => this._generateSheet(checkboxes, derivToggle.checked, content));
      lbl.append(cb, document.createTextNode(' ' + cat.title));
      chapContainer.appendChild(lbl);
      checkboxes.push(cb);
    }

    selectAll.addEventListener('change', () => {
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
      this._generateSheet(checkboxes, derivToggle.checked, content);
    });
    derivToggle.addEventListener('change', () => {
      this._generateSheet(checkboxes, derivToggle.checked, content);
    });
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('visible');
      this._generateSheet(checkboxes, derivToggle.checked, content);
    });
    btnClose.addEventListener('click', () => overlay.classList.remove('visible'));
    btnPrint.addEventListener('click', () => window.print());
  }

  _generateSheet(checkboxes, showDerivations, content) {
    content.innerHTML = '';
    for (const cb of checkboxes) {
      if (!cb.checked) continue;
      const cat = categories[parseInt(cb.dataset.catIdx)];
      const hasEquations = cat.scenes.some(s => s.equations?.length);
      if (!hasEquations) continue;
      const chapter = document.createElement('div');
      chapter.className = 'sheet-chapter';
      const chTitle = document.createElement('div');
      chTitle.className = 'sheet-chapter-title';
      chTitle.textContent = cat.title;
      chapter.appendChild(chTitle);

      for (const scene of cat.scenes) {
        if (!scene.equations?.length) continue;
        const scDiv = document.createElement('div');
        scDiv.className = 'sheet-scene';
        const scTitle = document.createElement('div');
        scTitle.className = 'sheet-scene-title';
        scTitle.textContent = scene.title;
        scDiv.appendChild(scTitle);

        for (const eq of scene.equations) {
          const card = document.createElement('div');
          card.className = 'sheet-eq';
          const lbl = document.createElement('div');
          lbl.className = 'sheet-eq-label';
          lbl.textContent = eq.label;
          card.appendChild(lbl);
          const math = document.createElement('div');
          math.className = 'sheet-eq-math';
          katex.render(eq.latex, math, { throwOnError: false, displayMode: true });
          card.appendChild(math);
          scDiv.appendChild(card);

          if (showDerivations && eq.derivation?.length) {
            const derivDiv = document.createElement('div');
            derivDiv.className = 'sheet-deriv';
            for (const s of eq.derivation) {
              const step = document.createElement('div');
              step.className = 'sheet-deriv-step';
              this._renderMixedText(`${s.step}`, step);
              const stepMath = document.createElement('div');
              stepMath.style.textAlign = 'center';
              stepMath.style.margin = '2px 0 4px';
              katex.render(s.latex, stepMath, { throwOnError: false, displayMode: true });
              step.appendChild(stepMath);
              derivDiv.appendChild(step);
            }
            scDiv.appendChild(derivDiv);
          }
        }
        chapter.appendChild(scDiv);
      }
      content.appendChild(chapter);
    }
  }

  setupConceptMap() {
    const overlay = document.getElementById('concept-map-overlay');
    const btnOpen = document.getElementById('btn-concept-map');
    const btnClose = document.getElementById('concept-map-close');
    const container = document.getElementById('concept-map-container');
    if (!overlay || !btnOpen) return;

    let rendered = false;
    btnOpen.addEventListener('click', () => {
      overlay.classList.add('visible');
      if (!rendered) {
        this._conceptMapCleanup = renderConceptMap(container, (sceneId) => {
          overlay.classList.remove('visible');
          this.loadScene(sceneId);
        });
        rendered = true;
      }
    });
    btnClose.addEventListener('click', () => overlay.classList.remove('visible'));
  }

  setupControls() {
    const pb = document.getElementById('play-pause-btn');
    const sr = document.getElementById('speed-range');
    const sv = document.getElementById('speed-val');
    if (!pb || !sr || !sv) return;
    pb.addEventListener('click', () => {
      if (!this.sceneManager) return;
      this.sceneManager.isPlaying = !this.sceneManager.isPlaying;
      pb.textContent = this.sceneManager.isPlaying ? '\u23F8' : '\u25B6';
    });
    sr.addEventListener('input', () => {
      if (!this.sceneManager) return;
      const s = parseFloat(sr.value);
      this.sceneManager.setSpeed(s);
      sv.textContent = `${s.toFixed(1)}x`;
    });
  }

  setupSearch() {
    const inp = document.getElementById('search-input');
    if (!inp) return;
    const applyFilter = () => {
      const q = inp.value.toLowerCase();
      document.querySelectorAll('.nav-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.nav-category').forEach(cat => {
        if (q) {
          cat.classList.remove('collapsed');
          const vis = cat.querySelectorAll('.nav-item');
          let any = false;
          vis.forEach(v => { if (v.style.display !== 'none') any = true; });
          cat.style.display = any ? '' : 'none';
        } else {
          cat.style.display = '';
        }
      });
    };
    inp.addEventListener('input', applyFilter);
    inp.addEventListener('search', applyFilter);
    applyFilter();
  }

  setupMobile() {
    const sidebar = document.getElementById('sidebar');
    const panel = document.getElementById('info-panel');
    const backdrop = document.getElementById('overlay-backdrop');
    const btnSidebar = document.getElementById('btn-sidebar');
    const btnPanel = document.getElementById('btn-panel');
    if (!sidebar || !panel || !backdrop || !btnSidebar || !btnPanel) return;

    const closeAll = () => {
      sidebar.classList.remove('open');
      panel.classList.remove('open');
      backdrop.classList.remove('visible');
    };

    btnSidebar.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opening = !sidebar.classList.contains('open');
      closeAll();
      if (opening) { sidebar.classList.add('open'); backdrop.classList.add('visible'); }
    });

    btnPanel.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opening = !panel.classList.contains('open');
      closeAll();
      if (opening) { panel.classList.add('open'); backdrop.classList.add('visible'); }
    });

    backdrop.addEventListener('click', closeAll);
  }
}

new App();
