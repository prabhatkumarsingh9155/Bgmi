import React, { useState } from 'react';

const NotificationsPanel = ({ notifications, onSend, onDelete }) => {
    const [notifData, setNotifData] = useState({ title: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend(notifData);
        setNotifData({ title: '', message: '' });
    };

    return (
        <>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
                <h3 style={{ marginBottom: '20px' }}>Send Announcement</h3>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Title</label>
                        <input
                            type="text"
                            className="input-field"
                            value={notifData.title}
                            onChange={e => setNotifData({ ...notifData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Message</label>
                        <textarea
                            className="input-field"
                            rows="4"
                            value={notifData.message}
                            onChange={e => setNotifData({ ...notifData, message: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Notification</button>
                </form>
            </div>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ marginBottom: '20px' }}>Sent Notifications</h3>
                {notifications.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notifications sent yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {notifications.map((notif) => (
                            <div key={notif.id} style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ marginBottom: '8px', color: 'var(--accent-color)' }}>{notif.title}</h4>
                                    <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{notif.message}</p>
                                    <small style={{ color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleString()}</small>
                                </div>
                                <button
                                    onClick={() => onDelete(notif.id)}
                                    style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px' }}
                                >
                                    DELETE
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationsPanel;
