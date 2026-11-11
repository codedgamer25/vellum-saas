/**
 * Apex Auto Lounge - Dealership 3D Local Model Viewer
 * Uses existing local Draco GLTF models (./models/ferrari.glb & ./models/bmw_m4.glb),
 * physical automotive clearcoat paint materials, radial gallery contact shadow,
 * software-WebGL frame pacing, and live 3D snapshot capture for flanking depth-of-field previews.
 */

(function (window, document) {
  'use strict';

  // Dedicated 3D GLB models for all 4 hero vehicles, normalized to the lit front-left 3/4 studio angle
  const MODEL_CONFIG = {
    ferrari: {
      path: './models/ferrari.glb',
      scale: 0.82,
      targetSpan: 3.45,
      rotationY: 0,
      positionY: 0,
      paintMaterialNames: ['Body_Color', 'Ferrari_Yellow', '_0098_DodgerBlue'],
      windowMaterialNames: ['Glass_Gray'],
      defaultColor: '#E11D48', // Rosso Corsa Crimson
      cameraPos: [-4.65, 1.75, -5.85],
      targetPos: [0, 0.34, 0]
    },
    porsche: {
      path: './models/porsche_911.glb',
      scale: 0.82,
      targetSpan: 3.45,
      rotationY: Math.PI,
      positionY: 0,
      paintMaterialNames: ['paint', 'coat'],
      windowMaterialNames: ['window'],
      defaultColor: '#2563EB', // Gentian Sapphire Blue
      cameraPos: [-4.65, 1.75, -5.85],
      targetPos: [0, 0.34, 0]
    },
    mercedes: {
      path: './models/mercedes_g63.glb',
      scale: 0.82,
      targetSpan: 3.32,
      rotationY: Math.PI,
      positionY: 0,
      paintMaterialNames: ['MMAT_CarPaint_010'],
      windowMaterialNames: ['MMAT_Glass1'],
      defaultColor: '#059669', // AMG Emerald Green
      cameraPos: [-4.65, 1.82, -5.85],
      targetPos: [0, 0.38, 0]
    },
    audi: {
      path: './models/audi_rs6.glb',
      scale: 0.82,
      targetSpan: 3.45,
      rotationY: Math.PI,
      positionY: 0,
      paintMaterialNames: ['CARI_PAINT'],
      windowMaterialNames: ['Glass'],
      defaultColor: '#D97706', // Solarbeam Amber Gold
      cameraPos: [-4.65, 1.75, -5.85],
      targetPos: [0, 0.34, 0]
    }
  };

  // Legacy & direct carId aliases
  MODEL_CONFIG.bmw = MODEL_CONFIG.mercedes;
  MODEL_CONFIG['porsche-gt3-rs-2024'] = MODEL_CONFIG.porsche;
  MODEL_CONFIG['ferrari-roma-2023'] = MODEL_CONFIG.ferrari;
  MODEL_CONFIG['mercedes-amg-g63-2024'] = MODEL_CONFIG.mercedes;
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
          autoRotate: false,
          autoRotateSpeed: 0.65
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
      this.spinOffset = 0;
      this.animationFrameId = null;
      this.timeoutId = null;
      this.idlePreloadId = null;
      this.intersectionObserver = null;
      this.isVisibleInViewport = true;
      this.isLoopRunning = false;
      this.isInteracting = false;
      this.dampingFramesRemaining = 0;
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
          if (!this.isVisibleInViewport || document.hidden) {
            this.stopRenderLoop();
          } else if (this.needsContinuousRender()) {
            this.startRenderLoop();
          }
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(this.container);
    }

    onVisibilityChange() {
      if (document.hidden) {
        this.stopRenderLoop();
      } else if (this.isVisibleInViewport && this.needsContinuousRender()) {
        this.startRenderLoop();
      }
    }

    needsContinuousRender() {
      return (
        this.isInteracting ||
        this.dampingFramesRemaining > 0 ||
        Math.abs(this.spinOffset) > 0.001 ||
        Boolean(this.targetCameraPos)
      );
    }

    wakeRenderLoop(frames = 28) {
      this.dampingFramesRemaining = Math.max(this.dampingFramesRemaining, frames);
      if (this.isVisibleInViewport && !document.hidden) {
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

      this.camera = new THREE.PerspectiveCamera(31, width / height, 0.1, 100);
      this.camera.position.set(-4.65, 1.75, -5.85);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setSize(width, height);
      // Crisp 2x Retina rendering on hardware WebGL
      this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      if (this.renderer.outputEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      if (this.renderer.toneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.95;
      }

      // Lightweight 256x128 studio softbox reflection texture
      try {
        const envCanvas = document.createElement('canvas');
        envCanvas.width = 256;
        envCanvas.height = 128;
        const ectx = envCanvas.getContext('2d');
        const grad = ectx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#1e2430');
        grad.addColorStop(0.25, '#ffffff');
        grad.addColorStop(0.48, '#2d3340');
        grad.addColorStop(0.55, '#12151c');
        grad.addColorStop(1, '#090b10');
        ectx.fillStyle = grad;
        ectx.fillRect(0, 0, 256, 128);
        const envTex = new THREE.CanvasTexture(envCanvas);
        if (THREE.EquirectangularReflectionMapping) {
          envTex.mapping = THREE.EquirectangularReflectionMapping;
        }
        this.scene.environment = envTex;
      } catch (e) {}
    }

    setupLighting() {
      // Streamlined 3-Light Studio Rig (eliminates per-pixel SpotLight overhead)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.95);
      hemiLight.position.set(0, 10, 0);
      this.scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfffdf8, 1.65);
      keyLight.position.set(-5, 9, -6);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.95);
      fillLight.position.set(6, 6, 4);
      this.scene.add(fillLight);
    }

    setupContactShadow() {
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const ctx = shadowCanvas.getContext('2d');

      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 118);
      gradient.addColorStop(0, 'rgba(15, 18, 26, 0.55)');
      gradient.addColorStop(0.38, 'rgba(15, 18, 26, 0.30)');
      gradient.addColorStop(0.7, 'rgba(15, 18, 26, 0.08)');
      gradient.addColorStop(1, 'rgba(15, 18, 26, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

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
      shadowPlane.matrixAutoUpdate = false;
      shadowPlane.updateMatrix();
      shadowPlane.name = 'groundContactShadow';
      this.scene.add(shadowPlane);
    }

    setupControls() {
      if (typeof THREE.OrbitControls === 'function') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = !isSoftwareGl;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = false;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
        this.controls.minPolarAngle = Math.PI / 7;
        this.controls.enablePan = false;
        this.controls.autoRotate = false;
        if (THREE.TOUCH) {
          this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DO_NOTHING };
        }

        this.controls.addEventListener('start', () => {
          this.isInteracting = true;
          this.wakeRenderLoop(40);
        });
        this.controls.addEventListener('change', () => {
          if (!this.isLoopRunning && this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        });
        this.controls.addEventListener('end', () => {
          this.isInteracting = false;
          this.wakeRenderLoop(32);
        });
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
      model.rotation.set(0, config.rotationY || 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      // Single-pass bounding box calculation (avoids traversing all vertices twice)
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const rawCenter = rawBox.getCenter(new THREE.Vector3());
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      const targetSpan = config.targetSpan || 3.45;
      const normalizedScale = maxDim > 0.0001 ? targetSpan / maxDim : config.scale;

      model.scale.setScalar(normalizedScale);
      model.position.x = -rawCenter.x * normalizedScale;
      model.position.z = -rawCenter.z * normalizedScale;
      model.position.y = (config.positionY || 0) - rawBox.min.y * normalizedScale;
      model.updateMatrixWorld(true);

      const scaledHeight = rawSize.y * normalizedScale;

      const sharedPaintMat = new THREE.MeshStandardMaterial({
        name: 'ApexCarPaint',
        color: new THREE.Color(initialColor),
        metalness: 0.38,
        roughness: 0.18,
        envMapIntensity: 1.25,
        side: THREE.FrontSide
      });

      const sharedWindowMat = new THREE.MeshStandardMaterial({
        name: 'ApexTintedGlass',
        color: new THREE.Color(0x12161f),
        metalness: 0.85,
        roughness: 0.08,
        transparent: true,
        opacity: 0.86
      });

      const paintMaterials = [sharedPaintMat];
      model.traverse((child) => {
        if (child.isMesh) {
          child.matrixAutoUpdate = false;
          child.updateMatrix();
          if (child.material) {
            const mat = child.material;
            const matName = mat.name || '';
            const isPaint =
              Array.isArray(config.paintMaterialNames) &&
              config.paintMaterialNames.some(
                (pName) => matName === pName || matName.toLowerCase() === pName.toLowerCase() || matName.includes(pName)
              );
            const isWindow =
              !isPaint &&
              Array.isArray(config.windowMaterialNames) &&
              config.windowMaterialNames.some(
                (wName) => matName === wName || matName.toLowerCase() === wName.toLowerCase() || matName.includes(wName)
              );

            if (isPaint) {
              child.material = sharedPaintMat;
            } else if (isWindow) {
              child.material = sharedWindowMat;
            }
          }
        }
      });

      return {
        model,
        paintMaterials,
        baseRotationY: config.rotationY || 0,
        targetY: scaledHeight * 0.35
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

    preloadAllModels() {
      if (this.hasPreloadedAll) return;
      this.hasPreloadedAll = true;
      const keys = ['ferrari', 'porsche', 'mercedes', 'audi'];
      let delayMs = 80;
      keys.forEach((key) => {
        const cfg = MODEL_CONFIG[key];
        if (!cfg || this.modelCache.has(cfg.path) || this.loadingPromises.has(cfg.path)) return;
        window.setTimeout(() => {
          this.fetchAndCacheModel(cfg, cfg.defaultColor).catch(() => {});
        }, delayMs);
        delayMs += 110;
      });
    }

    activateCachedModel(entry, config, targetColor, direction = null) {
      if (this.currentModel && this.currentModel !== entry.model) {
        this.scene.remove(this.currentModel);
      }

      this.paintMaterials = entry.paintMaterials;
      this.currentModel = entry.model;
      this.currentBaseRotationY = entry.baseRotationY !== undefined ? entry.baseRotationY : (config.rotationY || 0);

      if (this.currentModel.parent !== this.scene) {
        this.scene.add(this.currentModel);
      }

      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Apply target paint color immediately when switching vehicles
      this.changeCarColor(targetColor, false);

      if (config.cameraPos && this.camera) {
        const aspect = this.camera.aspect ? this.camera.aspect : 1.5;
        const distScale = aspect < 1.4 ? Math.min(1.42, 1.4 / Math.max(aspect, 0.72)) : 1.0;
        const cx = config.cameraPos[0] * distScale;
        const cy = config.cameraPos[1] * distScale;
        const cz = config.cameraPos[2] * distScale;

        this.camera.position.set(cx, cy, cz);
        this.targetCameraPos = null;
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

      // Smooth 60fps 3D yaw settle when moving between cars
      if (!prefersReducedMotion && direction && window.gsap && this.currentModel) {
        const dirSign = direction === 'prev' ? -1 : 1;
        const startYaw = this.currentBaseRotationY + dirSign * 0.28;
        this.spinOffset = 0;
        this.currentModel.rotation.y = startYaw;
        window.gsap.killTweensOf(this.currentModel.rotation);
        window.gsap.to(this.currentModel.rotation, {
          y: this.currentBaseRotationY,
          duration: 0.66,
          ease: 'power3.out',
          onUpdate: () => {
            if (this.renderer && this.scene && this.camera) {
              this.renderer.render(this.scene, this.camera);
            }
          }
        });
      } else {
        this.spinOffset = 0;
        this.currentModel.rotation.y = this.currentBaseRotationY;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      // Preload remaining 3D vehicles so subsequent clicks are 0ms memory swaps
      this.preloadAllModels();
    }

    loadModel(modelKey = 'ferrari', color = null, direction = null) {
      const config = MODEL_CONFIG[modelKey] || MODEL_CONFIG.ferrari;
      this.currentModelKey = modelKey;
      const targetColor = color || config.defaultColor || this.currentColor;
      this.currentColor = targetColor;

      if (!this.gltfLoader) return;

      const currentToken = ++this.loadToken;

      // Fast Path: Instantaneous <0.2ms swap if GLB is already in memory cache
      if (this.modelCache.has(config.path)) {
        if (this.container) this.container.classList.remove('is-loading');
        const cachedEntry = this.modelCache.get(config.path);
        this.activateCachedModel(cachedEntry, config, targetColor, direction);
        return;
      }

      // If target GLB is still downloading, remove the previous vehicle's 3D mesh immediately
      // and reveal the matching high-res studio render (#hero-3d-fallback-img) during the diagonal glide
      if (this.currentModel && this.scene) {
        this.scene.remove(this.currentModel);
        this.currentModel = null;
        if (this.renderer && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      }
      if (this.carImageFallback) {
        this.carImageFallback.classList.remove('has-3d-loaded');
      }

      this.fetchAndCacheModel(config, targetColor)
        .then((entry) => {
          if (currentToken !== this.loadToken) return;
          if (this.container) this.container.classList.remove('is-loading');
          this.activateCachedModel(entry, config, targetColor, direction);
        })
        .catch((err) => {
          if (this.container) this.container.classList.remove('is-loading');
          console.warn('Apex3DViewer: Fallback kept for ' + modelKey, err);
          this.enableInteractiveTilt();
        });
    }

    changeCarColor(hexColor, animate = true) {
      this.currentColor = hexColor;
      if (typeof THREE === 'undefined') return;
      const threeColor = new THREE.Color(hexColor);
      const hsl = {};
      threeColor.getHSL(hsl);
      if (hsl.l > 0.45) {
        threeColor.setHSL(hsl.h, Math.min(1, Math.max(hsl.s, 0.88)), 0.42);
      }
      if (typeof threeColor.convertSRGBToLinear === 'function') {
        threeColor.convertSRGBToLinear();
      }

      if (this.paintMaterials && this.paintMaterials.length > 0) {
        this.paintMaterials.forEach((mat) => {
          if (animate && window.gsap && mat.color) {
            window.gsap.killTweensOf(mat.color);
            window.gsap.to(mat.color, {
              r: threeColor.r,
              g: threeColor.g,
              b: threeColor.b,
              duration: 0.42,
              ease: 'power2.out',
              onUpdate: () => {
                if (this.renderer && this.scene && this.camera) {
                  this.renderer.render(this.scene, this.camera);
                }
              }
            });
          } else {
            mat.color.copy(threeColor);
          }
          if (mat.metalness !== undefined) mat.metalness = 0.38;
          if (mat.roughness !== undefined) mat.roughness = 0.18;
          mat.needsUpdate = true;
        });
      }

      if (this.carImageFallback) {
        this.carImageFallback.style.setProperty('--car-color-accent', hexColor);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
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
      if (this.scene) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    afterDraw(cb) {
      if (!this.renderer || !this.isLoopRunning) return;
      this.timeoutId = window.setTimeout(cb, 48);
    }

    animate() {
      if (!this.isLoopRunning) return;

      let activeTransition = false;

      if (this.currentModel && Math.abs(this.spinOffset) > 0.001) {
        this.spinOffset *= 0.8;
        if (Math.abs(this.spinOffset) <= 0.002) {
          this.spinOffset = 0;
        } else {
          activeTransition = true;
        }
        this.currentModel.rotation.y = (this.currentBaseRotationY || 0) + this.spinOffset;
      }

      if (this.targetCameraPos && this.camera) {
        this.camera.position.lerp(this.targetCameraPos, 0.22);
        if (this.camera.position.distanceToSquared(this.targetCameraPos) < 0.0015) {
          this.camera.position.copy(this.targetCameraPos);
          this.targetCameraPos = null;
        } else {
          activeTransition = true;
        }
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      if (this.dampingFramesRemaining > 0 && !this.isInteracting) {
        this.dampingFramesRemaining--;
      }

      // Pause loop automatically once transitions and orbit damping settle (0% idle GPU usage)
      if (!this.isInteracting && !activeTransition && this.dampingFramesRemaining <= 0) {
        this.stopRenderLoop();
        return;
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

  Apex3DViewer.loadModel = function (modelKeyOrCarId, color, direction) {
    if (Apex3DViewer.activeInstance && typeof Apex3DViewer.activeInstance.loadModel === 'function') {
      Apex3DViewer.activeInstance.loadModel(modelKeyOrCarId, color, direction);
    }
  };

  window.Apex3DViewer = Apex3DViewer;
})(window, document);

