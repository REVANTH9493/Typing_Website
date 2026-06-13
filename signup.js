// TypeBuddy Sign In Logic

document.addEventListener('DOMContentLoaded', () => {
  // Seed default admin account
  const defaultAdmins = [
    { email: 'revanth@gmail.com', password: 'Revanth@123' }
  ];
  if (!localStorage.getItem('typebuddy_admin_accounts')) {
    localStorage.setItem('typebuddy_admin_accounts', JSON.stringify(defaultAdmins));
  }

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





  // --- FORM VALIDATION & FIRESTORE SAVE ---
  const form = document.getElementById('signin-form');
  const nameInput = document.getElementById('full-name');
  const ageInput = document.getElementById('age');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
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

  // Real-time Name checking (must be unique)
  let nameCheckTimeout;
  nameInput.addEventListener('input', () => {
    const nameVal = nameInput.value.trim();
    
    // Clear validation styling
    const group = nameInput.closest('.input-group');
    if (group) {
      group.classList.remove('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) errorSpan.textContent = "";
    }
    
    if (!nameVal) return;
    
    // 1. Check local registry instantly
    const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
    const nameExists = registeredUsers.some(u => u.name.trim().toLowerCase() === nameVal.toLowerCase());
    if (nameExists) {
      setError(nameInput, "Username already exists. Please choose a different name.");
      return;
    }
    
    // 2. Debounced check in Firestore (if active)
    clearTimeout(nameCheckTimeout);
    const isFirebasePlaceholder = 
      typeof firebaseConfig === 'undefined' || 
      firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE") ||
      firebaseConfig.projectId.includes("YOUR_PROJECT_ID_HERE");
      
    if (!isFirebasePlaceholder) {
      nameCheckTimeout = setTimeout(async () => {
        try {
          const userQuery = await db.collection("users").where("name", "==", nameVal).get();
          if (!userQuery.empty) {
            setError(nameInput, "Username already exists. Please choose a different name.");
          }
        } catch (err) {
          console.error("Firestore query error:", err);
        }
      }, 500);
    }
  });

  // Real-time Email checking (must be unique)
  let emailCheckTimeout;
  emailInput.addEventListener('input', () => {
    const emailVal = emailInput.value.trim();
    
    // Clear validation styling
    const group = emailInput.closest('.input-group');
    if (group) {
      group.classList.remove('invalid');
      const errorSpan = group.querySelector('.validation-message');
      if (errorSpan) errorSpan.textContent = "";
    }
    
    if (!emailVal) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setError(emailInput, "Please enter a valid email address.");
      return;
    }
    
    // 1. Check local registry instantly
    const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
    const emailExists = registeredUsers.some(u => u.email.trim().toLowerCase() === emailVal.toLowerCase());
    if (emailExists) {
      setError(emailInput, "Email address is already registered. Please use a different email.");
      return;
    }
    
    // 2. Debounced check in Firestore (if active)
    clearTimeout(emailCheckTimeout);
    const isFirebasePlaceholder = 
      typeof firebaseConfig === 'undefined' || 
      firebaseConfig.apiKey.includes("YOUR_API_KEY_HERE") ||
      firebaseConfig.projectId.includes("YOUR_PROJECT_ID_HERE");
      
    if (!isFirebasePlaceholder) {
      emailCheckTimeout = setTimeout(async () => {
        try {
          const emailQuery = await db.collection("users").where("email", "==", emailVal).get();
          if (!emailQuery.empty) {
            setError(emailInput, "Email address is already registered. Please use a different email.");
          }
        } catch (err) {
          console.error("Firestore query error:", err);
        }
      }, 500);
    }
  });

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;

    // 1. Name validation (must be unique)
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
      setError(nameInput, "Full Name is required.");
      isValid = false;
    } else {
      const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
      const nameExists = registeredUsers.some(u => u.name.trim().toLowerCase() === nameVal.toLowerCase());
      if (nameExists) {
        setError(nameInput, "Username already exists. Please choose a different name.");
        isValid = false;
      }
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

    // 3. Email validation (must be unique)
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      setError(emailInput, "Email Address is required.");
      isValid = false;
    } else if (!emailRegex.test(emailVal)) {
      setError(emailInput, "Please enter a valid email address.");
      isValid = false;
    } else {
      const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
      const emailExists = registeredUsers.some(u => u.email.trim().toLowerCase() === emailVal.toLowerCase());
      if (emailExists) {
        setError(emailInput, "Email address is already registered. Please use a different email.");
        isValid = false;
      }
    }

    // 3b. Password validation
    const passwordVal = passwordInput.value;
    if (!passwordVal) {
      setError(passwordInput, "Password is required.");
      isValid = false;
    } else if (passwordVal.length < 6) {
      setError(passwordInput, "Password must be at least 6 characters.");
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
      
      // Save details locally and proceed
      saveSessionAndRedirect(nameVal, emailVal, passwordVal, goalVal, levelVal);
      return;
    }

    // Write to Firebase Firestore
    try {
      // Check if username already exists in Firestore
      const userQuery = await db.collection("users").where("name", "==", nameVal).get();
      if (!userQuery.empty) {
        setError(nameInput, "Username already exists. Please choose a different name.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Start Learning! 🚀";
        generalAlert.style.display = 'flex';
        generalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      // Check if email already exists in Firestore
      const emailQuery = await db.collection("users").where("email", "==", emailVal).get();
      if (!emailQuery.empty) {
        setError(emailInput, "Email address is already registered. Please use a different email.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Start Learning! 🚀";
        generalAlert.style.display = 'flex';
        generalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      await db.collection("users").add({
        name: nameVal,
        age: ageVal,
        email: emailVal,
        password: passwordVal,
        goal: goalVal,
        level: levelVal,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("User successfully signed in and added to Firestore!");
      saveSessionAndRedirect(nameVal, emailVal, passwordVal, goalVal, levelVal);
    } catch (error) {
      console.error("Firestore Error:", error);
      submitBtn.disabled = false;
      submitBtn.textContent = "Start Learning! 🚀";
      
      alert(`❌ Database error: Unable to register user.\n\nDetails: ${error.message}\n\nPlease check your Firebase setup, network connection, or Firestore rules.`);
    }
  });

  function saveSessionAndRedirect(name, email, password, goal, level) {
    // Save to local registry of users so Sign In page can look up their goal/level
    const registeredUsers = JSON.parse(localStorage.getItem('typebuddy_registered_users') || '[]');
    const existingIndex = registeredUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    const userData = { name, email, password, goal, level, registeredAt: new Date().toISOString() };
    if (existingIndex > -1) {
      registeredUsers[existingIndex] = userData;
    } else {
      registeredUsers.push(userData);
    }
    localStorage.setItem('typebuddy_registered_users', JSON.stringify(registeredUsers));
    
    // Redirect to signin page to complete the Sign Up -> Sign In -> Index flow
    window.location.href = `signin.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&newuser=true`;
  }
});
