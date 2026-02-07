import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const RoomDetailsPopup = () => {
    const [roomDetails, setRoomDetails] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        // Check if user is logged in
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedIn);
        
        if (!loggedIn) return;

        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data) {
                    try {
                        const parsedData = JSON.parse(data);
                        const matchesWithRooms = [];
                        
                        (parsedData.rounds || []).forEach(round => {
                            (round.days || []).forEach((day, dayIndex) => {
                                (day.matchTimes || []).forEach(match => {
                                    if (match.roomId && match.password) {
                                        const roomData = {
                                            id: `${round.roundTitle}-${dayIndex}-${match.matchNumber}`,
                                            matchName: `${round.roundTitle} - Day ${dayIndex + 1} - ${match.matchNumber}`,
                                            roomId: match.roomId,
                                            password: match.password,
                                            matchTime: match.time,
                                            matchDate: day.date,
                                            revealBeforeMinutes: parseInt(match.revealBeforeMinutes) || 0,
                                            createdAt: new Date().toISOString()
                                        };
                                        console.log('Room data:', roomData);
                                        matchesWithRooms.push(roomData);
                                    }
                                });
                            });
                        });
                        
                        setRoomDetails(matchesWithRooms);
                        if (matchesWithRooms.length > 0 && isClosed) {
                            setIsClosed(false);
                            setIsMinimized(true);
                        }
                    } catch (e) {}
                }
            }
        });
        return () => unsubscribe();
    }, [isClosed]);

    useEffect(() => {
        if (roomDetails.length === 0) return;
        
        const timer = setInterval(() => {
            const firstRoom = roomDetails[0];
            const revealTime = getRevealTime(firstRoom);
            
            if (revealTime) {
                const now = Date.now();
                const diff = revealTime - now;
                
                if (diff > 0) {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setCountdown(`${minutes}m ${seconds}s`);
                } else {
                    setCountdown('');
                }
            } else {
                setCountdown('');
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [roomDetails]);

    const parseMatchTime = (matchTime, matchDate) => {
        try {
            if (!matchTime || matchTime.trim() === '') {
                console.log('Match time is empty');
                return null;
            }
            
            // Try to match various time formats: "6:00 PM IST", "6:00 PM", "18:00", etc.
            const timeMatch = matchTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!timeMatch) {
                console.log('Time format not recognized:', matchTime);
                return null;
            }
            
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
            
            // Convert to 24-hour format if AM/PM is present
            if (period) {
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
            }
            
            // Always use today's date for match time
            const today = new Date();
            const matchDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
            
            // If the time has already passed today, assume it's for tomorrow
            if (matchDateTime.getTime() < Date.now()) {
                matchDateTime.setDate(matchDateTime.getDate() + 1);
                console.log('Match time was in the past, using tomorrow:', matchDateTime.toLocaleString());
            }
            
            console.log('Parsed time:', matchDateTime.toLocaleString(), 'from:', matchTime);
            return matchDateTime.getTime();
        } catch (e) {
            console.error('Error parsing time:', e);
            return null;
        }
    };

    const getRevealTime = (room) => {
        if (!room.revealBeforeMinutes || room.revealBeforeMinutes === 0) {
            console.log('No delay set, revealing immediately');
            return null;
        }
        
        const matchTime = parseMatchTime(room.matchTime, room.matchDate);
        console.log('Match time parsed:', matchTime, 'from', room.matchTime);
        
        if (!matchTime) {
            console.log('Failed to parse match time');
            return null;
        }
        
        const revealTime = matchTime - (room.revealBeforeMinutes * 60000);
        console.log('Reveal time:', new Date(revealTime), 'Delay:', room.revealBeforeMinutes, 'minutes');
        
        return revealTime;
    };

    const isRevealed = (room) => {
        // If no delay set, reveal immediately
        if (!room.revealBeforeMinutes || room.revealBeforeMinutes === 0) {
            console.log('Revealing immediately - no delay set');
            return true;
        }
        
        const revealTime = getRevealTime(room);
        // If can't parse time, reveal immediately
        if (!revealTime) {
            console.log('Revealing immediately - could not calculate reveal time (match time missing or invalid)');
            return true;
        }
        
        const now = Date.now();
        const revealed = now >= revealTime;
        console.log('Is revealed:', revealed, 'Now:', new Date(now).toLocaleTimeString(), 'Reveal at:', new Date(revealTime).toLocaleTimeString());
        
        return revealed;
    };

    if (!isLoggedIn || roomDetails.length === 0) return null;

    if (isClosed) {
        return (
            <div 
                onClick={() => setIsClosed(false)}
                style={{
                    position: 'fixed',
                    top: '60px',
                    right: '20px',
                    background: 'var(--accent-color)',
                    color: '#000',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    zIndex: 999,
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(255, 170, 0, 0.4)',
                    animation: 'pulse 2s infinite'
                }}
            >
                🎮 Room Details Available
            </div>
        );
    }

    if (isMinimized) {
        const firstRoom = roomDetails[0];
        const revealed = isRevealed(firstRoom);
        
        return (
            <div 
                onClick={() => setIsMinimized(false)}
                style={{
                    position: 'fixed',
                    top: '80px',
                    left: 0,
                    right: 0,
                    background: revealed ? 'linear-gradient(90deg, var(--accent-color), #ff8800)' : 'linear-gradient(90deg, #ff6b6b, #ee5a6f)',
                    color: '#000',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    zIndex: 1001,
                    textAlign: 'center',
                    fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {revealed ? (
                    `🎮 ID: ${firstRoom.roomId} | Pass: ${firstRoom.password} - Click to expand`
                ) : (
                    `⏰ Room details in ${countdown} - Click to expand`
                )}
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: 'clamp(20px, 4vw, 30px)',
                maxWidth: '600px',
                width: '100%',
                border: '3px solid var(--accent-color)',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--accent-color)', margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>🎮 Match Room Details</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setIsMinimized(true)}
                            style={{
                                background: 'transparent',
                                border: '2px solid var(--accent-color)',
                                color: 'var(--accent-color)',
                                padding: '5px 15px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                fontWeight: 'bold'
                            }}
                        >
                            Minimize
                        </button>
                        <button
                            onClick={() => setIsClosed(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0 10px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {roomDetails.map((room) => {
                        const revealed = isRevealed(room);
                        return (
                            <div key={room.id} style={{
                                padding: 'clamp(15px, 3vw, 20px)',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: `2px solid ${revealed ? 'var(--accent-color)' : '#ff6b6b'}`
                            }}>
                                <h4 style={{ 
                                    color: 'var(--accent-color)', 
                                    marginBottom: '12px',
                                    fontSize: 'clamp(1rem, 3vw, 1.2rem)'
                                }}>
                                    {room.matchName}
                                </h4>
                                {revealed ? (
                                    <div style={{ 
                                        background: 'rgba(255, 170, 0, 0.1)', 
                                        padding: 'clamp(12px, 3vw, 15px)', 
                                        borderRadius: '6px',
                                        marginBottom: '10px'
                                    }}>
                                        <p style={{ 
                                            marginBottom: '8px', 
                                            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                                            color: 'var(--text-primary)'
                                        }}>
                                            🎮 <strong>Room ID:</strong> <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{room.roomId}</span>
                                        </p>
                                        <p style={{ 
                                            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                                            color: 'var(--text-primary)'
                                        }}>
                                            🔑 <strong>Password:</strong> <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{room.password}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: 'rgba(255, 107, 107, 0.1)', 
                                        padding: 'clamp(12px, 3vw, 15px)', 
                                        borderRadius: '6px',
                                        marginBottom: '10px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ 
                                            fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                                            color: '#ff6b6b',
                                            fontWeight: 'bold',
                                            marginBottom: '8px'
                                        }}>
                                            ⏰ {countdown}
                                        </p>
                                        <p style={{ 
                                            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            Room details will be revealed soon
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: 'rgba(255, 170, 0, 0.1)', 
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        margin: 0
                    }}>
                        ⚠️ Join the room 5-10 minutes before match time
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoomDetailsPopup;
