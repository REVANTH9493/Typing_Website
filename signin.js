// TypeBuddy Sign In Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- TYPEWRITER & KEYBOARD DEMO ---
  const DEMO_SENTENCES = [
    "typebuddy helps you master touch typing",
    "keep your eyes on the screen, not the keys",
    "feel the small bumps on keys f and j",
    "practice every day to build finger memory"
  ];

  const demoTextEl = document.getElementById('demo-typing-text');
  let currentSentenceIdx = 0;

  function getDemoKeyId(char) {
    if (char === " ") return "demo-key-space";
    if (char === ";") return "demo-key-semicolon";
    if (char === ",") return "demo-key-comma";
    if (char === ".") return "demo-key-period";
    return `demo-key-${char.toLowerCase()}`;
  }

  async function typeSentence(sentence) {
    demoTextEl.textContent = "";
    
    for (let i = 0; i < sentence.length; i++) {
      const char = sentence[i];
      demoTextEl.textContent += char;
      
      // Highlight matching key
      const keyId = getDemoKeyId(char);
      const keyEl = document.getElementById(keyId);
      if (keyEl) {
        keyEl.classList.add('active');
      }
      
      // Delay before typing next character
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      
      // Un-highlight key
      if (keyEl) {
        keyEl.classList.remove('active');
      }
    }
    
    // Sentence finished, wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Erase sentence
    for (let i = sentence.length; i >= 0; i--) {
      demoTextEl.textContent = sentence.substring(0, i);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async function startDemoLoop() {
    while (true) {
      await typeSentence(DEMO_SENTENCES[currentSentenceIdx]);
      currentSentenceIdx = (currentSentenceIdx + 1) % DEMO_SENTENCES.length;
    }
  }

  // Launch the background typing animation
  startDemoLoop();


  // --- MATH CAPTCHA ---
  const num1El = document.getElementById('captcha-num1');
  const num2El = document.getElementById('captcha-num2');
  const operatorEl = document.getElementById('captcha-operator');
  const captchaInput = document.getElementById('captcha-input');
  const refreshBtn = document.getElementById('captcha-refresh');
  
  let captchaAnswer = 0;

  function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 12) + 4; // 4 to 15
    const n2 = Math.floor(Math.random() * 9) + 1;  // 1 to 9
    const operators = ['+', '-'];
    const op = operators[Math.floor(Math.random() * operators.length)];

    num1El.textContent = n1;
    num2El.textContent = n2;
    operatorEl.textContent = op;

    if (op === '+') {
      captchaAnswer = n1 + n2;
    } else {
      captchaAnswer = n1 - n2;
    }
    
    // Clear previous input
    captchaInput.value = "";
  }

  // Initialize and bind captcha
  generateCaptcha();
  refreshBtn.addEventListener('click', generateCaptcha);


  // --- FORM VALIDATION & FIRESTORE SAVE ---
  const form = document.getElementById('signin-form');
  const nameInput = document.getElementById('full-name');
  const ageInput = document.getElementById('age');
  const emailInput = document.getElementById('email');
  const goalSelect = document.getElementById('typing-goal');
  const levelSelect = document.getElementById('typing-level');
  const generalAlert = document.getElementById('general-error-alert');
  const submitBtn = document.getElementById('submit-btn');

  // Utility to clear styling/errors
  function clearErrors() {
    generalAlert.style.display = 'none';
    document.querySelectorAll('.input-group').forEach(group => {
      group.classList.remove('invalid');
    });
    document.querySelectorAll('.validation-message').forEach(span => {
      span.textContent = "";
    });
  }

  // Utility to set field error
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

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;

    // 1. Name validation
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
      setError(nameInput, "Full Name is required.");
      isValid = false;
    }

    // 2. Age validation (must be greater than 5)
    const ageVal = parseInt(ageInput.value, 10);
    if (isNaN(ageVal)) {
      setError(ageInput, "Age is required.");
      isValid = false;
    } else if (ageVal <= 5) {
      setError(ageInput, "Age must be greater than 5.");
      isValid = false;
    }

    // 3. Email validation
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      setError(emailInput, "Email Address is required.");
      isValid = false;
    } else if (!emailRegex.test(emailVal)) {
      setError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    // 4. Typing Goal validation
    const goalVal = goalSelect.value;
    if (!goalVal) {
      setError(goalSelect, "Please choose a typing goal.");
      isValid = false;
    }

    // 5. Typing Level validation
    const levelVal = levelSelect.value;
    if (!levelVal) {
      setError(levelSelect, "Please choose a typing level.");
      isValid = false;
    }

    // 6. CAPTCHA validation
    const captchaVal = parseInt(captchaInput.value, 10);
    if (isNaN(captchaVal)) {
      setError(captchaInput, "Please enter the math check answer.");
      isValid = false;
    } else if (captchaVal !== captchaAnswer) {
      setError(captchaInput, `Incorrect answer. Try again!`);
      isValid = false;
      generateCaptcha(); // regenerate on fail
    }

    if (!isValid) {
      generalAlert.style.display = 'flex';
      generalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Session... ⏳";

    // Detect if Firebase configuration is placeholder
    const isFirebasePlaceholder = 
      typeof firebaseConfig === 'undefined' || 
      firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE") ||
      firebaseConfig.projectId.includes("YOUR_PROJECT_ID_HERE");

    if (isFirebasePlaceholder) {
      console.warn("TypeBuddy warning: Firebase keys are placeholder values. Operating in local simulation mode.");
      alert("⚠️ Firebase Configuration is incomplete! \n\nTypeBuddy will simulate saving your profile locally and allow you to proceed so you can review the typing website. Please configure actual keys in 'firebase-config.js' for persistent database storage.");
      
      // Save details locally and proceed
      saveSessionAndRedirect(nameVal, emailVal, goalVal, levelVal);
      return;
    }

    // Write to Firebase Firestore
    try {
      await db.collection("users").add({
        name: nameVal,
        age: ageVal,
        email: emailVal,
        goal: goalVal,
        level: levelVal,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("User successfully signed in and added to Firestore!");
      saveSessionAndRedirect(nameVal, emailVal, goalVal, levelVal);
    } catch (error) {
      console.error("Firestore Error:", error);
      submitBtn.disabled = false;
      submitBtn.textContent = "Start Learning! 🚀";
      
      alert(`❌ Database error: Unable to register user.\n\nDetails: ${error.message}\n\nPlease check your Firebase setup, network connection, or Firestore rules.`);
    }
  });

  function saveSessionAndRedirect(name, email, goal, level) {
    // Store user session details
    const sessionData = {
      name: name,
      email: email,
      goal: goal,
      level: level,
      signedInAt: new Date().toISOString()
    };
    localStorage.setItem('typebuddy_user_session', JSON.stringify(sessionData));
    
    // Redirect to home page
    window.location.href = "index.html";
  }
});
