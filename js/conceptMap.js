import { categories } from './scenes/index.js';
import * as i18n from './i18n/index.js';

const EDGE_LABEL_KEYS = {
  'generalize': 'cm.generalize',
  'L → ∞': 'cm.LtoInf',
  'R → ∞': 'cm.RtoInf',
  'α → 2π': 'cm.alphaTo2pi',
  'Gauss method': 'cm.gaussMethod',
  'integrate E': 'cm.integrateE',
  'V from dipole': 'cm.VfromDipole',
  'V on axis': 'cm.VonAxis',
  'uniform E': 'cm.uniformE',
  'add κ': 'cm.addKappa',
  'stored energy': 'cm.storedEnergy',
  'RC circuit': 'cm.rcCircuit',
  'extend': 'cm.extend',
  'Kirchhoff rules': 'cm.kirchhoffRules',
  'Lorentz force': 'cm.LorentzForce',
  'force on loop': 'cm.forceOnLoop',
  'Hall effect': 'cm.hallEffect',
  'finite version': 'cm.finiteVersion',
  'loop geometry': 'cm.loopGeometry',
  'Ampère method': 'cm.ampereMethod',
  'flux of B': 'cm.fluxOfB',
  "Faraday's law": 'cm.faradayLaw',
  'motional emf': 'cm.motionalEmf',
  'rotating loop': 'cm.rotatingLoop',
  'inductor': 'cm.inductor',
  'AC version': 'cm.acVersion',
  'combine': 'cm.combine',
  "Maxwell's addition": 'cm.maxwellAddition',
  'energy flow': 'cm.energyFlow',
};

const CATEGORY_COLORS = {
  electrostatics: '#ff5566',
  distributions: '#ff8844',
  gauss:          '#ffcc33',
  potential:      '#66dd66',
  capacitors:     '#44ccaa',
  circuits:       '#44aadd',
  magnetic:       '#5588ff',
  biotSavart:     '#8866ee',
  faraday:        '#cc66dd',
  acMaxwell:      '#ee6699'
};

