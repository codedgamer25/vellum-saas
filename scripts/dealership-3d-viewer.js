/**
 * Apex Auto Lounge - Dealership 3D Local Model Viewer
 * Studio automotive 3D showcase using Three.js, local GLTF models,
 * ground contact shadow, physical car paint materials, and instant visual fallback.
 */

(function (window, document) {
  'use strict';

  const MODEL_CONFIG = {
    ferrari: {
      path: './models/ferrari.glb',
      scale: 0.84,
      positionY: 0,
      paintMaterialNames: ['Body_Color', 'Ferrari_Yellow', '_0098_DodgerBlue'],
      defaultColor: '#FD6E6E', // Marco Perez Coral Orange
      cameraPos: [-4.2, 1.75, -5.5],
      targetPos: [0, 0.36, 0]
    },
    porsche: {
      path: './models/porsche_911.glb',
      scale: 0.84,
      positionY: 0,
      paintMaterialNames: ['paint', 'coat'],
      defaultColor: '#FF3B30', // Marco Perez Poppy Red
      cameraPos: [5.4, 2.25, 5.9],
      targetPos: [0, 0.36, 0]
    },
    bmw: {
      path: './models/bmw_m4.glb',
      scale: 0.84,
      positionY: 0,
      paintMaterialNames: ['mMAT_Carpaint_Blue1'],
      defaultColor: '#FCE788', // Marco Perez Butter Yellow
      cameraPos: [5.2, 2.2, 5.8],
      targetPos: [0, 0.36, 0]
    }
  };

  // CarId to Model config aliases for direct carId loadModel calls
  MODEL_CONFIG['porsche-gt3-rs-2024'] = MODEL_CONFIG.porsche;
  MODEL_CONFIG['ferrari-roma-2023'] = MODEL_CONFIG.ferrari;
  MODEL_CONFIG['mercedes-amg-g63-2024'] = MODEL_CONFIG.bmw;
  MODEL_CONFIG['audi-rs6-avant-2024'] = MODEL_CONFIG.ferrari;

  class Apex3DViewer {
    constructor(containerId = 'hero-3d-stage-container', options = {}) {
      this.container = document.getElementById(containerId);
      this.options = Object.assign(
        {
          initialModel: 'ferrari',
          initialColor: '#E24738',
          autoRotate: true,
          autoRotateSpeed: 0.8
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
      this.animationFrameId = null;
      this.isInitialized = false;
      this.dracoLoader = null;
      this.gltfLoader = null;
      this.canvas = null;
      this.carImageFallback = null;

      this.init();
    }

    init() {
      if (!this.container) {
        console.warn('Apex3DViewer: Container not found:', this.container);
        return;
      }

      // 1. Setup Instant High-Resolution Transparent Car Image fallback inside container
      this.setupInstantFallback();

      // Check if WebGL is supported
      if (!this.checkWebGLSupport() || typeof window.THREE === 'undefined') {
        console.info('Apex3DViewer: WebGL or Three.js unavailable, utilizing interactive high-res studio car preview.');
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
        window.addEventListener('resize', this.onWindowResize);

        // Start render loop
        this.animate();

        // Load Initial Model
        this.loadModel(this.currentModelKey, this.currentColor);

        this.isInitialized = true;
        Apex3DViewer.activeInstance = this;
      } catch (err) {
        Apex3DViewer.activeInstance = this;
        console.warn('Apex3DViewer: Error initializing WebGL pipeline, running studio fallback:', err);
        this.enableInteractiveTilt();
      }
    }

    checkWebGLSupport() {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
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
            alt="Apex Auto Lounge Curated Hypercar" 
            loading="eager"
          />
        `;
        this.container.appendChild(fallback);
      }
      this.carImageFallback = fallback;
    }

    setupThreeScene() {
      // Find or create canvas
      let canvas = this.container.querySelector('#hero-3d-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hero-3d-canvas';
        canvas.className = 'hero-3d-canvas';
        this.container.appendChild(canvas);
      }
      this.canvas = canvas;

      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 500;

      // Scene
      this.scene = new THREE.Scene();

      // Camera (Perspective, wide luxury studio focal length at normal smallest zoom)
      this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      this.camera.position.set(-4.2, 1.75, -5.5);

      // WebGLRenderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (this.renderer.outputEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      if (this.renderer.toneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
      }
    }

    setupLighting() {
      // Studio Key Light
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(-6, 9, -6);
      this.scene.add(keyLight);

      // Studio Fill Light (Cool Glacier soft rim)
      const fillLight = new THREE.DirectionalLight(0xb8d4ff, 1.4);
      fillLight.position.set(6, 6, 4);
      this.scene.add(fillLight);

      // Warm Bottom Ground Bounce Light
      const bounceLight = new THREE.DirectionalLight(0xffeedd, 0.7);
      bounceLight.position.set(0, -3, 3);
      this.scene.add(bounceLight);

      // Ambient Light for subtle soft shadow details
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      this.scene.add(ambientLight);

      // High-angle Top Spotlight for metallic hood & roof highlights
      const topSpot = new THREE.SpotLight(0xffffff, 3.2);
      topSpot.position.set(0, 8, 0);
      topSpot.angle = Math.PI / 3;
      topSpot.penumbra = 0.8;
      this.scene.add(topSpot);
    }

    setupContactShadow() {
      // Procedural soft contact shadow: 100% transparent perimeter, soft dark center
      // Absolutely zero white pixels, zero white floor mesh
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 512;
      shadowCanvas.height = 512;
      const ctx = shadowCanvas.getContext('2d');

      const gradient = ctx.createRadialGradient(256, 256, 15, 256, 256, 235);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const planeGeometry = new THREE.PlaneGeometry(5.4, 3.6);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });
      const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.005;
      shadowPlane.name = 'groundContactShadow';
      this.scene.add(shadowPlane);
    }

    setupControls() {
      if (typeof THREE.OrbitControls === 'function') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false; // Strictly remove zoom on 3D model - locked at normal smallest zoom
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera dipping below floor
        this.controls.minPolarAngle = Math.PI / 8;
        this.controls.enablePan = false;
        this.controls.autoRotate = this.options.autoRotate;
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

    loadModel(modelKey = 'ferrari', color = null) {
      const config = MODEL_CONFIG[modelKey] || MODEL_CONFIG.ferrari;
      this.currentModelKey = modelKey;
      const targetColor = color || config.defaultColor || this.currentColor;
      this.currentColor = targetColor;

      if (!this.gltfLoader) return;

      this.gltfLoader.load(
        config.path,
        (gltf) => {
          // Remove previous model if exists
          if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel.traverse((child) => {
              if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
              }
            });
            this.currentModel = null;
          }

          this.paintMaterials = [];
          const model = gltf.scene;
          model.position.y = config.positionY;
          model.scale.set(config.scale, config.scale, config.scale);

          // Center & compute bounding box
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Offset to floor contact
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= box.min.y;

          // Traverse and upgrade materials to high-gloss clearcoat paint
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              const isPaint =
                (mat.name && config.paintMaterialNames.some((pName) => mat.name.includes(pName))) ||
                child.name.toLowerCase().includes('body') ||
                child.name.toLowerCase().includes('paint');

              if (isPaint) {
                // Ensure shiny metallic clearcoat automotive material
                if (!child.material.isMeshPhysicalMaterial) {
                  const physicalMat = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(targetColor),
                    metalness: 0.88,
                    roughness: 0.16,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                    envMapIntensity: 2.0
                  });
                  child.material = physicalMat;
                }
                this.paintMaterials.push(child.material);
              }
            }
          });

          // Apply target color
          this.changeCarColor(targetColor);

          // Adjust camera to fit vehicle at normal smallest zoom
          if (config.cameraPos) {
            this.camera.position.set(config.cameraPos[0], config.cameraPos[1], config.cameraPos[2]);
          }
          if (this.controls) {
            this.controls.target.set(0, size.y * 0.36, 0);
            this.controls.update();
          }

          this.scene.add(model);
          this.currentModel = model;

          // Fade out fallback image once 3D model is active
          if (this.carImageFallback) {
            this.carImageFallback.classList.add('has-3d-loaded');
          }
        },
        undefined,
        (err) => {
          console.warn('Apex3DViewer: Error loading model ' + modelKey + ', keeping high-res fallback:', err);
          this.enableInteractiveTilt();
        }
      );
    }

    changeCarColor(hexColor) {
      this.currentColor = hexColor;
      const threeColor = new THREE.Color(hexColor);

      if (this.paintMaterials && this.paintMaterials.length > 0) {
        this.paintMaterials.forEach((mat) => {
          mat.color.copy(threeColor);
          if (mat.clearcoat !== undefined) mat.clearcoat = 1.0;
          if (mat.metalness !== undefined) mat.metalness = 0.88;
          if (mat.roughness !== undefined) mat.roughness = 0.16;
          mat.needsUpdate = true;
        });
      } else if (this.currentModel) {
        // Fallback scan
        this.currentModel.traverse((child) => {
          if (child.isMesh && child.material && child.material.color) {
            if (
              child.name.toLowerCase().includes('body') ||
              (child.material.name && child.material.name.toLowerCase().includes('body'))
            ) {
              child.material.color.copy(threeColor);
              child.material.needsUpdate = true;
            }
          }
        });
      }

      // If fallback image is shown, apply subtle color tint to backdrop
      if (this.carImageFallback) {
        this.carImageFallback.style.setProperty('--car-color-accent', hexColor);
      }
    }

    enableInteractiveTilt() {
      // Subtle interactive 3D drag / mousemove tilt on transparent car image
      if (!this.carImageFallback) return;

      const card = this.container;
      const img = this.carImageFallback.querySelector('.hero-3d-car-img');
      if (!img) return;

      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : rect.width / 2);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : rect.height / 2);

        const x = (clientX - rect.left) / rect.width - 0.5;
        const y = (clientY - rect.top) / rect.height - 0.5;

        img.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale3d(1.02, 1.02, 1.02)`;
      };

      const handleLeave = () => {
        img.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('touchmove', handleMove, { passive: true });
      card.addEventListener('mouseleave', handleLeave);
      card.addEventListener('touchend', handleLeave);
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

    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      window.removeEventListener('resize', this.onWindowResize);

      if (this.currentModel) {
        this.scene.remove(this.currentModel);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
      if (Apex3DViewer.activeInstance === this) {
        Apex3DViewer.activeInstance = null;
      }
    }
  }

  // Active instance reference for global access
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

  // Export to window
  window.Apex3DViewer = Apex3DViewer;
})(window, document);
