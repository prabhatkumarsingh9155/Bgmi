import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import NotificationPopup from './components/NotificationPopup';
import RoomDetailsPopup from './components/RoomDetailsPopup';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Registration from './pages/Registration';
import TournamentInfo from './pages/TournamentInfo';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditTeam from './pages/EditTeam';
import Teams from './pages/Teams';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <NotificationPopup />
        <RoomDetailsPopup />
        <main style={{ minHeight: '80vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/tournament-info" element={<TournamentInfo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/edit-team" element={<ProtectedRoute><EditTeam /></ProtectedRoute>} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <p>© 2024 BGMI Tournament System. Built with React & Firebase.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
