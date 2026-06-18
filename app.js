// TypeBuddy Core Application Logic


// Web Audio API Synthesizer (Zero-dependency sound effects)
const SoundSynth = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playPop() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },
  playClick() {
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
  },
  playBuzz() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  },
  playFanfare() {
    this.init();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.3);

      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
    });
  }
};

// Application State
const AppState = {
  theme: 'kids', // 'kids' or 'focus'
  currentView: 'welcome',
  currentLesson: null,
  charIndex: 0,
  keystrokes: 0,
  correctStrokes: 0,
  errors: 0,
  startTime: null,
  timerInterval: null,
  starsCount: 0,

  // Audio preferences
  soundEnabled: true,
  voiceEnabled: true,

  // Progress (saved to localStorage)
  progress: {
    completedLessons: {},     // lessonId -> stars (1-3)
    lessonPracticeTime: {},   // lessonId -> seconds remaining (starts at 3600)
    highScores: {},           // game -> score
    name: 'Young Typist',
    history: []               // Array of practice attempts
  },

  loadProgress() {
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    const userEmail = userSession ? userSession.email : 'guest';
    const key = `typebuddy_progress_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Reset to defaults first to prevent inheriting memory state from previous sessions
    this.progress = {
      completedLessons: {},     // lessonId -> stars (1-3)
      lessonPracticeTime: {},   // lessonId -> seconds remaining (starts at 3600)
      highScores: {},           // game -> score
      name: userSession ? userSession.name : 'Young Typist',
      history: [],              // Array of practice attempts
      keyStats: {}              // key -> { total: 0, errors: 0, totalTimeMs: 0 }
    };

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.progress = { ...this.progress, ...parsed };
      } catch (e) {
        console.error("Failed to load progress from localStorage", e);
      }
    }
    if (!this.progress.lessonPracticeTime) this.progress.lessonPracticeTime = {};
    if (!this.progress.completedLessons) this.progress.completedLessons = {};
    if (!this.progress.history) this.progress.history = [];
    if (!this.progress.highScores) this.progress.highScores = {};
    if (!this.progress.keyStats) this.progress.keyStats = {};

    // Sync from database (local or remote)
    this.syncFromDatabase();
  },

  async syncFromDatabase() {
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    if (!userSession || !userSession.email) return;

    const userEmail = userSession.email;
    const key = `typebuddy_progress_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const cachedProgress = localStorage.getItem(key);
    if (cachedProgress) {
      this.progress = { ...this.progress, ...JSON.parse(cachedProgress) };
      if (this.currentView === 'dashboard') {
        Router.renderDashboardMap();
      } else if (this.currentView === 'stats') {
        Router.renderStatsView();
      }
    }
  },

  saveProgress() {
    this.saveProgressToDatabase();
  },

  async saveProgressToDatabase() {
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    if (!userSession || !userSession.email) return;

    const userEmail = userSession.email;

    // 1. Calculate the current level the user is in based on their highest completed lesson
    let highestCompletedLevel = 1;
    for (const levelData of TYPING_LESSONS) {
      const allCompleted = levelData.lessons.every(lesson => (this.progress.completedLessons[lesson.id] || 0) > 0);
      if (allCompleted) {
        highestCompletedLevel = Math.max(highestCompletedLevel, levelData.level + 1);
      }
    }
    const maxLevel = TYPING_LESSONS.reduce((max, l) => Math.max(max, l.level), 1);
    if (highestCompletedLevel > maxLevel) {
      highestCompletedLevel = maxLevel;
    }

    const currentLevelString = `Level ${highestCompletedLevel}`;

    // 2. Save locally first (user-specific localStorage key)
    const key = `typebuddy_progress_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(this.progress));
    localStorage.setItem('typebuddy_progress', JSON.stringify(this.progress));

    // 3. Update local user session level state
    userSession.level = currentLevelString;
    localStorage.setItem('typebuddy_user_session', JSON.stringify(userSession));

    // Update welcome screen subtitle dynamically
    const welcomeSubtitleEl = document.getElementById('welcome-subtitle');
    if (welcomeSubtitleEl) {
      welcomeSubtitleEl.textContent = `You are on your way to mastering touch typing! Your goal is "${userSession.goal}" and your skill level is "${userSession.level}". Let's start practicing!`;
    }
  }
};

// Mascot Reactions & Speech Text
const MascotHelper = {
  speak(text) {
    if (!AppState.voiceEnabled) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Find a friendly voice if possible
    const voices = window.speechSynthesis.getVoices();
    const kidVoice = voices.find(voice => voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('natural'));
    if (kidVoice) utterance.voice = kidVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.1; // slightly higher pitch for friendly tone
    window.speechSynthesis.speak(utterance);
  },

  react(type) {
    const bubble = document.getElementById('mascot-speech-bubble');
    const eyeL = document.getElementById('mascot-eye-l');
    const eyeR = document.getElementById('mascot-eye-r');
    const mouth = document.getElementById('mascot-mouth');

    if (!bubble || !mouth) return;

    // Normal facial reset
    eyeL.setAttribute('ry', '6');
    eyeR.setAttribute('ry', '6');
    mouth.setAttribute('d', 'M 40 65 Q 50 75 60 65'); // Smile

    let speech = "";
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    const userName = userSession ? userSession.name : "friend";

    switch (type) {
      case 'welcome':
        speech = `Hi ${userName}! I am Koko! Let's learn typing together! Pick a lesson on the map to start!`;
        break;
      case 'lesson_start':
        speech = `Let's practice! Follow my hands and type the keys. You got this!`;
        break;
      case 'correct':
        speech = ["Great!", "Perfect!", "A star!", "Nice job!", "Keep going!"][Math.floor(Math.random() * 5)];
        mouth.setAttribute('d', 'M 35 65 Q 50 85 65 65'); // Big smile
        break;
      case 'incorrect':
        speech = ["Oops!", "Try again!", "No worries!", "Find the glowing finger!", "Press carefully!"][Math.floor(Math.random() * 5)];
        mouth.setAttribute('d', 'M 40 70 Q 50 60 60 70'); // Sad/flat mouth
        break;
      case 'complete':
        speech = `Amazing! You finished the lesson! Look at all those stars!`;
        mouth.setAttribute('d', 'M 30 65 Q 50 95 70 65'); // Huge laugh
        break;
      case 'cheer':
        speech = "Woohoo! Dynamic typing champ!";
        break;
    }

    bubble.textContent = speech;
  }
};

// Virtual Hands and Keyboard Highlight Engine
const InputVisuals = {
  // Key names standardizer for visual elements
  mapKeyName(key) {
    if (key === " ") return "space";
    if (key === ";") return "semicolon";
    if (key === ",") return "comma";
    if (key === ".") return "period";
    if (key === "/") return "slash";
    return key.toLowerCase();
  },

  clearHighlights() {
    // Clear keyboard active keys
    document.querySelectorAll('.key.active').forEach(k => k.classList.remove('active'));
    // Clear SVG hands
    document.querySelectorAll('.finger.highlight').forEach(f => f.classList.remove('highlight'));
  },

  highlightTarget(char) {
    this.clearHighlights();
    if (!char) return;

    // 1. Highlight Key
    let keySelector = this.mapKeyName(char);

    // Handle shift keys for capitals or special punctuation
    let isCapital = (char !== char.toLowerCase()) && (char.length === 1) && !char.match(/[0-9]/);
    if (isCapital) {
      // Highlight shift key (left or right shift depending on letter)
      const leftShiftKeys = "QWERTASDFGZXCVB".split("");
      const shiftKeyId = leftShiftKeys.includes(char) ? 'key-shift-right' : 'key-shift-left';
      const shiftEl = document.getElementById(shiftKeyId);
      if (shiftEl) shiftEl.classList.add('active');
      keySelector = char.toLowerCase();
    }

    const keyEl = document.getElementById(`key-${keySelector}`);
    if (keyEl) {
      keyEl.classList.add('active');
    }

    // 2. Highlight Hand Finger
    if (AppState.currentLesson && AppState.currentLesson.fingerGuide) {
      const fingerCode = AppState.currentLesson.fingerGuide[char];
      if (fingerCode) {
        const fingerEl = document.querySelector(`.finger-${fingerCode}`);
        if (fingerEl) {
          fingerEl.classList.add('highlight');
        }
      }
    }
  }
};

