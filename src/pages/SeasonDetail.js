import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './PointTable.css';

const SeasonDetail = () => {
    const { seasonId } = useParams();
    const navigate = useNavigate();
    const [seasonData, setSeasonData] = useState(null);
    const [majorTab, setMajorTab] = useState('groupA'); // groupA, groupB, finals
    const [subTab, setSubTab] = useState('overall'); // day1, day2, overall OR match1, match2... overall
    const [masterTeams, setMasterTeams] = useState([]);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.bgmi) {
                    try {
                        setMasterTeams(JSON.parse(data.bgmi));
                    } catch (e) { }
                }

                if (data.pointsTable) {
                    try {
                        const seasons = JSON.parse(data.pointsTable);
                        const season = seasons.find(s => s.id === seasonId);
                        if (season) {
                            setSeasonData(season);
                            // If finals is active but we are on groups, or vice-versa, handle defaults
                            if (season.finalsActive && majorTab === 'groupA' && !season.days?.day1) {
                                // setMajorTab('finals');
                            }
                        } else {
                            navigate('/');
                        }
                    } catch (e) {
                        navigate('/');
                    }
                } else {
                    navigate('/');
                }
            }
        });

        return () => unsubscribe();
    }, [seasonId, navigate]);

    if (!seasonData) {
        return (
            <div className="point-table-page">
                <div className="container">
                    <Link to="/" className="back-btn">← Back</Link>
                    <p style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    const renderTableRows = () => {
        const teamTotals = {};
        const matchKeys = ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'];

        const processList = (list) => {
            if (Array.isArray(list)) {
                list.forEach(team => {
                    if (!team.teamName) return;
                    if (!teamTotals[team.teamName]) {
                        teamTotals[team.teamName] = {
                            teamName: team.teamName,
                            totalWins: 0,
                            placePoints: 0,
                            killPoints: 0,
                            totalPoints: 0
                        };
                    }
                    const p = parseInt(team.placePoints || team.placementPoints) || 0;
                    const k = parseInt(team.killPoints) || 0;
                    const t = parseInt(team.totalPoints) || (p + k);
                    const w = parseInt(team.wwcd) || 0;

                    teamTotals[team.teamName].placePoints += p;
                    teamTotals[team.teamName].killPoints += k;
                    teamTotals[team.teamName].totalPoints += t;
                    teamTotals[team.teamName].totalWins += w;
                });
            }
        };

        if (majorTab === 'groupA' || majorTab === 'groupB') {
            const groupKey = majorTab; // groupA or groupB
            const groupFilter = groupKey === 'groupA' ? 'A' : 'B';
            
            if (subTab === 'overall') {
                // Sum Day 1 and Day 2 for this group
                ['day1', 'day2'].forEach(dayKey => {
                    const dayData = seasonData.days?.[dayKey]?.[groupKey];
                    if (dayData) {
                        matchKeys.forEach(m => processList(dayData[m]));
                    }
                });
            } else if (subTab.startsWith('day')) {
                // Specific Day (day1, day2)
                const dayData = seasonData.days?.[subTab]?.[groupKey];
                if (dayData) {
                    matchKeys.forEach(m => processList(dayData[m]));
                }
            } else if (subTab.startsWith('match')) {
                // Specific Match for Qualifiers
                // Rule: Day 1: M1=A, M2=B, M3=A, M4=B... Day 2: M1=B, M2=A, M3=B, M4=A...
                const matchNum = parseInt(subTab.replace('match', ''));
                
                // We need to check both days to find which match belongs to this group
                // Actually, the admin saves them specifically under groupA/B
                // So we just need to know which day this match number refers to in the Admin's view
                
                // For Qualifiers, Admin uses Match 1-6 for EACH day.
                // Wait, if the user clicked "Match 1", we show Day 1 Match 1 for Group A (if Group A)
                // If they clicked "Match 2", we show Day 2 Match 2 for Group A (if Group A - based on B-A-B rule)
                
                const getTargetForMatch = (mNum) => {
                    // This is tricky because "Match 1" for the user could mean many things.
                    // Let's assume Match 1 means the first match played by this group.
                    // But easier is: Match 1 = Day 1 Match 1, Match 2 = Day 2 Match 2, etc. (for Group A)
                    
                    if (groupKey === 'groupA') {
                        // Group A plays: Day1 M1, Day2 M2, Day1 M3, Day2 M4, Day1 M5, Day2 M6
                        const day = mNum % 2 !== 0 ? 'day1' : 'day2';
                        return { day, match: `match${mNum}` };
                    } else {
                        // Group B plays: Day1 M2, Day2 M1, Day1 M4, Day2 M3, Day1 M6, Day2 M5
                        // Wait, let's look at the rule: Day 1: 1=A, 2=B, 3=A. Day 2: 1=B, 2=A, 3=B.
                        const day = mNum % 2 === 0 ? 'day1' : 'day2';
                        return { day, match: `match${mNum}` };
                    }
                };
                
                const target = getTargetForMatch(matchNum);
                const data = seasonData.days?.[target.day]?.[groupKey]?.[target.match];
                processList(data);
            }
        } else if (majorTab === 'finals') {
            if (subTab === 'overall') {
                // Sum all finals matches across all days (Day 3, Day 4, etc)
                Object.values(seasonData.days || {}).forEach(day => {
                    if (day.finals) {
                        matchKeys.forEach(m => processList(day.finals[m]));
                    }
                });
            } else {
                // Specific Match mapping (M1-M2 = Day 3, M3-M4 = Day 4, M5-M6 = Day 5)
                const matchNum = parseInt(subTab.replace('match', ''));
                let targetDay = 'day3';
                let targetMatch = 'match1';

                if (matchNum <= 2) {
                    targetDay = 'day3';
                    targetMatch = `match${matchNum}`;
                } else if (matchNum <= 4) {
                    targetDay = 'day4';
                    targetMatch = `match${matchNum - 2}`;
                } else {
                    targetDay = 'day5';
                    targetMatch = `match${matchNum - 4}`;
                }

                const data = seasonData.days?.[targetDay]?.finals?.[targetMatch];
                processList(data);
            }
        }

        const sorted = Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);

        if (sorted.length === 0) {
            return (
                <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No data available for this selection.
                    </td>
                </tr>
            );
        }

        return sorted.map((team, idx) => (
            <tr key={idx} className={idx < 3 ? 'top-rank' : ''}>
                <td><span className="rank-badge">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span></td>
                <td className="team-name">{team.teamName}</td>
                <td>{team.totalWins}</td>
                <td>{team.placePoints}</td>
                <td>{team.killPoints}</td>
                <td className="points">{team.totalPoints}</td>
                <td>✅</td>
            </tr>
        ));
    };

    return (
        <div className="point-table-page">
            <div className="container">
                <Link to="/seasons" className="modern-back-btn">
                    <FaArrowLeft />
                    <span>BACK</span>
                </Link>

                <h1 className="page-title">{seasonData.name}</h1>

                {/* Major Tabs */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <button
                        onClick={() => { setMajorTab('groupA'); setSubTab('overall'); }}
                        style={{
                            padding: '12px 24px',
                            background: majorTab === 'groupA' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)',
                            color: majorTab === 'groupA' ? '#fff' : '#8b5cf6',
                            border: '2px solid #8b5cf6',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        🟣 Group A
                    </button>
                    <button
                        onClick={() => { setMajorTab('groupB'); setSubTab('overall'); }}
                        style={{
                            padding: '12px 24px',
                            background: majorTab === 'groupB' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                            color: majorTab === 'groupB' ? '#fff' : '#10b981',
                            border: '2px solid #10b981',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        🟢 Group B
                    </button>
                    <button
                        onClick={() => { setMajorTab('finals'); setSubTab('overall'); }}
                        style={{
                            padding: '12px 24px',
                            background: majorTab === 'finals' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                            color: majorTab === 'finals' ? '#fff' : '#f59e0b',
                            border: '2px solid #f59e0b',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        🏆 Finals
                    </button>
                </div>

                <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }}></div>

                {/* Sub Tabs */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
                    <button
                        onClick={() => setSubTab('overall')}
                        style={{
                            padding: '8px 16px',
                            background: subTab === 'overall' ? 'var(--accent-color)' : 'transparent',
                            color: subTab === 'overall' ? '#000' : 'var(--text-primary)',
                            border: '1px solid var(--accent-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Overall
                    </button>

                    {(() => {
                        const maxMatch = seasonData.visibleMatches || 1;

                        return Array.from({ length: Math.min(maxMatch, 6) }, (_, i) => `match${i + 1}`).map((match, idx) => (
                            <button
                                key={match}
                                onClick={() => setSubTab(match)}
                                style={{
                                    padding: '8px 16px',
                                    background: subTab === match ? 'var(--accent-color)' : 'transparent',
                                    color: subTab === match ? '#000' : 'var(--text-primary)',
                                    border: '1px solid var(--accent-color)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Match {idx + 1}
                            </button>
                        ));
                    })()}
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {majorTab === 'groupA' ? '🟣 Group A' : majorTab === 'groupB' ? '🟢 Group B' : '🏆 Finals'} - {subTab === 'overall' ? 'Overall Standings' : subTab.toUpperCase()}
                </h2>

                <div className="table-card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Team Name</th>
                                    <th>WWCD</th>
                                    <th>Place Pts</th>
                                    <th>Kill Pts</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonDetail;
