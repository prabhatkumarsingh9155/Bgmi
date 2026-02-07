import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { FaTrophy, FaCalendarAlt, FaGamepad, FaUsers, FaTimesCircle } from 'react-icons/fa';
import './TournamentInfo.css';

const TournamentInfo = () => {
    const navigate = useNavigate();
    const [tournamentData, setTournamentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roomDetails, setRoomDetails] = useState([]);
    const [showRoomPopup, setShowRoomPopup] = useState(false);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data && data !== "") {
                    try {
                        const parsedData = JSON.parse(data);
                        setTournamentData(parsedData);
                        
                        const matchesWithRooms = [];
                        (parsedData.rounds || []).forEach(round => {
                            (round.days || []).forEach((day, dayIndex) => {
                                (day.matchTimes || []).forEach(match => {
                                    if (match.roomId && match.password) {
                                        matchesWithRooms.push({
                                            matchName: `${round.roundTitle} - Day ${dayIndex + 1} - ${match.matchNumber}`,
                                            roomId: match.roomId,
                                            password: match.password,
                                            time: match.time
                                        });
                                    }
                                });
                            });
                        });
                        
                        setRoomDetails(matchesWithRooms);
                    } catch (e) {
                        setTournamentData(getDefaultData());
                    }
                } else {
                    setTournamentData(getDefaultData());
                }
            } else {
                setTournamentData(getDefaultData());
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const getDefaultData = () => ({
        firstPrize: '₹30,000',
        secondPrize: '₹15,000',
        thirdPrize: '₹5,000',
        mvpPrize: '₹3,000',
        totalMatches: '8',
        registrationFee: 'FREE',
        feeDescription: 'No entry fee required! Just register and play.',
        rules: [
            '✅ Squad format (4 players + 1 substitute)',
            '✅ No emulator players allowed',
            '✅ Screen recording mandatory during matches',
            '✅ Fair play policy - no cheating/hacking',
            '✅ Room ID and password will be shared 30 minutes before match',
            '✅ Late entries will be disqualified'
        ],
        rounds: [
            {
                roundTitle: '🎯 Qualifier Round',
                days: [
                    { 
                        date: 'February 10, 2026', 
                        format: 'Classic Mode', 
                        map: 'Erangel',
                        matchTimes: [
                            { time: '6:00 PM IST', matchNumber: 'Match 1' },
                            { time: '7:00 PM IST', matchNumber: 'Match 2' },
                            { time: '8:00 PM IST', matchNumber: 'Match 3' }
                        ]
                    },
                    { 
                        date: 'February 11, 2026', 
                        format: 'Classic Mode', 
                        map: 'Miramar',
                        matchTimes: [
                            { time: '6:00 PM IST', matchNumber: 'Match 4' },
                            { time: '7:00 PM IST', matchNumber: 'Match 5' }
                        ]
                    }
                ]
            },
            {
                roundTitle: '🔥 Semi Finals',
                days: [
                    { 
                        date: 'February 15, 2026', 
                        format: 'Classic Mode', 
                        map: 'Sanhok',
                        matchTimes: [
                            { time: '6:00 PM IST', matchNumber: 'Match 1' },
                            { time: '7:00 PM IST', matchNumber: 'Match 2' }
                        ]
                    }
                ]
            },
            {
                roundTitle: '👑 Grand Finals',
                days: [
                    { 
                        date: 'February 20, 2026', 
                        format: 'Classic Mode', 
                        map: 'Erangel',
                        matchTimes: [
                            { time: '8:00 PM IST', matchNumber: 'Final Match' }
                        ]
                    }
                ]
            }
        ]
    });

    if (loading) {
        return (
            <div className="tournament-loading">
                <div className="loading-spinner"></div>
                <p>Loading tournament info...</p>
            </div>
        );
    }

    return (
        <div className="tournament-page">
            {/* Room Details Popup */}
            {showRoomPopup && roomDetails.length > 0 && (
                <div className="room-popup-overlay">
                    <div className="room-popup">
                        <button onClick={() => setShowRoomPopup(false)} className="popup-close">
                            <FaTimesCircle />
                        </button>
                        <h3 className="popup-title">🎮 Room Details</h3>
                        <div className="room-list">
                            {roomDetails.map((room, index) => (
                                <div key={index} className="room-card">
                                    <h4 className="room-match-name">{room.matchName}</h4>
                                    <p className="room-time">🕒 {room.time}</p>
                                    <div className="room-detail">
                                        <p className="detail-label">🎮 Room ID</p>
                                        <div className="detail-value">{room.roomId}</div>
                                    </div>
                                    <div className="room-detail">
                                        <p className="detail-label">🔑 Password</p>
                                        <div className="detail-value">{room.password}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowRoomPopup(false)} className="btn-popup-close">
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="container">
                <div className="tournament-header">
                    <FaTrophy className="header-icon" />
                    <h1>Tournament Information</h1>
                </div>

                {/* Room Details Button */}
                {roomDetails.length > 0 && (
                    <div className="room-button-container">
                        <button onClick={() => setShowRoomPopup(true)} className="btn-room-details">
                            🎮 View Room Details ({roomDetails.length})
                        </button>
                    </div>
                )}

                {/* Prize Pool */}
                <section className="prize-section">
                    <h2 className="section-title">🏆 Prize Distribution</h2>
                    <div className="prize-grid">
                        <div className="prize-card gold">
                            <div className="prize-medal">🥇</div>
                            <h3>1st Prize</h3>
                            <p className="prize-amount">{tournamentData.firstPrize}</p>
                        </div>
                        <div className="prize-card silver">
                            <div className="prize-medal">🥈</div>
                            <h3>2nd Prize</h3>
                            <p className="prize-amount">{tournamentData.secondPrize}</p>
                        </div>
                        <div className="prize-card bronze">
                            <div className="prize-medal">🥉</div>
                            <h3>3rd Prize</h3>
                            <p className="prize-amount">{tournamentData.thirdPrize}</p>
                        </div>
                        <div className="prize-card mvp">
                            <div className="prize-medal">🏆</div>
                            <h3>MVP Prize</h3>
                            <p className="prize-amount">{tournamentData.mvpPrize}</p>
                        </div>
                    </div>
                </section>

                {/* Total Matches */}
                <section className="matches-section">
                    <FaGamepad className="section-icon" />
                    <h3>Total Matches</h3>
                    <p className="matches-count">{tournamentData.totalMatches || '5'}</p>
                </section>

                {/* Match Schedule */}
                <section className="schedule-section">
                    <h2 className="section-title">
                        <FaCalendarAlt /> Match Schedule
                    </h2>
                    
                    {(tournamentData.rounds || []).map((round, roundIndex) => (
                        <div key={roundIndex} className="round-container">
                            <h3 className="round-title">{round.roundTitle}</h3>
                            <div className="days-grid">
                                {(round.days || []).map((day, dayIndex) => (
                                    <div key={dayIndex} className={`day-card ${roundIndex === (tournamentData.rounds || []).length - 1 ? 'final' : ''}`}>
                                        <h4 className="day-header">Day {dayIndex + 1} - {day.date}</h4>
                                        <div className="matches-list">
                                            {(day.matchTimes || []).map((mt, idx) => (
                                                <div key={idx} className="match-item">
                                                    <p className="match-number">{mt.matchNumber}</p>
                                                    <p className="match-time">🕒 {mt.time}</p>
                                                    <p className="match-map">🗺️ {day.map}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Tournament Rules */}
                <section className="rules-section">
                    <h2 className="section-title">📋 Tournament Rules</h2>
                    <div className="rules-card">
                        <ul className="rules-list">
                            {tournamentData.rules.map((rule, index) => (
                                <li key={index}>{rule}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Registration Fee */}
                <section className="fee-section">
                    <h3>🎉 Registration Fee: {tournamentData.registrationFee}</h3>
                    <p>{tournamentData.feeDescription}</p>
                </section>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button onClick={() => navigate('/profile')} className="btn-action btn-primary-action">
                        <FaUsers />
                        <span>View My Team</span>
                    </button>
                    <button onClick={() => navigate('/teams')} className="btn-action btn-secondary-action">
                        <FaGamepad />
                        <span>View All Teams</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentInfo;