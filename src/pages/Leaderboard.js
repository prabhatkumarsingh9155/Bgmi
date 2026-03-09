import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { doc, onSnapshot } from 'firebase/firestore'; // Added doc, onSnapshot
import './Leaderboard.css';
import './PointTable.css';

const Leaderboard = () => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [seasonInfo, setSeasonInfo] = useState({ seasonNumber: '1', seasonStatus: 'LIVE' });

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.pointsTable) {
                    try {
                        const seasons = JSON.parse(data.pointsTable);
                        const teamStats = {};

                        seasons.forEach(season => {
                            if (!season.days) return;

                            Object.values(season.days).forEach(dayData => {
                                // 1. Process structured data (Group A/B/Finals)
                                ['groupA', 'groupB', 'finals'].forEach(groupKey => {
                                    const groupMatches = dayData[groupKey];
                                    if (groupMatches) {
                                        Object.values(groupMatches).forEach(matchTeams => {
                                            if (Array.isArray(matchTeams)) {
                                                matchTeams.forEach(team => {
                                                    if (!team.teamName) return;

                                                    if (!teamStats[team.teamName]) {
                                                        teamStats[team.teamName] = { teamName: team.teamName, totalPoints: 0, totalKills: 0, totalWins: 0 };
                                                    }

                                                    teamStats[team.teamName].totalPoints += (parseInt(team.totalPoints) || 0);
                                                    teamStats[team.teamName].totalKills += (parseInt(team.killPoints) || 0);
                                                    teamStats[team.teamName].totalWins += (parseInt(team.wwcd) || 0);
                                                });
                                            }
                                        });
                                    }
                                });

                                // 2. Process legacy/standard path data (where match1-6 is directly under day)
                                ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'].forEach(mKey => {
                                    const matchTeams = dayData[mKey];
                                    if (Array.isArray(matchTeams)) {
                                        matchTeams.forEach(team => {
                                            if (!team.teamName) return;
                                            if (!teamStats[team.teamName]) {
                                                teamStats[team.teamName] = { teamName: team.teamName, totalPoints: 0, totalKills: 0, totalWins: 0 };
                                            }
                                            teamStats[team.teamName].totalPoints += (parseInt(team.totalPoints) || 0);
                                            teamStats[team.teamName].totalKills += (parseInt(team.killPoints) || 0);
                                            teamStats[team.teamName].totalWins += (parseInt(team.wwcd) || 0);
                                        });
                                    }
                                });
                            });
                        });

                        // Sort by points, then kills
                        const sorted = Object.values(teamStats).sort((a, b) => {
                            if (b.totalPoints !== a.totalPoints) {
                                return b.totalPoints - a.totalPoints;
                            }
                            return b.totalKills - a.totalKills;
                        });

                        setLeaderboardData(sorted.slice(0, 10));
                    } catch (e) {
                        console.error("Error calculating leaderboard:", e);
                    }
                }
                if (data.tournamentInfo) {
                    try {
                        const info = JSON.parse(data.tournamentInfo);
                        setSeasonInfo({
                            seasonNumber: info.seasonNumber || '1',
                            seasonStatus: info.seasonStatus || 'LIVE'
                        });
                    } catch (e) { }
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="leaderboard-page">
            <div className="container">
                <Link to="/" className="modern-back-btn">
                    <FaArrowLeft />
                    <span>BACK</span>
                </Link>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'inline-block', padding: '8px 20px', background: 'rgba(0, 240, 255, 0.2)', border: '2px solid var(--neon-cyan)', borderRadius: '50px', marginBottom: '15px' }}>
                        <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 SEASON {seasonInfo.seasonNumber} - {seasonInfo.seasonStatus}</span>
                    </div>
                </div>

                <h1 className="page-title">🏆 LEADERBOARD</h1>
                <p className="page-subtitle">Top 10 Teams - Season {seasonInfo.seasonNumber} ({seasonInfo.seasonStatus})</p>

                <div className="leaderboard-grid">
                    {leaderboardData.map((team, idx) => (
                        <div key={idx} className={`leaderboard-card rank-${idx + 1}`}>
                            <div className="rank-badge">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </div>
                            <div className="team-info">
                                <h3 className="team-name">{team.teamName}</h3>
                                <div className="stats-row">
                                    <div className="stat">
                                        <span className="stat-value">{team.totalPoints}</span>
                                        <span className="stat-label">Points</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{team.totalKills}</span>
                                        <span className="stat-label">Kills</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{team.totalWins}</span>
                                        <span className="stat-label">Wins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {leaderboardData.length === 0 && (
                    <div className="no-data">
                        <p>🎮 No leaderboard data available yet.</p>
                        <p>Stay tuned for tournament results!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
