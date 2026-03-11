import * as THREE from 'three';
import {
  coulombField, uniformField, lineChargeFieldRadial, solidSphereField, shellField, cylinderField,
  createChargeSphere, createArrowField, createFieldLines, createGaussianSurface, createFluxArrows,
  createRod, createSphere, createPlane, createCylinderShell, startPointsOnSphere, magnitudeToColor
} from '../fieldViz.js';

// ── 3.1 Flux Concept ────────────────────────────────────────────────────────

const fluxConcept = {
  id: 'flux-concept',
  title: '3.1 Electric Flux Concept',
  description:
    'A uniform electric field passes through a tilted planar surface. ' +
    'Electric flux Φ depends on the angle θ between the field and the surface normal.',
  equations: [
    {
      label: 'Electric Flux',
      latex: '\\Phi_E = \\oint \\vec{E}\\cdot d\\vec{A} = EA\\cos\\theta',
      derivation: [
        { step: 'Define flux as surface integral', latex: '\\Phi_E = \\oint \\vec{E} \\cdot d\\vec{A}' },
        { step: 'For uniform $\\vec{E}$ and flat surface', latex: '\\Phi_E = E A \\cos\\theta' },
        { step: '$\\theta$ is angle between $\\vec{E}$ and surface normal', latex: '\\theta = \\angle(\\vec{E},\\, \\hat{n})' },
        { step: 'Equivalently, using projected area', latex: '\\Phi_E = E A_{\\perp},\\quad A_{\\perp} = A\\cos\\theta' }
      ]
    }
  ],
  sliders: [
    { id: 'fieldMag', label: 'E magnitude', min: 0.5, max: 5, default: 2, step: 0.1, unit: 'N/C' },
    { id: 'tiltAngle', label: 'Tilt angle θ', min: 0, max: 90, default: 30, step: 1, unit: '°' }
  ],
  toggles: [],
  setup(ctx) {
    const { params, THREE: T } = ctx;
    const E = params.fieldMag;
    const theta = (params.tiltAngle * Math.PI) / 180;
    const area = 3 * 3;
    const flux = E * area * Math.cos(theta);
    const fieldDir = new THREE.Vector3(0, 1, 0);
    const fieldFn = uniformField(fieldDir, E);

    createArrowField(ctx, fieldFn, {
      bounds: [[-3, 3], [-3, 3], [-3, 3]], step: 1.5, scale: 0.35, maxMag: 6
    });

    const surfGeo = new THREE.PlaneGeometry(3, 3);
    const surfMat = new THREE.MeshPhongMaterial({
      color: 0x8888ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide
    });
    const surfMesh = new THREE.Mesh(surfGeo, surfMat);
    surfMesh.rotation.x = -Math.PI / 2 + theta;
    ctx.addMesh(surfMesh);

    const normal = new THREE.Vector3(0, Math.cos(theta), -Math.sin(theta)).normalize();
    const arrowN = new THREE.ArrowHelper(normal, new THREE.Vector3(0, 0, 0), 1.5, 0xffff44, 0.2, 0.1);
    ctx.addMesh(arrowN);

    ctx.addLabel(normal.clone().multiplyScalar(1.7), 'd\\vec{A}');
    ctx.addLabel(new THREE.Vector3(0.6, 2.5, 0), '\\vec{E}');
    ctx.addLabel(new THREE.Vector3(-2.8, 2.5, 0), `\\Phi_E=${flux.toFixed(2)}`);

    if (params.tiltAngle > 5) {
      const arcPts = [];
      const arcSegs = 20;
      for (let i = 0; i <= arcSegs; i++) {
        const a = (i / arcSegs) * theta;
        arcPts.push(new THREE.Vector3(0, Math.cos(a) * 0.7, -Math.sin(a) * 0.7));
      }
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const arcMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
      ctx.addMesh(new THREE.Line(arcGeo, arcMat));
      const mid = theta / 2;
      ctx.addLabel(new THREE.Vector3(0, Math.cos(mid) * 0.95, -Math.sin(mid) * 0.95), '\\theta');
    }

    return {};
  }
};

// ── 3.2 Point Charge + Gaussian Sphere ──────────────────────────────────────

