/**
 * Vellum — Interactive Product Sandbox, Case Study Switcher,
 * ROI & Pricing Calculator, FAQ Accordion, and Demo Booking Modal
 */

(function () {
  'use strict';

  const SANDBOX_SCENARIOS = {
    latency: {
      title: 'Payment Gateway p99 Latency Spike',
      slaTarget: '14.2s',
      eventsPerSec: '18,420 /s',
      steps: [
        { code: '01', name: 'Ingest Datadog & Stripe Webhook Anomaly', status: 'VERIFIED (12ms)', active: false },
        { code: '02', name: 'Correlate Recent Commit #a94f21c in Checkout Service', status: 'MATCHED (99.4%)', active: true },
        { code: '03', name: 'Shift 35% Traffic to Fallback EU-Central Pool', status: 'EXECUTING', active: true },
        { code: '04', name: 'Post Verified Root-Cause Brief to #ops-command', status: 'QUEUED', active: false }
      ],
      payload: `{
  "workflow_id": "wf_pay_latency_mitigation_09",
  "trigger": "anomaly.checkout.p99_exceeded",
  "observed_p99_ms": 842,
  "baseline_p99_ms": 118,
  "suspected_sha": "a94f21c8e",
  "automated_action": {
    "route_shift": "eu-central-fallback",
    "traffic_weight": 0.35,
    "approval_gate": "auto_approved_tier_1"
  },
  "recovery_eta_seconds": 14
}`
    },
    migration: {
      title: 'Zero-Downtime Multi-Region Ledger Migration',
      slaTarget: '0.0ms downtime',
      eventsPerSec: '42,900 /s',
      steps: [
        { code: '01', name: 'Provision Shadow Read-Replica in us-east & eu-west', status: 'READY', active: false },
        { code: '02', name: 'Dual-Write Verification & Checksum Parity Audit', status: '100.00% PARITY', active: true },
        { code: '03', name: 'Atomic Read Pointer Flip with Rollback Guard', status: 'ACTIVE GATE', active: true },
        { code: '04', name: 'Archive Legacy Partition & Emit Compliance Artifact', status: 'STANDBY', active: false }
      ],
      payload: `{
  "workflow_id": "wf_ledger_cutover_v4",
  "shards_verified": 128,
  "row_checksum_mismatch": 0,
  "replication_lag_ms": 1.8,
  "cutover_policy": {
    "abort_on_lag_ms": 15.0,
    "canary_percentage": 25,
    "signoff_principals": ["@sre-lead", "@db-arch"]
  }
}`
    },
    audit: {
      title: 'Continuous SOC2 & ISO-27001 Access Governance',
      slaTarget: '100% Attested',
      eventsPerSec: '6,150 /s',
      steps: [
        { code: '01', name: 'Scan Production IAM Roles & Ephemeral Break-Glass Grants', status: 'SCANNED', active: false },
        { code: '02', name: 'Revoke 14 Expired Contractor Sessions Automatically', status: 'REVOKED', active: true },
        { code: '03', name: 'Cryptographically Sign Immutable Audit Ledger Entry', status: 'SIGNED (SHA-256)', active: true },
        { code: '04', name: 'Sync Evidence Bundle to External Auditor Portal', status: 'COMPLETED', active: false }
      ],
      payload: `{
  "workflow_id": "wf_soc2_continuous_evidence",
  "principals_evaluated": 1420,
  "expired_grants_revoked": 14,
  "unscoped_admin_tokens": 0,
  "attestation_hash": "sha256:9f84b2c71e630d4a881",
  "auditor_export_status": "DELIVERED"
}`
    }
  };

  const CASE_STUDIES = {
    kestrel: {
      company: 'Kestrel Financial',
      sector: 'Global Treasury & Instant Settlement Infrastructure',
      quote: '“Vellum replaced four disconnected runbook tools and cut our mean-time-to-remediation from 47 minutes to 19 seconds across $14B in daily settlement volume.”',
      author: 'Elena Rostova — VP of Platform Engineering, Kestrel Financial',
      metrics: [
        { val: '96%', label: 'Reduction in P1 Incident MTTR' },
        { val: '14,200 hrs', label: 'Engineering Hours Saved Annually' },
        { val: '100%', label: 'Automated SOC2 Change Evidence' }
      ]
    },
    helios: {
      company: 'Helios Compute',
      sector: 'Distributed GPU Cluster & Model Serving Cloud',
      quote: '“When orchestrating 40,000 H100 nodes across six continents, manual triage is impossible. Vellum’s deterministic DAG engine drains degraded nodes before customers notice a single dropped token.”',
      author: 'Marcus Vance — Head of Infrastructure, Helios Compute',
      metrics: [
        { val: '99.998%', label: 'Cluster Scheduling Availability' },
        { val: '3.4x', label: 'Faster Release Train Velocity' },
        { val: '$2.8M', label: 'Saved in Idle Compute Waste' }
      ]
    },
    vanguard: {
      company: 'Vanguard Freight',
      sector: 'Autonomous Port & Supply-Chain Telemetry',
      quote: '“Every customs manifest, IoT sensor stream, and carrier API flows through Vellum. Our operations teams went from firefighting spreadsheets to governing autonomous workflows.”',
      author: 'Devon Lindqvist — Chief Operating Officer, Vanguard Freight',
      metrics: [
        { val: '410ms', label: 'Global Customs Exception Routing' },
        { val: '82%', label: 'Fewer Manual Escalation Tickets' },
        { val: '19 days', label: 'Full Global Deployment Time' }
      ]
    }
  };

  function initInteractions() {
    // 1. Sandbox Scenario Switcher & Live Step Runner
    const scenarioBtns = Array.from(document.querySelectorAll('[data-scenario]'));
    const sandboxTitle = document.getElementById('sandbox-scenario-title');
    const sandboxSla = document.getElementById('sandbox-sla-readout');
    const sandboxRate = document.getElementById('sandbox-rate-readout');
    const stepsContainer = document.getElementById('sandbox-steps-list');
    const jsonBlock = document.getElementById('sandbox-json-inspector');
    const runSimulationBtn = document.getElementById('sandbox-run-btn');

    let currentScenarioKey = 'latency';
    let stepCursor = 1;

    function renderScenario(key) {
      const data = SANDBOX_SCENARIOS[key];
      if (!data) return;
      currentScenarioKey = key;

      if (sandboxTitle) sandboxTitle.textContent = data.title;
      if (sandboxSla) sandboxSla.textContent = data.slaTarget;
      if (sandboxRate) sandboxRate.textContent = data.eventsPerSec;
      if (jsonBlock) jsonBlock.textContent = data.payload;

      if (stepsContainer) {
        stepsContainer.innerHTML = data.steps.map((s, idx) => `
          <div class="pipeline-step-row ${idx === stepCursor ? 'is-running' : ''}" data-step-idx="${idx}">
            <div class="pipeline-step-left">
              <span class="step-index-box">${s.code}</span>
              <span style="font-weight: 600; font-size: 0.9rem;">${s.name}</span>
            </div>
            <span class="mono-tag" style="color: ${idx === stepCursor ? 'var(--accent-primary)' : 'var(--accent-emerald)'}; font-weight: 600;">
              ${idx === stepCursor ? '● EXECUTING NOW' : s.status}
            </span>
          </div>
        `).join('');
      }
    }

    scenarioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-scenario');
        scenarioBtns.forEach(b => b.classList.toggle('active', b === btn));
        stepCursor = 1;
        renderScenario(key);
      });
    });

    if (runSimulationBtn) {
      runSimulationBtn.addEventListener('click', () => {
        const data = SANDBOX_SCENARIOS[currentScenarioKey];
        stepCursor = (stepCursor + 1) % data.steps.length;
        renderScenario(currentScenarioKey);
        runSimulationBtn.textContent = `✓ STEP 0${stepCursor + 1} DISPATCHED — ADVANCE NEXT`;
      });
    }

    // 2. Customer Case Study Tabs
    const caseBtns = Array.from(document.querySelectorAll('[data-case]'));
    const caseSectorEl = document.getElementById('case-study-sector');
    const caseQuoteEl = document.getElementById('case-study-quote');
    const caseAuthorEl = document.getElementById('case-study-author');
    const caseMetricsEl = document.getElementById('case-study-metrics');

    caseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-case');
        const study = CASE_STUDIES[key];
        if (!study) return;

        caseBtns.forEach(b => b.classList.toggle('active', b === btn));
        if (caseSectorEl) caseSectorEl.textContent = `${study.company} — ${study.sector}`;
        if (caseQuoteEl) caseQuoteEl.textContent = study.quote;
        if (caseAuthorEl) caseAuthorEl.textContent = study.author;
        if (caseMetricsEl) {
          caseMetricsEl.innerHTML = study.metrics.map(m => `
            <div>
              <div class="case-metric-number">${m.val}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">${m.label}</div>
            </div>
          `).join('');
        }
      });
    });

    // 3. Interactive Pricing & ROI Calculator
    const billingToggleBtn = document.getElementById('billing-cycle-toggle');
    const teamSlider = document.getElementById('roi-team-slider');
    const teamCountOut = document.getElementById('roi-team-count');
    const hoursSavedOut = document.getElementById('roi-hours-saved');
    const dollarSavedOut = document.getElementById('roi-dollar-saved');
    const priceGrowthEl = document.getElementById('price-tier-growth');
    const priceScaleEl = document.getElementById('price-tier-scale');

    let isAnnual = true;

    function updatePricingAndRoi() {
      const seats = teamSlider ? parseInt(teamSlider.value, 10) : 65;
      if (teamCountOut) teamCountOut.textContent = `${seats} engineers & operators`;

      const annualHours = seats * 148;
      const annualSavingsUsd = Math.round((annualHours * 115) / 1000) * 1000;

      if (hoursSavedOut) hoursSavedOut.textContent = `${annualHours.toLocaleString()} hrs / yr`;
      if (dollarSavedOut) dollarSavedOut.textContent = `$${annualSavingsUsd.toLocaleString()} / yr`;

      const growthPrice = isAnnual ? 39 : 49;
      const scalePrice = isAnnual ? 89 : 109;
      if (priceGrowthEl) priceGrowthEl.textContent = `$${growthPrice}`;
      if (priceScaleEl) priceScaleEl.textContent = `$${scalePrice}`;
      if (billingToggleBtn) {
        billingToggleBtn.textContent = isAnnual
          ? '● Annual Billing (Save 20%) — Switch to Monthly'
          : '○ Monthly Billing — Switch to Annual (Save 20%)';
      }
    }

    if (billingToggleBtn) {
      billingToggleBtn.addEventListener('click', () => {
        isAnnual = !isAnnual;
        updatePricingAndRoi();
      });
    }

    if (teamSlider) {
      teamSlider.addEventListener('input', updatePricingAndRoi);
    }

    updatePricingAndRoi();

    // 4. Interactive FAQ Accordion
    const faqItems = Array.from(document.querySelectorAll('.faq-item'));
    faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        faqItems.forEach(other => {
          other.classList.remove('is-open');
          const btn = other.querySelector('.faq-trigger');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // 5. Interactive Demo Booking & Trial Modal
    const modal = document.getElementById('demo-booking-modal');
    const openModalBtns = Array.from(document.querySelectorAll('[data-open-modal="demo"]'));
    const closeModalBtn = document.getElementById('modal-close-btn');
    const demoForm = document.getElementById('demo-booking-form');
    const formFeedback = document.getElementById('demo-form-feedback');

    function openModal() {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      const firstInput = modal.querySelector('input');
      if (firstInput) firstInput.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (demoForm) {
      demoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('demo-work-email');
        const teamInput = document.getElementById('demo-company-name');
        const emailVal = emailInput ? emailInput.value.trim() : '';
        const teamVal = teamInput ? teamInput.value.trim() : '';

        if (!emailVal || !emailVal.includes('@') || !teamVal) {
          if (formFeedback) {
            formFeedback.style.display = 'block';
            formFeedback.style.color = 'var(--accent-primary)';
            formFeedback.textContent = 'Please provide a valid work email and organization name.';
          }
          return;
        }

        if (formFeedback) {
          formFeedback.style.display = 'block';
          formFeedback.style.color = 'var(--accent-emerald)';
          formFeedback.textContent = `✓ Workspace provisioned for ${teamVal} (${emailVal}). Check your inbox for your instant sandbox link.`;
        }
        demoForm.reset();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractions);
  } else {
    initInteractions();
  }
})();
