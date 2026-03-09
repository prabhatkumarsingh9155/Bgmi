import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './PointTable.css';

const PointTable = () => {
    const [pointsData, setPointsData] = useState({ groupA: [], groupB: [], finals: [] });
    const [seasonInfo, setSeasonInfo] = useState({ seasonNumber: '1', seasonStatus: 'LIVE', finalsActive: false });
    const [activeTab, setActiveTab] = useState('groupA');
    const [maxMatchVisible, setMaxMatchVisible] = useState(1);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                if (data.pointsTable) {
                    try {
                        const seasons = JSON.parse(data.pointsTable);
                        const sortedSeasons = [...seasons].sort((a, b) => (b.id && a.id) ? b.id.localeCompare(a.id) : 0);
                        const liveSeason = seasons.find(s => s.status === 'Live') || sortedSeasons[0];
                        
                        if (liveSeason) {
                            const matchKeys = ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'];
                            let globalMaxMatch = 1;
                            
                            const calculateForGroup = (groupKey) => {
                                const teamTotals = {};
                                const processList = (list, matchNum) => {
                                    if (Array.isArray(list) && list.length > 0) {
                                        globalMaxMatch = Math.max(globalMaxMatch, matchNum);
                                        list.forEach(team => {
                                            if (!team.teamName) return;
                                            if (!teamTotals[team.teamName]) {
                                                teamTotals[team.teamName] = { 
                                                    teamName: team.teamName, 
                                                    match1: 0, match2: 0, match3: 0, match4: 0, match5: 0, match6: 0,
                                                    wwcd: 0, 
                                                    killPoints: 0, 
                                                    totalPoints: 0 
                                                };
                                            }
                                            const pts = parseInt(team.totalPoints) || 0;
                                            teamTotals[team.teamName][`match${matchNum}`] = pts;
                                            teamTotals[team.teamName].killPoints += parseInt(team.killPoints) || 0;
                                            teamTotals[team.teamName].totalPoints += pts;
                                            teamTotals[team.teamName].wwcd += parseInt(team.wwcd) || 0;
                                        });
                                    }
                                };

                                if (groupKey === 'finals') {
                                    ['day3', 'day4', 'day5'].forEach((dk, dayIdx) => {
                                        const dData = liveSeason.days?.[dk]?.finals;
                                        if (dData) {
                                            [1, 2].forEach(mNum => {
                                                const absoluteMatchNum = mNum + (dayIdx * 2);
                                                processList(dData[`match${mNum}`], absoluteMatchNum);
                                            });
                                        }
                                    });
                                } else {
                                    ['day1', 'day2'].forEach(dk => {
                                        const dData = liveSeason.days?.[dk]?.[groupKey];
                                        if (dData) {
                                            matchKeys.forEach((mKey, idx) => processList(dData[mKey], idx + 1));
                                        }
                                    });
                                }

                                return Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
                            };

                            const groupA = calculateForGroup('groupA');
                            const groupB = calculateForGroup('groupB');
                            const finals = calculateForGroup('finals');

                            setPointsData({ groupA, groupB, finals });
                            setMaxMatchVisible(liveSeason.visibleMatches || 1);

                            setSeasonInfo({
                                seasonNumber: liveSeason.name || '1',
                                seasonStatus: liveSeason.status || 'LIVE',
                                finalsActive: liveSeason.finalsActive
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing pointsTable:', e);
                    }
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    const renderTable = (teams) => (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th className="col-rank">RANK</th>
                        <th className="col-team">TEAM</th>
                        {Array.from({ length: maxMatchVisible }, (_, i) => (
                            <th key={i} className="col-match">M{i + 1}</th>
                        ))}
                        <th className="col-wwcd">WWCD</th>
                        <th className="col-kills">KILLS</th>
                        <th className="col-total">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {teams && teams.map((team, idx) => (
                        <tr key={idx} className={idx < 3 ? 'top-rank' : ''}>
                            <td className="rank-cell">
                                <span className="rank-badge">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                </span>
                            </td>
                            <td className="team-name">{team.teamName}</td>
                            {Array.from({ length: maxMatchVisible }, (_, i) => (
                                <td key={i} className="match-points">{team[`match${i + 1}`] || '-'}</td>
                            ))}
                            <td className="wwcd-cell">{team.wwcd || 0}</td>
                            <td className="kills-cell">{team.killPoints || 0}</td>
                            <td className="total-points">{team.totalPoints || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {(!teams || teams.length === 0) && (
                <div className="no-data">
                    <p>No match data available yet.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="point-table-page">
            <div className="container">
                <Link to="/" className="modern-back-btn">
                    <FaArrowLeft />
                    <span>BACK</span>
                </Link>
                
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'inline-block', padding: '8px 20px', background: 'rgba(0, 240, 255, 0.2)', border: '2px solid var(--neon-cyan)', borderRadius: '50px', marginBottom: '15px' }}>
                        <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 {seasonInfo.seasonNumber} - {seasonInfo.seasonStatus}</span>
                    </div>
                </div>

                <h1 className="page-title">📊 POINT TABLE</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    <span className="live-dot" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
                    LIVE UPDATING
                </div>

                {/* Custom Tabs */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setActiveTab('groupA')}
                        className={`tab-btn ${activeTab === 'groupA' ? 'active-a' : ''}`}
                        style={{ 
                            padding: '10px 20px', 
                            background: activeTab === 'groupA' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)', 
                            color: activeTab === 'groupA' ? '#fff' : '#8b5cf6', 
                            border: `2px solid #8b5cf6`, 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        Group A
                    </button>
                    <button 
                        onClick={() => setActiveTab('groupB')}
                        className={`tab-btn ${activeTab === 'groupB' ? 'active-b' : ''}`}
                        style={{ 
                            padding: '10px 20px', 
                            background: activeTab === 'groupB' ? '#10b981' : 'rgba(16, 185, 129, 0.2)', 
                            color: activeTab === 'groupB' ? '#fff' : '#10b981', 
                            border: `2px solid #10b981`, 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        Group B
                    </button>
                    {seasonInfo.finalsActive && (
                        <button 
                            onClick={() => setActiveTab('finals')}
                            className={`tab-btn ${activeTab === 'finals' ? 'active-f' : ''}`}
                            style={{ 
                                padding: '10px 20px', 
                                background: activeTab === 'finals' ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)', 
                                color: activeTab === 'finals' ? '#fff' : '#f59e0b', 
                                border: `2px solid #f59e0b`, 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontWeight: 'bold' 
                            }}
                        >
                            🏆 Finals
                        </button>
                    )}
                </div>

                <div className="table-card">
                    {activeTab === 'groupA' && renderTable(pointsData.groupA)}
                    {activeTab === 'groupB' && renderTable(pointsData.groupB)}
                    {activeTab === 'finals' && renderTable(pointsData.finals)}
                </div>
            </div>
        </div>
    );
};

export default PointTable;