const pointChargeGauss = {
  id: 'point-charge-gauss',
  title: "3.2 Gauss's Law: Point Charge",
  description:
    "A spherical Gaussian surface encloses a point charge. The total flux through " +
    "the surface equals q/ε₀ regardless of the surface's radius.",
  equations: [
    {
      label: 'Gauss\'s Law',
      latex: '\\Phi_E = \\frac{q}{\\varepsilon_0}',
      derivation: [
        { step: 'Place Gaussian sphere of radius $r$ around charge $q$', latex: '\\text{Gaussian sphere: radius } r' },
        { step: '$\\vec{E}$ is radial and constant on sphere', latex: 'E = \\frac{kq}{r^2} \\text{ everywhere on surface}' },
        { step: 'Evaluate surface integral', latex: '\\oint \\vec{E} \\cdot d\\vec{A} = E \\cdot 4\\pi r^2' },
        { step: 'Substitute Coulomb expression for $E$', latex: '\\frac{q}{4\\pi\\varepsilon_0 r^2} \\cdot 4\\pi r^2 = \\frac{q}{\\varepsilon_0}' },
        { step: 'Gauss\'s law confirmed', latex: '\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{enc}}{\\varepsilon_0}' }
      ]
    },
    { label: 'E field', latex: 'E = \\frac{q}{4\\pi\\varepsilon_0 r^2}' }
  ],
  sliders: [
    { id: 'charge', label: 'Charge q', min: 0.5, max: 10, default: 3, step: 0.5, unit: 'μC' },
    { id: 'gaussR', label: 'Gaussian radius', min: 1, max: 5, default: 2.5, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const q = params.charge;
    const R = params.gaussR;
    const origin = new THREE.Vector3();

    createChargeSphere(ctx, origin, q, 0.25);
    ctx.addLabel(new THREE.Vector3(0.35, 0.35, 0), 'q');

    createGaussianSurface(ctx, 'sphere', { radius: R });

    const fieldFn = coulombField([{ pos: origin, q }]);
    createFluxArrows(ctx, fieldFn, 'sphere', { radius: R, count: 10, arrowScale: 0.4 });

    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'r');
    ctx.addLabel(new THREE.Vector3(R * 0.7, R * 0.7, 0), 'd\\vec{A}');

    return {};
  }
};

// ── 3.3 Line Charge + Cylindrical Gaussian Surface ──────────────────────────

