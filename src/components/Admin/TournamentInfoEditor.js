import React, { useState } from 'react';

const TournamentInfoEditor = ({ tournamentInfo, setTournamentInfo, onUpdate, onFillDummy }) => {
    const handleChange = (field, value) => {
        setTournamentInfo(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>Edit Tournament Information</h3>
                <button type="button" onClick={onFillDummy} className="btn-secondary">Fill Dummy Data</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onUpdate(); }}>

                {/* ── TOURNAMENT IDENTITY ── */}
                {/* ── REST OF TOURNAMENT INFO ── */}

                {/* ── Prizes & Fees ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group">
                        <label className="input-label">🏆 Tournament Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={tournamentInfo.tournamentName || ''}
                            onChange={e => handleChange('tournamentName', e.target.value)}
                            placeholder="e.g. BGMI Season 1"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">📡 Tournament Status</label>
                        <select
                            className="input-field"
                            value={tournamentInfo.tournamentStatus || 'Upcoming'}
                            onChange={e => handleChange('tournamentStatus', e.target.value)}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="Upcoming">🟡 Upcoming</option>
                            <option value="Live">🟢 Live</option>
                            <option value="Closed">🔴 Closed</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group">
                        <label className="input-label">📅 Current Day Tag (e.g. DAY 4)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={tournamentInfo.currentDay || ''}
                            onChange={e => handleChange('currentDay', e.target.value)}
                            placeholder="e.g. DAY 4"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">🔖 Top Headline (e.g. OVERALL STANDINGS)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={tournamentInfo.subTitle || ''}
                            onChange={e => handleChange('subTitle', e.target.value)}
                            placeholder="e.g. OVERALL STANDINGS"
                        />
                    </div>
                </div>

                <div className="editor-grid">
                    <div className="input-group">
                        <label className="input-label">1st Prize 🥇</label>
                        <input type="text" className="input-field" value={tournamentInfo.firstPrize || ''} onChange={e => handleChange('firstPrize', e.target.value)} placeholder="e.g. ₹30,000" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">2nd Prize 🥈</label>
                        <input type="text" className="input-field" value={tournamentInfo.secondPrize || ''} onChange={e => handleChange('secondPrize', e.target.value)} placeholder="e.g. ₹15,000" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">3rd Prize 🥉</label>
                        <input type="text" className="input-field" value={tournamentInfo.thirdPrize || ''} onChange={e => handleChange('thirdPrize', e.target.value)} placeholder="e.g. ₹5,000" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">MVP Prize 🏆</label>
                        <input type="text" className="input-field" value={tournamentInfo.mvpPrize || ''} onChange={e => handleChange('mvpPrize', e.target.value)} placeholder="e.g. ₹3,000" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Total Matches 🎮</label>
                        <input type="text" className="input-field" value={tournamentInfo.totalMatches || ''} onChange={e => handleChange('totalMatches', e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Daily Matches 📅</label>
                        <input type="text" className="input-field" value={tournamentInfo.dailyMatches || ''} onChange={e => handleChange('dailyMatches', e.target.value)} placeholder="e.g. 5 Matches Daily" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Today's Match 🔥</label>
                        <input type="text" className="input-field" value={tournamentInfo.todayMatches || ''} onChange={e => handleChange('todayMatches', e.target.value)} placeholder="e.g. Match 3 Live" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Registration Fee</label>
                        <input type="text" className="input-field" value={tournamentInfo.registrationFee || ''} onChange={e => handleChange('registrationFee', e.target.value)} />
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">Fee Description</label>
                    <input type="text" className="input-field" value={tournamentInfo.feeDescription || ''} onChange={e => handleChange('feeDescription', e.target.value)} />
                </div>

                {/* Rules Section */}
                <div className="input-group">
                    <label className="input-label">Rules (JSON Array)</label>
                    <textarea
                        className="input-field"
                        rows="6"
                        value={JSON.stringify(tournamentInfo.rules || [], null, 2)}
                        onChange={e => {
                            try {
                                handleChange('rules', JSON.parse(e.target.value));
                            } catch (err) { }
                        }}
                        placeholder='["✅ Rule 1", "✅ Rule 2"]'
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Tournament Info</button>
            </form>
        </div>
    );
};

export default TournamentInfoEditor;
