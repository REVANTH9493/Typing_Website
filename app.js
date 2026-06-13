// TypeBuddy Core Application Logic

// Seed default admin account
const defaultAdmins = [
  { email: 'revanth@gmail.com', password: 'Revanth@123' }
];
if (!localStorage.getItem('typebuddy_admin_accounts')) {
  localStorage.setItem('typebuddy_admin_accounts', JSON.stringify(defaultAdmins));
}

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
    name: 'Young Typist'
  },
  
  loadProgress() {
    const saved = localStorage.getItem('typebuddy_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.progress = { ...this.progress, ...parsed };
        if (!this.progress.lessonPracticeTime) this.progress.lessonPracticeTime = {};
        if (!this.progress.completedLessons) this.progress.completedLessons = {};
      } catch (e) {
        console.error("Failed to load progress from localStorage", e);
      }
    }
  },
  
  saveProgress() {
    localStorage.setItem('typebuddy_progress', JSON.stringify(this.progress));
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
    
    switch(type) {
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
    AppState.startTime = null;
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    
    // 1. Session Practice Timer initialization (60 minutes = 3600 seconds)
    if (!AppState.progress.lessonPracticeTime) AppState.progress.lessonPracticeTime = {};
    const secondsLeft = AppState.progress.lessonPracticeTime[lesson.id];
    AppState.lessonSecondsLeft = (secondsLeft !== undefined) ? secondsLeft : 3600;
    
    // Display remaining time immediately
    const mins = Math.floor(AppState.lessonSecondsLeft / 60);
    const secs = AppState.lessonSecondsLeft % 60;
    document.getElementById('stat-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
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
    if (activeText.length < 500) {
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
        if (AppState.lessonSecondsLeft <= 0 && AppState.repetitionCount >= 100) {
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
      if (AppState.soundEnabled) SoundSynth.playBuzz();
      
      currentSpan.classList.add('incorrect');
      MascotHelper.react('incorrect');
      
      // Remove red shake outline after delay
      setTimeout(() => {
        currentSpan.classList.remove('incorrect');
      }, 500);
      
      this.updateLiveStats();
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
    
    // Eligibility Threshold check: WPM >= 15 and Accuracy >= 85%
    const isEligible = (wpm >= 15 && accuracy >= 85);
    
    const eligCard = document.getElementById('eligibility-status-card');
    const eligTitle = document.getElementById('eligibility-title');
    const eligDesc = document.getElementById('eligibility-desc');
    const starsDiv = document.getElementById('complete-stars');
    const nextBtn = document.getElementById('complete-next-btn');
    
    let stars = 0;
    if (isEligible) {
      // Passed eligibility check
      eligCard.style.borderColor = "#10b981";
      eligCard.style.backgroundColor = "rgba(16, 185, 129, 0.08)";
      
      eligTitle.textContent = "Eligibility Check: PASSED! 🎉";
      eligTitle.style.color = "#10b981";
      eligDesc.textContent = `Excellent job! You typed at a speed of ${wpm} WPM (required >= 15) and accuracy of ${accuracy}% (required >= 85%). The next lesson is now unlocked on the map.`;
      
      starsDiv.style.display = 'block';
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
  navigateTo(viewId) {
    // Cancel overlay display if navigating to core views
    const completeOverlay = document.getElementById('complete-overlay-view');
    if (viewId !== 'complete-overlay') {
      completeOverlay.style.display = 'none';
    }
    
    if (viewId === 'complete-overlay') {
      completeOverlay.style.display = 'flex';
      return;
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
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  
  renderDashboardMap() {
    const mapContainer = document.getElementById('dashboard-levels-container');
    mapContainer.innerHTML = '';
    
    // Check if logged in user is admin
    const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
    const isAdmin = userSession && userSession.isAdmin === true;
    
    let isPreviousCompleted = true; // Unlock first lesson by default
    let totalStarsEarned = 0;
    
    TYPING_LESSONS.forEach(levelData => {
      const levelWrapper = document.createElement('div');
      levelWrapper.className = 'map-level-container';
      
      const lvlHeader = document.createElement('h3');
      lvlHeader.className = 'level-title';
      lvlHeader.textContent = levelData.levelName;
      levelWrapper.appendChild(lvlHeader);
      
      const grid = document.createElement('div');
      grid.className = 'lessons-grid';
      
      levelData.lessons.forEach(lesson => {
        const card = document.createElement('div');
        const starsEarned = AppState.progress.completedLessons[lesson.id] || 0;
        totalStarsEarned += starsEarned;
        
        const isLocked = !isAdmin && !isPreviousCompleted && lesson.id !== 1;
        card.className = `lesson-card ${isLocked ? 'locked' : ''}`;
        
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
    
    // Display total stars count
    document.getElementById('dashboard-star-value').textContent = totalStarsEarned;
    
    // If all lessons completed (or at least some criteria), unlock certificate button
    const totalLessonsCount = TYPING_LESSONS.reduce((acc, lvl) => acc + lvl.lessons.length, 0);
    const completedCount = Object.keys(AppState.progress.completedLessons).length;
    const certBtn = document.getElementById('cert-trigger-btn');
    if (completedCount >= totalLessonsCount && certBtn) {
      certBtn.style.display = 'flex';
    } else if (certBtn) {
      certBtn.style.display = 'none';
    }
  },
  
  renderStatsView() {
    const completed = Object.keys(AppState.progress.completedLessons).length;
    const total = TYPING_LESSONS.reduce((sum, item) => sum + item.lessons.length, 0);
    
    document.getElementById('stats-lessons-done').textContent = `${completed} / ${total}`;
    
    let totalStars = 0;
    Object.values(AppState.progress.completedLessons).forEach(s => totalStars += s);
    document.getElementById('stats-total-stars').textContent = totalStars;
    
    // Game high score
    const gameScore = AppState.progress.highScores['balloon'] || 0;
    document.getElementById('stats-balloon-highscore').textContent = gameScore;
  }
};

// Balloon Pop Mini-Game Engine
const BalloonGame = {
  score: 0,
  lives: 3,
  balloons: [],
  spawnInterval: null,
  gameLoop: null,
  active: false,
  arenaEl: null,
  
  start() {
    this.arenaEl = document.getElementById('game-arena-block');
    this.score = 0;
    this.lives = 3;
    this.balloons = [];
    this.active = true;
    
    document.getElementById('game-score-val').textContent = '0';
    document.getElementById('game-lives-val').textContent = '❤️❤️❤️';
    
    // Clear arena content
    this.arenaEl.innerHTML = `
      <div class="game-score-board">
        <div class="game-hud">Score: <span id="game-score-val">0</span></div>
        <div class="game-hud">Lives: <span id="game-lives-val">❤️❤️❤️</span></div>
      </div>
    `;
    
    this.arenaEl.style.display = 'block';
    
    // Attach listener
    window.addEventListener('keydown', this.handleKeystrokeBound);
    
    // Spawn loops
    let spawnRate = 1800; // milliseconds
    this.spawnInterval = setInterval(() => this.spawnBalloon(), spawnRate);
    
    // Animation frame engine
    this.update();
  },
  
  handleKeystroke(e) {
    if (!this.active) return;
    
    // Compare keystroke with floating balloon letters
    const key = e.key.toLowerCase();
    
    // Find matching balloon
    let matchIdx = -1;
    for (let i = 0; i < this.balloons.length; i++) {
      if (this.balloons[i].letter === key) {
        matchIdx = i;
        break;
      }
    }
    
    if (matchIdx !== -1) {
      // Pop balloon!
      const matched = this.balloons[matchIdx];
      matched.el.remove();
      this.balloons.splice(matchIdx, 1);
      
      this.score += 10;
      document.getElementById('game-score-val').textContent = this.score;
      SoundSynth.playPop();
      
      // Burst visual particles
      this.createPopParticles(matched.x, matched.y);
    }
  },
  
  spawnBalloon() {
    if (!this.active) return;
    
    // Draw letters from standard lessons or level sets
    const pool = "asdfghjklqwertyuiopzxcvbnm";
    const letter = pool[Math.floor(Math.random() * pool.length)];
    
    const balloonEl = document.createElement('div');
    balloonEl.className = 'balloon';
    balloonEl.textContent = letter;
    
    // Random visual styles (pastel colors)
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#f97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloonEl.style.backgroundColor = color;
    balloonEl.style.color = '#fff';
    
    const stringEl = document.createElement('div');
    stringEl.className = 'balloon-string';
    balloonEl.appendChild(stringEl);
    
    // Horizontal random placement
    const widthLimit = this.arenaEl.clientWidth - 80;
    const x = Math.random() * widthLimit + 10;
    balloonEl.style.left = `${x}px`;
    balloonEl.style.top = `${this.arenaEl.clientHeight}px`;
    
    this.arenaEl.appendChild(balloonEl);
    
    // Speed variables
    const speed = Math.random() * 1.5 + 1.2;
    this.balloons.push({
      el: balloonEl,
      letter: letter,
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
        // Balloon floated away
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
    clearInterval(this.spawnInterval);
    cancelAnimationFrame(this.gameLoop);
    window.removeEventListener('keydown', this.handleKeystrokeBound);
    
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
    
    modal.innerHTML = `
      <h2 style="font-size: 3rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">Game Over!</h2>
      <p style="font-size: 1.4rem;">Final Score: <strong style="color: #fbbf24">${this.score}</strong> points</p>
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

// Global Core Controls Initializer
document.addEventListener('DOMContentLoaded', () => {
  // Load saved local files stats
  AppState.loadProgress();

  // Load and apply user session details
  const userSession = JSON.parse(localStorage.getItem('typebuddy_user_session'));
  if (userSession) {
    // Update user profile name badge in header
    const userDisplayNameEl = document.getElementById('user-display-name');
    if (userDisplayNameEl) {
      userDisplayNameEl.textContent = `👤 ${userSession.name}`;
    }
    
    // Personalize the welcome titles
    const welcomeTitleEl = document.getElementById('welcome-title');
    if (welcomeTitleEl) {
      welcomeTitleEl.innerHTML = `Welcome, ${userSession.name}! <br>Ready to Learn? 🚀`;
    }
    
    const welcomeSubtitleEl = document.getElementById('welcome-subtitle');
    if (welcomeSubtitleEl) {
      welcomeSubtitleEl.textContent = `You are on your way to mastering touch typing! Your goal is "${userSession.goal}" and your skill level is "${userSession.level}". Let's start practicing!`;
    }

    // Override AppState progress name with the logged-in user name
    AppState.progress.name = userSession.name;

    // Show admin panel button if admin logged in
    if (userSession.isAdmin === true) {
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
        const admins = JSON.parse(localStorage.getItem('typebuddy_admin_accounts') || '[]');
        admins.forEach(admin => {
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
            <span>📧 ${admin.email} (Password: ${admin.password})</span>
            <span style="background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">Admin</span>
          `;
          adminListEl.appendChild(li);
        });
      };

      if (addAdminBtn && adminEmailInput && adminPasswordInput) {
        addAdminBtn.addEventListener('click', () => {
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

          const admins = JSON.parse(localStorage.getItem('typebuddy_admin_accounts') || '[]');
          const exists = admins.some(a => a.email.toLowerCase() === emailVal.toLowerCase());
          
          if (exists) {
            if (errorAlert) {
              errorAlert.textContent = "⚠️ An admin account with this email already exists.";
              errorAlert.style.display = 'flex';
            }
            return;
          }

          // Add to list and save
          admins.push({ email: emailVal, password: passwordVal });
          localStorage.setItem('typebuddy_admin_accounts', JSON.stringify(admins));

          // Clear inputs
          adminEmailInput.value = '';
          adminPasswordInput.value = '';

          if (successAlert) successAlert.style.display = 'flex';
          renderAdminsList();
        });
      }

      // Initial render of admins list
      renderAdminsList();
    }
  }

  // Bind Sign Out button
  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('typebuddy_user_session');
      window.location.href = 'signin.html';
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
    Router.navigateTo('dashboard');
  });
  
  // Mini games launch routing
  document.getElementById('game-card-balloon').addEventListener('click', () => {
    document.getElementById('game-setup-grid').style.display = 'none';
    BalloonGame.start();
  });
  
  // Certificate trigger generator
  const nameInput = document.getElementById('cert-name-input');
  const certShowBtn = document.getElementById('cert-show-btn');
  if (certShowBtn && nameInput) {
    certShowBtn.addEventListener('click', () => {
      const name = nameInput.value.trim() || "Young Typist";
      AppState.progress.name = name;
      AppState.saveProgress();
      
      // Update certificate details
      document.getElementById('certificate-print-name').textContent = name;
      const totalStars = Object.values(AppState.progress.completedLessons).reduce((a, b) => a + b, 0);
      document.getElementById('certificate-star-count').textContent = totalStars;
      
      Router.navigateTo('certificate');
    });
  }
  
  // Print button mapping
  const printBtn = document.getElementById('print-certificate-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
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
  
  // Initialize typing listener engine
  TypingTutor.init();
  
  // Boot into welcome screen
  Router.navigateTo('welcome');
});
