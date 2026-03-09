import React, { useState } from 'react';

const RoomDetailsPanel = ({ roomDetails, onSend, onDelete }) => {
    const [roomData, setRoomData] = useState({
        matchName: '',
        roomId: '',
        password: '',
        revealInMinutes: '',
        matchStartsInMinutes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roomData.matchName || !roomData.roomId || !roomData.password) {
            alert('Please fill in Match Name, Room ID, and Password.');
            return;
        }
        onSend(roomData);
        setRoomData({ matchName: '', roomId: '', password: '', revealInMinutes: '', matchStartsInMinutes: '' });
    };

    const getStatusLabel = (room) => {
        const now = Date.now();
        const sentAt = new Date(room.createdAt).getTime();
        const revealDelay = (parseInt(room.revealInMinutes) || 0) * 60000;
        const revealAt = sentAt + revealDelay;
        const matchDelay = (parseInt(room.matchStartsInMinutes) || 0) * 60000;
        const matchAt = sentAt + matchDelay;

        if (now < revealAt) {
            const remainSec = Math.floor((revealAt - now) / 1000);
            const m = Math.floor(remainSec / 60);
            const s = remainSec % 60;
            return { color: '#ff6b6b', text: `🔒 Reveals in ${m}m ${s}s` };
        } else if (now < matchAt) {
            const remainSec = Math.floor((matchAt - now) / 1000);
            const m = Math.floor(remainSec / 60);
            const s = remainSec % 60;
            return { color: 'orange', text: `⏳ Match starts in ${m}m ${s}s` };
        }
        return { color: 'var(--success)', text: '🟢 Match Live' };
    };

    return (
        <>
            {/* Send Room Details Form */}
            <div className="card" style={{ maxWidth: '650px', margin: '0 auto 30px' }}>
                <h3 style={{ marginBottom: '5px' }}>📡 Send Room ID & Password</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Set a reveal timer — Room ID & Password will be hidden from players until the countdown expires.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Match Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={roomData.matchName}
                            onChange={e => setRoomData({ ...roomData, matchName: e.target.value })}
                            placeholder="e.g. Qualifier Round - Match 1"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Room ID</label>
                        <input
                            type="text"
                            className="input-field"
                            value={roomData.roomId}
                            onChange={e => setRoomData({ ...roomData, roomId: e.target.value })}
                            placeholder="e.g. 123456789"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="text"
                            className="input-field"
                            value={roomData.password}
                            onChange={e => setRoomData({ ...roomData, password: e.target.value })}
                            placeholder="e.g. bgmi2024"
                            required
                        />
                    </div>

                    {/* Timer Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                            <label className="input-label">🔒 Reveal Room ID in (minutes)</label>
                            <input
                                type="number"
                                className="input-field"
                                min="0"
                                value={roomData.revealInMinutes}
                                onChange={e => setRoomData({ ...roomData, revealInMinutes: e.target.value })}
                                placeholder="e.g. 10"
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                Room ID hidden for this many minutes after sending
                            </small>
                        </div>
                        <div className="input-group">
                            <label className="input-label">⏱️ Match Starts in (minutes)</label>
                            <input
                                type="number"
                                className="input-field"
                                min="0"
                                value={roomData.matchStartsInMinutes}
                                onChange={e => setRoomData({ ...roomData, matchStartsInMinutes: e.target.value })}
                                placeholder="e.g. 30"
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                Players see "Match starts in X" countdown
                            </small>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        📨 Send Room Details
                    </button>
                </form>
            </div>

            {/* Sent Room Details List */}
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ marginBottom: '20px' }}>📋 Sent Room Details</h3>
                {roomDetails.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No room details sent yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {roomDetails.map((room) => {
                            const status = getStatusLabel(room);
                            return (
                                <div key={room.id} style={{
                                    padding: '18px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'var(--bg-primary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    gap: '10px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            <h4 style={{ color: 'var(--accent-color)', margin: 0 }}>{room.matchName}</h4>
                                            <span style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 'bold',
                                                color: status.color,
                                                background: `${status.color}20`,
                                                padding: '3px 10px',
                                                borderRadius: '20px'
                                            }}>{status.text}</span>
                                        </div>
                                        <p style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>🎮 Room ID: <strong>{room.roomId}</strong></p>
                                        <p style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>🔑 Password: <strong>{room.password}</strong></p>
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            {room.revealInMinutes && <small style={{ color: 'var(--text-muted)' }}>🔒 Reveal after: {room.revealInMinutes} min</small>}
                                            {room.matchStartsInMinutes && <small style={{ color: 'var(--text-muted)' }}>⏱️ Match after: {room.matchStartsInMinutes} min</small>}
                                            <small style={{ color: 'var(--text-muted)' }}>Sent: {new Date(room.createdAt).toLocaleString()}</small>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(room.id)}
                                        style={{
                                            color: 'var(--danger)',
                                            background: 'rgba(255,0,0,0.08)',
                                            border: '1px solid var(--danger)',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            padding: '6px 14px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            flexShrink: 0
                                        }}
                                    >
                                        DELETE
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default RoomDetailsPanel;
