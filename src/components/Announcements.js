import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Announcements = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const currentData = docSnap.data().notifications;
                if (currentData && currentData !== "") {
                    try {
                        const notifications = JSON.parse(currentData);
                        setNews(notifications.slice(0, 5));
                    } catch (e) {
                        setNews([]);
                    }
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    if (news.length === 0) return null;

    return (
        <div className="container" style={{ margin: '20px auto' }}>
            <h3 className="heading-glitch" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Announcements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {news.map(item => (
                    <div key={item.id} className="card" style={{ padding: '15px', borderLeft: '4px solid var(--accent-color)' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</p>
                        <p style={{ color: 'var(--text-secondary)' }}>{item.message}</p>
                        <small style={{ color: 'var(--text-muted)' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Announcements;