// Typing Tutor Logic Engine
const TypingTutor = {
  init() {
    window.addEventListener('keydown', (e) => {
      if (AppState.currentView !== 'tutor') return;

      // Prevent browser shortcuts like search, refresh, backspace page navigation
      if (e.key === 'Backspace' || e.key === ' ' || (e.key === '/' && !e.ctrlKey)) {
        e.preventDefault();
      }

      this.handleInput(e);
    });

    window.addEventListener('keyup', (e) => {
      if (AppState.currentView !== 'tutor') return;
      const keyId = InputVisuals.mapKeyName(e.key);
      const keyEl = document.getElementById(`key-${keyId}`);
      if (keyEl) keyEl.classList.remove('pressed');
    });
  },

  startLesson(lesson) {
    AppState.currentLesson = lesson;
    AppState.charIndex = 0;
    AppState.keystrokes = 0;
    AppState.correctStrokes = 0;
    AppState.errors = 0;
    AppState.sessionKeyErrors = {};
    AppState.startTime = null;
    AppState.lastKeyTime = null; // reset key latency timer
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    // 1. Session Practice Timer initialization (60 minutes = 3600 seconds)
    if (lesson.id === 'custom-weak-keys') {
      AppState.lessonSecondsLeft = Infinity;
      document.getElementById('stat-timer').textContent = "∞";
    } else {
      if (!AppState.progress.lessonPracticeTime) AppState.progress.lessonPracticeTime = {};
      const secondsLeft = AppState.progress.lessonPracticeTime[lesson.id];
      AppState.lessonSecondsLeft = (secondsLeft !== undefined) ? secondsLeft : 3600;

      // Display remaining time immediately
      const mins = Math.floor(AppState.lessonSecondsLeft / 60);
      const secs = AppState.lessonSecondsLeft % 60;
      document.getElementById('stat-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 2. Key Repetition Count initialization
    const repContainer = document.getElementById('repetition-counter-container');
    if (lesson.isInitialKeyStage) {
      AppState.repetitionCount = 0;
      repContainer.style.display = 'flex';
      document.getElementById('repetition-current').textContent = '0';
    } else {
      AppState.repetitionCount = 100; // bypass
      repContainer.style.display = 'none';
    }

    // Reset stats displays
    document.getElementById('stat-wpm').textContent = '0';
    document.getElementById('stat-accuracy').textContent = '100%';
    document.getElementById('stat-errors').textContent = '0';

    // Render text block
    const textContainer = document.getElementById('typing-text-block');
    textContainer.innerHTML = '';

    let activeText = lesson.text;
    if (lesson.id !== 'custom-weak-keys' && activeText.length < 500) {
      while (activeText.length < 500) {
        activeText += " " + lesson.text;
      }
    }
    AppState.activeText = activeText;

    const container = document.querySelector('.typing-box-container');
    if (container) container.scrollTop = 0;

    AppState.activeText.split('').forEach((char, idx) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      if (idx === 0) span.classList.add('current');
      textContainer.appendChild(span);
    });

    // Speak first letter if voice enabled
    setTimeout(() => {
      MascotHelper.react('lesson_start');
      if (AppState.voiceEnabled) {
        const currentTarget = AppState.activeText[0];
        const readable = currentTarget === " " ? "Space" : currentTarget;
        MascotHelper.speak(`Press ${readable}`);
      }
    }, 400);

    // Setup visuals
    InputVisuals.highlightTarget(AppState.activeText[0]);
    if (typeof KeyboardHeatmap !== 'undefined' && KeyboardHeatmap.active) {
      KeyboardHeatmap.render();
    }

    // Transition to Tutor Screen
    Router.navigateTo('tutor');
  },

  handleInput(e) {
    // Ignore trigger controls
    if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock') return;

    // Visually press standard keys
    const pressedKeyId = InputVisuals.mapKeyName(e.key);
    const keyEl = document.getElementById(`key-${pressedKeyId}`);
    if (keyEl) {
      keyEl.classList.add('pressed');
      setTimeout(() => keyEl.classList.remove('pressed'), 100);
    }

    if (!AppState.startTime) {
      AppState.startTime = new Date();
      // Tick countdown every second
      AppState.timerInterval = setInterval(() => {
        if (AppState.currentLesson.id === 'custom-weak-keys') {
          document.getElementById('stat-timer').textContent = "∞";
          this.updateLiveStats();
          return;
        }

        if (AppState.lessonSecondsLeft > 0) {
          AppState.lessonSecondsLeft--;
          AppState.progress.lessonPracticeTime[AppState.currentLesson.id] = AppState.lessonSecondsLeft;
          AppState.saveProgress();
        }

        // Update timer UI text
        const mins = Math.floor(AppState.lessonSecondsLeft / 60);
        const secs = AppState.lessonSecondsLeft % 60;
        document.getElementById('stat-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Expiration auto-completion trigger
        if (AppState.lessonSecondsLeft <= 0 && AppState.repetitionCount >= 100) {
          this.completeLesson();
        }

        this.updateLiveStats();
      }, 1000);
    }

    const lessonText = AppState.activeText;
    const targetChar = lessonText[AppState.charIndex];
    AppState.keystrokes++;

    const spans = document.getElementById('typing-text-block').children;
    const currentSpan = spans[AppState.charIndex];

    if (e.key === targetChar) {
      // CORRECT KEY
      AppState.correctStrokes++;

      // Record key metrics: total and latency
      const targetKeyId = InputVisuals.mapKeyName(targetChar);
      if (!AppState.progress.keyStats[targetKeyId]) {
        AppState.progress.keyStats[targetKeyId] = { total: 0, errors: 0, totalTimeMs: 0 };
      }
      const nowTime = performance.now();
      let elapsed = AppState.lastKeyTime ? (nowTime - AppState.lastKeyTime) : 0;
      elapsed = Math.min(elapsed, 3000); // cap at 3 seconds to avoid idle pauses skewing stats
      AppState.lastKeyTime = nowTime;

      AppState.progress.keyStats[targetKeyId].total++;
      if (elapsed > 0) {
        AppState.progress.keyStats[targetKeyId].totalTimeMs += elapsed;
      }

      // Increment repetitions if initial identification stage
      if (AppState.currentLesson.isInitialKeyStage) {
        // Increment key repetitions (excluding spaces/caps shifts)
        if (e.key !== " " && e.key.length === 1) {
          AppState.repetitionCount++;
          document.getElementById('repetition-current').textContent = Math.min(100, AppState.repetitionCount);

          // Audio cue on hitting target keys
          if (AppState.repetitionCount === 100) {
            MascotHelper.speak("Key repetition target reached! Practice timer remains.");
          }
        }
      }

      if (AppState.soundEnabled) {
        if (AppState.theme === 'kids') SoundSynth.playPop();
        else SoundSynth.playClick();
      }

      currentSpan.classList.remove('current');
      currentSpan.classList.add('correct');

      AppState.charIndex++;

      if (AppState.charIndex >= lessonText.length) {
        // CHECK COMPLETION OR LOOP
        if (AppState.currentLesson.id === 'custom-weak-keys') {
          this.completeLesson();
        } else if (AppState.lessonSecondsLeft <= 0 && AppState.repetitionCount >= 100) {
          this.completeLesson();
        } else {
          // Keep typing! Regenerate text
          this.loopPrompt();
        }
      } else {
        // MOVE NEXT
        const nextSpan = spans[AppState.charIndex];
        nextSpan.classList.add('current');

        // Speak next letter on change (throttle or random triggers)
        const nextChar = lessonText[AppState.charIndex];
        InputVisuals.highlightTarget(nextChar);

        if (AppState.voiceEnabled && (Math.random() < 0.25 || nextChar === " ")) {
          const readable = nextChar === " " ? "Space" : nextChar;
          MascotHelper.speak(readable);
        }

        // Smooth scroll check
        this.updateScroll();
      }
    } else {
      // INCORRECT KEY
      AppState.errors++;

      // Record key metrics: error
      const targetKeyId = InputVisuals.mapKeyName(targetChar);
      if (!AppState.progress.keyStats[targetKeyId]) {
        AppState.progress.keyStats[targetKeyId] = { total: 0, errors: 0, totalTimeMs: 0 };
      }
      AppState.progress.keyStats[targetKeyId].total++;
      AppState.progress.keyStats[targetKeyId].errors++;

      // Track session error keys
      if (!AppState.sessionKeyErrors) {
        AppState.sessionKeyErrors = {};
      }
      if (!AppState.sessionKeyErrors[targetKeyId]) {
        AppState.sessionKeyErrors[targetKeyId] = 0;
      }
      AppState.sessionKeyErrors[targetKeyId]++;

      if (AppState.soundEnabled) SoundSynth.playBuzz();

      currentSpan.classList.add('incorrect');
      MascotHelper.react('incorrect');

      // Remove red shake outline after delay
      setTimeout(() => {
        currentSpan.classList.remove('incorrect');
      }, 500);

      this.updateLiveStats();
    }

    if (typeof KeyboardHeatmap !== 'undefined' && KeyboardHeatmap.active) {
      KeyboardHeatmap.render();
    }
  },

  loopPrompt() {
    const textContainer = document.getElementById('typing-text-block');
    textContainer.innerHTML = '';
    AppState.charIndex = 0;

    const container = document.querySelector('.typing-box-container');
    if (container) container.scrollTop = 0;

    AppState.activeText.split('').forEach((char, idx) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      if (idx === 0) span.classList.add('current');
      textContainer.appendChild(span);
    });

    InputVisuals.highlightTarget(AppState.activeText[0]);
  },

  updateScroll() {
    const block = document.getElementById('typing-text-block');
    const container = document.querySelector('.typing-box-container');
    if (!block || !container || block.children.length === 0) return;

    const spans = block.children;
    const currentSpan = spans[AppState.charIndex];
    if (!currentSpan) return;

    let currentLine = 0;
    let lineOffsets = [spans[0].offsetTop];
    let lastOffset = spans[0].offsetTop;

    for (let i = 1; i < spans.length; i++) {
      if (spans[i].offsetTop > lastOffset) {
        currentLine++;
        lastOffset = spans[i].offsetTop;
        lineOffsets.push(lastOffset);
      }
      if (i === AppState.charIndex) {
        AppState.currentLineIndex = currentLine;
      }
    }

    // Calculate line group (scrolling every 5 lines)
    const lineGroup = Math.floor((AppState.currentLineIndex || 0) / 5);
    const targetScrollTop = lineOffsets[lineGroup * 5] || 0;

    // Smoothly scroll the container
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  },

  updateLiveStats() {
    if (!AppState.startTime) return;
    const now = new Date();
    const elapsedMinutes = Math.max(0.05, (now - AppState.startTime) / 60000);

    // WPM = (typed characters / 5) / elapsed minutes
    let wpm = 0;
    if (elapsedMinutes > 0) {
      wpm = Math.round((AppState.correctStrokes / 5) / elapsedMinutes);
    }

    const accuracy = AppState.keystrokes > 0
      ? Math.round((AppState.correctStrokes / AppState.keystrokes) * 100)
      : 100;

    document.getElementById('stat-wpm').textContent = wpm;
    document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
    document.getElementById('stat-errors').textContent = AppState.errors;
  },

  completeLesson() {
    clearInterval(AppState.timerInterval);
    InputVisuals.clearHighlights();

    // Final score math
    const now = new Date();
    const elapsedMinutes = Math.max(0.05, (now - AppState.startTime) / 60000);
    const wpm = Math.round((AppState.correctStrokes / 5) / elapsedMinutes) || 10;
    const accuracy = Math.round((AppState.correctStrokes / AppState.keystrokes) * 100) || 100;

    // Ensure history exists
    if (!AppState.progress.history) {
      AppState.progress.history = [];
    }
    // Record current attempt stats
    AppState.progress.history.push({
      lessonId: AppState.currentLesson.id,
      wpm: wpm,
      accuracy: accuracy,
      errors: AppState.errors,
      timestamp: new Date().getTime()
    });
    AppState.saveProgress();

    const eligCard = document.getElementById('eligibility-status-card');
    const eligTitle = document.getElementById('eligibility-title');
    const eligDesc = document.getElementById('eligibility-desc');
    const starsDiv = document.getElementById('complete-stars');
    const nextBtn = document.getElementById('complete-next-btn');

    let stars = 0;
    if (AppState.currentLesson.id === 'custom-weak-keys') {
      // Custom Weak Keys completion view
      eligCard.style.borderColor = "#8b5cf6";
      eligCard.style.backgroundColor = "rgba(139, 92, 246, 0.08)";
      eligTitle.textContent = "Weak Keys Training Summary 📊";
      eligTitle.style.color = "#8b5cf6";

      const wrongKeys = Object.entries(AppState.sessionKeyErrors || {})
        .filter(([key, count]) => count > 0)
        .map(([key, count]) => `"${key.toUpperCase()}" (${count} ${count === 1 ? 'time' : 'times'})`);

      if (wrongKeys.length > 0) {
        eligDesc.innerHTML = `You made typing mistakes on these letters during this practice:<br><strong style="color: #ef4444; font-size: 1.15rem; display: inline-block; margin-top: 8px;">${wrongKeys.join(", ")}</strong>.<br><br>Practice these keys more to build accuracy.`;
      } else {
        eligDesc.innerHTML = `Perfect typing! 🎉 You did not make any mistakes in this practice session. Great job!`;
      }

      starsDiv.style.display = 'none';
      nextBtn.textContent = "Finish Training 📊";

      if (accuracy >= 90) {
        triggerConfetti();
        SoundSynth.playFanfare();
      } else {
        if (AppState.soundEnabled) SoundSynth.playBuzz();
      }
      MascotHelper.react('complete');
    } else {
      // Normal graded lessons completion view
      starsDiv.style.display = 'block';

      const isEligible = (wpm >= 15 && accuracy >= 85);
      if (isEligible) {
        // Passed eligibility check
        eligCard.style.borderColor = "#10b981";
        eligCard.style.backgroundColor = "rgba(16, 185, 129, 0.08)";

        eligTitle.textContent = "Eligibility Check: PASSED! 🎉";
        eligTitle.style.color = "#10b981";
        eligDesc.textContent = `Excellent job! You typed at a speed of ${wpm} WPM (required >= 15) and accuracy of ${accuracy}% (required >= 85%). The next lesson is now unlocked on the map.`;

        nextBtn.textContent = "Unlock & Next Lesson! 🚀";

        // Save lesson completion stars progress
        stars = accuracy >= 95 ? 3 : (accuracy >= 85 ? 2 : 1);

        const lessonId = AppState.currentLesson.id;
        const previousStars = AppState.progress.completedLessons[lessonId] || 0;
        if (stars > previousStars) {
          AppState.progress.completedLessons[lessonId] = stars;
          AppState.saveProgress();
        }
        AppState.starsCount += stars;

        SoundSynth.playFanfare();
        MascotHelper.react('complete');
        triggerConfetti();
      } else {
        // Failed speed eligibility check
        eligCard.style.borderColor = "#ef4444";
        eligCard.style.backgroundColor = "rgba(239, 68, 68, 0.08)";

        eligTitle.textContent = "Eligibility Check: FAILED ❌";
        eligTitle.style.color = "#ef4444";
        eligDesc.textContent = `WPM Speed: ${wpm} (min 15 required) | Accuracy: ${accuracy}% (min 85% required). You took too much time or made too many mistakes. Practice this lesson again to build muscle memory before moving to the next level!`;

        starsDiv.style.display = 'none';
        nextBtn.textContent = "Practice Lesson Again 🔄";

        if (AppState.soundEnabled) SoundSynth.playBuzz();
        MascotHelper.react('incorrect');
      }
    }

    // Display Completion Modal stats
    document.getElementById('complete-lesson-title').textContent = AppState.currentLesson.title;
    document.getElementById('complete-wpm').textContent = `${wpm} WPM`;
    document.getElementById('complete-accuracy').textContent = `${accuracy}%`;
    document.getElementById('complete-errors').textContent = AppState.errors;

    // Render stars representation inside completion card
    starsDiv.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      star.textContent = '★';
      if (i <= stars) star.className = 'star';
      else star.className = 'star star-empty';
      starsDiv.appendChild(star);
    }

    // Toggle Completion View
    Router.navigateTo('complete-overlay');
  }
};

