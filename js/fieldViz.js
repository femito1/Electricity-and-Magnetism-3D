import * as THREE from 'three';

// ========== Field Functions ==========

export function coulombField(charges) {
  const r = new THREE.Vector3();
  return (p) => {
    const E = new THREE.Vector3();
    for (const c of charges) {
      r.subVectors(p, c.pos);
      const rMag = r.length();
      if (rMag < 0.15) continue;
      E.addScaledVector(r.clone().normalize(), c.q / (rMag * rMag));
    }
    return E;
  };
}

export function uniformField(dir, mag = 1) {
  const d = dir.clone().normalize().multiplyScalar(mag);
  return () => d.clone();
}

export function lineChargeFieldRadial(lambda = 1) {
  return (p) => {
    const rPerp = new THREE.Vector3(p.x, 0, p.z);
    const dist = rPerp.length();
    if (dist < 0.1) return new THREE.Vector3();
    return rPerp.normalize().multiplyScalar(2 * lambda / dist);
  };
}

export function solidSphereField(R, rho) {
  const Qtot = rho * (4 / 3) * Math.PI * R * R * R;
  return (p) => {
    const r = p.length();
    if (r < 0.05) return new THREE.Vector3();
    const dir = p.clone().normalize();
    if (r <= R) {
      return dir.multiplyScalar(rho * r / 3);
    }
    return dir.multiplyScalar(Qtot / (r * r));
  };
}

export function shellField(R, Q) {
  return (p) => {
    const r = p.length();
    if (r < 0.05) return new THREE.Vector3();
    const dir = p.clone().normalize();
    if (r < R) return new THREE.Vector3();
    return dir.multiplyScalar(Q / (r * r));
  };
}

export function diskField(R, sigma) {
  return (p) => {
    const z = p.y;
    const sign = z >= 0 ? 1 : -1;
    const absZ = Math.abs(z);
    if (absZ < 0.01) return new THREE.Vector3();
    const mag = (sigma / 2) * (1 - absZ / Math.sqrt(absZ * absZ + R * R));
    return new THREE.Vector3(0, sign * mag, 0);
  };
}

export function ringFieldOnAxis(R, Q) {
  return (p) => {
    const y = p.y;
    const denom = Math.pow(R * R + y * y, 1.5);
    if (denom < 0.001) return new THREE.Vector3();
    return new THREE.Vector3(0, Q * y / denom, 0);
  };
}

export function cylinderField(R, rhoOrLambda, isSolid = true) {
  const lambda = isSolid ? rhoOrLambda * Math.PI * R * R : rhoOrLambda;
  return (p) => {
    const rPerp = new THREE.Vector3(p.x, 0, p.z);
    const r = rPerp.length();
    if (r < 0.05) return new THREE.Vector3();
    const dir = rPerp.clone().normalize();
    if (isSolid && r < R) {
      return dir.multiplyScalar(rhoOrLambda * r / 2);
    }
    return dir.multiplyScalar(2 * lambda / r);
  };
}

// ========== Visualization ==========

export function magnitudeToColor(mag, maxMag = 5) {
  const t = Math.min(mag / maxMag, 1);
  const c = new THREE.Color();
  c.setHSL(0.55 - t * 0.5, 0.9, 0.35 + t * 0.25);
  return c;
}

