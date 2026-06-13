# Firebase Firestore Setup Instructions for TypeBuddy

This document provides a step-by-step guide to setting up a Firebase project, configuring a Cloud Firestore database, and adding the required keys to run the TypeBuddy Sign In system.

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** (or **Add project** if you have existing ones).
3. Enter a project name, e.g., `typebuddy-app`, and click **Continue**.
4. Choose whether to enable Google Analytics (not required for this application) and click **Create project**.
5. Wait for the project setup to complete, and click **Continue**.

---

## Step 2: Configure a Cloud Firestore Database

1. In the left-hand sidebar of the Firebase Console, go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose your database location (select one closest to your target audience) and click **Next**.
4. Start in **Test mode** for quick developer testing:
   - This allows anyone to read/write data for a limited time (usually 30 days).
   - *For production production environments, see security rules details below.*
5. Click **Create** and wait for the database provisioning to complete.

---

## Step 3: Register a Web App & Retrieve Config Keys

1. Go to the project home page by clicking the **Project Overview** gear icon ⚙️ in the top-left sidebar and select **Project settings**.
2. Under the **General** tab, scroll down to the *Your apps* section.
3. Click the **Web** icon (looks like `</>`).
4. Enter an App nickname, e.g., `TypeBuddy Web`, and click **Register app**.
5. You will see a script block containing a `firebaseConfig` object. Copy only the parameters inside that object:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
6. Open the [firebase-config.js](file:///c:/Projects/Typing%20Website/Typing_Website/firebase-config.js) file in your TypeBuddy workspace.
7. Replace the placeholder config details with the actual keys you copied from the Firebase Console. Save the file.

---

## Step 4: Configure Firestore Security Rules (For Production)

If you start the database in **Test mode**, anyone with your config keys can modify your database. To secure your `users` collection for production, configure rules under the **Rules** tab in the Cloud Firestore console:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow writes to the users collection if the name, age, email, and level fields are present
    match /users/{userId} {
      allow create: if request.resource.data.name != "" 
                    && request.resource.data.age >= 14 
                    && request.resource.data.age <= 18
                    && request.resource.data.email.matches('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}')
                    && request.resource.data.goal != null
                    && request.resource.data.level != null;
      
      // Allow reading user counts or records if required, or disable read for absolute privacy
      allow read: if true; 
    }
  }
}
```

Click **Publish** after making adjustments.

---

## Step 5: Verification

1. Double-check that your `firebase-config.js` is saved.
2. Open `signin.html` in your browser.
3. Fill in the form with valid credentials (e.g. name, age between 14-18, correct email format, correct captcha, etc.) and submit.
4. If Firestore config is successful, you will be redirected to `index.html` and a new document will appear under the **users** collection in the Firebase Console Firestore viewer.
