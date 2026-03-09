import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { TOURNAMENT_DOC_ID, TOURNAMENT_COLLECTION, safeJSONParse } from '../utils/dataHelpers';
import { FaTrophy, FaCalendar, FaArrowLeft } from 'react-icons/fa';
import './Seasons.css';

const Seasons = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const seasonId = searchParams.get('season');
    const [seasons, setSeasons] = useState([]);
    const [teams, setTeams] = useState([]);
    const [groupFeatureEnabled, setGroupFeatureEnabled] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [selectedDay, setSelectedDay] = useState('day1');
    const [activeGroup, setActiveGroup] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const seasonsData = safeJSONParse(data.pointsTable, []);
                const teamsData = safeJSONParse(data.bgmi, []);
                setGroupFeatureEnabled(data.groupFeatureEnabled || false);
                setSeasons(seasonsData);
                setTeams(teamsData);
                
                if (seasonId) {
                    const season = seasonsData.find(s => s.id === seasonId);
                    setSelectedSeason(season);
                    if (season?.showOverall) {
                        setSelectedDay('overall');
                    } else {
                        setSelectedDay('day1');
                    }
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [seasonId]);

    const getOverallRankings = (season) => {
        const teamTotals = {};
        ['day1', 'day2', 'day3', 'day4'].forEach(day => {
            // Support both old array format and new match1/match2 format
            const dayData = season.days?.[day];
            if (Array.isArray(dayData)) {
                // Old format: direct array
                dayData.forEach(team => {
                    if (!teamTotals[team.teamName]) {
                        teamTotals[team.teamName] = { teamName: team.teamName, wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0, remarks: team.remarks || '' };
                    }
                    teamTotals[team.teamName].wwcd += team.wwcd || 0;
                    teamTotals[team.teamName].placePoints += team.placePoints || 0;
                    teamTotals[team.teamName].killPoints += team.killPoints || 0;
                    teamTotals[team.teamName].totalPoints += team.totalPoints || 0;
                });
            } else if (dayData) {
                // New format: match1/match2 object
                ['match1', 'match2'].forEach(match => {
                    (dayData[match] || []).forEach(team => {
                        if (!teamTotals[team.teamName]) {
                            teamTotals[team.teamName] = { teamName: team.teamName, wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0, remarks: team.remarks || '' };
                        }
                        teamTotals[team.teamName].wwcd += team.wwcd || 0;
                        teamTotals[team.teamName].placePoints += team.placePoints || 0;
                        teamTotals[team.teamName].killPoints += team.killPoints || 0;
                        teamTotals[team.teamName].totalPoints += team.totalPoints || 0;
                    });
                });
            }
        });
        return Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
    };

    const getCurrentDayTeams = () => {
        if (!selectedSeason) return [];
        if (selectedDay === 'overall') {
            return getOverallRankings(selectedSeason);
        }
        const dayData = selectedSeason.days?.[selectedDay];
        if (Array.isArray(dayData)) {
            // Old format
            return dayData;
        } else if (dayData) {
            // New format: merge match1 and match2
            const teamTotals = {};
            ['match1', 'match2'].forEach(match => {
                (dayData[match] || []).forEach(team => {
                    if (!teamTotals[team.teamName]) {
                        teamTotals[team.teamName] = { teamName: team.teamName, wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0, remarks: team.remarks || '', group: team.group };
                    }
                    teamTotals[team.teamName].wwcd += team.wwcd || 0;
                    teamTotals[team.teamName].placePoints += team.placePoints || 0;
                    teamTotals[team.teamName].killPoints += team.killPoints || 0;
                    teamTotals[team.teamName].totalPoints += team.totalPoints || 0;
                });
            });
            return Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
        }
        return [];
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Loading seasons...</p>
            </div>
        );
    }

    if (selectedSeason) {
        const teams = getCurrentDayTeams();
        
        // Get team groups ONLY if feature is enabled
        const teamGroups = {};
        if (groupFeatureEnabled) {
            teams.forEach(team => {
                if (team.group) teamGroups[team.teamName] = team.group;
            });
        }
        
        // Filter by active group
        const filteredTeams = activeGroup === 'all'
            ? teams
            : teams.filter(t => teamGroups[t.teamName] === activeGroup);
        
        // Check if any team has group assigned
        const hasGroups = groupFeatureEnabled && Object.keys(teamGroups).length > 0;

        // Separate teams by group ONLY if feature is enabled
        const groupATeams = groupFeatureEnabled ? teams.filter(t => teamGroups[t.teamName] === 'A') : [];
        const groupBTeams = groupFeatureEnabled ? teams.filter(t => teamGroups[t.teamName] === 'B') : [];
        const noGroupTeams = groupFeatureEnabled ? teams.filter(t => !teamGroups[t.teamName]) : [];
        
        return (
            <div className="seasons-page">
                <div className="seasons-container">
                    <div className="seasons-header">
                        <button 
                            onClick={() => {
                                setSelectedSeason(null);
                                navigate('/seasons');
                            }} 
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid var(--accent-color)', 
                                color: 'var(--accent-color)', 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '10px',
                                fontSize: '0.85rem'
                            }}
                        >
                            <FaArrowLeft /> Back
                        </button>
                        <h1 style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)', marginBottom: '3px' }}>{selectedSeason.name}</h1>
                        {selectedSeason.date && <p style={{ fontSize: '0.85rem', marginBottom: '0' }}>{selectedSeason.date}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => setSelectedDay('overall')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: selectedDay === 'overall' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                background: selectedDay === 'overall' ? 'var(--accent-color)' : 'var(--bg-card)',
                                color: selectedDay === 'overall' ? '#000' : '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                        >
                            Overall
                        </button>
                        {!selectedSeason.showOverall && ['day1', 'day2', 'day3', 'day4'].map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: selectedDay === day ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                    background: selectedDay === day ? 'var(--accent-color)' : 'var(--bg-card)',
                                    color: selectedDay === day ? '#000' : '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}
                            >
                                Day {day.replace('day', '')}
                            </button>
                        ))}
                    </div>

                    <h2 style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--accent-color)', fontSize: 'clamp(0.95rem, 4vw, 1.5rem)' }}>
                        {selectedDay === 'overall' ? 'Overall Ranking' : `Day ${selectedDay.replace('day', '')} Results`}
                    </h2>

                    {/* Finals Qualified Teams Banner */}
                    {selectedSeason.finalsActive && selectedSeason.qualifiedTeams && selectedSeason.qualifiedTeams.length > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 100%)',
                            border: '2px solid var(--accent-color)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: 'var(--accent-color)', marginBottom: '15px', fontSize: '1.3rem' }}>
                                🏆 FINALS QUALIFIED TEAMS ({selectedSeason.qualifiedTeams.length})
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '10px',
                                marginTop: '15px'
                            }}>
                                {selectedSeason.qualifiedTeams.map((teamName, idx) => {
                                    const teamData = teams.find(t => t.teamName === teamName);
                                    return (
                                        <div key={idx} style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{teamName}</span>
                                            {teamData && teamData.slotNumber && (
                                                <span style={{
                                                    background: 'var(--accent-color)',
                                                    color: '#000',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    #{teamData.slotNumber}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Group Filter Tabs */}
                    {hasGroups && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => setActiveGroup('all')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: activeGroup === 'all' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${activeGroup === 'all' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                    color: activeGroup === 'all' ? '#000' : '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                    fontSize: '0.85rem'
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveGroup('A')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: activeGroup === 'A' ? 'rgba(0, 150, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${activeGroup === 'A' ? '#0096ff' : 'var(--border-color)'}`,
                                    color: activeGroup === 'A' ? '#0096ff' : '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Group A
                            </button>
                            <button
                                onClick={() => setActiveGroup('B')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: activeGroup === 'B' ? 'rgba(255, 100, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${activeGroup === 'B' ? '#ff6400' : 'var(--border-color)'}`,
                                    color: activeGroup === 'B' ? '#ff6400' : '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Group B
                            </button>
                        </div>
                    )}

                    {filteredTeams.length === 0 ? (
                        <div className="no-seasons">
                            <FaTrophy style={{ fontSize: '3rem', opacity: 0.3 }} />
                            <p>No data available</p>
                        </div>
                    ) : activeGroup === 'all' && hasGroups ? (
                        <>
                            {/* Group A Section */}
                            {groupATeams.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{
                                        fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                                        fontWeight: 'bold',
                                        color: '#0096ff',
                                        marginBottom: '15px',
                                        padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 15px)',
                                        background: 'rgba(0, 150, 255, 0.1)',
                                        borderLeft: '4px solid #0096ff',
                                        borderRadius: '8px'
                                    }}>
                                        GROUP A ({groupATeams.length} Teams)
                                    </h3>
                                    <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(0, 150, 255, 0.05)', borderBottom: '2px solid #0096ff', textAlign: 'left' }}>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Rank</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Team Name</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>WWCD</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Place Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Kill Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Total</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupATeams.map((team, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', background: index % 2 === 0 ? 'transparent' : 'rgba(0, 150, 255, 0.02)' }}>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'inherit', whiteSpace: 'nowrap' }}>
                                                            #{index + 1}
                                                        </td>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{team.teamName}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.wwcd || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.placePoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.killPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1rem' }}>{team.totalPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {team.remarks ? (
                                                                <span style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    background: 'rgba(255,0,0,0.1)',
                                                                    color: 'var(--danger)',
                                                                    border: '1px solid var(--danger)',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {team.remarks}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Group B Section */}
                            {groupBTeams.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{
                                        fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                                        fontWeight: 'bold',
                                        color: '#ff6400',
                                        marginBottom: '15px',
                                        padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 15px)',
                                        background: 'rgba(255, 100, 0, 0.1)',
                                        borderLeft: '4px solid #ff6400',
                                        borderRadius: '8px'
                                    }}>
                                        GROUP B ({groupBTeams.length} Teams)
                                    </h3>
                                    <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255, 100, 0, 0.05)', borderBottom: '2px solid #ff6400', textAlign: 'left' }}>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Rank</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Team Name</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>WWCD</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Place Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Kill Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Total</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupBTeams.map((team, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', background: index % 2 === 0 ? 'transparent' : 'rgba(255, 100, 0, 0.02)' }}>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'inherit', whiteSpace: 'nowrap' }}>
                                                            #{index + 1}
                                                        </td>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{team.teamName}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.wwcd || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.placePoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.killPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1rem' }}>{team.totalPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {team.remarks ? (
                                                                <span style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    background: 'rgba(255,0,0,0.1)',
                                                                    color: 'var(--danger)',
                                                                    border: '1px solid var(--danger)',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {team.remarks}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* No Group Teams */}
                            {noGroupTeams.length > 0 && (
                                <div>
                                    <h3 style={{
                                        fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                                        fontWeight: 'bold',
                                        color: 'var(--text-muted)',
                                        marginBottom: '15px',
                                        padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 15px)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderLeft: '4px solid var(--border-color)',
                                        borderRadius: '8px'
                                    }}>
                                        NO GROUP ({noGroupTeams.length} Teams)
                                    </h3>
                                    <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Rank</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Team Name</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>WWCD</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Place Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Kill Pts</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Total</th>
                                                    <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {noGroupTeams.map((team, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>#{index + 1}</td>
                                                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{team.teamName}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.wwcd || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.placePoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.killPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1rem' }}>{team.totalPoints || 0}</td>
                                                        <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {team.remarks ? (
                                                                <span style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    background: 'rgba(255,0,0,0.1)',
                                                                    color: 'var(--danger)',
                                                                    border: '1px solid var(--danger)',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {team.remarks}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--accent-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Rank</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Team Name</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>WWCD</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Place Pts</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Kill Pts</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Total</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeams.map((team, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'inherit', whiteSpace: 'nowrap' }}>
                                                #{index + 1}
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                {team.teamName}
                                                {hasGroups && teamGroups[team.teamName] && activeGroup === 'all' && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 'bold',
                                                        background: teamGroups[team.teamName] === 'A' ? 'rgba(0, 150, 255, 0.2)' : 'rgba(255, 100, 0, 0.2)',
                                                        color: teamGroups[team.teamName] === 'A' ? '#0096ff' : '#ff6400'
                                                    }}>
                                                        {teamGroups[team.teamName]}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.wwcd || 0}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.placePoints || 0}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.9rem' }}>{team.killPoints || 0}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1rem' }}>{team.totalPoints || 0}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                {team.remarks ? (
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        background: 'rgba(255,0,0,0.1)',
                                                        color: 'var(--danger)',
                                                        border: '1px solid var(--danger)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {team.remarks}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="seasons-page">
            <div className="seasons-container">
                <div className="seasons-header">
                    <h1>Tournament Seasons</h1>
                    <p>Select a season to view points table</p>
                </div>

                {seasons.length === 0 ? (
                    <div className="no-seasons">
                        <FaTrophy style={{ fontSize: '3rem', opacity: 0.3 }} />
                        <p>No seasons available yet</p>
                    </div>
                ) : (
                    <div className="seasons-grid">
                        {seasons.map((season, index) => (
                            <div
                                key={season.id || index}
                                className="season-card"
                                onClick={() => {
                                    if (season.id) {
                                        navigate(`/seasons?season=${season.id}`);
                                    } else {
                                        alert('Season ID missing. Please recreate this season.');
                                    }
                                }}
                            >
                                <div className="season-icon">
                                    <FaTrophy />
                                </div>
                                <h3>{season.name}</h3>
                                {season.date && (
                                    <div className="season-date">
                                        <FaCalendar />
                                        <span>{season.date}</span>
                                    </div>
                                )}
                                {season.status && (
                                    <span className={`season-status ${season.status.toLowerCase()}`}>
                                        {season.status}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Seasons;