export function createArrowField(ctx, fieldFn, opts = {}) {
  const {
    bounds = [[-3, 3], [-3, 3], [-3, 3]],
    step = 1.5, stepY, scale = 0.3, maxLength = 1.2,
    maxMag = 5, opacity = 0.8, flat = false,
    uniformLength = false, headLength = 0.15, headWidth = 0.08,
    excludePositions = [], excludeRadius = 0.5,
    lengthScale = 'linear'
  } = opts;
  const group = new THREE.Group();
  const [xr, yr, zr] = bounds;
  const ys = flat ? 0 : yr[0], ye = flat ? 0.01 : yr[1];
  const yStep = stepY ?? (flat ? step : step * 1.2);
  for (let x = xr[0]; x <= xr[1]; x += step) {
    for (let y = ys; y <= ye; y += yStep) {
      for (let z = zr[0]; z <= zr[1]; z += step) {
        const pos = new THREE.Vector3(x, y, z);
        if (excludePositions.length) {
          let skip = false;
          for (const ex of excludePositions) {
            if (pos.distanceTo(ex) < excludeRadius) { skip = true; break; }
          }
          if (skip) continue;
        }
        const E = fieldFn(pos);
        const mag = E.length();
        if (mag < 0.005) continue;
        const dir = E.clone().normalize();
        let len;
        if (uniformLength) {
          len = maxLength;
        } else if (lengthScale === 'sqrt') {
          len = Math.min(Math.sqrt(mag) * scale, maxLength);
        } else {
          len = Math.min(mag * scale, maxLength);
        }
        const col = magnitudeToColor(mag, maxMag);
        const arrow = new THREE.ArrowHelper(dir, pos, len, col.getHex(), headLength, headWidth);
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

function rk4Step(fieldFn, p, h) {
  const k1 = fieldFn(p).normalize().multiplyScalar(h);
  const p2 = p.clone().addScaledVector(k1, 0.5);
  const k2 = fieldFn(p2).normalize().multiplyScalar(h);
  const p3 = p.clone().addScaledVector(k2, 0.5);
  const k3 = fieldFn(p3).normalize().multiplyScalar(h);
  const p4 = p.clone().add(k3);
  const k4 = fieldFn(p4).normalize().multiplyScalar(h);
  return new THREE.Vector3()
    .add(k1).addScaledVector(k2, 2).addScaledVector(k3, 2).add(k4).multiplyScalar(1 / 6);
}

export function traceFieldLine(fieldFn, start, opts = {}) {
  const {
    stepSize = 0.08, maxSteps = 600, bounds = 10, minField = 0.001,
    direction = 1, terminateAt = [], terminateRadius = 0.3, skipIfHitTerminate = false
  } = opts;
  const pts = [start.clone()];
  let p = start.clone();
  const dir = direction >= 0 ? 1 : -1;
  const effFieldFn = dir === 1 ? fieldFn : (pt) => fieldFn(pt).negate();
  for (let i = 0; i < maxSteps; i++) {
    const E = effFieldFn(p);
    if (E.length() < minField) break;
    p.add(rk4Step(effFieldFn, p, stepSize));
    if (p.length() > bounds) { pts.push(p.clone()); break; }
    let hitTerminate = false;
    for (const t of terminateAt) {
      if (p.distanceTo(t) < terminateRadius) { hitTerminate = true; break; }
    }
    if (hitTerminate) {
      pts.push(p.clone());
      if (skipIfHitTerminate) return [];
      break;
    }
    pts.push(p.clone());
  }
  return pts;
}

export function createFieldLines(ctx, fieldFn, startPoints, opts = {}) {
  const { color = 0x44ddff, opacity = 0.55, ...traceOpts } = opts;
  const group = new THREE.Group();
  for (const start of startPoints) {
    const pts = traceFieldLine(fieldFn, start, traceOpts);
    if (pts.length < 2) continue;
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    group.add(new THREE.Line(geo, mat));
  }
  return ctx.addMesh(group);
}

/**
 * Create field lines for a set of point charges. Correctly traces from both
 * positive charges (sources) and negative charges (sinks), so lines from
 * infinity terminating at negative charges are shown.
 */
export function createFieldLinesForCharges(ctx, fieldFn, charges, opts = {}) {
  const {
    colorPos = 0x44ddff, colorNeg = 0x44ddff, opacity = 0.55,
    lineCountScale = 3, minLines = 8, maxLines = 20, bounds = 8,
    seedRadius = 0.3, terminateRadius = 0.32
  } = opts;
  const group = new THREE.Group();
  const posCharges = charges.filter(c => c.q > 0);
  const negCharges = charges.filter(c => c.q < 0);
  const allPositions = charges.map(c => c.pos);

  for (const c of posCharges) {
    const n = Math.max(minLines, Math.min(maxLines, Math.ceil(Math.abs(c.q) * lineCountScale)));
    const starts = startPointsOnSphere(c.pos, seedRadius, n);
    const others = allPositions.filter(pos => pos !== c.pos);
    for (const start of starts) {
      const pts = traceFieldLine(fieldFn, start, {
        bounds, terminateAt: others, terminateRadius
      });
      if (pts.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: colorPos, transparent: true, opacity });
        group.add(new THREE.Line(geo, mat));
      }
    }
  }

  for (const c of negCharges) {
    const n = Math.max(minLines, Math.min(maxLines, Math.ceil(Math.abs(c.q) * lineCountScale)));
    const starts = startPointsOnSphere(c.pos, seedRadius, n);
    const others = allPositions.filter(pos => pos !== c.pos);
    for (const start of starts) {
      const pts = traceFieldLine(fieldFn, start, {
        bounds, direction: -1, terminateAt: others, terminateRadius,
        skipIfHitTerminate: true
      });
      if (pts.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: colorNeg, transparent: true, opacity });
        group.add(new THREE.Line(geo, mat));
      }
    }
  }

  return group;
}

