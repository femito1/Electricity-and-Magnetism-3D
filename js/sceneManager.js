import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export { THREE, CSS2DObject };

export default class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07080d);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);
    this.camera.position.set(5, 4, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    Object.assign(this.labelRenderer.domElement.style, {
      position: 'absolute', top: '0', left: '0', pointerEvents: 'none'
    });
    container.appendChild(this.labelRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;

    this.scene.add(new THREE.AmbientLight(0x4060a0, 0.6));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.8);
    d1.position.set(8, 12, 8);
    this.scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x4488cc, 0.3);
    d2.position.set(-5, -2, -5);
    this.scene.add(d2);

    this.grid = new THREE.GridHelper(20, 20, 0x1a1c2e, 0x12141f);
    this.scene.add(this.grid);
    this.axes = new THREE.AxesHelper(4);
    this.scene.add(this.axes);

    this.sceneObjects = [];
    this.sceneLabels = [];
    this.currentScene = null;
    this.currentState = null;
    this.currentCtx = null;
    this.clock = new THREE.Clock();
    this.isPlaying = true;
    this.playbackSpeed = 1.0;
    this.elapsedTime = 0;

    this._animate = this._animate.bind(this);
    this._animate();
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    new ResizeObserver(() => this._onResize()).observe(container);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const dt = this.clock.getDelta();
    if (this.isPlaying) this.elapsedTime += dt * this.playbackSpeed;
    if (this.currentScene?.animate && this.currentState && this.isPlaying) {
      this.currentScene.animate(this.currentState, {
        ...this.currentCtx,
        time: this.elapsedTime,
        dt: dt * this.playbackSpeed
      });
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  _ctx(params, toggles) {
    const self = this;
    return {
      scene: this.scene,
      camera: this.camera,
      THREE,
      params: params || {},
      toggles: toggles || {},
      addMesh(mesh) {
        self.scene.add(mesh);
        self.sceneObjects.push(mesh);
        return mesh;
      },
      addLabel(position, latex, cls) {
        const div = document.createElement('div');
        div.className = 'label-3d' + (cls ? ' ' + cls : '');
        katex.render(latex, div, { throwOnError: false, displayMode: false });
        const obj = new CSS2DObject(div);
        obj.position.copy(position);
        self.scene.add(obj);
        self.sceneLabels.push(obj);
        return obj;
      },
      addDynamicLabel(position) {
        const div = document.createElement('div');
        div.className = 'label-3d';
        div.style.fontFamily = 'inherit';
        div.style.fontSize = '13px';
        const obj = new CSS2DObject(div);
        obj.position.copy(position);
        self.scene.add(obj);
        self.sceneLabels.push(obj);
        return obj;
      },
      addGroup() {
        const g = new THREE.Group();
        self.scene.add(g);
        self.sceneObjects.push(g);
        return g;
      }
    };
  }

  loadScene(sceneDef, params, toggles) {
    this.clearSceneObjects();
    this.currentScene = sceneDef;
    this.elapsedTime = 0;
    this.clock.start();
    const ctx = this._ctx(params, toggles);
    this.currentCtx = ctx;
    this.currentState = sceneDef.setup(ctx);
    if (sceneDef.cameraPosition) {
      this.camera.position.set(...sceneDef.cameraPosition);
    } else {
      this.camera.position.set(5, 4, 5);
    }
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  updateParams(params, toggles) {
    if (!this.currentScene) return;
    this.clearSceneObjects();
    const ctx = this._ctx(params, toggles);
    this.currentCtx = ctx;
    this.currentState = this.currentScene.setup(ctx);
  }

  clearSceneObjects() {
    for (const obj of this.sceneObjects) {
      this.scene.remove(obj);
      obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
        }
      });
    }
    this.sceneObjects = [];
    for (const label of this.sceneLabels) {
      this.scene.remove(label);
      if (label.element?.parentNode) label.element.parentNode.removeChild(label.element);
    }
    this.sceneLabels = [];
  }

  setSpeed(s) { this.playbackSpeed = s; }
}
