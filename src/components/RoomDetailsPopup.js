import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const RoomDetailsPopup = () => {
    const [roomDetails, setRoomDetails] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedIn);
        
        if (!loggedIn) return;

        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().roomDetails;
                if (data) {
                    try {
                        const rooms = JSON.parse(data);
                        setRoomDetails(rooms);
                        if (rooms.length > 0 && isClosed) {
                            setIsClosed(false);
                            setIsMinimized(true);
                        }
                    } catch (e) {}
                }
            }
        });
        return () => unsubscribe();
    }, [isClosed]);

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
        return (
            <div 
                onClick={() => setIsMinimized(false)}
                style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(90deg, var(--accent-color), #ff8800)',
                    color: '#000',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    zIndex: 999,
                    textAlign: 'center',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
            >
                🎮 {roomDetails[0].matchName} - Room ID: {roomDetails[0].roomId} | Password: {roomDetails[0].password} - Click to expand
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
                    {roomDetails.map((room) => (
                        <div key={room.id} style={{
                            padding: 'clamp(15px, 3vw, 20px)',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '2px solid var(--accent-color)'
                        }}>
                            <h4 style={{ 
                                color: 'var(--accent-color)', 
                                marginBottom: '12px',
                                fontSize: 'clamp(1rem, 3vw, 1.2rem)'
                            }}>
                                {room.matchName}
                            </h4>
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
                            <small style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                                Sent: {new Date(room.createdAt).toLocaleString()}
                            </small>
                        </div>
                    ))}
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
