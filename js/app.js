import SceneManager from './sceneManager.js';
import { categories, findScene } from './scenes/index.js';

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
    const first = categories?.[0]?.scenes?.[0];
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
    const params = this.createSliders(this._sliderDefs);
    const toggles = this.createToggles(this._toggleDefs);
    const ac = document.getElementById('anim-controls');
    if (def.animate) ac.classList.remove('hidden'); else ac.classList.add('hidden');
    this.sceneManager.loadScene(def, params, toggles);
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
          this._renderMixedText(`${i + 1}. ${s.step}`, stepLbl);
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
