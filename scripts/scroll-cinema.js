/**
 * Royal Headmistress — Apple-Style Scroll-Wipe Cinema Engine
 * Synchronizes scroll position (or auto-scrub playback) with 5 stacked couture wig & hair scenes,
 * clip-path wipes, camera transforms, narrative cards, and a silk-wave canvas overlay.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const CHAPTERS = [
    {
      index: 0,
      id: 'ch-01',
      code: 'CHAPTER 01 / 05',
      name: 'Royal Silhouette',
      urlPath: 'royalheadmistress.com/atelier/01-royal-silhouette',
      range: [0.0, 0.20]
    },
    {
      index: 1,
      id: 'ch-02',
      code: 'CHAPTER 02 / 05',
      name: 'HD Swiss Lace',
      urlPath: 'royalheadmistress.com/atelier/02-hd-swiss-lace',
      range: [0.20, 0.40]
    },
    {
      index: 2,
      id: 'ch-03',
      code: 'CHAPTER 03 / 05',
      name: 'Raw Virgin Cuticle',
      urlPath: 'royalheadmistress.com/atelier/03-raw-virgin-bundles',
      range: [0.40, 0.60]
    },
    {
      index: 3,
      id: 'ch-04',
      code: 'CHAPTER 04 / 05',
      name: 'Glueless Crown Cap',
      urlPath: 'royalheadmistress.com/atelier/04-glueless-cap-fit',
      range: [0.60, 0.80]
    },
    {
      index: 4,
      id: 'ch-05',
      code: 'CHAPTER 05 / 05',
      name: 'Royal Unboxing',
      urlPath: 'royalheadmistress.com/atelier/05-royal-concierge',
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
    let isAutoPlaying = false;
    let autoPlaySpeed = 0.0018;

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

    window.addEventListener('wheel', () => {
      if (isAutoPlaying) toggleAutoPlay(false);
    }, { passive: true });

    function toggleAutoPlay(forceState) {
      isAutoPlaying = typeof forceState === 'boolean' ? forceState : !isAutoPlaying;
      if (autoplayBtn) {
        autoplayBtn.textContent = isAutoPlaying ? '❚❚ PAUSE RUNWAY' : '▶ AUTO-SCRUB';
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

    scrubBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const offset = idx === 0 ? 0.02 : 0.08;
        const chapterTarget = CHAPTERS[idx].range[0] + offset;
        targetProgress = clamp(chapterTarget, 0, 1);
        currentProgress = targetProgress;

        const rect = track.getBoundingClientRect();
        const trackTopDoc = window.scrollY + rect.top;
        const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
        window.scrollTo({
          top: trackTopDoc + targetProgress * scrollableDistance,
          behavior: 'instant'
        });
      });
    });

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

    // Renders flowing champagne-gold silk ribbons synchronized to scroll position
    function renderSilkWaveCanvas(progress, timeSec) {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasW, canvasH);

      for (let ribbon = 0; ribbon < 3; ribbon++) {
        ctx.beginPath();
        const alpha = 0.14 + ribbon * 0.08;
        ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
        ctx.lineWidth = 1.25 + ribbon * 0.4;
        const baseY = canvasH - 36 + ribbon * 8;
        for (let x = 0; x <= canvasW; x += 8) {
          const phase = progress * Math.PI * 8 + timeSec * 1.4 + ribbon * 1.1;
          const amp = 7 + Math.sin(progress * Math.PI * 3 + ribbon) * 5;
          const y = baseY + Math.sin(x * 0.018 + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function applyCinemaTransforms(p) {
      let activeChapterIdx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (p >= CHAPTERS[i].range[0]) {
          activeChapterIdx = i;
        }
      }

      const w2 = normRange(p, 0.16, 0.26);
      const w3 = normRange(p, 0.36, 0.46);
      const w4 = normRange(p, 0.56, 0.66);
      const w5 = normRange(p, 0.76, 0.86);

      if (scene2) {
        scene2.style.clipPath = `inset(${((1 - w2) * 100).toFixed(2)}% 0 0 0)`;
      }
      if (scene3) {
        scene3.style.clipPath = `inset(0 0 0 ${((1 - w3) * 100).toFixed(2)}%)`;
      }
      if (scene4) {
        scene4.style.clipPath = `inset(${((1 - w4) * 100).toFixed(2)}% 0 0 0)`;
      }
      if (scene5) {
        scene5.style.clipPath = `inset(0 ${((1 - w5) * 100).toFixed(2)}% 0 0)`;
      }

      const zoomWave = 1 + Math.sin(p * Math.PI * 2) * 0.014;
      cameraRig.style.transform = `scale(${zoomWave.toFixed(4)})`;

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

      narrativeCards.forEach((card, idx) => {
        card.classList.toggle('is-active', idx === activeChapterIdx);
      });

      const currentChapter = CHAPTERS[activeChapterIdx];
      if (stepCounterEl) stepCounterEl.textContent = currentChapter.code;
      if (windowUrlEl) windowUrlEl.textContent = currentChapter.urlPath;

      const currentFrame = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(p * TOTAL_FRAMES) || 1));
      if (frameReadoutEl) {
        frameReadoutEl.textContent = `FRAME ${String(currentFrame).padStart(3, '0')} / ${TOTAL_FRAMES}`;
      }

      const pct = Math.round(p * 100);
      if (velocityEl) {
        velocityEl.textContent = `REEL ${String(pct).padStart(3, '0')}%`;
      }

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
      renderSilkWaveCanvas(currentProgress, nowMs * 0.001);

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
