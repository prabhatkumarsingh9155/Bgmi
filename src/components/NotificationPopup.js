import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const NotificationPopup = () => {
    const [notification, setNotification] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const currentData = docSnap.data().notifications;
                if (currentData && currentData !== "") {
                    try {
                        const notifications = JSON.parse(currentData);
                        if (notifications.length > 0) {
                            const latestNotification = notifications[0];
                            const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
                            
                            if (!seenNotifications.includes(latestNotification.id)) {
                                setNotification(latestNotification);
                                setShowPopup(true);
                            }
                        }
                    } catch (e) {}
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    const closePopup = () => {
        if (notification) {
            // Mark notification as seen
            const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
            seenNotifications.push(notification.id);
            localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
        }
        setShowPopup(false);
    };

    // Show notifications to all users
    if (!showPopup || !notification) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--accent-color)',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '500px',
                width: '90%',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(255, 170, 0, 0.3)'
            }}>
                {/* Close Button */}
                <button
                    onClick={closePopup}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '24px',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ×
                </button>

                {/* Notification Icon */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'var(--accent-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        fontSize: '24px'
                    }}>
                        🔔
                    </div>
                </div>

                {/* Notification Content */}
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ 
                        color: 'var(--accent-color)', 
                        marginBottom: '15px',
                        fontSize: '1.5rem'
                    }}>
                        {notification.title}
                    </h3>
                    
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        lineHeight: '1.6',
                        marginBottom: '20px'
                    }}>
                        {notification.message}
                    </p>

                    <p style={{ 
                        color: 'var(--text-muted)', 
                        fontSize: '0.9rem',
                        marginBottom: '20px'
                    }}>
                        {new Date(notification.createdAt).toLocaleDateString()}
                    </p>

                    <button
                        onClick={closePopup}
                        className="btn-primary"
                        style={{ padding: '12px 30px' }}
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPopup;