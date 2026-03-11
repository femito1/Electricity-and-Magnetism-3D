import * as THREE from 'three';
import {
  createRod,
  createRing,
  createDisk,
  createSphere,
  createPlane,
  createArrowField,
  createFieldLines,
  highlightSegment,
  highlightArc,
  startPointsOnSphere,
  lineChargeFieldRadial,
  ringFieldOnAxis,
  diskField,
  shellField,
  solidSphereField
} from '../fieldViz.js';

const finiteRodOnAxis = {
  id: 'finite-rod-on-axis',
  title: '2.1 Finite Rod (On-Axis)',
  description: 'A finite uniformly charged rod and a test point on its axis. The field comes from integrating dE contributions from dq = lambda dx.',
  equations: [
    { label: 'Element', latex: 'dE = \\frac{k\\lambda\\,dx}{r^2}',
      derivation: [
        { step: 'Element $dx$ at position $x$ along rod', latex: 'dE = \\frac{k\\lambda\\,dx}{(d - x)^2}' },
        { step: 'Integrate over rod length', latex: 'E = \\int_{-L/2}^{L/2} \\frac{k\\lambda\\,dx}{(d - x)^2}' },
        { step: 'Substitute $u = d - x$, $du = -dx$', latex: 'E = k\\lambda \\left[\\frac{1}{d - x}\\right]_{-L/2}^{L/2}' },
        { step: 'Evaluate limits', latex: 'E = k\\lambda \\left(\\frac{1}{d - L/2} - \\frac{1}{d + L/2}\\right)' },
        { step: 'Final result', latex: 'E = \\frac{k\\lambda L}{d^2 - (L/2)^2}' }
      ] }
  ],
  sliders: [
    { id: 'L', label: 'Rod length L', min: 1, max: 6, default: 4, step: 0.5, unit: 'm' },
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 1.5, step: 0.25, unit: 'μC/m' },
    { id: 'd', label: 'Distance d', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { L, lambda, d } = ctx.params;
    createRod(ctx, { length: L, axis: 'x', color: 0xff5566 });
    highlightSegment(ctx, {
      start: new THREE.Vector3(-0.2, 0, 0),
      end: new THREE.Vector3(0.2, 0, 0),
      color: 0xffff00
    });
    ctx.addLabel(new THREE.Vector3(0, 0.35, 0), 'dx');
    const p = new THREE.Vector3(L / 2 + d, 0, 0);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshPhongMaterial({ color: 0xffffff }));
    m.position.copy(p);
    ctx.addMesh(m);
    const mag = Math.max(0.05, lambda * L / (d * (L + d)));
    ctx.addMesh(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), p, Math.min(mag, 2), 0x44ddff, 0.18, 0.1));
    ctx.addLabel(p.clone().add(new THREE.Vector3(0.4, 0.25, 0)), 'E');
    return {};
  }
};

