/**
 * Vellum — Apple-Style Scroll-Wipe Cinema Engine
 * Synchronizes scroll position (or auto-scrub playback) with 5 stacked product scenes,
 * clip-path wipes, camera transforms, narrative cards, and a high-DPI HTML5 telemetry canvas.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const CHAPTERS = [
    {
      index: 0,
      id: 'ch-01',
      code: 'CHAPTER 01 / 05',
      name: 'Command Horizon',
      urlPath: 'vellum.app/workspace/command-horizon',
      range: [0.0, 0.20]
    },
    {
      index: 1,
      id: 'ch-02',
      code: 'CHAPTER 02 / 05',
      name: 'Signal Ingestion',
      urlPath: 'vellum.app/workspace/ingestion-matrix',
      range: [0.20, 0.40]
    },
    {
      index: 2,
      id: 'ch-03',
      code: 'CHAPTER 03 / 05',
      name: 'DAG Orchestrator',
      urlPath: 'vellum.app/workspace/dag-topology',
      range: [0.40, 0.60]
    },
    {
      index: 3,
      id: 'ch-04',
      code: 'CHAPTER 04 / 05',
      name: 'Spec-to-Ship Gate',
      urlPath: 'vellum.app/workspace/runbook-gate',
      range: [0.60, 0.80]
    },
    {
      index: 4,
      id: 'ch-05',
      code: 'CHAPTER 05 / 05',
      name: 'Executive Telemetry',
      urlPath: 'vellum.app/workspace/executive-ledger',
      range: [0.80, 1.00]
    }
  ];

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function normRange(val, min, max) {
    return clamp((val - min) / (max - min), 0, 1);
  }

  function initScrollCinema() {
    const track = document.getElementById('hero-cinema-track');
    const cameraRig = document.getElementById('stage-camera-rig');
    const scene2 = document.getElementById('cinema-scene-2');
    const scene3 = document.getElementById('cinema-scene-3');
    const scene4 = document.getElementById('cinema-scene-4');
    const scene5 = document.getElementById('cinema-scene-5');
    const seamIndicator = document.getElementById('wipe-seam-indicator');

    const stepCounterEl = document.getElementById('chapter-step-counter');
    const velocityEl = document.getElementById('scroll-velocity-readout');
    const frameReadoutEl = document.getElementById('cinema-frame-readout');
    const windowUrlEl = document.getElementById('stage-window-url');
    const autoplayBtn = document.getElementById('cinema-autoplay-btn');
    const narrativeCards = Array.from(document.querySelectorAll('.narrative-chapter-card'));
    const scrubBtns = Array.from(document.querySelectorAll('.chapter-scrub-btn'));
    const canvas = document.getElementById('hero-telemetry-canvas');

    if (!track || !cameraRig) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let lastProgress = 0;
    let isAutoPlaying = false;
    let autoPlaySpeed = 0.0018;

    // Measure scroll position relative to the 460vh track
    function updateTargetFromScroll() {
      if (isAutoPlaying) return;
      const rect = track.getBoundingClientRect();
      const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
      const scrolled = -rect.top;
      targetProgress = clamp(scrolled / scrollableDistance, 0, 1);
    }

    window.addEventListener('scroll', updateTargetFromScroll, { passive: true });
    window.addEventListener('resize', updateTargetFromScroll, { passive: true });
    updateTargetFromScroll();

    // Stop autoplay if user manually scrolls with wheel or touch
    window.addEventListener('wheel', () => {
      if (isAutoPlaying) toggleAutoPlay(false);
    }, { passive: true });

    function toggleAutoPlay(forceState) {
      isAutoPlaying = typeof forceState === 'boolean' ? forceState : !isAutoPlaying;
      if (autoplayBtn) {
        autoplayBtn.textContent = isAutoPlaying ? '❚❚ PAUSE MOVIE' : '▶ AUTO-SCRUB';
        autoplayBtn.setAttribute('aria-pressed', String(isAutoPlaying));
      }
    }

    if (autoplayBtn) {
      autoplayBtn.addEventListener('click', () => {
        if (!isAutoPlaying && currentProgress >= 0.98) {
          targetProgress = 0;
          currentProgress = 0;
        }
        toggleAutoPlay();
      });
    }

    // Chapter buttons scrub to chapter start and scroll window smoothly if in scroll mode
    scrubBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const chapterStart = CHAPTERS[idx].range[0] + 0.02;
        targetProgress = clamp(chapterStart, 0, 1);

        const rect = track.getBoundingClientRect();
        const trackTopDoc = window.scrollY + rect.top;
        const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
        window.scrollTo({
          top: trackTopDoc + targetProgress * scrollableDistance,
          behavior: 'smooth'
        });
      });
    });

    // High-DPI Telemetry Canvas setup
    let ctx = null;
    let canvasW = 800;
    let canvasH = 450;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvasW = Math.max(300, rect.width);
      canvasH = Math.max(200, rect.height);
      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    function renderTelemetryCanvas(progress, timeSec) {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Draw subtle horizontal telemetry buses
      const busCount = 4;
      for (let i = 0; i < busCount; i++) {
        const y = ((i + 1) / (busCount + 1)) * canvasH;
        ctx.strokeStyle = 'rgba(247, 245, 240, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasW, y);
        ctx.stroke();

        // Moving signal pulses driven by scroll progress + time
        const pulseX = ((progress * 1400 + timeSec * (65 + i * 22) + i * 190) % (canvasW + 120)) - 60;
        const grad = ctx.createLinearGradient(pulseX - 50, y, pulseX + 10, y);
        grad.addColorStop(0, 'rgba(206, 74, 28, 0)');
        grad.addColorStop(1, i % 2 === 0 ? 'rgba(206, 74, 28, 0.55)' : 'rgba(27, 125, 90, 0.55)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pulseX - 50, y);
        ctx.lineTo(pulseX + 10, y);
        ctx.stroke();
      }

      // Draw scroll-scrubbed harmonic waveform along bottom of stage
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(206, 74, 28, 0.28)';
      ctx.lineWidth = 1.5;
      const waveBaseY = canvasH - 28;
      for (let x = 0; x <= canvasW; x += 8) {
        const phase = progress * Math.PI * 10 + timeSec * 1.8;
        const amp = 8 + Math.sin(progress * Math.PI * 4) * 6;
        const y = waveBaseY + Math.sin(x * 0.022 + phase) * amp * Math.cos(x * 0.007 - progress * 5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function applyCinemaTransforms(p) {
      // Determine active chapter (0..4)
      let activeChapterIdx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (p >= CHAPTERS[i].range[0] && p <= CHAPTERS[i].range[1] + 0.001) {
          activeChapterIdx = i;
          break;
        }
      }

      // Compute wipe progress for transitions between the 5 scenes
      // Transition 1 -> 2 happens across [0.16, 0.26] (Vertical Wipe Up)
      const w2 = normRange(p, 0.16, 0.26);
      // Transition 2 -> 3 happens across [0.36, 0.46] (Horizontal Wipe Left)
      const w3 = normRange(p, 0.36, 0.46);
      // Transition 3 -> 4 happens across [0.56, 0.66] (Vertical Wipe Up)
      const w4 = normRange(p, 0.56, 0.66);
      // Transition 4 -> 5 happens across [0.76, 0.86] (Horizontal Wipe Right)
      const w5 = normRange(p, 0.76, 0.86);

      if (scene2) {
        const insetTop = ((1 - w2) * 100).toFixed(2);
        scene2.style.clipPath = `inset(${insetTop}% 0 0 0)`;
      }
      if (scene3) {
        const insetLeft = ((1 - w3) * 100).toFixed(2);
        scene3.style.clipPath = `inset(0 0 0 ${insetLeft}%)`;
      }
      if (scene4) {
        const insetTop4 = ((1 - w4) * 100).toFixed(2);
        scene4.style.clipPath = `inset(${insetTop4}% 0 0 0)`;
      }
      if (scene5) {
        const insetRight5 = ((1 - w5) * 100).toFixed(2);
        scene5.style.clipPath = `inset(0 ${insetRight5}% 0 0)`;
      }

      // Subtle camera zoom/pan across chapters so the stage feels alive
      const zoomWave = 1 + Math.sin(p * Math.PI * 2) * 0.015;
      cameraRig.style.transform = `scale(${zoomWave.toFixed(4)})`;

      // Show glowing wipe seam line whenever a wipe transition is actively midway
      if (seamIndicator) {
        if (w2 > 0.02 && w2 < 0.98) {
          seamIndicator.style.opacity = '1';
          seamIndicator.style.width = '100%';
          seamIndicator.style.height = '2px';
          seamIndicator.style.left = '0';
          seamIndicator.style.top = `${(1 - w2) * 100}%`;
        } else if (w3 > 0.02 && w3 < 0.98) {
          seamIndicator.style.opacity = '1';
          seamIndicator.style.width = '2px';
          seamIndicator.style.height = '100%';
          seamIndicator.style.top = '0';
          seamIndicator.style.left = `${(1 - w3) * 100}%`;
        } else if (w4 > 0.02 && w4 < 0.98) {
          seamIndicator.style.opacity = '1';
          seamIndicator.style.width = '100%';
          seamIndicator.style.height = '2px';
          seamIndicator.style.left = '0';
          seamIndicator.style.top = `${(1 - w4) * 100}%`;
        } else if (w5 > 0.02 && w5 < 0.98) {
          seamIndicator.style.opacity = '1';
          seamIndicator.style.width = '2px';
          seamIndicator.style.height = '100%';
          seamIndicator.style.top = '0';
          seamIndicator.style.left = `${w5 * 100}%`;
        } else {
          seamIndicator.style.opacity = '0';
        }
      }

      // Update left narrative cards
      narrativeCards.forEach((card, idx) => {
        card.classList.toggle('is-active', idx === activeChapterIdx);
      });

      // Update chapter counter, window URL, and frame readout
      const currentChapter = CHAPTERS[activeChapterIdx];
      if (stepCounterEl) stepCounterEl.textContent = currentChapter.code;
      if (windowUrlEl) windowUrlEl.textContent = currentChapter.urlPath;

      const currentFrame = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(p * TOTAL_FRAMES) || 1));
      const paddedFrame = String(currentFrame).padStart(3, '0');
      if (frameReadoutEl) {
        frameReadoutEl.textContent = `FRAME ${paddedFrame} / ${TOTAL_FRAMES}`;
      }

      // Update velocity & percent indicator
      const pct = Math.round(p * 100);
      if (velocityEl) {
        velocityEl.textContent = `TIMELINE ${String(pct).padStart(3, '0')}%`;
      }

      // Update bottom filmstrip buttons
      scrubBtns.forEach((btn, idx) => {
        const ch = CHAPTERS[idx];
        const chProgress = normRange(p, ch.range[0], ch.range[1]);
        btn.classList.toggle('is-current', idx === activeChapterIdx);
        const bar = btn.querySelector('.chapter-scrub-progress');
        if (bar) {
          bar.style.width = `${(chProgress * 100).toFixed(1)}%`;
        }
      });
    }

    function tick(nowMs) {
      if (isAutoPlaying) {
        targetProgress += autoPlaySpeed;
        if (targetProgress >= 1) {
          targetProgress = 1;
          toggleAutoPlay(false);
        }
      }

      currentProgress += (targetProgress - currentProgress) * 0.14;
      if (Math.abs(targetProgress - currentProgress) < 0.0002) {
        currentProgress = targetProgress;
      }

      applyCinemaTransforms(currentProgress);
      renderTelemetryCanvas(currentProgress, nowMs * 0.001);
      lastProgress = currentProgress;

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollCinema);
  } else {
    initScrollCinema();
  }
})();
