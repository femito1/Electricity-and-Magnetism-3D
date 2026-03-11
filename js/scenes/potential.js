import * as THREE from 'three';
import {
  coulombField, createChargeSphere, createArrowField, createFieldLines,
  createRod, createRing, createDisk, createSphere, startPointsOnSphere,
  createEquipotentialPlane, magnitudeToColor
} from '../fieldViz.js';

// ── 4.1 Point-Charge Potential ──────────────────────────────────────────────

const pointChargePotential = {
  id: 'point-charge-potential',
  title: '4.1 Point-Charge Potential',
  description:
    'The electric potential V = kq/r from a single point charge. ' +
    'Equipotential surfaces are concentric spheres; V decreases with distance.',
  equations: [
    {
      label: 'Potential',
      latex: 'V = \\frac{kq}{r} = \\frac{q}{4\\pi\\varepsilon_0 r}',
      derivation: [
        { step: 'Definition of potential from work integral', latex: 'V = -\\int_{\\infty}^{r} \\vec{E} \\cdot d\\vec{r}' },
        { step: 'Electric field of a point charge', latex: 'E = \\frac{kq}{r^2}\\,\\hat{r}' },
        { step: 'Substitute and integrate', latex: 'V = -\\int_{\\infty}^{r} \\frac{kq}{r\'^2}\\,dr\' = \\left[\\frac{kq}{r\'}\\right]_{\\infty}^{r}' },
        { step: 'Evaluate the limits', latex: 'V = \\frac{kq}{r} - 0 = \\frac{kq}{r}' }
      ]
    }
  ],
  sliders: [
    { id: 'charge', label: 'Charge q', min: 0.5, max: 10, default: 3, step: 0.5, unit: 'μC' }
  ],
  toggles: [
    { id: 'equipotentials', label: 'Equipotential map', default: true },
    { id: 'fieldLines', label: 'Field lines', default: true }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const q = params.charge;
    const origin = new THREE.Vector3();

    createChargeSphere(ctx, origin, q, 0.25);
    ctx.addLabel(new THREE.Vector3(0.35, 0.35, 0), 'q');

    if (toggles.equipotentials) {
      createEquipotentialPlane(ctx, (p) => {
        const r = p.distanceTo(origin);
        return r < 0.3 ? q / 0.3 : q / r;
      }, { y: 0, size: 10, res: 60, minV: -3, maxV: 3, opacity: 0.45 });
    }

    if (toggles.fieldLines) {
      const fieldFn = coulombField([{ pos: origin, q }]);
      const starts = startPointsOnSphere(origin, 0.4, 16);
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.5 });
    }

    return {};
  }
};

// ── 4.2 Dipole Potential ────────────────────────────────────────────────────

const dipolePotential = {
  id: 'dipole-potential',
  title: '4.2 Electric Dipole Potential',
  description:
    'The potential from an electric dipole: V = kq(1/r₊ − 1/r₋). ' +
    'Red regions are positive potential, blue are negative.',
  equations: [
    {
      label: 'Dipole potential',
      latex: 'V = kq\\left(\\frac{1}{r_+} - \\frac{1}{r_-}\\right)',
      derivation: [
        { step: 'Scalar sum of potentials from each charge', latex: 'V = \\frac{kq}{r_+} + \\frac{k(-q)}{r_-} = kq\\left(\\frac{1}{r_+} - \\frac{1}{r_-}\\right)' },
        { step: 'For $r \\gg d$, approximate distances', latex: 'r_+ \\approx r - \\frac{d}{2}\\cos\\theta,\\quad r_- \\approx r + \\frac{d}{2}\\cos\\theta' },
        { step: 'Expand $1/r_\\pm$ to first order', latex: '\\frac{1}{r_\\pm} \\approx \\frac{1}{r}\\left(1 \\pm \\frac{d\\cos\\theta}{2r}\\right)' },
        { step: 'Substitute and simplify using $p = qd$', latex: 'V \\approx \\frac{kqd\\cos\\theta}{r^2} = \\frac{kp\\cos\\theta}{r^2}' }
      ]
    }
  ],
  sliders: [
    { id: 'charge', label: 'Charge q', min: 0.5, max: 8, default: 3, step: 0.5, unit: 'μC' },
    { id: 'separation', label: 'Separation d', min: 0.5, max: 4, default: 2, step: 0.1, unit: 'm' }
  ],
  toggles: [
    { id: 'fieldLines', label: 'Field lines', default: true }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const q = params.charge;
    const d = params.separation / 2;
    const posP = new THREE.Vector3(d, 0, 0);
    const negP = new THREE.Vector3(-d, 0, 0);

    createChargeSphere(ctx, posP, q, 0.2);
    createChargeSphere(ctx, negP, -q, 0.2);
    ctx.addLabel(new THREE.Vector3(d, 0.4, 0), '+q');
    ctx.addLabel(new THREE.Vector3(-d, 0.4, 0), '-q');

    createEquipotentialPlane(ctx, (p) => {
      const rp = p.distanceTo(posP);
      const rn = p.distanceTo(negP);
      const vp = rp < 0.25 ? q / 0.25 : q / rp;
      const vn = rn < 0.25 ? -q / 0.25 : -q / rn;
      return vp + vn;
    }, { y: 0, size: 10, res: 70, minV: -4, maxV: 4, opacity: 0.45 });

    if (toggles.fieldLines) {
      const charges = [{ pos: posP, q }, { pos: negP, q: -q }];
      const fieldFn = coulombField(charges);
      const starts = startPointsOnSphere(posP, 0.35, 14);
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.45, bounds: 7 });
    }

    return {};
  }
};

