import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { TOURNAMENT_DOC_ID, TOURNAMENT_COLLECTION, safeJSONParse, safeJSONStringify } from '../../utils/dataHelpers';
import { calculateTotalPoints, calculateFromRank } from '../../utils/pointsCalculator';
import { FaPlus, FaTrash, FaEdit, FaUsers } from 'react-icons/fa';

const SeasonsManager = () => {
    const [seasons, setSeasons] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [groupFeatureEnabled, setGroupFeatureEnabled] = useState(false);
    const [newSeason, setNewSeason] = useState({ name: '', date: '', status: 'Upcoming' });
    const [editIndex, setEditIndex] = useState(null);
    const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(null);
    const [selectedDay, setSelectedDay] = useState('overall');
    const [selectedMatch, setSelectedMatch] = useState('match1');
    const [selectedTeamName, setSelectedTeamName] = useState('');
    const [teamStats, setTeamStats] = useState({ wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0 });
    const [selectedRank, setSelectedRank] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [editingTeam, setEditingTeam] = useState(null);
    const [editingStats, setEditingStats] = useState({});

    useEffect(() => {
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                let seasonsData = safeJSONParse(data.pointsTable, []);
                const teamsData = safeJSONParse(data.bgmi, []);
                setGroupFeatureEnabled(data.groupFeatureEnabled || false);
                
                // Auto-fix: Add IDs to seasons that don't have them
                let needsUpdate = false;
                seasonsData = seasonsData.map((season, index) => {
                    if (!season.id) {
                        needsUpdate = true;
                        return { ...season, id: Date.now().toString() + index };
                    }
                    return season;
                });
                
                if (needsUpdate) {
                    updateDoc(docRef, { pointsTable: safeJSONStringify(seasonsData) });
                }
                
                setSeasons(seasonsData);
                setAllTeams(teamsData);
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleGroupFeature = async () => {
        const newValue = !groupFeatureEnabled;
        setGroupFeatureEnabled(newValue);
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
        await updateDoc(docRef, { groupFeatureEnabled: newValue });
    };

    const autoGroupDivide = async () => {
        if (selectedSeasonIndex === null || selectedDay === 'overall') {
            alert('Please select a specific day (not Overall) to auto-divide groups!');
            return;
        }
        
        if (!window.confirm('This will automatically divide all teams in this match into Group A and Group B. Continue?')) {
            return;
        }

        const updated = [...seasons];
        const matchTeams = updated[selectedSeasonIndex].days?.[selectedDay]?.[selectedMatch] || [];
        
        if (matchTeams.length === 0) {
            alert('No teams found in this match!');
            return;
        }

        // Divide teams: odd index = Group A, even index = Group B
        matchTeams.forEach((team, index) => {
            team.group = index % 2 === 0 ? 'A' : 'B';
        });

        await saveSeasons(updated);
        alert(`Successfully divided ${matchTeams.length} teams into groups!`);
    };

    const saveSeasons = async (updatedSeasons) => {
        // Sort all match teams by total points before saving
        updatedSeasons.forEach(season => {
            if (season.days) {
                ['day1', 'day2', 'day3', 'day4'].forEach(day => {
                    ['match1', 'match2'].forEach(match => {
                        if (season.days[day]?.[match]) {
                            season.days[day][match].sort((a, b) => b.totalPoints - a.totalPoints);
                        }
                    });
                });
            }
        });
        
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);
        
        // Calculate leaderboard data
        const leaderboardData = calculateLeaderboardData(updatedSeasons);
        
        await updateDoc(docRef, { 
            pointsTable: safeJSONStringify(updatedSeasons),
            leaderboardData: safeJSONStringify(leaderboardData)
        });
        setSeasons(updatedSeasons);
    };

    const calculateLeaderboardData = (seasons) => {
        const teamTotals = {};
        seasons.forEach(season => {
            if (!season || !season.days) return;
            ['day1', 'day2', 'day3', 'day4'].forEach(day => {
                ['match1', 'match2'].forEach(match => {
                    const teams = season.days[day]?.[match] || [];
                    teams.forEach(team => {
                        if (!teamTotals[team.teamName]) {
                            teamTotals[team.teamName] = { teamName: team.teamName, totalPoints: 0, totalWins: 0, totalKills: 0 };
                        }
                        teamTotals[team.teamName].totalPoints += team.totalPoints || 0;
                        teamTotals[team.teamName].totalWins += team.wwcd || 0;
                        teamTotals[team.teamName].totalKills += team.killPoints || 0;
                    });
                });
            });
        });
        return Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
    };

    const addSeason = () => {
        if (!newSeason.name.trim()) return;
        const seasonToAdd = {
            ...newSeason,
            id: Date.now().toString(),
            days: { 
                day1: { match1: [], match2: [] }, 
                day2: { match1: [], match2: [] }, 
                day3: { match1: [], match2: [] }, 
                day4: { match1: [], match2: [] } 
            },
            showOverall: false
        };
        const updated = [...seasons, seasonToAdd];
        saveSeasons(updated);
        setNewSeason({ name: '', date: '', status: 'Upcoming' });
    };

    const deleteSeason = (index) => {
        if (window.confirm('Delete this season?')) {
            const updated = seasons.filter((_, i) => i !== index);
            saveSeasons(updated);
            if (selectedSeasonIndex === index) setSelectedSeasonIndex(null);
        }
    };

    const updateSeason = (index) => {
        const updated = [...seasons];
        updated[index] = { 
            ...updated[index], 
            ...newSeason,
            id: updated[index].id || Date.now().toString() // Add ID if missing
        };
        saveSeasons(updated);
        setNewSeason({ name: '', date: '', status: 'Upcoming' });
        setEditIndex(null);
    };

    const startEdit = (index) => {
        setNewSeason({ name: seasons[index].name, date: seasons[index].date, status: seasons[index].status });
        setEditIndex(index);
    };

    const handleRankChange = (rank) => {
        setSelectedRank(rank);
        const rankInt = parseInt(rank);
        if (rankInt) {
            const { placementPoints, wwcd } = calculateFromRank(rankInt, teamStats);
            setTeamStats(prev => ({
                ...prev,
                placePoints: placementPoints,
                wwcd: wwcd
            }));
        }
    };

    const addTeamToSeason = () => {
        if (!selectedTeamName || selectedSeasonIndex === null || selectedDay === 'overall') return;
        const updated = [...seasons];
        if (!updated[selectedSeasonIndex].days) {
            updated[selectedSeasonIndex].days = { 
                day1: { match1: [], match2: [] }, 
                day2: { match1: [], match2: [] }, 
                day3: { match1: [], match2: [] }, 
                day4: { match1: [], match2: [] } 
            };
        }
        if (!updated[selectedSeasonIndex].days[selectedDay]) {
            updated[selectedSeasonIndex].days[selectedDay] = { match1: [], match2: [] };
        }
        if (!updated[selectedSeasonIndex].days[selectedDay][selectedMatch]) {
            updated[selectedSeasonIndex].days[selectedDay][selectedMatch] = [];
        }
        
        const exists = updated[selectedSeasonIndex].days[selectedDay][selectedMatch].some(t => t.teamName === selectedTeamName);
        if (exists) {
            alert('Team already added to this match!');
            return;
        }
        
        const calculatedTotal = calculateTotalPoints(teamStats.placePoints, teamStats.killPoints);
        
        updated[selectedSeasonIndex].days[selectedDay][selectedMatch].push({ 
            teamName: selectedTeamName,
            wwcd: teamStats.wwcd,
            placePoints: teamStats.placePoints,
            killPoints: teamStats.killPoints,
            totalPoints: calculatedTotal,
            remarks: '',
            group: groupFeatureEnabled ? selectedGroup : undefined
        });
        updated[selectedSeasonIndex].days[selectedDay][selectedMatch].sort((a, b) => b.totalPoints - a.totalPoints);
        saveSeasons(updated);
        setSelectedTeamName('');
        setSelectedRank('');
        // Keep selectedGroup sticky - don't reset it
        setTeamStats({ wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0 });
    };

    const deleteTeam = (seasonIndex, teamIndex) => {
        if (window.confirm('Delete this team?')) {
            const updated = [...seasons];
            updated[seasonIndex].days[selectedDay][selectedMatch].splice(teamIndex, 1);
            saveSeasons(updated);
        }
    };

    const updateTeamRemarks = (seasonIndex, teamIndex, newRemarks) => {
        const updated = [...seasons];
        updated[seasonIndex].days[selectedDay][selectedMatch][teamIndex].remarks = newRemarks;
        saveSeasons(updated);
        setEditingTeam(null);
    };

    const startEditStats = (teamIndex, team) => {
        setEditingStats({ 
            index: teamIndex, 
            wwcd: team.wwcd || 0,
            placePoints: team.placePoints || 0,
            killPoints: team.killPoints || 0,
            totalPoints: team.totalPoints || 0,
            teamName: team.teamName
        });
    };

    const handleEditStatsChange = (field, value) => {
        const updated = { ...editingStats, [field]: parseInt(value) || 0 };
        // Auto-calculate total when place or kill points change
        if (field === 'placePoints' || field === 'killPoints') {
            updated.totalPoints = calculateTotalPoints(updated.placePoints, updated.killPoints);
        }
        setEditingStats(updated);
    };

    const saveEditStats = (seasonIndex, teamIndex) => {
        const calculatedTotal = calculateTotalPoints(editingStats.placePoints, editingStats.killPoints);
        
        const updated = [...seasons];
        updated[seasonIndex].days[selectedDay][selectedMatch][teamIndex] = {
            ...updated[seasonIndex].days[selectedDay][selectedMatch][teamIndex],
            wwcd: editingStats.wwcd,
            placePoints: editingStats.placePoints,
            killPoints: editingStats.killPoints,
            totalPoints: calculatedTotal
        };
        updated[seasonIndex].days[selectedDay][selectedMatch].sort((a, b) => b.totalPoints - a.totalPoints);
        saveSeasons(updated);
        setEditingStats({});
    };

    const toggleOverall = (seasonIndex) => {
        const updated = [...seasons];
        updated[seasonIndex].showOverall = !updated[seasonIndex].showOverall;
        saveSeasons(updated);
    };

    const getOverallRankings = (season) => {
        if (!season || !season.days) return [];
        const teamTotals = {};
        ['day1', 'day2', 'day3', 'day4'].forEach(day => {
            ['match1', 'match2'].forEach(match => {
                const teams = season.days[day]?.[match] || [];
                teams.forEach(team => {
                    if (!teamTotals[team.teamName]) {
                        teamTotals[team.teamName] = { teamName: team.teamName, wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0, remarks: team.remarks || '' };
                    }
                    teamTotals[team.teamName].wwcd += team.wwcd || 0;
                    teamTotals[team.teamName].placePoints += team.placePoints || 0;
                    teamTotals[team.teamName].killPoints += team.killPoints || 0;
                    teamTotals[team.teamName].totalPoints += team.totalPoints || 0;
                });
            });
        });
        return Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
    };

    const getCurrentDayTeams = () => {
        if (selectedSeasonIndex === null || !seasons[selectedSeasonIndex]) return [];
        if (selectedDay === 'overall') {
            return getOverallRankings(seasons[selectedSeasonIndex]);
        }
        const teams = seasons[selectedSeasonIndex].days?.[selectedDay]?.[selectedMatch] || [];
        return [...teams].sort((a, b) => b.totalPoints - a.totalPoints);
    };

    const getTotalTeamsCount = (season) => {
        let count = 0;
        ['day1', 'day2', 'day3', 'day4'].forEach(day => {
            ['match1', 'match2'].forEach(match => {
                count += season.days?.[day]?.[match]?.length || 0;
            });
        });
        return count;
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))', border: '2px solid var(--accent-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.2rem' }}>🎯 Group Feature Control</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {groupFeatureEnabled ? 'Group A/B feature is active everywhere' : 'Groups disabled - works like before'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {groupFeatureEnabled && selectedSeasonIndex !== null && selectedDay !== 'overall' && getCurrentDayTeams().length > 0 && (
                            <button
                                onClick={autoGroupDivide}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '2px solid #f59e0b',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
                                    color: '#f59e0b',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            >
                                ⚡ Auto Group Divide
                            </button>
                        )}
                        <button
                            onClick={toggleGroupFeature}
                            style={{
                                padding: '12px 30px',
                                borderRadius: '8px',
                                border: 'none',
                                background: groupFeatureEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(150,150,150,0.3)',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: groupFeatureEnabled ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                        >
                            {groupFeatureEnabled ? '✓ GROUPS ON' : '✗ GROUPS OFF'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '20px' }}>Manage Seasons</h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Season Name (e.g., Season 1)"
                        className="input-field"
                        style={{ flex: 1, minWidth: '200px' }}
                        value={newSeason.name}
                        onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Date (e.g., Jan 2024)"
                        className="input-field"
                        style={{ flex: 1, minWidth: '150px' }}
                        value={newSeason.date}
                        onChange={(e) => setNewSeason({ ...newSeason, date: e.target.value })}
                    />
                    <select
                        className="input-field"
                        style={{ flex: 1, minWidth: '120px' }}
                        value={newSeason.status}
                        onChange={(e) => setNewSeason({ ...newSeason, status: e.target.value })}
                    >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Live">Live</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <button
                        onClick={editIndex !== null ? () => updateSeason(editIndex) : addSeason}
                        className="btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        <FaPlus /> {editIndex !== null ? 'Update' : 'Add Season'}
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Season Name</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Teams</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seasons.map((season, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px' }}>{season.name}</td>
                                    <td style={{ padding: '12px' }}>{season.date || '-'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            background: season.status === 'Live' ? 'rgba(0,255,0,0.1)' : season.status === 'Completed' ? 'rgba(150,150,150,0.1)' : 'rgba(255,165,0,0.1)',
                                            color: season.status === 'Live' ? 'var(--success)' : season.status === 'Completed' ? '#aaa' : 'orange'
                                        }}>
                                            {season.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>{getTotalTeamsCount(season)}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedSeasonIndex(selectedSeasonIndex === index ? null : index);
                                                    setSelectedDay('overall');
                                                }}
                                                style={{ background: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <FaUsers />
                                            </button>
                                            <button
                                                onClick={() => toggleOverall(index)}
                                                style={{ 
                                                    background: season.showOverall ? 'var(--accent-color)' : 'transparent', 
                                                    border: '1px solid var(--accent-color)', 
                                                    color: season.showOverall ? '#000' : 'var(--accent-color)', 
                                                    padding: '6px 12px', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem'
                                                }}
                                                title="Toggle Overall Ranking Display"
                                            >
                                                {season.showOverall ? 'OVERALL ON' : 'OVERALL OFF'}
                                            </button>
                                            <button
                                                onClick={() => startEdit(index)}
                                                style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => deleteSeason(index)}
                                                style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {seasons.length === 0 && (
                        <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No seasons added yet
                        </p>
                    )}
                </div>
            </div>

            {selectedSeasonIndex !== null && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Manage Teams - {seasons[selectedSeasonIndex].name}</h3>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedDay('overall')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: selectedDay === 'overall' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                background: selectedDay === 'overall' ? 'var(--accent-color)' : 'transparent',
                                color: selectedDay === 'overall' ? '#000' : '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Overall
                        </button>
                        {['day1', 'day2', 'day3', 'day4'].map(day => (
                            <button
                                key={day}
                                onClick={() => { setSelectedDay(day); setSelectedMatch('match1'); }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: selectedDay === day ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                    background: selectedDay === day ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Day {day.replace('day', '')}
                            </button>
                        ))}
                    </div>

                    {selectedDay !== 'overall' && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={() => setSelectedMatch('match1')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: selectedMatch === 'match1' ? '2px solid #10b981' : '1px solid var(--border-color)',
                                    background: selectedMatch === 'match1' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Match 1
                            </button>
                            <button
                                onClick={() => setSelectedMatch('match2')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: selectedMatch === 'match2' ? '2px solid #10b981' : '1px solid var(--border-color)',
                                    background: selectedMatch === 'match2' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Match 2
                            </button>
                        </div>
                    )}

                    {selectedDay !== 'overall' && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '15px', color: 'var(--accent-color)', fontSize: '1rem' }}>Add Team to {selectedMatch === 'match1' ? 'Match 1' : 'Match 2'}</h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Team Name</label>
                                    <select
                                        className="input-field"
                                        value={selectedTeamName}
                                        onChange={(e) => setSelectedTeamName(e.target.value)}
                                    >
                                        <option value="">Select Team</option>
                                        {(() => {
                                            const filteredTeams = allTeams.filter(team => {
                                                if (!groupFeatureEnabled || !selectedGroup) return true;
                                                return team.assignedGroup === selectedGroup;
                                            });
                                            
                                            if (filteredTeams.length === 0 && selectedGroup) {
                                                return <option disabled>No teams in Group {selectedGroup}</option>;
                                            }
                                            
                                            return filteredTeams.map((team, idx) => (
                                                <option key={idx} value={team.teamName}>
                                                    {team.teamName} {team.slotNumber ? `(#${team.slotNumber})` : ''}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                </div>

                                {groupFeatureEnabled && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Group</label>
                                        <select
                                            className="input-field"
                                            style={{ 
                                                background: selectedGroup === 'A' ? 'rgba(0, 150, 255, 0.15)' : selectedGroup === 'B' ? 'rgba(255, 100, 0, 0.15)' : 'transparent',
                                                borderColor: selectedGroup === 'A' ? '#0096ff' : selectedGroup === 'B' ? '#ff6400' : 'var(--border-color)',
                                                color: selectedGroup === 'A' ? '#0096ff' : selectedGroup === 'B' ? '#ff6400' : '#fff',
                                                fontWeight: selectedGroup ? 'bold' : 'normal'
                                            }}
                                            value={selectedGroup}
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                        >
                                            <option value="" style={{ background: '#1a1d2e', color: '#fff' }}>No Group</option>
                                            <option value="A" style={{ background: '#1a1d2e', color: '#0096ff' }}>Group A</option>
                                            <option value="B" style={{ background: '#1a1d2e', color: '#ff6400' }}>Group B</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Place Rank</label>
                                    <select
                                        className="input-field"
                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#fff' }}
                                        value={selectedRank}
                                        onChange={(e) => handleRankChange(e.target.value)}
                                    >
                                        <option value="" style={{ background: '#1a1d2e', color: '#fff' }}>Select Rank</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(r => (
                                            <option key={r} value={r} style={{ background: '#1a1d2e', color: '#fff' }}>
                                                {r}{r===1?'st':r===2?'nd':r===3?'rd':'th'} ({r<=8 ? [10,6,5,4,3,2,1,1][r-1] : 0}pts)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Place Points</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ background: 'rgba(100,100,100,0.2)', cursor: 'not-allowed' }}
                                        value={teamStats.placePoints}
                                        readOnly
                                        title="Auto-calculated from rank"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kill Points</label>
                                    <input
                                        type="number"
                                        placeholder="Enter kills"
                                        className="input-field"
                                        value={teamStats.killPoints}
                                        onChange={(e) => setTeamStats({ ...teamStats, killPoints: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Points</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ background: 'rgba(59, 130, 246, 0.2)', cursor: 'not-allowed', fontWeight: 'bold', color: 'var(--accent-color)' }}
                                        value={calculateTotalPoints(teamStats.placePoints, teamStats.killPoints)}
                                        readOnly
                                        title="Auto: Place + Kill"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={addTeamToSeason}
                                className="btn-primary"
                                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}
                            >
                                <FaPlus /> Add Team to {selectedMatch === 'match1' ? 'Match 1' : 'Match 2'}
                            </button>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Team Name</th>
                                    {groupFeatureEnabled && <th style={{ padding: '12px', textAlign: 'center' }}>Group</th>}
                                    <th style={{ padding: '12px', textAlign: 'center' }}>WWCD</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Place Pts</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Kill Pts</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Total</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Remarks</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCurrentDayTeams().map((team, teamIndex) => (
                                    <tr key={teamIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>#{teamIndex + 1}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{team.teamName}</td>
                                        {groupFeatureEnabled && (
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {team.group ? (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        background: team.group === 'A' ? 'rgba(0, 150, 255, 0.2)' : 'rgba(255, 100, 0, 0.2)',
                                                        color: team.group === 'A' ? '#0096ff' : '#ff6400',
                                                        border: `1px solid ${team.group === 'A' ? '#0096ff' : '#ff6400'}`
                                                    }}>
                                                        {team.group}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        )}
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {editingStats.index === teamIndex ? (
                                                <input type="number" value={editingStats.wwcd} onChange={(e) => handleEditStatsChange('wwcd', e.target.value)} style={{width: '50px', padding: '4px', textAlign: 'center', MozAppearance: 'textfield'}} className="no-spinner" />
                                            ) : (team.wwcd || 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {editingStats.index === teamIndex ? (
                                                <input type="number" value={editingStats.placePoints} onChange={(e) => handleEditStatsChange('placePoints', e.target.value)} style={{width: '60px', padding: '4px', textAlign: 'center', MozAppearance: 'textfield'}} className="no-spinner" />
                                            ) : (team.placePoints || 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {editingStats.index === teamIndex ? (
                                                <input type="number" value={editingStats.killPoints} onChange={(e) => handleEditStatsChange('killPoints', e.target.value)} style={{width: '60px', padding: '4px', textAlign: 'center', MozAppearance: 'textfield'}} className="no-spinner" />
                                            ) : (team.killPoints || 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                            {editingStats.index === teamIndex ? (
                                                <span style={{display: 'inline-block', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px'}}>
                                                    {calculateTotalPoints(editingStats.placePoints, editingStats.killPoints)}
                                                </span>
                                            ) : (team.totalPoints || 0)}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {selectedDay !== 'overall' && editingTeam === teamIndex ? (
                                                <select
                                                    className="input-field"
                                                    style={{ padding: '6px', fontSize: '0.85rem' }}
                                                    defaultValue={team.remarks || ''}
                                                    onChange={(e) => updateTeamRemarks(selectedSeasonIndex, teamIndex, e.target.value)}
                                                    onBlur={() => setEditingTeam(null)}
                                                    autoFocus
                                                >
                                                    <option value="">No Remarks</option>
                                                    <option value="Disqualified">Disqualified</option>
                                                    <option value="Banned">Banned</option>
                                                    <option value="Warning">Warning</option>
                                                    <option value="Cheating">Cheating</option>
                                                </select>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {team.remarks ? (
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            background: team.remarks.toLowerCase().includes('disqualif') || team.remarks.toLowerCase().includes('ban') || team.remarks.toLowerCase().includes('cheat') ? 'rgba(255,0,0,0.1)' : 'rgba(255,165,0,0.1)',
                                                            color: team.remarks.toLowerCase().includes('disqualif') || team.remarks.toLowerCase().includes('ban') || team.remarks.toLowerCase().includes('cheat') ? 'var(--danger)' : 'orange',
                                                            border: `1px solid ${team.remarks.toLowerCase().includes('disqualif') || team.remarks.toLowerCase().includes('ban') || team.remarks.toLowerCase().includes('cheat') ? 'var(--danger)' : 'orange'}`
                                                        }}>
                                                            {team.remarks}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                                                    )}
                                                    {selectedDay !== 'overall' && (
                                                        <button
                                                            onClick={() => setEditingTeam(teamIndex)}
                                                            style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {editingStats.index === teamIndex ? (
                                                    <button
                                                        onClick={() => saveEditStats(selectedSeasonIndex, teamIndex)}
                                                        style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                    >
                                                        Save
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditStats(teamIndex, team)}
                                                        style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>
                                                )}
                                                {selectedDay !== 'overall' && (
                                                    <button
                                                        onClick={() => deleteTeam(selectedSeasonIndex, teamIndex)}
                                                        style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {getCurrentDayTeams().length === 0 && (
                            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No teams added yet
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeasonsManager;
