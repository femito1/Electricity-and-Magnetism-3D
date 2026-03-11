import * as THREE from 'three';
import { createArrowField, createFieldLines, createRod, createRing, createWire, createSolenoid, createToroid, highlightSegment, highlightArc, startPointsOnCircle, magnitudeToColor } from '../fieldViz.js';

// ========== Local B-field functions ==========

function straightWireB(I) {
  return (p) => {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r < 0.1) return new THREE.Vector3();
    const mag = I / (2 * Math.PI * r);
    return new THREE.Vector3(-p.z / r * mag, 0, p.x / r * mag);
  };
}

function circularLoopB(R, I) {
  return (p) => {
    const y = p.y;
    const denom = Math.pow(R * R + y * y, 1.5);
    if (denom < 0.001) return new THREE.Vector3();
    return new THREE.Vector3(0, I * R * R / (2 * denom), 0);
  };
}

function solenoidB(n, I, R, L) {
  return (p) => {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r < R && Math.abs(p.y) < L / 2) return new THREE.Vector3(0, n * I, 0);
    return new THREE.Vector3(0, 0, 0);
  };
}

function toroidB(R_major, N, I) {
  return (p) => {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r < 0.1) return new THREE.Vector3();
    const mag = N * I / (2 * Math.PI * r);
    return new THREE.Vector3(-p.z / r * mag, 0, p.x / r * mag);
  };
}

function dashedCircle(ctx, radius, y, color, segments = 64) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(a), y, radius * Math.sin(a)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.2, gapSize: 0.1, transparent: true, opacity: 0.7 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return ctx.addMesh(line);
}

function dashedRect(ctx, corners, color) {
  const pts = [...corners, corners[0]];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.2, gapSize: 0.1, transparent: true, opacity: 0.7 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return ctx.addMesh(line);
}