// ── 4.3 Rod Potential ───────────────────────────────────────────────────────

const rodPotential = {
  id: 'rod-potential',
  title: '4.3 Potential from a Charged Rod',
  description:
    'The electric potential from a finite uniformly charged rod, found by integrating ' +
    'V = ∫k λ dx/r along the rod length.',
  equations: [
    {
      label: 'Potential',
      latex: 'V = \\int_{-L/2}^{L/2} \\frac{k\\lambda \\, dx}{r}',
      derivation: [
        { step: 'Charge element on the rod', latex: 'dq = \\lambda\\,dx' },
        { step: 'Potential contribution from element', latex: 'dV = \\frac{k\\,dq}{r} = \\frac{k\\lambda\\,dx}{r}' },
        { step: 'Distance from element at $x$ to field point', latex: 'r = \\sqrt{(x_P - x)^2 + y_P^2}' },
        { step: 'Integrate along the rod', latex: 'V = \\int_{-L/2}^{L/2} \\frac{k\\lambda\\,dx}{\\sqrt{(x_P - x)^2 + y_P^2}}' },
        { step: 'Result is a logarithmic expression', latex: 'V = k\\lambda\\ln\\!\\left(\\frac{x_P + L/2 + r_+}{x_P - L/2 + r_-}\\right)' }
      ]
    }
  ],
  sliders: [
    { id: 'L', label: 'Rod length L', min: 1, max: 6, default: 4, step: 0.5, unit: 'm' },
    { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m' }
  ],
  toggles: [
    { id: 'fieldLines', label: 'Field lines', default: false }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const L = params.L;
    const lam = params.lambda;

    createRod(ctx, { length: L, radius: 0.06, axis: 'x', color: 0xff5566 });
    ctx.addLabel(new THREE.Vector3(L / 2 + 0.3, 0.3, 0), '\\lambda');

    const nSeg = 40;
    const dx = L / nSeg;
    const potFn = (p) => {
      let V = 0;
      for (let i = 0; i < nSeg; i++) {
        const xs = -L / 2 + (i + 0.5) * dx;
        const srcPos = new THREE.Vector3(xs, 0, 0);
        const dist = p.distanceTo(srcPos);
        V += lam * dx / Math.max(dist, 0.15);
      }
      return V;
    };

    createEquipotentialPlane(ctx, potFn, {
      y: 0, size: 10, res: 60, minV: 0, maxV: 12, opacity: 0.45
    });

    if (toggles.fieldLines) {
      const charges = [];
      for (let i = 0; i < nSeg; i++) {
        const xs = -L / 2 + (i + 0.5) * dx;
        charges.push({ pos: new THREE.Vector3(xs, 0, 0), q: lam * dx });
      }
      const fieldFn = coulombField(charges);
      const starts = [];
      for (let i = -2; i <= 2; i++) {
        starts.push(new THREE.Vector3(i * L / 5, 0.3, 0));
        starts.push(new THREE.Vector3(i * L / 5, -0.3, 0));
      }
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.4, bounds: 6 });
    }

    return {};
  }
};

// ── 4.4 Ring Potential ──────────────────────────────────────────────────────

