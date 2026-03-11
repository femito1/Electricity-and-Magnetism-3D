import * as THREE from 'three';

// ─── Circuit drawing helpers ────────────────────────────────────────

function wirePath(points) {
  return points.map(p => Array.isArray(p) ? new THREE.Vector3(p[0], 0, p[1]) : p);
}

function createTube(ctx, path, color = 0xccaa44, radius = 0.04) {
  if (path.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0);
  const geo = new THREE.TubeGeometry(curve, path.length * 6, radius, 8, false);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
  return ctx.addMesh(new THREE.Mesh(geo, mat));
}

function createLineWire(ctx, path, color = 0xccaa44) {
  const geo = new THREE.BufferGeometry().setFromPoints(path);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  return ctx.addMesh(new THREE.Line(geo, mat));
}

function zigzagPath(start, end, segments = 6, amplitude = 0.25) {
  const pts = [];
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const forward = dir.clone().normalize();
  const perp = new THREE.Vector3(0, 1, 0);
  const lateral = new THREE.Vector3().crossVectors(forward, perp).normalize();
  if (lateral.length() < 0.5) lateral.set(0, 0, 1);

  pts.push(start.clone());
  const margin = len * 0.1;
  for (let i = 0; i <= segments; i++) {
    const t = margin + (i / segments) * (len - 2 * margin);
    const sign = (i % 2 === 0) ? 1 : -1;
    const amp = (i === 0 || i === segments) ? 0 : amplitude;
    pts.push(start.clone().addScaledVector(forward, t).addScaledVector(lateral, sign * amp));
  }
  pts.push(end.clone());
  return pts;
}

function batterySymbol(ctx, pos, dir, size = 0.5) {
  const group = new THREE.Group();
  const perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (perp.length() < 0.5) perp.set(0, 0, 1);

  const longLen = size * 0.8;
  const shortLen = size * 0.45;
  const gap = size * 0.15;

  const longGeo = new THREE.BufferGeometry().setFromPoints([
    pos.clone().addScaledVector(dir, -gap).addScaledVector(perp, -longLen / 2),
    pos.clone().addScaledVector(dir, -gap).addScaledVector(perp, longLen / 2)
  ]);
  group.add(new THREE.Line(longGeo, new THREE.LineBasicMaterial({ color: 0xff5566, linewidth: 3 })));

  const shortGeo = new THREE.BufferGeometry().setFromPoints([
    pos.clone().addScaledVector(dir, gap).addScaledVector(perp, -shortLen / 2),
    pos.clone().addScaledVector(dir, gap).addScaledVector(perp, shortLen / 2)
  ]);
  group.add(new THREE.Line(shortGeo, new THREE.LineBasicMaterial({ color: 0x5588ff, linewidth: 3 })));

  return ctx.addMesh(group);
}

function capacitorSymbol(ctx, pos, dir, size = 0.5) {
  const group = new THREE.Group();
  const perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (perp.length() < 0.5) perp.set(0, 0, 1);
  const gap = size * 0.12;
  const len = size * 0.6;

  for (const sign of [-1, 1]) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      pos.clone().addScaledVector(dir, sign * gap).addScaledVector(perp, -len / 2),
      pos.clone().addScaledVector(dir, sign * gap).addScaledVector(perp, len / 2)
    ]);
    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xccaa44, linewidth: 3 })));
  }
  return ctx.addMesh(group);
}

function createCurrentDots(ctx, path, count = 12) {
  const dots = [];
  const mat = new THREE.MeshPhongMaterial({ color: 0x44ff88, emissive: 0x44ff88, emissiveIntensity: 0.5 });
  const geo = new THREE.SphereGeometry(0.06, 8, 8);
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(path[0]);
    ctx.addMesh(mesh);
    dots.push(mesh);
  }
  return dots;
}

function moveDots(dots, path, time, speed = 1) {
  const totalLen = pathLength(path);
  const count = dots.length;
  for (let i = 0; i < count; i++) {
    const frac = ((time * speed + i / count) % 1 + 1) % 1;
    const pos = samplePath(path, frac * totalLen);
    dots[i].position.copy(pos);
  }
}

function pathLength(path) {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += path[i].distanceTo(path[i - 1]);
  return len;
}