export function startPointsOnSphere(center, radius, count) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r2 = Math.sqrt(1 - y * y);
    const th = phi * i;
    pts.push(new THREE.Vector3(
      center.x + radius * r2 * Math.cos(th),
      center.y + radius * y,
      center.z + radius * r2 * Math.sin(th)
    ));
  }
  return pts;
}

export function startPointsOnCircle(center, normal, radius, count) {
  const pts = [];
  const up = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const t1 = new THREE.Vector3().crossVectors(normal, up).normalize();
  const t2 = new THREE.Vector3().crossVectors(normal, t1);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    pts.push(center.clone().addScaledVector(t1, radius * Math.cos(a)).addScaledVector(t2, radius * Math.sin(a)));
  }
  return pts;
}

// ========== Charge / Geometry Builders ==========

export function createChargeSphere(ctx, position, charge, radius = 0.2) {
  const color = charge > 0 ? 0xff5566 : charge < 0 ? 0x5588ff : 0x888888;
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3, shininess: 80 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createRod(ctx, opts = {}) {
  const { length = 4, radius = 0.05, color = 0xff5566, axis = 'x', position = new THREE.Vector3() } = opts;
  const geo = new THREE.CylinderGeometry(radius, radius, length, 12);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  else if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createRing(ctx, opts = {}) {
  const { radius = 2, tubeRadius = 0.04, color = 0xff5566, position = new THREE.Vector3() } = opts;
  const geo = new THREE.TorusGeometry(radius, tubeRadius, 12, 64);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createDisk(ctx, opts = {}) {
  const { radius = 2, color = 0xff5566, opacity = 0.45, position = new THREE.Vector3() } = opts;
  const geo = new THREE.CircleGeometry(radius, 48);
  const mat = new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createSphere(ctx, opts = {}) {
  const { radius = 2, color = 0xff5566, opacity = 0.25, wireframe = false, position = new THREE.Vector3() } = opts;
  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, wireframe });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createPlane(ctx, opts = {}) {
  const { width = 10, height = 10, color = 0xff5566, opacity = 0.25, position = new THREE.Vector3() } = opts;
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  return ctx.addMesh(mesh);
}

export function createCylinderShell(ctx, opts = {}) {
  const { radius = 1, height = 6, color = 0xff5566, opacity = 0.25 } = opts;
  const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
  const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
  return ctx.addMesh(new THREE.Mesh(geo, mat));
}

export function createGaussianSurface(ctx, type, opts = {}) {
  const group = new THREE.Group();
  const surfMat = new THREE.MeshPhongMaterial({
    color: 0x44ff88, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false
  });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35 });
  let geo;
  if (type === 'sphere') {
    geo = new THREE.SphereGeometry(opts.radius || 2, 32, 24);
  } else if (type === 'cylinder') {
    geo = new THREE.CylinderGeometry(opts.radius || 1.5, opts.radius || 1.5, opts.height || 4, 32, 1, true);
    const capGeo = new THREE.CircleGeometry(opts.radius || 1.5, 32);
    const topCap = new THREE.Mesh(capGeo.clone(), surfMat.clone());
    topCap.position.y = (opts.height || 4) / 2;
    topCap.rotation.x = -Math.PI / 2;
    group.add(topCap);
    const botCap = new THREE.Mesh(capGeo, surfMat.clone());
    botCap.position.y = -(opts.height || 4) / 2;
    botCap.rotation.x = Math.PI / 2;
    group.add(botCap);
  } else if (type === 'pillbox') {
    geo = new THREE.CylinderGeometry(opts.radius || 2, opts.radius || 2, opts.height || 0.8, 32);
  }
  if (geo) {
    group.add(new THREE.Mesh(geo, surfMat));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), wireMat));
  }
  if (opts.position) group.position.copy(opts.position);
  return ctx.addMesh(group);
}

