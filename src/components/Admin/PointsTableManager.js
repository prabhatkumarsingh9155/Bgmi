import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaSortAmountDown } from 'react-icons/fa';
import { calculateTotalPoints, calculateFromRank } from '../../utils/pointsCalculator';

const PointsTableManager = ({ teams, pointsTable, onUpdate }) => {
    const [localData, setLocalData] = useState([]);

    useEffect(() => {
        const approvedTeams = teams.filter(t => (t.status === 'Approved' || t.status === 'approved'));

        if (pointsTable && pointsTable.length > 0) {
            // Merge logic: Keep existing points data, add only missing approved teams
            const existingTeamNames = pointsTable.map(p => p.teamName.toLowerCase());

            const missingTeams = approvedTeams
                .filter(t => !existingTeamNames.includes(t.teamName.toLowerCase()))
                .map(t => ({
                    teamName: t.teamName,
                    played: 0,
                    wwcd: 0,
                    finishes: 0,
                    placementPoints: 0,
                    totalPoints: 0
                }));

            if (missingTeams.length > 0) {
                setLocalData([...pointsTable, ...missingTeams]);
            } else {
                setLocalData(pointsTable);
            }
        } else {
            // Initialize with all approved teams if table is empty
            const initial = approvedTeams.map(t => ({
                teamName: t.teamName,
                played: 0,
                wwcd: 0,
                finishes: 0,
                placementPoints: 0,
                totalPoints: 0
            }));
            setLocalData(initial);
        }
    }, [pointsTable, teams]);

    const handleCellChange = (index, field, value) => {
        const updated = [...localData];
        const val = parseInt(value) || 0;
        updated[index][field] = val;

        // Auto calculate total using utility function
        updated[index].totalPoints = calculateTotalPoints(
            updated[index].placementPoints,
            updated[index].finishes
        );

        setLocalData(updated);
    };

    const addTeamRow = () => {
        const teamName = prompt("Enter Team Name:");
        if (teamName) {
            setLocalData([...localData, {
                teamName,
                played: 0,
                wwcd: 0,
                finishes: 0,
                placementPoints: 0,
                totalPoints: 0
            }]);
        }
    };

    const removeRow = (index) => {
        if (window.confirm("Remove this team from points table?")) {
            setLocalData(localData.filter((_, i) => i !== index));
        }
    };

    const sortTable = () => {
        const sorted = [...localData].sort((a, b) => b.totalPoints - a.totalPoints || b.wwcd - a.wwcd);
        setLocalData(sorted);
    };

    return (
        <div className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Tournament Points Table</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={sortTable} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSortAmountDown /> Sort by Points
                    </button>
                    <button onClick={addTeamRow} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaPlus /> Add Team
                    </button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--accent-color)' }}>
                        <th style={{ padding: '12px' }}>Rank</th>
                        <th style={{ padding: '12px' }}>Team Name</th>
                        <th style={{ padding: '12px' }}>Match Rank Helper</th>
                        <th style={{ padding: '12px' }}>MP</th>
                        <th style={{ padding: '12px' }}>WWCD</th>
                        <th style={{ padding: '12px' }}>Finishes</th>
                        <th style={{ padding: '12px' }}>Placement</th>
                        <th style={{ padding: '12px' }}>Total</th>
                        <th style={{ padding: '12px' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {localData.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px' }}>{idx + 1}</td>
                            <td style={{ padding: '12px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ padding: '5px', fontSize: '0.9rem' }}
                                    value={row.teamName}
                                    onChange={(e) => {
                                        const updated = [...localData];
                                        updated[idx].teamName = e.target.value;
                                        setLocalData(updated);
                                    }}
                                />
                            </td>
                            <td style={{ padding: '12px' }}>
                                <select
                                    className="input-field"
                                    style={{ width: '80px', padding: '5px' }}
                                    onChange={(e) => {
                                        const rank = parseInt(e.target.value);
                                        if (rank > 0) {
                                            const updated = [...localData];
                                            const calculated = calculateFromRank(rank, updated[idx]);
                                            updated[idx].placementPoints = calculated.placementPoints;
                                            updated[idx].played = calculated.played;
                                            updated[idx].wwcd = calculated.wwcd;
                                            updated[idx].totalPoints = calculateTotalPoints(
                                                updated[idx].placementPoints,
                                                updated[idx].finishes
                                            );
                                            setLocalData(updated);
                                            e.target.value = "0"; // Reset
                                        }
                                    }}
                                >
                                    <option value="0">Add Match Rank</option>
                                    {[...Array(20)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}{i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'}</option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <input type="number" className="input-field" style={{ width: '60px', padding: '5px' }} value={row.played} onChange={(e) => handleCellChange(idx, 'played', e.target.value)} />
                            </td>
                            <td style={{ padding: '12px' }}>
                                <input type="number" className="input-field" style={{ width: '60px', padding: '5px' }} value={row.wwcd} onChange={(e) => handleCellChange(idx, 'wwcd', e.target.value)} />
                            </td>
                            <td style={{ padding: '12px' }}>
                                <input type="number" className="input-field" style={{ width: '60px', padding: '5px' }} value={row.finishes} onChange={(e) => handleCellChange(idx, 'finishes', e.target.value)} />
                            </td>
                            <td style={{ padding: '12px' }}>
                                <input type="number" className="input-field" style={{ width: '70px', padding: '5px' }} value={row.placementPoints} onChange={(e) => handleCellChange(idx, 'placementPoints', e.target.value)} />
                            </td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{row.totalPoints}</td>
                            <td style={{ padding: '12px' }}>
                                <button onClick={() => removeRow(idx)} style={{ color: 'var(--danger)', background: 'transparent' }}><FaTrash /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ℹ️ Use "Add Match Rank" to automatically add placement points (1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1) + 1pt per kill. Total auto-calculates.
            </div>

            {localData.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No data in points table.</p>
            )}

            <button
                onClick={() => onUpdate(localData)}
                className="btn-primary"
                style={{ width: '100%', marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
                <FaSave /> Save Points Table
            </button>
        </div>
    );
};

export default PointsTableManager;
