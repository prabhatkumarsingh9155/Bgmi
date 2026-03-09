import React from 'react';

const HomeEditor = ({ tournamentInfo, setTournamentInfo, onUpdate }) => {
    const handleChange = (field, value) => {
        setTournamentInfo(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* ── HOME PAGE LIVE DATA (DISTINCT SECTION) ── */}
            <div style={{
                padding: '25px',
                background: 'linear-gradient(145deg, rgba(255, 170, 0, 0.08) 0%, rgba(22, 24, 31, 0.5) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 170, 0, 0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    fontSize: '80px',
                    opacity: '0.05',
                    color: 'var(--accent-color)',
                    pointerEvents: 'none'
                }}>🏠</div>

                <div style={{ borderLeft: '4px solid var(--accent-color)', paddingLeft: '15px', marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--accent-color)', margin: 0, fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🌍 Home Page Live Data
                    </h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Update the main content of your home page in real-time.
                    </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onUpdate(); }}>
                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📝 Hero Description Text
                        </label>
                        <textarea
                            className="input-field"
                            rows="3"
                            value={tournamentInfo.homeHeroDescription || ''}
                            onChange={e => handleChange('homeHeroDescription', e.target.value)}
                            placeholder="e.g. Join the ultimate BGMI showdown. Register your squad and dominate..."
                            style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,170,0,0.1)' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div className="input-group">
                            <label className="input-label">👥 Teams Count (Stat)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.homeTeamsCount || ''}
                                onChange={e => handleChange('homeTeamsCount', e.target.value)}
                                placeholder="e.g. 100+"
                                style={{ background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">💰 Prize Highlight</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.homePrizePool || ''}
                                onChange={e => handleChange('homePrizePool', e.target.value)}
                                placeholder="e.g. ₹50K"
                                style={{ background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">⚡ Status Label</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.homeStatusText || ''}
                                onChange={e => handleChange('homeStatusText', e.target.value)}
                                placeholder="e.g. Live"
                                style={{ background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="input-group">
                            <label className="input-label">📱 WhatsApp Group Link</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.whatsappLink || ''}
                                onChange={e => handleChange('whatsappLink', e.target.value)}
                                placeholder="https://chat.whatsapp.com/..."
                                style={{ background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">📸 Instagram Profile Link</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.instagramLink || ''}
                                onChange={e => handleChange('instagramLink', e.target.value)}
                                placeholder="https://instagram.com/..."
                                style={{ background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save Home Updates</button>
                </form>
            </div>
        </div>
    );
};

export default HomeEditor;
