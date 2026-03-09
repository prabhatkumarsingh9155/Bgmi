import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWhatsapp, FaInstagram, FaTrophy, FaUsers, FaGamepad } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Announcements from '../components/Announcements';
import './Home-new.css';

const Home = () => {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasRoomDetails, setHasRoomDetails] = useState(false);
    const [teams, setTeams] = useState([]);
    const [pointsData, setPointsData] = useState([]);
    const [seasonInfo, setSeasonInfo] = useState({ seasonNumber: 'Loading...', seasonStatus: '' });
    const [homeData, setHomeData] = useState({
        heroDescription: 'Join the ultimate BGMI showdown. Register your squad and dominate the leaderboard.',
        teamsCount: '100+',
        prizePool: '₹50K',
        statusLabel: 'Live'
    });
    const [isSquadRegistrationOpen, setIsSquadRegistrationOpen] = useState(true);
    const [finalTeams, setFinalTeams] = useState([]);
    const [showAllTeams, setShowAllTeams] = useState(true);
    const [showFinalTeams, setShowFinalTeams] = useState(false);

    // Debug log
    console.log('Current Squad Registration Status:', isSquadRegistrationOpen);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.bgmi) {
                    try {
                        const teamsData = JSON.parse(data.bgmi);
                        setTeams(teamsData.filter(t => !t.deleted));
                    } catch (e) { }
                }

                if (data.pointsTable) {
                    try {
                        const seasons = JSON.parse(data.pointsTable);
                        const teamStats = {};

                        seasons.forEach(season => {
                            if (!season.days) return;
                            Object.values(season.days).forEach(dayData => {
                                // 1. Process structured data (Group A/B/Finals)
                                ['groupA', 'groupB', 'finals'].forEach(groupKey => {
                                    const groupMatches = dayData[groupKey];
                                    if (groupMatches) {
                                        Object.values(groupMatches).forEach(matchTeams => {
                                            if (Array.isArray(matchTeams)) {
                                                matchTeams.forEach(team => {
                                                    if (!team.teamName) return;
                                                    if (!teamStats[team.teamName]) {
                                                        teamStats[team.teamName] = { teamName: team.teamName, totalPoints: 0, totalKills: 0, totalWins: 0 };
                                                    }
                                                    teamStats[team.teamName].totalPoints += (parseInt(team.totalPoints) || 0);
                                                    teamStats[team.teamName].totalKills += (parseInt(team.killPoints) || 0);
                                                    teamStats[team.teamName].totalWins += (parseInt(team.wwcd) || 0);
                                                });
                                            }
                                        });
                                    }
                                });

                                // 2. Process legacy/standard path data (where match1-6 is directly under day)
                                ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'].forEach(mKey => {
                                    const matchTeams = dayData[mKey];
                                    if (Array.isArray(matchTeams)) {
                                        matchTeams.forEach(team => {
                                            if (!team.teamName) return;
                                            if (!teamStats[team.teamName]) {
                                                teamStats[team.teamName] = { teamName: team.teamName, totalPoints: 0, totalKills: 0, totalWins: 0 };
                                            }
                                            // Only add if not already counted in structured data (prevent double count if someone used both)
                                            // Usually, data is in either groupA/B OR in the match key directly
                                            teamStats[team.teamName].totalPoints += (parseInt(team.totalPoints) || 0);
                                            teamStats[team.teamName].totalKills += (parseInt(team.killPoints) || 0);
                                            teamStats[team.teamName].totalWins += (parseInt(team.wwcd) || 0);
                                        });
                                    }
                                });
                            });
                        });

                        const sorted = Object.values(teamStats).sort((a, b) => {
                            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                            return b.totalKills - a.totalKills;
                        });

                        setPointsData(sorted);
                    } catch (e) {
                        console.error("Error calculating leaderboard on home:", e);
                    }
                }

                if (data.tournamentInfo) {
                    try {
                        const info = JSON.parse(data.tournamentInfo);
                        console.log('Tournament Info from Firebase:', info);
                        setSeasonInfo({
                            seasonNumber: info.tournamentName || 'SEASON 1',
                            seasonStatus: info.tournamentStatus || 'LIVE'
                        });
                        setHomeData({
                            heroDescription: info.heroDescription || 'Join the ultimate BGMI showdown. Register your squad and dominate the leaderboard.',
                            teamsCount: info.teamsCount || '100+',
                            prizePool: info.prizePool || '₹50K',
                            statusLabel: info.statusLabel || 'Live',
                            whatsappLink: info.whatsappLink || 'https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK',
                            instagramLink: info.instagramLink || 'https://instagram.com/YOUR_INSTAGRAM_ID'
                        });
                    } catch (e) {
                        console.error('Error parsing tournamentInfo:', e);
                        setSeasonInfo({ seasonNumber: 'SEASON 1', seasonStatus: 'LIVE' });
                    }
                } else {
                    setSeasonInfo({ seasonNumber: 'SEASON 1', seasonStatus: 'LIVE' });
                }

                // Load Squad Registration status from Firebase
                if (data.squadRegistrationEnabled !== undefined) {
                    setIsSquadRegistrationOpen(data.squadRegistrationEnabled);
                    console.log('Squad Registration Status:', data.squadRegistrationEnabled);
                } else {
                    setIsSquadRegistrationOpen(true); // Default to open
                }

                // Load Final Teams
                if (data.finalTeamsData) {
                    try {
                        setFinalTeams(JSON.parse(data.finalTeamsData));
                    } catch (e) { }
                }

                // Load Show All Teams toggle
                if (data.showAllTeamsEnabled !== undefined) {
                    setShowAllTeams(data.showAllTeamsEnabled);
                }

                // Load Show Final Teams toggle
                if (data.showFinalTeamsEnabled !== undefined) {
                    setShowFinalTeams(data.showFinalTeamsEnabled);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const checkLoginStatus = () => {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        };

        checkLoginStatus();

        window.addEventListener('storage', checkLoginStatus);
        window.addEventListener('focus', checkLoginStatus);

        const interval = setInterval(checkLoginStatus, 500);

        return () => {
            window.removeEventListener('storage', checkLoginStatus);
            window.removeEventListener('focus', checkLoginStatus);
            clearInterval(interval);
        };
    }, [location]);

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
                    <div className="hero-badge">🔥 {seasonInfo.seasonNumber} {seasonInfo.seasonStatus}</div>

                    <h1 className="hero-title">
                        <span className="title-line">BATTLEGROUND</span>
                        <span className="title-line title-accent">MOBILE INDIA</span>
                    </h1>

                    <div className="hero-subtitle">
                        <FaTrophy className="subtitle-icon" />
                        <span>{seasonInfo.seasonNumber}</span>
                    </div>

                    <p className="hero-description">
                        {homeData.heroDescription}
                        <span className="highlight-text"> Free entry. Huge rewards.</span>
                    </p>

                    <div className="stats-row">
                        <div className="stat-item">
                            <FaUsers />
                            <div>
                                <div className="stat-number">{homeData.teamsCount}</div>
                                <div className="stat-label">Teams</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <FaTrophy />
                            <div>
                                <div className="stat-number">{homeData.prizePool}</div>
                                <div className="stat-label">Prize Pool</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <FaGamepad />
                            <div>
                                <div className="stat-number">{homeData.statusLabel}</div>
                                <div className="stat-label">Status</div>
                            </div>
                        </div>
                    </div>

                    {!isLoggedIn ? (
                        <div className="hero-cta">
                            {isSquadRegistrationOpen ? (
                                <Link to="/register" className="btn-hero-primary">
                                    <span>Register Squad</span>
                                    <span className="btn-arrow">→</span>
                                </Link>
                            ) : (
                                <button
                                    className="btn-hero-primary"
                                    style={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                        background: '#666',
                                        pointerEvents: 'none'
                                    }}
                                    disabled
                                >
                                    <span>Registration Closed</span>
                                </button>
                            )}
                            <Link to="/tournament-info" className="btn-hero-secondary">Tournament Info</Link>
                        </div>
                    ) : (
                        <div className="hero-cta">
                            <Link to="/profile" className="btn-hero-primary">
                                <span>My Team</span>
                                <span className="btn-arrow">→</span>
                            </Link>
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
                            href={homeData.whatsappLink}
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
                            href={homeData.instagramLink}
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

            <section className="leaderboard-section" style={{ padding: '80px 0', background: 'rgba(255, 170, 0, 0.05)' }}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
                        🏆 Tournament Standings
                    </h2>

                    {/* Navigation Boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto 2rem' }}>
                        <Link
                            to="/seasons"
                            style={{
                                display: 'block',
                                padding: '1.5rem',
                                background: 'rgba(255, 170, 0, 0.2)',
                                border: '2px solid var(--accent-color)',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.3s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 170, 0, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 170, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 170, 0, 0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.3rem' }}>📊 Seasonal Standings</h3>
                                <span style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>→</span>
                            </div>
                        </Link>

                        <Link
                            to="/leaderboard"
                            style={{
                                display: 'block',
                                padding: '1.5rem',
                                background: 'rgba(255, 170, 0, 0.2)',
                                border: '2px solid var(--accent-color)',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.3s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 170, 0, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 170, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 170, 0, 0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.3rem' }}>🏆 Full Leaderboard</h3>
                                <span style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>→</span>
                            </div>
                        </Link>
                    </div>

                    {/* Teams */}
                    {showAllTeams && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <Link
                                to="/teams"
                                style={{
                                    display: 'block',
                                    padding: '1.5rem',
                                    background: 'rgba(255, 170, 0, 0.2)',
                                    border: '2px solid var(--accent-color)',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 170, 0, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 170, 0, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 170, 0, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.5rem', marginBottom: '0.3rem' }}>👥 View All Teams</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>{teams.length} Teams Registered</p>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>→</span>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Final Teams */}
                    {showFinalTeams && (
                        <div style={{ maxWidth: '1000px', margin: showAllTeams ? '2rem auto 0' : '0 auto' }}>
                            <Link
                                to="/final-teams"
                                style={{
                                    display: 'block',
                                    padding: '1.5rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '2px solid #10b981',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem', marginBottom: '0.3rem' }}>🏆 View Final Teams</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>{finalTeams.length} Teams Qualified</p>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', color: '#10b981' }}>→</span>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <section className="all-teams-section" style={{ padding: '80px 0', display: 'none' }}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
                        👥 All Registered Teams
                    </h2>
                    <Link
                        to="/teams"
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="card" style={{ maxWidth: '1200px', margin: '0 auto', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)', cursor: 'pointer', transition: 'all 0.3s', padding: '2rem' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 170, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ color: 'var(--accent-color)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>View All Teams</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{teams.length} Teams Registered</p>
                                </div>
                                <span style={{ fontSize: '2rem', color: 'var(--accent-color)' }}>→</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;