const lineChargeGauss = {
  id: 'line-charge-gauss',
  title: "3.3 Gauss's Law: Line Charge",
  description:
    'An infinite line charge with linear charge density λ is enclosed by a cylindrical ' +
    'Gaussian surface. Flux exits through the barrel; the cap flux is zero.',
  equations: [
    {
      label: 'Flux',
      latex: '\\Phi = E \\cdot 2\\pi r L = \\frac{\\lambda L}{\\varepsilon_0}',
      derivation: [
        { step: 'Cylindrical Gaussian surface of radius $r$, height $h$', latex: '\\text{Cylinder: radius } r, \\text{ height } h' },
        { step: 'By symmetry, $\\vec{E}$ is radial and constant on barrel', latex: '\\vec{E} \\perp \\text{axis},\\; |E| = \\text{const on barrel}' },
        { step: 'Flux through end caps is zero', latex: '\\Phi_{caps} = 0 \\quad (\\vec{E} \\perp d\\vec{A})' },
        { step: 'Barrel flux', latex: '\\Phi_{barrel} = E \\cdot 2\\pi r h' },
        { step: 'Enclosed charge and result', latex: 'Q_{enc} = \\lambda h \\;\\Rightarrow\\; E \\cdot 2\\pi r h = \\frac{\\lambda h}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}' }
      ]
    },
    { label: 'E field', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}' }
  ],
  sliders: [
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m' },
    { id: 'gaussR', label: 'Gaussian radius', min: 0.5, max: 4, default: 1.5, step: 0.1, unit: 'm' },
    { id: 'gaussH', label: 'Gaussian height', min: 2, max: 6, default: 4, step: 0.5, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const lam = params.lambda;
    const R = params.gaussR;
    const H = params.gaussH;

    createRod(ctx, { length: 8, radius: 0.06, axis: 'y', color: 0xff5566 });
    ctx.addLabel(new THREE.Vector3(0.3, 3.5, 0), '\\lambda');

    createGaussianSurface(ctx, 'cylinder', { radius: R, height: H });

    const fieldFn = lineChargeFieldRadial(lam);
    createFluxArrows(ctx, fieldFn, 'cylinder-barrel', { radius: R, height: H, count: 14, arrowScale: 0.35 });

    ctx.addLabel(new THREE.Vector3(R + 0.4, 0, 0), 'r');
    ctx.addLabel(new THREE.Vector3(R * 0.7, 0, R * 0.7), 'd\\vec{A}');

    return {};
  }
};

// ── 3.4 Infinite Plane + Pillbox ────────────────────────────────────────────

const planeGauss = {
  id: 'plane-gauss',
  title: "3.4 Gauss's Law: Infinite Plane",
  description:
    'An infinite charged plane with surface charge density σ, with a pillbox ' +
    'Gaussian surface straddling it. E is uniform and perpendicular to the plane.',
  equations: [
    {
      label: 'Gauss\'s Law',
      latex: '2EA = \\frac{\\sigma A}{\\varepsilon_0}',
      derivation: [
        { step: 'Pillbox Gaussian surface straddling the plane', latex: '\\text{Pillbox: area } A,\\text{ height } \\delta' },
        { step: '$\\vec{E}$ is perpendicular to plane on both sides', latex: '\\vec{E} = \\pm E\\,\\hat{n} \\text{ by symmetry}' },
        { step: 'Flux through curved surface is zero', latex: '\\Phi_{side} = 0 \\quad (\\vec{E} \\perp d\\vec{A})' },
        { step: 'Flux through two end caps', latex: '\\Phi = 2EA' },
        { step: 'Apply Gauss\'s law', latex: '2EA = \\frac{\\sigma A}{\\varepsilon_0} \\;\\Rightarrow\\; E = \\frac{\\sigma}{2\\varepsilon_0}' }
      ]
    },
    { label: 'E field', latex: 'E = \\frac{\\sigma}{2\\varepsilon_0}' }
  ],
  sliders: [
    { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m²' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const sigma = params.sigma;

    createPlane(ctx, { width: 12, height: 12, color: 0xff5566, opacity: 0.3 });
    ctx.addLabel(new THREE.Vector3(-3, 0.2, -3), '\\sigma');

    createGaussianSurface(ctx, 'pillbox', { radius: 1.5, height: 1.2 });

    const Emag = sigma / 2;
    const topY = 0.6;
    const botY = -0.6;
    for (let x = -1; x <= 1; x += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const aTop = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, topY, z),
          Emag * 0.5 + 0.3, 0x44ff88, 0.12, 0.06
        );
        ctx.addMesh(aTop);
        const aBot = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0), new THREE.Vector3(x, botY, z),
          Emag * 0.5 + 0.3, 0x44ff88, 0.12, 0.06
        );
        ctx.addMesh(aBot);
      }
    }

    ctx.addLabel(new THREE.Vector3(1.8, 1.2, 0), 'd\\vec{A}_{top}');
    ctx.addLabel(new THREE.Vector3(1.8, -1.2, 0), 'd\\vec{A}_{bot}');

    return {};
  }
};

// ── 3.5 Solid Sphere ────────────────────────────────────────────────────────

