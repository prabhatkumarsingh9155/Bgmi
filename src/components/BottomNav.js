import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaTrophy, FaUsers, FaUser } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = localStorage.getItem('userEmail');
    const [showTeams, setShowTeams] = useState(true);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.showAllTeamsEnabled !== undefined) {
                    setShowTeams(data.showAllTeamsEnabled);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Hide on admin pages
    if (location.pathname.startsWith('/admin')) return null;

    const allNavItems = [
        { path: '/', icon: <FaHome />, label: 'Home', alwaysShow: true },
        { path: '/tournament-info', icon: <FaTrophy />, label: 'Info', alwaysShow: true },
        { path: '/teams', icon: <FaUsers />, label: 'Teams', alwaysShow: false, show: showTeams },
        isLoggedIn
            ? { path: '/profile', icon: <FaUser />, label: 'Profile', alwaysShow: true }
            : { path: '/login', icon: <FaUser />, label: 'Login', alwaysShow: true }
    ];

    const navItems = allNavItems.filter(item => item.alwaysShow || item.show);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