function samplePath(path, dist) {
  let accum = 0;
  for (let i = 1; i < path.length; i++) {
    const seg = path[i].distanceTo(path[i - 1]);
    if (accum + seg >= dist) {
      const t = (dist - accum) / seg;
      return path[i - 1].clone().lerp(path[i], t);
    }
    accum += seg;
  }
  return path[path.length - 1].clone();
}

function resistorBlock(ctx, pos, label, color = 0xdd8844) {
  const geo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  ctx.addMesh(mesh);
  if (label) ctx.addLabel(pos.clone().add(new THREE.Vector3(0, 0.35, 0)), label);
}

export default [
  // ── 6.1 Simple Circuit ────────────────────────────────────────────
  {
    id: 'simple-circuit',
    title: '6.1 Simple DC Circuit',
    description: 'A battery drives current through a single resistor. By Ohm\'s law, current I = V/R flows around the loop.',
    equations: [
      { label: "Ohm's Law", latex: 'V = IR' }
    ],
    sliders: [
      { id: 'V', label: 'Voltage V', min: 1, max: 12, default: 6, step: 0.5, unit: 'V' },
      { id: 'R', label: 'Resistance R', min: 1, max: 20, default: 10, step: 1, unit: 'Ω' }
    ],
    toggles: [],
    setup(ctx) {
      const { V, R } = ctx.params;
      const I = V / R;

      const loop = wirePath([
        [-3, -2], [-3, 2], [3, 2], [3, -2], [-3, -2]
      ]);

      createLineWire(ctx, loop, 0xccaa44);

      batterySymbol(ctx, new THREE.Vector3(-3, 0, 0), new THREE.Vector3(0, 0, 1), 0.8);
      ctx.addLabel(new THREE.Vector3(-3.7, 0, 0), `V=${V}\\text{V}`);

      const rPos = new THREE.Vector3(3, 0, 0);
      resistorBlock(ctx, rPos, `R=${R}\\Omega`);

      ctx.addLabel(new THREE.Vector3(0, 0, 2.5), `I = V/R = ${I.toFixed(2)}\\text{A}`);

      const arrowDir = new THREE.Vector3(0, 0, 1);
      const arrow = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, -2.3), 0.6, 0x44ff88, 0.15, 0.08);
      ctx.addMesh(arrow);
      ctx.addLabel(new THREE.Vector3(0.4, 0, -2), 'I');

      const dots = createCurrentDots(ctx, loop, 16);

      return { dots, loop, speed: I * 0.3 };
    },
    animate(state, ctx) {
      if (!state.dots) return;
      moveDots(state.dots, state.loop, ctx.time, state.speed);
    }
  },

  // ── 6.2 Series & Parallel Resistors ───────────────────────────────
  {
    id: 'series-parallel',
    title: '6.2 Series & Parallel Resistors',
    description: 'Resistors in series add directly; in parallel, their reciprocals add. Toggle between configurations to see how equivalent resistance changes.',
    equations: [
      { label: 'Series', latex: 'R_{eq} = R_1 + R_2 + R_3', derivation: [
        { step: 'Same current flows through all series resistors', latex: 'I_1 = I_2 = I_3 = I' },
        { step: 'Total voltage is the sum of individual drops', latex: 'V = V_1 + V_2 + V_3' },
        { step: 'Apply Ohm\'s law to each resistor', latex: 'V = IR_1 + IR_2 + IR_3 = I(R_1 + R_2 + R_3)' },
        { step: 'Equivalent resistance carries the same current at total voltage', latex: 'V = IR_{eq}' },
        { step: 'Therefore', latex: 'R_{eq} = R_1 + R_2 + R_3' }
      ] },
      { label: 'Parallel', latex: '\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}', derivation: [
        { step: 'Same voltage across all parallel resistors', latex: 'V_1 = V_2 = V_3 = V' },
        { step: 'Total current is the sum of branch currents', latex: 'I = I_1 + I_2 + I_3' },
        { step: 'Apply Ohm\'s law to each branch', latex: 'I = \\frac{V}{R_1} + \\frac{V}{R_2} + \\frac{V}{R_3} = V\\left(\\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}\\right)' },
        { step: 'Equivalent resistance draws the same total current', latex: 'I = \\frac{V}{R_{eq}}' },
        { step: 'Therefore', latex: '\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}' }
      ] }
    ],
    sliders: [
      { id: 'R1', label: 'R₁', min: 1, max: 20, default: 5, step: 1, unit: 'Ω' },
      { id: 'R2', label: 'R₂', min: 1, max: 20, default: 10, step: 1, unit: 'Ω' },
      { id: 'R3', label: 'R₃', min: 1, max: 20, default: 15, step: 1, unit: 'Ω' }
    ],
    toggles: [
      { id: 'series', label: 'Series', default: true },
      { id: 'parallel', label: 'Parallel', default: false }
    ],
    setup(ctx) {
      const { R1, R2, R3 } = ctx.params;
      const isSeries = ctx.toggles.series;

      if (isSeries) {
        const loop = wirePath([
          [-4, -2], [-4, 2], [4, 2], [4, -2], [-4, -2]
        ]);
        createLineWire(ctx, loop, 0xccaa44);

        batterySymbol(ctx, new THREE.Vector3(-4, 0, 0), new THREE.Vector3(0, 0, 1), 0.8);
        ctx.addLabel(new THREE.Vector3(-4.7, 0, 0), 'V');

        resistorBlock(ctx, new THREE.Vector3(-1.5, 0, 2), `R_1=${R1}`);
        resistorBlock(ctx, new THREE.Vector3(1.5, 0, 2), `R_2=${R2}`);
        resistorBlock(ctx, new THREE.Vector3(4, 0, 0), `R_3=${R3}`);

        const Req = R1 + R2 + R3;
        ctx.addLabel(new THREE.Vector3(0, 0, -2.5), `R_{eq} = ${Req}\\,\\Omega`);
      } else {
        const yOff = [-1.5, 0, 1.5];
        const mainWire = wirePath([[-4, -2.5], [-4, 2.5], [-2, 2.5]]);
        createLineWire(ctx, mainWire, 0xccaa44);
        const mainWire2 = wirePath([[2, 2.5], [4, 2.5], [4, -2.5], [-4, -2.5]]);
        createLineWire(ctx, mainWire2, 0xccaa44);

        batterySymbol(ctx, new THREE.Vector3(4, 0, 0), new THREE.Vector3(0, 0, -1), 0.8);
        ctx.addLabel(new THREE.Vector3(4.7, 0, 0), 'V');

        const Rs = [R1, R2, R3];
        for (let i = 0; i < 3; i++) {
          const z = yOff[i];
          const branch = wirePath([[-2, 2.5], [-2, z]]);
          const branch2 = wirePath([[-2, z], [2, z]]);
          const branch3 = wirePath([[2, z], [2, 2.5]]);
          createLineWire(ctx, branch, 0xccaa44);
          createLineWire(ctx, branch2, 0xccaa44);
          createLineWire(ctx, branch3, 0xccaa44);
          resistorBlock(ctx, new THREE.Vector3(0, 0, z), `R_${i + 1}=${Rs[i]}`);
        }

        const Req = 1 / (1 / R1 + 1 / R2 + 1 / R3);
        ctx.addLabel(new THREE.Vector3(0, 0, -3), `R_{eq} = ${Req.toFixed(2)}\\,\\Omega`);
      }

      return {};
    }
  },

  // ── 6.3 Kirchhoff's Rules ─────────────────────────────────────────
  {
    id: 'kirchhoff',
    title: "6.3 Kirchhoff's Rules",
    description: "A two-loop circuit illustrating the junction rule (conservation of charge: currents in = currents out) and the loop rule (conservation of energy: voltage drops sum to zero around any closed loop).",
    equations: [
      { label: 'Junction Rule', latex: '\\sum I_{\\text{in}} = \\sum I_{\\text{out}}' },
      { label: 'Loop Rule', latex: '\\sum V = 0 \\text{ (around any loop)}' }
    ],
    sliders: [
      { id: 'V1', label: 'Battery V₁', min: 1, max: 12, default: 10, step: 0.5, unit: 'V' },
      { id: 'V2', label: 'Battery V₂', min: 1, max: 12, default: 6, step: 0.5, unit: 'V' },
      { id: 'R1', label: 'R₁', min: 1, max: 20, default: 4, step: 1, unit: 'Ω' },
      { id: 'R2', label: 'R₂', min: 1, max: 20, default: 8, step: 1, unit: 'Ω' },
      { id: 'R3', label: 'R₃', min: 1, max: 20, default: 6, step: 1, unit: 'Ω' }
    ],
    toggles: [
      { id: 'showLoop1', label: 'Highlight Loop 1', default: true },
      { id: 'showLoop2', label: 'Highlight Loop 2', default: false }
    ],
    setup(ctx) {
      const { V1, V2, R1, R2, R3 } = ctx.params;

      // Two-loop circuit: left loop and right loop sharing a central branch
      //   A ─── R1 ─── B ─── R2 ─── C
      //   |             |             |
      //  V1            R3            V2
      //   |             |             |
      //   D ─────────── E ─────────── F
      const A = new THREE.Vector3(-4, 0, 3);
      const B = new THREE.Vector3(0, 0, 3);
      const C = new THREE.Vector3(4, 0, 3);
      const D = new THREE.Vector3(-4, 0, -3);
      const E = new THREE.Vector3(0, 0, -3);
      const F = new THREE.Vector3(4, 0, -3);

      const segments = [
        [A, B], [B, C], [C, F], [F, E], [E, D], [D, A], [B, E]
      ];
      for (const [s, e] of segments) {
        createLineWire(ctx, [s, e], 0xccaa44);
      }

      resistorBlock(ctx, A.clone().lerp(B, 0.5), `R_1=${R1}\\Omega`);
      resistorBlock(ctx, B.clone().lerp(C, 0.5), `R_2=${R2}\\Omega`);
      resistorBlock(ctx, B.clone().lerp(E, 0.5), `R_3=${R3}\\Omega`);

      batterySymbol(ctx, D.clone().lerp(A, 0.5), new THREE.Vector3(0, 0, 1), 0.8);
      ctx.addLabel(D.clone().lerp(A, 0.5).add(new THREE.Vector3(-0.8, 0, 0)), `V_1=${V1}`);

      batterySymbol(ctx, F.clone().lerp(C, 0.5), new THREE.Vector3(0, 0, 1), 0.8);
      ctx.addLabel(F.clone().lerp(C, 0.5).add(new THREE.Vector3(0.8, 0, 0)), `V_2=${V2}`);

      // Solve for currents (simplified: I1 through R1 left loop, I2 through R2 right loop, I3=I1-I2 through R3)
      // Loop 1: V1 - I1*R1 - I3*R3 = 0 => V1 - I1*R1 - (I1-I2)*R3 = 0
      // Loop 2: -V2 - I2*R2 + I3*R3 = 0 => -V2 - I2*R2 + (I1-I2)*R3 = 0
      const det = (R1 + R3) * (R2 + R3) - R3 * R3;
      const I1 = (V1 * (R2 + R3) + V2 * R3) / det;
      const I2 = (V1 * R3 + V2 * (R1 + R3)) / det;
      const I3 = I1 - I2;

      ctx.addLabel(new THREE.Vector3(-2, 0, 3.7), `I_1=${I1.toFixed(2)}A`);
      ctx.addLabel(new THREE.Vector3(2, 0, 3.7), `I_2=${I2.toFixed(2)}A`);
      ctx.addLabel(new THREE.Vector3(0.7, 0, 0), `I_3=${I3.toFixed(2)}A`);

      // Junction arrows at B
      const junctionArrows = new THREE.Group();
      const addJArr = (origin, dir, color) => {
        const a = new THREE.ArrowHelper(dir.normalize(), origin, 0.6, color, 0.15, 0.08);
        junctionArrows.add(a);
      };
      addJArr(B.clone().add(new THREE.Vector3(-0.8, 0, 0)), new THREE.Vector3(1, 0, 0), 0xff4444);
      addJArr(B.clone().add(new THREE.Vector3(0.1, 0, 0)), new THREE.Vector3(1, 0, 0), 0x44ff44);
      addJArr(B.clone().add(new THREE.Vector3(0, 0, -0.1)), new THREE.Vector3(0, 0, -1), 0x4488ff);
      ctx.addMesh(junctionArrows);
      ctx.addLabel(B.clone().add(new THREE.Vector3(0, 0.5, 0)), '\\sum I_{in}=\\sum I_{out}');

      if (ctx.toggles.showLoop1) {
        const loopPts = [A, B, E, D, A].map(p => p.clone().add(new THREE.Vector3(0, 0.08, 0)));
        const geo = new THREE.BufferGeometry().setFromPoints(loopPts);
        ctx.addMesh(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff8844, linewidth: 2, transparent: true, opacity: 0.6 })));
        ctx.addLabel(new THREE.Vector3(-2, 0.3, 0), '\\text{Loop 1: } \\sum V=0');
      }
      if (ctx.toggles.showLoop2) {
        const loopPts = [B, C, F, E, B].map(p => p.clone().add(new THREE.Vector3(0, 0.08, 0)));
        const geo = new THREE.BufferGeometry().setFromPoints(loopPts);
        ctx.addMesh(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x44ddff, linewidth: 2, transparent: true, opacity: 0.6 })));
        ctx.addLabel(new THREE.Vector3(2, 0.3, 0), '\\text{Loop 2: } \\sum V=0');
      }

      return {};
    }
  },

  // ── 6.4 RC Circuit ────────────────────────────────────────────────
  {
    id: 'rc-circuit',
    title: '6.4 RC Circuit (Charging)',
    description: 'When a capacitor charges through a resistor, charge accumulates exponentially: Q(t) = CV₀(1 − e^{−t/RC}). The time constant τ = RC sets the charging rate.',
    equations: [
      { label: 'Charge', latex: 'Q(t) = CV_0\\left(1 - e^{-t/RC}\\right)', derivation: [
        { step: 'Apply Kirchhoff\'s voltage law around the loop', latex: 'V_0 = IR + \\frac{Q}{C}' },
        { step: 'Substitute $I = dQ/dt$', latex: 'V_0 = R\\frac{dQ}{dt} + \\frac{Q}{C}' },
        { step: 'Rearrange to standard first-order ODE', latex: '\\frac{dQ}{dt} = \\frac{CV_0 - Q}{RC}' },
        { step: 'Solve with initial condition $Q(0) = 0$', latex: 'Q(t) = CV_0\\left(1 - e^{-t/RC}\\right)' },
        { step: 'Define the time constant', latex: '\\tau = RC' }
      ] },
      { label: 'Current', latex: 'I(t) = \\frac{V_0}{R}e^{-t/RC}', derivation: [
        { step: 'Current is the time derivative of charge', latex: 'I(t) = \\frac{dQ}{dt}' },
        { step: 'Differentiate $Q(t) = CV_0(1 - e^{-t/RC})$', latex: 'I(t) = CV_0 \\cdot \\frac{1}{RC}\\,e^{-t/RC}' },
        { step: 'Simplify', latex: 'I(t) = \\frac{V_0}{R}\\,e^{-t/RC}' },
        { step: 'At $t = 0$ the initial current is maximum', latex: 'I(0) = \\frac{V_0}{R} = I_0' },
        { step: 'Current decays exponentially with time constant $\\tau = RC$', latex: 'I(t) = I_0\\,e^{-t/\\tau}' }
      ] }
    ],
    sliders: [
      { id: 'R', label: 'Resistance R', min: 1, max: 20, default: 5, step: 1, unit: 'Ω' },
      { id: 'C', label: 'Capacitance C', min: 1, max: 100, default: 20, step: 5, unit: 'μF' },
      { id: 'V0', label: 'Battery V₀', min: 1, max: 12, default: 6, step: 0.5, unit: 'V' }
    ],
    toggles: [],
    setup(ctx) {
      const { R, C, V0 } = ctx.params;
      const tau = R * C / 1000;

      // Circuit schematic on xz-plane
      const loop = wirePath([
        [-3, -2], [-3, 2], [3, 2], [3, -2], [-3, -2]
      ]);
      createLineWire(ctx, loop, 0xccaa44);

      batterySymbol(ctx, new THREE.Vector3(-3, 0, 0), new THREE.Vector3(0, 0, 1), 0.8);
      ctx.addLabel(new THREE.Vector3(-3.8, 0, 0), `V_0=${V0}`);

      resistorBlock(ctx, new THREE.Vector3(0, 0, 2), `R=${R}\\Omega`);

      capacitorSymbol(ctx, new THREE.Vector3(3, 0, 0), new THREE.Vector3(0, 0, 1), 0.8);
      ctx.addLabel(new THREE.Vector3(3.8, 0, 0), `C=${C}\\mu F`);

      // Graph plane: Q(t) and I(t) plotted as line geometry
      const graphGroup = new THREE.Group();
      const graphW = 5, graphH = 3;
      const graphOrigin = new THREE.Vector3(0, 0.3, -4);

      // Axes
      const xAxis = new THREE.BufferGeometry().setFromPoints([
        graphOrigin.clone(),
        graphOrigin.clone().add(new THREE.Vector3(graphW, 0, 0))
      ]);
      graphGroup.add(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0xaaaaaa })));

      const yAxis = new THREE.BufferGeometry().setFromPoints([
        graphOrigin.clone(),
        graphOrigin.clone().add(new THREE.Vector3(0, graphH, 0))
      ]);
      graphGroup.add(new THREE.Line(yAxis, new THREE.LineBasicMaterial({ color: 0xaaaaaa })));

      ctx.addLabel(graphOrigin.clone().add(new THREE.Vector3(graphW + 0.3, -0.2, 0)), 't');
      ctx.addLabel(graphOrigin.clone().add(new THREE.Vector3(-0.3, graphH + 0.2, 0)), 'Q,I');

      const maxT = 5 * tau;
      const Qmax = C / 1000 * V0;
      const I0 = V0 / R;
      const steps = 80;

      const qPts = [], iPts = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * maxT;
        const x = (t / maxT) * graphW;
        const Q = Qmax * (1 - Math.exp(-t / tau));
        const Icur = I0 * Math.exp(-t / tau);
        qPts.push(graphOrigin.clone().add(new THREE.Vector3(x, (Q / Qmax) * graphH * 0.9, 0)));
        iPts.push(graphOrigin.clone().add(new THREE.Vector3(x, (Icur / I0) * graphH * 0.9, 0)));
      }

      const qGeo = new THREE.BufferGeometry().setFromPoints(qPts);
      graphGroup.add(new THREE.Line(qGeo, new THREE.LineBasicMaterial({ color: 0x44ddff })));

      const iGeo = new THREE.BufferGeometry().setFromPoints(iPts);
      graphGroup.add(new THREE.Line(iGeo, new THREE.LineBasicMaterial({ color: 0xff8844 })));

      ctx.addMesh(graphGroup);

      ctx.addLabel(graphOrigin.clone().add(new THREE.Vector3(graphW + 0.2, graphH * 0.85, 0)), 'Q(t)');
      ctx.addLabel(graphOrigin.clone().add(new THREE.Vector3(graphW + 0.2, graphH * 0.1, 0)), 'I(t)');

      // Tau marker
      const tauX = (tau / maxT) * graphW;
      const tauLine = new THREE.BufferGeometry().setFromPoints([
        graphOrigin.clone().add(new THREE.Vector3(tauX, 0, 0)),
        graphOrigin.clone().add(new THREE.Vector3(tauX, graphH, 0))
      ]);
      graphGroup.add(new THREE.Line(tauLine, new THREE.LineBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0.5 })));
      ctx.addLabel(graphOrigin.clone().add(new THREE.Vector3(tauX, -0.3, 0)), '\\tau=RC');

      // Animated current dots
      const dots = createCurrentDots(ctx, loop, 14);

      return { dots, loop, tau, time: 0 };
    },
    animate(state, ctx) {
      if (!state.dots) return;
      const cyclePeriod = state.tau * 8;
      const t = ctx.time % cyclePeriod;
      const frac = t / cyclePeriod;
      const currentScale = Math.exp(-frac * 5);
      moveDots(state.dots, state.loop, ctx.time, currentScale * 0.5);

      for (const dot of state.dots) {
        dot.scale.setScalar(0.5 + currentScale * 0.8);
      }
    }
  }
];
