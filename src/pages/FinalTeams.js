import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './PointTable.css';

const FinalTeams = () => {
    const [finalTeams, setFinalTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.finalTeamsData) {
                    try {
                        setFinalTeams(JSON.parse(data.finalTeamsData));
                    } catch (e) {}
                }
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '80vh', padding: '20px' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link to="/" className="modern-back-btn">
                    <FaArrowLeft />
                    <span>BACK</span>
                </Link>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                        🏆 Final Qualified Teams
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Top 20 teams qualified for finals
                    </p>
                </div>

                {finalTeams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <h2 style={{ color: 'var(--text-muted)' }}>No final teams announced yet</h2>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {finalTeams.sort((a, b) => a.slot - b.slot).map((team, idx) => (
                            <div 
                                key={idx} 
                                className="card"
                                style={{ 
                                    padding: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                    border: '2px solid #10b981',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateX(10px)';
                                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(16, 185, 129, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: 'bold', 
                                    color: '#10b981',
                                    minWidth: '60px',
                                    textAlign: 'center'
                                }}>
                                    #{team.slot}
                                </div>
                                <div style={{ 
                                    color: '#fff', 
                                    fontSize: '1.3rem', 
                                    fontWeight: '600',
                                    flex: 1
                                }}>
                                    {team.teamName}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalTeams;
