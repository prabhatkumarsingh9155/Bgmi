import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Teams = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        const teams = JSON.parse(currentData);
                        teams.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
                        setTeams(teams);
                    } catch (e) {
                        setTeams([]);
                    }
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <div className="container" style={{ padding: '50px 0' }}>
            <h2 className="heading-glitch" style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                Registered Teams
            </h2>

            {teams.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        No teams registered yet. Be the first to register!
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>Slot</th>
                                    <th style={{ padding: '15px' }}>Team Name</th>
                                    <th style={{ padding: '15px' }}>Captain</th>
                                    <th style={{ padding: '15px' }}>Players</th>
                                    <th style={{ padding: '15px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '15px' }}>{team.slotNumber ? `#${team.slotNumber}` : 'Pending'}</td>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{team.teamName}</td>
                                        <td style={{ padding: '15px' }}>{team.captainWhatsapp}</td>
                                        <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {team.player1Name}, {team.player2Name}, {team.player3Name}, {team.player4Name}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                background: team.status === 'Approved' ? 'rgba(0, 255, 0, 0.1)' : team.status === 'Rejected' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                                                color: team.status === 'Approved' ? 'var(--success)' : team.status === 'Rejected' ? 'var(--danger)' : 'orange'
                                            }}>
                                                {team.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Total Teams: {teams.length} / 100
                </p>
            </div>
        </div>
    );
};

export default Teams;