const finiteRodPerp = {
  id: 'finite-rod-perp',
  title: '2.2 Finite Rod (Perpendicular)',
  description: 'Test point above the rod center. Horizontal components cancel by symmetry; vertical components add.',
  equations: [
    { label: 'Component integral', latex: 'E_y = 2k\\lambda\\int_0^{L/2}\\frac{h\\,dx}{(x^2+h^2)^{3/2}}',
      derivation: [
        { step: 'Element $dx$ at position $x$; distance $r = \\sqrt{x^2 + h^2}$', latex: 'dE = \\frac{k\\lambda\\,dx}{x^2 + h^2}' },
        { step: 'By symmetry, $x$-components cancel; keep $y$-component', latex: 'dE_y = \\frac{k\\lambda h\\,dx}{(x^2 + h^2)^{3/2}}' },
        { step: 'Integrate using symmetry', latex: 'E_y = 2k\\lambda \\int_0^{L/2} \\frac{h\\,dx}{(x^2 + h^2)^{3/2}}' },
        { step: 'Evaluate integral', latex: 'E_y = 2k\\lambda \\cdot \\frac{x}{h\\sqrt{x^2+h^2}}\\bigg|_0^{L/2}' },
        { step: 'Final result', latex: 'E_y = \\frac{k\\lambda L}{h\\sqrt{h^2 + (L/2)^2}}' }
      ] },
    { label: 'Closed form', latex: 'E_y = \\frac{k\\lambda L}{h\\sqrt{h^2+(L/2)^2}}' }
  ],
  sliders: [
    { id: 'L', label: 'Rod length L', min: 1, max: 6, default: 4, step: 0.5, unit: 'm' },
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 1.5, step: 0.25, unit: 'μC/m' },
    { id: 'h', label: 'Height h', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { L, h, lambda } = ctx.params;
    createRod(ctx, { length: L, axis: 'x', color: 0xff5566 });
    const p = new THREE.Vector3(0, h, 0);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshPhongMaterial({ color: 0xffffff }));
    m.position.copy(p);
    ctx.addMesh(m);

    const halfL = L / 2;
    const x0 = halfL * 0.5;
    const srcL = new THREE.Vector3(-x0, 0, 0);
    const srcR = new THREE.Vector3(x0, 0, 0);
    highlightSegment(ctx, { start: srcL.clone().add(new THREE.Vector3(-0.12, 0, 0)), end: srcL.clone().add(new THREE.Vector3(0.12, 0, 0)), color: 0xffff00 });
    highlightSegment(ctx, { start: srcR.clone().add(new THREE.Vector3(-0.12, 0, 0)), end: srcR.clone().add(new THREE.Vector3(0.12, 0, 0)), color: 0xffff00 });
    ctx.addLabel(srcL.clone().add(new THREE.Vector3(0, -0.35, 0)), 'dx');
    ctx.addLabel(srcR.clone().add(new THREE.Vector3(0, -0.35, 0)), 'dx');

    const rL = p.clone().sub(srcL);
    const rR = p.clone().sub(srcR);
    const dEL = rL.clone().normalize().multiplyScalar(lambda / Math.max(rL.lengthSq(), 0.2));
    const dER = rR.clone().normalize().multiplyScalar(lambda / Math.max(rR.lengthSq(), 0.2));
    const dScale = 0.9;
    ctx.addMesh(new THREE.ArrowHelper(dEL.clone().normalize(), p, Math.min(dEL.length() * dScale, 1.2), 0xffff00, 0.12, 0.06));
    ctx.addMesh(new THREE.ArrowHelper(dER.clone().normalize(), p, Math.min(dER.length() * dScale, 1.2), 0xffff00, 0.12, 0.06));

    const Ey = (lambda * L) / (h * Math.sqrt(h * h + halfL * halfL));
    const len = Math.min(0.35 + Ey * 0.5, 2.5);
    ctx.addMesh(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), p, len, 0x44ddff, 0.15, 0.08));
    ctx.addLabel(p.clone().add(new THREE.Vector3(0.45, 0.25, 0)), `E_y\\propto${Ey.toFixed(2)}`);
    return {};
  }
};

const infiniteLine = {
  id: 'infinite-line',
  title: '2.3 Infinite Line Charge',
  description: 'An infinite line charge creates radial field E proportional to 1/r.',
  equations: [
    { label: 'Field', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}',
      derivation: [
        { step: 'Start from finite rod perpendicular bisector result', latex: 'E = \\frac{k\\lambda L}{h\\sqrt{h^2 + (L/2)^2}}' },
        { step: 'Take limit $L \\to \\infty$; for large $L$, $\\sqrt{h^2 + L^2/4} \\approx L/2$', latex: 'E \\approx \\frac{k\\lambda L}{h \\cdot L/2} = \\frac{2k\\lambda}{h}' },
        { step: 'Final result', latex: 'E = \\frac{2k\\lambda}{r} = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}' }
      ] }
  ],
  sliders: [
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m' }
  ],
  toggles: [
    { id: 'vectors', label: 'Field vectors', default: true },
    { id: 'lines', label: 'Field lines', default: true }
  ],
  setup(ctx) {
    const { lambda } = ctx.params;
    createRod(ctx, { length: 12, axis: 'y', radius: 0.06, color: 0xff5566 });
    const fieldFn = lineChargeFieldRadial(lambda);
    if (ctx.toggles.vectors) {
      createArrowField(ctx, fieldFn, {
        bounds: [[-4, 4], [-2, 2], [-4, 4]],
        step: 1.6, scale: 0.25, maxMag: 10, opacity: 0.7
      });
    }
    if (ctx.toggles.lines) {
      const starts = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        starts.push(new THREE.Vector3(0.25 * Math.cos(a), 0, 0.25 * Math.sin(a)));
      }
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.4, bounds: 6 });
    }
    return {};
  }
};

