/**
 * XTrex - Interactive Portfolio Core Logic
 * Ultra-Realistic BMW M5 Twin-Turbo V8 Engine Sound FX, Intro Animation & UI Dynamics
 */

/* ==========================================================================
   0. Ultra-Realistic BMW M5 Twin-Turbo V8 Audio Synthesizer
   Features: Starter Crank, 8-Cylinder Firing Cadence, High-RPM Rev Sweep,
   Twin-Turbo Spool & M-Performance Exhaust Overrun Pops
   ========================================================================== */
class M5RealisticAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playRealisticM5Roar() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // --- 1. Starter Cranking (Rhythmic Dual Pulse: Chik-Chik) ---
      for (let i = 0; i < 2; i++) {
        const crankTime = now + (i * 0.12);
        const crankOsc = this.ctx.createOscillator();
        const crankGain = this.ctx.createGain();
        crankOsc.type = 'sawtooth';
        crankOsc.frequency.setValueAtTime(190, crankTime);
        crankOsc.frequency.exponentialRampToValueAtTime(50, crankTime + 0.09);
        
        crankGain.gain.setValueAtTime(0.35, crankTime);
        crankGain.gain.exponentialRampToValueAtTime(0.01, crankTime + 0.09);
        
        crankOsc.connect(crankGain);
        crankGain.connect(this.ctx.destination);
        crankOsc.start(crankTime);
        crankOsc.stop(crankTime + 0.1);
      }

      // --- 2. V8 Cross-Plane Engine Roar & Low-End Muscle (Harmonic Detuned Oscillators) ---
      const startTime = now + 0.24;
      const oscV8_1 = this.ctx.createOscillator();
      const oscV8_2 = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const engineFilter = this.ctx.createBiquadFilter();
      const engineGain = this.ctx.createGain();

      oscV8_1.type = 'sawtooth';
      oscV8_2.type = 'sawtooth';
      oscSub.type = 'triangle';

      // Authentic M5 Rev Pitch Envelope: Initial catch at 80Hz -> idle rumble -> explosive acceleration spike to 380Hz -> throttle blip -> settle
      oscV8_1.frequency.setValueAtTime(75, startTime);
      oscV8_1.frequency.exponentialRampToValueAtTime(190, startTime + 0.45);
      oscV8_1.frequency.exponentialRampToValueAtTime(380, startTime + 1.1);
      oscV8_1.frequency.exponentialRampToValueAtTime(260, startTime + 1.7);
      oscV8_1.frequency.exponentialRampToValueAtTime(90, startTime + 2.4);

      oscV8_2.frequency.setValueAtTime(73.5, startTime); // Subtle detune for aggressive chorusing
      oscV8_2.frequency.exponentialRampToValueAtTime(186, startTime + 0.45);
      oscV8_2.frequency.exponentialRampToValueAtTime(374, startTime + 1.1);
      oscV8_2.frequency.exponentialRampToValueAtTime(255, startTime + 1.7);
      oscV8_2.frequency.exponentialRampToValueAtTime(88, startTime + 2.4);

      // Deep Sub-Bass exhaust pressure
      oscSub.frequency.setValueAtTime(38, startTime);
      oscSub.frequency.exponentialRampToValueAtTime(95, startTime + 0.5);
      oscSub.frequency.exponentialRampToValueAtTime(190, startTime + 1.1);
      oscSub.frequency.exponentialRampToValueAtTime(45, startTime + 2.4);

      // Dual Low-Pass Resonant Filter shaping (V8 engine chamber acoustics)
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(280, startTime);
      engineFilter.frequency.exponentialRampToValueAtTime(1800, startTime + 1.1);
      engineFilter.frequency.exponentialRampToValueAtTime(400, startTime + 2.4);
      engineFilter.Q.setValueAtTime(3.5, startTime);

      // Master Volume Envelope
      engineGain.gain.setValueAtTime(0.01, startTime);
      engineGain.gain.linearRampToValueAtTime(0.42, startTime + 0.25);
      engineGain.gain.linearRampToValueAtTime(0.55, startTime + 1.1);
      engineGain.gain.exponentialRampToValueAtTime(0.01, startTime + 2.5);

      oscV8_1.connect(engineFilter);
      oscV8_2.connect(engineFilter);
      oscSub.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(this.ctx.destination);

      oscV8_1.start(startTime);
      oscV8_2.start(startTime);
      oscSub.start(startTime);

      oscV8_1.stop(startTime + 2.5);
      oscV8_2.stop(startTime + 2.5);
      oscSub.stop(startTime + 2.5);

      // --- 3. Twin-Turbo High-Speed Whistle & Spool Up ---
      const turboTime = startTime + 0.3;
      const turboOsc = this.ctx.createOscillator();
      const turboFilter = this.ctx.createBiquadFilter();
      const turboGain = this.ctx.createGain();

      turboOsc.type = 'sine';
      turboOsc.frequency.setValueAtTime(900, turboTime);
      turboOsc.frequency.exponentialRampToValueAtTime(3400, turboTime + 0.9);
      turboOsc.frequency.exponentialRampToValueAtTime(1400, turboTime + 1.8);

      turboFilter.type = 'bandpass';
      turboFilter.frequency.setValueAtTime(2200, turboTime);
      turboFilter.Q.setValueAtTime(4.0, turboTime);

      turboGain.gain.setValueAtTime(0.001, turboTime);
      turboGain.gain.linearRampToValueAtTime(0.18, turboTime + 0.8);
      turboGain.gain.exponentialRampToValueAtTime(0.001, turboTime + 2.0);

      turboOsc.connect(turboFilter);
      turboFilter.connect(turboGain);
      turboGain.connect(this.ctx.destination);

      turboOsc.start(turboTime);
      turboOsc.stop(turboTime + 2.1);

      // --- 4. Exhaust Overrun Crackles & Turbo Blow-Off Pops (M Exhaust Burble) ---
      const popTimes = [startTime + 1.25, startTime + 1.38, startTime + 1.52, startTime + 1.68];
      popTimes.forEach((pt, idx) => {
        const bufferSize = this.ctx.sampleRate * 0.06;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.25));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const popFilter = this.ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(800 + (idx * 300), pt);
        popFilter.Q.setValueAtTime(2.0, pt);

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.28, pt);
        popGain.gain.exponentialRampToValueAtTime(0.01, pt + 0.06);

        noise.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.ctx.destination);

        noise.start(pt);
      });

    } catch (e) {
      console.warn('Audio triggered after user interaction:', e);
    }
  }
}