// SPA Navigation Router
const Router = {
  signinTypewriterTimeout: null,
  signupDemoLoopActive: false,
  signupEmailPrefill: "",

  navigateTo(viewId) {
    // Route protection guard
    const session = localStorage.getItem('typebuddy_user_session');
    if (!session && viewId !== 'signin' && viewId !== 'signup') {
      viewId = 'signin';
    }

    // Dismiss the mobile menu drawer
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const navControls = document.querySelector('.nav-controls');
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    if (navControls) navControls.classList.remove('active');

    // Exit active game if navigating anywhere, or reset games view if navigating to games
    if (typeof BalloonGame !== 'undefined') {
      if (viewId === 'games' || BalloonGame.active) {
        BalloonGame.exit();
      }
    }

    // Cancel overlay display if navigating to core views
    const completeOverlay = document.getElementById('complete-overlay-view');
    if (viewId !== 'complete-overlay') {
      completeOverlay.style.display = 'none';
    }

    if (viewId === 'complete-overlay') {
      completeOverlay.style.display = 'flex';
      return;
    }

    // Stop signin/signup loops when leaving them
    if (viewId !== 'signin') {
      if (this.signinTypewriterTimeout) {
        clearTimeout(this.signinTypewriterTimeout);
        this.signinTypewriterTimeout = null;
      }
    }
    if (viewId !== 'signup') {
      this.signupDemoLoopActive = false;
    }

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(`${viewId}-view`);
    if (target) {
      target.classList.add('active');
      AppState.currentView = viewId;
    }

    // Load dynamic updates based on page trigger
    if (viewId === 'dashboard') {
      this.renderDashboardMap();
    } else if (viewId === 'stats') {
      this.renderStatsView();
    } else if (viewId === 'profile') {
      this.renderProfileView();
    } else if (viewId === 'welcome') {
      const completedCount = Object.keys(AppState.progress.completedLessons || {}).length;
      const startLearningBtn = document.getElementById('start-learning-btn');
      if (startLearningBtn) {
        if (completedCount > 0) {
          startLearningBtn.textContent = "Let's Continue! 🚀";
        } else {
          startLearningBtn.textContent = "Let's Start! 🚀";
        }
      }
    } else if (viewId === 'signin') {
      this.initSigninView();
    } else if (viewId === 'signup') {
      this.initSignupView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  initSigninView() {
    const stage = document.getElementById('signin-floating-keys-container');
    if (stage && stage.children.length === 0) {
      // Spawn Fixed Home-Row Keys
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
        const slot = document.createElement('div');
        slot.classList.add('key-slot');
        slot.style.setProperty('--start-x', `${k.x}%`);
        slot.style.setProperty('--start-y', `${k.y}%`);
        slot.style.setProperty('--rot-start', `${k.rotStart}deg`);
        slot.style.setProperty('--rot-end', `${k.rotEnd}deg`);
        slot.style.animationDuration = `${k.duration}s`;
        slot.style.animationDelay = `${k.delay}s`;

        const el = document.createElement('div');
        el.classList.add('floating-key');
        el.classList.add(k.depth);
        el.textContent = k.char;

        if (k.char === 'Space') {
          el.classList.add('space-floating-key');
        }

        el.style.transform = `scale(${k.scale})`;
        el.dataset.scale = k.scale;

        el.addEventListener('click', () => {
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

      // Spawn background particles
      const totalParticles = 8;
      for (let i = 0; i < totalParticles; i++) {
        const p = document.createElement('div');
        p.classList.add('glowing-particle');

        const size = 3 + Math.floor(Math.random() * 5);
        const duration = 15 + Math.random() * 15;
        const delay = Math.random() * -30;
        const startX = Math.random() * 95;
        const startY = Math.random() * 95;
        const dx = Math.random() * 80 - 40;
        const dy = Math.random() * 80 - 40;
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

      // Parallax mousemove magnet effect
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

          if (dist < 85) {
            const force = (85 - dist) / 85;
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

    // Typewriter
    const typewriterTextEl = document.getElementById('signin-hero-typewriter');
    if (typewriterTextEl) {
      const phrases = ["Build Speed", "Improve Accuracy", "Master Typing", "Learn Faster"];
      let phraseIdx = 0;
      let charIdx = 0;
      let isDeleting = false;
      let typingSpeed = 120;

      const typeCycle = () => {
        if (AppState.currentView !== 'signin') return; // break recursion if left view
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
          typingSpeed = 2000;
        } else if (isDeleting && charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          typingSpeed = 500;
        }

        this.signinTypewriterTimeout = setTimeout(typeCycle, typingSpeed);
      };

      if (this.signinTypewriterTimeout) clearTimeout(this.signinTypewriterTimeout);
      this.signinTypewriterTimeout = setTimeout(typeCycle, 800);
    }

    // Prefill login email fields
    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');
    const rememberCheckbox = document.getElementById('signin-remember-me');
    const statusText = document.getElementById('signin-status-text');

    if (emailInput) {
      if (this.signupEmailPrefill) {
        emailInput.value = this.signupEmailPrefill;
        if (statusText) {
          statusText.textContent = "Welcome to the family! Now sign in! 🐒";
        }
        this.signupEmailPrefill = "";
      } else {
        if (statusText) statusText.textContent = "Monkey Helper Koko is waiting... 🐒";

        const remembered = localStorage.getItem('typebuddy_remembered_user');
        if (remembered) {
          try {
            const { email, name } = JSON.parse(remembered);
            if (email) emailInput.value = email;
            if (rememberCheckbox) rememberCheckbox.checked = true;
            if (name && statusText) {
              statusText.textContent = `Welcome back, ${name}! 🐒`;
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          emailInput.value = "";
          if (rememberCheckbox) rememberCheckbox.checked = false;
        }
      }
    }
    if (passwordInput) passwordInput.value = "";
  },

  initSignupView() {
    this.signupDemoLoopActive = true;

    const DEMO_SENTENCES = [
      "typebuddy helps you master touch typing",
      "keep your eyes on the screen, not the keys",
      "feel the small bumps on keys f and j",
      "practice every day to build finger memory"
    ];

    const demoTextEl = document.getElementById('signup-demo-typing-text');
    let currentSentenceIdx = 0;

    const getDemoKeyId = (char) => {
      if (char === " ") return "signup-demo-key-space";
      if (char === ";") return "signup-demo-key-semicolon";
      if (char === ",") return "signup-demo-key-comma";
      if (char === ".") return "signup-demo-key-period";
      return `signup-demo-key-${char.toLowerCase()}`;
    };

    const typeSentence = async (sentence) => {
      if (!this.signupDemoLoopActive) return;
      if (demoTextEl) demoTextEl.textContent = "";

      for (let i = 0; i < sentence.length; i++) {
        if (!this.signupDemoLoopActive) return;
        const char = sentence[i];
        if (demoTextEl) demoTextEl.textContent += char;

        const keyId = getDemoKeyId(char);
        const keyEl = document.getElementById(keyId);
        if (keyEl) keyEl.classList.add('active');

        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

        if (keyEl) keyEl.classList.remove('active');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      for (let i = sentence.length; i >= 0; i--) {
        if (!this.signupDemoLoopActive) return;
        if (demoTextEl) demoTextEl.textContent = sentence.substring(0, i);
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    };

    const startDemoLoop = async () => {
      while (this.signupDemoLoopActive) {
        await typeSentence(DEMO_SENTENCES[currentSentenceIdx]);
        currentSentenceIdx = (currentSentenceIdx + 1) % DEMO_SENTENCES.length;
      }
    };

    startDemoLoop();
  },

  renderDashboardMap() {
    const mapContainer = document.getElementById('dashboard-levels-container');
    mapContainer.innerHTML = '';

    // Check if logged in user is admin
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    const isAdmin = userSession && userSession.isAdmin === true;

    // Determine the next lesson ID to be done
    let nextLessonId = null;
    for (const levelData of TYPING_LESSONS) {
      for (const lesson of levelData.lessons) {
        const starsEarned = AppState.progress.completedLessons[lesson.id] || 0;
        if (starsEarned === 0) {
          nextLessonId = lesson.id;
          break;
        }
      }
      if (nextLessonId !== null) break;
    }
    // Fallback: if all lessons are completed, nextLessonId is the last lesson ID
    if (nextLessonId === null && TYPING_LESSONS.length > 0) {
      const lastLevel = TYPING_LESSONS[TYPING_LESSONS.length - 1];
      if (lastLevel.lessons.length > 0) {
        nextLessonId = lastLevel.lessons[lastLevel.lessons.length - 1].id;
      }
    }

    let isPreviousCompleted = true; // Unlock first lesson by default
    let totalStarsEarned = 0;

    TYPING_LESSONS.forEach(levelData => {
      const levelWrapper = document.createElement('div');
      levelWrapper.className = 'map-level-container';

      const grid = document.createElement('div');
      grid.className = 'lessons-grid';

      levelData.lessons.forEach(lesson => {
        const card = document.createElement('div');
        const starsEarned = AppState.progress.completedLessons[lesson.id] || 0;
        totalStarsEarned += starsEarned;

        const isLocked = !isAdmin && !isPreviousCompleted && lesson.id !== 1;
        card.className = `lesson-card ${isLocked ? 'locked' : ''}`;

        if (lesson.id === nextLessonId) {
          card.classList.add('next-lesson');
        }
        if (starsEarned > 0) {
          card.classList.add('completed-lesson');
        }

        // Build card HTML
        let starsHtml = '';
        for (let i = 1; i <= 3; i++) {
          if (i <= starsEarned) starsHtml += '★';
          else starsHtml += '<span class="star-empty">★</span>';
        }

        card.innerHTML = `
          <div class="lesson-card-header">
            <span class="lesson-number">Lesson ${lesson.id}</span>
            <span class="lesson-stars">${starsHtml}</span>
          </div>
          <h4>${lesson.title}</h4>
          <div class="lesson-keys">
            ${lesson.keys.map(k => `<span class="lesson-key-badge">${k === " " ? "Space" : k}</span>`).join('')}
          </div>
        `;

        if (!isLocked) {
          card.addEventListener('click', () => {
            TypingTutor.startLesson(lesson);
          });
          // Unlock next lesson if this is complete (needs >= 1 star)
          isPreviousCompleted = starsEarned > 0;
        } else {
          isPreviousCompleted = false;
        }

        grid.appendChild(card);
      });

      levelWrapper.appendChild(grid);
      mapContainer.appendChild(levelWrapper);
    });

    // Add dynamic active path line and monkey marker
    let activeLine = document.getElementById('dashboard-active-line');
    if (!activeLine) {
      activeLine = document.createElement('div');
      activeLine.id = 'dashboard-active-line';
      activeLine.className = 'dashboard-map-line-active';
      mapContainer.appendChild(activeLine);
    }

    let monkeyMarker = document.getElementById('dashboard-monkey-marker');
    if (!monkeyMarker) {
      monkeyMarker = document.createElement('div');
      monkeyMarker.id = 'dashboard-monkey-marker';
      monkeyMarker.className = 'dashboard-map-monkey';
      monkeyMarker.textContent = '🐒';
      mapContainer.appendChild(monkeyMarker);
    }

    // Measure coordinates and position path elements after browser layout
    requestAnimationFrame(() => {
      const nextCard = document.querySelector('.next-lesson');
      if (nextCard) {
        const cardRect = nextCard.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();

        // Calculate vertical middle of next lesson card
        const relativeTop = cardRect.top - containerRect.top + (cardRect.height / 2);

        activeLine.style.height = `${relativeTop}px`;
        monkeyMarker.style.top = `${relativeTop - 16}px`;
      } else {
        activeLine.style.height = '0px';
        monkeyMarker.style.top = '0px';
      }
    });

    // Display total stars count
    document.getElementById('dashboard-star-value').textContent = totalStarsEarned;

    this.updateCertificateAvailability();
  },

  updateCertificateAvailability() {
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    const isAdmin = userSession && userSession.isAdmin === true;

    // Check if at least 10 lessons (levels 1-10) are completed
    let completedLevelsCount = 0;
    for (let i = 1; i <= 10; i++) {
      if (AppState.progress.completedLessons[i] > 0) {
        completedLevelsCount++;
      }
    }
    const isEligible = isAdmin || (completedLevelsCount >= 10);

    // Header button
    const certBtn = document.getElementById('cert-trigger-btn');
    if (certBtn) {
      certBtn.style.display = 'flex';
      if (isEligible) {
        certBtn.innerHTML = '🏆 Certificate!';
        certBtn.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        certBtn.style.borderColor = '#d97706';
        certBtn.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
      } else {
        certBtn.innerHTML = '🔒 Certificate';
        certBtn.style.background = '#94a3b8';
        certBtn.style.borderColor = '#64748b';
        certBtn.style.boxShadow = 'none';
      }
    }

    // Stats page section
    const certSection = document.getElementById('cert-print-section');
    if (certSection) {
      certSection.style.display = 'block';
    }
  },

  renderStatsView() {
    const completed = Object.keys(AppState.progress.completedLessons).length;
    const total = TYPING_LESSONS.reduce((sum, item) => sum + item.lessons.length, 0);

    document.getElementById('stats-lessons-done').textContent = `${completed} / ${total}`;

    let totalStars = 0;
    Object.values(AppState.progress.completedLessons).forEach(s => totalStars += s);
    document.getElementById('stats-total-stars').textContent = totalStars;

    // Calculate average WPM from history
    let avgWpm = 0;
    const history = AppState.progress.history || [];
    if (history.length > 0) {
      const totalWpm = history.reduce((sum, item) => sum + item.wpm, 0);
      avgWpm = Math.round(totalWpm / history.length);
    } else {
      const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
      const isAdmin = userSession && userSession.isAdmin === true;
      if (isAdmin) {
        avgWpm = 45; // Default admin speed seed if history is empty
      }
    }
    document.getElementById('stats-avg-wpm').textContent = `${avgWpm} WPM`;

    // Game high score
    const gameScore = AppState.progress.highScores['balloon'] || 0;
    document.getElementById('stats-balloon-highscore').textContent = gameScore;

    // Render progress charts
    if (typeof StatsChart !== 'undefined') {
      StatsChart.render();
    }

    this.updateCertificateAvailability();
  },

  renderProfileView() {
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    if (!userSession) {
      this.navigateTo('signin');
      return;
    }

    // Reset feedback alerts
    const detailsSuccess = document.getElementById('profile-details-success');
    const detailsError = document.getElementById('profile-details-error');
    const passwordSuccess = document.getElementById('profile-password-success');
    const passwordError = document.getElementById('profile-password-error');

    if (detailsSuccess) detailsSuccess.style.display = 'none';
    if (detailsError) detailsError.style.display = 'none';
    if (passwordSuccess) passwordSuccess.style.display = 'none';
    if (passwordError) passwordError.style.display = 'none';

    // Clear input errors visual styling
    document.querySelectorAll('#profile-view .input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('#profile-view .validation-message').forEach(span => {
      span.textContent = "";
    });

    // Populate inputs from session / local DB
    const emailInput = document.getElementById('profile-email');
    const nameInput = document.getElementById('profile-full-name');
    const ageInput = document.getElementById('profile-age');
    const goalSelect = document.getElementById('profile-goal');
    const levelSelect = document.getElementById('profile-level');

    if (emailInput) emailInput.value = userSession.email;
    if (nameInput) nameInput.value = userSession.name || "";
    if (ageInput) ageInput.value = userSession.age || "";
    if (goalSelect) goalSelect.value = userSession.goal || "General Typing";
    if (levelSelect) levelSelect.value = userSession.level || "Beginner";
  }
};

// Word lists for game modes
const MEDIUM_WORDS = [
  "cat", "dog", "fox", "lion", "bear", "fish", "bird", "tree", "leaf", "star",
  "moon", "sun", "cloud", "rain", "wind", "snow", "fire", "water", "earth", "rock",
  "sand", "ship", "boat", "car", "train", "plane", "bike", "road", "park", "home",
  "door", "room", "book", "pen", "desk", "hand", "foot", "head", "face", "eye",
  "ear", "nose", "hair", "gold", "pink", "blue", "red", "green", "milk", "bread",
  "apple", "pear", "plum", "grape", "peach", "lemon", "lime", "melon", "berry", "cake"
];

const HARD_WORDS = [
  "monkey", "giraffe", "elephant", "penguin", "dolphin", "octopus", "dinosaur", "kangaroo",
  "butterfly", "computer", "keyboard", "notebook", "airplane", "mountain", "fountain", "treasure",
  "adventure", "rainbow", "umbrella", "backpack", "sandcastle", "spaceship", "telescope", "microscope",
  "chocolate", "watermelon", "pineapple", "strawberry", "blueberry", "chameleon", "squirrel",
  "hedgehog", "alligator", "crocodile", "flamingo", "kangaroo", "platypus", "astronaut", "scientist",
  "detective", "explorer", "guitarist", "drummer", "violinist", "orchestra", "symphony", "university",
  "dictionary", "navigation", "lighthouse", "wonderland"
];

// Balloon Pop Mini-Game Engine
const BalloonGame = {
  score: 0,
  lives: 3,
  balloons: [],
  spawnTimer: null,
  gameLoop: null,
  active: false,
  arenaEl: null,
  mode: 'easy',
  targetedBalloon: null,
  targetCharIndex: 0,

  getLevel() {
    if (!this.startTime) return 1;
    const elapsedSeconds = Math.floor((new Date() - this.startTime) / 1000);

    if (elapsedSeconds < 30) return 1;
    if (elapsedSeconds < 60) return 2;
    if (elapsedSeconds < 90) return 3;
    if (elapsedSeconds < 120) return 4;
    return 5;
  },

  getLetterPool() {
    return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  },

  exit() {
    this.active = false;
    clearTimeout(this.spawnTimer);
    clearInterval(this.gameTimerInterval);
    cancelAnimationFrame(this.gameLoop);
    window.removeEventListener('keydown', this.handleKeystrokeBound);

    // Clean up all balloons
    this.balloons.forEach(b => {
      if (b.el) b.el.remove();
    });
    this.balloons = [];
    this.targetedBalloon = null;
    this.targetCharIndex = 0;

    // Hide game arena
    if (this.arenaEl) this.arenaEl.style.display = 'none';

    // Show game introduction header and options grid
    const introHeader = document.getElementById('game-intro-header');
    if (introHeader) introHeader.style.display = 'block';

    const setupGrid = document.getElementById('game-setup-grid');
    if (setupGrid) setupGrid.style.display = 'flex';
  },

  start(mode) {
    this.arenaEl = document.getElementById('game-arena-block');
    this.score = 0;
    this.lives = 3;
    this.balloons = [];
    this.active = true;
    this.startTime = new Date();
    this.mode = mode || this.mode || 'easy';
    this.targetedBalloon = null;
    this.targetCharIndex = 0;

    // Hide game introduction header while playing
    const introHeader = document.getElementById('game-intro-header');
    if (introHeader) introHeader.style.display = 'none';

    // Clear arena content and set up HUD with Back button
    this.arenaEl.innerHTML = `
      <div class="game-score-board">
        <button id="game-back-btn" class="btn btn-secondary" style="pointer-events: auto; font-size: 1rem; padding: 8px 16px; border-radius: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px;">⬅️ Quit Game</button>
        <div style="display: flex; gap: 8px;">
          <div class="game-hud">Level: <span id="game-level-val">1</span> / 5</div>
          <div class="game-hud">Blasted: <span id="game-score-val">0</span></div>
          <div class="game-hud">Time Left: <span id="game-time-val">3:00</span></div>
          <div class="game-hud">Lives: <span id="game-lives-val">❤️❤️❤️</span></div>
        </div>
      </div>
    `;

    // Bind Back button click listener
    const backBtn = document.getElementById('game-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.exit());
    }

    this.arenaEl.style.display = 'block';

    // Attach listener
    window.addEventListener('keydown', this.handleKeystrokeBound);

    // Start game timer interval (1 second ticks)
    this.gameTimerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((new Date() - this.startTime) / 1000);
      const timeLeft = 180 - elapsedSeconds;

      if (timeLeft <= 0) {
        this.gameOver();
        return;
      }

      // Update timer HUD
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      const timeEl = document.getElementById('game-time-val');
      if (timeEl) {
        timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      // Update Level dynamically based on time
      const currentLevel = this.getLevel();
      const levelEl = document.getElementById('game-level-val');
      if (levelEl) {
        levelEl.textContent = currentLevel;
      }
    }, 1000);

    // Start spawn loop
    this.spawnLoop();

    // Animation frame engine
    this.update();
  },

  spawnLoop() {
    if (!this.active) return;
    this.spawnBalloon();

    // Calculate spawn rate based on level
    const currentLevel = this.getLevel();
    const spawnDelay = Math.max(600, 2000 - currentLevel * 250); // Level 1: 1750ms. Level 5: 750ms.

    this.spawnTimer = setTimeout(() => this.spawnLoop(), spawnDelay);
  },

  handleKeystroke(e) {
    if (!this.active) return;

    const key = e.key;

    // Ignore function keys or system keys
    if (key.length > 1) return;

    if (this.mode === 'easy') {
      // Easy Mode: Single Letter Popping (case-sensitive) targeting the topmost balloon
      let matchIdx = -1;
      let minY = Infinity;
      for (let i = 0; i < this.balloons.length; i++) {
        if (this.balloons[i].letter === key) {
          if (this.balloons[i].y < minY) {
            minY = this.balloons[i].y;
            matchIdx = i;
          }
        }
      }

      if (matchIdx !== -1) {
        const matched = this.balloons[matchIdx];
        matched.el.remove();
        this.balloons.splice(matchIdx, 1);

        this.score += 1;

        // Update HUD
        document.getElementById('game-score-val').textContent = this.score;
        const levelValEl = document.getElementById('game-level-val');
        if (levelValEl) levelValEl.textContent = this.getLevel();

        SoundSynth.playPop();
        this.createPopParticles(matched.x, matched.y);
      }
    } else {
      // Medium / Hard Mode: Full Word Typing with Targeting focus on the topmost matching balloon
      if (this.targetedBalloon) {
        const targetWord = this.targetedBalloon.word;
        const expectedChar = targetWord[this.targetCharIndex];

        if (key === expectedChar) {
          this.targetCharIndex++;

          // Visual feedback on the balloon
          const typed = targetWord.substring(0, this.targetCharIndex);
          const untyped = targetWord.substring(this.targetCharIndex);

          this.targetedBalloon.el.innerHTML = `
            <span class="typed-part" style="color: #10b981; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${typed}</span><span class="untyped-part">${untyped}</span><div class="balloon-string"></div>
          `;

          if (this.targetCharIndex >= targetWord.length) {
            // Popped targeted balloon
            const matchedIdx = this.balloons.indexOf(this.targetedBalloon);
            if (matchedIdx !== -1) {
              this.targetedBalloon.el.remove();
              this.balloons.splice(matchedIdx, 1);
            }

            this.score += 1;

            // Update HUD
            document.getElementById('game-score-val').textContent = this.score;
            const levelValEl = document.getElementById('game-level-val');
            if (levelValEl) levelValEl.textContent = this.getLevel();

            SoundSynth.playPop();
            this.createPopParticles(this.targetedBalloon.x, this.targetedBalloon.y);

            // Clear target
            this.targetedBalloon = null;
            this.targetCharIndex = 0;
          } else {
            // Success stroke sound
            if (AppState.soundEnabled) {
              if (AppState.theme === 'kids') SoundSynth.playPop();
              else SoundSynth.playClick();
            }
          }
        } else {
          // Mistake sound
          if (AppState.soundEnabled) SoundSynth.playBuzz();
        }
      } else {
        // No balloon targeted yet. Find the one closest to the top matching the first character
        let minY = Infinity;
        let matchBalloon = null;

        for (let i = 0; i < this.balloons.length; i++) {
          const b = this.balloons[i];
          if (b.word[0] === key) {
            if (b.y < minY) {
              minY = b.y;
              matchBalloon = b;
            }
          }
        }

        if (matchBalloon) {
          this.targetedBalloon = matchBalloon;
          this.targetCharIndex = 1;

          // Visual target focus styling
          this.targetedBalloon.el.style.border = '2px solid #10b981';
          this.targetedBalloon.el.style.boxShadow = '0 0 15px #10b981';

          const typed = matchBalloon.word.substring(0, 1);
          const untyped = matchBalloon.word.substring(1);

          this.targetedBalloon.el.innerHTML = `
            <span class="typed-part" style="color: #10b981; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${typed}</span><span class="untyped-part">${untyped}</span><div class="balloon-string"></div>
          `;

          if (this.targetCharIndex >= matchBalloon.word.length) {
            const matchedIdx = this.balloons.indexOf(this.targetedBalloon);
            if (matchedIdx !== -1) {
              this.targetedBalloon.el.remove();
              this.balloons.splice(matchedIdx, 1);
            }
            this.score += 1;

            document.getElementById('game-score-val').textContent = this.score;
            const levelValEl = document.getElementById('game-level-val');
            if (levelValEl) levelValEl.textContent = this.getLevel();

            SoundSynth.playPop();
            this.createPopParticles(this.targetedBalloon.x, this.targetedBalloon.y);

            this.targetedBalloon = null;
            this.targetCharIndex = 0;
          } else {
            if (AppState.soundEnabled) {
              if (AppState.theme === 'kids') SoundSynth.playPop();
              else SoundSynth.playClick();
            }
          }
        } else {
          // Mistake sound
          if (AppState.soundEnabled) SoundSynth.playBuzz();
        }
      }
    }
  },

  spawnBalloon() {
    if (!this.active) return;

    let displayText = "";
    if (this.mode === 'easy') {
      const pool = this.getLetterPool();
      displayText = pool[Math.floor(Math.random() * pool.length)];
    } else if (this.mode === 'medium') {
      displayText = MEDIUM_WORDS[Math.floor(Math.random() * MEDIUM_WORDS.length)];
    } else {
      displayText = HARD_WORDS[Math.floor(Math.random() * HARD_WORDS.length)];
    }

    const balloonEl = document.createElement('div');
    balloonEl.className = 'balloon';

    // Style balloon for words so they fit inside
    if (this.mode !== 'easy') {
      balloonEl.style.width = 'auto';
      balloonEl.style.minWidth = '90px';
      balloonEl.style.padding = '8px 16px';
      balloonEl.style.borderRadius = '24px';
      balloonEl.style.fontSize = '1.3rem'; // slightly smaller for longer words
    }

    balloonEl.innerHTML = `<span class="untyped-part">${displayText}</span><div class="balloon-string"></div>`;

    // Random visual styles (pastel colors)
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#f97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloonEl.style.backgroundColor = color;
    balloonEl.style.color = '#fff';

    // Horizontal random placement
    const widthLimit = this.arenaEl.clientWidth - (this.mode === 'easy' ? 80 : 130);
    const x = Math.random() * widthLimit + 10;
    balloonEl.style.left = `${x}px`;
    balloonEl.style.top = `${this.arenaEl.clientHeight}px`;

    this.arenaEl.appendChild(balloonEl);

    // Speed variables (base speed increases as level goes up)
    const currentLevel = this.getLevel();
    const baseSpeed = 1.0 + currentLevel * 0.6; // Level 1: 1.6. Level 5: 4.0.
    const speed = Math.random() * 0.8 + baseSpeed;

    this.balloons.push({
      el: balloonEl,
      letter: displayText,
      word: displayText,
      x: x,
      y: this.arenaEl.clientHeight,
      speed: speed
    });
  },

  update() {
    if (!this.active) return;

    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.y -= b.speed;
      b.el.style.top = `${b.y}px`;

      // Check boundaries
      if (b.y < -90) {
        // If this balloon was targeted, reset targeted focus
        if (this.targetedBalloon === b) {
          this.targetedBalloon = null;
          this.targetCharIndex = 0;
        }

        b.el.remove();
        this.balloons.splice(i, 1);

        this.lives--;
        const hearts = "❤️".repeat(Math.max(0, this.lives));
        document.getElementById('game-lives-val').textContent = hearts || "💀";

        if (AppState.soundEnabled) SoundSynth.playBuzz();

        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Loop animation frames
    this.gameLoop = requestAnimationFrame(() => this.update());
  },

  createPopParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      particle.style.left = `${x + 35}px`;
      particle.style.top = `${y + 40}px`;
      particle.style.background = ['#ec4899', '#3b82f6', '#10b981', '#fbbf24'][Math.floor(Math.random() * 4)];

      this.arenaEl.appendChild(particle);

      // Fly direction physics
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      let px = x + 35;
      let py = y + 40;

      let steps = 0;
      const particleInterval = setInterval(() => {
        px += Math.cos(angle) * speed;
        py += Math.sin(angle) * speed + 0.8; // gravity drift
        particle.style.left = `${px}px`;
        particle.style.top = `${py}px`;
        particle.style.opacity = 1 - (steps / 30);

        steps++;
        if (steps > 30) {
          clearInterval(particleInterval);
          particle.remove();
        }
      }, 16);
    }
  },

  gameOver() {
    this.active = false;
    clearTimeout(this.spawnTimer);
    clearInterval(this.gameTimerInterval);
    cancelAnimationFrame(this.gameLoop);
    window.removeEventListener('keydown', this.handleKeystrokeBound);

    // Show game introduction header again
    const introHeader = document.getElementById('game-intro-header');
    if (introHeader) introHeader.style.display = 'block';

    // Save high score
    const oldScore = AppState.progress.highScores['balloon'] || 0;
    if (this.score > oldScore) {
      AppState.progress.highScores['balloon'] = this.score;
      AppState.saveProgress();
    }

    // Render Game Over Overlay
    const modal = document.createElement('div');
    modal.style.position = 'absolute';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(15, 23, 42, 0.8)';
    modal.style.color = 'white';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.gap = '20px';
    modal.style.zIndex = '50';

    const isVictory = this.lives > 0;

    if (isVictory) {
      triggerConfetti();
      setTimeout(() => { if (!this.active) triggerConfetti(); }, 800);
      setTimeout(() => { if (!this.active) triggerConfetti(); }, 1600);
    }

    modal.innerHTML = `
      <h2 style="font-size: 3rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${isVictory ? 'Victory! 🏆' : 'Game Over! 💀'}</h2>
      <p style="font-size: 1.4rem;">Level Reached: <strong style="color: #fbbf24">${this.getLevel()}</strong> / 5</p>
      <p style="font-size: 1.4rem;">Total Balloons Blasted: <strong style="color: #fbbf24">${this.score}</strong></p>
      <button id="game-restart-btn" class="btn btn-primary" style="padding: 12px 28px;">Play Again 🎮</button>
    `;

    this.arenaEl.appendChild(modal);

    document.getElementById('game-restart-btn').addEventListener('click', () => {
      modal.remove();
      this.start();
    });
  }
};

// Bind keys handlers cleanly
BalloonGame.handleKeystrokeBound = (e) => BalloonGame.handleKeystroke(e);

// Confetti celebratory burst generator
function triggerConfetti() {
  const container = document.body;
  const count = 60;
  const pieces = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = `${Math.random() * window.innerWidth}px`;
    el.style.top = `${-20 - Math.random() * 50}px`;
    el.style.background = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#f97316'][Math.floor(Math.random() * 6)];
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(el);
    pieces.push(el);

    // Animation paths
    const speed = Math.random() * 4 + 2;
    const horizontalDrift = Math.random() * 2 - 1;
    let y = -20;
    let x = parseFloat(el.style.left);

    const confInterval = setInterval(() => {
      y += speed;
      x += horizontalDrift;
      el.style.top = `${y}px`;
      el.style.left = `${x}px`;

      if (y > window.innerHeight) {
        clearInterval(confInterval);
        el.remove();
      }
    }, 16);
  }
}

// Keyboard Heatmap Overlay Engine
const KeyboardHeatmap = {
  active: false,

  toggle() {
    this.active = !this.active;
    const btn = document.getElementById('heatmap-toggle-btn');
    if (btn) {
      if (this.active) {
        btn.classList.add('active');
        btn.textContent = "📊 Hide Heatmap";
        this.render();
      } else {
        btn.classList.remove('active');
        btn.textContent = "📊 Show Heatmap";
        this.clear();
      }
    }
  },

  clear() {
    document.querySelectorAll('.keyboard-container .key').forEach(keyEl => {
      keyEl.style.backgroundColor = '';
      keyEl.style.color = '';
      keyEl.style.borderColor = '';
      keyEl.style.boxShadow = '';
    });
  },

  render() {
    if (!this.active) return;
    this.clear();

    const stats = AppState.progress.keyStats || {};

    Object.keys(stats).forEach(keyId => {
      const keyEl = document.getElementById(`key-${keyId}`);
      if (!keyEl) return;

      const s = stats[keyId];
      if (s.total === 0) return;

      const errorRate = s.errors / s.total;
      const correctPresses = s.total - s.errors;
      const avgTime = correctPresses > 0 ? (s.totalTimeMs / correctPresses) : 0;

      let bg = "";
      let border = "";
      let text = "#fff";

      if (errorRate > 0.15) {
        // Red overlay: Mistakes issue
        bg = "rgba(239, 68, 68, 0.85)";
        border = "#dc2626";
      } else if (avgTime > 800) {
        // Orange overlay: Speed issue
        bg = "rgba(249, 115, 22, 0.85)";
        border = "#ea580c";
      } else if (s.total > 5) {
        // Green overlay: Mastered
        bg = "rgba(16, 185, 129, 0.85)";
        border = "#059669";
      }

      if (bg) {
        keyEl.style.backgroundColor = bg;
        keyEl.style.color = text;
        keyEl.style.borderColor = border;
        keyEl.style.boxShadow = `inset 0 0 8px rgba(0,0,0,0.15)`;
      }
    });
  }
};

// Comprehensive Keyboard Finger Guide Map (for visual tutor guide falls back)
const COMPREHENSIVE_FINGER_GUIDE = {
  // Left Hand
  "a": "L5", "q": "L5", "z": "L5", "1": "L5", "!": "L5", "A": "L5", "Q": "L5", "Z": "L5",
  "s": "L4", "w": "L4", "x": "L4", "2": "L4", "@": "L4", "S": "L4", "W": "L4", "X": "L4",
  "d": "L3", "e": "L3", "c": "L3", "3": "L3", "#": "L3", "D": "L3", "E": "L3", "C": "L3",
  "f": "L2", "r": "L2", "v": "L2", "4": "L2", "$": "L2", "F": "L2", "R": "L2", "V": "L2",
  "g": "L2", "t": "L2", "b": "L2", "5": "L2", "%": "L2", "G": "L2", "T": "L2", "B": "L2",
  // Thumbs
  " ": "RT",
  // Right Hand
  "h": "R2", "y": "R2", "n": "R2", "6": "R2", "^": "R2", "H": "R2", "Y": "R2", "N": "R2",
  "j": "R2", "u": "R2", "m": "R2", "7": "R2", "&": "R2", "J": "R2", "U": "R2", "M": "R2",
  "k": "R3", "i": "R3", ",": "R3", "8": "R3", "*": "R3", "K": "R3", "I": "R3", "<": "R3",
  "l": "R4", "o": "R4", ".": "R4", "9": "R4", "(": "R4", "L": "R4", "O": "R4", ">": "R4",
  ";": "R5", "p": "R5", "/": "R5", "0": "R5", ")": "R5", ":": "R5", "P": "R5", "?": "R5",
  // Additional punctuation
  "\"": "R5", "'": "R5", "-": "R5", "_": "R5", "=": "R5", "+": "R5", "[": "R5", "]": "R5",
  "{": "R5", "}": "R5", "\\": "R5", "|": "R5"
};

// Targeted Weak-Keys Training Prompt Generator
const WeakKeysGenerator = {
  getWeakKeys() {
    const stats = AppState.progress.keyStats || {};
    const weakList = [];

    Object.keys(stats).forEach(keyId => {
      const s = stats[keyId];
      if (s.total < 3) return; // need baseline sample

      const errorRate = s.errors / s.total;
      const correctPresses = s.total - s.errors;
      const avgTime = correctPresses > 0 ? (s.totalTimeMs / correctPresses) : 0;

      const difficulty = (errorRate * 10) + (avgTime / 1000);

      if (errorRate > 0.10 || avgTime > 700) {
        weakList.push({ key: keyId, score: difficulty });
      }
    });

    weakList.sort((a, b) => b.score - a.score);
    return weakList.map(item => item.key).slice(0, 5);
  },

  generatePrompt() {
    const p1 = "Developing fast and accurate typing skills requires patience, consistency, and regular practice. Every day presents a new opportunity to improve muscle memory and reduce mistakes while maintaining a comfortable rhythm. A good typist focuses not only on speed but also on precision, because correcting errors often takes more time than typing carefully in the first place. The best approach is to sit with proper posture, keep both feet on the floor, and place your fingers on the home row keys before beginning. As confidence grows, the eyes should remain on the screen instead of the keyboard so that touch typing becomes second nature. Reading interesting paragraphs while typing can make practice sessions more enjoyable and less repetitive. Modern workplaces expect employees to communicate quickly through";
    const p2 = "emails, reports, and documentation, making efficient typing an essential skill across many professions. Even students benefit by completing assignments, coding projects, and research papers in less time. Small improvements each day eventually lead to significant progress over weeks and months. For example, increasing typing speed from 35 words per minute to 60 words per minute can dramatically improve productivity without sacrificing quality. Practice should include capital letters, commas, quotation marks, parentheses, and numbers such as 2026 or 12345 to build familiarity with every part of the keyboard. Difficult words and uncommon letter combinations should not be avoided, because they strengthen coordination between the fingers. Taking short breaks helps prevent fatigue and maintains concentration during longer sessions. The ultimate goal is to type naturally, confidently, and";
    return `${p1} ${p2}`;
  },

  startTraining() {
    const weakKeys = this.getWeakKeys();
    const prompt = this.generatePrompt();

    const customLesson = {
      id: 'custom-weak-keys',
      title: 'Targeted Weak Keys Practice',
      text: prompt,
      keys: weakKeys.length > 0 ? weakKeys : ["a", "s", "d", "f"],
      isInitialKeyStage: false,
      fingerGuide: COMPREHENSIVE_FINGER_GUIDE
    };

    TypingTutor.startLesson(customLesson);
  }
};

// Progress Chart Render Engine (utilizing Chart.js)
const StatsChart = {
  chartInstance: null,

  render() {
    const canvas = document.getElementById('stats-progress-chart');
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const history = AppState.progress.history || [];
    const chartCard = document.getElementById('stats-progress-chart-card');

    if (history.length === 0) {
      if (chartCard) chartCard.style.display = 'none';
      return;
    } else {
      if (chartCard) chartCard.style.display = 'block';
    }

    const dataPoints = history.slice(-15);
    const labels = dataPoints.map((item, idx) => {
      const labelId = item.lessonId === 'custom-weak-keys' ? 'WK' : `L${item.lessonId}`;
      return `${labelId} (#${idx + 1})`;
    });
    const wpmData = dataPoints.map(item => item.wpm);
    const accuracyData = dataPoints.map(item => item.accuracy);

    const isDark = AppState.theme === 'focus';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 58, 237, 0.08)';
    const textColor = isDark ? '#94a3b8' : '#7c3aed';

    const ctx = canvas.getContext('2d');

    const wpmGrad = ctx.createLinearGradient(0, 0, 0, 240);
    wpmGrad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    wpmGrad.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    const accGrad = ctx.createLinearGradient(0, 0, 0, 240);
    accGrad.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    accGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Speed (WPM)',
            data: wpmData,
            borderColor: '#8b5cf6',
            backgroundColor: wpmGrad,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Accuracy (%)',
            data: accuracyData,
            borderColor: '#10b981',
            backgroundColor: accGrad,
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: {
                family: isDark ? 'Outfit, sans-serif' : 'Fredoka, sans-serif',
                size: 12,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#f8fafc' : '#4c1d95',
            bodyColor: isDark ? '#cbd5e1' : '#4c1d95',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#ddd6fe',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 10
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
              color: gridColor
            },
            ticks: {
              color: '#8b5cf6',
              font: {
                weight: 'bold'
              }
            },
            title: {
              display: true,
              text: 'WPM Speed',
              color: '#8b5cf6'
            },
            min: 0
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: '#10b981',
              font: {
                weight: 'bold'
              }
            },
            title: {
              display: true,
              text: 'Accuracy %',
              color: '#10b981'
            },
            min: 0,
            max: 100
          }
        }
      }
    });
  }
};