const chargedRing = {
  id: 'charged-ring',
  title: '2.4 Charged Ring (Axial Field)',
  description: 'A uniformly charged ring. On-axis field is along ring normal.',
  equations: [
    { label: 'Axial field', latex: 'E_y = \\frac{kQy}{(R^2+y^2)^{3/2}}',
      derivation: [
        { step: 'Element $dl$ on ring at distance $\\sqrt{R^2 + y^2}$ from point', latex: 'dE = \\frac{k\\lambda\\,dl}{R^2 + y^2}' },
        { step: 'By symmetry, radial components cancel; keep axial component', latex: 'dE_y = \\frac{k\\lambda y\\,dl}{(R^2 + y^2)^{3/2}}' },
        { step: 'Integrate around ring: $\\int dl = 2\\pi R$, with $Q = \\lambda \\cdot 2\\pi R$', latex: 'E_y = \\frac{k\\lambda y}{(R^2+y^2)^{3/2}} \\cdot 2\\pi R' },
        { step: 'Final result', latex: 'E_y = \\frac{kQy}{(R^2 + y^2)^{3/2}}' }
      ] }
  ],
  sliders: [
    { id: 'R', label: 'Ring radius R', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' },
    { id: 'Q', label: 'Charge Q', min: 0.5, max: 10, default: 4, step: 0.5, unit: 'μC' },
    { id: 'y', label: 'Axis y', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { R, Q, y } = ctx.params;
    createRing(ctx, { radius: R, color: 0xff5566 });
    highlightArc(ctx, { radius: R + 0.02, startAngle: 0.5, arcLength: 0.25, color: 0xffff00 });
    ctx.addLabel(new THREE.Vector3(R * 0.75, 0.3, R * 0.4), 'd\\theta');
    const p = new THREE.Vector3(0, y, 0);
    const E = ringFieldOnAxis(R, Q)(p);
    ctx.addMesh(new THREE.ArrowHelper(E.clone().normalize(), p, Math.min(E.length() * 3, 2), 0x44ddff, 0.16, 0.09));
    return {};
  }
};

const chargedDisk = {
  id: 'charged-disk',
  title: '2.5 Charged Disk (Axial Field)',
  description: 'A charged disk built from ring contributions. Shows dr element and net axis field.',
  equations: [
    { label: 'Axis field', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}\\left(1-\\frac{y}{\\sqrt{y^2+R^2}}\\right)',
      derivation: [
        { step: 'Disk as concentric rings of radius $s$, width $ds$', latex: 'dq = \\sigma \\cdot 2\\pi s\\,ds' },
        { step: 'Apply ring result for each element', latex: 'dE = \\frac{\\sigma y\\,s\\,ds}{2\\varepsilon_0(s^2 + y^2)^{3/2}}' },
        { step: 'Integrate from $0$ to $R$', latex: 'E = \\frac{\\sigma y}{2\\varepsilon_0}\\int_0^R \\frac{s\\,ds}{(s^2+y^2)^{3/2}}' },
        { step: 'Evaluate with substitution $u = s^2 + y^2$', latex: 'E = \\frac{\\sigma y}{2\\varepsilon_0}\\left[-\\frac{1}{\\sqrt{s^2+y^2}}\\right]_0^R' },
        { step: 'Final result', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}\\left(1 - \\frac{y}{\\sqrt{R^2 + y^2}}\\right)' }
      ] }
  ],
  sliders: [
    { id: 'R', label: 'Disk radius R', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' },
    { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m²' },
    { id: 'y', label: 'Axis y', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { R, sigma, y } = ctx.params;
    createDisk(ctx, { radius: R, color: 0xff5566, opacity: 0.35 });
    const r0 = R * 0.55;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r0 - 0.08, r0 + 0.08, 40),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    ctx.addMesh(ring);
    ctx.addLabel(new THREE.Vector3(r0 + 0.3, 0.28, 0), 'dr');
    ctx.addLabel(new THREE.Vector3(r0 * 0.5, 0.28, 0), 'r');
    ctx.addLabel(new THREE.Vector3(r0 + 0.75, -0.32, 0), 'dA=2\\pi r\\,dr');
    ctx.addLabel(new THREE.Vector3(-r0 - 0.85, -0.32, 0), 'dq=\\sigma\\,dA');
    const p = new THREE.Vector3(0, y, 0);
    const E = diskField(R, sigma)(p);
    const eLen = Math.min(E.length() * 3, 2.2);
    ctx.addMesh(new THREE.ArrowHelper(E.clone().normalize(), p, eLen, 0x44ddff, 0.16, 0.09));
    const ringPoint = new THREE.Vector3(r0, 0, 0);
    const dEdir = p.clone().sub(ringPoint).normalize();
    ctx.addMesh(new THREE.ArrowHelper(dEdir, ringPoint, 0.8, 0xffff00, 0.12, 0.06));
    ctx.addLabel(ringPoint.clone().add(new THREE.Vector3(0.35, 0.45, 0)), 'd\\vec{E}');
    ctx.addLabel(p.clone().add(new THREE.Vector3(0.35, eLen + 0.2, 0)), '\\vec{E}_{net}');
    return {};
  }
};

const infinitePlane = {
  id: 'infinite-plane',
  title: '2.6 Infinite Plane',
  description: 'A uniformly charged infinite plane produces nearly uniform field on both sides.',
  equations: [
    { label: 'Field', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}',
      derivation: [
        { step: 'Start from finite disk result', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}\\left(1 - \\frac{y}{\\sqrt{R^2 + y^2}}\\right)' },
        { step: 'Take limit $R \\to \\infty$', latex: '\\lim_{R\\to\\infty} \\frac{y}{\\sqrt{R^2 + y^2}} = 0' },
        { step: 'Result: uniform field independent of distance', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}' }
      ] }
  ],
  sliders: [
    { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m²' }
  ],
  toggles: [],
  setup(ctx) {
    const { sigma } = ctx.params;
    createPlane(ctx, { width: 12, height: 12, color: 0xff5566, opacity: 0.24 });
    const len = Math.min(2.2, 0.5 + sigma * 0.25);
    const g = new THREE.Group();
    for (let x = -3; x <= 3; x += 1.5) {
      for (let z = -3; z <= 3; z += 1.5) {
        g.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, 0.1, z), len, 0x44ddff, 0.14, 0.08));
        g.add(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(x, -0.1, z), len, 0x44ddff, 0.14, 0.08));
      }
    }
    ctx.addMesh(g);
    return {};
  }
};

