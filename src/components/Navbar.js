import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        };
        checkLogin();
        window.addEventListener('storage', checkLogin);
        const interval = setInterval(checkLogin, 500);
        return () => {
            window.removeEventListener('storage', checkLogin);
            clearInterval(interval);
        };
    }, [location]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    <img src="/ChatGPT_Image_Feb_28__2026__04_05_07_PM-removebg-preview.png" alt="Logo" />
                    <span>BGMI<span className="text-accent">TOURNEY</span></span>
                </Link>

                {!isLoggedIn ? (
                    <div className="nav-links">
                        <Link to="/login" className={`nav-link ${isActive('/login')}`} title="Login">
                             Login
                        </Link>
                    </div>
                ) : (
                    <div className={`nav-links logged-in`}>
                        <Link to="/profile" className={`nav-link profile-icon ${isActive('/profile')}`} onClick={toggleMenu} title="My Profile">
                          <FaUserCircle />  
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