const m5Audio = new M5RealisticAudioEngine();

/* ==========================================================================
   1. BMW M5 Cinematic Intro Sequence Orchestrator
   ========================================================================== */
function initM5IntroSequence() {
  const introLoader = document.getElementById('m5-intro-loader');
  if (!introLoader) return;

  // Trigger realistic M5 audio on user click or load
  const triggerAudioOnFirstInteraction = () => {
    m5Audio.playRealisticM5Roar();
    document.removeEventListener('click', triggerAudioOnFirstInteraction);
    document.removeEventListener('keydown', triggerAudioOnFirstInteraction);
  };
  document.addEventListener('click', triggerAudioOnFirstInteraction, { once: true });
  document.addEventListener('keydown', triggerAudioOnFirstInteraction, { once: true });

  // Play immediately if allowed by browser
  setTimeout(() => {
    m5Audio.playRealisticM5Roar();
  }, 180);

  // Auto transition cleanly into portfolio (~2.8s)
  setTimeout(() => {
    finishIntro();
  }, 2850);

  function finishIntro() {
    introLoader.classList.add('intro-completed');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   2. Navbar & Navigation Handling
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ==========================================================================
   3. Scroll Reveal Animations (IntersectionObserver)
   ========================================================================== */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    revealObserver.observe(el);
  });
}

/* ==========================================================================
   4. 3D Perspective Card Tilt Effect
   ========================================================================== */
