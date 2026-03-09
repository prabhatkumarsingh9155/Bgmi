import { FaGamepad, FaClock, FaCheckCircle, FaLock, FaUser, FaUsers, FaUserSecret } from 'react-icons/fa';

const TDMManager = ({ tournamentInfo, setTournamentInfo, onUpdate }) => {
    const handleChange = (mode, field, value) => {
        const tdmSettings = tournamentInfo.tdmSettings || {
            solo: { status: 'Live' },
            duo: { status: 'Live' },
            squad: { status: 'Live' }
        };

        const updatedSettings = {
            ...tdmSettings,
            [mode]: {
                ...tdmSettings[mode],
                [field]: value
            }
        };

        setTournamentInfo(prev => ({
            ...prev,
            tdmSettings: updatedSettings
        }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Live': return <FaCheckCircle style={{ color: 'var(--success)' }} />;
            case 'Coming Soon': return <FaClock style={{ color: 'var(--warning)' }} />;
            case 'Hidden': return <FaLock style={{ color: 'var(--danger)' }} />;
            default: return null;
        }
    };

    const modes = [
        { id: 'solo', name: 'TDM SOLO', icon: <FaUser /> },
        { id: 'duo', name: 'TDM DUO', icon: <FaUsers /> },
        { id: 'squad', name: 'TDM SQUAD', icon: <FaUserSecret /> }
    ];

    const tdmSettings = tournamentInfo.tdmSettings || {
        solo: { status: 'Live' },
        duo: { status: 'Live' },
        squad: { status: 'Live' }
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaGamepad color="var(--accent-color)" /> TDM Mode Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Control which TDM modes are active, coming soon, or hidden from users.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {modes.map(mode => (
                    <div key={mode.id} className="tdm-admin-card" style={{
                        background: 'var(--bg-tertiary)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{mode.icon}</span>
                            <div>
                                <h4 style={{ margin: 0 }}>{mode.name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                    Current: {getStatusIcon(tdmSettings[mode.id]?.status)} {tdmSettings[mode.id]?.status || 'Live'}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '15px',
                            alignItems: 'end'
                        }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Winner Prize</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                                    placeholder="e.g. ₹500"
                                    value={tdmSettings[mode.id]?.prize || ''}
                                    onChange={(e) => handleChange(mode.id, 'prize', e.target.value)}
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Status</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                                    value={tdmSettings[mode.id]?.status || 'Live'}
                                    onChange={(e) => handleChange(mode.id, 'status', e.target.value)}
                                >
                                    <option value="Live">Live</option>
                                    <option value="Coming Soon">Soon</option>
                                    <option value="Hidden">Hidden</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '40px' }}>
                <button
                    onClick={onUpdate}
                    className="btn-primary"
                    style={{ width: '100%', padding: '15px' }}
                >
                    Save TDM Settings
                </button>
            </div>
        </div>
    );
};

export default TDMManager;