const chargedArc = {
  id: 'charged-arc',
  title: '2.7 Charged Arc',
  description: 'Arc charge with an element dtheta and resulting net field at center.',
  equations: [
    { label: 'Net field', latex: 'E = \\frac{2k\\lambda}{R}\\sin\\left(\\frac{\\alpha}{2}\\right)',
      derivation: [
        { step: 'Element $dl = R\\,d\\theta$ at angle $\\theta$', latex: 'dE = \\frac{k\\lambda R\\,d\\theta}{R^2} = \\frac{k\\lambda\\,d\\theta}{R}' },
        { step: 'By symmetry, components perpendicular to bisector cancel', latex: 'dE_{\\parallel} = \\frac{k\\lambda}{R}\\cos\\theta\\,d\\theta' },
        { step: 'Integrate from $-\\alpha/2$ to $\\alpha/2$', latex: 'E = \\frac{k\\lambda}{R}\\int_{-\\alpha/2}^{\\alpha/2}\\cos\\theta\\,d\\theta' },
        { step: 'Evaluate integral', latex: 'E = \\frac{k\\lambda}{R}\\Big[\\sin\\theta\\Big]_{-\\alpha/2}^{\\alpha/2}' },
        { step: 'Final result', latex: 'E = \\frac{2k\\lambda}{R}\\sin\\!\\left(\\frac{\\alpha}{2}\\right)' }
      ] }
  ],
  sliders: [
    { id: 'alpha', label: 'Arc angle α', min: 0.5, max: 6.2, default: 3.14, step: 0.1, unit: 'rad' },
    { id: 'R', label: 'Radius R', min: 1, max: 4, default: 2, step: 0.25, unit: 'm' },
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m' }
  ],
  toggles: [],
  setup(ctx) {
    const { alpha, R, lambda } = ctx.params;
    const pts = [];
    const start = -alpha / 2;
    for (let i = 0; i <= 64; i++) {
      const a = start + (i / 64) * alpha;
      pts.push(new THREE.Vector3(R * Math.cos(a), 0, R * Math.sin(a)));
    }
    ctx.addMesh(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff5566 })));
    highlightArc(ctx, { radius: R + 0.03, startAngle: 0.25, arcLength: 0.25, color: 0xffff00 });
    const mag = Math.max(0.05, (2 * lambda / R) * Math.sin(alpha / 2));
    ctx.addMesh(new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 0), Math.min(mag, 2.2), 0x44ddff, 0.16, 0.09));
    return {};
  }
};

