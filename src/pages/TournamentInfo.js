import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const TournamentInfo = () => {
    const navigate = useNavigate();
    const [tournamentData, setTournamentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roomDetails, setRoomDetails] = useState([]);
    const [showRoomPopup, setShowRoomPopup] = useState(false);

    useEffect(() => {
        fetchTournamentInfo();
    }, []);

    const fetchTournamentInfo = async () => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data && data !== "") {
                    try {
                        const parsedData = JSON.parse(data);
                        setTournamentData(parsedData);
                        
                        // Extract matches with room details
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
                        if (matchesWithRooms.length > 0) {
                            setShowRoomPopup(true);
                        }
                    } catch (e) {
                        setTournamentData(getDefaultData());
                    }
                } else {
                    setTournamentData(getDefaultData());
                }
            } else {
                setTournamentData(getDefaultData());
            }
        } catch (error) {
            console.error('Error fetching tournament info:', error);
            setTournamentData(getDefaultData());
        }
        setLoading(false);
    };

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

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        navigate('/');
        alert('Logged out successfully!');
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div className="container" style={{ padding: '50px 10px' }}>
            {/* Room Details Popup */}
            {showRoomPopup && roomDetails.length > 0 && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '30px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative', border: '2px solid var(--accent-color)' }}>
                        <button
                            onClick={() => setShowRoomPopup(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            ×
                        </button>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px', textAlign: 'center', fontSize: '1.5rem' }}>🎮 Room Details</h3>
                        {roomDetails.map((room, index) => (
                            <div key={index} style={{ marginBottom: index < roomDetails.length - 1 ? '30px' : '0', padding: '25px', background: 'var(--bg-primary)', borderRadius: '8px', border: '2px solid var(--accent-color)' }}>
                                <h4 style={{ color: 'var(--accent-color)', marginBottom: '20px', textAlign: 'center', fontSize: '1.3rem', borderBottom: '2px solid var(--accent-color)', paddingBottom: '10px' }}>
                                    {room.matchName}
                                </h4>
                                <p style={{ textAlign: 'center', marginBottom: '15px', color: 'var(--text-secondary)' }}>🕒 {room.time}</p>
                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem', color: 'var(--text-primary)' }}>🎮 Room ID</p>
                                    <div style={{ padding: '15px', background: 'rgba(0, 255, 0, 0.15)', borderRadius: '6px', border: '2px solid var(--success)' }}>
                                        <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)', textAlign: 'center', letterSpacing: '2px' }}>{room.roomId}</p>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem', color: 'var(--text-primary)' }}>🔑 Password</p>
                                    <div style={{ padding: '15px', background: 'rgba(0, 255, 0, 0.15)', borderRadius: '6px', border: '2px solid var(--success)' }}>
                                        <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)', textAlign: 'center', letterSpacing: '2px' }}>{room.password}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => setShowRoomPopup(false)}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '20px', padding: '12px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <h2 className="heading-glitch" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '30px', textAlign: 'center' }}>
                    🏆 Tournament Information
                </h2>

                {/* Show Room Details Button */}
                {roomDetails.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <button
                            onClick={() => setShowRoomPopup(true)}
                            className="btn-primary"
                            style={{ padding: '12px 30px', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', animation: 'pulse 2s infinite' }}
                        >
                            🎮 View Room Details ({roomDetails.length})
                        </button>
                    </div>
                )}

                {/* Prize Pool */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h3 style={{ color: 'var(--accent-color)', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', marginBottom: '30px' }}>
                        🏆 Prize Distribution
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ padding: '20px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '12px', border: '2px solid gold' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🥇</div>
                            <h4 style={{ color: 'gold', marginBottom: '10px' }}>1st Prize</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tournamentData.firstPrize}</p>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(192, 192, 192, 0.1)', borderRadius: '12px', border: '2px solid silver' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🥈</div>
                            <h4 style={{ color: 'silver', marginBottom: '10px' }}>2nd Prize</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tournamentData.secondPrize}</p>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(205, 127, 50, 0.1)', borderRadius: '12px', border: '2px solid #cd7f32' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🥉</div>
                            <h4 style={{ color: '#cd7f32', marginBottom: '10px' }}>3rd Prize</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tournamentData.thirdPrize}</p>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '12px', border: '2px solid var(--accent-color)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏆</div>
                            <h4 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>MVP Prize</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tournamentData.mvpPrize}</p>
                        </div>
                    </div>
                </div>

                {/* Total Matches */}
                <div style={{ textAlign: 'center', marginBottom: '40px', padding: '20px', background: 'rgba(100, 150, 255, 0.1)', borderRadius: '12px', border: '2px solid #6496ff' }}>
                    <h3 style={{ color: '#6496ff', fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', marginBottom: '10px' }}>
                        🎮 Total Matches
                    </h3>
                    <p style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {tournamentData.totalMatches || '5'}
                    </p>
                </div>

                {/* Match Schedule */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px', textAlign: 'center', fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)' }}>
                        📅 Match Schedule
                    </h3>
                    
                    {(tournamentData.rounds || []).map((round, roundIndex) => (
                        <div key={roundIndex} style={{ marginBottom: '40px' }}>
                            <h4 style={{ color: 'var(--accent-color)', fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', marginBottom: '20px', textAlign: 'center' }}>
                                {round.roundTitle}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {(round.days || []).map((day, dayIndex) => (
                                    <div key={dayIndex} className="card" style={{ padding: '20px', border: roundIndex === (tournamentData.rounds || []).length - 1 ? '1px solid var(--accent-color)' : '1px solid var(--border-color)' }}>
                                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '15px', fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>Day {dayIndex + 1} - {day.date}</h5>
                                        <div>
                                            {(day.matchTimes || []).map((mt, idx) => (
                                                <div key={idx} style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-color)' }}>
                                                    <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>{mt.matchNumber}</p>
                                                    <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-secondary)' }}>🕒 {mt.time}</p>
                                                    <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-secondary)' }}>🗺️ {day.map}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tournament Rules */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px', textAlign: 'center' }}>
                        📋 Tournament Rules
                    </h3>
                    
                    <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            {tournamentData.rules.map((rule, index) => (
                                <li key={index}>{rule}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Registration Fee */}
                <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: 'rgba(0, 255, 100, 0.1)', borderRadius: '8px' }}>
                    <h3 style={{ color: 'var(--success)', marginBottom: '10px' }}>
                        🎉 Registration Fee: {tournamentData.registrationFee}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {tournamentData.feeDescription}
                    </p>
                </div>

                {/* Action Buttons */}
                <div style={{ textAlign: 'center', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => navigate('/profile')}
                        className="btn-primary"
                        style={{ padding: '15px 30px' }}
                    >
                        View My Team
                    </button>
                    <button 
                        onClick={() => navigate('/teams')}
                        className="btn-secondary"
                        style={{ padding: '15px 30px' }}
                    >
                        View All Teams
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ padding: '15px 30px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentInfo;