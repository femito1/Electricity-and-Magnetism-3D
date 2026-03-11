import * as THREE from 'three';
import { uniformField, createArrowField, createRing, createWire, magnitudeToColor } from '../fieldViz.js';

function createPhasorDiagram(ctx, origin, radius) {
  const group = new THREE.Group();
  const circPts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    circPts.push(new THREE.Vector3(origin.x + radius * Math.cos(a), origin.y + radius * Math.sin(a), origin.z));
  }
  const circGeo = new THREE.BufferGeometry().setFromPoints(circPts);
  group.add(new THREE.Line(circGeo, new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 })));

  const xAxis = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(origin.x - radius * 1.2, origin.y, origin.z),
    new THREE.Vector3(origin.x + radius * 1.2, origin.y, origin.z)
  ]);
  const yAxis = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(origin.x, origin.y - radius * 1.2, origin.z),
    new THREE.Vector3(origin.x, origin.y + radius * 1.2, origin.z)
  ]);
  group.add(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));
  group.add(new THREE.Line(yAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

  ctx.addMesh(group);
  return group;
}

function createSineWave(ctx, origin, width, amplitude, color, phase, omega, numPts = 100) {
  const pts = [];
  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * width;
    const y = amplitude * Math.sin(omega * t + phase);
    pts.push(new THREE.Vector3(origin.x + t, origin.y + y, origin.z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
  ctx.addMesh(line);
  return line;
}

function updateSineWave(line, origin, width, amplitude, phase, omega, time, numPts = 100) {
  const pts = [];
  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * width;
    const y = amplitude * Math.sin(omega * t + phase + omega * time);
    pts.push(new THREE.Vector3(origin.x + t, origin.y + y, origin.z));
  }
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
}

export default [
  // ── 10.1 AC Resistor ──────────────────────────────────────────────
  {
    id: 'ac-resistor',
    title: '10.1 AC Resistor',
    description: 'In a purely resistive AC circuit, current and voltage are in phase. The phasor diagram shows both vectors rotating together.',
    equations: [
      { label: 'Voltage', latex: 'V = V_0 \\sin(\\omega t)' },
      {
        label: 'Current', latex: 'I = \\frac{V_0}{R} \\sin(\\omega t)',
        derivation: [
          { step: 'Applied voltage', latex: 'V(t) = V_0 \\sin(\\omega t)' },
          { step: 'Ohm\'s law', latex: 'I(t) = \\frac{V(t)}{R} = \\frac{V_0}{R}\\sin(\\omega t)' },
          { step: 'Current is in phase with voltage', latex: '\\Delta\\phi = 0' },
          { step: 'Peak current', latex: 'I_0 = \\frac{V_0}{R}' }
        ]
      }
    ],
    sliders: [
      { id: 'V0', label: 'Voltage V₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'V' },
      { id: 'R', label: 'Resistance R', min: 0.5, max: 5, default: 2, step: 0.5, unit: 'Ω' },
      { id: 'omega', label: 'Frequency ω', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'rad/s' }
    ],
    toggles: [],
    setup(ctx) {
      const { V0, R, omega } = ctx.params;
      const I0 = V0 / R;

      const phasorOrigin = new THREE.Vector3(-4, 2.5, 0);
      const phasorR = 1.5;
      createPhasorDiagram(ctx, phasorOrigin, phasorR);
      ctx.addLabel(phasorOrigin.clone().add(new THREE.Vector3(-1.1, phasorR + 0.45, 0)), 'Phasor');

      const vPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), phasorOrigin, phasorR, 0xff4444, 0.15, 0.08
      );
      const iPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), phasorOrigin, phasorR * I0 / V0, 0x44ddff, 0.15, 0.08
      );
      ctx.addMesh(vPhasor);
      ctx.addMesh(iPhasor);

      const waveOrigin = new THREE.Vector3(-3, -2, 0);
      const waveW = 8;
      const vWave = createSineWave(ctx, waveOrigin, waveW, 1.5, 0xff4444, 0, omega);
      const iWave = createSineWave(ctx, waveOrigin, waveW, 1.5 * I0 / V0, 0x44ddff, 0, omega);

      const xAxis = new THREE.BufferGeometry().setFromPoints([
        waveOrigin, new THREE.Vector3(waveOrigin.x + waveW, waveOrigin.y, 0)
      ]);
      ctx.addMesh(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

      ctx.addLabel(waveOrigin.clone().add(new THREE.Vector3(waveW + 0.3, 0, 0)), 't');
      ctx.addLabel(waveOrigin.clone().add(new THREE.Vector3(-0.3, 1.5, 0)), 'V');
      ctx.addLabel(waveOrigin.clone().add(new THREE.Vector3(-0.3, -1.5, 0)), 'I');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x + phasorR + 0.3, phasorOrigin.y + 0.3, 0), 'V');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x + phasorR + 0.3, phasorOrigin.y - 0.3, 0), 'I');

      return { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, I0 };
    },
    animate(state, ctx) {
      const { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, I0 } = state;
      const { time, params } = ctx;
      const { omega } = params;

      const angle = omega * time;
      vPhasor.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      iPhasor.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));

      updateSineWave(vWave, waveOrigin, waveW, 1.5, 0, omega, time);
      updateSineWave(iWave, waveOrigin, waveW, 1.5 * I0 / V0, 0, omega, time);
    }
  },

  // ── 10.2 AC Capacitor ─────────────────────────────────────────────
  {
    id: 'ac-capacitor',
    title: '10.2 AC Capacitor',
    description: 'In a purely capacitive AC circuit, current leads voltage by 90°. The capacitor charges/discharges ahead of the voltage waveform.',
    equations: [
      {
        label: 'Capacitor Current', latex: 'I = \\omega C V_0 \\cos(\\omega t)',
        derivation: [
          { step: 'Applied voltage', latex: 'V(t) = V_0 \\sin(\\omega t)' },
          { step: 'Charge and current relation', latex: 'Q = CV \\;\\Rightarrow\\; I = \\frac{dQ}{dt} = C\\frac{dV}{dt}' },
          { step: 'Differentiate voltage', latex: 'I(t) = C V_0 \\omega \\cos(\\omega t) = C V_0 \\omega \\sin\\!\\left(\\omega t + \\frac{\\pi}{2}\\right)' },
          { step: 'Current leads voltage by 90°', latex: '\\Delta\\phi = +\\frac{\\pi}{2}' },
          { step: 'Capacitive reactance', latex: 'X_C = \\frac{1}{\\omega C},\\quad I_0 = \\frac{V_0}{X_C}' }
        ]
      }
    ],
    sliders: [
      { id: 'V0', label: 'Voltage V₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'V' },
      { id: 'C', label: 'Capacitance C', min: 0.1, max: 2, default: 0.5, step: 0.1, unit: 'F' },
      { id: 'omega', label: 'Frequency ω', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'rad/s' }
    ],
    toggles: [],
    setup(ctx) {
      const { V0, C, omega } = ctx.params;
      const I0 = omega * C * V0;

      const phasorOrigin = new THREE.Vector3(-4, 2.5, 0);
      const phasorR = 1.5;
      createPhasorDiagram(ctx, phasorOrigin, phasorR);
      ctx.addLabel(phasorOrigin.clone().add(new THREE.Vector3(0, phasorR + 0.4, 0)), 'Phasor');

      const vPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), phasorOrigin, phasorR, 0xff4444, 0.15, 0.08
      );
      const iScale = Math.min(I0 / V0, 1);
      const iPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0), phasorOrigin, phasorR * iScale, 0x44ddff, 0.15, 0.08
      );
      ctx.addMesh(vPhasor);
      ctx.addMesh(iPhasor);

      const waveOrigin = new THREE.Vector3(-3, -2, 0);
      const waveW = 8;
      const vWave = createSineWave(ctx, waveOrigin, waveW, 1.5, 0xff4444, 0, omega);
      const iWave = createSineWave(ctx, waveOrigin, waveW, 1.5 * iScale, Math.PI / 2, omega);

      const xAxis = new THREE.BufferGeometry().setFromPoints([
        waveOrigin, new THREE.Vector3(waveOrigin.x + waveW, waveOrigin.y, 0)
      ]);
      ctx.addMesh(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

      ctx.addLabel(new THREE.Vector3(waveOrigin.x + waveW + 0.3, waveOrigin.y, 0), 't');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x + phasorR + 0.4, phasorOrigin.y, 0), 'V');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x + 0.95, phasorOrigin.y + phasorR + 0.15, 0), 'I\\,(leads)');

      return { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, iScale };
    },
    animate(state, ctx) {
      const { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, iScale } = state;
      const { time, params } = ctx;
      const { omega } = params;

      const angle = omega * time;
      vPhasor.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      iPhasor.setDirection(new THREE.Vector3(Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2), 0));

      updateSineWave(vWave, waveOrigin, waveW, 1.5, 0, omega, time);
      updateSineWave(iWave, waveOrigin, waveW, 1.5 * iScale, Math.PI / 2, omega, time);
    }
  },

  // ── 10.3 AC Inductor ──────────────────────────────────────────────
  {
    id: 'ac-inductor',
    title: '10.3 AC Inductor',
    description: 'In a purely inductive AC circuit, current lags voltage by 90°. The inductor\'s back-EMF opposes changes in current.',
    equations: [
      {
        label: 'Inductor Current', latex: 'I = \\frac{V_0}{\\omega L} \\sin\\left(\\omega t - \\frac{\\pi}{2}\\right)',
        derivation: [
          { step: 'Applied voltage', latex: 'V(t) = V_0 \\sin(\\omega t)' },
          { step: 'Inductor voltage relation', latex: 'V = L\\frac{dI}{dt} \\;\\Rightarrow\\; \\frac{dI}{dt} = \\frac{V_0}{L}\\sin(\\omega t)' },
          { step: 'Integrate to find current', latex: 'I(t) = -\\frac{V_0}{\\omega L}\\cos(\\omega t) = \\frac{V_0}{\\omega L}\\sin\\!\\left(\\omega t - \\frac{\\pi}{2}\\right)' },
          { step: 'Current lags voltage by 90°', latex: '\\Delta\\phi = -\\frac{\\pi}{2}' },
          { step: 'Inductive reactance', latex: 'X_L = \\omega L,\\quad I_0 = \\frac{V_0}{X_L}' }
        ]
      }
    ],
    sliders: [
      { id: 'V0', label: 'Voltage V₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'V' },
      { id: 'L', label: 'Inductance L', min: 0.5, max: 5, default: 2, step: 0.5, unit: 'H' },
      { id: 'omega', label: 'Frequency ω', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'rad/s' }
    ],
    toggles: [],
    setup(ctx) {
      const { V0, L, omega } = ctx.params;
      const I0 = V0 / (omega * L);

      const phasorOrigin = new THREE.Vector3(-4, 2.5, 0);
      const phasorR = 1.5;
      createPhasorDiagram(ctx, phasorOrigin, phasorR);
      ctx.addLabel(phasorOrigin.clone().add(new THREE.Vector3(0, phasorR + 0.4, 0)), 'Phasor');

      const vPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), phasorOrigin, phasorR, 0xff4444, 0.15, 0.08
      );
      const iScale = Math.min(I0 / V0, 1);
      const iPhasor = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0), phasorOrigin, phasorR * iScale, 0x44ddff, 0.15, 0.08
      );
      ctx.addMesh(vPhasor);
      ctx.addMesh(iPhasor);

      const waveOrigin = new THREE.Vector3(-3, -2, 0);
      const waveW = 8;
      const vWave = createSineWave(ctx, waveOrigin, waveW, 1.5, 0xff4444, 0, omega);
      const iWave = createSineWave(ctx, waveOrigin, waveW, 1.5 * iScale, -Math.PI / 2, omega);

      const xAxis = new THREE.BufferGeometry().setFromPoints([
        waveOrigin, new THREE.Vector3(waveOrigin.x + waveW, waveOrigin.y, 0)
      ]);
      ctx.addMesh(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

      ctx.addLabel(new THREE.Vector3(waveOrigin.x + waveW + 0.3, waveOrigin.y, 0), 't');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x + phasorR + 0.4, phasorOrigin.y, 0), 'V');
      ctx.addLabel(new THREE.Vector3(phasorOrigin.x, phasorOrigin.y - phasorR - 0.3, 0), 'I (lags)');

      return { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, iScale };
    },
    animate(state, ctx) {
      const { vPhasor, iPhasor, vWave, iWave, phasorOrigin, phasorR, waveOrigin, waveW, V0, iScale } = state;
      const { time, params } = ctx;
      const { omega } = params;

      const angle = omega * time;
      vPhasor.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      iPhasor.setDirection(new THREE.Vector3(Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2), 0));

      updateSineWave(vWave, waveOrigin, waveW, 1.5, 0, omega, time);
      updateSineWave(iWave, waveOrigin, waveW, 1.5 * iScale, -Math.PI / 2, omega, time);
    }
  },

  // ── 10.4 RLC Circuit ──────────────────────────────────────────────
  {
    id: 'rlc-circuit',
    title: '10.4 Series RLC Circuit',
    description: 'A series RLC circuit has impedance Z that depends on frequency. At resonance (ω = 1/√(LC)), inductive and capacitive reactances cancel, leaving only R.',
    equations: [
      {
        label: 'Impedance', latex: 'Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}',
        derivation: [
          { step: 'Phasor voltages', latex: 'V_R = IR,\\quad V_L = IX_L\\;(\\text{leads }90°),\\quad V_C = IX_C\\;(\\text{lags }90°)' },
          { step: 'Total voltage (phasor sum)', latex: 'V_0 = I\\sqrt{R^2 + (X_L - X_C)^2}' },
          { step: 'Impedance', latex: 'Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}' },
          { step: 'Phase angle', latex: '\\tan\\phi = \\frac{X_L - X_C}{R} = \\frac{\\omega L - \\frac{1}{\\omega C}}{R}' },
          { step: 'Resonance condition', latex: 'X_L = X_C \\;\\Rightarrow\\; \\omega_0 = \\frac{1}{\\sqrt{LC}},\\quad Z_{\\min} = R' }
        ]
      }
    ],
    sliders: [
      { id: 'R', label: 'Resistance R', min: 0.5, max: 5, default: 2, step: 0.5, unit: 'Ω' },
      { id: 'L', label: 'Inductance L', min: 0.5, max: 5, default: 2, step: 0.5, unit: 'H' },
      { id: 'C', label: 'Capacitance C', min: 0.1, max: 2, default: 0.5, step: 0.1, unit: 'F' },
      { id: 'omega', label: 'Frequency ω', min: 0.2, max: 5, default: 1, step: 0.1, unit: 'rad/s' },
      { id: 'V0', label: 'Voltage V₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'V' }
    ],
    toggles: [],
    setup(ctx) {
      const { R, L, C, omega, V0 } = ctx.params;
      const XL = omega * L;
      const XC = 1 / (omega * C);
      const Z = Math.sqrt(R * R + (XL - XC) * (XL - XC));
      const I0 = V0 / Z;
      const phi = Math.atan2(XL - XC, R);

      const phasorOrigin = new THREE.Vector3(0, 1, 0);
      const scale = 1.2;
      createPhasorDiagram(ctx, phasorOrigin, 3);

      const VR = I0 * R;
      const VL = I0 * XL;
      const VC = I0 * XC;

      const vrArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), phasorOrigin,
        VR * scale, 0x44ff44, 0.12, 0.06
      );
      ctx.addMesh(vrArrow);

      const vrTip = phasorOrigin.clone().add(new THREE.Vector3(VR * scale, 0, 0));
      const vlArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0), vrTip,
        VL * scale, 0xff4444, 0.12, 0.06
      );
      ctx.addMesh(vlArrow);

      const vcArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0), vrTip,
        VC * scale, 0x4488ff, 0.12, 0.06
      );
      ctx.addMesh(vcArrow);

      const vTotalDir = new THREE.Vector3(VR, VL - VC, 0).normalize();
      const vTotalMag = Math.sqrt(VR * VR + (VL - VC) * (VL - VC));
      const vtArrow = new THREE.ArrowHelper(
        vTotalDir, phasorOrigin, vTotalMag * scale, 0xffaa22, 0.15, 0.08
      );
      ctx.addMesh(vtArrow);

      ctx.addLabel(phasorOrigin.clone().add(new THREE.Vector3(VR * scale / 2, -0.4, 0)), 'V_R');
      ctx.addLabel(vrTip.clone().add(new THREE.Vector3(0.3, VL * scale / 2, 0)), 'V_L');
      ctx.addLabel(vrTip.clone().add(new THREE.Vector3(0.3, -VC * scale / 2, 0)), 'V_C');
      ctx.addLabel(phasorOrigin.clone().add(vTotalDir.clone().multiplyScalar(vTotalMag * scale + 0.5)), 'V_{total}');

      ctx.addLabel(new THREE.Vector3(-4.5, -2, 0), `Z = ${Z.toFixed(2)}\\,\\Omega`);
      ctx.addLabel(new THREE.Vector3(-4.5, -2.8, 0), `\\phi = ${(phi * 180 / Math.PI).toFixed(1)}°`);

      const omegaRes = 1 / Math.sqrt(L * C);
      ctx.addLabel(new THREE.Vector3(-4.5, -3.6, 0), `\\omega_0 = ${omegaRes.toFixed(2)}`);

      const waveOrigin = new THREE.Vector3(-3, -5.5, 0);
      const waveW = 7;
      const vWave = createSineWave(ctx, waveOrigin, waveW, 1.0, 0xffaa22, 0, omega);
      const iWave = createSineWave(ctx, waveOrigin, waveW, 1.0 * I0 / V0, -phi, omega);

      const xAxis = new THREE.BufferGeometry().setFromPoints([
        waveOrigin, new THREE.Vector3(waveOrigin.x + waveW, waveOrigin.y, 0)
      ]);
      ctx.addMesh(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

      return {
        vrArrow, vlArrow, vcArrow, vtArrow,
        vWave, iWave, phasorOrigin, waveOrigin, waveW,
        VR, VL, VC, scale, I0, V0, phi
      };
    },
    animate(state, ctx) {
      const {
        vrArrow, vlArrow, vcArrow, vtArrow,
        vWave, iWave, phasorOrigin, waveOrigin, waveW,
        VR, VL, VC, scale, I0, V0, phi
      } = state;
      const { time, params } = ctx;
      const { omega } = params;

      const angle = omega * time;

      const vrDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
      vrArrow.setDirection(vrDir);

      const vrTip = phasorOrigin.clone().add(vrDir.clone().multiplyScalar(VR * scale));
      vlArrow.position.copy(vrTip);
      const vlDir = new THREE.Vector3(Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2), 0);
      vlArrow.setDirection(vlDir);

      vcArrow.position.copy(vrTip);
      const vcDir = new THREE.Vector3(Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2), 0);
      vcArrow.setDirection(vcDir);

      const vtDir = new THREE.Vector3(
        VR * Math.cos(angle) + (VL - VC) * Math.cos(angle + Math.PI / 2),
        VR * Math.sin(angle) + (VL - VC) * Math.sin(angle + Math.PI / 2),
        0
      ).normalize();
      vtArrow.setDirection(vtDir);

      updateSineWave(vWave, waveOrigin, waveW, 1.0, 0, omega, time);
      updateSineWave(iWave, waveOrigin, waveW, 1.0 * I0 / V0, -phi, omega, time);
    }
  },

  // ── 10.5 Displacement Current ─────────────────────────────────────
  {
    id: 'displacement-current',
    title: '10.5 Displacement Current',
    description: 'Between the plates of a charging capacitor, the changing electric field produces a displacement current J_d = ε₀ dE/dt that generates a magnetic field, just like a real current.',
    equations: [
      {
        label: 'Ampère-Maxwell', latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 \\varepsilon_0 \\frac{d\\Phi_E}{dt}',
        derivation: [
          { step: 'No conduction current between plates', latex: 'I_{\\text{cond}} = 0 \\;\\text{(in the gap)}' },
          { step: 'Changing $E$ field produces flux change', latex: '\\frac{d\\Phi_E}{dt} = \\frac{dE}{dt} \\cdot A' },
          { step: 'Maxwell\'s displacement current', latex: 'I_d = \\varepsilon_0 \\frac{d\\Phi_E}{dt}' },
          { step: 'Substitute $E = Q/(\\varepsilon_0 A)$', latex: 'I_d = \\varepsilon_0 \\frac{d}{dt}\\!\\left(\\frac{Q}{\\varepsilon_0 A}\\right)\\!A = \\frac{dQ}{dt} = I' },
          { step: 'Displacement current equals conduction current', latex: 'I_d = I_{\\text{cond}}' }
        ]
      }
    ],
    sliders: [
      { id: 'plateR', label: 'Plate Radius', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' },
      { id: 'I0', label: 'Current I₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' }
    ],
    toggles: [],
    setup(ctx) {
      const { plateR, I0 } = ctx.params;
      const gap = 2;

      const plateGeo = new THREE.CylinderGeometry(plateR, plateR, 0.1, 32);
      const plateMat = new THREE.MeshPhongMaterial({ color: 0x888888, metalness: 0.6, transparent: true, opacity: 0.6 });
      const topPlate = new THREE.Mesh(plateGeo, plateMat);
      topPlate.position.set(0, gap / 2, 0);
      ctx.addMesh(topPlate);
      const botPlate = new THREE.Mesh(plateGeo.clone(), plateMat.clone());
      botPlate.position.set(0, -gap / 2, 0);
      ctx.addMesh(botPlate);

      const wirePts1 = [];
      for (let y = gap / 2; y <= gap / 2 + 3; y += 0.2) wirePts1.push(new THREE.Vector3(0, y, 0));
      createWire(ctx, { path: wirePts1, radius: 0.04, color: 0xccaa44 });
      const wirePts2 = [];
      for (let y = -gap / 2 - 3; y <= -gap / 2; y += 0.2) wirePts2.push(new THREE.Vector3(0, y, 0));
      createWire(ctx, { path: wirePts2, radius: 0.04, color: 0xccaa44 });

      const eGroup = new THREE.Group();
      const eArrows = [];
      const numE = 5;
      for (let i = 0; i < numE; i++) {
        for (let j = 0; j < numE; j++) {
          const x = -plateR * 0.6 + (i / (numE - 1)) * plateR * 1.2;
          const z = -plateR * 0.6 + (j / (numE - 1)) * plateR * 1.2;
          if (x * x + z * z > plateR * plateR * 0.8) continue;
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(x, -gap / 2 + 0.2, z),
            gap * 0.35, 0xff4444, 0.1, 0.06
          );
          eArrows.push(arrow);
          eGroup.add(arrow);
        }
      }
      ctx.addMesh(eGroup);
      ctx.addLabel(new THREE.Vector3(plateR + 0.3, 0, 0), '\\vec{E}');

      const bGroup = new THREE.Group();
      const bArrows = [];
      const numB = 8;
      for (const r of [plateR * 0.4, plateR * 0.8]) {
        for (let i = 0; i < numB; i++) {
          const a = (i / numB) * Math.PI * 2;
          const pos = new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a));
          const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
          const arrow = new THREE.ArrowHelper(tangent, pos, 0.4, 0x44ddff, 0.1, 0.06);
          bArrows.push(arrow);
          bGroup.add(arrow);
        }
      }
      ctx.addMesh(bGroup);
      ctx.addLabel(new THREE.Vector3(0, 0, plateR + 0.5), '\\vec{B}');
      ctx.addLabel(new THREE.Vector3(-plateR - 0.5, 0, 0), 'J_d');
      ctx.addLabel(new THREE.Vector3(0, gap / 2 + 1, 0), 'dE/dt');

      return { eArrows, bArrows, gap };
    },
    animate(state, ctx) {
      const eArrows = Array.isArray(state?.eArrows) ? state.eArrows : [];
      const bArrows = Array.isArray(state?.bArrows) ? state.bArrows : [];
      const gap = Number.isFinite(state?.gap) ? state.gap : 2;
      const { time, params } = ctx;
      const { I0 } = params;

      const omega = 1.5;
      // Couple visualization strength to source current amplitude.
      const iScale = Math.max(0.2, I0 / 5); // default I0=5 -> scale 1
      const charging = iScale * Math.sin(omega * time);
      const dEdt = iScale * Math.cos(omega * time);

      for (const arrow of eArrows) {
        const len = Math.abs(charging) * gap * 0.35 + 0.05;
        const dir = charging >= 0 ? 1 : -1;
        arrow.setDirection(new THREE.Vector3(0, dir, 0));
        arrow.setLength(len, len * 0.25, len * 0.12);
        const t = Math.abs(charging);
        arrow.setColor(new THREE.Color().setHSL(0.0, 0.8, 0.4 + t * 0.2));
      }

      const bMag = Math.abs(dEdt);
      const bDir = dEdt >= 0 ? 1 : -1;
      for (const arrow of bArrows) {
        const pos = arrow.position;
        const a = Math.atan2(pos.z, pos.x);
        const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(bDir);
        const len = bMag * 0.4 + 0.05;
        arrow.setDirection(tangent.normalize());
        arrow.setLength(len, len * 0.25, len * 0.12);
        arrow.setColor(new THREE.Color().setHSL(0.55, 0.8, 0.3 + bMag * 0.3));
      }
    }
  },

  // ── 10.6 EM Wave ──────────────────────────────────────────────────
  {
    id: 'em-wave',
    title: '10.6 Electromagnetic Wave',
    description: 'An electromagnetic wave consists of oscillating E and B fields perpendicular to each other and to the propagation direction, traveling at c = 1/√(μ₀ε₀).',
    equations: [
      {
        label: 'Speed of Light', latex: 'c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}}',
        derivation: [
          { step: 'Faraday\'s law', latex: '\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}' },
          { step: 'Ampère-Maxwell law (vacuum)', latex: '\\nabla \\times \\vec{B} = \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}' },
          { step: 'Take curl of Faraday, substitute Ampère-Maxwell', latex: '\\nabla \\times (\\nabla \\times \\vec{E}) = -\\mu_0 \\varepsilon_0 \\frac{\\partial^2 \\vec{E}}{\\partial t^2}' },
          { step: 'Wave equation', latex: '\\frac{\\partial^2 E}{\\partial x^2} = \\mu_0 \\varepsilon_0 \\frac{\\partial^2 E}{\\partial t^2}' },
          { step: 'Wave speed', latex: 'c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}}' },
          { step: 'Plane-wave solution', latex: 'E = E_0 \\cos(kx - \\omega t),\\quad k = \\frac{\\omega}{c}' }
        ]
      },
      { label: 'E-B Relation', latex: 'E = cB' }
    ],
    sliders: [
      { id: 'wavelength', label: 'Wavelength λ', min: 1, max: 10, default: 4, step: 0.5, unit: 'm' },
      { id: 'amplitude', label: 'Amplitude', min: 0.5, max: 3, default: 1.5, step: 0.25, unit: '' }
    ],
    toggles: [],
    setup(ctx) {
      const { wavelength, amplitude } = ctx.params;
      const k = (2 * Math.PI) / wavelength;
      const numArrows = 40;
      const zMin = -8, zMax = 8;

      const eGroup = new THREE.Group();
      const bGroup = new THREE.Group();
      const eArrows = [];
      const bArrows = [];

      for (let i = 0; i < numArrows; i++) {
        const z = zMin + (i / (numArrows - 1)) * (zMax - zMin);

        const eArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, z),
          0.01, 0xff4444, 0.08, 0.04
        );
        eArrows.push({ arrow: eArrow, z });
        eGroup.add(eArrow);

        const bArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, z),
          0.01, 0x4488ff, 0.08, 0.04
        );
        bArrows.push({ arrow: bArrow, z });
        bGroup.add(bArrow);
      }
      ctx.addMesh(eGroup);
      ctx.addMesh(bGroup);

      const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, zMin - 1), new THREE.Vector3(0, 0, zMax + 1)
      ]);
      ctx.addMesh(new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.4 })));

      const propArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, zMax + 0.5), 1.5, 0xffaa22, 0.2, 0.1
      );
      ctx.addMesh(propArrow);

      ctx.addLabel(new THREE.Vector3(0, amplitude + 0.5, 0), '\\vec{E}');
      ctx.addLabel(new THREE.Vector3(amplitude + 0.5, 0, 0), '\\vec{B}');
      ctx.addLabel(new THREE.Vector3(0, 0, zMax + 2.5), 'c');
      ctx.addLabel(new THREE.Vector3(0, -0.5, wavelength / 2), '\\lambda');

      return { eArrows, bArrows, k, amplitude };
    },
    animate(state, ctx) {
      const { eArrows, bArrows, k, amplitude } = state;
      const { time } = ctx;
      const omega = 2;

      for (let i = 0; i < eArrows.length; i++) {
        const { arrow: eArrow, z } = eArrows[i];
        const { arrow: bArrow } = bArrows[i];

        const val = amplitude * Math.sin(k * z - omega * time);

        const eLen = Math.abs(val);
        if (eLen > 0.02) {
          const eDir = val >= 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
          eArrow.setDirection(eDir);
          eArrow.setLength(eLen, eLen * 0.15, eLen * 0.08);
          eArrow.visible = true;
        } else {
          eArrow.visible = false;
        }

        const bLen = Math.abs(val);
        if (bLen > 0.02) {
          const bDir = val >= 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
          bArrow.setDirection(bDir);
          bArrow.setLength(bLen, bLen * 0.15, bLen * 0.08);
          bArrow.visible = true;
        } else {
          bArrow.visible = false;
        }
      }
    }
  },

  // ── 10.7 Poynting Vector ──────────────────────────────────────────
  {
    id: 'poynting-vector',
    title: '10.7 Poynting Vector',
    description: 'The Poynting vector S = E×B/μ₀ represents the energy flux (power per unit area) of an electromagnetic wave, pointing in the propagation direction.',
    equations: [
      {
        label: 'Poynting Vector', latex: '\\vec{S} = \\frac{1}{\\mu_0} \\vec{E} \\times \\vec{B}',
        derivation: [
          { step: 'EM energy density', latex: 'u = \\frac{1}{2}\\varepsilon_0 E^2 + \\frac{B^2}{2\\mu_0}' },
          { step: 'Energy flux from Maxwell\'s equations', latex: '\\vec{S} = \\frac{1}{\\mu_0}(\\vec{E} \\times \\vec{B})' },
          { step: 'Time-averaged magnitude (plane wave)', latex: '\\langle S \\rangle = \\frac{E_0 B_0}{2\\mu_0}' },
          { step: 'Substitute $B_0 = E_0/c$', latex: '\\langle S \\rangle = \\frac{E_0^2}{2\\mu_0 c}' }
        ]
      }
    ],
    sliders: [
      { id: 'wavelength', label: 'Wavelength λ', min: 1, max: 10, default: 4, step: 0.5, unit: 'm' },
      { id: 'amplitude', label: 'Amplitude', min: 0.5, max: 3, default: 1.5, step: 0.25, unit: '' }
    ],
    toggles: [],
    setup(ctx) {
      const { wavelength, amplitude } = ctx.params;
      const k = (2 * Math.PI) / wavelength;
      const numArrows = 30;
      const zMin = -6, zMax = 6;

      const eGroup = new THREE.Group();
      const bGroupMesh = new THREE.Group();
      const sGroup = new THREE.Group();
      const eArrows = [], bArrows = [], sArrows = [];

      for (let i = 0; i < numArrows; i++) {
        const z = zMin + (i / (numArrows - 1)) * (zMax - zMin);

        const eArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, z), 0.01, 0xff4444, 0.06, 0.03
        );
        eArrows.push({ arrow: eArrow, z });
        eGroup.add(eArrow);

        const bArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, z), 0.01, 0x4488ff, 0.06, 0.03
        );
        bArrows.push({ arrow: bArrow, z });
        bGroupMesh.add(bArrow);
      }

      const sCount = 10;
      for (let i = 0; i < sCount; i++) {
        const z = zMin + (i / (sCount - 1)) * (zMax - zMin);
        const sArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, -amplitude - 0.5, z), 0.01, 0xffaa22, 0.12, 0.06
        );
        sArrows.push({ arrow: sArrow, z });
        sGroup.add(sArrow);
      }

      ctx.addMesh(eGroup);
      ctx.addMesh(bGroupMesh);
      ctx.addMesh(sGroup);

      const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, zMin - 1), new THREE.Vector3(0, 0, zMax + 1)
      ]);
      ctx.addMesh(new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.4 })));

      ctx.addLabel(new THREE.Vector3(0, amplitude + 0.5, 0), '\\vec{E}');
      ctx.addLabel(new THREE.Vector3(amplitude + 0.5, 0, 0), '\\vec{B}');
      ctx.addLabel(new THREE.Vector3(0, -amplitude - 1.2, zMax + 0.5), '\\vec{S} = \\frac{\\vec{E} \\times \\vec{B}}{\\mu_0}');

      return { eArrows, bArrows, sArrows, k, amplitude };
    },
    animate(state, ctx) {
      const { eArrows, bArrows, sArrows, k, amplitude } = state;
      const { time } = ctx;
      const omega = 2;

      for (let i = 0; i < eArrows.length; i++) {
        const { arrow: eArrow, z } = eArrows[i];
        const { arrow: bArrow } = bArrows[i];
        const val = amplitude * Math.sin(k * z - omega * time);
        const absVal = Math.abs(val);

        if (absVal > 0.02) {
          eArrow.setDirection(val >= 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0));
          eArrow.setLength(absVal, absVal * 0.12, absVal * 0.06);
          eArrow.visible = true;

          bArrow.setDirection(val >= 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0));
          bArrow.setLength(absVal, absVal * 0.12, absVal * 0.06);
          bArrow.visible = true;
        } else {
          eArrow.visible = false;
          bArrow.visible = false;
        }
      }

      for (const { arrow: sArrow, z } of sArrows) {
        const val = amplitude * Math.sin(k * z - omega * time);
        const sMag = val * val;
        const len = sMag * 0.5 + 0.02;
        sArrow.setLength(len, len * 0.25, len * 0.12);
        const t = Math.min(sMag / (amplitude * amplitude), 1);
        sArrow.setColor(new THREE.Color().setHSL(0.08, 0.9, 0.35 + t * 0.3));
      }
    }
  }
];
