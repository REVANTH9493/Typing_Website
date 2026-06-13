// Firebase Configuration for TypeBuddy
// ===================================
// Replace the placeholder values below with your actual Firebase project settings.
// 
// To get these keys:
// 1. Go to the Firebase Console (https://console.firebase.google.com/).
// 2. Click "Add project" and follow the steps to create a new project.
// 3. Once created, click on the Web icon (</>) to register a new Web App.
// 4. Copy the generated `firebaseConfig` object and replace the details below.
// 5. In the Firebase console sidebar, go to Build > Firestore Database and click "Create database".
// 6. Start in "Test mode" (for development) or configure security rules to allow writes.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID_HERE.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_PROJECT_ID_HERE.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

// Initialize Firebase App if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get reference to Firestore Database
const db = firebase.firestore();