const EDGES = [
  // Electrostatics → Distributions
  ['point-charge', 'finite-rod-on-axis', 'generalize'],
  ['point-charge', 'charged-ring', 'generalize'],
  // Distributions limits & generalizations
  ['finite-rod-perp', 'infinite-line', 'L → ∞'],
  ['charged-ring', 'charged-disk', 'generalize'],
  ['charged-disk', 'infinite-plane', 'R → ∞'],
  ['charged-arc', 'charged-ring', 'α → 2π'],
  // Distributions → Gauss (same result, different method)
  ['infinite-line', 'line-charge-gauss', 'Gauss method'],
  ['infinite-plane', 'plane-gauss', 'Gauss method'],
  ['charged-shell-integration', 'shell-gauss', 'Gauss method'],
  ['solid-sphere-charge', 'solid-sphere-gauss', 'Gauss method'],
  // Electrostatics ↔ Gauss
  ['point-charge', 'point-charge-gauss', 'Gauss method'],
  // Gauss → Potential
  ['point-charge-gauss', 'point-charge-potential', 'integrate E'],
  // Electrostatics → Potential
  ['dipole', 'dipole-potential', 'V from dipole'],
  // Distributions → Potential
  ['charged-ring', 'ring-potential', 'V on axis'],
  ['charged-disk', 'disk-potential', 'V on axis'],
  // Potential internals
  ['gradient-field', 'equipotential-surfaces', 'E = −∇V'],
  // Gauss → Capacitors
  ['plane-gauss', 'parallel-plate', 'uniform E'],
  // Capacitors internals
  ['parallel-plate', 'dielectric-capacitor', 'add κ'],
  ['parallel-plate', 'energy-density', 'stored energy'],
  // Capacitors → Circuits
  ['parallel-plate', 'rc-circuit', 'RC circuit'],
  // Circuits internals
  ['simple-circuit', 'series-parallel', 'extend'],
  ['series-parallel', 'kirchhoff', 'Kirchhoff rules'],
  // Magnetic internals
  ['charged-particle-b', 'velocity-selector', 'Lorentz force'],
  ['wire-in-b', 'torque-on-loop', 'force on loop'],
  ['torque-on-loop', 'hall-effect', 'Hall effect'],
  // Biot-Savart internals
  ['wire-biot-savart', 'finite-wire-biot', 'finite version'],
  ['wire-biot-savart', 'loop-biot-savart', 'loop geometry'],
  ['wire-biot-savart', 'wire-ampere', 'Ampère method'],
  ['solenoid-b', 'solenoid-ampere', 'Ampère method'],
  ['toroid-b', 'toroid-ampere', 'Ampère method'],
  // Biot-Savart → Faraday
  ['loop-biot-savart', 'magnetic-flux', 'flux of B'],
  // Faraday internals
  ['magnetic-flux', 'changing-b-emf', "Faraday's law"],
  ['changing-b-emf', 'moving-loop-emf', 'motional emf'],
  ['changing-b-emf', 'generator', 'rotating loop'],
  ['changing-b-emf', 'lr-circuit', 'inductor'],
  // Circuits → AC
  ['simple-circuit', 'ac-resistor', 'AC version'],
  ['rc-circuit', 'ac-capacitor', 'AC version'],
  ['lr-circuit', 'ac-inductor', 'AC version'],
  // AC internals
  ['ac-resistor', 'rlc-circuit', 'combine'],
  ['ac-capacitor', 'rlc-circuit', 'combine'],
  ['ac-inductor', 'rlc-circuit', 'combine'],
  ['displacement-current', 'em-wave', "Maxwell's addition"],
  ['em-wave', 'poynting-vector', 'energy flow'],
];

function buildSceneLookup() {
  const map = {};
  const t = i18n.t;
  for (const cat of categories) {
    for (const s of cat.scenes) {
      map[s.id] = { title: t(`scene.${s.id}.title`) || s.title, catId: cat.id };
    }
  }
  return map;
}

function computeLayout(sceneLookup) {
  const catOrder = categories.map(c => c.id);
  const catScenes = {};
  for (const cat of categories) {
    catScenes[cat.id] = cat.scenes.map(s => s.id);
  }

  const colWidth = 160;
  const rowHeight = 52;
  const topPad = 60;
  const leftPad = 80;

  const positions = {};
  for (let ci = 0; ci < catOrder.length; ci++) {
    const catId = catOrder[ci];
    const scenes = catScenes[catId];
    const x = leftPad + ci * colWidth;
    for (let si = 0; si < scenes.length; si++) {
      positions[scenes[si]] = { x, y: topPad + si * rowHeight };
    }
  }
  return positions;
}

