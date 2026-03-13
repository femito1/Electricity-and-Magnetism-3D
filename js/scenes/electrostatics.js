import * as THREE from 'three';
import { coulombField, uniformField, createChargeSphere, createArrowField, createFieldLines, createFieldLinesForCharges, createEquipotentialPlane, startPointsOnSphere, startPointsOnCircle, magnitudeToColor } from '../fieldViz.js';

export default [
  // ── 1.1 Point Charge ──────────────────────────────────────────────
  {
    id: 'point-charge',
    title: '1.1 Point Charge',
    description: 'Electric field of a single point charge. Field lines radiate outward for positive charges and inward for negative charges, with magnitude falling off as 1/r².',
    equations: [
      { label: "Coulomb's Field", latex: '\\vec{E} = \\frac{kq}{r^2}\\hat{r}', derivation: [
        { step: "Coulomb's force on test charge $q_0$ due to source charge $q$", latex: '\\vec{F} = \\frac{kq\\,q_0}{r^2}\\hat{r}' },
        { step: 'Define the electric field as force per unit test charge', latex: '\\vec{E} \\equiv \\frac{\\vec{F}}{q_0}' },
        { step: 'Substitute the Coulomb force expression', latex: '\\vec{E} = \\frac{1}{q_0}\\cdot\\frac{kq\\,q_0}{r^2}\\hat{r} = \\frac{kq}{r^2}\\hat{r}' },
        { step: 'Rewrite using $k = 1/(4\\pi\\varepsilon_0)$', latex: '\\vec{E} = \\frac{q}{4\\pi\\varepsilon_0\\, r^2}\\hat{r}' }
      ] }
    ],
    sliders: [
      { id: 'q', label: 'Charge q', min: -10, max: 10, default: 1, step: 0.5, unit: 'μC' }
    ],
    toggles: [
      { id: 'fieldLines', label: 'Field Lines', default: true },
      { id: 'fieldVectors', label: 'Field Vectors', default: false }
    ],
    setup(ctx) {
      const q = ctx.params.q || 1;
      const origin = new THREE.Vector3(0, 0, 0);
      const charges = [{ pos: origin, q }];
      const fieldFn = coulombField(charges);

      createChargeSphere(ctx, origin, q, 0.25);
      ctx.addLabel(origin.clone().add(new THREE.Vector3(0.35, 0.35, 0)), `q=${q > 0 ? '+' : ''}${q}`);

      if (ctx.toggles.fieldLines) {
        ctx.addMesh(createFieldLinesForCharges(ctx, fieldFn, charges, { minLines: 20, maxLines: 24 }));
      }

      if (ctx.toggles.fieldVectors) {
        createArrowField(ctx, fieldFn, {
          flat: false, step: 1.4, stepY: 1.6,
          bounds: [[-4, 4], [-2.5, 2.5], [-4, 4]], maxMag: 8, maxLength: 1.2,
          scale: 0.9, lengthScale: 'sqrt',
          excludePositions: [origin], excludeRadius: 0.55
        });
      }

      const testPt = new THREE.Vector3(2, 0, 0);
      const Eatp = fieldFn(testPt);
      const Emag = Eatp.length();
      const testArrowLen = Math.min(Math.sqrt(Emag) * 0.9, 1.2);
      const arrow = new THREE.ArrowHelper(Eatp.clone().normalize(), testPt, testArrowLen, 0xffaa22, 0.15, 0.08);
      ctx.addMesh(arrow);
      ctx.addLabel(testPt.clone().add(new THREE.Vector3(0.2, 0.4, 0)), '\\vec{E}');

      const rLine = new THREE.BufferGeometry().setFromPoints([origin, testPt]);
      ctx.addMesh(new THREE.Line(rLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })));
      ctx.addLabel(new THREE.Vector3(1, -0.3, 0), 'r');

      return {};
    }
  },

  // ── 1.2 Electric Dipole ───────────────────────────────────────────
  {
    id: 'dipole',
    title: '1.2 Electric Dipole',
    description: 'Two equal and opposite charges ±q separated by distance d. Field lines originate on the positive charge and terminate on the negative charge.',
    equations: [
      { label: 'Dipole Moment', latex: '\\vec{p} = q\\vec{d}' },
      { label: 'Dipole Field (far)', latex: 'E \\sim \\frac{1}{r^3}', derivation: [
        { step: 'Place $+q$ at $x = +d/2$ and $-q$ at $x = -d/2$', latex: 'E_x(P) = \\frac{kq}{(r - d/2)^2} - \\frac{kq}{(r + d/2)^2}' },
        { step: 'Combine over a common denominator', latex: 'E_x = kq\\,\\frac{(r+d/2)^2 - (r-d/2)^2}{(r^2 - d^2/4)^2} = kq\\,\\frac{2rd}{(r^2 - d^2/4)^2}' },
        { step: 'Apply the far-field approximation $r \\gg d$', latex: 'r^2 - d^2/4 \\approx r^2 \\implies E_x \\approx \\frac{2kqd}{r^3}' },
        { step: 'Substitute the dipole moment $p = qd$', latex: 'E_{\\text{axis}} \\approx \\frac{2kp}{r^3} = \\frac{2p}{4\\pi\\varepsilon_0\\, r^3}' }
      ] }
    ],
    sliders: [
      { id: 'charge', label: 'Charge q', min: 0.5, max: 10, default: 3, step: 0.5, unit: 'μC' },
      { id: 'separation', label: 'Separation d', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'm' }
    ],
    toggles: [
      { id: 'fieldLines', label: 'Field Lines', default: true },
      { id: 'equipotentials', label: 'Equipotential Map', default: false }
    ],
    setup(ctx) {
      const q = ctx.params.charge;
      const d = ctx.params.separation;
      const posCharge = new THREE.Vector3(d / 2, 0, 0);
      const negCharge = new THREE.Vector3(-d / 2, 0, 0);
      const charges = [{ pos: posCharge, q }, { pos: negCharge, q: -q }];
      const fieldFn = coulombField(charges);

      createChargeSphere(ctx, posCharge, q, 0.22);
      createChargeSphere(ctx, negCharge, -q, 0.22);
      ctx.addLabel(posCharge.clone().add(new THREE.Vector3(0, 0.4, 0)), `q=+${q.toFixed(1)}`);
      ctx.addLabel(negCharge.clone().add(new THREE.Vector3(0, 0.4, 0)), `q=-${q.toFixed(1)}`);

      if (ctx.toggles.fieldLines) {
        const opacity = Math.min(0.25 + q * 0.06, 0.8);
        ctx.addMesh(createFieldLinesForCharges(ctx, fieldFn, charges, {
          lineCountScale: 2.2, minLines: 10, maxLines: 24, opacity, bounds: 8
        }));
      }

      if (ctx.toggles.equipotentials) {
        const potFn = (p) => {
          let V = 0;
          for (const c of charges) {
            const dist = p.distanceTo(c.pos);
            if (dist > 0.2) V += c.q / dist;
          }
          return V;
        };
        createEquipotentialPlane(ctx, potFn, { y: 0, size: 10, opacity: 0.4, minV: -5, maxV: 5 });
      }

      const pVec = new THREE.Vector3(d * q, 0, 0);
      const mid = new THREE.Vector3(0, 0, 0);
      const pArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), mid.clone().add(new THREE.Vector3(0, -0.6, 0)),
        Math.min(pVec.length() * 0.2, 2), 0x44ff88, 0.15, 0.08
      );
      ctx.addMesh(pArrow);
      ctx.addLabel(mid.clone().add(new THREE.Vector3(0, -1.0, 0)), '\\vec{p}=q\\vec{d}');

      return {};
    }
  },

  // ── 1.3 Superposition ────────────────────────────────────────────
  {
    id: 'superposition',
    title: '1.3 Superposition of Charges',
    description: 'Three point charges demonstrate the superposition principle: the total electric field at any point is the vector sum of fields from each charge.',
    equations: [
      { label: 'Superposition', latex: '\\vec{E}_{\\text{total}} = \\sum_i \\vec{E}_i = \\sum_i \\frac{kq_i}{r_i^2}\\hat{r}_i' }
    ],
    sliders: [
      { id: 'q1', label: 'q₁', min: -5, max: 5, default: 3, step: 0.5, unit: 'μC' },
      { id: 'q2', label: 'q₂', min: -5, max: 5, default: -2, step: 0.5, unit: 'μC' },
      { id: 'q3', label: 'q₃', min: -5, max: 5, default: 1, step: 0.5, unit: 'μC' },
      { id: 'x1', label: 'x₁', min: -4, max: 4, default: -2, step: 0.5, unit: 'm' },
      { id: 'x2', label: 'x₂', min: -4, max: 4, default: 0, step: 0.5, unit: 'm' },
      { id: 'x3', label: 'x₃', min: -4, max: 4, default: 2, step: 0.5, unit: 'm' }
    ],
    toggles: [
      { id: 'fieldLines', label: 'Field Lines', default: true },
      { id: 'individualE', label: 'Individual E vectors', default: false }
    ],
    setup(ctx) {
      const { q1, q2, q3, x1, x2, x3 } = ctx.params;
      const p1 = new THREE.Vector3(x1, 0, 0);
      const p2 = new THREE.Vector3(x2, 0, 0);
      const p3 = new THREE.Vector3(x3, 0, 0);
      const charges = [{ pos: p1, q: q1 }, { pos: p2, q: q2 }, { pos: p3, q: q3 }];
      const fieldFn = coulombField(charges);

      createChargeSphere(ctx, p1, q1, 0.2);
      createChargeSphere(ctx, p2, q2, 0.2);
      createChargeSphere(ctx, p3, q3, 0.2);
      ctx.addLabel(p1.clone().add(new THREE.Vector3(0, 0.4, 0)), `q_1=${q1}`);
      ctx.addLabel(p2.clone().add(new THREE.Vector3(0, 0.4, 0)), `q_2=${q2}`);
      ctx.addLabel(p3.clone().add(new THREE.Vector3(0, 0.4, 0)), `q_3=${q3}`);

      if (ctx.toggles.fieldLines) {
        ctx.addMesh(createFieldLinesForCharges(ctx, fieldFn, charges, { bounds: 8 }));
      }

      const testPt = new THREE.Vector3(0, 2, 0);
      const testMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
      );
      testMarker.position.copy(testPt);
      ctx.addMesh(testMarker);
      ctx.addLabel(testPt.clone().add(new THREE.Vector3(0.25, 0.2, 0)), 'P');

      if (ctx.toggles.individualE) {
        const colors = [0xff4444, 0x4488ff, 0x44ff44];
        for (let i = 0; i < charges.length; i++) {
          const Ei = coulombField([charges[i]])(testPt);
          const mag = Ei.length();
          if (mag < 0.01) continue;
          const arrow = new THREE.ArrowHelper(
            Ei.clone().normalize(), testPt, Math.min(mag * 0.4, 1.5), colors[i], 0.15, 0.08
          );
          ctx.addMesh(arrow);
        }
      }

      const Etot = fieldFn(testPt);
      const Emag = Etot.length();
      if (Emag > 0.01) {
        const totalArrow = new THREE.ArrowHelper(
          Etot.clone().normalize(), testPt, Math.min(Emag * 0.4, 2), 0xffaa22, 0.2, 0.1
        );
        ctx.addMesh(totalArrow);
        ctx.addLabel(testPt.clone().add(Etot.clone().normalize().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.3, 0)), '\\vec{E}_{total}');
      }

      return {};
    }
  },

  // ── 1.4 Coulomb Force ────────────────────────────────────────────
  {
    id: 'coulomb-force',
    title: "1.4 Coulomb's Force Law",
    description: "Two point charges exert equal-and-opposite forces on each other (Newton's third law). The force magnitude follows the inverse-square law. Each arrow shows the force acting ON that charge.",
    equations: [
      { label: "Coulomb's Law", latex: '\\vec{F}_{12} = \\frac{kq_1 q_2}{r^2}\\hat{r}_{12}' }
    ],
    sliders: [
      { id: 'q1', label: 'Charge q₁', min: -10, max: 10, default: 3, step: 0.5, unit: 'μC' },
      { id: 'q2', label: 'Charge q₂', min: -10, max: 10, default: -2, step: 0.5, unit: 'μC' },
      { id: 'sep', label: 'Separation', min: 1, max: 6, default: 3, step: 0.25, unit: 'm' }
    ],
    toggles: [],
    setup(ctx) {
      const { q1, q2, sep } = ctx.params;
      const p1 = new THREE.Vector3(-sep / 2, 0, 0);
      const p2 = new THREE.Vector3(sep / 2, 0, 0);

      createChargeSphere(ctx, p1, q1, 0.25);
      createChargeSphere(ctx, p2, q2, 0.25);
      ctx.addLabel(p1.clone().add(new THREE.Vector3(0, -0.55, 0)), `q_1=${q1}`);
      ctx.addLabel(p2.clone().add(new THREE.Vector3(0, -0.55, 0)), `q_2=${q2}`);

      const rLine = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      ctx.addMesh(new THREE.Line(rLine, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3 })));
      ctx.addLabel(new THREE.Vector3(0, 0.35, 0), `r = ${sep}`);

      const Fmag = Math.abs(q1 * q2) / (sep * sep);
      if (Fmag < 0.001) return {};

      const attractive = q1 * q2 < 0;
      const repulsive = q1 * q2 > 0;

      const unitFrom1to2 = new THREE.Vector3().subVectors(p2, p1).normalize();
      const unitFrom2to1 = unitFrom1to2.clone().negate();

      // Force ON q1 due to q2: attractive → toward q2, repulsive → away from q2
      const F1dir = attractive ? unitFrom1to2.clone() : unitFrom2to1.clone();
      // Force ON q2 due to q1: attractive → toward q1, repulsive → away from q1
      const F2dir = attractive ? unitFrom2to1.clone() : unitFrom1to2.clone();

      const arrowLen = Math.max(Math.min(Fmag * 0.6, 2.5), 0.6);
      const hl = Math.min(arrowLen * 0.25, 0.35);
      const hw = hl * 0.5;

      // Place arrows above the charge line (y-offset) so they're unambiguously
      // anchored to their respective charges and don't overlap between them.
      const yOff = new THREE.Vector3(0, 0.45, 0);

      const f1Origin = p1.clone().add(yOff);
      const f1 = new THREE.ArrowHelper(F1dir, f1Origin, arrowLen, 0x44ff88, hl, hw);
      ctx.addMesh(f1);
      ctx.addLabel(f1Origin.clone().addScaledVector(F1dir, arrowLen + 0.2).add(new THREE.Vector3(0, 0.2, 0)),
        '\\vec{F}_{\\text{on }q_1}');

      const f2Origin = p2.clone().add(yOff);
      const f2 = new THREE.ArrowHelper(F2dir, f2Origin, arrowLen, 0xff8844, hl, hw);
      ctx.addMesh(f2);
      ctx.addLabel(f2Origin.clone().addScaledVector(F2dir, arrowLen + 0.2).add(new THREE.Vector3(0, 0.2, 0)),
        '\\vec{F}_{\\text{on }q_2}');

      const typeLabel = attractive ? '\\text{Attractive}' : '\\text{Repulsive}';
      ctx.addLabel(new THREE.Vector3(0, -1.0, 0), `${typeLabel},\\;|F|=${Fmag.toFixed(2)}`);

      return {};
    }
  },

  // ── 1.5 Charge in Uniform Field (Animated) ───────────────────────
  {
    id: 'charge-in-field',
    title: '1.5 Charge in Uniform Field',
    description: 'A charged particle enters a uniform electric field and follows a parabolic trajectory, analogous to projectile motion under gravity.',
    equations: [
      { label: 'Force', latex: '\\vec{F} = q\\vec{E}' },
      { label: 'Acceleration', latex: '\\vec{a} = \\frac{q\\vec{E}}{m}' },
      { label: 'Trajectory', latex: 'y = \\frac{qE}{2mv_0^2}x^2', derivation: [
        { step: 'Uniform field gives constant force in $y$; no force in $x$', latex: 'F_y = qE,\\quad F_x = 0' },
        { step: "Apply Newton's second law for each component", latex: 'a_x = 0,\\quad a_y = \\frac{qE}{m}' },
        { step: 'Integrate to get position as a function of time', latex: 'x(t) = v_0\\,t,\\quad y(t) = \\tfrac{1}{2}\\frac{qE}{m}\\,t^2' },
        { step: 'Eliminate $t$ using $t = x/v_0$', latex: 't = \\frac{x}{v_0} \\implies y = \\frac{qE}{2m}\\left(\\frac{x}{v_0}\\right)^2' },
        { step: 'Simplify to the parabolic trajectory equation', latex: 'y = \\frac{qE}{2mv_0^2}\\,x^2' }
      ] }
    ],
    sliders: [
      { id: 'E0', label: 'E field', min: 0.5, max: 5, default: 2, step: 0.25, unit: 'N/C' },
      { id: 'charge', label: 'Charge q', min: 0.5, max: 5, default: 1, step: 0.5, unit: 'μC' },
      { id: 'v0', label: 'Initial speed v₀', min: 1, max: 8, default: 4, step: 0.5, unit: 'm/s' }
    ],
    toggles: [
      { id: 'showTrail', label: 'Show Trail', default: true }
    ],
    setup(ctx) {
      const { E0, charge, v0 } = ctx.params;

      const fieldDir = new THREE.Vector3(0, -1, 0);
      const fieldFn = uniformField(fieldDir, E0);
      createArrowField(ctx, fieldFn, {
        bounds: [[-5, 5], [-4, 4], [0, 0]], step: 2, flat: false,
        scale: 0.25, maxMag: 6, opacity: 0.3
      });
      ctx.addLabel(new THREE.Vector3(4, 3, 0), '\\vec{E}');

      const mass = 1;
      const a = charge * E0 / mass;
      const maxT = 4;
      const dt = 0.02;
      const trailPts = [];
      for (let t = 0; t <= maxT; t += dt) {
        const x = -5 + v0 * t;
        const y = 3 - 0.5 * a * t * t;
        if (x > 6 || y < -5) break;
        trailPts.push(new THREE.Vector3(x, y, 0));
      }

      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xff5566, emissive: 0xff5566, emissiveIntensity: 0.4 })
      );
      particle.position.copy(trailPts[0]);
      ctx.addMesh(particle);

      let trailLine = null;
      if (ctx.toggles.showTrail) {
        const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts.slice(0, 1));
        trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.7 }));
        ctx.addMesh(trailLine);
      }

      ctx.addLabel(new THREE.Vector3(-5, 3.5, 0), `v_0=${v0}`);

      return { particle, trailPts, trailLine, v0, a };
    },
    animate(state, ctx) {
      const { particle, trailPts, trailLine } = state;
      if (!trailPts || trailPts.length === 0) return;

      const period = trailPts.length * 0.02;
      const t = ctx.time % (period + 1);
      const idx = Math.min(Math.floor(t / 0.02), trailPts.length - 1);

      particle.position.copy(trailPts[idx]);

      if (trailLine) {
        const visiblePts = trailPts.slice(0, idx + 1);
        if (visiblePts.length >= 2) {
          trailLine.geometry.dispose();
          trailLine.geometry = new THREE.BufferGeometry().setFromPoints(visiblePts);
        }
      }
    }
  }
];