export default [
  // ── 8.1 Wire Biot-Savart ──────────────────────────────────────────
  {
    id: 'wire-biot-savart',
    title: '8.1 Long Wire (Biot-Savart)',
    description: 'A long straight wire carrying current I produces a magnetic field whose direction curls around the wire (right-hand rule) and magnitude falls off as 1/r.',
    equations: [
      { label: 'Biot-Savart', latex: 'd\\vec{B} = \\frac{\\mu_0 I}{4\\pi} \\frac{d\\vec{l} \\times \\hat{r}}{r^2}' },
      { label: 'Wire Field', latex: 'B = \\frac{\\mu_0 I}{2\\pi R}', derivation: [
        { step: 'Apply Biot-Savart to a current element', latex: 'dB = \\frac{\\mu_0 I}{4\\pi} \\frac{dl\\,\\sin\\theta}{r^2}' },
        { step: 'Express geometry in terms of angle θ', latex: 'r = \\frac{R}{\\sin\\theta},\\quad dl = \\frac{R\\,d\\theta}{\\sin^2\\theta}' },
        { step: 'Substitute and simplify', latex: 'dB = \\frac{\\mu_0 I}{4\\pi R} \\sin\\theta\\, d\\theta' },
        { step: 'Integrate from θ = 0 to π', latex: 'B = \\frac{\\mu_0 I}{4\\pi R} \\int_0^{\\pi} \\sin\\theta\\, d\\theta = \\frac{\\mu_0 I}{4\\pi R} \\cdot 2' },
        { step: 'Result for infinite straight wire', latex: 'B = \\frac{\\mu_0 I}{2\\pi R}' }
      ]}
    ],
    sliders: [
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' }
    ],
    toggles: [
      { id: 'fieldLines', label: 'Field Lines', default: true },
      { id: 'bField', label: 'B Vectors', default: true }
    ],
    setup(ctx) {
      const I = ctx.params.I;
      const fieldFn = straightWireB(I);

      createRod(ctx, { length: 10, radius: 0.06, color: 0xccaa44, axis: 'y' });
      ctx.addLabel(new THREE.Vector3(0.3, 4.5, 0), 'I');

      const dlStart = new THREE.Vector3(0, 0.5, 0);
      const dlEnd = new THREE.Vector3(0, 1.2, 0);
      highlightSegment(ctx, { start: dlStart, end: dlEnd, color: 0xffff00 });
      ctx.addLabel(dlEnd.clone().add(new THREE.Vector3(0.3, 0.1, 0)), 'd\\vec{l}');

      const testPt = new THREE.Vector3(2, 0.85, 0);
      const rVec = new THREE.Vector3().subVectors(testPt, new THREE.Vector3(0, 0.85, 0));
      const rLine = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.85, 0), testPt]);
      ctx.addMesh(new THREE.Line(rLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })));
      ctx.addLabel(new THREE.Vector3(1, 1.15, 0), '\\hat{r}');

      const dB = fieldFn(testPt);
      const dBmag = dB.length();
      if (dBmag > 0.01) {
        const dBArrow = new THREE.ArrowHelper(dB.clone().normalize(), testPt, Math.min(dBmag * 0.8, 1.2), 0x44ddff, 0.15, 0.08);
        ctx.addMesh(dBArrow);
        ctx.addLabel(testPt.clone().add(dB.clone().normalize().multiplyScalar(0.8)), 'd\\vec{B}');
      }

      if (ctx.toggles.fieldLines) {
        for (let y = -3; y <= 3; y += 1.5) {
          for (const r of [1, 2, 3]) {
            const pts = [];
            for (let i = 0; i <= 64; i++) {
              const a = (i / 64) * Math.PI * 2;
              pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const col = magnitudeToColor(I / (2 * Math.PI * r), 2);
            ctx.addMesh(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5 })));
          }
        }
      }

      if (ctx.toggles.bField) {
        createArrowField(ctx, fieldFn, {
          bounds: [[-3, 3], [-2, 2], [-3, 3]], step: 1.5,
          scale: 0.6, maxMag: 3, maxLength: 1.0, opacity: 0.7
        });
      }

      return {};
    }
  },

  // ── 8.2 Loop Biot-Savart ──────────────────────────────────────────
  {
    id: 'loop-biot-savart',
    title: '8.2 Circular Loop (Biot-Savart)',
    description: 'A circular current loop produces a magnetic field along its axis. Off-axis components of dB from opposite elements cancel, while axial components add.',
    equations: [
      { label: 'On-Axis B', latex: 'B = \\frac{\\mu_0 I R^2}{2(R^2 + z^2)^{3/2}}', derivation: [
        { step: 'Distance from ring element to field point on axis', latex: 'r = \\sqrt{R^2 + z^2}' },
        { step: 'Biot-Savart for each element $dl$ on the ring', latex: 'dB = \\frac{\\mu_0 I\\, dl}{4\\pi (R^2 + z^2)}' },
        { step: 'By symmetry radial components cancel; axial component', latex: 'dB_z = dB \\cdot \\frac{R}{r} = \\frac{\\mu_0 I\\, dl\\, R}{4\\pi (R^2 + z^2)^{3/2}}' },
        { step: 'Integrate around the full loop: $\\oint dl = 2\\pi R$', latex: 'B = \\frac{\\mu_0 I R}{4\\pi (R^2 + z^2)^{3/2}} \\cdot 2\\pi R = \\frac{\\mu_0 I R^2}{2(R^2 + z^2)^{3/2}}' }
      ]}
    ],
    sliders: [
      { id: 'R', label: 'Radius R', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' }
    ],
    toggles: [],
    setup(ctx) {
      const { R, I } = ctx.params;
      const fieldFn = circularLoopB(R, I);

      createRing(ctx, { radius: R, tubeRadius: 0.05, color: 0xccaa44 });
      ctx.addLabel(new THREE.Vector3(R + 0.3, 0, 0), 'R');

      highlightArc(ctx, { radius: R, startAngle: 0.3, arcLength: 0.5, color: 0xffff00, y: 0 });
      const arcMid = 0.3 + 0.25;
      ctx.addLabel(new THREE.Vector3(R * Math.cos(arcMid) + 0.3, 0.3, R * Math.sin(arcMid)), 'd\\vec{l}');

      const dBpos = new THREE.Vector3(R * Math.cos(arcMid), 0, R * Math.sin(arcMid));
      const dBdir = new THREE.Vector3(0, 0.6, -0.4).normalize();
      const dBArrow = new THREE.ArrowHelper(dBdir, dBpos, 0.8, 0x44ddff, 0.12, 0.06);
      ctx.addMesh(dBArrow);
      ctx.addLabel(dBpos.clone().add(dBdir.clone().multiplyScalar(0.9)), 'd\\vec{B}');

      const oppPos = new THREE.Vector3(-R * Math.cos(arcMid), 0, -R * Math.sin(arcMid));
      const dBdirOpp = new THREE.Vector3(0, 0.6, 0.4).normalize();
      const dBArrowOpp = new THREE.ArrowHelper(dBdirOpp, oppPos, 0.8, 0x44ddff, 0.12, 0.06);
      ctx.addMesh(dBArrowOpp);

      const group = new THREE.Group();
      for (let y = -4; y <= 4; y += 0.8) {
        const pos = new THREE.Vector3(0, y, 0);
        const B = fieldFn(pos);
        const mag = B.length();
        if (mag < 0.005) continue;
        const len = Math.min(mag * 1.5, 1.0);
        const col = magnitudeToColor(mag, 1.5);
        const arrow = new THREE.ArrowHelper(B.clone().normalize(), pos, len, col.getHex(), len * 0.3, len * 0.15);
        group.add(arrow);
      }
      ctx.addMesh(group);

      return {};
    }
  },

  // ── 8.3 Finite Wire ───────────────────────────────────────────────
  {
    id: 'finite-wire-biot',
    title: '8.3 Finite Wire Segment',
    description: 'The magnetic field from a finite wire segment depends on the angles θ₁ and θ₂ subtended at the field point. The result reduces to the infinite-wire formula when θ₁→0 and θ₂→π/2.',
    equations: [
      { label: 'Finite Wire', latex: 'B = \\frac{\\mu_0 I}{4\\pi d}(\\sin\\theta_2 - \\sin\\theta_1)', derivation: [
        { step: 'Apply Biot-Savart to element at position $l$ along wire', latex: 'dB = \\frac{\\mu_0 I}{4\\pi} \\frac{dl\\,\\sin\\alpha}{r^2}' },
        { step: 'Express in terms of angle θ from perpendicular', latex: 'r = \\frac{d}{\\cos\\theta},\\quad l = d\\tan\\theta,\\quad dl = \\frac{d\\,d\\theta}{\\cos^2\\theta}' },
        { step: 'Substitute and simplify ($\\sin\\alpha = \\cos\\theta$)', latex: 'dB = \\frac{\\mu_0 I}{4\\pi d} \\cos\\theta\\, d\\theta' },
        { step: 'Integrate from θ₁ to θ₂', latex: 'B = \\frac{\\mu_0 I}{4\\pi d} \\int_{\\theta_1}^{\\theta_2} \\cos\\theta\\, d\\theta = \\frac{\\mu_0 I}{4\\pi d}(\\sin\\theta_2 - \\sin\\theta_1)' }
      ]}
    ],
    limits: [
      { label: 'L → ∞', slider: 'L', target: 8, annotation: 'Becomes the infinite straight wire: B = μ₀I/(2πd)', ref: 'wire-biot-savart' }
    ],
    sliders: [
      { id: 'L', label: 'Wire Length L', min: 2, max: 8, default: 4, step: 0.5, unit: 'm' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'dist', label: 'Distance d', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { L, I, dist } = ctx.params;

      const wireStart = new THREE.Vector3(0, -L / 2, 0);
      const wireEnd = new THREE.Vector3(0, L / 2, 0);
      createRod(ctx, { length: L, radius: 0.05, color: 0xccaa44, axis: 'y' });

      const dlMid = new THREE.Vector3(0, 0.3, 0);
      highlightSegment(ctx, { start: new THREE.Vector3(0, -0.1, 0), end: new THREE.Vector3(0, 0.7, 0), color: 0xffff00 });
      ctx.addLabel(new THREE.Vector3(0.3, 0.3, 0), 'd\\vec{l}');

      const testPt = new THREE.Vector3(dist, 0, 0);
      const testMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
      );
      testMarker.position.copy(testPt);
      ctx.addMesh(testMarker);
      ctx.addLabel(testPt.clone().add(new THREE.Vector3(0.2, 0.2, 0)), 'P');

      const rLine = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), testPt]);
      ctx.addMesh(new THREE.Line(rLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })));
      ctx.addLabel(new THREE.Vector3(dist / 2, -0.3, 0), 'd');

      const toTop = new THREE.BufferGeometry().setFromPoints([testPt, wireEnd]);
      ctx.addMesh(new THREE.Line(toTop, new THREE.LineBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.4 })));
      const toBot = new THREE.BufferGeometry().setFromPoints([testPt, wireStart]);
      ctx.addMesh(new THREE.Line(toBot, new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.4 })));

      const theta2 = Math.atan2(L / 2, dist);
      const theta1 = Math.atan2(-L / 2, dist);
      ctx.addLabel(testPt.clone().add(new THREE.Vector3(-0.5, 0.6, 0)), '\\theta_2');
      ctx.addLabel(testPt.clone().add(new THREE.Vector3(-0.5, -0.6, 0)), '\\theta_1');

      const Bmag = (I / (4 * Math.PI * dist)) * (Math.sin(theta2) - Math.sin(theta1));
      const Bdir = new THREE.Vector3(0, 0, 1);
      if (Bmag > 0.01) {
        const arrow = new THREE.ArrowHelper(Bdir, testPt, Math.min(Math.abs(Bmag) * 0.8, 1.5), 0x44ddff, 0.15, 0.08);
        ctx.addMesh(arrow);
        ctx.addLabel(testPt.clone().add(new THREE.Vector3(0, 0, 1.2)), '\\vec{B}');
      }

      const rArrow = new THREE.BufferGeometry().setFromPoints([dlMid, testPt]);
      ctx.addMesh(new THREE.Line(rArrow, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.4 })));
      ctx.addLabel(new THREE.Vector3(dist / 2, 0.5, 0), 'r');

      return {};
    }
  },

  // ── 8.4 Solenoid B ────────────────────────────────────────────────
  {
    id: 'solenoid-b',
    title: '8.4 Solenoid B Field',
    description: 'An ideal solenoid produces a nearly uniform magnetic field inside and negligible field outside. The field magnitude depends on the turn density n and current I.',
    equations: [
      { label: 'Solenoid Field', latex: 'B = \\mu_0 n I', derivation: [
        { step: 'Rectangular Amperian loop: one side inside (length $l$), one outside', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}' },
        { step: '$B$ inside is uniform along axis; $B$ outside $\\approx 0$', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = Bl + 0 + 0 + 0 = Bl' },
        { step: 'Enclosed current: $n$ turns per unit length over length $l$', latex: 'I_{\\text{enc}} = nIl' },
        { step: 'Apply Ampère\'s law', latex: 'Bl = \\mu_0 nIl' },
        { step: 'Solve for $B$', latex: 'B = \\mu_0 nI' }
      ]}
    ],
    sliders: [
      { id: 'turns', label: 'Turns N', min: 5, max: 40, default: 20, step: 1, unit: '' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 3, step: 0.5, unit: 'A' },
      { id: 'R', label: 'Radius R', min: 0.5, max: 2, default: 1, step: 0.25, unit: 'm' },
      { id: 'length', label: 'Length L', min: 2, max: 8, default: 4, step: 0.5, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { turns, I, R, length: L } = ctx.params;
      const n = turns / L;
      const fieldFn = solenoidB(n, I, R, L);

      createSolenoid(ctx, { radius: R, length: L, turns, color: 0xccaa44 });
      ctx.addLabel(new THREE.Vector3(R + 0.4, L / 2, 0), 'n');
      ctx.addLabel(new THREE.Vector3(R + 0.4, -0.5, 0), 'I');
      ctx.addLabel(new THREE.Vector3(0, L / 2 + 0.5, 0), '\\vec{B}');

      createArrowField(ctx, fieldFn, {
        bounds: [[-R * 2, R * 2], [-L / 2 - 1, L / 2 + 1], [-R * 2, R * 2]],
        step: L / 5 > 0.8 ? L / 5 : 0.8,
        scale: 0.4, maxMag: 150, maxLength: 1.5, opacity: 0.85
      });
      ctx.addLabel(new THREE.Vector3(0, L / 2 + 1.2, 0), `B = ${(n * I).toFixed(0)}`);

      return {};
    }
  },

  // ── 8.5 Toroid B ──────────────────────────────────────────────────
  {
    id: 'toroid-b',
    title: '8.5 Toroid B Field',
    description: 'A toroidal coil confines the magnetic field entirely within the torus. The field is tangential and varies as 1/r inside the toroid.',
    equations: [
      { label: 'Toroid Field', latex: 'B = \\frac{\\mu_0 N I}{2\\pi r}', derivation: [
        { step: 'Circular Amperian loop of radius $r$ inside toroid', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}' },
        { step: '$B$ is tangential and constant by symmetry', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = B(2\\pi r)' },
        { step: 'All $N$ turns are enclosed by the loop', latex: 'I_{\\text{enc}} = NI' },
        { step: 'Apply Ampère\'s law', latex: 'B(2\\pi r) = \\mu_0 NI' },
        { step: 'Solve for $B$', latex: 'B = \\frac{\\mu_0 NI}{2\\pi r}' }
      ]}
    ],
    sliders: [
      { id: 'N', label: 'Turns N', min: 20, max: 100, default: 40, step: 5, unit: '' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 3, step: 0.5, unit: 'A' },
      { id: 'majorR', label: 'Major Radius', min: 1.5, max: 4, default: 2, step: 0.25, unit: 'm' },
      { id: 'minorR', label: 'Minor Radius', min: 0.3, max: 1.5, default: 0.5, step: 0.1, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { N, I, majorR, minorR } = ctx.params;
      const fieldFn = toroidB(majorR, N, I);

      createToroid(ctx, { majorRadius: majorR, minorRadius: minorR, turns: N, color: 0xccaa44 });

      const group = new THREE.Group();
      const innerR = majorR - minorR;
      const outerR = majorR + minorR;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        for (let rr = innerR + 0.15; rr < outerR - 0.05; rr += (outerR - innerR) / 3) {
          const pos = new THREE.Vector3(rr * Math.cos(a), 0, rr * Math.sin(a));
          const B = fieldFn(pos);
          const mag = B.length();
          if (mag < 0.005) continue;
          const len = Math.min(mag * 0.5, 1.2);
          const col = magnitudeToColor(mag, 80);
          const arrow = new THREE.ArrowHelper(B.clone().normalize(), pos, len, col.getHex(), len * 0.3, len * 0.15);
          group.add(arrow);
        }
      }
      ctx.addMesh(group);
      ctx.addLabel(new THREE.Vector3(majorR + minorR + 0.6, 0.5, 0), `B \\propto N I / r`);

      return {};
    }
  },

  // ── 8.6 Wire + Ampère's Law ───────────────────────────────────────
  {
    id: 'wire-ampere',
    title: "8.6 Wire & Ampère's Law",
    description: "A circular Amperian loop centered on a long wire exploits the symmetry: B is constant and tangent on the loop, so ∮B·dl = B(2πr) = μ₀I.",
    equations: [
      { label: "Ampère's Law", latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}' }
    ],
    sliders: [
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'loopR', label: 'Loop Radius', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { I, loopR } = ctx.params;
      const fieldFn = straightWireB(I);

      createRod(ctx, { length: 10, radius: 0.06, color: 0xccaa44, axis: 'y' });
      ctx.addLabel(new THREE.Vector3(0.3, 4.5, 0), 'I');

      dashedCircle(ctx, loopR, 0, 0x44ff88);
      ctx.addLabel(new THREE.Vector3(loopR + 0.3, 0.3, 0), '\\mathcal{C}\\;\\text{(Amperian loop)}');

      const numArrows = 12;
      const group = new THREE.Group();
      for (let i = 0; i < numArrows; i++) {
        const a = (i / numArrows) * Math.PI * 2;
        const pos = new THREE.Vector3(loopR * Math.cos(a), 0, loopR * Math.sin(a));
        const B = fieldFn(pos);
        const mag = B.length();
        const len = Math.min(mag * 0.8, 0.8);
        const arrow = new THREE.ArrowHelper(B.clone().normalize(), pos, len, 0x44ddff, len * 0.3, len * 0.15);
        group.add(arrow);
      }
      ctx.addMesh(group);

      const dlPos = new THREE.Vector3(loopR, 0, 0);
      ctx.addLabel(dlPos.clone().add(new THREE.Vector3(0, 0.5, 0.3)), '\\vec{B} \\cdot d\\vec{l}');

      return {};
    }
  },

  // ── 8.7 Solenoid + Ampère ─────────────────────────────────────────
  {
    id: 'solenoid-ampere',
    title: "8.7 Solenoid & Ampère's Law",
    description: "A rectangular Amperian loop through a solenoid: only the inside-top side contributes to ∮B·dl because B≈0 outside and B⊥dl on the vertical sides.",
    equations: [
      { label: "Ampère (Solenoid)", latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 n I L', derivation: [
        { step: 'Rectangular Amperian loop: one side inside (length $l$), one outside', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}' },
        { step: '$B$ inside is uniform along axis; $B$ outside $\\approx 0$', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = Bl + 0 + 0 + 0 = Bl' },
        { step: 'Enclosed current: $n$ turns per unit length over length $l$', latex: 'I_{\\text{enc}} = nIl' },
        { step: 'Apply Ampère\'s law', latex: 'Bl = \\mu_0 nIl' },
        { step: 'Solve for $B$', latex: 'B = \\mu_0 nI' }
      ]}
    ],
    sliders: [
      { id: 'turns', label: 'Turns N', min: 10, max: 40, default: 20, step: 1, unit: '' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 3, step: 0.5, unit: 'A' }
    ],
    toggles: [],
    setup(ctx) {
      const { turns, I } = ctx.params;
      const L = 6;
      const R = 1;
      const n = turns / L;

      createSolenoid(ctx, { radius: R, length: L, turns, color: 0xccaa44 });

      const fieldFn = solenoidB(n, I, R, L);
      createArrowField(ctx, fieldFn, {
        bounds: [[-0.01, 0.01], [-L / 2 + 0.5, L / 2 - 0.5], [-0.01, 0.01]],
        step: 1, scale: 0.15, maxMag: n * I + 1, maxLength: 0.8, opacity: 0.6
      });

      const rectW = 3;
      const rectH = R + 1.5;
      const c = [
        new THREE.Vector3(0, -rectW / 2, 0),
        new THREE.Vector3(0, rectW / 2, 0),
        new THREE.Vector3(rectH, rectW / 2, 0),
        new THREE.Vector3(rectH, -rectW / 2, 0)
      ];
      dashedRect(ctx, c, 0x44ff88);

      ctx.addLabel(new THREE.Vector3(0, rectW / 2 + 0.3, 0), 'B \\cdot L \\neq 0');
      ctx.addLabel(new THREE.Vector3(rectH, rectW / 2 + 0.3, 0), 'B \\approx 0');
      ctx.addLabel(new THREE.Vector3(rectH / 2, -rectW / 2 - 0.3, 0), 'B \\perp d\\vec{l}');

      const arrowInside = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -rectW / 2, 0), rectW, 0x44ff88, 0.15, 0.08);
      ctx.addMesh(arrowInside);

      return {};
    }
  },

  // ── 8.8 Toroid + Ampère ───────────────────────────────────────────
  {
    id: 'toroid-ampere',
    title: "8.8 Toroid & Ampère's Law",
    description: "A circular Amperian loop inside the toroid encloses all N turns of current, giving B·2πr = μ₀NI.",
    equations: [
      { label: "Ampère (Toroid)", latex: 'B \\cdot 2\\pi r = \\mu_0 N I', derivation: [
        { step: 'Circular Amperian loop of radius $r$ inside toroid', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}' },
        { step: '$B$ is tangential and constant by symmetry', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = B(2\\pi r)' },
        { step: 'All $N$ turns are enclosed by the loop', latex: 'I_{\\text{enc}} = NI' },
        { step: 'Apply Ampère\'s law', latex: 'B(2\\pi r) = \\mu_0 NI' },
        { step: 'Solve for $B$', latex: 'B = \\frac{\\mu_0 NI}{2\\pi r}' }
      ]}
    ],
    sliders: [
      { id: 'N', label: 'Turns N', min: 20, max: 100, default: 40, step: 5, unit: '' },
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 3, step: 0.5, unit: 'A' },
      { id: 'majorR', label: 'Major Radius', min: 1.5, max: 4, default: 2, step: 0.25, unit: 'm' },
      { id: 'minorR', label: 'Minor Radius', min: 0.3, max: 1.5, default: 0.5, step: 0.1, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { N, I, majorR, minorR } = ctx.params;
      const fieldFn = toroidB(majorR, N, I);

      createToroid(ctx, { majorRadius: majorR, minorRadius: minorR, turns: N, color: 0xccaa44 });

      dashedCircle(ctx, majorR, 0, 0x44ff88);
      ctx.addLabel(new THREE.Vector3(majorR + 0.4, 0.4, 0), 'Amperian loop');

      const group = new THREE.Group();
      const numArrows = 16;
      for (let i = 0; i < numArrows; i++) {
        const a = (i / numArrows) * Math.PI * 2;
        const pos = new THREE.Vector3(majorR * Math.cos(a), 0, majorR * Math.sin(a));
        const B = fieldFn(pos);
        const mag = B.length();
        if (mag < 0.005) continue;
        const len = Math.min(mag * 0.3, 0.7);
        const col = magnitudeToColor(mag, N * I / (2 * Math.PI * (majorR - minorR)));
        const arrow = new THREE.ArrowHelper(B.clone().normalize(), pos, len, col.getHex(), len * 0.3, len * 0.15);
        group.add(arrow);
      }
      ctx.addMesh(group);

      ctx.addLabel(new THREE.Vector3(0, 0, majorR + 0.5), 'B \\cdot 2\\pi r = \\mu_0 NI');

      return {};
    }
  },

  // ── 8.9 Parallel Wires ────────────────────────────────────────────
  {
    id: 'parallel-wires',
    title: '8.9 Two Parallel Wires',
    description: 'Two parallel current-carrying wires exert forces on each other. Parallel currents attract; antiparallel currents repel.',
    equations: [
      { label: 'Force per Length', latex: '\\frac{F}{L} = \\frac{\\mu_0 I_1 I_2}{2\\pi d}', derivation: [
        { step: 'Wire 1 creates field at wire 2 (distance $d$)', latex: 'B_1 = \\frac{\\mu_0 I_1}{2\\pi d}' },
        { step: 'Force on wire 2 per unit length in field $B_1$', latex: '\\frac{F}{L} = I_2 B_1' },
        { step: 'Substitute expression for $B_1$', latex: '\\frac{F}{L} = \\frac{\\mu_0 I_1 I_2}{2\\pi d}' },
        { step: 'Direction depends on current orientation', latex: '\\text{Parallel} \\Rightarrow \\text{attract},\\quad \\text{antiparallel} \\Rightarrow \\text{repel}' }
      ]}
    ],
    sliders: [
      { id: 'I1', label: 'Current I₁', min: -10, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'I2', label: 'Current I₂', min: -10, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'd', label: 'Separation d', min: 1, max: 6, default: 3, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { I1, I2, d } = ctx.params;
      const p1 = new THREE.Vector3(-d / 2, 0, 0);
      const p2 = new THREE.Vector3(d / 2, 0, 0);

      createRod(ctx, { length: 8, radius: 0.06, color: 0xccaa44, axis: 'y', position: p1 });
      createRod(ctx, { length: 8, radius: 0.06, color: 0xccaa44, axis: 'y', position: p2 });

      const i1Label = I1 >= 0 ? `I_1=${I1}` : `I_1=${I1}`;
      const i2Label = I2 >= 0 ? `I_2=${I2}` : `I_2=${I2}`;
      ctx.addLabel(p1.clone().add(new THREE.Vector3(0, 4.5, 0)), i1Label);
      ctx.addLabel(p2.clone().add(new THREE.Vector3(0, 4.5, 0)), i2Label);

      const currentArrow1 = new THREE.ArrowHelper(
        new THREE.Vector3(0, I1 >= 0 ? 1 : -1, 0), p1.clone().add(new THREE.Vector3(0, 2, 0.3)),
        1.5, 0xffaa22, 0.15, 0.08
      );
      const currentArrow2 = new THREE.ArrowHelper(
        new THREE.Vector3(0, I2 >= 0 ? 1 : -1, 0), p2.clone().add(new THREE.Vector3(0, 2, 0.3)),
        1.5, 0xffaa22, 0.15, 0.08
      );
      ctx.addMesh(currentArrow1);
      ctx.addMesh(currentArrow2);

      const fieldFn1 = (pos) => {
        const shifted = pos.clone().sub(p1);
        return straightWireB(I1)(shifted);
      };
      const fieldFn2 = (pos) => {
        const shifted = pos.clone().sub(p2);
        return straightWireB(I2)(shifted);
      };

      const bGroup = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        for (const [wire, fn, col] of [[p1, fieldFn1, 0x44ddff], [p2, fieldFn2, 0xff8844]]) {
          const rr = 1;
          const pos = wire.clone().add(new THREE.Vector3(rr * Math.cos(a), 0, rr * Math.sin(a)));
          const B = fn(pos);
          const mag = B.length();
          if (mag < 0.005) continue;
          const len = Math.min(mag * 0.6, 0.6);
          bGroup.add(new THREE.ArrowHelper(B.clone().normalize(), pos, len, col, len * 0.3, len * 0.15));
        }
      }
      ctx.addMesh(bGroup);

      const attractive = I1 * I2 > 0;
      const FperL = Math.abs(I1 * I2) / (2 * Math.PI * d);
      const forceLen = Math.min(FperL * 0.5, 1.5);

      if (FperL > 0.01) {
        const f1Dir = attractive ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
        const f2Dir = attractive ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);

        const f1Arrow = new THREE.ArrowHelper(f1Dir, p1.clone().add(new THREE.Vector3(0, -1, 0)), forceLen, 0xff4444, 0.15, 0.08);
        const f2Arrow = new THREE.ArrowHelper(f2Dir, p2.clone().add(new THREE.Vector3(0, -1, 0)), forceLen, 0xff4444, 0.15, 0.08);
        ctx.addMesh(f1Arrow);
        ctx.addMesh(f2Arrow);
        ctx.addLabel(p1.clone().add(new THREE.Vector3(attractive ? 1.5 : -1.5, -1.3, 0)), '\\vec{F}_1');
        ctx.addLabel(p2.clone().add(new THREE.Vector3(attractive ? -1.5 : 1.5, -1.3, 0)), '\\vec{F}_2');
      }

      const sepLine = new THREE.BufferGeometry().setFromPoints([
        p1.clone().add(new THREE.Vector3(0, -2, 0)),
        p2.clone().add(new THREE.Vector3(0, -2, 0))
      ]);
      ctx.addMesh(new THREE.Line(sepLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })));
      ctx.addLabel(new THREE.Vector3(0, -2.4, 0), `d=${d}`);

      return {};
    }
  }
];