export function highlightSegment(ctx, opts = {}) {
  const { start, end, color = 0xffff00, radius = 0.055 } = opts;
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).add(dir.clone().multiplyScalar(0.5));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.quaternion.copy(q);
  return ctx.addMesh(mesh);
}

export function highlightArc(ctx, opts = {}) {
  const { radius = 2, startAngle = 0, arcLength = 0.3, color = 0xffff00, y = 0 } = opts;
  const pts = [];
  const segs = 20;
  for (let i = 0; i <= segs; i++) {
    const a = startAngle + (i / segs) * arcLength;
    pts.push(new THREE.Vector3(radius * Math.cos(a), y, radius * Math.sin(a)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 3 });
  return ctx.addMesh(new THREE.Line(geo, mat));
}

export function createWire(ctx, opts = {}) {
  const { path, radius = 0.04, color = 0xccaa44 } = opts;
  const curve = new THREE.CatmullRomCurve3(path);
  const geo = new THREE.TubeGeometry(curve, path.length * 4, radius, 8, false);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
  return ctx.addMesh(new THREE.Mesh(geo, mat));
}

export function createSolenoid(ctx, opts = {}) {
  const { radius = 1, length = 4, turns = 20, wireRadius = 0.03, color = 0xccaa44 } = opts;
  const pts = [];
  const steps = turns * 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = turns * Math.PI * 2 * t;
    pts.push(new THREE.Vector3(radius * Math.cos(a), -length / 2 + length * t, radius * Math.sin(a)));
  }
  return createWire(ctx, { path: pts, radius: wireRadius, color });
}

export function createToroid(ctx, opts = {}) {
  const { majorRadius = 2, minorRadius = 0.5, turns = 60, wireRadius = 0.02, color = 0xccaa44 } = opts;
  const pts = [];
  const steps = turns * 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mAngle = t * Math.PI * 2;
    const wAngle = t * turns * Math.PI * 2;
    const r = majorRadius + minorRadius * Math.cos(wAngle);
    pts.push(new THREE.Vector3(r * Math.cos(mAngle), minorRadius * Math.sin(wAngle), r * Math.sin(mAngle)));
  }
  return createWire(ctx, { path: pts, radius: wireRadius, color });
}

export function createFluxArrows(ctx, fieldFn, surfaceType, opts = {}) {
  const { radius = 2, height = 4, count = 12, arrowScale = 0.6 } = opts;
  const group = new THREE.Group();
  const positions = [], normals = [];
  if (surfaceType === 'sphere') {
    const sp = startPointsOnSphere(new THREE.Vector3(), radius, count * 3);
    for (const pt of sp) { positions.push(pt); normals.push(pt.clone().normalize()); }
  } else if (surfaceType === 'cylinder-barrel') {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      for (let j = -1; j <= 1; j++) {
        const pos = new THREE.Vector3(radius * Math.cos(a), j * height / 4, radius * Math.sin(a));
        positions.push(pos);
        normals.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
      }
    }
  }
  for (let i = 0; i < positions.length; i++) {
    const E = fieldFn(positions[i]);
    const EdotN = E.dot(normals[i]);
    const color = EdotN > 0 ? 0x44ff88 : 0xff4444;
    const arrow = new THREE.ArrowHelper(normals[i], positions[i], Math.abs(EdotN) * arrowScale + 0.15, color, 0.12, 0.06);
    group.add(arrow);
  }
  return ctx.addMesh(group);
}

export function createEquipotentialPlane(ctx, potFn, opts = {}) {
  const { y = 0, size = 8, res = 50, minV = -3, maxV = 3, opacity = 0.5 } = opts;
  const geo = new THREE.PlaneGeometry(size, size, res, res);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getY(i);
    const V = potFn(new THREE.Vector3(x, y, z));
    const t = Math.max(0, Math.min(1, (V - minV) / (maxV - minV)));
    const c = new THREE.Color();
    if (t < 0.5) c.setRGB(t * 2, t * 2, 1);
    else c.setRGB(1, (1 - t) * 2, (1 - t) * 2);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return ctx.addMesh(mesh);
}