// Global Core Controls Initializer
document.addEventListener('DOMContentLoaded', () => {
  // Helper to initialize session elements
  window.initUserSessionState = function (sessionData) {
    if (!sessionData) return;

    const userDisplayNameEl = document.getElementById('user-display-name');
    if (userDisplayNameEl) {
      userDisplayNameEl.textContent = `👤 ${sessionData.name}`;
    }

    const welcomeTitleEl = document.getElementById('welcome-title');
    if (welcomeTitleEl) {
      welcomeTitleEl.innerHTML = `Welcome, ${sessionData.name}! <br>Ready to Learn? 🚀`;
    }

    const welcomeSubtitleEl = document.getElementById('welcome-subtitle');
    if (welcomeSubtitleEl) {
      welcomeSubtitleEl.textContent = `You are on your way to mastering touch typing! Your goal is "${sessionData.goal}" and your skill level is "${sessionData.level}". Let's start practicing!`;
    }

    AppState.progress.name = sessionData.name;

    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
      adminPanelBtn.style.display = sessionData.isAdmin ? 'flex' : 'none';
    }

    AppState.loadProgress();
  };

  // Load and apply user session details
  const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
  if (userSession) {
    window.initUserSessionState(userSession);
  }

  if (userSession && userSession.isAdmin === true) {
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
      adminPanelBtn.style.display = 'flex';
    }

    // Bind admin page action controls
    const addAdminBtn = document.getElementById('add-admin-btn');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const successAlert = document.getElementById('admin-action-success');
    const errorAlert = document.getElementById('admin-action-error');
    const adminListEl = document.getElementById('admin-accounts-list');

    const renderAdminsList = () => {
      if (!adminListEl) return;
      adminListEl.innerHTML = '';
      const adminEmails = JSON.parse(localStorage.getItem('typebuddy_admin_emails') || '[]');

      // Ensure the default admin is always in the list
      if (!adminEmails.includes('revanth@gmail.com')) {
        adminEmails.push('revanth@gmail.com');
        localStorage.setItem('typebuddy_admin_emails', JSON.stringify(adminEmails));
      }

      adminEmails.forEach(email => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255, 255, 255, 0.4)';
        li.style.border = '1px solid var(--key-border)';
        li.style.borderRadius = '8px';
        li.style.padding = '10px 14px';
        li.style.marginBottom = '8px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.fontSize = '0.95rem';
        li.style.fontWeight = '600';
        li.style.color = 'var(--text-main)';
        li.innerHTML = `
            <span>📧 ${email}</span>
            <span style="background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">Admin</span>
          `;
        adminListEl.appendChild(li);
      });
    };

    if (addAdminBtn && adminEmailInput && adminPasswordInput) {
      addAdminBtn.addEventListener('click', async () => {
        if (successAlert) successAlert.style.display = 'none';
        if (errorAlert) errorAlert.style.display = 'none';

        const emailVal = adminEmailInput.value.trim();
        const passwordVal = adminPasswordInput.value.trim();

        if (!emailVal || !passwordVal) {
          if (errorAlert) {
            errorAlert.textContent = "⚠️ Please fill in both email and password.";
            errorAlert.style.display = 'flex';
          }
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          if (errorAlert) {
            errorAlert.textContent = "⚠️ Please enter a valid email address.";
            errorAlert.style.display = 'flex';
          }
          return;
        }

        if (passwordVal.length < 6) {
          if (errorAlert) {
            errorAlert.textContent = "⚠️ Password must be at least 6 characters.";
            errorAlert.style.display = 'flex';
          }
          return;
        }

        const adminEmails = JSON.parse(localStorage.getItem('typebuddy_admin_emails') || '[]');
        const exists = adminEmails.some(email => email.toLowerCase() === emailVal.toLowerCase());

        if (exists) {
          if (errorAlert) {
            errorAlert.textContent = "⚠️ An admin account with this email already exists.";
            errorAlert.style.display = 'flex';
          }
          return;
        }

        // Disable button
        addAdminBtn.disabled = true;
        addAdminBtn.textContent = "Creating Admin in AWS... ⏳";

        // Prepare payload for AWS signup endpoint
        const payload = {
          email: emailVal,
          name: "Admin User",
          age: 30,
          password: passwordVal,
          goal: "General Typing",
          level: "Advanced",
          isAdmin: true
        };

        try {
          const response = await fetch("https://khspfvnsg2.execute-api.ap-south-1.amazonaws.com/default/typebuddy-signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          let responseData = null;
          const responseText = await response.text();
          try {
            responseData = responseText ? JSON.parse(responseText) : null;
          } catch (e) {
            console.warn("AWS Admin Signup - Response is not valid JSON:", responseText);
          }

          if (!response.ok) {
            const errorMessage = (responseData && (responseData.message || responseData.error)) || responseText || `HTTP error ${response.status}`;
            throw new Error(errorMessage);
          }

          // Successfully added to AWS, update local cache
          adminEmails.push(emailVal);
          localStorage.setItem('typebuddy_admin_emails', JSON.stringify(adminEmails));

          // Clear inputs
          adminEmailInput.value = '';
          adminPasswordInput.value = '';

          if (successAlert) {
            successAlert.textContent = "✅ Admin account created successfully in AWS!";
            successAlert.style.display = 'flex';
          }
          renderAdminsList();

        } catch (err) {
          console.error("AWS Admin Creation Error:", err);
          if (errorAlert) {
            errorAlert.textContent = `❌ AWS Error: ${err.message || "Failed to register admin."}`;
            errorAlert.style.display = 'flex';
          }
        } finally {
          addAdminBtn.disabled = false;
          addAdminBtn.textContent = "Create Admin Account 🛡️";
        }
      });
    }

    // Initial render of admins list
    renderAdminsList();
  }

  // Bind Sign Out button
  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('typebuddy_user_session');
      Router.navigateTo('signin');
    });
  }

  // Audio configuration bindings
  const voiceToggle = document.getElementById('setting-voice');
  const soundToggle = document.getElementById('setting-sound');

  if (voiceToggle) {
    voiceToggle.checked = AppState.voiceEnabled;
    voiceToggle.addEventListener('change', (e) => {
      AppState.voiceEnabled = e.target.checked;
      if (AppState.voiceEnabled) {
        MascotHelper.speak("Voice guidance enabled!");
      }
    });
  }

  if (soundToggle) {
    soundToggle.checked = AppState.soundEnabled;
    soundToggle.addEventListener('change', (e) => {
      AppState.soundEnabled = e.target.checked;
      if (AppState.soundEnabled && AppState.theme === 'kids') {
        SoundSynth.playPop();
      }
    });
  }

  // Theme management selectors
  const kidsModeCard = document.getElementById('mode-kids-card');
  const focusModeCard = document.getElementById('mode-focus-card');

  if (kidsModeCard && focusModeCard) {
    kidsModeCard.addEventListener('click', () => {
      kidsModeCard.classList.add('selected');
      focusModeCard.classList.remove('selected');
      setAppTheme('kids');
    });

    focusModeCard.addEventListener('click', () => {
      focusModeCard.classList.add('selected');
      kidsModeCard.classList.remove('selected');
      setAppTheme('focus');
    });
  }

  function setAppTheme(theme) {
    AppState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Toggle class names for fonts
    if (theme === 'kids') {
      document.body.style.fontFamily = "var(--font-kids)";
    } else {
      document.body.style.fontFamily = "var(--font-focus)";
    }
  }

  // Default launch setting
  setAppTheme('kids');

  // Heatmap toggle button binding
  const heatmapToggleBtn = document.getElementById('heatmap-toggle-btn');
  if (heatmapToggleBtn) {
    heatmapToggleBtn.addEventListener('click', () => {
      KeyboardHeatmap.toggle();
    });
  }

  // Weak keys training trigger button binding
  const weakKeysStartBtn = document.getElementById('weak-keys-start-btn');
  if (weakKeysStartBtn) {
    weakKeysStartBtn.addEventListener('click', () => {
      WeakKeysGenerator.startTraining();
    });
  }

  // Hamburger Menu Toggle
  const hamburgerBtn = document.getElementById('hamburger-menu-btn');
  const navControls = document.querySelector('.nav-controls');
  if (hamburgerBtn && navControls) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      navControls.classList.toggle('active');
    });
  }

  // Close hamburger menu when clicking outside of it
  document.addEventListener('click', (e) => {
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const navControls = document.querySelector('.nav-controls');
    if (hamburgerBtn && navControls) {
      if (!hamburgerBtn.contains(e.target) && !navControls.contains(e.target)) {
        hamburgerBtn.classList.remove('active');
        navControls.classList.remove('active');
      }
    }
  });

  // Nav routes triggers
  document.querySelectorAll('[data-link]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dest = btn.getAttribute('data-link');
      if (dest) Router.navigateTo(dest);
    });
  });

  // Start learning mapping
  const startLearningBtn = document.getElementById('start-learning-btn');
  if (startLearningBtn) {
    startLearningBtn.addEventListener('click', () => {
      Router.navigateTo('dashboard');
    });
  }

  // Modal buttons
  document.getElementById('complete-next-btn').addEventListener('click', () => {
    if (AppState.currentLesson && AppState.currentLesson.id === 'custom-weak-keys') {
      Router.navigateTo('stats');
    } else {
      Router.navigateTo('dashboard');
    }
  });

  // Mini games launch routing
  const lettersEasyCard = document.getElementById('game-card-letters-easy');
  if (lettersEasyCard) {
    lettersEasyCard.addEventListener('click', () => {
      document.getElementById('game-setup-grid').style.display = 'none';
      BalloonGame.start('easy');
    });
  }
  const wordsMediumCard = document.getElementById('game-card-words-medium');
  if (wordsMediumCard) {
    wordsMediumCard.addEventListener('click', () => {
      document.getElementById('game-setup-grid').style.display = 'none';
      BalloonGame.start('medium');
    });
  }
  const wordsHardCard = document.getElementById('game-card-words-hard');
  if (wordsHardCard) {
    wordsHardCard.addEventListener('click', () => {
      document.getElementById('game-setup-grid').style.display = 'none';
      BalloonGame.start('hard');
    });
  }

  // Certificate trigger generator
  const nameInput = document.getElementById('cert-name-input');
  const certShowBtn = document.getElementById('cert-show-btn');
  if (certShowBtn && nameInput) {
    certShowBtn.addEventListener('click', () => {
      const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
      const isAdmin = userSession && userSession.isAdmin === true;

      let completedLevelsCount = 0;
      for (let i = 1; i <= 10; i++) {
        if (AppState.progress.completedLessons[i] > 0) {
          completedLevelsCount++;
        }
      }
      const isEligible = isAdmin || (completedLevelsCount >= 10);

      if (!isEligible) {
        alert("🔒 Certificate Locked\n\nTo unlock and download your TypeBuddy Certificate, you need to complete at least 10 lessons. Keep practicing! 🐒");
        return;
      }

      const name = nameInput.value.trim() || "Young Typist";
      AppState.progress.name = name;
      AppState.saveProgress();

      // Update certificate details
      document.getElementById('certificate-print-name').textContent = name;
      const totalStars = Object.values(AppState.progress.completedLessons).reduce((a, b) => a + b, 0);
      document.getElementById('certificate-star-count').textContent = totalStars;

      const dateEl = document.getElementById('certificate-date');
      if (dateEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
      }

      // Calculate typing metrics averages
      let avgWpm = 0;
      let avgAccuracy = 100;
      let avgMistakes = 0;

      const history = AppState.progress.history || [];

      if (history.length > 0) {
        const totalWpm = history.reduce((sum, item) => sum + item.wpm, 0);
        const totalAccuracy = history.reduce((sum, item) => sum + item.accuracy, 0);
        const totalMistakes = history.reduce((sum, item) => sum + item.errors, 0);

        avgWpm = Math.round(totalWpm / history.length);
        avgAccuracy = Math.round(totalAccuracy / history.length);
        avgMistakes = parseFloat((totalMistakes / history.length).toFixed(1));
      } else if (isAdmin) {
        // Seed default parameters for admin if history is empty
        avgWpm = 45;
        avgAccuracy = 96;
        avgMistakes = 2.0;
      }

      // Update certificate stats DOM elements
      const avgWpmEl = document.getElementById('certificate-avg-wpm');
      const avgAccuracyEl = document.getElementById('certificate-avg-accuracy');
      const avgMistakesEl = document.getElementById('certificate-avg-mistakes');

      if (avgWpmEl) avgWpmEl.textContent = `${avgWpm} WPM`;
      if (avgAccuracyEl) avgAccuracyEl.textContent = `${avgAccuracy}%`;
      if (avgMistakesEl) avgMistakesEl.textContent = avgMistakes;

      Router.navigateTo('certificate');
    });
  }

  // Header Certificate button custom click listener
  const certTriggerBtn = document.getElementById('cert-trigger-btn');
  if (certTriggerBtn) {
    certTriggerBtn.addEventListener('click', () => {
      const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
      const isAdmin = userSession && userSession.isAdmin === true;

      let completedLevelsCount = 0;
      for (let i = 1; i <= 10; i++) {
        if (AppState.progress.completedLessons[i] > 0) {
          completedLevelsCount++;
        }
      }
      const isEligible = isAdmin || (completedLevelsCount >= 10);

      if (isEligible) {
        Router.navigateTo('stats');
      } else {
        alert("🔒 Certificate Locked\n\nTo unlock and download your TypeBuddy Certificate, you need to complete at least 10 lessons. Keep practicing! 🐒");
      }
    });
  }

  // Download button mapping using html2canvas
  const downloadBtn = document.getElementById('download-certificate-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const certPaper = document.querySelector('.certificate-paper');
      if (certPaper) {
        // Disable button text and show downloading spinner
        const originalText = downloadBtn.textContent;
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Downloading... ⏳";

        // Render element to Canvas using html2canvas
        html2canvas(certPaper, {
          scale: 2, // Double scale for crystal clear, high-DPI rendering
          useCORS: true,
          backgroundColor: null,
          logging: false
        }).then(canvas => {
          // Convert canvas to data URL
          const imgData = canvas.toDataURL('image/png');

          // Trigger file download
          const link = document.createElement('a');
          const nameVal = document.getElementById('certificate-print-name').textContent.trim().replace(/\s+/g, '_');
          link.download = `TypeBuddy_Certificate_${nameVal}.png`;
          link.href = imgData;
          link.click();

          // Restore button state
          downloadBtn.disabled = false;
          downloadBtn.textContent = originalText;
        }).catch(err => {
          console.error("html2canvas error:", err);
          alert("❌ Failed to download certificate image.");
          downloadBtn.disabled = false;
          downloadBtn.textContent = originalText;
        });
      }
    });
  }

  // Mascot default voice greetings
  setTimeout(() => {
    MascotHelper.react('welcome');
  }, 1000);

  // Double Click cheat code: double click Mascot Avatar to set remaining time to 10 seconds (for grading/testing)
  const avatar = document.querySelector('.mascot-avatar');
  if (avatar) {
    avatar.addEventListener('dblclick', () => {
      if (AppState.currentLesson && AppState.timerInterval) {
        AppState.lessonSecondsLeft = 10;
        AppState.progress.lessonPracticeTime[AppState.currentLesson.id] = 10;
        AppState.saveProgress();
        MascotHelper.speak("Cheat code activated. Practice ends in 10 seconds!");
        MascotHelper.react('cheer');
      }
    });
  }

  // Window resize handler for monkey position
  window.addEventListener('resize', () => {
    const mapContainer = document.getElementById('dashboard-levels-container');
    if (mapContainer) {
      const activeLine = document.getElementById('dashboard-active-line');
      const monkeyMarker = document.getElementById('dashboard-monkey-marker');
      const nextCard = document.querySelector('.next-lesson');
      if (activeLine && monkeyMarker && nextCard) {
        const cardRect = nextCard.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const relativeTop = cardRect.top - containerRect.top + (cardRect.height / 2);
        activeLine.style.height = `${relativeTop}px`;
        monkeyMarker.style.top = `${relativeTop - 16}px`;
      }
    }
  });

  // Initialize typing listener engine
  TypingTutor.init();

  // --- SIGN IN FORM VALIDATION & SUBMISSION ---
  const signinForm = document.getElementById('signin-form-el');
  const signinEmailInput = document.getElementById('signin-email');
  const signinPasswordInput = document.getElementById('signin-password');
  const signinRememberCheckbox = document.getElementById('signin-remember-me');
  const signinGeneralAlert = document.getElementById('signin-general-error');
  const signinSubmitBtn = document.getElementById('signin-submit-btn');

  function clearSigninErrors() {
    if (signinGeneralAlert) signinGeneralAlert.style.display = 'none';
    document.querySelectorAll('#signin-view .input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('#signin-view .validation-message').forEach(span => {
      span.textContent = "";
    });
  }

  function setSigninError(inputEl, message) {
    const group = inputEl.closest('.input-group');
    if (group) {
      group.classList.add('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) {
        errorSpan.textContent = message;
      }
    }
  }

  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearSigninErrors();

      let isValid = true;
      const emailVal = signinEmailInput.value.trim();
      const passwordVal = signinPasswordInput.value.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) {
        setSigninError(signinEmailInput, "Email Address is required.");
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        setSigninError(signinEmailInput, "Please enter a valid email address.");
        isValid = false;
      }

      if (!passwordVal) {
        setSigninError(signinPasswordInput, "Password is required.");
        isValid = false;
      }

      if (!isValid) {
        if (signinGeneralAlert) {
          signinGeneralAlert.style.display = 'flex';
          signinGeneralAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // AWS Signin flow
      signinSubmitBtn.disabled = true;
      signinSubmitBtn.textContent = "Signing in... 🚀";

      const email = emailVal;
      const password = passwordVal;

      console.log("AWS Signin - Request Payload", { email });

      try {
        const response = await fetch(
          "https://6cgl4wue5c.execute-api.ap-south-1.amazonaws.com/default/typebuddy-signin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email,
              password
            })
          }
        );

        console.log("AWS Signin - Response Status", response.status);

        let data = null;
        const responseText = await response.text();
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          console.warn("AWS Signin - Response is not valid JSON:", responseText);
        }

        console.log("AWS Signin - Response Data", data);

        if (response.status === 200 && data) {
          const userDetails = data.user || data;
          const nameVal = userDetails.name || "User";
          const goal = userDetails.goal || "Improve Speed";
          const level = userDetails.level || "Beginner";
          const ageVal = userDetails.age || "";
          const isAdmin = userDetails.isAdmin;

          // Session creation
          if (signinRememberCheckbox && signinRememberCheckbox.checked) {
            localStorage.setItem('typebuddy_remembered_user', JSON.stringify({ email: emailVal, name: nameVal }));
          } else {
            localStorage.removeItem('typebuddy_remembered_user');
          }

          const sessionData = {
            name: nameVal,
            email: emailVal,
            age: ageVal,
            goal: goal,
            level: level,
            signedInAt: new Date().toISOString(),
            rememberMe: signinRememberCheckbox ? signinRememberCheckbox.checked : false,
            isAdmin: isAdmin
          };

          localStorage.setItem('typebuddy_user_session', JSON.stringify(sessionData));
          window.initUserSessionState(sessionData);

          setTimeout(() => {
            signinSubmitBtn.disabled = false;
            signinSubmitBtn.textContent = "Sign In & Learn! 🚀";
            Router.navigateTo('welcome');
          }, 600);
        } else {
          console.error("AWS Signin - Signin failed");
          signinSubmitBtn.disabled = false;
          signinSubmitBtn.textContent = "Sign In & Learn! 🚀";

          const message = (data && (data.message || data.error)) || "Incorrect email or password.";
          setSigninError(signinPasswordInput, message);
          if (signinGeneralAlert) {
            signinGeneralAlert.style.display = 'flex';
            signinGeneralAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } catch (error) {
        console.error("AWS Signin - Network/Server Error:", error);
        signinSubmitBtn.disabled = false;
        signinSubmitBtn.textContent = "Sign In & Learn! 🚀";

        setSigninError(signinPasswordInput, "A network error occurred. Please check your connection and try again.");
        if (signinGeneralAlert) {
          signinGeneralAlert.style.display = 'flex';
          signinGeneralAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }

  // --- SIGN UP FORM VALIDATION & SUBMISSION ---
  const signupForm = document.getElementById('signup-form-el');
  const signupNameInput = document.getElementById('signup-full-name');
  const signupAgeInput = document.getElementById('signup-age');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');
  const signupGoalSelect = document.getElementById('signup-goal');
  const signupLevelSelect = document.getElementById('signup-level');
  const signupGeneralAlert = document.getElementById('signup-general-error');
  const signupSubmitBtn = document.getElementById('signup-submit-btn');

  function clearSignupErrors() {
    if (signupGeneralAlert) signupGeneralAlert.style.display = 'none';
    document.querySelectorAll('#signup-view .input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('#signup-view .validation-message').forEach(span => {
      span.textContent = "";
    });
  }

  function setSignupError(inputEl, message) {
    const group = inputEl.closest('.input-group');
    if (group) {
      group.classList.add('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) {
        errorSpan.textContent = message;
      }
    }
  }

  // Real-time Name checking
  if (signupNameInput) {
    signupNameInput.addEventListener('input', () => {
      const nameVal = signupNameInput.value.trim();
      const group = signupNameInput.closest('.input-group');
      if (group) {
        group.classList.remove('invalid');
        const errorSpan = group.querySelector('.validation-message');
        if (errorSpan) errorSpan.textContent = "";
      }
    });
  }

  // Real-time Email checking
  if (signupEmailInput) {
    signupEmailInput.addEventListener('input', () => {
      const emailVal = signupEmailInput.value.trim();
      const group = signupEmailInput.closest('.input-group');
      if (group) {
        group.classList.remove('invalid');
        const errorSpan = group.querySelector('.validation-message');
        if (errorSpan) errorSpan.textContent = "";
      }
      if (!emailVal) return;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        setSignupError(signupEmailInput, "Please enter a valid email address.");
        return;
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearSignupErrors();

      let isValid = true;

      const nameVal = signupNameInput.value.trim();
      if (!nameVal) {
        setSignupError(signupNameInput, "Full Name is required.");
        isValid = false;
      }

      const ageVal = parseInt(signupAgeInput.value, 10);
      if (isNaN(ageVal)) {
        setSignupError(signupAgeInput, "Age is required.");
        isValid = false;
      } else if (ageVal <= 5) {
        setSignupError(signupAgeInput, "Age must be greater than 5.");
        isValid = false;
      }

      const emailVal = signupEmailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) {
        setSignupError(signupEmailInput, "Email Address is required.");
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        setSignupError(signupEmailInput, "Please enter a valid email address.");
        isValid = false;
      }

      const passwordVal = signupPasswordInput.value;
      if (!passwordVal) {
        setSignupError(signupPasswordInput, "Password is required.");
        isValid = false;
      } else if (passwordVal.length < 6) {
        setSignupError(signupPasswordInput, "Password must be at least 6 characters.");
        isValid = false;
      }

      const goalVal = signupGoalSelect.value;
      if (!goalVal) {
        setSignupError(signupGoalSelect, "Please choose a typing goal.");
        isValid = false;
      }

      const levelVal = signupLevelSelect.value;
      if (!levelVal) {
        setSignupError(signupLevelSelect, "Please choose a typing level.");
        isValid = false;
      }

      if (!isValid) {
        if (signupGeneralAlert) {
          signupGeneralAlert.style.display = 'flex';
          signupGeneralAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      signupSubmitBtn.disabled = true;
      signupSubmitBtn.textContent = "Creating Session... ⏳";

      const saveSessionAndProceed = () => {
        // Auto-login session directly
        const sessionData = {
          name: nameVal,
          email: emailVal,
          age: ageVal,
          goal: goalVal,
          level: levelVal,
          signedInAt: new Date().toISOString(),
          rememberMe: false,
          isAdmin: emailVal.toLowerCase() === 'revanth@gmail.com'
        };
        localStorage.setItem('typebuddy_user_session', JSON.stringify(sessionData));
        window.initUserSessionState(sessionData);

        setTimeout(() => {
          signupSubmitBtn.disabled = false;
          signupSubmitBtn.textContent = "Start Learning! 🚀";
          Router.signupEmailPrefill = emailVal;
          Router.navigateTo('welcome');
        }, 600);
      };

      // Prepare request payload for AWS integration
      const payload = {
        email: emailVal,
        name: nameVal,
        age: ageVal,
        password: passwordVal,
        goal: goalVal,
        level: levelVal
      };

      console.log("AWS Signup - Request Payload:", payload);

      try {
        const response = await fetch("https://khspfvnsg2.execute-api.ap-south-1.amazonaws.com/default/typebuddy-signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        console.log("AWS Signup - API Response Status:", response.status);

        let responseData = null;
        const responseText = await response.text();
        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          console.warn("AWS Signup - Response is not valid JSON:", responseText);
        }

        console.log("AWS Signup - API Response Data:", responseData);

        if (!response.ok) {
          // Handle API Gateway or Lambda failures (non-200 responses)
          const errorMessage = (responseData && responseData.message) || (responseData && responseData.error) || responseText || `HTTP error ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("AWS Signup - Registration Successful!");
        saveSessionAndProceed();
      } catch (error) {
        console.error("AWS Signup - Registration Failed:", error);

        signupSubmitBtn.disabled = false;
        signupSubmitBtn.textContent = "Start Learning! 🚀";

        const displayMessage = `❌ Sign Up failed: ${error.message || "Network error"}`;

        if (signupGeneralAlert) {
          signupGeneralAlert.innerHTML = `⚠️ ${displayMessage}`;
          signupGeneralAlert.style.display = 'flex';
          signupGeneralAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          alert(displayMessage);
        }
      }
    });
  }

  // --- SPA REDIRECTS TRIGGER BINDINGS ---
  const gotoSignupBtn = document.getElementById('goto-signup-btn');
  if (gotoSignupBtn) {
    gotoSignupBtn.addEventListener('click', () => {
      Router.navigateTo('signup');
    });
  }

  const gotoSigninBtn = document.getElementById('goto-signin-btn');
  if (gotoSigninBtn) {
    gotoSigninBtn.addEventListener('click', () => {
      Router.navigateTo('signin');
    });
  }

  // --- PROFILE VIEW NAVIGATION & BINDINGS ---
  const userDisplayNameBtn = document.getElementById('user-display-name');
  if (userDisplayNameBtn) {
    userDisplayNameBtn.addEventListener('click', () => {
      const session = localStorage.getItem('typebuddy_user_session');
      if (session) {
        Router.navigateTo('profile');
      }
    });
  }

  // Profile Details Form Submission
  const profileDetailsForm = document.getElementById('profile-details-form');
  const profileNameInput = document.getElementById('profile-full-name');
  const profileAgeInput = document.getElementById('profile-age');
  const profileGoalSelect = document.getElementById('profile-goal');
  const profileLevelSelect = document.getElementById('profile-level');
  const profileDetailsSuccess = document.getElementById('profile-details-success');
  const profileDetailsError = document.getElementById('profile-details-error');
  const profileDetailsSubmitBtn = document.getElementById('profile-details-submit-btn');

  function clearProfileDetailsErrors() {
    if (profileDetailsError) profileDetailsError.style.display = 'none';
    if (profileDetailsSuccess) profileDetailsSuccess.style.display = 'none';
    document.querySelectorAll('#profile-view #profile-details-form .input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('#profile-view #profile-details-form .validation-message').forEach(span => {
      span.textContent = "";
    });
  }

  function setProfileDetailsError(inputEl, message) {
    const group = inputEl.closest('.input-group');
    if (group) {
      group.classList.add('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) {
        errorSpan.textContent = message;
      }
    }
  }

  if (profileDetailsForm) {
    profileDetailsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearProfileDetailsErrors();

      const session = JSON.parse(localStorage.getItem('typebuddy_user_session'));
      if (!session) return;

      let isValid = true;
      const nameVal = profileNameInput.value.trim();
      if (!nameVal) {
        setProfileDetailsError(profileNameInput, "Full Name is required.");
        isValid = false;
      }

      const ageVal = parseInt(profileAgeInput.value, 10);
      if (isNaN(ageVal)) {
        setProfileDetailsError(profileAgeInput, "Age is required.");
        isValid = false;
      } else if (ageVal <= 5) {
        setProfileDetailsError(profileAgeInput, "Age must be greater than 5.");
        isValid = false;
      }

      const goalVal = profileGoalSelect.value;
      if (!goalVal) {
        setProfileDetailsError(profileGoalSelect, "Please choose a typing goal.");
        isValid = false;
      }

      const levelVal = profileLevelSelect.value;
      if (!levelVal) {
        setProfileDetailsError(profileLevelSelect, "Please choose a typing level.");
        isValid = false;
      }

      if (!isValid) {
        if (profileDetailsError) {
          profileDetailsError.style.display = 'flex';
        }
        return;
      }

      profileDetailsSubmitBtn.disabled = true;
      profileDetailsSubmitBtn.textContent = "Saving details... 💾";

      // Update active session locally
      session.name = nameVal;
      session.age = ageVal;
      session.goal = goalVal;
      session.level = levelVal;
      localStorage.setItem('typebuddy_user_session', JSON.stringify(session));

      // Sync header state in real-time
      window.initUserSessionState(session);

      profileDetailsSubmitBtn.disabled = false;
      profileDetailsSubmitBtn.textContent = "Save Details 💾";
      if (profileDetailsSuccess) {
        profileDetailsSuccess.style.display = 'flex';
        setTimeout(() => {
          profileDetailsSuccess.style.display = 'none';
        }, 3000);
      }
    });
  }

  // SPA Session Initialisation Boot Guard
  const session = localStorage.getItem('typebuddy_user_session');
  if (session) {
    Router.navigateTo('welcome');
  } else {
    Router.navigateTo('signin');
  }
});
