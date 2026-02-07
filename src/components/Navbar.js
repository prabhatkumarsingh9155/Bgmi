import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css'; // We'll create this or just inline styles if simple
import { FaUserCircle } from "react-icons/fa";
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    }, [location]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        navigate('/');
        alert('Logged out successfully!');
    };

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    BGMI<span className="text-accent">TOURNEY</span>
                </Link>

                {!isLoggedIn ? (
                    // Show Login link when not logged in
                    <div className="nav-links">
                        <Link to="/login" className={`nav-link ${isActive('/login')}`} title="Login">
                             Login
                        </Link>
                    </div>
                ) : (
                    // Show icons when logged in
                    <div className={`nav-links logged-in`}>
                        <Link to="/profile" className={`nav-link profile-icon ${isActive('/profile')}`} onClick={toggleMenu} title="My Profile">
                          <FaUserCircle />  
                        </Link>
                       
                    </div>
                )}

                {/* Remove hamburger menu completely */}
            </div>
        </nav>
    );
};

export default Navbar;
