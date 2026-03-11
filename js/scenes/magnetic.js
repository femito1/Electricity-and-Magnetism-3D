import * as THREE from 'three';
import { uniformField, createArrowField, createRing, createRod, createWire, magnitudeToColor } from '../fieldViz.js';

function bFieldArrows(ctx, dir, mag, opts = {}) {
  const {
    bounds = [[-3, 3], [-3, 3], [-3, 3]],
    step = 2, color = 0x4488ff, opacity = 0.3
  } = opts;
  const group = new THREE.Group();
  const d = dir.clone().normalize();
  const [xr, yr, zr] = bounds;
  for (let x = xr[0]; x <= xr[1]; x += step) {
    for (let y = yr[0]; y <= yr[1]; y += step) {
      for (let z = zr[0]; z <= zr[1]; z += step) {
        const pos = new THREE.Vector3(x, y, z);
        const len = mag * 0.3;
        const arrow = new THREE.ArrowHelper(d, pos, len, color, len * 0.3, len * 0.15);
        arrow.line.material.transparent = true;
        arrow.line.material.opacity = opacity;
        arrow.cone.material.transparent = true;
        arrow.cone.material.opacity = opacity;
        group.add(arrow);
      }
    }
  }
  return ctx.addMesh(group);
}

function createParticle(ctx, pos, charge, radius = 0.15) {
  const color = charge > 0 ? 0xff5566 : 0x5588ff;
  const geo = new THREE.SphereGeometry(radius, 12, 12);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  ctx.addMesh(mesh);
  return mesh;
}

function vectorArrow(ctx, origin, dir, length, color, label) {
  if (length < 0.01) return null;
  const arrow = new THREE.ArrowHelper(dir.clone().normalize(), origin, length, color, length * 0.25, length * 0.12);
  ctx.addMesh(arrow);
  if (label) {
    ctx.addLabel(origin.clone().add(dir.clone().normalize().multiplyScalar(length + 0.3)), label);
  }
  return arrow;
}

