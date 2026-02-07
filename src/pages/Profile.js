import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaUsers, FaEdit, FaInfoCircle, FaCheckCircle, FaClock, FaTimesCircle, FaSignOutAlt } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userEmail = localStorage.getItem('userEmail');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn || !userEmail) {
            navigate('/login');
            return;
        }
        
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        const teams = JSON.parse(currentData);
                        const userTeam = teams.find(team => team.captainEmail === userEmail);
                        
                        if (!userTeam) {
                            localStorage.removeItem('userEmail');
                            localStorage.removeItem('isLoggedIn');
                            navigate('/');
                            return;
                        }
                        
                        setTeamData(userTeam);
                    } catch (e) {
                        console.error('Error parsing team data:', e);
                    }
                }
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [navigate]);


    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        if (status === 'Approved') return <FaCheckCircle />;
        if (status === 'Rejected') return <FaTimesCircle />;
        return <FaClock />;
    };

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        navigate('/');
        alert('Logged out successfully!');
    };

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header">
                    <div className="profile-title">
                        <FaTrophy className="title-icon" />
                        <h1>My Profile</h1>
                    </div>
                </div>

                {teamData ? (
                    <>
                        <div className="team-banner">
                            <div className="banner-content">
                                <h2 className="team-name">{teamData.teamName}</h2>
                                <div className="team-slot">Slot {teamData.slotNumber ? `#${teamData.slotNumber}` : 'Pending'}</div>
                            </div>
                            <div className={`status-badge status-${(teamData.status || 'Pending').toLowerCase()}`}>
                                {getStatusIcon(teamData.status)}
                                <span>{teamData.status || 'Pending'}</span>
                            </div>
                        </div>

                        <div className="profile-grid">
                            <div className="info-card">
                                <div className="card-header">
                                    <FaUsers className="card-icon" />
                                    <h3>Captain Details</h3>
                                </div>
                                <div className="info-list">
                                    <div className="info-item">
                                        <span className="label">Name</span>
                                        <span className="value">{teamData.captainName}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">WhatsApp</span>
                                        <span className="value">{teamData.captainWhatsapp}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Email</span>
                                        <span className="value email">{teamData.captainEmail}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Registered</span>
                                        <span className="value">{new Date(teamData.registrationDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="card-header">
                                    <FaUsers className="card-icon" />
                                    <h3>Squad Members</h3>
                                </div>
                                <div className="players-list">
                                    <div className="player-item">
                                        <div className="player-number">1</div>
                                        <div className="player-info">
                                            <div className="player-name">{teamData.player1Name}</div>
                                            <div className="player-id">ID: {teamData.player1Id}</div>
                                        </div>
                                    </div>
                                    <div className="player-item">
                                        <div className="player-number">2</div>
                                        <div className="player-info">
                                            <div className="player-name">{teamData.player2Name}</div>
                                            <div className="player-id">ID: {teamData.player2Id}</div>
                                        </div>
                                    </div>
                                    <div className="player-item">
                                        <div className="player-number">3</div>
                                        <div className="player-info">
                                            <div className="player-name">{teamData.player3Name}</div>
                                            <div className="player-id">ID: {teamData.player3Id}</div>
                                        </div>
                                    </div>
                                    <div className="player-item">
                                        <div className="player-number">4</div>
                                        <div className="player-info">
                                            <div className="player-name">{teamData.player4Name}</div>
                                            <div className="player-id">ID: {teamData.player4Id}</div>
                                        </div>
                                    </div>
                                    {teamData.substituteName && (
                                        <div className="player-item substitute">
                                            <div className="player-number">S</div>
                                            <div className="player-info">
                                                <div className="player-name">{teamData.substituteName}</div>
                                                <div className="player-id">ID: {teamData.substituteId}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button onClick={() => navigate('/edit-team')} className="btn-action btn-edit">
                                <FaEdit />
                                <span>Edit Team Info</span>
                            </button>
                            <button onClick={() => navigate('/tournament-info')} className="btn-action btn-info">
                                <FaInfoCircle />
                                <span>Tournament Info</span>
                            </button>
                            <button onClick={handleLogout} className="btn-action btn-logout">
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-team-card">
                        <div className="no-team-icon">🎮</div>
                        <h3>No Team Registered</h3>
                        <p>You haven't registered a team yet. Join the tournament now!</p>
                        <button onClick={() => navigate('/register')} className="btn-register">
                            <span>Register Your Team</span>
                            <span className="btn-arrow">→</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;