const ringPotential = {
  id: 'ring-potential',
  title: '4.4 Ring of Charge Potential',
  description:
    'Potential on the axis of a uniformly charged ring: V = kQ/√(R² + y²). ' +
    'The potential map shows how V varies around the ring.',
  equations: [
    {
      label: 'On-axis potential',
      latex: 'V = \\frac{kQ}{\\sqrt{R^2 + y^2}}',
      derivation: [
        { step: 'All charge elements on the ring are equidistant from any axis point', latex: 'r = \\sqrt{R^2 + y^2} \\quad \\text{for every } dq' },
        { step: 'Each element contributes equally', latex: 'dV = \\frac{k\\,dq}{\\sqrt{R^2 + y^2}}' },
        { step: 'Integrate over the full ring ($Q = \\int dq$)', latex: 'V = \\frac{k}{\\sqrt{R^2 + y^2}} \\int dq = \\frac{kQ}{\\sqrt{R^2 + y^2}}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Ring radius R', min: 0.5, max: 4, default: 2, step: 0.1, unit: 'm' },
    { id: 'Q', label: 'Total charge Q', min: 0.5, max: 10, default: 5, step: 0.5, unit: 'μC' }
  ],
  toggles: [
    { id: 'fieldLines', label: 'Field lines', default: false }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const R = params.R;
    const Q = params.Q;

    createRing(ctx, { radius: R, tubeRadius: 0.05, color: 0xff5566 });
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    const nSeg = 48;
    const dq = Q / nSeg;
    const ringCharges = [];
    for (let i = 0; i < nSeg; i++) {
      const a = (i / nSeg) * Math.PI * 2;
      ringCharges.push({ pos: new THREE.Vector3(R * Math.cos(a), 0, R * Math.sin(a)), q: dq });
    }

    const potFn = (p) => {
      let V = 0;
      for (const c of ringCharges) {
        const dist = p.distanceTo(c.pos);
        V += c.q / Math.max(dist, 0.15);
      }
      return V;
    };

    createEquipotentialPlane(ctx, potFn, {
      y: 0, size: 10, res: 60, minV: 0, maxV: 8, opacity: 0.45
    });

    if (toggles.fieldLines) {
      const fieldFn = coulombField(ringCharges);
      const starts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        starts.push(new THREE.Vector3(R * Math.cos(a), 0.15, R * Math.sin(a)));
      }
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.45, bounds: 7 });
    }

    return {};
  }
};

// ── 4.5 Disk Potential ──────────────────────────────────────────────────────