export function renderConceptMap(container, onNavigate) {
  const sceneLookup = buildSceneLookup();
  const positions = computeLayout(sceneLookup);

  const allX = Object.values(positions).map(p => p.x);
  const allY = Object.values(positions).map(p => p.y);
  const svgW = Math.max(...allX) + 160;
  const svgH = Math.max(...allY) + 80;

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.style.cursor = 'grab';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `<marker id="cm-arrow" viewBox="0 0 10 6" refX="10" refY="3"
    markerWidth="8" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,3 L0,6" fill="#555" />
  </marker>`;
  svg.appendChild(defs);

  const t = i18n.t;
  // Category column headers
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const x = 80 + ci * 160;
    const catTitle = t(`cat.${cat.id}`) || cat.title;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', 28);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', CATEGORY_COLORS[cat.id] || '#888');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '700');
    text.textContent = catTitle.length > 18 ? catTitle.slice(0, 16) + '…' : catTitle;
    svg.appendChild(text);
  }

  // Edges
  for (const [fromId, toId, label] of EDGES) {
    const pFrom = positions[fromId];
    const pTo = positions[toId];
    if (!pFrom || !pTo) continue;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', pFrom.x);
    line.setAttribute('y1', pFrom.y);
    line.setAttribute('x2', pTo.x);
    line.setAttribute('y2', pTo.y);
    line.setAttribute('stroke', '#333');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('marker-end', 'url(#cm-arrow)');
    svg.appendChild(line);

    if (label) {
      const mx = (pFrom.x + pTo.x) / 2;
      const my = (pFrom.y + pTo.y) / 2;
      const edgeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      edgeLabel.setAttribute('x', mx);
      edgeLabel.setAttribute('y', my - 4);
      edgeLabel.setAttribute('text-anchor', 'middle');
      edgeLabel.setAttribute('fill', '#555');
      edgeLabel.setAttribute('font-size', '8');
      const key = EDGE_LABEL_KEYS[label];
      edgeLabel.textContent = key ? t(key) : label;
      svg.appendChild(edgeLabel);
    }
  }

  // Nodes
  for (const [id, pos] of Object.entries(positions)) {
    const info = sceneLookup[id];
    if (!info) continue;
    const color = CATEGORY_COLORS[info.catId] || '#888';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => onNavigate(id));

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#111');
    circle.setAttribute('stroke-width', '1.5');
    g.appendChild(circle);

    const shortTitle = info.title.replace(/^\d+\.\d+\s*/, '');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos.x + 12);
    text.setAttribute('y', pos.y + 4);
    text.setAttribute('fill', '#ccc');
    text.setAttribute('font-size', '9');
    text.textContent = shortTitle.length > 20 ? shortTitle.slice(0, 18) + '…' : shortTitle;
    g.appendChild(text);

    g.addEventListener('mouseenter', () => {
      circle.setAttribute('r', '11');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2.5');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-weight', '700');
    });
    g.addEventListener('mouseleave', () => {
      circle.setAttribute('r', '8');
      circle.setAttribute('stroke', '#111');
      circle.setAttribute('stroke-width', '1.5');
      text.setAttribute('fill', '#ccc');
      text.setAttribute('font-weight', 'normal');
    });

    svg.appendChild(g);
  }

  // Pan support
  let isPanning = false;
  let startX, startY, viewBox;

  function getViewBox() {
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    return { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
  }

  const onMousedown = (e) => {
    if (e.target.closest('g')) return;
    isPanning = true;
    svg.style.cursor = 'grabbing';
    startX = e.clientX;
    startY = e.clientY;
    viewBox = getViewBox();
  };
  const onMousemove = (e) => {
    if (!isPanning) return;
    const dx = (e.clientX - startX) * (viewBox.w / container.clientWidth);
    const dy = (e.clientY - startY) * (viewBox.h / container.clientHeight);
    svg.setAttribute('viewBox', `${viewBox.x - dx} ${viewBox.y - dy} ${viewBox.w} ${viewBox.h}`);
  };
  const onMouseup = () => {
    isPanning = false;
    svg.style.cursor = 'grab';
  };
  const onWheel = (e) => {
    e.preventDefault();
    const vb = getViewBox();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const newW = vb.w * scale;
    const newH = vb.h * scale;
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    svg.setAttribute('viewBox', `${cx - newW / 2} ${cy - newH / 2} ${newW} ${newH}`);
  };

  svg.addEventListener('mousedown', onMousedown);
  window.addEventListener('mousemove', onMousemove);
  window.addEventListener('mouseup', onMouseup);
  svg.addEventListener('wheel', onWheel, { passive: false });

  container.appendChild(svg);

  return function cleanup() {
    svg.removeEventListener('mousedown', onMousedown);
    window.removeEventListener('mousemove', onMousemove);
    window.removeEventListener('mouseup', onMouseup);
    svg.removeEventListener('wheel', onWheel);
  };
}