function init3DTilt() {
  const tiltCards = document.querySelectorAll('.project-card, .timeline-card, .cv-showcase');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/* ==========================================================================
   5. Project Filtering
   ========================================================================== */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* ==========================================================================
   6. Modals & Projects Data (Ram Mandloi)
   ========================================================================== */
const projectData = {
  ai: {
    title: 'Personalized AI Assistant (2026)',
    category: 'AI & Natural Language Processing',
    image: 'assets/project-neural.jpg',
    description: 'Built a responsive AI assistant with voice and text responses, improving user interaction through NLP and speech recognition. Developed with Node.js, Express, MongoDB, and JavaScript for automated task execution.',
    stats: [
      { label: 'Platform', value: 'Web / Voice' },
      { label: 'Integration', value: 'NLP & Audio' },
      { label: 'Database', value: 'MongoDB' }
    ],
    tech: ['Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'HTML/CSS', 'NLP'],
    demoUrl: 'https://xtrexeditz.github.io/Personalized-Ai-assistant/',
    repoUrl: 'https://github.com/xtrexeditz/Personalized-Ai-assistant'
  },
  web: {
    title: 'XTrex Travel Website (Maharaja)',
    category: 'Web Application & UI',
    image: 'assets/project-telematics.jpg',
    description: 'Front-end design showcasing travel exploration features with HTML, CSS, and JavaScript. Emphasizes cross-device responsiveness, interactive UI components, and GitHub Pages continuous deployment.',
    stats: [
      { label: 'Tech Stack', value: 'HTML/CSS/JS' },
      { label: 'Design', value: 'Responsive' },
      { label: 'Hosting', value: 'GitHub Pages' }
    ],
    tech: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages'],
    demoUrl: 'https://xtrexeditz.github.io/Maharaja-/',
    repoUrl: 'https://github.com/xtrexeditz/Maharaja-'
  },
  dsa: {
    title: 'Problem Solving & LeetCode Track',
    category: 'Data Structures & Algorithms',
    image: 'assets/project-fintech.jpg',
    description: 'Core problem-solving foundation in C/C++ and Java covering arrays, linked lists, stacks, queues, trees, graphs, hashing, recursion, and dynamic programming with Big-O complexity analysis.',
    stats: [
      { label: 'Languages', value: 'C++ & Java' },
      { label: 'Focus', value: 'DSA & Big-O' },
      { label: 'Optimization', value: 'High' }
    ],
    tech: ['C++', 'Java', 'Data Structures', 'Algorithms', 'LeetCode'],
    demoUrl: null,
    repoUrl: 'https://github.com/xtrexeditz'
  }
};

function initModals() {
  const modalBackdrop = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const modalBody = document.getElementById('modal-dynamic-content');

  document.querySelectorAll('[data-project-key]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-project-key');
      const data = projectData[key];
      if (!data) return;

      modalBody.innerHTML = `
        <div style="margin-bottom: 24px;">
          <span class="project-category-badge" style="position: static; display: inline-block; margin-bottom: 12px;">${data.category}</span>
          <h2 style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 800; color: var(--navy-900);">${data.title}</h2>
        </div>
        <div style="border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px; border: 1px solid var(--charcoal-200);">
          <img src="${data.image}" alt="${data.title}" style="width: 100%; height: auto; max-height: 380px; object-fit: cover;">
        </div>
        <p style="font-size: 1.05rem; color: var(--charcoal-600); line-height: 1.7; margin-bottom: 24px;">${data.description}</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; padding: 18px; background: var(--bg-surface-subtle); border-radius: var(--radius-md);">
          ${data.stats.map(s => `
            <div style="text-align: center;">
              <div style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--navy-900);">${s.value}</div>
              <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--charcoal-500); margin-top: 4px;">${s.label}</div>
            </div>
          `).join('')}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px;">
          ${data.tech.map(t => `<span class="project-tag" style="background: #FFFFFF; border-color: rgba(0, 153, 255, 0.4); font-weight: 700; color: var(--navy-900);">${t}</span>`).join('')}
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          ${data.demoUrl ? `<a href="${data.demoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background: var(--m-red); border-color: var(--m-red);">🚀 Live Demo</a>` : ''}
          <a href="${data.repoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">GitHub Repository</a>
        </div>
      `;

      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCVModal();
    }
  });
}

window.closeModal = function() {
  const modalBackdrop = document.getElementById('project-modal');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
};

/* ==========================================================================
   7. CV / Resume Preview & Download Generator (Ram Mandloi)
   ========================================================================== */
