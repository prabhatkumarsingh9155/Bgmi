import React from 'react';

const TeamsTable = ({ teams, tdmMatches, searchTerm, setSearchTerm, downloadCSV, onAssignSlot, onApprove, onReject, onDelete, onViewProofs }) => {
    const [category, setCategory] = React.useState('all');

    const getTdmStatus = (team) => {
        if (team.regMode !== 'tdm') return { label: '-', color: '#aaa', bg: 'rgba(150,150,150,0.1)' };
        const displayName = team.regType === 'solo' ? (team.player1Name || team.teamName) : team.teamName;
        const matches = (tdmMatches || []).filter(m => m.team1 === displayName || m.team2 === displayName);
        if (matches.length === 0) return { label: 'Awaiting R1', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };

        const latestMatch = [...matches].sort((a, b) => b.round - a.round)[0];

        if (latestMatch.winner) {
            if (latestMatch.winner === displayName) {
                return { label: `R${latestMatch.round}: Success`, color: 'var(--success)', bg: 'rgba(0,255,80,0.1)' };
            } else {
                return { label: `R${latestMatch.round}: Out`, color: 'var(--danger)', bg: 'rgba(255,0,0,0.1)' };
            }
        }

        if (latestMatch.status === 'Live') return { label: `R${latestMatch.round}: LIVE`, color: 'var(--accent-color)', bg: 'rgba(255,165,0,0.2)' };
        return { label: `R${latestMatch.round}: In Progress`, color: '#0096ff', bg: 'rgba(0,150,255,0.1)' };
    };

    const filteredTeams = teams.filter(t => {
        const matchesSearch = t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.captainName && t.captainName.toLowerCase().includes(searchTerm.toLowerCase()));

        if (category === 'all') return matchesSearch;
        if (category === 'standard') return matchesSearch && t.regMode !== 'tdm';
        if (category === 'tdm-solo') return matchesSearch && t.regMode === 'tdm' && t.regType === 'solo';
        if (category === 'tdm-duo') return matchesSearch && t.regMode === 'tdm' && t.regType === 'duo';
        if (category === 'tdm-squad') return matchesSearch && t.regMode === 'tdm' && t.regType === 'squad';
        return matchesSearch;
    });

    const categories = [
        { id: 'all', name: 'All Teams', count: teams.length, accent: 'var(--accent-color)' },
        { id: 'standard', name: 'Squad', count: teams.filter(t => t.regMode !== 'tdm').length, accent: '#00dc50' },
        { id: 'tdm-solo', name: 'TDM Solo', count: teams.filter(t => t.regMode === 'tdm' && t.regType === 'solo').length, accent: '#0096ff' },
        { id: 'tdm-duo', name: 'TDM Duo', count: teams.filter(t => t.regMode === 'tdm' && t.regType === 'duo').length, accent: '#00c3ff' },
        { id: 'tdm-squad', name: 'TDM Squad', count: teams.filter(t => t.regMode === 'tdm' && t.regType === 'squad').length, accent: '#00fff2' },
    ];

    return (
        <>
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--accent-color) transparent'
            }}>
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className="stat-card"
                        style={{
                            borderLeft: `4px solid ${category === cat.id ? cat.accent : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            background: category === cat.id ? `${cat.accent}18` : 'var(--bg-secondary)',
                            transition: 'all 0.2s',
                            transform: category === cat.id ? 'translateY(-3px)' : 'none',
                            boxShadow: category === cat.id ? `0 4px 20px ${cat.accent}30` : 'none',
                            minWidth: '130px',
                            flexShrink: 0,
                        }}
                    >
                        <h3 style={{ color: category === cat.id ? cat.accent : '#fff', marginBottom: '4px' }}>{cat.count}</h3>
                        <p style={{ color: category === cat.id ? cat.accent : 'var(--text-muted)', opacity: category === cat.id ? 1 : 0.7, whiteSpace: 'nowrap' }}>{cat.name}</p>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search within this category..."
                    className="input-field"
                    style={{ width: 'auto', flexGrow: 1 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={downloadCSV} className="btn-primary">Download CSV</button>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Slot</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Team Name</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Group</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Captain Name</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Phone</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Email</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Players</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>TDM Status</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Status</th>
                                <th style={{ padding: '15px', whiteSpace: 'nowrap' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeams.map((team, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>#{team.slotNumber || 'Pending'}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {team.regMode === 'tdm' && team.regType === 'solo' ? (team.player1Name || team.teamName) : team.teamName}
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                        {team.group ? (
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                background: team.group === 'A' ? 'rgba(0, 150, 255, 0.1)' : 'rgba(255, 100, 0, 0.1)',
                                                color: team.group === 'A' ? '#0096ff' : '#ff6400',
                                                textTransform: 'uppercase'
                                            }}>
                                                Group {team.group}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap', opacity: (team.regMode === 'tdm' && team.regType === 'solo') ? 0.3 : 1 }}>
                                        {(team.regMode === 'tdm' && team.regType === 'solo') ? '---' : team.captainName}
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap', fontWeight: '500' }}>{team.captainPhone || '---'}</td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>{team.email || team.captainEmail}</td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {team.regMode === 'tdm' && team.regType === 'solo' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                                                    <span style={{ background: 'rgba(0,150,255,0.1)', color: '#0096ff', fontSize: '0.65rem', fontWeight: '900', padding: '1px 5px', borderRadius: '3px' }}>SOLO</span>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{team.player1Name}</span>
                                                </div>
                                            ) : (
                                                [
                                                    { label: 'P1', name: team.player1Name },
                                                    { label: 'P2', name: team.player2Name },
                                                    { label: 'P3', name: team.player3Name },
                                                    { label: 'P4', name: team.player4Name },
                                                ].filter(p => p.name).map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                                                        <span style={{
                                                            background: 'rgba(255,255,255,0.07)',
                                                            color: 'var(--accent-color)',
                                                            fontSize: '0.65rem',
                                                            fontWeight: '900',
                                                            padding: '1px 5px',
                                                            borderRadius: '3px',
                                                            minWidth: '22px',
                                                            textAlign: 'center'
                                                        }}>{p.label}</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                        {(() => {
                                            const s = getTdmStatus(team);
                                            return (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    background: s.bg,
                                                    color: s.color,
                                                    textTransform: 'uppercase',
                                                    whiteSpace: 'nowrap',
                                                    border: `1px solid ${s.color}33`
                                                }}>
                                                    {s.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            background: team.status === 'Approved' ? 'rgba(0, 255, 0, 0.1)' : team.status === 'Rejected' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                                            color: team.status === 'Approved' ? 'var(--success)' : team.status === 'Rejected' ? 'var(--danger)' : 'orange',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {team.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                                            <button
                                                onClick={() => onViewProofs(team)}
                                                style={{ color: '#fff', background: 'var(--accent-color)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                VIEW PROOFS
                                            </button>
                                            <button
                                                onClick={() => onAssignSlot(team, team.slotNumber)}
                                                style={{ color: 'var(--accent-color)', background: 'transparent', border: '1px solid var(--accent-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                ASSIGN SLOT
                                            </button>
                                            {team.status !== 'Approved' && (
                                                <button
                                                    onClick={() => onApprove(team)}
                                                    style={{ color: 'var(--success)', background: 'transparent', border: '1px solid var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    APPROVE
                                                </button>
                                            )}
                                            {team.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => onReject(team)}
                                                    style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    REJECT
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(team)}
                                                style={{ color: 'var(--danger)', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                DELETE
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTeams.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>No teams found.</p>}
            </div>
        </>
    );
};

export default TeamsTable;
