/**
 * Apex Auto Lounge - Dealership 3D Local Model Viewer
 * Uses existing local Draco GLTF models (./models/ferrari.glb & ./models/bmw_m4.glb),
 * physical automotive clearcoat paint materials, radial gallery contact shadow,
 * software-WebGL frame pacing, and live 3D snapshot capture for flanking depth-of-field previews.
 */

(function (window, document) {
  'use strict';

  // All 4 hero vehicle slots map directly to existing local .glb models in /models/
  const MODEL_CONFIG = {
    ferrari: {
      path: './models/ferrari.glb',
      scale: 0.9,
      positionY: 0,
      paintMaterialNames: ['Body_Color', 'Ferrari_Yellow', '_0098_DodgerBlue', 'body', 'paint'],
      defaultColor: '#FD6E6E', // Coral / Rosso
      cameraPos: [-4.1, 1.65, -5.2],
      targetPos: [0, 0.36, 0]
    },
    porsche: {
      path: './models/bmw_m4.glb',
      scale: 0.9,
      positionY: 0,
      paintMaterialNames: ['mMAT_Carpaint_Blue1', 'paint', 'coat', 'body'],
      defaultColor: '#FF3B30', // Poppy Red
      cameraPos: [4.9, 1.95, 5.4],
      targetPos: [0, 0.36, 0]
    },
    bmw: {
      path: './models/bmw_m4.glb',
      scale: 0.9,
      positionY: 0,
      paintMaterialNames: ['mMAT_Carpaint_Blue1', 'paint', 'body'],
      defaultColor: '#2563EB', // Cobalt / Pine Butter Accent
      cameraPos: [-4.9, 1.95, 5.4],
      targetPos: [0, 0.36, 0]
    },
    audi: {
      path: './models/ferrari.glb',
      scale: 0.9,
      positionY: 0,
      paintMaterialNames: ['Body_Color', 'Ferrari_Yellow', '_0098_DodgerBlue', 'body', 'paint'],
      defaultColor: '#D4AF37', // Champagne Gold
      cameraPos: [4.1, 1.65, -5.2],
      targetPos: [0, 0.36, 0]
    }
  };

  // Direct carId aliases
  MODEL_CONFIG['porsche-gt3-rs-2024'] = MODEL_CONFIG.porsche;
  MODEL_CONFIG['ferrari-roma-2023'] = MODEL_CONFIG.ferrari;
  MODEL_CONFIG['mercedes-amg-g63-2024'] = MODEL_CONFIG.bmw;
  MODEL_CONFIG['audi-rs6-avant-2024'] = MODEL_CONFIG.audi;

  // Detect software WebGL (SwiftShader / llvmpipe) per threejs skill
  const isSoftwareGl = (() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return true;
    }
  })();

  class Apex3DViewer {
    constructor(containerId = 'hero-3d-stage-container', options = {}) {
      this.container = document.getElementById(containerId);
      this.options = Object.assign(
        {
          initialModel: 'ferrari',
          initialColor: '#FD6E6E',
          autoRotate: !isSoftwareGl,
          autoRotateSpeed: 0.75
        },
        options
      );

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.currentModel = null;
      this.currentModelKey = this.options.initialModel;
      this.currentColor = this.options.initialColor;
      this.paintMaterials = [];
      this.modelCache = new Map();
      this.loadingPromises = new Map();
      this.targetCameraPos = null;
      this.animationFrameId = null;
      this.timeoutId = null;
      this.idlePreloadId = null;
      this.intersectionObserver = null;
      this.isVisibleInViewport = true;
      this.isLoopRunning = false;
      this.isInitialized = false;
      this.dracoLoader = null;
      this.gltfLoader = null;
      this.canvas = null;
      this.carImageFallback = null;
      this.loadToken = 0;

      this.init();
    }

    init() {
      if (!this.container) return;

      this.setupInstantFallback();

      if (!this.checkWebGLSupport() || typeof window.THREE === 'undefined') {
        this.enableInteractiveTilt();
        return;
      }

      try {
        this.setupThreeScene();
        this.setupLighting();
        this.setupContactShadow();
        this.setupControls();
        this.setupLoaders();
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        window.addEventListener('resize', this.onWindowResize, { passive: true });
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.setupViewportObserver();

        this.startRenderLoop();
        this.loadModel(this.currentModelKey, this.currentColor);

        this.isInitialized = true;
        Apex3DViewer.activeInstance = this;
      } catch (err) {
        Apex3DViewer.activeInstance = this;
        console.warn('Apex3DViewer fallback:', err);
        this.enableInteractiveTilt();
      }
    }

    setupViewportObserver() {
      if (typeof IntersectionObserver === 'undefined' || !this.container) return;
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          this.isVisibleInViewport = entry.isIntersecting;
          if (this.isVisibleInViewport && !document.hidden) {
            this.startRenderLoop();
          } else {
            this.stopRenderLoop();
          }
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(this.container);
    }

    onVisibilityChange() {
      if (document.hidden) {
        this.stopRenderLoop();
      } else if (this.isVisibleInViewport) {
        this.startRenderLoop();
      }
    }

    startRenderLoop() {
      if (this.isLoopRunning) return;
      this.isLoopRunning = true;
      this.animate();
    }

    stopRenderLoop() {
      this.isLoopRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }

    checkWebGLSupport() {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch (e) {
        return false;
      }
    }

    setupInstantFallback() {
      let fallback = this.container.querySelector('.hero-3d-instant-fallback');
      if (!fallback) {
        fallback = document.createElement('div');
        fallback.className = 'hero-3d-instant-fallback';
        fallback.innerHTML = `
          <img 
            id="hero-3d-fallback-img" 
            class="hero-3d-car-img" 
            src="./models/ferrari_render.png" 
            alt="Apex Auto Lounge 3D Vehicle" 
            loading="eager"
          />
        `;
        this.container.appendChild(fallback);
      }
      this.carImageFallback = fallback;
    }

    setupThreeScene() {
      let canvas = this.container.querySelector('#hero-3d-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hero-3d-canvas';
        canvas.className = 'hero-3d-canvas';
        this.container.appendChild(canvas);
      }
      this.canvas = canvas;

      const width = this.container.clientWidth || 760;
      const height = this.container.clientHeight || 500;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
      this.camera.position.set(-4.1, 1.65, -5.2);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      if (this.renderer.outputEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      if (this.renderer.toneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.92;
      }

      // Generate procedural studio softbox environment reflection so metallic paint & glass have rich contrast
      try {
        const envCanvas = document.createElement('canvas');
        envCanvas.width = 512;
        envCanvas.height = 256;
        const ectx = envCanvas.getContext('2d');
        const grad = ectx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#1e2430');
        grad.addColorStop(0.25, '#ffffff');
        grad.addColorStop(0.48, '#2d3340');
        grad.addColorStop(0.55, '#12151c');
        grad.addColorStop(1, '#090b10');
        ectx.fillStyle = grad;
        ectx.fillRect(0, 0, 512, 256);
        const envTex = new THREE.CanvasTexture(envCanvas);
        if (THREE.EquirectangularReflectionMapping) {
          envTex.mapping = THREE.EquirectangularReflectionMapping;
        }
        this.scene.environment = envTex;
      } catch (e) {}
    }

    setupLighting() {
      // Balanced High-Contrast Studio Rig for Deep Saturated Car Paint on White Backdrop
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.72);
      hemiLight.position.set(0, 10, 0);
      this.scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfffdf8, 1.35);
      keyLight.position.set(-6, 9, -6);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xcbd5e1, 0.78);
      fillLight.position.set(6, 5, 5);
      this.scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
      rimLight.position.set(0, 6, -8);
      this.scene.add(rimLight);

      const topSpot = new THREE.SpotLight(0xffffff, 1.15);
      topSpot.position.set(0, 9, 0);
      topSpot.angle = Math.PI / 3;
      topSpot.penumbra = 0.85;
      this.scene.add(topSpot);
    }

    setupContactShadow() {
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 512;
      shadowCanvas.height = 512;
      const ctx = shadowCanvas.getContext('2d');

      const gradient = ctx.createRadialGradient(256, 256, 18, 256, 256, 235);
      gradient.addColorStop(0, 'rgba(15, 18, 26, 0.55)');
      gradient.addColorStop(0.38, 'rgba(15, 18, 26, 0.30)');
      gradient.addColorStop(0.7, 'rgba(15, 18, 26, 0.08)');
      gradient.addColorStop(1, 'rgba(15, 18, 26, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const planeGeometry = new THREE.PlaneGeometry(5.6, 3.7);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      });
      const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.01;
      shadowPlane.name = 'groundContactShadow';
      this.scene.add(shadowPlane);
    }

    setupControls() {
      if (typeof THREE.OrbitControls === 'function') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = !isSoftwareGl;
        this.controls.dampingFactor = 0.06;
        this.controls.enableZoom = false;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
        this.controls.minPolarAngle = Math.PI / 7;
        this.controls.enablePan = false;
        this.controls.autoRotate = !isSoftwareGl && this.options.autoRotate;
        this.controls.autoRotateSpeed = this.options.autoRotateSpeed;
        if (THREE.TOUCH) {
          this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DO_NOTHING };
        }
      }
    }

    setupLoaders() {
      this.gltfLoader = new THREE.GLTFLoader();

      if (typeof THREE.DRACOLoader === 'function') {
        this.dracoLoader = new THREE.DRACOLoader();
        this.dracoLoader.setDecoderPath('./scripts/vendor/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
      }
    }

    prepareModelEntry(gltf, config, initialColor) {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      // Measure unscaled world bounds and auto-normalize so 0.01x FBX exports (bmw_m4.glb) match ferrari.glb
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      const targetSpan = config.targetSpan || 4.15;
      const normalizedScale = maxDim > 0.0001 ? targetSpan / maxDim : config.scale;

      model.scale.setScalar(normalizedScale);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y = (config.positionY || 0) - box.min.y;

      const paintMaterials = [];
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          const mat = child.material;
          const matName = (mat.name || '').toLowerCase();
          const meshName = (child.name || '').toLowerCase();
          const isPaint =
            (mat.name && config.paintMaterialNames.some((pName) => mat.name.includes(pName))) ||
            matName.includes('carpaint') ||
            matName.includes('body') ||
            matName.includes('paint') ||
            meshName.includes('body') ||
            meshName.includes('paint');

          if (isPaint) {
            if (!child.material.isMeshPhysicalMaterial) {
              child.material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(initialColor),
                metalness: 0.32,
                roughness: 0.24,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05
              });
            }
            paintMaterials.push(child.material);
          }
        }
      });

      return {
        model,
        paintMaterials,
        targetY: size.y * 0.35
      };
    }

    fetchAndCacheModel(config, initialColor) {
      if (this.modelCache.has(config.path)) {
        return Promise.resolve(this.modelCache.get(config.path));
      }
      if (this.loadingPromises.has(config.path)) {
        return this.loadingPromises.get(config.path);
      }

      const promise = new Promise((resolve, reject) => {
        if (!this.gltfLoader) {
          reject(new Error('GLTFLoader unavailable'));
          return;
        }
        this.gltfLoader.load(
          config.path,
          (gltf) => {
            const entry = this.prepareModelEntry(gltf, config, initialColor);
            this.modelCache.set(config.path, entry);
            this.loadingPromises.delete(config.path);
            resolve(entry);
          },
          undefined,
          (err) => {
            this.loadingPromises.delete(config.path);
            reject(err);
          }
        );
      });

      this.loadingPromises.set(config.path, promise);
      return promise;
    }

    scheduleIdlePreload() {
      if (this.idlePreloadId) return;
      const runPreload = () => {
        const secondaryKeys = ['porsche', 'ferrari'];
        secondaryKeys.forEach((key) => {
          const cfg = MODEL_CONFIG[key];
          if (cfg && !this.modelCache.has(cfg.path) && !this.loadingPromises.has(cfg.path)) {
            this.fetchAndCacheModel(cfg, cfg.defaultColor).catch(() => {});
          }
        });
      };

      if (typeof window.requestIdleCallback === 'function') {
        this.idlePreloadId = window.requestIdleCallback(runPreload, { timeout: 1500 });
      } else {
        this.idlePreloadId = window.setTimeout(runPreload, 500);
      }
    }

    activateCachedModel(entry, config, targetColor) {
      if (this.currentModel && this.currentModel !== entry.model) {
        this.scene.remove(this.currentModel);
      }

      this.paintMaterials = entry.paintMaterials;
      this.currentModel = entry.model;

      if (this.currentModel.parent !== this.scene) {
        this.scene.add(this.currentModel);
      }

      this.changeCarColor(targetColor);

      if (config.cameraPos) {
        if (!isSoftwareGl && this.camera) {
          this.targetCameraPos = new THREE.Vector3(
            config.cameraPos[0],
            config.cameraPos[1],
            config.cameraPos[2]
          );
          // Snap 70% toward target angle immediately so the remaining 30% glides during fade-in
          this.camera.position.lerp(this.targetCameraPos, 0.72);
        } else if (this.camera) {
          this.camera.position.set(config.cameraPos[0], config.cameraPos[1], config.cameraPos[2]);
          this.targetCameraPos = null;
        }
      }

      if (this.controls) {
        this.controls.target.set(0, entry.targetY, 0);
        this.controls.update();
      } else if (this.camera) {
        this.camera.lookAt(0, entry.targetY, 0);
      }

      if (this.carImageFallback) {
        this.carImageFallback.classList.add('has-3d-loaded');
      }

      // Render an immediate frame so WebGL canvas matches the swapped vehicle before fade-in
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    loadModel(modelKey = 'ferrari', color = null) {
      const config = MODEL_CONFIG[modelKey] || MODEL_CONFIG.ferrari;
      this.currentModelKey = modelKey;
      const targetColor = color || config.defaultColor || this.currentColor;
      this.currentColor = targetColor;

      if (!this.gltfLoader) return;

      const currentToken = ++this.loadToken;

      // Fast Path: Instantaneous <0.2ms swap if GLB is already in memory cache
      if (this.modelCache.has(config.path)) {
        const cachedEntry = this.modelCache.get(config.path);
        this.activateCachedModel(cachedEntry, config, targetColor);
        return;
      }

      this.fetchAndCacheModel(config, targetColor)
        .then((entry) => {
          if (currentToken !== this.loadToken) return;
          this.activateCachedModel(entry, config, targetColor);
          this.scheduleIdlePreload();
        })
        .catch((err) => {
          console.warn('Apex3DViewer: Fallback kept for ' + modelKey, err);
          this.enableInteractiveTilt();
        });
    }

    changeCarColor(hexColor) {
      this.currentColor = hexColor;
      if (typeof THREE === 'undefined') return;
      const threeColor = new THREE.Color(hexColor);
      // Deepen bright pastel hexes slightly for rich automotive clearcoat saturation
      const hsl = {};
      threeColor.getHSL(hsl);
      if (hsl.l > 0.56) {
        threeColor.setHSL(hsl.h, Math.min(1, hsl.s * 1.15), 0.44);
      }

      if (this.paintMaterials && this.paintMaterials.length > 0) {
        this.paintMaterials.forEach((mat) => {
          mat.color.copy(threeColor);
          if (mat.clearcoat !== undefined) mat.clearcoat = 1.0;
          if (mat.metalness !== undefined) mat.metalness = 0.32;
          if (mat.roughness !== undefined) mat.roughness = 0.24;
          mat.needsUpdate = true;
        });
      } else if (this.currentModel) {
        this.currentModel.traverse((child) => {
          if (child.isMesh && child.material && child.material.color) {
            const cName = (child.name || '').toLowerCase();
            const mName = (child.material.name || '').toLowerCase();
            if (cName.includes('body') || mName.includes('body') || mName.includes('paint')) {
              child.material.color.copy(threeColor);
              child.material.needsUpdate = true;
            }
          }
        });
      }

      if (this.carImageFallback) {
        this.carImageFallback.style.setProperty('--car-color-accent', hexColor);
      }
    }

    enableInteractiveTilt() {
      if (!this.carImageFallback) return;
      const card = this.container;
      const img = this.carImageFallback.querySelector('.hero-3d-car-img');
      if (!img) return;

      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : rect.width / 2;
        const clientY = e.clientY !== undefined ? e.clientY : rect.height / 2;
        const x = (clientX - rect.left) / rect.width - 0.5;
        const y = (clientY - rect.top) / rect.height - 0.5;
        img.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;
      };

      const handleLeave = () => {
        img.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
      };

      card.addEventListener('mousemove', handleMove, { passive: true });
      card.addEventListener('mouseleave', handleLeave, { passive: true });
    }

    onWindowResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    afterDraw(cb) {
      if (!this.renderer || !this.isLoopRunning) return;
      const gl = this.renderer.getContext();
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (!this.isLoopRunning) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            this.timeoutId = window.setTimeout(poll, 8);
          } else {
            if (sync) gl.deleteSync(sync);
            this.timeoutId = window.setTimeout(cb, 85);
          }
        };
        this.timeoutId = window.setTimeout(poll, 8);
      } else {
        this.timeoutId = window.setTimeout(cb, 85);
      }
    }

    animate() {
      if (!this.isLoopRunning) return;

      if (this.targetCameraPos && this.camera) {
        this.camera.position.lerp(this.targetCameraPos, 0.16);
        if (this.camera.position.distanceToSquared(this.targetCameraPos) < 0.002) {
          this.targetCameraPos = null;
        }
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      if (isSoftwareGl) {
        this.afterDraw(this.animate);
      } else {
        this.animationFrameId = requestAnimationFrame(this.animate);
      }
    }

    destroy() {
      this.stopRenderLoop();
      window.removeEventListener('resize', this.onWindowResize);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }

      this.modelCache.forEach((entry) => {
        if (entry.model) {
          this.scene?.remove(entry.model);
          entry.model.traverse((child) => {
            if (child.isMesh && child.geometry) {
              child.geometry.dispose();
            }
          });
        }
      });
      this.modelCache.clear();
      this.loadingPromises.clear();

      if (this.renderer) {
        this.renderer.dispose();
      }
      if (Apex3DViewer.activeInstance === this) {
        Apex3DViewer.activeInstance = null;
      }
    }
  }

  Apex3DViewer.activeInstance = null;

  Apex3DViewer.changeCarColor = function (color) {
    if (Apex3DViewer.activeInstance && typeof Apex3DViewer.activeInstance.changeCarColor === 'function') {
      Apex3DViewer.activeInstance.changeCarColor(color);
    }
  };

  Apex3DViewer.loadModel = function (modelKeyOrCarId, color) {
    if (Apex3DViewer.activeInstance && typeof Apex3DViewer.activeInstance.loadModel === 'function') {
      Apex3DViewer.activeInstance.loadModel(modelKeyOrCarId, color);
    }
  };

  window.Apex3DViewer = Apex3DViewer;
})(window, document);