const diskPotential = {
  id: 'disk-potential',
  title: '4.5 Charged Disk Potential',
  description:
    'Potential on the axis of a uniformly charged disk. Found by integrating ring ' +
    'contributions: V = (σ/2ε₀)(√(R²+y²) − |y|).',
  equations: [
    {
      label: 'On-axis potential',
      latex: 'V = \\frac{\\sigma}{2\\varepsilon_0}\\left(\\sqrt{R^2 + y^2} - |y|\\right)',
      derivation: [
        { step: 'Treat disk as concentric rings of radius $r\\prime$, width $dr\\prime$', latex: 'dq = \\sigma \\cdot 2\\pi r\'\\,dr\'' },
        { step: 'Potential from each ring at height $y$ on the axis', latex: 'dV = \\frac{k\\,\\sigma\\,2\\pi r\'\\,dr\'}{\\sqrt{r\'^2 + y^2}}' },
        { step: 'Integrate from $0$ to $R$', latex: 'V = 2\\pi k\\sigma \\int_0^R \\frac{r\'\\,dr\'}{\\sqrt{r\'^2 + y^2}}' },
        { step: 'Evaluate using substitution $u = r\\prime^2 + y^2$', latex: 'V = 2\\pi k\\sigma\\left[\\sqrt{r\'^2 + y^2}\\right]_0^R' },
        { step: 'Final result with $k = 1/(4\\pi\\varepsilon_0)$', latex: 'V = \\frac{\\sigma}{2\\varepsilon_0}\\left(\\sqrt{R^2 + y^2} - |y|\\right)' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Disk radius R', min: 0.5, max: 4, default: 2, step: 0.1, unit: 'm' },
    { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'μC/m²' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const R = params.R;
    const sigma = params.sigma;

    createDisk(ctx, { radius: R, color: 0xff5566, opacity: 0.35 });
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    const nRings = 20;
    const diskCharges = [];
    for (let ir = 0; ir < nRings; ir++) {
      const rr = (ir + 0.5) * R / nRings;
      const area = 2 * Math.PI * rr * (R / nRings);
      const dq = sigma * area;
      const nPts = Math.max(8, Math.round(rr * 12));
      for (let j = 0; j < nPts; j++) {
        const a = (j / nPts) * Math.PI * 2;
        diskCharges.push({
          pos: new THREE.Vector3(rr * Math.cos(a), 0, rr * Math.sin(a)),
          q: dq / nPts
        });
      }
    }

    const potFn = (p) => {
      let V = 0;
      for (const c of diskCharges) {
        const dist = p.distanceTo(c.pos);
        V += c.q / Math.max(dist, 0.12);
      }
      return V;
    };

    createEquipotentialPlane(ctx, potFn, {
      y: 0, size: 10, res: 50, minV: 0, maxV: 12, opacity: 0.45
    });

    return {};
  }
};

// ── 4.6 Gradient & Field ────────────────────────────────────────────────────

const gradientField = {
  id: 'gradient-field',
  title: '4.6 E = −∇V',
  description:
    'The electric field is the negative gradient of the potential. E-field arrows ' +
    'point from high (red) to low (blue) potential.',
  equations: [
    {
      label: 'Gradient relation',
      latex: '\\vec{E} = -\\nabla V',
      derivation: [
        { step: 'Work done moving charge $q$ through field $\\vec{E}$', latex: 'dW = q\\vec{E} \\cdot d\\vec{l}' },
        { step: 'Potential difference from work per unit charge', latex: 'dV = -\\vec{E} \\cdot d\\vec{l}' },
        { step: 'Component form in 3D', latex: 'E_x = -\\frac{\\partial V}{\\partial x},\\quad E_y = -\\frac{\\partial V}{\\partial y},\\quad E_z = -\\frac{\\partial V}{\\partial z}' },
        { step: 'Combine into vector gradient', latex: '\\vec{E} = -\\nabla V = -\\left(\\frac{\\partial V}{\\partial x}\\hat{x} + \\frac{\\partial V}{\\partial y}\\hat{y} + \\frac{\\partial V}{\\partial z}\\hat{z}\\right)' }
      ]
    }
  ],
  sliders: [
    { id: 'charge', label: 'Charge q', min: 0.5, max: 10, default: 4, step: 0.5, unit: 'μC' }
  ],
  toggles: [],
  setup(ctx) {
    const { params } = ctx;
    const q = params.charge;
    const origin = new THREE.Vector3();

    createChargeSphere(ctx, origin, q, 0.25);
    ctx.addLabel(new THREE.Vector3(0.35, 0.35, 0), 'q');

    createEquipotentialPlane(ctx, (p) => {
      const r = p.distanceTo(origin);
      return r < 0.3 ? q / 0.3 : q / r;
    }, { y: 0, size: 10, res: 60, minV: -3, maxV: 3, opacity: 0.35 });

    const fieldFn = coulombField([{ pos: origin, q }]);
    createArrowField(ctx, fieldFn, {
      bounds: [[-4, 4], [0, 0], [-4, 4]], step: 1.2, scale: 0.25, maxLength: 1.0,
      maxMag: 6, opacity: 0.85, flat: true
    });

    ctx.addLabel(new THREE.Vector3(3, 0.5, 0), '\\vec{E} = -\\nabla V');

    return {};
  }
};

// ── 4.7 Equipotential Surfaces (Two Charges) ───────────────────────────────

const equipotentialSurfaces = {
  id: 'equipotential-surfaces',
  title: '4.7 Equipotential Map: Two Charges',
  description:
    'Equipotential colored map for a system of two point charges. ' +
    'The potential is the scalar sum of each charge\'s contribution.',
  equations: [
    { label: 'Superposition', latex: 'V = \\frac{kq_1}{r_1} + \\frac{kq_2}{r_2}' }
  ],
  sliders: [
    { id: 'q1', label: 'Charge q₁', min: -8, max: 8, default: 4, step: 0.5, unit: 'μC' },
    { id: 'q2', label: 'Charge q₂', min: -8, max: 8, default: -3, step: 0.5, unit: 'μC' },
    { id: 'x1', label: 'x₁ position', min: -4, max: 0, default: -2, step: 0.25, unit: 'm' },
    { id: 'x2', label: 'x₂ position', min: 0, max: 4, default: 2, step: 0.25, unit: 'm' }
  ],
  toggles: [
    { id: 'fieldLines', label: 'Field lines', default: true }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const { q1, q2, x1, x2 } = params;
    const p1 = new THREE.Vector3(x1, 0, 0);
    const p2 = new THREE.Vector3(x2, 0, 0);

    createChargeSphere(ctx, p1, q1, 0.2);
    createChargeSphere(ctx, p2, q2, 0.2);
    ctx.addLabel(new THREE.Vector3(x1, 0.45, 0), `q_1`);
    ctx.addLabel(new THREE.Vector3(x2, 0.45, 0), `q_2`);

    createEquipotentialPlane(ctx, (p) => {
      const r1 = p.distanceTo(p1);
      const r2 = p.distanceTo(p2);
      return q1 / Math.max(r1, 0.25) + q2 / Math.max(r2, 0.25);
    }, { y: 0, size: 12, res: 70, minV: -5, maxV: 5, opacity: 0.45 });

    if (toggles.fieldLines) {
      const charges = [{ pos: p1, q: q1 }, { pos: p2, q: q2 }];
      const fieldFn = coulombField(charges);
      const starts = [];
      if (q1 > 0) {
        starts.push(...startPointsOnSphere(p1, 0.35, 12));
      }
      if (q2 > 0) {
        starts.push(...startPointsOnSphere(p2, 0.35, 12));
      }
      if (q1 <= 0 && q2 <= 0) {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          starts.push(new THREE.Vector3(6 * Math.cos(a), 0, 6 * Math.sin(a)));
        }
      }
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.4, bounds: 8 });
    }

    return {};
  }
};

// ── 4.8 Conducting Sphere Potential ─────────────────────────────────────────

const conductingSpherePotential = {
  id: 'conducting-sphere-potential',
  title: '4.8 Conducting Sphere Potential',
  description:
    'A conducting sphere of radius R with charge Q. V = kQ/R = const inside, V = kQ/r outside. ' +
    'The equipotential map shows constant color inside and 1/r fall-off outside.',
  equations: [
    {
      label: 'Inside (r ≤ R)',
      latex: 'V = \\frac{kQ}{R} = \\text{const}',
      derivation: [
        { step: 'Inside a conductor, $E = 0$ everywhere', latex: '\\vec{E} = 0 \\quad (r < R)' },
        { step: 'Since $\\vec{E} = -\\nabla V$, the potential cannot change', latex: '\\nabla V = 0 \\implies V = \\text{const}' },
        { step: 'Match the surface value', latex: 'V(r \\le R) = V(R) = \\frac{kQ}{R}' }
      ]
    },
    {
      label: 'Outside (r > R)',
      latex: 'V = \\frac{kQ}{r}',
      derivation: [
        { step: 'Outside the sphere, field is that of a point charge', latex: 'E = \\frac{kQ}{r^2}\\,\\hat{r} \\quad (r > R)' },
        { step: 'Integrate from $\\infty$ to $r$', latex: 'V = -\\int_{\\infty}^{r} \\frac{kQ}{r\'^2}\\,dr\'' },
        { step: 'Evaluate to obtain Coulomb potential', latex: 'V = \\frac{kQ}{r} \\quad (r > R)' },
        { step: 'Continuous at the surface', latex: 'V(R) = \\frac{kQ}{R}' }
      ]
    }
  ],
  sliders: [
    { id: 'R', label: 'Sphere radius R', min: 1, max: 3, default: 2, step: 0.1, unit: 'm' },
    { id: 'Q', label: 'Charge Q', min: 1, max: 10, default: 5, step: 0.5, unit: 'μC' }
  ],
  toggles: [
    { id: 'fieldLines', label: 'Field lines', default: true }
  ],
  setup(ctx) {
    const { params, toggles } = ctx;
    const R = params.R;
    const Q = params.Q;
    const origin = new THREE.Vector3();

    const geo = new THREE.SphereGeometry(R, 32, 24);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xbbbbbb, emissive: 0x222222, emissiveIntensity: 0.15,
      transparent: true, opacity: 0.55
    });
    ctx.addMesh(new THREE.Mesh(geo, mat));
    ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

    const Vsurface = Q / R;
    createEquipotentialPlane(ctx, (p) => {
      const r = p.distanceTo(origin);
      if (r <= R) return Vsurface;
      return Q / r;
    }, { y: 0, size: 10, res: 60, minV: 0, maxV: 6, opacity: 0.4 });

    if (toggles.fieldLines) {
      const fieldFn = coulombField([{ pos: origin, q: Q }]);
      const starts = startPointsOnSphere(origin, R + 0.05, 16);
      createFieldLines(ctx, fieldFn, starts, { color: 0x44ddff, opacity: 0.45, bounds: 7 });
    }

    ctx.addLabel(new THREE.Vector3(0, 0.3, 0), 'V = const');

    return {};
  }
};

export default [
  pointChargePotential,
  dipolePotential,
  rodPotential,
  ringPotential,
  diskPotential,
  gradientField,
  equipotentialSurfaces,
  conductingSpherePotential
];
