import * as THREE from 'three';
import { coulombField, createFieldLinesForCharges } from '../fieldViz.js';

const MAX_CHARGES = 20;

function coulombPotential(charges) {
  return (p) => {
    let V = 0;
    for (const c of charges) {
      const dx = p.x - c.pos.x, dz = p.z - c.pos.z;
      const r = Math.sqrt(dx * dx + dz * dz);
      if (r < 0.2) continue;
      V += c.q / r;
    }
    return V;
  };
}

export default {
  id: 'sandbox',
  title: 'Sandbox',
  description: 'Set charge sign & magnitude, then click the grid to place. Click a placed charge to select & edit it. Click empty ground or press Escape to deselect.',
  equations: [],
  sliders: [],
  toggles: [],
  isSandbox: true,

  setup(ctx) {
    const scene = ctx.scene;
    const charges = [];
    let selectedIdx = -1;

    let vizGroup = new THREE.Group();
    scene.add(vizGroup);

    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x151722, transparent: true, opacity: 0.4, side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ctx.addMesh(ground);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseDownPos = null;
    const DRAG_THRESHOLD = 5;
    let nextChargeQ = 1;
    let onSelect = null;
    let onDeselect = null;

    function chargeColor(q) { return q > 0 ? 0xff5566 : 0x5588ff; }

    function selectCharge(idx) {
      selectedIdx = idx;
      for (let i = 0; i < charges.length; i++) {
        charges[i].mesh.scale.setScalar(i === idx ? 1.3 : 1.0);
        charges[i].mesh.material.emissiveIntensity = i === idx ? 0.8 : 0.3;
      }
      if (idx >= 0 && typeof onSelect === 'function') {
        onSelect(idx, charges[idx]);
      }
      if (idx < 0 && typeof onDeselect === 'function') {
        onDeselect();
      }
    }

    function addCharge(pos, q) {
      if (charges.length >= MAX_CHARGES) return;
      const color = chargeColor(q);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
      );
      mesh.position.copy(pos);
      ctx.addMesh(mesh);
      charges.push({ pos: pos.clone(), q, mesh });
      rebuild();
    }

    function removeCharge(idx) {
      if (idx < 0 || idx >= charges.length) return;
      ctx.removeMesh(charges[idx].mesh);
      charges.splice(idx, 1);
      selectCharge(-1);
      rebuild();
    }

    function updateChargeValue(idx, q) {
      if (idx < 0 || idx >= charges.length) return;
      charges[idx].q = q;
      const color = chargeColor(q);
      charges[idx].mesh.material.color.setHex(color);
      charges[idx].mesh.material.emissive.setHex(color);
      rebuild();
    }

    function clearVizGroup() {
      while (vizGroup.children.length) {
        const child = vizGroup.children[0];
        vizGroup.remove(child);
        child.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
          }
        });
      }
    }

    function rebuild() {
      clearVizGroup();
      if (charges.length === 0) return;
      const fieldFn = coulombField(charges);

      if (ctx.toggles.showArrows !== false) {
        buildArrows(fieldFn);
      }
      if (ctx.toggles.showLines) {
        buildFieldLines(fieldFn);
      }
      if (ctx.toggles.showEquipotential) {
        buildEquipotential();
      }
    }

    function buildArrows(fieldFn) {
      const step = charges.length > 8 ? 2.5 : 1.8;
      const stepY = step * 1.2;
      const group = new THREE.Group();
      const headLen = 0.15, headWid = 0.08;
      for (let y = -4; y <= 4; y += stepY) {
        for (let x = -6; x <= 6; x += step) {
          for (let z = -6; z <= 6; z += step) {
            const p = new THREE.Vector3(x, y, z);
            let skip = false;
            for (const c of charges) {
              if (p.distanceTo(c.pos) < 0.5) { skip = true; break; }
            }
            if (skip) continue;
            const E = fieldFn(p);
            const mag = E.length();
            if (mag < 0.01) continue;
            const dir = E.clone().normalize();
            const len = Math.min(Math.sqrt(mag) * 0.7, 1.4);
            const t = Math.min(mag / 6, 1);
            const col = new THREE.Color().setHSL(0.55 - t * 0.5, 0.9, 0.35 + t * 0.3);
            const arrow = new THREE.ArrowHelper(dir, p, len, col.getHex(), headLen, headWid);
            arrow.line.material.transparent = true;
            arrow.line.material.opacity = 0.75;
            arrow.cone.material.transparent = true;
            arrow.cone.material.opacity = 0.75;
            group.add(arrow);
          }
        }
      }
      vizGroup.add(group);
    }

    function buildFieldLines(fieldFn) {
      const chargesData = charges.map(c => ({ pos: c.pos, q: c.q }));
      const group = createFieldLinesForCharges(ctx, fieldFn, chargesData, {
        bounds: 10, opacity: 0.5, minLines: 8, maxLines: 14
      });
      vizGroup.add(group);
    }

    function buildEquipotential() {
      const potFn = coulombPotential(charges);
      const size = 16;
      const res = 80;
      const geo = new THREE.PlaneGeometry(size, size, res, res);
      const attr = geo.attributes.position;
      const colors = new Float32Array(attr.count * 3);
      for (let i = 0; i < attr.count; i++) {
        const wx = attr.getX(i);
        const wz = -attr.getY(i);
        const V = potFn(new THREE.Vector3(wx, 0, wz));
        const clamped = Math.max(-5, Math.min(5, V));
        const t = (clamped + 5) / 10;
        const col = new THREE.Color();
        if (t < 0.5) col.setRGB(t * 2, t * 2, 1);
        else col.setRGB(1, (1 - t) * 2, (1 - t) * 2);
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.5, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -0.02;
      vizGroup.add(mesh);
    }

    function onMouseDown(e) {
      if (e.button !== 0) return;
      mouseDownPos = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp(e) {
      if (e.button !== 0 || !mouseDownPos) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      mouseDownPos = null;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;

      const rect = ctx.rendererDom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, ctx.camera);

      const meshes = charges.map(c => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const idx = meshes.indexOf(hits[0].object);
        if (idx !== -1) {
          selectCharge(idx);
          return;
        }
      }

      const groundHits = raycaster.intersectObject(ground, false);
      if (groundHits.length > 0) {
        if (selectedIdx >= 0) {
          selectCharge(-1);
        } else {
          const pt = groundHits[0].point;
          pt.y = 0;
          addCharge(pt, nextChargeQ);
        }
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape' && selectedIdx >= 0) {
        selectCharge(-1);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx >= 0) {
        removeCharge(selectedIdx);
      }
    }

    ctx.rendererDom.addEventListener('mousedown', onMouseDown);
    ctx.rendererDom.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    ctx.rendererDom.style.cursor = 'crosshair';

    ctx.onDispose(() => {
      ctx.rendererDom.removeEventListener('mousedown', onMouseDown);
      ctx.rendererDom.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      ctx.rendererDom.style.cursor = '';
      clearVizGroup();
      scene.remove(vizGroup);
    });

    return {
      charges,
      addCharge,
      removeCharge,
      updateChargeValue,
      rebuild,
      getSelected() { return selectedIdx; },
      selectCharge,
      clearAll() {
        while (charges.length) removeCharge(charges.length - 1);
      },
      setNextChargeQ(q) { nextChargeQ = q; },
      setOnSelect(fn) { onSelect = fn; },
      setOnDeselect(fn) { onDeselect = fn; }
    };
  }
};
