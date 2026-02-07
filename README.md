# BGMI Tournament Management System

A modern, full-stack tournament management platform for BGMI (Battlegrounds Mobile India) esports competitions.

## Features

- **User Registration**: Team registration with captain and player details
- **Admin Dashboard**: Comprehensive admin panel for managing teams, notifications, and tournament info
- **Real-time Updates**: Live data synchronization using Firebase
- **Tournament Info**: Display prize pools, match schedules, and rules
- **Profile Management**: User profiles with team information and status
- **Responsive Design**: Fully responsive UI for all devices

## Tech Stack

- React.js
- Firebase (Authentication & Firestore)
- React Router
- React Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project
   - Add your Firebase config to `src/firebase.js`

4. Start the development server:
   ```bash
   npm start
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `/src/pages` - Main application pages
- `/src/components` - Reusable components
- `/src/firebase.js` - Firebase configuration

## Admin Access

Access the admin dashboard at `/admin/login`

## License

MIT License
