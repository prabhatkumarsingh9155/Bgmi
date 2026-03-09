import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './Teams.css';
import './PointTable.css';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [groupActive, setGroupActive] = useState(true);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const currentData = data.bgmi;
                if (currentData && currentData !== "") {
                    try {
                        let teams = JSON.parse(currentData);
                        // Filter out deleted teams only
                        const activeTeams = teams.filter(team => !team.deleted);
                        activeTeams.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
                        setTeams(activeTeams);
                    } catch (e) {
                        setTeams([]);
                    }
                }
                // Load group active state
                if (data.groupActiveEnabled !== undefined) {
                    setGroupActive(data.groupActiveEnabled);
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <div className="container teams-page">
            <Link to="/" className="modern-back-btn">
                <FaArrowLeft />
                <span>BACK</span>
            </Link>
            <h2 className="heading-glitch teams-title">
                Registered Teams
            </h2>

            {teams.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        No teams registered yet. Be the first to register!
                    </p>
                </div>
            ) : !groupActive || teams.filter(t => t.assignedGroup).length === 0 ? (
                <div className="card">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                        📋 All Registered Teams
                    </h3>
                <div className="teams-table-wrap">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left' }}>Slot</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold', color: team.slotNumber ? '#3b82f6' : '#f59e0b' }}>
                                            {team.slotNumber ? `#${team.slotNumber}` : 'Pending'}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', wordBreak: 'break-word' }}>{team.teamName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                        <div className="teams-total-badge teams-total-badge-default">
                            <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                Total: {teams.length} Teams
                            </p>
                        </div>
                </div>
            ) : (
                <div className="teams-groups-grid">
                    {/* Group A */}
                    <div className="card group-card-a">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#8b5cf6', textAlign: 'center', fontWeight: 'bold' }}>
                            🟣 GROUP A
                        </h3>
                        <div className="teams-table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left' }}>Slot</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.filter(t => t.assignedGroup === 'A').map((team, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold', color: team.slotNumber ? '#8b5cf6' : '#f59e0b' }}>
                                                {team.slotNumber ? `#${team.slotNumber}` : 'Pending'}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', wordBreak: 'break-word' }}>{team.teamName}</td>
                                        </tr>
                                    ))}
                                    {teams.filter(t => t.assignedGroup === 'A').length === 0 && (
                                        <tr>
                                            <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No teams in Group A
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="teams-total-badge teams-total-badge-a">
                            <p style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                                Total: {teams.filter(t => t.assignedGroup === 'A').length} Teams
                            </p>
                        </div>
                    </div>

                    {/* Group B */}
                    <div className="card group-card-b">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#10b981', textAlign: 'center', fontWeight: 'bold' }}>
                            🟢 GROUP B
                        </h3>
                        <div className="teams-table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left' }}>Slot</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.filter(t => t.assignedGroup === 'B').map((team, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold', color: team.slotNumber ? '#10b981' : '#f59e0b' }}>
                                                {team.slotNumber ? `#${team.slotNumber}` : 'Pending'}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', wordBreak: 'break-word' }}>{team.teamName}</td>
                                        </tr>
                                    ))}
                                    {teams.filter(t => t.assignedGroup === 'B').length === 0 && (
                                        <tr>
                                            <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No teams in Group B
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="teams-total-badge teams-total-badge-b">
                            <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                                Total: {teams.filter(t => t.assignedGroup === 'B').length} Teams
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="teams-summary">
                <p style={{ color: 'var(--text-secondary)' }}>
                    Total Teams: {teams.length} / 100
                </p>
            </div>
        </div>
    );
};

export default Teams;