export default [
  // ── 7.1 Charged Particle in B Field ───────────────────────────────
  {
    id: 'charged-particle-b',
    title: '7.1 Charged Particle in B Field',
    description: 'A charged particle moving perpendicular to a uniform magnetic field follows a circular path. A velocity component parallel to B produces helical motion.',
    equations: [
      { label: 'Lorentz Force', latex: '\\vec{F} = q\\vec{v} \\times \\vec{B}' },
      { label: 'Cyclotron radius', latex: 'r = \\frac{mv}{qB}', derivation: [
        { step: 'For $v \\perp B$, Lorentz force magnitude', latex: 'F = qvB' },
        { step: 'This provides centripetal force', latex: 'qvB = \\frac{mv^2}{r}' },
        { step: 'Solve for cyclotron radius', latex: 'r = \\frac{mv}{qB}' },
        { step: 'Period of circular orbit', latex: 'T = \\frac{2\\pi r}{v} = \\frac{2\\pi m}{qB}' },
        { step: 'Cyclotron frequency', latex: '\\omega = \\frac{2\\pi}{T} = \\frac{qB}{m}' }
      ] }
    ],
    sliders: [
      { id: 'charge', label: 'Charge q', min: 0.5, max: 5, default: 1, step: 0.5, unit: 'C' },
      { id: 'mass', label: 'Mass m', min: 0.5, max: 5, default: 1, step: 0.5, unit: 'kg' },
      { id: 'v0', label: 'v⊥', min: 1, max: 5, default: 2, step: 0.25, unit: 'm/s' },
      { id: 'B', label: 'B', min: 0.5, max: 5, default: 1, step: 0.25, unit: 'T' },
      { id: 'vParallel', label: 'v∥ (helical)', min: 0, max: 3, default: 0, step: 0.25, unit: 'm/s' }
    ],
    toggles: [
      { id: 'showTrail', label: 'Show Trail', default: true }
    ],
    setup(ctx) {
      const { charge, mass, v0, B, vParallel } = ctx.params;
      const r = mass * v0 / (charge * B);
      const omega = charge * B / mass;

      bFieldArrows(ctx, new THREE.Vector3(0, 1, 0), B, {
        bounds: [[-4, 4], [-3, 3], [-4, 4]], step: 2.5, opacity: 0.2
      });
      ctx.addLabel(new THREE.Vector3(4, 3.5, 0), '\\vec{B}');

      const trailPts = [];
      const totalT = 2 * Math.PI / omega * 3;
      const dtStep = 0.02;
      for (let t = 0; t <= totalT; t += dtStep) {
        const x = r * Math.cos(omega * t);
        const z = r * Math.sin(omega * t);
        const y = vParallel * t;
        trailPts.push(new THREE.Vector3(x, y - totalT * vParallel / 2, z));
      }

      const particle = createParticle(ctx, trailPts[0], charge);

      let trailLine = null;
      if (ctx.toggles.showTrail && trailPts.length >= 2) {
        const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
        trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
          color: 0xffaa44, transparent: true, opacity: 0.5
        }));
        ctx.addMesh(trailLine);
      }

      ctx.addLabel(new THREE.Vector3(r + 0.5, 0, 0), `r = \\frac{mv}{qB} = ${r.toFixed(2)}`);

      const vArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), trailPts[0], 0.8, 0x44ff88, 0.2, 0.1);
      ctx.addMesh(vArrow);
      const bArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), trailPts[0].clone().add(new THREE.Vector3(0.5, 0, 0)), 0.8, 0x4488ff, 0.2, 0.1);
      ctx.addMesh(bArrow);
      const fArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), trailPts[0], 0.8, 0xff4444, 0.2, 0.1);
      ctx.addMesh(fArrow);

      return { particle, trailPts, omega, vArrow, bArrow, fArrow, r, vParallel, totalT };
    },
    animate(state, ctx) {
      if (!state.trailPts || state.trailPts.length === 0) return;
      const period = state.trailPts.length * 0.02;
      const t = ctx.time % (period + 0.5);
      const idx = Math.min(Math.floor(t / 0.02), state.trailPts.length - 1);
      state.particle.position.copy(state.trailPts[idx]);

      const pos = state.trailPts[idx];
      const nextIdx = Math.min(idx + 1, state.trailPts.length - 1);
      if (nextIdx > idx) {
        const vel = new THREE.Vector3().subVectors(state.trailPts[nextIdx], state.trailPts[idx]).normalize();
        state.vArrow.position.copy(pos);
        state.vArrow.setDirection(vel);

        state.bArrow.position.copy(pos.clone().add(new THREE.Vector3(0.3, 0, 0)));

        const F = new THREE.Vector3().crossVectors(vel, new THREE.Vector3(0, 1, 0)).normalize();
        state.fArrow.position.copy(pos);
        state.fArrow.setDirection(F);
      }
    }
  },

  // ── 7.2 Velocity Selector ─────────────────────────────────────────
  {
    id: 'velocity-selector',
    title: '7.2 Velocity Selector',
    description: 'Crossed electric and magnetic fields. When qE = qvB, the electric and magnetic forces cancel and the particle travels in a straight line. Only particles with v = E/B pass through undeflected.',
    equations: [
      { label: 'Selection condition', latex: 'v = \\frac{E}{B}', derivation: [
        { step: 'Electric force on charge', latex: 'F_E = qE' },
        { step: 'Magnetic force on moving charge', latex: 'F_B = qvB' },
        { step: 'For undeflected path, forces balance', latex: 'qE = qvB' },
        { step: 'Solve for selected velocity', latex: 'v = \\frac{E}{B}' },
        { step: 'Result is independent of charge and mass', latex: 'v = \\frac{E}{B} \\quad (\\text{for any } q, m)' }
      ] }
    ],
    sliders: [
      { id: 'E', label: 'Electric Field E', min: 1, max: 10, default: 5, step: 0.5, unit: 'N/C' },
      { id: 'B', label: 'Magnetic Field B', min: 1, max: 10, default: 5, step: 0.5, unit: 'T' },
      { id: 'v', label: 'Particle speed v', min: 0.5, max: 5, default: 1, step: 0.25, unit: 'm/s' }
    ],
    toggles: [],
    setup(ctx) {
      const { E, B, v } = ctx.params;
      const vSelect = E / B;

      // E field horizontal (along +y)
      const eFieldFn = uniformField(new THREE.Vector3(0, 1, 0), E);
      createArrowField(ctx, eFieldFn, {
        bounds: [[-2, 2], [-3, 3], [-2, 2]], step: 2, scale: 0.12,
        maxMag: E + 1, maxLength: 0.8, opacity: 0.3
      });
      ctx.addLabel(new THREE.Vector3(-2.5, 3, 0), '\\vec{E}');

      // B field into screen (along +z) shown as crosses
      bFieldArrows(ctx, new THREE.Vector3(0, 0, 1), B, {
        bounds: [[-2, 2], [-3, 3], [-2, 2]], step: 2.5, color: 0x4488ff, opacity: 0.2
      });
      ctx.addLabel(new THREE.Vector3(2.5, 3, 0), '\\vec{B}\\;(\\text{into page})');

      // Plates (top and bottom)
      const plateGeo = new THREE.BoxGeometry(6, 0.1, 5);
      const topPlate = new THREE.Mesh(plateGeo, new THREE.MeshPhongMaterial({ color: 0xff5566, transparent: true, opacity: 0.3 }));
      topPlate.position.set(0, 3.5, 0);
      ctx.addMesh(topPlate);
      ctx.addLabel(new THREE.Vector3(0, 4, 0), '+\\,\\text{plate}');

      const botPlate = new THREE.Mesh(plateGeo.clone(), new THREE.MeshPhongMaterial({ color: 0x5588ff, transparent: true, opacity: 0.3 }));
      botPlate.position.set(0, -3.5, 0);
      ctx.addMesh(botPlate);
      ctx.addLabel(new THREE.Vector3(0, -4, 0), '-\\,\\text{plate}');

      // Particle trajectory: FE = qE (up), FB = qvB (down if v along x, B along z)
      // Net vertical accel ∝ (E - vB)
      const netForce = E - v * B;
      const trailPts = [];
      const dtStep = 0.03;
      const totalSteps = 200;
      let px = -4, py = 0;
      const vx = v * 2;
      for (let i = 0; i < totalSteps; i++) {
        trailPts.push(new THREE.Vector3(px, py, 0));
        px += vx * dtStep;
        py += netForce * 0.15 * dtStep * i * dtStep;
        if (Math.abs(py) > 3.5 || px > 5) break;
      }

      if (trailPts.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(trailPts);
        const color = Math.abs(netForce) < 0.1 ? 0x44ff88 : 0xff8844;
        ctx.addMesh(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
      }

      const pMesh = createParticle(ctx, trailPts[0], 1, 0.12);
      ctx.addLabel(new THREE.Vector3(-4, 0.5, 0), '\\vec{v}');

      const vSelLabel = Math.abs(v - vSelect) < 0.05
        ? `v = E/B = ${vSelect.toFixed(2)} \\;\\checkmark`
        : `v_{sel} = E/B = ${vSelect.toFixed(2)}`;
      ctx.addLabel(new THREE.Vector3(0, -4.5, 0), vSelLabel);

      return { trailPts, particle: pMesh };
    }
  },

  // ── 7.3 Current-Carrying Wire in B Field ──────────────────────────
  {
    id: 'wire-in-b',
    title: '7.3 Wire in Magnetic Field',
    description: 'A current-carrying wire segment of length L in a uniform magnetic field B experiences a force F = ILB sin θ, where θ is the angle between the current direction and B.',
    equations: [
      { label: 'Force on wire', latex: 'F = ILB\\sin\\theta', derivation: [
        { step: 'Force on a single charge carrier', latex: '\\vec{f} = q\\vec{v}_d \\times \\vec{B}' },
        { step: 'Number of carriers in wire of length $L$', latex: 'N = nAL' },
        { step: 'Total force on all carriers', latex: 'F = Nf = nAL(qv_d B\\sin\\theta)' },
        { step: 'Since current $I = nAqv_d$', latex: 'F = ILB\\sin\\theta' },
        { step: 'Vector form', latex: '\\vec{F} = I\\vec{L} \\times \\vec{B}' }
      ] },
      { label: 'Vector form', latex: '\\vec{F} = I\\vec{L} \\times \\vec{B}' }
    ],
    sliders: [
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'L', label: 'Wire length L', min: 1, max: 5, default: 3, step: 0.25, unit: 'm' },
      { id: 'B', label: 'B field', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'T' },
      { id: 'angle', label: 'Angle θ', min: 0, max: 90, default: 90, step: 5, unit: '°' }
    ],
    toggles: [],
    setup(ctx) {
      const { I, L, B, angle } = ctx.params;
      const theta = angle * Math.PI / 180;

      // B field along +y
      bFieldArrows(ctx, new THREE.Vector3(0, 1, 0), B, {
        bounds: [[-3, 3], [-3, 3], [-3, 3]], step: 2.5, opacity: 0.2
      });
      ctx.addLabel(new THREE.Vector3(3.5, 3, 0), '\\vec{B}');

      // Wire along direction in xz-plane at angle theta from x-axis
      const wireDir = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)).normalize();
      const wireStart = wireDir.clone().multiplyScalar(-L / 2);
      const wireEnd = wireDir.clone().multiplyScalar(L / 2);

      createRod(ctx, {
        length: L, radius: 0.06, color: 0xccaa44, axis: 'x',
        position: new THREE.Vector3()
      });
      if (Math.abs(theta - Math.PI / 2) > 0.01) {
        const rodMesh = ctx.scene.children[ctx.scene.children.length - 1];
        if (rodMesh) rodMesh.rotation.y = -theta + Math.PI / 2;
      }

      // Current direction arrow
      const iArrow = new THREE.ArrowHelper(wireDir, wireStart, L, 0xffaa22, 0.2, 0.1);
      ctx.addMesh(iArrow);
      ctx.addLabel(wireEnd.clone().add(wireDir.clone().multiplyScalar(0.5)), `I=${I}A`);
      ctx.addLabel(new THREE.Vector3(0, -0.5, 0), `L=${L}m`);

      // F = IL×B; L along wireDir, B along y => F = ILBsinθ along (wireDir × ŷ)
      const Fmag = I * L * B * Math.sin(theta);
      const Bvec = new THREE.Vector3(0, 1, 0);
      const Fdir = new THREE.Vector3().crossVectors(wireDir, Bvec).normalize();

      if (Fmag > 0.01) {
        const Flen = Math.min(Fmag * 0.1, 2.5);
        vectorArrow(ctx, new THREE.Vector3(0, 0, 0), Fdir, Flen, 0xff4444, `\\vec{F}`);
        ctx.addLabel(new THREE.Vector3(0, -1.2, 0), `F = ${Fmag.toFixed(2)}\\text{N}`);
      }

      // Angle arc
      if (angle > 0 && angle < 90) {
        const arcPts = [];
        const arcR = 1.2;
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * theta;
          arcPts.push(new THREE.Vector3(arcR * Math.cos(a), 0, arcR * Math.sin(a)));
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
        ctx.addMesh(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xffff44 })));
        const midAngle = theta / 2;
        ctx.addLabel(new THREE.Vector3(1.5 * Math.cos(midAngle), 0, 1.5 * Math.sin(midAngle)), '\\theta');
      }

      return {};
    }
  },

  // ── 7.4 Torque on Current Loop ────────────────────────────────────
  {
    id: 'torque-on-loop',
    title: '7.4 Torque on a Current Loop',
    description: 'A current loop in a uniform magnetic field experiences a torque τ = mB sin θ, where m = NIA is the magnetic dipole moment.',
    equations: [
      { label: 'Magnetic moment', latex: '\\vec{m} = NIA\\hat{n}' },
      { label: 'Torque', latex: '\\vec{\\tau} = \\vec{m} \\times \\vec{B}', derivation: [
        { step: 'Rectangular loop (sides $a$, $b$) in uniform $B$', latex: 'F_{\\text{side}} = IaB \\quad \\text{(on sides of length } a\\text{)}' },
        { step: 'Torque arm for each force-producing side', latex: '\\text{arm} = \\frac{b}{2}\\sin\\theta' },
        { step: 'Total torque from both sides', latex: '\\tau = 2 \\cdot IaB \\cdot \\frac{b}{2}\\sin\\theta = IAB\\sin\\theta' },
        { step: 'Define magnetic moment $m = IA$ (where $A = ab$)', latex: '\\tau = mB\\sin\\theta' },
        { step: 'Vector form', latex: '\\vec{\\tau} = \\vec{m} \\times \\vec{B}' }
      ] },
      { label: 'Magnitude', latex: '\\tau = mB\\sin\\theta' }
    ],
    sliders: [
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'A', label: 'Loop area A', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'm²' },
      { id: 'B', label: 'B field', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'T' },
      { id: 'angle', label: 'Angle θ (m,B)', min: 0, max: 180, default: 45, step: 5, unit: '°' }
    ],
    toggles: [],
    setup(ctx) {
      const { I, A, B, angle } = ctx.params;
      const theta = angle * Math.PI / 180;
      const m = I * A;
      const tauMag = m * B * Math.sin(theta);
      const side = Math.sqrt(A);

      // B field along +x
      bFieldArrows(ctx, new THREE.Vector3(1, 0, 0), B, {
        bounds: [[-4, 4], [-3, 3], [-3, 3]], step: 2.5, opacity: 0.15
      });
      ctx.addLabel(new THREE.Vector3(4.5, 2.5, 0), '\\vec{B}');

      // Rectangular loop: normal tilted at angle theta from +x in the xy-plane
      const normal = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
      const loopRight = new THREE.Vector3(-Math.sin(theta), Math.cos(theta), 0).multiplyScalar(side / 2);
      const loopUp = new THREE.Vector3(0, 0, side / 2);

      const corners = [
        new THREE.Vector3().add(loopRight).add(loopUp),
        new THREE.Vector3().sub(loopRight).add(loopUp),
        new THREE.Vector3().sub(loopRight).sub(loopUp),
        new THREE.Vector3().add(loopRight).sub(loopUp),
        new THREE.Vector3().add(loopRight).add(loopUp)
      ];

      const loopGeo = new THREE.BufferGeometry().setFromPoints(corners);
      ctx.addMesh(new THREE.Line(loopGeo, new THREE.LineBasicMaterial({ color: 0xccaa44, linewidth: 2 })));

      // Fill the loop with a semi-transparent plane
      const loopFillGeo = new THREE.PlaneGeometry(side, side);
      const loopFill = new THREE.Mesh(loopFillGeo, new THREE.MeshPhongMaterial({
        color: 0xccaa44, transparent: true, opacity: 0.1, side: THREE.DoubleSide
      }));
      loopFill.lookAt(normal);
      ctx.addMesh(loopFill);

      // Current direction arrows on loop edges
      for (let i = 0; i < 4; i++) {
        const mid = corners[i].clone().lerp(corners[i + 1], 0.5);
        const dir = new THREE.Vector3().subVectors(corners[i + 1], corners[i]).normalize();
        const arr = new THREE.ArrowHelper(dir, mid, 0.4, 0xffaa22, 0.12, 0.06);
        ctx.addMesh(arr);
      }
      ctx.addLabel(corners[0].clone().add(new THREE.Vector3(0.3, 0.3, 0)), `I=${I}A`);

      // Magnetic moment vector m
      vectorArrow(ctx, new THREE.Vector3(), normal, Math.min(m * 0.3, 2.5), 0x44ff88, '\\vec{m}');

      // Torque vector τ = m × B (along z if m and B are in xy-plane)
      const mVec = normal.clone().multiplyScalar(m);
      const Bvec = new THREE.Vector3(B, 0, 0);
      const tauDir = new THREE.Vector3().crossVectors(mVec, Bvec);
      if (tauDir.length() > 0.01) {
        vectorArrow(ctx, new THREE.Vector3(), tauDir.normalize(), Math.min(tauMag * 0.15, 2), 0xff4444, '\\vec{\\tau}');
      }

      ctx.addLabel(new THREE.Vector3(0, -3, 0), `\\tau = mB\\sin\\theta = ${tauMag.toFixed(2)}\\,\\mathrm{N\\cdot m}`);

      // Angle arc between m and B
      if (angle > 0 && angle < 180) {
        const arcPts = [];
        const arcR = 1.5;
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * theta;
          arcPts.push(new THREE.Vector3(arcR * Math.cos(a), arcR * Math.sin(a), 0));
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
        ctx.addMesh(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xffff44 })));
        const midA = theta / 2;
        ctx.addLabel(new THREE.Vector3(1.8 * Math.cos(midA), 1.8 * Math.sin(midA), 0), '\\theta');
      }

      return {};
    }
  },

  // ── 7.5 Hall Effect ───────────────────────────────────────────────
  {
    id: 'hall-effect',
    title: '7.5 Hall Effect',
    description: 'When a current-carrying conductor is placed in a perpendicular magnetic field, charge carriers are deflected to one side, creating a transverse Hall voltage V_H.',
    equations: [
      { label: 'Hall Voltage', latex: 'V_H = \\frac{IB}{nqd}', derivation: [
        { step: 'Lorentz force deflects carriers', latex: '\\vec{F} = q\\vec{v}_d \\times \\vec{B}' },
        { step: 'Charge buildup creates transverse $E$ field; at equilibrium', latex: 'qE_H = qv_d B \\implies E_H = v_d B' },
        { step: 'Hall voltage across width $w$', latex: 'V_H = E_H \\cdot w = v_d B w' },
        { step: 'Express drift velocity from current ($A = wd$, cross-section)', latex: 'I = nqv_d A = nqv_d(wd) \\implies v_d = \\frac{I}{nqwd}' },
        { step: 'Substitute to get Hall voltage ($w$ cancels)', latex: 'V_H = \\frac{IB}{nqd}' }
      ] }
    ],
    sliders: [
      { id: 'I', label: 'Current I', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' },
      { id: 'B', label: 'B field', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'T' },
      { id: 'n', label: 'Carrier density n', min: 1, max: 10, default: 5, step: 0.5, unit: '×10²⁸/m³' }
    ],
    toggles: [
      { id: 'showCharges', label: 'Show charge buildup', default: true }
    ],
    setup(ctx) {
      const { I, B, n } = ctx.params;
      const d = 1;
      const q = 1;
      const VH = (I * B) / (n * q * d);

      // Conductor slab (along x)
      const slabW = 5, slabH = 0.5, slabD = 2;
      const slabGeo = new THREE.BoxGeometry(slabW, slabH, slabD);
      const slabMat = new THREE.MeshPhongMaterial({
        color: 0x888899, transparent: true, opacity: 0.4, side: THREE.DoubleSide
      });
      ctx.addMesh(new THREE.Mesh(slabGeo, slabMat));

      // Current direction (along +x)
      const iArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(-slabW / 2 - 0.5, 0, 0),
        slabW + 1, 0xffaa22, 0.2, 0.1
      );
      ctx.addMesh(iArrow);
      ctx.addLabel(new THREE.Vector3(0, 0.8, 0), `I = ${I}A`);

      // B field (along +y, upward)
      bFieldArrows(ctx, new THREE.Vector3(0, 1, 0), B, {
        bounds: [[-2, 2], [1, 3], [-1, 1]], step: 2, opacity: 0.25
      });
      ctx.addLabel(new THREE.Vector3(2.5, 3, 0), '\\vec{B}');

      // Force on positive carriers: F = qv×B; v along +x, B along +y => F along -z
      // Positive charges accumulate at -z face, negative at +z face
      const forceDir = new THREE.Vector3(0, 0, -1);
      vectorArrow(ctx, new THREE.Vector3(0, 0, 0), forceDir, 0.8, 0xff4444, '\\vec{F}_B');

      if (ctx.toggles.showCharges) {
        const chargeGroup = new THREE.Group();
        const posGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const posMat = new THREE.MeshPhongMaterial({ color: 0xff5566, emissive: 0xff5566, emissiveIntensity: 0.4 });
        const negMat = new THREE.MeshPhongMaterial({ color: 0x5588ff, emissive: 0x5588ff, emissiveIntensity: 0.4 });

        for (let x = -2; x <= 2; x += 0.8) {
          // Positive charges on -z face
          const pm = new THREE.Mesh(posGeo.clone(), posMat);
          pm.position.set(x, 0, -slabD / 2 - 0.15);
          chargeGroup.add(pm);
          // Negative charges on +z face
          const nm = new THREE.Mesh(posGeo.clone(), negMat);
          nm.position.set(x, 0, slabD / 2 + 0.15);
          chargeGroup.add(nm);
        }
        ctx.addMesh(chargeGroup);
      }

      ctx.addLabel(new THREE.Vector3(0, 0, -slabD / 2 - 0.5), '+');
      ctx.addLabel(new THREE.Vector3(0, 0, slabD / 2 + 0.5), '-');

      // Hall voltage arrow across the slab (along z)
      const vhArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(slabW / 2 + 0.3, 0, -slabD / 2),
        slabD, 0x44ff88, 0.15, 0.08
      );
      ctx.addMesh(vhArrow);
      ctx.addLabel(new THREE.Vector3(slabW / 2 + 0.8, 0, 0), `V_H`);

      ctx.addLabel(new THREE.Vector3(0, -1.5, 0), `V_H = \\frac{IB}{nqd} = ${VH.toFixed(3)}`);

      return {};
    }
  }
];
