import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NotificationPopup from './components/NotificationPopup';
import InstallPrompt from './components/InstallPrompt';
import RoomDetailsPopup from './components/RoomDetailsPopup';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Registration from './pages/Registration';
import TournamentInfo from './pages/TournamentInfo';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditTeam from './pages/EditTeam';
import Teams from './pages/Teams';
import FinalTeams from './pages/FinalTeams';
import PointTable from './pages/PointTable';
import Leaderboard from './pages/Leaderboard';
import SeasonSelection from './pages/SeasonSelection';
import SeasonDetail from './pages/SeasonDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboardModern from './pages/AdminDashboardModern';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <NotificationPopup />}
      {!isAdminRoute && <RoomDetailsPopup />}
      <main style={{ minHeight: isAdminRoute ? '100vh' : '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/tournament-info" element={<TournamentInfo />} />
          <Route path="/point-table" element={<PointTable />} />
          <Route path="/seasons" element={<SeasonSelection />} />
          <Route path="/season/:seasonId" element={<SeasonDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-team" element={<ProtectedRoute><EditTeam /></ProtectedRoute>} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/final-teams" element={<FinalTeams />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboardModern />} />
        </Routes>
      </main>
      {!isAdminRoute && (
        <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <p>© 2024 BGMI Tournament System. Built with React & Firebase.</p>
        </footer>
      )}
      {!isAdminRoute && <BottomNav />}
      {!isAdminRoute && <InstallPrompt />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
