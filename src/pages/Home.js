import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import Announcements from '../components/Announcements';
import '../index.css';

const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    }, []);
    return (
        <div className="home-page">
            <section className="hero-section" style={{
                textAlign: 'center',
                background: 'radial-gradient(circle at center, rgba(255, 170, 0, 0.1) 0%, transparent 70%)',
                padding: 'clamp(40px, 8vw, 80px) 20px'
            }}>
                <div className="container">
                    <h1 className="heading-glitch" style={{ 
                        marginBottom: '20px',
                        fontSize: 'clamp(2rem, 8vw, 4rem)'
                    }}>
                        BATTLEGROUNDS
                    </h1>
                    <h2 style={{ 
                        fontSize: 'clamp(1.2rem, 4vw, 2rem)', 
                        marginBottom: '30px', 
                        color: 'var(--text-secondary)' 
                    }}>
                        TOURNAMENT SEASON 1
                    </h2>
                    <p style={{ 
                        maxWidth: '600px', 
                        margin: '0 auto 40px', 
                        color: 'var(--text-muted)',
                        fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                        padding: '0 15px'
                    }}>
                        Join the ultimate BGMI showdown. Register your squad and dominate the leaderboard.
                        Free entry. Huge rewards.
                    </p>

                    {!isLoggedIn ? (
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 15px' }}>
                            <Link to="/register" className="btn-primary" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Register Squad</Link>
                            <Link to="/teams" className="btn-secondary" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>View Teams</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 15px' }}>
                            <Link to="/profile" className="btn-primary" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>My Team</Link>
                            <Link to="/teams" className="btn-secondary" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>All Teams</Link>
                            <Link to="/tournament-info" className="btn-secondary" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Tournament Info</Link>
                        </div>
                    )}
                </div>
            </section>

            <Announcements />

            <section className="container" style={{ 
                textAlign: 'center', 
                padding: 'clamp(30px, 6vw, 50px) 20px' 
            }}>
                <h3 style={{ 
                    marginBottom: 'clamp(20px, 4vw, 30px)', 
                    color: 'var(--accent-color)',
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)'
                }}>Join Our Community</h3>
                <div style={{ 
                    display: 'flex', 
                    gap: 'clamp(15px, 3vw, 20px)', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap',
                    padding: '0 15px'
                }}>
                    <a 
                        href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px)'
                        }}
                    >
                        <FaWhatsapp style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }} />
                        WhatsApp Group
                    </a>
                    <a 
                        href="https://instagram.com/YOUR_INSTAGRAM_ID" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px)'
                        }}
                    >
                        <FaInstagram style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }} />
                        Instagram
                    </a>
                </div>
            </section>

            <section className="features-section container" style={{ padding: 'clamp(30px, 6vw, 50px) 20px' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
                    gap: 'clamp(20px, 4vw, 30px)' 
                }}>
                    {!isLoggedIn ? (
                        <>
                            <div className="card">
                                <h3 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '15px',
                                    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)'
                                }}>01. Register</h3>
                                <p style={{ 
                                    color: 'var(--text-secondary)',
                                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                                }}>
                                    Fill in your team details and captain info. Get your unique slot number instantly.
                                </p>
                            </div>
                            <div className="card">
                                <h3 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '15px',
                                    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)'
                                }}>02. Compete</h3>
                                <p style={{ 
                                    color: 'var(--text-secondary)',
                                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                                }}>
                                    Check match schedules, room ID/Pass, and fight for the top spot.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="card">
                                <h3 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '15px',
                                    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)'
                                }}>🎮 Gaming Hub</h3>
                                <p style={{ 
                                    color: 'var(--text-secondary)',
                                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                                }}>
                                    Access your team profile, check match schedules, and stay updated with tournament progress.
                                </p>
                            </div>
                            <div className="card">
                                <h3 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '15px',
                                    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)'
                                }}>🏆 Tournament</h3>
                                <p style={{ 
                                    color: 'var(--text-secondary)',
                                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                                }}>
                                    View prize pool, match timings, and compete with other registered teams for victory.
                                </p>
                            </div>
                            <div className="card">
                                <h3 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '15px',
                                    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)'
                                }}>📊 Leaderboard</h3>
                                <p style={{ 
                                    color: 'var(--text-secondary)',
                                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                                }}>
                                    Track your team's performance and see how you rank against other squads.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
