import * as THREE from 'three';
import { uniformField, createArrowField, createEquipotentialPlane, createCylinderShell, createSphere, magnitudeToColor } from '../fieldViz.js';

function makePlate(ctx, width, height, thickness, position, color) {
  const geo = new THREE.BoxGeometry(width, thickness, height);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

function radialField(lambda, axis = 'y') {
  return (p) => {
    const rPerp = axis === 'y'
      ? new THREE.Vector3(p.x, 0, p.z)
      : new THREE.Vector3(p.x, p.y, 0);
    const r = rPerp.length();
    if (r < 0.08) return new THREE.Vector3();
    return rPerp.normalize().multiplyScalar(lambda / r);
  };
}

function sphericalRadialField(Q) {
  return (p) => {
    const r = p.length();
    if (r < 0.08) return new THREE.Vector3();
    return p.clone().normalize().multiplyScalar(Q / (r * r));
  };
}

export default [
  // ── 5.1 Parallel-Plate Capacitor ──────────────────────────────────
  {
    id: 'parallel-plate',
    title: '5.1 Parallel-Plate Capacitor',
    description: 'Two parallel conducting plates with equal and opposite surface charge density ±σ create a nearly uniform electric field between them.',
    equations: [
      { label: 'Electric Field', latex: 'E = \\frac{\\sigma}{\\varepsilon_0}' },
      {
        label: 'Capacitance', latex: 'C = \\frac{\\varepsilon_0 A}{d}',
        derivation: [
          { step: 'Uniform $E$ field between plates', latex: 'E = \\frac{\\sigma}{\\varepsilon_0}' },
          { step: 'Voltage across plates', latex: 'V = Ed = \\frac{\\sigma d}{\\varepsilon_0}' },
          { step: 'Express $\\sigma$ in terms of $Q$', latex: 'Q = \\sigma A \\implies V = \\frac{Qd}{\\varepsilon_0 A}' },
          { step: 'Capacitance $C = Q/V$', latex: 'C = \\frac{Q}{V} = \\frac{\\varepsilon_0 A}{d}' }
        ]
      }
    ],
    sliders: [
      { id: 'd', label: 'Separation d', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' },
      { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'C/m²' },
      { id: 'plateSize', label: 'Plate Size', min: 2, max: 6, default: 4, step: 0.5, unit: 'm' }
    ],
    toggles: [
      { id: 'showField', label: 'E Field Arrows', default: true }
    ],
    setup(ctx) {
      const { d, sigma, plateSize } = ctx.params;
      const half = d / 2;

      makePlate(ctx, plateSize, plateSize, 0.08, new THREE.Vector3(-half, 0, 0), 0xff5566);
      makePlate(ctx, plateSize, plateSize, 0.08, new THREE.Vector3(half, 0, 0), 0x5588ff);

      ctx.addLabel(new THREE.Vector3(-half - 0.4, plateSize / 2 + 0.3, 0), '+\\sigma');
      ctx.addLabel(new THREE.Vector3(half + 0.4, plateSize / 2 + 0.3, 0), '-\\sigma');

      if (ctx.toggles.showField) {
        const E = sigma;
        const fieldFn = (p) => {
          if (p.x > -half && p.x < half &&
              Math.abs(p.y) < plateSize / 2 && Math.abs(p.z) < plateSize / 2) {
            return new THREE.Vector3(E, 0, 0);
          }
          return new THREE.Vector3();
        };
        const pHalf = plateSize / 2 - 0.3;
        createArrowField(ctx, fieldFn, {
          bounds: [[-half + 0.3, half - 0.3], [-pHalf, pHalf], [-pHalf, pHalf]],
          step: Math.max(1, d / 3),
          scale: 0.2, maxMag: 6, maxLength: 0.9
        });
      }

      const mid = new THREE.Vector3(0, 0, 0);
      ctx.addLabel(mid.clone().add(new THREE.Vector3(0, -plateSize / 2 - 0.95, 0)), '\\vec{E}');

      const dLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, -plateSize / 2 - 0.2, 0),
        new THREE.Vector3(half, -plateSize / 2 - 0.2, 0)
      ]);
      ctx.addMesh(new THREE.Line(dLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa })));
      ctx.addLabel(new THREE.Vector3(0, -plateSize / 2 - 0.45, 0), `d=${d}`);

      const Vline = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, plateSize / 2 + 0.2, 0),
        new THREE.Vector3(half, plateSize / 2 + 0.2, 0)
      ]);
      ctx.addMesh(new THREE.Line(Vline, new THREE.LineBasicMaterial({ color: 0x44ff88 })));
      ctx.addLabel(new THREE.Vector3(0, plateSize / 2 + 0.5, 0), `V = Ed`);

      return {};
    }
  },

  // ── 5.2 Cylindrical Capacitor ─────────────────────────────────────
  {
    id: 'cylindrical-capacitor',
    title: '5.2 Cylindrical Capacitor',
    description: 'Two coaxial conducting cylinders of radii a and b, with linear charge density ±λ. The electric field between them falls off as 1/r.',
    equations: [
      { label: 'E between cylinders', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}' },
      {
        label: 'Capacitance', latex: 'C = \\frac{2\\pi\\varepsilon_0 L}{\\ln(b/a)}',
        derivation: [
          { step: '$E$ from Gauss\'s law for cylindrical symmetry (3.8)', latex: 'E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}', ref: 'cyl-shell-gauss' },
          { step: 'Integrate $E$ from $a$ to $b$ for voltage', latex: 'V = \\int_a^b \\frac{\\lambda}{2\\pi\\varepsilon_0 r}\\,dr = \\frac{\\lambda}{2\\pi\\varepsilon_0}\\ln\\!\\left(\\frac{b}{a}\\right)' },
          { step: 'Total charge on inner cylinder', latex: 'Q = \\lambda L' },
          { step: 'Capacitance $C = Q/V$', latex: 'C = \\frac{Q}{V} = \\frac{2\\pi\\varepsilon_0 L}{\\ln(b/a)}' }
        ]
      }
    ],
    sliders: [
      { id: 'a', label: 'Inner radius a', min: 0.3, max: 1.5, default: 0.5, step: 0.1, unit: 'm' },
      { id: 'b', label: 'Outer radius b', min: 1.5, max: 4, default: 3, step: 0.25, unit: 'm' },
      { id: 'lambda', label: 'λ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'C/m' }
    ],
    toggles: [
      { id: 'showField', label: 'E Field Arrows', default: true }
    ],
    setup(ctx) {
      const { a, b, lambda } = ctx.params;
      const cylHeight = 6;

      createCylinderShell(ctx, { radius: a, height: cylHeight, color: 0xff5566, opacity: 0.35 });
      createCylinderShell(ctx, { radius: b, height: cylHeight, color: 0x5588ff, opacity: 0.2 });

      ctx.addLabel(new THREE.Vector3(a + 0.2, cylHeight / 2 + 0.3, 0), 'a');
      ctx.addLabel(new THREE.Vector3(b + 0.2, cylHeight / 2 + 0.3, 0), 'b');

      if (ctx.toggles.showField) {
        const fieldFn = (p) => {
          const rPerp = new THREE.Vector3(p.x, 0, p.z);
          const r = rPerp.length();
          if (r < a + 0.05 || r > b - 0.05) return new THREE.Vector3();
          return rPerp.normalize().multiplyScalar(lambda / r);
        };
        createArrowField(ctx, fieldFn, {
          bounds: [[-b + 0.3, b - 0.3], [-2, 2], [-b + 0.3, b - 0.3]],
          step: 1.2, scale: 0.3, maxMag: lambda / a, maxLength: 1
        });
      }

      const aLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -cylHeight / 2 - 0.3, 0),
        new THREE.Vector3(a, -cylHeight / 2 - 0.3, 0)
      ]);
      ctx.addMesh(new THREE.Line(aLine, new THREE.LineBasicMaterial({ color: 0xff5566 })));

      const bLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -cylHeight / 2 - 0.6, 0),
        new THREE.Vector3(b, -cylHeight / 2 - 0.6, 0)
      ]);
      ctx.addMesh(new THREE.Line(bLine, new THREE.LineBasicMaterial({ color: 0x5588ff })));

      return {};
    }
  },

  // ── 5.3 Spherical Capacitor ───────────────────────────────────────
  {
    id: 'spherical-capacitor',
    title: '5.3 Spherical Capacitor',
    description: 'Two concentric conducting spheres of radii a and b, with charge +Q on the inner and −Q on the outer. The field between them is radial and proportional to 1/r².',
    equations: [
      { label: 'E between spheres', latex: 'E = \\frac{kQ}{r^2}' },
      {
        label: 'Capacitance', latex: 'C = \\frac{4\\pi\\varepsilon_0 ab}{b - a}',
        derivation: [
          { step: 'Radial $E$ between spheres', latex: 'E = \\frac{kQ}{r^2} = \\frac{Q}{4\\pi\\varepsilon_0 r^2}' },
          { step: 'Integrate $E$ from $a$ to $b$ for voltage', latex: 'V = \\int_a^b \\frac{Q}{4\\pi\\varepsilon_0 r^2}\\,dr = \\frac{Q}{4\\pi\\varepsilon_0}\\!\\left(\\frac{1}{a} - \\frac{1}{b}\\right)' },
          { step: 'Simplify the bracket', latex: 'V = \\frac{Q}{4\\pi\\varepsilon_0}\\cdot\\frac{b - a}{ab}' },
          { step: 'Capacitance $C = Q/V$', latex: 'C = \\frac{Q}{V} = \\frac{4\\pi\\varepsilon_0 ab}{b - a}' }
        ]
      }
    ],
    limits: [
      { label: 'b → ∞', slider: 'b', target: 4, annotation: 'Outer shell recedes: C → 4πε₀a, the capacitance of an isolated sphere' }
    ],
    sliders: [
      { id: 'a', label: 'Inner radius a', min: 0.5, max: 2, default: 1, step: 0.1, unit: 'm' },
      { id: 'b', label: 'Outer radius b', min: 2, max: 4, default: 3, step: 0.25, unit: 'm' },
      { id: 'Q', label: 'Charge Q', min: 1, max: 10, default: 5, step: 0.5, unit: 'μC' }
    ],
    toggles: [
      { id: 'showField', label: 'E Field Arrows', default: true }
    ],
    setup(ctx) {
      const { a, b, Q } = ctx.params;

      createSphere(ctx, { radius: a, color: 0xff5566, opacity: 0.3 });
      createSphere(ctx, { radius: b, color: 0x5588ff, opacity: 0.15 });

      ctx.addLabel(new THREE.Vector3(a + 0.2, a + 0.2, 0), 'a');
      ctx.addLabel(new THREE.Vector3(b + 0.2, 0.2, 0), 'b');
      ctx.addLabel(new THREE.Vector3(0, a + 0.4, 0), '+Q');

      if (ctx.toggles.showField) {
        const fieldFn = (p) => {
          const r = p.length();
          if (r < a + 0.1 || r > b - 0.1) return new THREE.Vector3();
          return p.clone().normalize().multiplyScalar(Q / (r * r));
        };
        createArrowField(ctx, fieldFn, {
          bounds: [[-b + 0.5, b - 0.5], [-b + 0.5, b - 0.5], [-b + 0.5, b - 0.5]],
          step: 1.5, scale: 0.15, maxMag: Q / (a * a), maxLength: 1
        });
      }

      return {};
    }
  },

  // ── 5.4 Dielectric Capacitor ──────────────────────────────────────
  {
    id: 'dielectric-capacitor',
    title: '5.4 Dielectric in a Capacitor',
    description: 'Inserting a dielectric (κ > 1) between capacitor plates reduces the internal field by a factor of κ due to polarization of the dielectric material.',
    equations: [
      { label: 'Field without dielectric', latex: 'E_0 = \\frac{\\sigma}{\\varepsilon_0}' },
      { label: 'Field in dielectric', latex: 'E = \\frac{E_0}{\\kappa} = \\frac{\\sigma}{\\kappa\\varepsilon_0}' },
      {
        label: 'Capacitance', latex: 'C = \\kappa\\frac{\\varepsilon_0 A}{d}',
        derivation: [
          { step: 'Free charge creates field', latex: 'E_0 = \\frac{\\sigma}{\\varepsilon_0}' },
          { step: 'Dielectric polarizes, reducing net field', latex: 'E = \\frac{E_0}{\\kappa} = \\frac{\\sigma}{\\kappa\\varepsilon_0}' },
          { step: 'New voltage across plates', latex: 'V = Ed = \\frac{\\sigma d}{\\kappa\\varepsilon_0}' },
          { step: 'New capacitance $C = Q/V$', latex: 'C = \\frac{Q}{V} = \\frac{\\kappa\\varepsilon_0 A}{d} = \\kappa C_0' }
        ]
      }
    ],
    limits: [
      { label: 'κ → 1', slider: 'kappa', target: 1, annotation: 'No dielectric: reduces to vacuum parallel-plate capacitor C = ε₀A/d', ref: 'parallel-plate' }
    ],
    sliders: [
      { id: 'd', label: 'Separation d', min: 1, max: 4, default: 3, step: 0.25, unit: 'm' },
      { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'C/m²' },
      { id: 'kappa', label: 'κ (dielectric)', min: 1, max: 10, default: 3, step: 0.5 }
    ],
    toggles: [
      { id: 'showPolarization', label: 'Polarization arrows', default: true }
    ],
    setup(ctx) {
      const { d, sigma, kappa } = ctx.params;
      const half = d / 2;
      const ps = 4;

      makePlate(ctx, ps, ps, 0.08, new THREE.Vector3(-half, 0, 0), 0xff5566);
      makePlate(ctx, ps, ps, 0.08, new THREE.Vector3(half, 0, 0), 0x5588ff);

      ctx.addLabel(new THREE.Vector3(-half - 0.4, ps / 2 + 0.3, 0), '+\\sigma');
      ctx.addLabel(new THREE.Vector3(half + 0.4, ps / 2 + 0.3, 0), '-\\sigma');

      const dielThick = d * 0.6;
      const dielGeo = new THREE.BoxGeometry(dielThick, ps - 0.2, ps - 0.2);
      const dielMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide
      });
      const dielMesh = new THREE.Mesh(dielGeo, dielMat);
      ctx.addMesh(dielMesh);
      ctx.addLabel(new THREE.Vector3(0, ps / 2 + 0.3, 0), `\\kappa = ${kappa}`);

      const E0 = sigma;
      const Ek = sigma / kappa;
      const dielHalf = dielThick / 2;

      const fieldFn = (p) => {
        if (Math.abs(p.y) > ps / 2 || Math.abs(p.z) > ps / 2) return new THREE.Vector3();
        if (p.x < -half || p.x > half) return new THREE.Vector3();
        if (p.x > -dielHalf && p.x < dielHalf) {
          return new THREE.Vector3(Ek, 0, 0);
        }
        return new THREE.Vector3(E0, 0, 0);
      };

      createArrowField(ctx, fieldFn, {
        bounds: [[-half + 0.2, half - 0.2], [-1.5, 1.5], [-1.5, 1.5]],
        step: 1.2, scale: 0.18, maxMag: E0 + 1, maxLength: 0.9
      });

      ctx.addLabel(new THREE.Vector3(-half + 0.4, -ps / 2 - 0.4, 0), 'E_0');
      ctx.addLabel(new THREE.Vector3(0, -ps / 2 - 0.4, 0), 'E_0/\\kappa');

      if (ctx.toggles.showPolarization) {
        const polGroup = new THREE.Group();
        const polStep = 1.0;
        for (let y = -1.5; y <= 1.5; y += polStep) {
          for (let z = -1.5; z <= 1.5; z += polStep) {
            for (let x = -dielHalf + 0.3; x <= dielHalf - 0.3; x += polStep) {
              const pos = new THREE.Vector3(x, y, z);
              const arrow = new THREE.ArrowHelper(
                new THREE.Vector3(-1, 0, 0), pos, 0.4, 0xff8844, 0.12, 0.06
              );
              arrow.line.material.transparent = true;
              arrow.line.material.opacity = 0.6;
              arrow.cone.material.transparent = true;
              arrow.cone.material.opacity = 0.6;
              polGroup.add(arrow);
            }
          }
        }
        ctx.addMesh(polGroup);
      }

      return {};
    }
  },

  // ── 5.5 Energy Density ────────────────────────────────────────────
  {
    id: 'energy-density',
    title: '5.5 Energy Stored in E Field',
    description: 'The energy stored in a capacitor is distributed throughout the electric field. The energy density u = ε₀E²/2 is uniform between ideal parallel plates.',
    equations: [
      {
        label: 'Energy density', latex: 'u = \\frac{1}{2}\\varepsilon_0 E^2',
        derivation: [
          { step: 'Energy stored in a capacitor', latex: 'U = \\frac{1}{2}CV^2' },
          { step: 'Substitute parallel-plate values', latex: 'C = \\frac{\\varepsilon_0 A}{d},\\quad V = Ed' },
          { step: 'Expand the expression', latex: 'U = \\frac{1}{2}\\frac{\\varepsilon_0 A}{d}(Ed)^2 = \\frac{1}{2}\\varepsilon_0 E^2(Ad)' },
          { step: 'Volume between plates is $Ad$', latex: 'u = \\frac{U}{\\text{Volume}} = \\frac{1}{2}\\varepsilon_0 E^2' }
        ]
      },
      { label: 'Total energy', latex: 'U = u \\cdot \\text{Volume} = \\frac{1}{2}CV^2' }
    ],
    sliders: [
      { id: 'sigma', label: 'σ', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'C/m²' },
      { id: 'd', label: 'Separation d', min: 0.5, max: 4, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [
      { id: 'showField', label: 'E Field Arrows', default: true }
    ],
    setup(ctx) {
      const { sigma, d } = ctx.params;
      const half = d / 2;
      const ps = 4;

      makePlate(ctx, ps, ps, 0.08, new THREE.Vector3(-half, 0, 0), 0xff5566);
      makePlate(ctx, ps, ps, 0.08, new THREE.Vector3(half, 0, 0), 0x5588ff);

      const E = sigma;
      const u = 0.5 * E * E;
      const maxU = 0.5 * 5 * 5;
      const t = Math.min(u / maxU, 1);

      const energyGeo = new THREE.BoxGeometry(d - 0.1, ps - 0.2, ps - 0.2);
      const energyColor = new THREE.Color();
      energyColor.setHSL(0.08, 0.9, 0.3 + t * 0.4);
      const energyMat = new THREE.MeshPhongMaterial({
        color: energyColor, transparent: true, opacity: 0.15 + t * 0.25,
        emissive: energyColor, emissiveIntensity: t * 0.4
      });
      const energyMesh = new THREE.Mesh(energyGeo, energyMat);
      ctx.addMesh(energyMesh);

      if (ctx.toggles.showField) {
        const fieldFn = (p) => {
          if (p.x > -half && p.x < half &&
              Math.abs(p.y) < ps / 2 && Math.abs(p.z) < ps / 2) {
            return new THREE.Vector3(E, 0, 0);
          }
          return new THREE.Vector3();
        };
        createArrowField(ctx, fieldFn, {
          bounds: [[-half + 0.3, half - 0.3], [-1.5, 1.5], [-1.5, 1.5]],
          step: 1.2, scale: 0.2, maxMag: 6, maxLength: 0.9
        });
      }

      ctx.addLabel(new THREE.Vector3(0, ps / 2 + 0.4, 0), `u = \\tfrac{1}{2}\\varepsilon_0 E^2`);
      ctx.addLabel(new THREE.Vector3(0, -ps / 2 - 0.4, 0), `E = ${E.toFixed(1)}`);

      const vol = d * ps * ps;
      const U = u * vol;
      ctx.addLabel(new THREE.Vector3(0, -ps / 2 - 0.9, 0), `U = ${U.toFixed(1)}`);

      return {};
    }
  }
];
