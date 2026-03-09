import React, { useState, useEffect, useRef } from 'react';
import { FaSave, FaTrash, FaPlus, FaSortAmountDown, FaDownload, FaInstagram, FaYoutube, FaSync } from 'react-icons/fa';
import html2canvas from 'html2canvas';

const PointsTableProManager = ({ teams, pointsTable, onUpdate, tournamentInfo }) => {
    const [localData, setLocalData] = useState([]);
    const [activeTemplate, setActiveTemplate] = useState('poster'); // 'poster' or 'thumbnail'
    const captureRef = useRef(null);

    useEffect(() => {
        const approvedTeams = teams.filter(t => (t.status === 'Approved' || t.status === 'approved'));

        if (pointsTable && pointsTable.length > 0) {
            const existingNames = pointsTable.map(p => p.teamName.toLowerCase());
            const missingTeams = approvedTeams
                .filter(t => !existingNames.includes(t.teamName.toLowerCase()))
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
        if (field === 'teamName') {
            updated[index][field] = value;
        } else {
            updated[index][field] = parseInt(value) || 0;
            // Auto calculate total
            if (field === 'finishes' || field === 'placementPoints') {
                updated[index].totalPoints = updated[index].finishes + updated[index].placementPoints;
            }
        }
        setLocalData(updated);
    };

    const addTeamRow = () => {
        setLocalData([...localData, {
            teamName: 'NEW TEAM',
            played: 0,
            wwcd: 0,
            finishes: 0,
            placementPoints: 0,
            totalPoints: 0
        }]);
    };

    const removeRow = (index) => {
        if (window.confirm("Remove this team?")) {
            setLocalData(localData.filter((_, i) => i !== index));
        }
    };

    const sortTable = () => {
        const sorted = [...localData].sort((a, b) => b.totalPoints - a.totalPoints || b.finishes - a.finishes);
        setLocalData(sorted);
    };

    const exportImage = async () => {
        if (captureRef.current) {
            const canvas = await html2canvas(captureRef.current, {
                scale: 2,
                backgroundColor: '#0d0e23',
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `BGMI_Standings_${tournamentInfo.currentDay || 'LIVE'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div className="pro-manager-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '30px' }}>

                {/* ── Left Side: Editor ── */}
                <div className="card" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Active Standings Data</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={sortTable} className="btn-secondary" title="Sort Teams"><FaSortAmountDown /></button>
                            <button onClick={addTeamRow} className="btn-secondary" title="Add Team"><FaPlus /></button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--accent-color)' }}>
                                    <th>#</th>
                                    <th>Team Name</th>
                                    <th>Rank Helper</th>
                                    <th>+ Finishes</th>
                                    <th>MP</th>
                                    <th>F</th>
                                    <th>PP</th>
                                    <th>Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {localData.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <input
                                                className="input-field"
                                                style={{ padding: '4px', width: '100px' }}
                                                value={row.teamName}
                                                onChange={(e) => handleCellChange(idx, 'teamName', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className="input-field"
                                                style={{ padding: '2px', width: '70px' }}
                                                onChange={(e) => {
                                                    const rank = parseInt(e.target.value);
                                                    if (rank > 0) {
                                                        const pts = rank <= 10 ? (11 - rank) : 0;
                                                        const updated = [...localData];
                                                        updated[idx].placementPoints += pts;
                                                        updated[idx].played += 1;
                                                        if (rank === 1) updated[idx].wwcd = (updated[idx].wwcd || 0) + 1;
                                                        updated[idx].totalPoints = (updated[idx].finishes || 0) + updated[idx].placementPoints;
                                                        setLocalData(updated);
                                                        e.target.value = "0";
                                                    }
                                                }}
                                            >
                                                <option value="0">Rank</option>
                                                {[...Array(20)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ width: '50px', border: '1px solid var(--accent-color)' }}
                                                placeholder="+F"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) {
                                                            const updated = [...localData];
                                                            updated[idx].finishes = (updated[idx].finishes || 0) + val;
                                                            updated[idx].totalPoints = updated[idx].finishes + (updated[idx].placementPoints || 0);
                                                            setLocalData(updated);
                                                            e.target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td><input type="number" className="input-field" style={{ width: '35px' }} value={row.played} onChange={(e) => handleCellChange(idx, 'played', e.target.value)} /></td>
                                        <td><input type="number" className="input-field" style={{ width: '35px' }} value={row.finishes || 0} onChange={(e) => handleCellChange(idx, 'finishes', e.target.value)} /></td>
                                        <td><input type="number" className="input-field" style={{ width: '35px' }} value={row.placementPoints || 0} onChange={(e) => handleCellChange(idx, 'placementPoints', e.target.value)} /></td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{row.totalPoints}</td>
                                        <td><button onClick={() => removeRow(idx)} style={{ color: 'var(--danger)', background: 'transparent' }}><FaTrash /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--text-muted)' }}>
                        💡 <b>Helper Tips:</b> Rank Helper adds pts & match played. "+ Finishes" adds kills (Press Enter).
                    </div>

                    <button
                        onClick={() => onUpdate(localData)}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <FaSave /> Save Overall Standings
                    </button>
                </div>

                {/* ── Right Side: Professional Graphic Preview ── */}
                <div className="preview-container">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button onClick={() => setActiveTemplate('poster')} className={`btn-secondary ${activeTemplate === 'poster' ? 'active' : ''}`}><FaInstagram /> Poster</button>
                        <button onClick={() => setActiveTemplate('thumbnail')} className={`btn-secondary ${activeTemplate === 'thumbnail' ? 'active' : ''}`}><FaYoutube /> Thumbnail</button>
                        <button onClick={exportImage} className="btn-primary" style={{ marginLeft: 'auto' }}><FaDownload /> Download Image</button>
                    </div>

                    <div className="mini-preview-wrap" style={{
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                        width: activeTemplate === 'poster' ? '800px' : '1280px',
                        height: activeTemplate === 'poster' ? '1000px' : '720px'
                    }}>
                        <div
                            ref={captureRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: '#0d0e23',
                                padding: '40px',
                                fontFamily: "'Montserrat', sans-serif",
                                color: '#fff',
                                position: 'relative'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ color: '#a0a0ff', letterSpacing: '5px', textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '10px' }}>
                                    INDIA | {tournamentInfo.tournamentName?.toUpperCase() || 'SEASON 1'} | CHALLENGE
                                </div>
                                <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                                    {tournamentInfo.subTitle || 'OVERALL STANDINGS'} <span style={{ color: '#ff3e3e', fontStyle: 'italic' }}>{tournamentInfo.currentDay || 'LIVE'}</span>
                                </h1>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>RANK</th>
                                        <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                                        <th style={thStyle}>🍗</th>
                                        <th style={thStyle}>MATCHES</th>
                                        <th style={thStyle}>PLACE PTS.</th>
                                        <th style={thStyle}>FINISHES</th>
                                        <th style={{ ...thStyle, background: '#ff3e3e', color: '#fff' }}>TOTAL PTS.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localData.slice(0, activeTemplate === 'poster' ? 14 : 9).map((team, idx) => (
                                        <tr key={idx} style={{ background: idx < 3 ? 'rgba(255,255,255,0.03)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={tdStyle}>{idx + 1}</td>
                                            <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 900 }}>{team.teamName}</td>
                                            <td style={tdStyle}>{team.wwcd || 0}</td>
                                            <td style={tdStyle}>{team.played || 0}</td>
                                            <td style={tdStyle}>{team.placementPoints || 0}</td>
                                            <td style={tdStyle}>{team.finishes || 0}</td>
                                            <td style={{ ...tdStyle, color: '#ff3e3e', fontSize: '1.6rem', fontWeight: 900, background: 'rgba(255,62,62,0.08)', borderLeft: '2px solid #333' }}>
                                                {team.totalPoints || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ position: 'absolute', bottom: '30px', width: 'calc(100% - 80px)', display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>BGMI<span style={{ color: '#ff3e3e' }}>TOURNEY</span></div>
                                <div style={{ textAlign: 'right', color: '#a0a0ff', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                    {tournamentInfo.footerText || 'ACTION RESUMES DAILY'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const thStyle = { background: 'rgba(255,255,255,0.05)', color: '#a0a0ff', padding: '15px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800, borderBottom: '2px solid #333' };
const tdStyle = { padding: '12px 15px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' };

export default PointsTableProManager;