const solidSphereGauss = {
  id: 'solid-sphere-gauss',
  title: "3.5 Gauss's Law: Solid Sphere",
  description:
    'A uniformly charged solid sphere of radius R. The Gaussian surface radius ' +
    'determines whether the enclosed charge is partial (r < R) or total (r > R).',
  equations: [
    {
      label: 'Inside (r < R)',
      latex: 'E = \\frac{\\rho r}{3\\varepsilon_0}',
      derivation: [
        { step: 'Gaussian sphere of radius $r < R$', latex: '\\text{Gaussian sphere: } r < R' },
        { step: 'Enclosed charge from uniform density', latex: 'Q_{enc} = \\rho \\cdot \\tfrac{4}{3}\\pi r^3' },
        { step: 'Apply Gauss\'s law', latex: 'E \\cdot 4\\pi r^2 = \\frac{\\rho \\cdot \\frac{4}{3}\\pi r^3}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{\\rho r}{3\\varepsilon_0}' }
      ]
    },
    {
      label: 'Outside (r > R)',
      latex: 'E = \\frac{Q}{4\\pi\\varepsilon_0 r^2}',
      derivation: [
        { step: 'Gaussian sphere of radius $r > R$', latex: '\\text{Gaussian sphere: } r > R' },
        { step: 'All charge enclosed', latex: 'Q_{enc} = Q_{total}' },
        { step: 'Apply Gauss\'s law', latex: 'E \\cdot 4\\pi r^2 = \\frac{Q}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{Q}{4\\pi\\varepsilon_0 r^2}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Sphere radius R', min: 1, max: 3, default: 2, step: 0.1, unit: 'm' },
    { id: 'rho', label: 'Charge density ρ', min: 0.5, max: 3, default: 1, step: 0.1, unit: 'μC/m³' },
    { id: 'gaussR', label: 'Gaussian radius r', min: 0.5, max: 5, default: 1, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const R = params.R;
    const rho = params.rho;
    const gR = params.gaussR;

    createSphere(ctx, { radius: R, color: 0xff4444, opacity: 0.18 });
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    createGaussianSurface(ctx, 'sphere', { radius: gR });
    ctx.addLabel(new THREE.Vector3(0, gR + 0.3, 0), 'r');

    const fieldFn = solidSphereField(R, rho);
    createFluxArrows(ctx, fieldFn, 'sphere', { radius: gR, count: 10, arrowScale: 0.3 });

    const Qenc = gR <= R
      ? rho * (4 / 3) * Math.PI * gR * gR * gR
      : rho * (4 / 3) * Math.PI * R * R * R;
    ctx.addLabel(new THREE.Vector3(0, -gR - 0.5, 0),
      `Q_{enc} = ${Qenc.toFixed(1)}`);

    return {};
  }
};

// ── 3.6 Spherical Shell ─────────────────────────────────────────────────────

const shellGauss = {
  id: 'shell-gauss',
  title: "3.6 Gauss's Law: Spherical Shell",
  description:
    'A thin charged spherical shell. E = 0 inside (Gaussian surface encloses no charge), ' +
    'E = kQ/r² outside.',
  equations: [
    {
      label: 'Inside (r < R)',
      latex: 'E = 0',
      derivation: [
        { step: 'Gaussian sphere of radius $r < R$', latex: '\\text{Gaussian sphere: } r < R' },
        { step: 'No charge enclosed', latex: 'Q_{enc} = 0' },
        { step: 'Gauss\'s law gives', latex: 'E \\cdot 4\\pi r^2 = 0 \\;\\Rightarrow\\; E = 0' }
      ]
    },
    {
      label: 'Outside (r > R)',
      latex: 'E = \\frac{Q}{4\\pi\\varepsilon_0 r^2}',
      derivation: [
        { step: 'Gaussian sphere of radius $r > R$', latex: '\\text{Gaussian sphere: } r > R' },
        { step: 'Entire shell charge enclosed', latex: 'Q_{enc} = Q' },
        { step: 'Apply Gauss\'s law', latex: 'E \\cdot 4\\pi r^2 = \\frac{Q}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{kQ}{r^2} = \\frac{Q}{4\\pi\\varepsilon_0 r^2}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Shell radius R', min: 1, max: 3, default: 2, step: 0.1, unit: 'm' },
    { id: 'Q', label: 'Total charge Q', min: 1, max: 10, default: 5, step: 0.5, unit: 'μC' },
    { id: 'gaussR', label: 'Gaussian radius r', min: 0.5, max: 5, default: 1, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const R = params.R;
    const Q = params.Q;
    const gR = params.gaussR;

    createSphere(ctx, { radius: R, color: 0xff4444, opacity: 0.2 });
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    createGaussianSurface(ctx, 'sphere', { radius: gR });
    ctx.addLabel(new THREE.Vector3(0, gR + 0.3, 0), 'r');

    const fieldFn = shellField(R, Q);
    createFluxArrows(ctx, fieldFn, 'sphere', { radius: gR, count: 10, arrowScale: 0.35 });

    if (gR < R) {
      ctx.addLabel(new THREE.Vector3(0, 0, 0), 'E = 0');
    }

    return {};
  }
};

// ── 3.7 Concentric Shells ───────────────────────────────────────────────────

const concentricShells = {
  id: 'concentric-shells',
  title: '3.7 Concentric Spherical Shells',
  description:
    'Two concentric charged shells with charges Q₁ and Q₂. Three distinct regions: ' +
    'E = 0 for r < R₁, E from Q₁ for R₁ < r < R₂, E from Q₁+Q₂ for r > R₂.',
  equations: [
    {
      label: 'r < R₁',
      latex: 'E = 0',
      derivation: [
        { step: 'Gaussian sphere with $r < R_1$', latex: 'Q_{enc} = 0' },
        { step: 'No enclosed charge', latex: 'E = 0' }
      ]
    },
    {
      label: 'R₁ < r < R₂',
      latex: 'E = \\frac{Q_1}{4\\pi\\varepsilon_0 r^2}',
      derivation: [
        { step: 'Gaussian sphere encloses inner shell only', latex: 'Q_{enc} = Q_1' },
        { step: 'Apply Gauss\'s law', latex: 'E \\cdot 4\\pi r^2 = \\frac{Q_1}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{kQ_1}{r^2}' }
      ]
    },
    {
      label: 'r > R₂',
      latex: 'E = \\frac{Q_1 + Q_2}{4\\pi\\varepsilon_0 r^2}',
      derivation: [
        { step: 'Gaussian sphere encloses both shells', latex: 'Q_{enc} = Q_1 + Q_2' },
        { step: 'Apply Gauss\'s law', latex: 'E \\cdot 4\\pi r^2 = \\frac{Q_1 + Q_2}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{k(Q_1 + Q_2)}{r^2}' }
      ]
    }
  ],
  sliders: [
    { id: 'R1', label: 'Inner radius R₁', min: 0.8, max: 2, default: 1, step: 0.1, unit: 'm' },
    { id: 'R2', label: 'Outer radius R₂', min: 2, max: 4, default: 3, step: 0.1, unit: 'm' },
    { id: 'Q1', label: 'Inner charge Q₁', min: -5, max: 5, default: 3, step: 0.5, unit: 'μC' },
    { id: 'Q2', label: 'Outer charge Q₂', min: -5, max: 5, default: -2, step: 0.5, unit: 'μC' },
    { id: 'gaussR', label: 'Gaussian radius r', min: 0.3, max: 5, default: 0.5, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const { R1, R2, Q1, Q2, gaussR: gR } = params;

    createSphere(ctx, { radius: R1, color: 0xff6644, opacity: 0.2 });
    createSphere(ctx, { radius: R2, color: 0x4488ff, opacity: 0.15 });
    ctx.addLabel(new THREE.Vector3(R1 + 0.25, 0.25, 0), 'R_1');
    ctx.addLabel(new THREE.Vector3(R2 + 0.25, 0.25, 0), 'R_2');

    createGaussianSurface(ctx, 'sphere', { radius: gR });
    ctx.addLabel(new THREE.Vector3(0, gR + 0.3, 0), 'r');

    let Qenc = 0;
    if (gR >= R1) Qenc += Q1;
    if (gR >= R2) Qenc += Q2;

    const fieldFn = (p) => {
      const r = p.length();
      if (r < 0.05) return new THREE.Vector3();
      const dir = p.clone().normalize();
      let Qe = 0;
      if (r >= R1) Qe += Q1;
      if (r >= R2) Qe += Q2;
      return dir.multiplyScalar(Qe / (r * r));
    };

    createFluxArrows(ctx, fieldFn, 'sphere', { radius: gR, count: 10, arrowScale: 0.35 });

    ctx.addLabel(new THREE.Vector3(0, -gR - 0.5, 0),
      `Q_{enc} = ${Qenc.toFixed(1)}`);

    return {};
  }
};

// ── 3.8 Cylindrical Shell ───────────────────────────────────────────────────

const cylShellGauss = {
  id: 'cyl-shell-gauss',
  title: "3.8 Gauss's Law: Cylindrical Shell",
  description:
    'An infinite cylindrical shell with linear charge density λ. E = 0 inside the shell, ' +
    'E = λ/(2πε₀r) outside — identical to a line charge at the same axis.',
  equations: [
    {
      label: 'Inside (r < R)',
      latex: 'E = 0',
      derivation: [
        { step: 'Cylindrical Gaussian surface inside shell', latex: '\\text{Gaussian cylinder: } r < R' },
        { step: 'No charge enclosed', latex: 'Q_{enc} = 0' },
        { step: 'Gauss\'s law gives', latex: 'E = 0' }
      ]
    },
    {
      label: 'Outside (r > R)',
      latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}',
      derivation: [
        { step: 'Cylindrical Gaussian surface outside shell', latex: '\\text{Gaussian cylinder: } r > R' },
        { step: 'Enclosed charge', latex: 'Q_{enc} = \\lambda h' },
        { step: 'Barrel flux equals enclosed charge / $\\varepsilon_0$', latex: 'E \\cdot 2\\pi r h = \\frac{\\lambda h}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Shell radius R', min: 0.5, max: 3, default: 1.5, step: 0.1, unit: 'm' },
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m' },
    { id: 'gaussR', label: 'Gaussian radius r', min: 0.3, max: 4, default: 2.5, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const { R, lambda: lam, gaussR: gR } = params;

    createCylinderShell(ctx, { radius: R, height: 6, color: 0xff5566, opacity: 0.22 });
    ctx.addLabel(new THREE.Vector3(R + 0.3, 2.5, 0), 'R');

    createGaussianSurface(ctx, 'cylinder', { radius: gR, height: 5 });
    ctx.addLabel(new THREE.Vector3(gR + 0.3, 0, 0), 'r');

    const fieldFn = (p) => {
      const rPerp = new THREE.Vector3(p.x, 0, p.z);
      const dist = rPerp.length();
      if (dist < 0.05) return new THREE.Vector3();
      if (dist < R) return new THREE.Vector3();
      return rPerp.normalize().multiplyScalar(2 * lam / dist);
    };

    createFluxArrows(ctx, fieldFn, 'cylinder-barrel', {
      radius: gR, height: 5, count: 14, arrowScale: 0.35
    });

    if (gR < R) {
      ctx.addLabel(new THREE.Vector3(0, 0, 0), 'E = 0');
    }

    return {};
  }
};

// ── 3.9 Solid Cylinder ──────────────────────────────────────────────────────

const solidCylinderGauss = {
  id: 'solid-cylinder-gauss',
  title: "3.9 Gauss's Law: Solid Cylinder",
  description:
    'A solid infinite cylinder of uniform charge density ρ. E grows linearly with r ' +
    'inside and falls as 1/r outside.',
  equations: [
    {
      label: 'Inside (r < R)',
      latex: 'E = \\frac{\\rho r}{2\\varepsilon_0}',
      derivation: [
        { step: 'Cylindrical Gaussian surface of radius $r < R$, height $h$', latex: '\\text{Gaussian cylinder: } r < R' },
        { step: 'Enclosed charge', latex: 'Q_{enc} = \\rho \\pi r^2 h' },
        { step: 'Apply Gauss\'s law to barrel', latex: 'E \\cdot 2\\pi r h = \\frac{\\rho \\pi r^2 h}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{\\rho r}{2\\varepsilon_0}' }
      ]
    },
    {
      label: 'Outside (r > R)',
      latex: 'E = \\frac{\\rho R^2}{2\\varepsilon_0 r}',
      derivation: [
        { step: 'Cylindrical Gaussian surface of radius $r > R$, height $h$', latex: '\\text{Gaussian cylinder: } r > R' },
        { step: 'Enclosed charge (full cross-section)', latex: 'Q_{enc} = \\rho \\pi R^2 h' },
        { step: 'Apply Gauss\'s law to barrel', latex: 'E \\cdot 2\\pi r h = \\frac{\\rho \\pi R^2 h}{\\varepsilon_0}' },
        { step: 'Solve for $E$', latex: 'E = \\frac{\\rho R^2}{2\\varepsilon_0 r}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Cylinder radius R', min: 0.5, max: 3, default: 1.5, step: 0.1, unit: 'm' },
    { id: 'rho', label: 'Charge density ρ', min: 0.5, max: 3, default: 1, step: 0.1, unit: 'μC/m³' },
    { id: 'gaussR', label: 'Gaussian radius r', min: 0.3, max: 5, default: 1, step: 0.1, unit: 'm' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const { R, rho, gaussR: gR } = params;

    const cylGeo = new THREE.CylinderGeometry(R, R, 6, 32);
    const cylMat = new THREE.MeshPhongMaterial({
      color: 0xff4444, transparent: true, opacity: 0.15, side: THREE.DoubleSide
    });
    ctx.addMesh(new THREE.Mesh(cylGeo, cylMat));
    ctx.addLabel(new THREE.Vector3(R + 0.3, 2.5, 0), 'R');

    createGaussianSurface(ctx, 'cylinder', { radius: gR, height: 5 });
    ctx.addLabel(new THREE.Vector3(gR + 0.3, 0, 0), 'r');

    const fieldFn = cylinderField(R, rho, true);
    createFluxArrows(ctx, fieldFn, 'cylinder-barrel', {
      radius: gR, height: 5, count: 14, arrowScale: 0.3
    });

    return {};
  }
};

// ── 3.10 Conductor in Equilibrium ───────────────────────────────────────────

const conductorEquilibrium = {
  id: 'conductor-equilibrium',
  title: '3.10 Conductor in Electrostatic Equilibrium',
  description:
    'A charged conducting sphere. All charge resides on the surface, E = 0 inside, ' +
    'and E is perpendicular to the surface just outside.',
  equations: [
    {
      label: 'Inside',
      latex: 'E_{inside} = 0',
      derivation: [
        { step: 'Free charges rearrange until equilibrium', latex: 'E_{inside} = 0 \\text{ (electrostatic equilibrium)}' },
        { step: 'Gauss\'s law inside conductor surface', latex: 'Q_{enc,\\,interior} = 0 \\;\\Rightarrow\\; \\text{all charge on surface}' }
      ]
    },
    {
      label: 'Surface',
      latex: 'E = \\frac{\\sigma}{\\varepsilon_0} = \\frac{Q}{4\\pi\\varepsilon_0 R^2}',
      derivation: [
        { step: 'Pillbox Gaussian surface at conductor boundary', latex: '\\text{Pillbox straddles surface}' },
        { step: '$E = 0$ inside, field only on outer side', latex: '\\Phi = EA \\quad (\\text{one cap only})' },
        { step: 'Apply Gauss\'s law', latex: 'EA = \\frac{\\sigma A}{\\varepsilon_0}' },
        { step: 'Solve for $E$ (not $\\sigma/2\\varepsilon_0$ — field exits one side)', latex: 'E = \\frac{\\sigma}{\\varepsilon_0}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Conductor radius R', min: 1, max: 3, default: 2, step: 0.1, unit: 'm' },
    { id: 'Q', label: 'Total charge Q', min: 1, max: 10, default: 5, step: 0.5, unit: 'μC' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const { R, Q } = params;

    const geo = new THREE.SphereGeometry(R, 32, 24);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xbbbbbb, metalness: 0.6, emissive: 0x222222, emissiveIntensity: 0.15,
      transparent: true, opacity: 0.6
    });
    ctx.addMesh(new THREE.Mesh(geo, mat));
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    ctx.addLabel(new THREE.Vector3(0, 0, 0), 'E = 0');
    ctx.addLabel(new THREE.Vector3(R * 0.7, R * 0.7, 0), '\\sigma_{surface}');

    const fieldFn = shellField(R, Q);
    const starts = startPointsOnSphere(new THREE.Vector3(), R + 0.05, 24);
    const group = new THREE.Group();
    for (const sp of starts) {
      const dir = sp.clone().normalize();
      const eMag = Q / (R * R);
      const len = Math.min(eMag * 0.3, 1.2);
      const col = magnitudeToColor(eMag, 5);
      const arrow = new THREE.ArrowHelper(dir, sp, len, col.getHex(), len * 0.25, len * 0.12);
      group.add(arrow);
    }
    ctx.addMesh(group);

    const chargeGroup = new THREE.Group();
    const chargePts = startPointsOnSphere(new THREE.Vector3(), R, 40);
    const dotGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: Q > 0 ? 0xff5566 : 0x5588ff });
    for (const pt of chargePts) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pt);
      chargeGroup.add(dot);
    }
    ctx.addMesh(chargeGroup);

    return {};
  }
};

export default [
  fluxConcept,
  pointChargeGauss,
  lineChargeGauss,
  planeGauss,
  solidSphereGauss,
  shellGauss,
  concentricShells,
  cylShellGauss,
  solidCylinderGauss,
  conductorEquilibrium
];