function initCVDownload() {
  const downloadBtns = document.querySelectorAll('.js-download-cv');
  const previewBtns = document.querySelectorAll('.js-preview-cv');
  const cvModal = document.getElementById('cv-modal');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const originalText = btn.innerHTML;
      btn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; width: 18px; height: 18px;" stroke="currentColor" fill="none" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path>
        </svg>
        Preparing...
      `;
      btn.style.pointerEvents = 'none';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.pointerEvents = '';
        triggerResumePrintOrDownload();
        showToast('Ram Mandloi CV Downloaded');
      }, 700);
    });
  });

  previewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (cvModal) {
        cvModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });
}

window.closeCVModal = function() {
  const cvModal = document.getElementById('cv-modal');
  if (cvModal) {
    cvModal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

function triggerResumePrintOrDownload() {
  const cvHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ram Mandloi - Resume</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; max-width: 800px; margin: auto; }
        h1 { font-size: 26px; color: #000; margin-bottom: 2px; }
        .subtitle { font-size: 14px; font-weight: 700; color: #0099FF; margin-bottom: 8px; }
        .contact { font-size: 13px; color: #475569; margin-bottom: 20px; border-bottom: 2px solid #0099FF; padding-bottom: 12px; }
        .section { margin-top: 18px; }
        h2 { font-size: 15px; color: #000; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
        .item { margin-bottom: 12px; }
        .item-title { font-weight: 700; font-size: 14px; display: flex; justify-content: space-between; }
        .item-sub { color: #64748b; font-size: 13px; margin-bottom: 4px; }
        ul { padding-left: 20px; font-size: 13px; color: #334155; margin-top: 4px; }
        .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <h1>Ram Mandloi</h1>
      <div class="subtitle">Aspiring Data Scientist | Python, ML, Data Analysis</div>
      <div class="contact">
        📧 rammandloi142@gmail.com | 📞 +91 9343223908 | 📍 Sanawad, Madhya Pradesh<br>
        🔗 github.com/xtrexeditz | linkedin.com/in/ram-mandloi-1b80b1347
      </div>

      <div class="section">
        <h2>Technical Skills</h2>
        <p style="font-size: 13px; color: #334155;">
          <strong>Hard Skills:</strong> HTML/CSS, Adobe Photoshop, Python, Creative Writing, MongoDB, JavaScript, Java, C++, Network Security, MySQL<br>
          <strong>Soft Skills:</strong> Critical thinking, Teamwork, Problem-Solving, Adaptability, Decision-Making
        </p>
      </div>

      <div class="section">
        <h2>Technical Projects</h2>
        <div class="item">
          <div class="item-title">
            <span>Personalized AI Assistant (2026)</span>
            <span>HTML/CSS, Node.js, MongoDB, JavaScript, Express.js</span>
          </div>
          <ul>
            <li>Built a responsive AI assistant with voice and text responses, improving user interaction through NLP and speech recognition.</li>
            <li>Utilized HTML, CSS, JavaScript, and Node.js to develop and deploy the project effectively.</li>
          </ul>
        </div>

        <div class="item">
          <div class="item-title">
            <span>XTrex Travel Website (2025)</span>
            <span>HTML/CSS, JavaScript</span>
          </div>
          <ul>
            <li>Created a user-friendly travel site with interactive UI components and cross-device compatibility.</li>
            <li>Deployed on GitHub Pages demonstrating practical web deployment and version control.</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>Problem Solving & Data Structures</h2>
        <p style="font-size: 13px; color: #334155;">
          Strong foundation in problem solving and data structures using C/C++ and Java (arrays, linked lists, stacks, queues, trees, graphs, hashing, recursion, and dynamic programming with Big-O complexity optimization).
        </p>
      </div>

      <div class="section">
        <h2>Education</h2>
        <div class="item">
          <div class="item-title"><span>SAGE University</span><span>2024 — 2028</span></div>
          <div class="item-sub">B.Tech | Computer Science Engineering (CGPA: 8.72)</div>
        </div>
        <div class="item">
          <div class="item-title"><span>Shree Rewa Gurjar Bal Niketan Higher Secondary School, Sanawad</span><span>2024</span></div>
          <div class="item-sub">Class XII | Percentage: 84.6%</div>
        </div>
        <div class="item">
          <div class="item-title"><span>Omkar Valley</span><span>2022</span></div>
          <div class="item-sub">Class X | Percentage: 81.8%</div>
        </div>
      </div>

      <div class="section">
        <h2>Certifications</h2>
        <ul>
          <li><strong>AI Tools and ChatGPT Workshop</strong> — Be10x (February 2026) — Skills learned: Python</li>
          <li><strong>Hack Tour India 2025</strong> — Applied School powered by Sunstone (January 2025)</li>
          <li><strong>The Rise of ChatGPT</strong> — Physics Wallah (January 2025)</li>
          <li><strong>Power BI for Beginners</strong> — Simplilearn SkillUp (December 2025)</li>
          <li><strong>C Plus Plus Essentials One</strong> — Cisco Networking Academy (December 2025)</li>
        </ul>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([cvHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Ram_Mandloi_Resume.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   8. Contact Form Handling & Feedback
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;" stroke="currentColor" fill="none" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path>
      </svg>
      Transmitting...
    `;
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Message Delivered
      `;
      submitBtn.style.background = '#10B981';
      submitBtn.style.borderColor = '#10B981';

      showToast('Message sent successfully!');
      form.reset();

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.style.borderColor = '';
        submitBtn.disabled = false;
      }, 3000);
    }, 900);
  });
}

/* ==========================================================================
   9. Toast Notification Utility
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #FF1744; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: bold; font-size: 13px;">
      ✓
    </div>
    <div style="font-size: 0.9rem; font-weight: 600; color: #FFFFFF;">${message}</div>
  `;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initM5IntroSequence();
  initNavbar();
  initScrollAnimations();
  init3DTilt();
  initProjectFilters();
  initModals();
  initContactForm();
  initCVDownload();
});