const chargedShell = {
  id: 'charged-shell-integration',
  title: '2.8 Charged Spherical Shell',
  description: 'A thin spherical shell: field is zero inside and point-charge-like outside.',
  equations: [
    { label: 'Outside/Inside', latex: 'E_{out}=\\frac{kQ}{r^2},\\;E_{in}=0',
      derivation: [
        { step: 'Apply Gauss law with spherical Gaussian surface', latex: '\\oint \\vec{E}\\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}' },
        { step: 'For $r > R$: entire charge enclosed', latex: 'E(4\\pi r^2) = \\frac{Q}{\\varepsilon_0}' },
        { step: 'Solve for $E$ outside', latex: 'E = \\frac{Q}{4\\pi\\varepsilon_0 r^2} = \\frac{kQ}{r^2}' },
        { step: 'For $r < R$: no enclosed charge', latex: 'Q_{\\text{enc}} = 0 \\implies E = 0' }
      ] }
  ],
  sliders: [
    { id: 'R', label: 'Radius R', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' },
    { id: 'Q', label: 'Charge Q', min: 1, max: 10, default: 5, step: 0.5, unit: 'μC' }
  ],
  toggles: [],
  setup(ctx) {
    const { R, Q } = ctx.params;
    createSphere(ctx, { radius: R, color: 0xff5566, opacity: 0.2 });
    const fieldFn = shellField(R, Q);
    const pts = startPointsOnSphere(new THREE.Vector3(), R + 0.2, 16);
    const g = new THREE.Group();
    for (const p of pts) {
      const E = fieldFn(p);
      if (E.length() < 0.01) continue;
      g.add(new THREE.ArrowHelper(E.clone().normalize(), p, Math.min(E.length() * 0.4, 1.3), 0x44ddff, 0.1, 0.06));
    }
    ctx.addMesh(g);
    return {};
  }
};

const solidSphere = {
  id: 'solid-sphere-charge',
  title: '2.9 Solid Sphere (Volume Charge)',
  description: 'Uniform volume charge: inside E rises with r, outside E falls as 1/r^2.',
  equations: [
    { label: 'Inside', latex: 'E(r<R)\\propto r',
      derivation: [
        { step: 'Apply Gauss law with spherical symmetry', latex: '\\oint \\vec{E}\\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}' },
        { step: 'For $r < R$: enclosed charge from volume', latex: 'Q_{\\text{enc}} = \\rho \\cdot \\tfrac{4}{3}\\pi r^3' },
        { step: 'Gauss law gives', latex: 'E(4\\pi r^2) = \\frac{\\rho \\cdot \\frac{4}{3}\\pi r^3}{\\varepsilon_0}' },
        { step: 'Solve: $E$ grows linearly with $r$', latex: 'E = \\frac{\\rho\\, r}{3\\varepsilon_0}' }
      ] },
    { label: 'Outside', latex: 'E(r>R)\\propto 1/r^2',
      derivation: [
        { step: 'For $r > R$: all charge enclosed', latex: 'Q_{\\text{total}} = \\rho \\cdot \\tfrac{4}{3}\\pi R^3' },
        { step: 'Apply Gauss law', latex: 'E(4\\pi r^2) = \\frac{Q_{\\text{total}}}{\\varepsilon_0}' },
        { step: 'Solve: same as point charge', latex: 'E = \\frac{kQ_{\\text{total}}}{r^2}' }
      ] }
  ],
  sliders: [
    { id: 'R', label: 'Sphere radius R', min: 1, max: 4, default: 2, step: 0.25, unit: 'm' },
    { id: 'rho', label: 'ρ', min: 0.5, max: 5, default: 1, step: 0.5, unit: 'μC/m³' }
  ],
  toggles: [
    { id: 'fieldVectors', label: 'Field Vectors (Outside)', default: true },
    { id: 'showInside', label: 'Field Vectors (Inside)', default: false }
  ],
  setup(ctx) {
    const { R, rho } = ctx.params;
    const fieldFn = solidSphereField(R, rho);
    createSphere(ctx, { radius: R, color: 0xff5566, opacity: 0.12 });
    if (ctx.toggles.fieldVectors) {
      createArrowField(ctx, fieldFn, {
        bounds: [[-R - 2, R + 2], [0, 0], [-R - 2, R + 2]],
        step: 1.2, scale: 0.15, maxLength: 1.5, maxMag: 8, opacity: 0.85, flat: true
      });
    }
    if (ctx.toggles.showInside) {
      const g = new THREE.Group();
      for (const frac of [0.25, 0.6]) {
        const pts = startPointsOnSphere(new THREE.Vector3(), R * frac, 12);
        for (const p of pts) {
          const E = fieldFn(p);
          if (E.length() < 0.005) continue;
          const len = Math.min(E.length() * 0.6, 0.8);
          g.add(new THREE.ArrowHelper(E.clone().normalize(), p, len, 0xff8844, len * 0.3, len * 0.15));
        }
      }
      ctx.addMesh(g);
    }
    return {};
  }
};

export default [
  finiteRodOnAxis,
  finiteRodPerp,
  infiniteLine,
  chargedRing,
  chargedDisk,
  infinitePlane,
  chargedArc,
  chargedShell,
  solidSphere
];
