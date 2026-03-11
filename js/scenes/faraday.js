import * as THREE from 'three';
import { uniformField, createArrowField, createRing, createSolenoid, createWire, magnitudeToColor } from '../fieldViz.js';

function createCircularArrows(group, center, radius, y, count, color, clockwise = true) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const pos = new THREE.Vector3(
      center.x + radius * Math.cos(a),
      y,
      center.z + radius * Math.sin(a)
    );
    const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    if (clockwise) tangent.negate();
    const arrow = new THREE.ArrowHelper(tangent, pos, 0.4, color, 0.1, 0.06);
    group.add(arrow);
  }
}

export default [
  // ── 9.1 Magnetic Flux ─────────────────────────────────────────────
  {
    id: 'magnetic-flux',
    title: '9.1 Magnetic Flux',
    description: 'Magnetic flux through a loop depends on the angle between the field B and the area normal n̂. Tilting the loop changes Φ = BA cos θ.',
    equations: [
      { label: 'Magnetic Flux', latex: '\\Phi_B = \\int \\vec{B} \\cdot d\\vec{A} = BA\\cos\\theta',
        derivation: [
          { step: 'Define flux as surface integral', latex: '\\Phi_B = \\int_S \\vec{B} \\cdot d\\vec{A}' },
          { step: 'For uniform $B$ and flat surface of area $A$', latex: '\\Phi_B = \\vec{B} \\cdot \\vec{A} = BA\\cos\\theta' },
          { step: 'θ is angle between $B$ and surface normal $\\hat{n}$', latex: '\\cos\\theta = \\frac{\\vec{B} \\cdot \\hat{n}}{B}' },
          { step: 'Max flux when $B \\parallel \\hat{n}$ (θ = 0), zero when $B \\perp \\hat{n}$ (θ = 90°)', latex: '\\Phi_{\\max} = BA,\\quad \\Phi_{\\min} = 0' }
        ] }
    ],
    sliders: [
      { id: 'B', label: 'Field B', min: 1, max: 5, default: 2, step: 0.5, unit: 'T' },
      { id: 'loopR', label: 'Loop Radius', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' },
      { id: 'angle', label: 'Tilt Angle θ', min: 0, max: 90, default: 0, step: 5, unit: '°' }
    ],
    toggles: [],
    setup(ctx) {
      const { B, loopR, angle } = ctx.params;
      const theta = (angle * Math.PI) / 180;

      const fieldFn = uniformField(new THREE.Vector3(0, 1, 0), B);
      createArrowField(ctx, fieldFn, {
        bounds: [[-3, 3], [-2, 3], [-3, 3]], step: 2,
        scale: 0.3, maxMag: B + 1, maxLength: 1.0, opacity: 0.3
      });
      ctx.addLabel(new THREE.Vector3(3.5, 2, 0), '\\vec{B}');

      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(loopR, 0.05, 12, 64);
      const ringMat = new THREE.MeshPhongMaterial({ color: 0xccaa44, emissive: 0xccaa44, emissiveIntensity: 0.2 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringGroup.add(ringMesh);

      const diskGeo = new THREE.CircleGeometry(loopR, 48);
      const diskMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      ringGroup.add(disk);

      ringGroup.rotation.x = theta;
      ctx.addMesh(ringGroup);

      const normalDir = new THREE.Vector3(0, Math.cos(theta), -Math.sin(theta)).normalize();
      const normalArrow = new THREE.ArrowHelper(normalDir, new THREE.Vector3(0, 0, 0), 2, 0x44ff88, 0.2, 0.1);
      ctx.addMesh(normalArrow);
      ctx.addLabel(normalDir.clone().multiplyScalar(2.3), '\\hat{n}');

      const dAPos = new THREE.Vector3(loopR * 0.5 * Math.cos(0.5), 0, loopR * 0.5 * Math.sin(0.5));
      dAPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), theta);
      ctx.addLabel(dAPos.clone().add(new THREE.Vector3(0.3, 0.3, 0)), 'd\\vec{A}');

      const flux = B * Math.PI * loopR * loopR * Math.cos(theta);
      ctx.addLabel(new THREE.Vector3(-3.5, 3, 0), `\\Phi_B = ${flux.toFixed(1)}`);

      return {};
    }
  },

  // ── 9.2 Changing B EMF ────────────────────────────────────────────
  {
    id: 'changing-b-emf',
    title: '9.2 Time-Varying B → EMF',
    description: 'A time-varying magnetic field through a stationary loop induces an EMF and a circulating electric field, as described by Faraday\'s law.',
    equations: [
      { label: "Faraday's Law", latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt}',
        derivation: [
          { step: 'Start with Faraday\'s law', latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt}' },
          { step: 'Fixed loop, $B$ varies: $\\Phi = B(t) \\cdot A$', latex: '\\Phi_B(t) = B(t) \\cdot A' },
          { step: 'Let $B(t) = B_0 \\cos(\\omega t)$', latex: '\\Phi_B(t) = B_0 A \\cos(\\omega t)' },
          { step: 'Differentiate to find EMF', latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt} = B_0 A \\omega \\sin(\\omega t)' },
          { step: 'Peak EMF', latex: '\\varepsilon_0 = B_0 A \\omega' }
        ] }
    ],
    sliders: [
      { id: 'B0', label: 'B amplitude', min: 1, max: 5, default: 2, step: 0.5, unit: 'T' },
      { id: 'omega', label: 'Frequency ω', min: 0.5, max: 4, default: 1.5, step: 0.25, unit: 'rad/s' },
      { id: 'loopR', label: 'Loop Radius', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { B0, loopR } = ctx.params;

      createRing(ctx, { radius: loopR, tubeRadius: 0.05, color: 0xccaa44 });

      const bGroup = new THREE.Group();
      const numArrows = 5;
      const arrows = [];
      for (let i = 0; i < numArrows; i++) {
        for (let j = 0; j < numArrows; j++) {
          const x = -loopR * 0.8 + (i / (numArrows - 1)) * loopR * 1.6;
          const z = -loopR * 0.8 + (j / (numArrows - 1)) * loopR * 1.6;
          if (x * x + z * z > loopR * loopR * 0.9) continue;
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(x, -0.5, z),
            B0 * 0.5, 0x4488ff, 0.15, 0.08
          );
          arrows.push(arrow);
          bGroup.add(arrow);
        }
      }
      ctx.addMesh(bGroup);

      const eGroup = new THREE.Group();
      const eArrows = [];
      const numE = 12;
      for (let i = 0; i < numE; i++) {
        const a = (i / numE) * Math.PI * 2;
        const pos = new THREE.Vector3(loopR * Math.cos(a), 0, loopR * Math.sin(a));
        const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
        const arrow = new THREE.ArrowHelper(tangent, pos, 0.5, 0xff8844, 0.12, 0.06);
        eArrows.push({ arrow, angle: a });
        eGroup.add(arrow);
      }
      ctx.addMesh(eGroup);

      ctx.addLabel(new THREE.Vector3(0, 2, 0), 'dB/dt');
      ctx.addLabel(new THREE.Vector3(loopR + 0.5, 0, 0), 'E_{ind}');

      return { arrows, eArrows, bGroup, eGroup, loopR };
    },
    animate(state, ctx) {
      const { arrows, eArrows, loopR } = state;
      const { time, params } = ctx;
      const { B0, omega } = params;

      const Bt = B0 * Math.sin(omega * time);
      const dBdt = B0 * omega * Math.cos(omega * time);

      for (const arrow of arrows) {
        const len = Math.abs(Bt) * 0.5 + 0.05;
        const dir = Bt >= 0 ? 1 : -1;
        arrow.setDirection(new THREE.Vector3(0, dir, 0));
        arrow.setLength(len, len * 0.3, len * 0.15);
        const t = Math.abs(Bt) / B0;
        const col = new THREE.Color().setHSL(0.6, 0.8, 0.3 + t * 0.3);
        arrow.setColor(col);
      }

      const emf = -dBdt * Math.PI * loopR * loopR;
      const eMag = Math.abs(emf);
      const eDir = emf >= 0 ? 1 : -1;
      for (const { arrow, angle } of eArrows) {
        const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(eDir);
        const len = Math.min(eMag * 0.15, 0.8) + 0.05;
        arrow.setDirection(tangent.normalize());
        arrow.setLength(len, len * 0.25, len * 0.12);
        const t = Math.min(eMag * 0.2, 1);
        arrow.setColor(new THREE.Color().setHSL(0.08, 0.9, 0.4 + t * 0.2));
      }
    }
  },

  // ── 9.3 Moving Loop EMF ───────────────────────────────────────────
  {
    id: 'moving-loop-emf',
    title: '9.3 Moving Loop → Motional EMF',
    description: 'A rectangular loop moving out of a magnetic field region experiences a changing flux, inducing a motional EMF ε = BLv.',
    equations: [
      { label: 'Motional EMF', latex: '\\varepsilon = BLv',
        derivation: [
          { step: 'Bar of length $L$ moves with velocity $v$ through field $B$', latex: '\\vec{F} = q\\vec{v} \\times \\vec{B}' },
          { step: 'Force drives charges along the bar, creating EMF', latex: '\\varepsilon = \\int (\\vec{v} \\times \\vec{B}) \\cdot d\\vec{l} = vBL' },
          { step: 'Equivalently from Faraday: flux through loop', latex: '\\Phi_B = BLx' },
          { step: 'Differentiate: EMF $= -d\\Phi/dt$', latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt} = -BL\\frac{dx}{dt} = BLv' }
        ] },
      { label: 'Flux', latex: '\\Phi_B = B \\times (\\text{area in field})' }
    ],
    sliders: [
      { id: 'B', label: 'Field B', min: 1, max: 5, default: 2, step: 0.5, unit: 'T' },
      { id: 'v', label: 'Speed v', min: 0.5, max: 4, default: 1.5, step: 0.25, unit: 'm/s' },
      { id: 'loopW', label: 'Loop Width', min: 1, max: 3, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { B, v, loopW } = ctx.params;
      const loopH = 2;
      const fieldLeft = -5, fieldRight = 0;

      const regionGeo = new THREE.BoxGeometry(5, 0.05, 5);
      const regionMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide
      });
      const region = new THREE.Mesh(regionGeo, regionMat);
      region.position.set(-2.5, 0, 0);
      ctx.addMesh(region);

      const bGroup = new THREE.Group();
      for (let x = -4.5; x <= -0.5; x += 1.5) {
        for (let z = -2; z <= 2; z += 1.5) {
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(x, -0.5, z),
            B * 0.4, 0x4488ff, 0.12, 0.06
          );
          bGroup.add(arrow);
        }
      }
      ctx.addMesh(bGroup);
      ctx.addLabel(new THREE.Vector3(-3.5, B * 0.4, 0), '\\vec{B}');

      const loopPts = [
        new THREE.Vector3(0, 0, -loopH / 2),
        new THREE.Vector3(0, 0, loopH / 2),
        new THREE.Vector3(loopW, 0, loopH / 2),
        new THREE.Vector3(loopW, 0, -loopH / 2),
        new THREE.Vector3(0, 0, -loopH / 2)
      ];
      const loopGeo = new THREE.BufferGeometry().setFromPoints(loopPts);
      const loopMesh = new THREE.Line(loopGeo, new THREE.LineBasicMaterial({ color: 0xccaa44, linewidth: 2 }));
      ctx.addMesh(loopMesh);

      const fluxFillGeo = new THREE.PlaneGeometry(1, 1);
      const fluxFillMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44, transparent: true, opacity: 0.4, side: THREE.DoubleSide
      });
      const fluxFill = new THREE.Mesh(fluxFillGeo, fluxFillMat);
      fluxFill.rotation.x = -Math.PI / 2;
      fluxFill.position.y = 0.02;
      ctx.addMesh(fluxFill);

      const vArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(loopW / 2, 0, loopH / 2 + 0.5),
        1.0, 0xff4444, 0.15, 0.08
      );
      ctx.addMesh(vArrow);
      ctx.addLabel(new THREE.Vector3(loopW / 2 + 0.5, 0, loopH / 2 + 0.8), '\\vec{v}');
      ctx.addLabel(new THREE.Vector3(3, 1.5, 2.5), '\\Phi_B, \\varepsilon \\to');

      const readout = ctx.addDynamicLabel(new THREE.Vector3(3, 1.2, 2.5));

      return { loopMesh, vArrow, fluxFill, readout, loopW, loopH, fieldLeft, fieldRight };
    },
    animate(state, ctx) {
      const { loopMesh, vArrow, fluxFill, readout, loopW, loopH, fieldLeft, fieldRight } = state;
      const { time, params } = ctx;
      const { B, v } = params;

      const period = 10;
      const t = time % period;
      const xOff = -4 + v * t;
      const loopLeft = xOff, loopRight = xOff + loopW;

      const overlapLeft = Math.max(fieldLeft, loopLeft);
      const overlapRight = Math.min(fieldRight, loopRight);
      const overlapW = Math.max(0, overlapRight - overlapLeft);
      const phi = B * overlapW * loopH;

      const hasFluxChange = overlapW > 0 && overlapW < loopW;
      const emf = hasFluxChange ? B * loopH * v : 0;

      const pts = [
        new THREE.Vector3(xOff, 0, -loopH / 2),
        new THREE.Vector3(xOff, 0, loopH / 2),
        new THREE.Vector3(loopRight, 0, loopH / 2),
        new THREE.Vector3(loopRight, 0, -loopH / 2),
        new THREE.Vector3(xOff, 0, -loopH / 2)
      ];
      loopMesh.geometry.dispose();
      loopMesh.geometry = new THREE.BufferGeometry().setFromPoints(pts);

      vArrow.position.set(xOff + loopW / 2, 0, loopH / 2 + 0.5);

      fluxFill.visible = overlapW > 0.01;
      if (fluxFill.visible) {
        fluxFill.position.set((overlapLeft + overlapRight) / 2, 0.02, 0);
        fluxFill.scale.set(overlapW, 1, loopH);
      }

      readout.position.set(xOff + loopW / 2 + 2, 1.2, 2.5);
      readout.element.textContent = `Φ = ${phi.toFixed(2)}  ε = ${emf.toFixed(2)}`;
    }
  },

  // ── 9.4 AC Generator ──────────────────────────────────────────────
  {
    id: 'generator',
    title: '9.4 AC Generator',
    description: 'A loop rotating in a uniform B field generates a sinusoidal EMF. The flux Φ = BA cos(ωt) changes in time, producing ε = NBAω sin(ωt).',
    equations: [
      { label: 'Generator EMF', latex: '\\varepsilon = NBA\\omega \\sin(\\omega t)',
        derivation: [
          { step: 'Loop of area $A$ rotates in uniform field $B$ with angular velocity $\\omega$', latex: '\\theta(t) = \\omega t' },
          { step: 'Flux through the rotating loop', latex: '\\Phi_B(t) = BA\\cos(\\omega t)' },
          { step: 'Apply Faraday\'s law', latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt} = BA\\omega \\sin(\\omega t)' },
          { step: 'For $N$ turns, EMFs add', latex: '\\varepsilon = NBA\\omega \\sin(\\omega t)' },
          { step: 'Peak EMF', latex: '\\varepsilon_0 = NBA\\omega' }
        ] }
    ],
    sliders: [
      { id: 'omega', label: 'Angular vel ω', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'rad/s' },
      { id: 'B', label: 'Field B', min: 1, max: 5, default: 2, step: 0.5, unit: 'T' },
      { id: 'R', label: 'Loop Radius', min: 0.5, max: 2, default: 1.5, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { B, R } = ctx.params;

      const fieldFn = uniformField(new THREE.Vector3(1, 0, 0), B);
      createArrowField(ctx, fieldFn, {
        bounds: [[-3, 3], [-3, 3], [-1, 1]], step: 2,
        scale: 0.3, maxMag: B + 1, maxLength: 1.0, opacity: 0.2
      });
      ctx.addLabel(new THREE.Vector3(3.5, 3, 0), '\\vec{B}');

      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(R, 0.04, 12, 64);
      const ringMat = new THREE.MeshPhongMaterial({ color: 0xccaa44, emissive: 0xccaa44, emissiveIntensity: 0.2 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringGroup.add(ringMesh);

      const diskGeo = new THREE.CircleGeometry(R, 48);
      const diskMat = new THREE.MeshPhongMaterial({
        color: 0xccaa44, transparent: true, opacity: 0.1, side: THREE.DoubleSide
      });
      ringGroup.add(new THREE.Mesh(diskGeo, diskMat));
      ctx.addMesh(ringGroup);

      const normalArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2, 0x44ff88, 0.15, 0.08
      );
      ctx.addMesh(normalArrow);

      ctx.addLabel(new THREE.Vector3(-3.5, -3.5, 0), '\\varepsilon(t)');
      ctx.addLabel(new THREE.Vector3(-3.5, -2.8, 0), '\\Phi(t)');

      return { ringGroup, normalArrow, R };
    },
    animate(state, ctx) {
      const { ringGroup, normalArrow, R } = state;
      const { time, params } = ctx;
      const { omega, B } = params;

      const angle = omega * time;
      ringGroup.rotation.y = angle;

      const nx = -Math.sin(angle);
      const nz = Math.cos(angle);
      normalArrow.setDirection(new THREE.Vector3(nx, 0, nz).normalize());
      normalArrow.position.set(0, 0, 0);
    }
  },

  // ── 9.5 Eddy Currents ────────────────────────────────────────────
  {
    id: 'eddy-currents',
    title: '9.5 Eddy Currents',
    description: 'A conducting plate moving through a localized magnetic field region develops eddy currents that oppose the change in flux, creating a braking force.',
    equations: [
      { label: 'Lenz\'s Law', latex: '\\varepsilon = -\\frac{d\\Phi_B}{dt}' },
      { label: 'Braking', latex: 'F_{\\text{brake}} \\propto B^2 v',
        derivation: [
          { step: 'Induced EMF from flux change in region of width $L$', latex: '\\varepsilon \\sim BLv' },
          { step: 'Eddy current from Ohm\'s law ($R$ is effective resistance)', latex: 'I_{\\text{eddy}} = \\frac{\\varepsilon}{R} \\sim \\frac{BLv}{R}' },
          { step: 'Force on current-carrying conductor in field', latex: 'F = BIL \\sim \\frac{B^2 L^2 v}{R}' },
          { step: 'For given geometry and resistance', latex: 'F_{\\text{brake}} \\propto B^2 v' }
        ] }
    ],
    sliders: [
      { id: 'B', label: 'Field B', min: 1, max: 5, default: 3, step: 0.5, unit: 'T' },
      { id: 'v', label: 'Speed v', min: 0.5, max: 3, default: 1, step: 0.25, unit: 'm/s' }
    ],
    toggles: [],
    setup(ctx) {
      const { B } = ctx.params;
      const fieldXMin = -1, fieldXMax = 1;
      const plateW = 4, plateH = 3;

      const bRegionGeo = new THREE.BoxGeometry(2, 4, 2);
      const bRegionMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide
      });
      const bRegion = new THREE.Mesh(bRegionGeo, bRegionMat);
      bRegion.position.set(0, 0, 0);
      ctx.addMesh(bRegion);

      const bGroup = new THREE.Group();
      for (let y = -1.5; y <= 1.5; y += 1.5) {
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(0, y, 1),
          B * 0.3 + 0.3, 0x4488ff, 0.12, 0.06
        );
        bGroup.add(arrow);
      }
      ctx.addMesh(bGroup);
      ctx.addLabel(new THREE.Vector3(0, 2.5, 0), '\\vec{B}');

      const plateGeo = new THREE.BoxGeometry(plateW, plateH, 0.1);
      const plateMat = new THREE.MeshPhongMaterial({
        color: 0xcccccc, transparent: true, opacity: 0.6, metalness: 0.8
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      ctx.addMesh(plate);

      const eddyGroup = new THREE.Group();
      const eddyMaterials = [];
      for (const xRel of [-0.8, 0.8]) {
        const pts = [];
        const segs = 36;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          pts.push(new THREE.Vector3(xRel + 0.6 * Math.cos(a), 0.6 * Math.sin(a), 0.06));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0.9, linewidth: 2 });
        eddyMaterials.push(mat);
        eddyGroup.add(new THREE.Line(geo, mat));
      }
      ctx.addMesh(eddyGroup);

      const vArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(-2.5, 2, 0), 1.0, 0xff4444, 0.15, 0.08
      );
      ctx.addMesh(vArrow);
      ctx.addLabel(new THREE.Vector3(-2, 2.3, 0), '\\vec{v}');

      const brakeArrow = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 0), 1.0, 0xffaa00, 0.18, 0.1
      );
      brakeArrow.visible = false;
      ctx.addMesh(brakeArrow);
      ctx.addLabel(new THREE.Vector3(0, -2.2, 0), '\\vec{F}_{\\text{brake}}');

      const readout = ctx.addDynamicLabel(new THREE.Vector3(0, -2.8, 0));

      return {
        plate, eddyGroup, eddyMaterials, vArrow, brakeArrow, readout,
        plateW, plateH, fieldXMin, fieldXMax
      };
    },
    animate(state, ctx) {
      const { plate, eddyGroup, eddyMaterials, vArrow, brakeArrow, readout, plateW, plateH, fieldXMin, fieldXMax } = state;
      const { time, params } = ctx;
      const { B, v } = params;

      const period = 12;
      const t = time % period;
      const xOff = -5 + v * t;
      const plateLeft = xOff - plateW / 2, plateRight = xOff + plateW / 2;

      const overlapLeft = Math.max(fieldXMin, plateLeft);
      const overlapRight = Math.min(fieldXMax, plateRight);
      const overlapW = Math.max(0, overlapRight - overlapLeft);

      const fluxChanging = overlapW > 0 && overlapW < (fieldXMax - fieldXMin);
      const eddyStrength = fluxChanging ? 0.9 : (overlapW > 0 ? 0.3 : 0);

      const brakeStrength = overlapW > 0 && v > 0 ? Math.min(1, B * B * v * 0.03) : 0;

      plate.position.x = xOff;
      eddyGroup.position.x = xOff;
      vArrow.position.x = xOff - 2.5;

      eddyMaterials.forEach(m => { m.opacity = eddyStrength; });

      brakeArrow.visible = brakeStrength > 0.1;
      if (brakeArrow.visible) {
        brakeArrow.position.set(xOff, 0, 0);
        const len = 0.5 + brakeStrength;
        brakeArrow.setLength(len, len * 0.25, len * 0.12);
      }

      readout.position.set(xOff, -2.5, 0);
      readout.element.textContent = overlapW > 0
        ? `Eddy currents: ${(eddyStrength * 100).toFixed(0)}%  F_brake ∝ B²v`
        : 'No flux change → no eddy currents';
    }
  },

  // ── 9.6 LR Circuit ───────────────────────────────────────────────
  {
    id: 'lr-circuit',
    title: '9.6 LR Circuit',
    description: 'When a voltage is applied to an LR circuit, current builds up exponentially with time constant τ = L/R, approaching I = V₀/R asymptotically.',
    equations: [
      { label: 'LR Growth', latex: 'I(t) = \\frac{V_0}{R}\\left(1 - e^{-Rt/L}\\right)',
        derivation: [
          { step: 'Apply KVL around the loop', latex: 'V_0 = IR + L\\frac{dI}{dt}' },
          { step: 'Rearrange as first-order linear ODE', latex: '\\frac{dI}{dt} + \\frac{R}{L}I = \\frac{V_0}{L}' },
          { step: 'Solve with initial condition $I(0) = 0$', latex: 'I(t) = \\frac{V_0}{R}\\left(1 - e^{-Rt/L}\\right)' },
          { step: 'Define the time constant', latex: '\\tau = \\frac{L}{R}' },
          { step: 'At $t = \\tau$, current reaches 63.2% of maximum', latex: 'I(\\tau) = \\frac{V_0}{R}(1 - e^{-1}) \\approx 0.632\\,\\frac{V_0}{R}' }
        ] }
    ],
    sliders: [
      { id: 'L', label: 'Inductance L', min: 0.5, max: 5, default: 2, step: 0.5, unit: 'H' },
      { id: 'R', label: 'Resistance R', min: 0.5, max: 5, default: 1, step: 0.5, unit: 'Ω' },
      { id: 'V0', label: 'Voltage V₀', min: 1, max: 10, default: 5, step: 0.5, unit: 'V' }
    ],
    toggles: [],
    setup(ctx) {
      const { L, R, V0 } = ctx.params;
      const tau = L / R;
      const Imax = V0 / R;

      const coilPts = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const a = t * Math.PI * 8;
        coilPts.push(new THREE.Vector3(-2 + t * 2, 2 + 0.3 * Math.sin(a), 0));
      }
      createWire(ctx, { path: coilPts, radius: 0.04, color: 0xccaa44 });
      ctx.addLabel(new THREE.Vector3(-1, 2.6, 0), 'L');

      const resistorPts = [
        new THREE.Vector3(1, 2, 0), new THREE.Vector3(1.3, 2.3, 0),
        new THREE.Vector3(1.6, 1.7, 0), new THREE.Vector3(1.9, 2.3, 0),
        new THREE.Vector3(2.2, 1.7, 0), new THREE.Vector3(2.5, 2.3, 0),
        new THREE.Vector3(2.8, 2, 0)
      ];
      createWire(ctx, { path: resistorPts, radius: 0.04, color: 0x888888 });
      ctx.addLabel(new THREE.Vector3(1.9, 2.6, 0), 'R');

      const wirePts1 = [
        new THREE.Vector3(-3, 2, 0), new THREE.Vector3(-2, 2, 0)
      ];
      const wirePts2 = [
        new THREE.Vector3(2.8, 2, 0), new THREE.Vector3(3, 2, 0), new THREE.Vector3(3, -1, 0),
        new THREE.Vector3(-3, -1, 0), new THREE.Vector3(-3, 2, 0)
      ];
      createWire(ctx, { path: wirePts1, radius: 0.03, color: 0x666666 });
      createWire(ctx, { path: wirePts2, radius: 0.03, color: 0x666666 });

      const batteryPos = new THREE.Vector3(-3, 0.5, 0);
      ctx.addLabel(batteryPos.clone().add(new THREE.Vector3(-0.5, 0, 0)), `V_0=${V0}`);

      const graphGroup = new THREE.Group();
      const graphPts = [];
      const graphW = 5, graphH = 2.5;
      const graphOrig = new THREE.Vector3(-2.5, -3, 0);
      const numPts = 100;
      const tMax = tau * 5;
      for (let i = 0; i <= numPts; i++) {
        const tVal = (i / numPts) * tMax;
        const Ival = Imax * (1 - Math.exp(-tVal / tau));
        graphPts.push(new THREE.Vector3(
          graphOrig.x + (tVal / tMax) * graphW,
          graphOrig.y + (Ival / Imax) * graphH,
          0
        ));
      }
      const graphGeo = new THREE.BufferGeometry().setFromPoints(graphPts);
      graphGroup.add(new THREE.Line(graphGeo, new THREE.LineBasicMaterial({ color: 0x44ddff })));

      const xAxis = new THREE.BufferGeometry().setFromPoints([
        graphOrig, new THREE.Vector3(graphOrig.x + graphW, graphOrig.y, 0)
      ]);
      const yAxis = new THREE.BufferGeometry().setFromPoints([
        graphOrig, new THREE.Vector3(graphOrig.x, graphOrig.y + graphH, 0)
      ]);
      graphGroup.add(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0x888888 })));
      graphGroup.add(new THREE.Line(yAxis, new THREE.LineBasicMaterial({ color: 0x888888 })));
      ctx.addMesh(graphGroup);

      ctx.addLabel(new THREE.Vector3(graphOrig.x + graphW + 0.3, graphOrig.y, 0), 't');
      ctx.addLabel(new THREE.Vector3(graphOrig.x - 0.25, graphOrig.y + graphH + 0.25, 0), 'I');
      ctx.addLabel(new THREE.Vector3(graphOrig.x + 0.7, graphOrig.y + graphH - 0.2, 0), `I_{max}=${Imax.toFixed(1)}`);

      const tauLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(graphOrig.x + graphW / 5, graphOrig.y, 0),
        new THREE.Vector3(graphOrig.x + graphW / 5, graphOrig.y + graphH * 0.632, 0)
      ]);
      graphGroup.add(new THREE.Line(tauLine, new THREE.LineDashedMaterial({
        color: 0xff8844, dashSize: 0.1, gapSize: 0.05
      })));
      ctx.addLabel(new THREE.Vector3(graphOrig.x + graphW / 5, graphOrig.y - 0.3, 0), `\\tau=${tau.toFixed(1)}`);

      const currentMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.5 })
      );
      currentMarker.position.copy(graphOrig);
      ctx.addMesh(currentMarker);

      return { currentMarker, graphOrig, graphW, graphH, tMax, Imax, tau };
    },
    animate(state, ctx) {
      const { currentMarker, graphOrig, graphW, graphH, tMax, Imax, tau } = state;
      const { time } = ctx;

      const period = tMax + 1;
      const t = time % period;
      const Ival = Imax * (1 - Math.exp(-t / tau));

      currentMarker.position.set(
        graphOrig.x + (t / tMax) * graphW,
        graphOrig.y + (Ival / Imax) * graphH,
        0
      );
    }
  },

  // ── 9.7 Mutual Inductance ────────────────────────────────────────
  {
    id: 'mutual-inductance',
    title: '9.7 Mutual Inductance',
    description: 'Changing current in a primary coil changes the flux through a secondary coil, inducing an EMF ε₂ = -M dI₁/dt via mutual inductance M.',
    equations: [
      { label: 'Mutual Inductance', latex: '\\varepsilon_2 = -M \\frac{dI_1}{dt}',
        derivation: [
          { step: 'Flux through secondary due to primary current', latex: '\\Phi_2 = M I_1' },
          { step: 'Apply Faraday\'s law to secondary', latex: '\\varepsilon_2 = -\\frac{d\\Phi_2}{dt} = -M\\frac{dI_1}{dt}' },
          { step: '$M$ depends on geometry; for solenoid coupling', latex: 'M = \\frac{\\mu_0 N_1 N_2 A}{l}' },
          { step: 'Reciprocity theorem', latex: 'M_{12} = M_{21} = M' }
        ] }
    ],
    sliders: [
      { id: 'N1', label: 'Primary Turns', min: 5, max: 30, default: 15, step: 1, unit: '' },
      { id: 'N2', label: 'Secondary Turns', min: 5, max: 30, default: 15, step: 1, unit: '' },
      { id: 'I0', label: 'Current Amplitude', min: 1, max: 10, default: 5, step: 0.5, unit: 'A' }
    ],
    toggles: [],
    setup(ctx) {
      const { N1, N2 } = ctx.params;

      createSolenoid(ctx, { radius: 0.8, length: 3, turns: N1, color: 0xccaa44 });
      createSolenoid(ctx, {
        radius: 0.8, length: 3, turns: N2, color: 0x44aaff,
      });

      const coil2Group = new THREE.Group();
      const pts2 = [];
      const steps = N2 * 32;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = N2 * Math.PI * 2 * t;
        pts2.push(new THREE.Vector3(0.8 * Math.cos(a), -1.5 + 3 * t + 4, 0.8 * Math.sin(a)));
      }
      createWire(ctx, { path: pts2, radius: 0.03, color: 0x44aaff });

      ctx.addLabel(new THREE.Vector3(1.2, 0, 0), `N_1=${N1}`);
      ctx.addLabel(new THREE.Vector3(1.2, 5.5, 0), `N_2=${N2}`);

      const fieldGroup = new THREE.Group();
      const fieldArrows = [];
      for (let y = -1; y <= 6; y += 0.8) {
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, y, 0),
          0.5, 0x88ff88, 0.1, 0.06
        );
        fieldArrows.push(arrow);
        fieldGroup.add(arrow);
      }
      ctx.addMesh(fieldGroup);

      ctx.addLabel(new THREE.Vector3(1.5, 3, 0), '\\Phi_{12}');

      const emfLabel = ctx.addLabel(new THREE.Vector3(-2, 5.5, 0), '\\varepsilon_2');

      return { fieldArrows };
    },
    animate(state, ctx) {
      const { fieldArrows } = state;
      const { time, params } = ctx;
      const { I0 } = params;

      const omega = 1.5;
      const I1 = I0 * Math.sin(omega * time);
      const scale = Math.abs(I1) / I0;

      for (const arrow of fieldArrows) {
        const len = scale * 0.6 + 0.05;
        const dir = I1 >= 0 ? 1 : -1;
        arrow.setDirection(new THREE.Vector3(0, dir, 0));
        arrow.setLength(len, len * 0.25, len * 0.12);
        const col = new THREE.Color().setHSL(0.33, 0.8, 0.3 + scale * 0.3);
        arrow.setColor(col);
      }
    }
  }
];
