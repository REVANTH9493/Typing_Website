// TypeBuddy Sign In Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- WEB AUDIO API SYNTHESIZER ---
  const SoundSynth = {
    ctx: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },
    playClick() {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.03);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      } catch (e) {
        console.warn("Audio Context blocked or unsupported:", e);
      }
    }
  };

  // --- HERO ANIMATION STAGE INITIALIZATION ---
  const stage = document.getElementById('floating-keys-container');
  if (stage) {
    // 1. Spawn Fixed Home-Row Keys
    const homeRowKeys = [
      { char: 'A', x: 8, y: 12, depth: 'depth-high', scale: 1.15, rotStart: -10, rotEnd: 10, duration: 6, delay: 0 },
      { char: 'S', x: 28, y: 8, depth: 'depth-med', scale: 0.95, rotStart: -5, rotEnd: 8, duration: 8, delay: -1.5 },
      { char: 'D', x: 48, y: 15, depth: 'depth-low', scale: 0.75, rotStart: 12, rotEnd: -8, duration: 9, delay: -4.2 },
      { char: 'F', x: 68, y: 10, depth: 'depth-high', scale: 1.1, rotStart: -12, rotEnd: 6, duration: 7, delay: -0.8 },
      { char: 'J', x: 86, y: 14, depth: 'depth-med', scale: 0.9, rotStart: 8, rotEnd: -12, duration: 7.5, delay: -3.1 },
      { char: 'K', x: 14, y: 62, depth: 'depth-low', scale: 0.75, rotStart: -8, rotEnd: 12, duration: 9.5, delay: -5.7 },
      { char: 'L', x: 34, y: 68, depth: 'depth-high', scale: 1.15, rotStart: 15, rotEnd: -5, duration: 6.5, delay: -2.3 },
      { char: ';', x: 78, y: 58, depth: 'depth-med', scale: 0.9, rotStart: -6, rotEnd: 15, duration: 8.5, delay: -6.4 },
      { char: 'Space', x: 46, y: 48, depth: 'depth-high', scale: 1.05, rotStart: -4, rotEnd: 4, duration: 10, delay: -1.0 }
    ];

    homeRowKeys.forEach(k => {
      // Create bobbing key-slot wrapper
      const slot = document.createElement('div');
      slot.classList.add('key-slot');
      
      // Inline styles for CSS bobbing keyframe variables
      slot.style.setProperty('--start-x', `${k.x}%`);
      slot.style.setProperty('--start-y', `${k.y}%`);
      slot.style.setProperty('--rot-start', `${k.rotStart}deg`);
      slot.style.setProperty('--rot-end', `${k.rotEnd}deg`);
      slot.style.animationDuration = `${k.duration}s`;
      slot.style.animationDelay = `${k.delay}s`;

      // Create inner key node
      const el = document.createElement('div');
      el.classList.add('floating-key');
      el.classList.add(k.depth);
      el.textContent = k.char;

      if (k.char === 'Space') {
        el.classList.add('space-floating-key');
      }

      // Save scale parameter to inline style and dataset
      el.style.transform = `scale(${k.scale})`;
      el.dataset.scale = k.scale;

      // Click callback sound trigger
      el.addEventListener('click', () => {
        SoundSynth.playClick();
        el.style.background = '#8b5cf6';
        el.style.borderColor = '#c084fc';
        el.style.color = '#fff';
        el.style.boxShadow = '0 0 25px #c084fc';
        setTimeout(() => {
          el.style.background = '';
          el.style.borderColor = '';
          el.style.color = '';
          el.style.boxShadow = '';
        }, 300);
      });

      slot.appendChild(el);
      stage.appendChild(slot);
    });

    // 2. Spawn Sparse Background Particles
    const totalParticles = 8;
    for (let i = 0; i < totalParticles; i++) {
      const p = document.createElement('div');
      p.classList.add('glowing-particle');

      const size = 3 + Math.floor(Math.random() * 5); // 3px to 8px
      const duration = 15 + Math.random() * 15; // 15s to 30s
      const delay = Math.random() * -30;
      const startX = Math.random() * 95;
      const startY = Math.random() * 95;
      const dx = Math.random() * 80 - 40; // horizontal float drift
      const dy = Math.random() * 80 - 40; // vertical float drift
      const maxOpacity = 0.15 + Math.random() * 0.25;

      p.style.left = `${startX}%`;
      p.style.top = `${startY}%`;
      p.style.setProperty('--size', `${size}px`);
      p.style.setProperty('--duration', `${duration}s`);
      p.style.setProperty('--delay', `${delay}s`);
      p.style.setProperty('--max-opacity', maxOpacity);
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);

      stage.appendChild(p);
    }

    // 3. Mouse Movement Interactive Parallax Displacement (magnet offset push)
    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const keys = stage.querySelectorAll('.floating-key');
      keys.forEach(key => {
        const keyRect = key.getBoundingClientRect();
        const keyCenterX = keyRect.left - rect.left + keyRect.width / 2;
        const keyCenterY = keyRect.top - rect.top + keyRect.height / 2;

        const dx = mouseX - keyCenterX;
        const dy = mouseY - keyCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Displace key if close to mouse (85px boundary)
        if (dist < 85) {
          const force = (85 - dist) / 85; // 0 to 1
          const pushX = (dx / dist) * -12 * force;
          const pushY = (dy / dist) * -12 * force;
          
          key.style.transform = `scale(${key.dataset.scale}) translate3d(${pushX}px, ${pushY}px, 0)`;
          key.style.boxShadow = `0 10px 20px rgba(139, 92, 246, ${0.15 + 0.15 * force})`;
        } else {
          key.style.transform = `scale(${key.dataset.scale})`;
          key.style.boxShadow = '';
        }
      });
    });

    stage.addEventListener('mouseleave', () => {
      const keys = stage.querySelectorAll('.floating-key');
      keys.forEach(key => {
        key.style.transform = `scale(${key.dataset.scale})`;
        key.style.boxShadow = '';
      });
    });
  }

  // --- MOTIVATIONAL TYPEWRITER ENGINE ---
  const typewriterTextEl = document.getElementById('hero-typewriter');
  if (typewriterTextEl) {
    const phrases = ["Build Speed", "Improve Accuracy", "Master Typing", "Learn Faster"];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 120;

    function typeCycle() {
      const currentPhrase = phrases[phraseIdx];

      if (isDeleting) {
        typewriterTextEl.textContent = currentPhrase.substring(0, charIdx - 1);
        charIdx--;
        typingSpeed = 50;
      } else {
        typewriterTextEl.textContent = currentPhrase.substring(0, charIdx + 1);
        charIdx++;
        typingSpeed = 120;
      }

      if (!isDeleting && charIdx === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at typed state
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        typingSpeed = 500; // Pause before typing next
      }

      setTimeout(typeCycle, typingSpeed);
    }

    setTimeout(typeCycle, 800);
  }

  // --- PRE-FILLING LOGIC ---
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('full-name');
  const rememberCheckbox = document.getElementById('remember-me');
  const statusText = document.querySelector('.status-text');

  // 1. Check URL query parameters (redirected from signup)
  const urlParams = new URLSearchParams(window.location.search);
  const paramEmail = urlParams.get('email');
  const paramName = urlParams.get('name');
  const isNewUser = urlParams.get('newuser');

  if (paramEmail) emailInput.value = decodeURIComponent(paramEmail);
  if (paramName) nameInput.value = decodeURIComponent(paramName);

  if (isNewUser && statusText) {
    statusText.textContent = "Welcome to the family! Now sign in! 🐒";
    // Trigger audio greeting if user interacts
    document.body.addEventListener('click', () => {
      const utterance = new SpeechSynthesisUtterance("Welcome! Please sign in to begin touch typing.");
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }, { once: true });
  }

  // 2. Check Remembered User
  if (!emailInput.value || !nameInput.value) {
    const remembered = localStorage.getItem('typebuddy_remembered_user');
    if (remembered) {
      try {
        const { email, name } = JSON.parse(remembered);
        if (email && !emailInput.value) emailInput.value = email;
        if (name && !nameInput.value) nameInput.value = name;
        rememberCheckbox.checked = true;
        if (statusText && !isNewUser) {
          statusText.textContent = `Welcome back, ${name}! 🐒`;
        }
      } catch (e) {
        console.error("Failed to load remembered credentials", e);
      }
    }
  }

  // --- FORM VALIDATION & SIGN IN LOGIC ---
  const form = document.getElementById('signin-form');
  const generalAlert = document.getElementById('general-error-alert');
  const submitBtn = document.getElementById('submit-btn');

  function clearErrors() {
    generalAlert.style.display = 'none';
    document.querySelectorAll('.input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('.validation-message').forEach(span => {
      span.textContent = "";
    });
  }

  function setError(inputEl, message) {
    const group = inputEl.closest('.input-group');
    if (group) {
      group.classList.add('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) {
        errorSpan.textContent = message;
      }
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;

    // Email validation
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      setError(emailInput, "Email Address is required.");
      isValid = false;
    } else if (!emailRegex.test(emailVal)) {
      setError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    // Name validation
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
      setError(nameInput, "Full Name or Nickname is required.");
      isValid = false;
    }

    if (!isValid) {
      generalAlert.style.display = 'flex';
      generalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Disable button, show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in... 🚀";

    // Lookup user details from local registry to retrieve typing goal & level
    let goal = "Improve Speed";
    let level = "Beginner";

    const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
    const matchingUser = registeredUsers.find(u => u.email.toLowerCase() === emailVal.toLowerCase());
    
    if (matchingUser) {
      goal = matchingUser.goal || goal;
      level = matchingUser.level || level;
    }

    // Save remember me credentials if checked
    if (rememberCheckbox.checked) {
      localStorage.setItem('typebuddy_remembered_user', JSON.stringify({
        email: emailVal,
        name: nameVal
      }));
    } else {
      localStorage.removeItem('typebuddy_remembered_user');
    }

    // Create session details
    const sessionData = {
      name: nameVal,
      email: emailVal,
      goal: goal,
      level: level,
      signedInAt: new Date().toISOString(),
      rememberMe: rememberCheckbox.checked
    };

    localStorage.setItem('typebuddy_user_session', JSON.stringify(sessionData));

    // Wait a brief moment to show success state before redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  });
});
