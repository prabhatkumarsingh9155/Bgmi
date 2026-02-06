# BGMI Tournament System

This is a complete Registration & Management System for BGMI Tournaments built with React JS and Firebase.

## Features
- **Player Registration**: Teams register with player details and logo. Auto-slot generation.
- **Admin Panel**: Dashboard to view teams, download CSV data, and send notifications.
- **Proof Upload**: Players verify their team (by Slot & Phone) and upload screenshots/videos.
- **Notifications**: Admin announcements appear on the Home page.
- **Gaming Theme**: Dark, professional UI.

## Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Authentication** (Sign-in method: Email/Password). Create an admin user manually.
4. Enable **Firestore Database** (Start in Test mode or Production mode).
5. Enable **Storage** (for images/videos).
6. Go to Project Settings -> General -> Your apps -> Web app. Copy the `firebaseConfig` object.

### 2. Configure Code
1. Open `src/firebase.js`.
2. Replace the `firebaseConfig` placeholder with your actual config from Firebase.

### 3. Install Dependencies
Run the following command in the project folder:
```bash
npm install
```

### 4. Run the App
```bash
npm start
```

### 5. Security Rules
Copy the contents of `firestore.rules` and `storage.rules` to your Firebase Console under the "Rules" tab for Firestore and Storage respectively.

## Admin Access
- Login at `/admin/login`.
- Use the email/password you created in Firebase Auth.
