import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaInstagram, FaTrophy, FaUsers, FaGamepad } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Announcements from '../components/Announcements';
import '../index.css';
import './Home.css';

const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasRoomDetails, setHasRoomDetails] = useState(false);

    useEffect(() => {
        const checkLoginStatus = () => {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        };
        
        checkLoginStatus();
        
        window.addEventListener('storage', checkLoginStatus);
        
        const interval = setInterval(checkLoginStatus, 500);
        
        return () => {
            window.removeEventListener('storage', checkLoginStatus);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setHasRoomDetails(false);
            return;
        }

        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data) {
                    try {
                        const parsedData = JSON.parse(data);
                        let hasRooms = false;
                        
                        (parsedData.rounds || []).forEach(round => {
                            (round.days || []).forEach(day => {
                                (day.matchTimes || []).forEach(match => {
                                    if (match.roomId && match.password) {
                                        hasRooms = true;
                                    }
                                });
                            });
                        });
                        
                        setHasRoomDetails(hasRooms);
                    } catch (e) {
                        setHasRoomDetails(false);
                    }
                } else {
                    setHasRoomDetails(false);
                }
            }
        });
        
        return () => unsubscribe();
    }, [isLoggedIn]);

    return (
        <div className="home-page">
            <div className="hero-bg-animation"></div>
            
            <section className="hero-section" style={{ marginTop: hasRoomDetails ? '50px' : '0' }}>
                <div className="container">
                    <div className="hero-badge">🔥 SEASON 1 LIVE</div>
                    
                    <h1 className="hero-title">
                        <span className="title-line">BATTLEGROUNDS</span>
                        <span className="title-line title-accent">MOBILE INDIA</span>
                    </h1>
                    
                    <div className="hero-subtitle">
                        <FaTrophy className="subtitle-icon" />
                        <span>TOURNAMENT SEASON 1</span>
                    </div>
                    
                    <p className="hero-description">
                        Join the ultimate BGMI showdown. Register your squad and dominate the leaderboard.
                        <span className="highlight-text"> Free entry. Huge rewards.</span>
                    </p>
                    
                    <div className="stats-row">
                        <div className="stat-item">
                            <FaUsers />
                            <div>
                                <div className="stat-number">100+</div>
                                <div className="stat-label">Teams</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <FaTrophy />
                            <div>
                                <div className="stat-number">₹50K</div>
                                <div className="stat-label">Prize Pool</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <FaGamepad />
                            <div>
                                <div className="stat-number">Live</div>
                                <div className="stat-label">Status</div>
                            </div>
                        </div>
                    </div>

                    {!isLoggedIn ? (
                        <div className="hero-cta">
                            <Link to="/register" className="btn-hero-primary">
                                <span>Register Squad</span>
                                <span className="btn-arrow">→</span>
                            </Link>
                            <Link to="/teams" className="btn-hero-secondary">View Teams</Link>
                        </div>
                    ) : (
                        <div className="hero-cta">
                            <Link to="/profile" className="btn-hero-primary">
                                <span>My Team</span>
                                <span className="btn-arrow">→</span>
                            </Link>
                            <Link to="/teams" className="btn-hero-secondary">All Teams</Link>
                            <Link to="/tournament-info" className="btn-hero-secondary">Tournament Info</Link>
                        </div>
                    )}
                </div>
            </section>

            <Announcements />

            <section className="community-section">
                <div className="container">
                    <h3 className="section-title">Join Our Community</h3>
                    <div className="social-links">
                        <a 
                            href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="social-card whatsapp"
                        >
                            <FaWhatsapp className="social-icon" />
                            <div className="social-content">
                                <h4>WhatsApp Group</h4>
                                <p>Join for updates & discussions</p>
                            </div>
                        </a>
                        <a 
                            href="https://instagram.com/YOUR_INSTAGRAM_ID" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="social-card instagram"
                        >
                            <FaInstagram className="social-icon" />
                            <div className="social-content">
                                <h4>Instagram</h4>
                                <p>Follow for highlights & news</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="container">
                    <div className="features-grid">
                        {!isLoggedIn ? (
                            <>
                                <div className="feature-card">
                                    <div className="feature-number">01</div>
                                    <div className="feature-icon">📝</div>
                                    <h3>Register</h3>
                                    <p>Fill in your team details and captain info. Get your unique slot number instantly.</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-number">02</div>
                                    <div className="feature-icon">⚔️</div>
                                    <h3>Compete</h3>
                                    <p>Check match schedules, room ID/Pass, and fight for the top spot.</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-number">03</div>
                                    <div className="feature-icon">🏆</div>
                                    <h3>Win Prizes</h3>
                                    <p>Dominate the leaderboard and claim your share of the prize pool.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="feature-card">
                                    <div className="feature-icon">🎮</div>
                                    <h3>Gaming Hub</h3>
                                    <p>Access your team profile, check match schedules, and stay updated with tournament progress.</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">🏆</div>
                                    <h3>Tournament</h3>
                                    <p>View prize pool, match timings, and compete with other registered teams for victory.</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">📊</div>
                                    <h3>Leaderboard</h3>
                                    <p>Track your team's performance and see how you rank against other squads.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;