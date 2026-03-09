import React from 'react';

const ScheduleManager = ({ tournamentInfo, setTournamentInfo, onUpdate, onFillDummy }) => {
    const rounds = tournamentInfo.rounds || [];

    const handleRoundChange = (rIdx, field, value) => {
        const updated = [...rounds];
        updated[rIdx][field] = value;
        setTournamentInfo({ ...tournamentInfo, rounds: updated });
    };

    const addRound = () => {
        const newRound = {
            roundTitle: 'New Round',
            days: [{
                date: '',
                format: 'Classic',
                map: 'Erangel',
                matchTimes: [{ time: '18:00', matchNumber: 'Match 1' }]
            }]
        };
        setTournamentInfo({ ...tournamentInfo, rounds: [...rounds, newRound] });
    };

    const removeRound = (rIdx) => {
        const updated = rounds.filter((_, i) => i !== rIdx);
        setTournamentInfo({ ...tournamentInfo, rounds: updated });
    };

    const addDay = (rIdx) => {
        const updated = [...rounds];
        updated[rIdx].days.push({
            date: '',
            format: 'Classic',
            map: 'Erangel',
            matchTimes: [{ time: '18:00', matchNumber: `Match ${updated[rIdx].days.length + 1}` }]
        });
        setTournamentInfo({ ...tournamentInfo, rounds: updated });
    };

    return (
        <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Manage Match Schedule</h3>
                <button type="button" onClick={onFillDummy} className="btn-secondary">Fill Dummy Data</button>
            </div>

            {rounds.map((round, rIdx) => (
                <div key={rIdx} style={{ marginBottom: '30px', padding: '20px', border: '2px solid var(--accent-color)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <input
                            type="text"
                            className="input-field"
                            value={round.roundTitle}
                            onChange={e => handleRoundChange(rIdx, 'roundTitle', e.target.value)}
                            style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '70%' }}
                        />
                        <button onClick={() => removeRound(rIdx)} style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Remove Round</button>
                    </div>

                    {round.days.map((day, dIdx) => (
                        <div key={dIdx} style={{ marginLeft: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div className="schedule-day-grid">
                                <input type="text" className="input-field" value={day.date} onChange={e => {
                                    const updated = [...rounds];
                                    updated[rIdx].days[dIdx].date = e.target.value;
                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                }} placeholder="Date (e.g. Feb 20)" />
                                <input type="text" className="input-field" value={day.map} onChange={e => {
                                    const updated = [...rounds];
                                    updated[rIdx].days[dIdx].map = e.target.value;
                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                }} placeholder="Map" />
                                <button onClick={() => {
                                    const updated = [...rounds];
                                    updated[rIdx].days = updated[rIdx].days.filter((_, i) => i !== dIdx);
                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                }} style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer', padding: '10px' }}>Remove Day</button>
                            </div>

                            {/* Match Times with editable fields + Completed toggle */}
                            {(day.matchTimes || []).map((mt, mIdx) => (
                                <div key={mIdx} style={{ marginTop: '10px', padding: '10px 12px', background: mt.completed ? 'rgba(255,60,60,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: '8px', border: mt.completed ? '1px solid rgba(255,60,60,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                                        {/* Match Number */}
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={mt.matchNumber}
                                            onChange={e => {
                                                const updated = [...rounds];
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].matchNumber = e.target.value;
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            placeholder="Match No."
                                            style={{ width: '120px', fontSize: '0.85rem', padding: '6px 10px' }}
                                        />
                                        {/* Time */}
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={mt.time || ''}
                                            onChange={e => {
                                                const updated = [...rounds];
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].time = e.target.value;
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            style={{ width: '100px', fontSize: '0.85rem', padding: '6px 10px' }}
                                        />

                                        {/* Status Dropdown */}
                                        <select
                                            className="input-field"
                                            value={mt.status || (mt.completed ? 'Closed' : 'Upcoming')}
                                            onChange={e => {
                                                const updated = [...rounds];
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].status = e.target.value;
                                                // Maintain compatibility with existing 'completed' field
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].completed = e.target.value === 'Closed';
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            style={{ width: '120px', fontSize: '0.85rem', padding: '6px 10px', background: 'var(--bg-secondary)', color: 'var(--accent-color)', fontWeight: 'bold' }}
                                        >
                                            <option value="Upcoming">Upcoming</option>
                                            <option value="Live">Live 🔴</option>
                                            <option value="Closed">Closed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>

                                        {/* Custom Watermark */}
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={mt.watermark || ''}
                                            onChange={e => {
                                                const updated = [...rounds];
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].watermark = e.target.value;
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            placeholder="Watermark"
                                            style={{ width: '130px', fontSize: '0.85rem', padding: '6px 10px' }}
                                        />

                                        {/* Sequence Tag Selection */}
                                        <select
                                            className="input-field"
                                            value={mt.sequenceTag || 'Auto'}
                                            onChange={e => {
                                                const updated = [...rounds];
                                                updated[rIdx].days[dIdx].matchTimes[mIdx].sequenceTag = e.target.value;
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            style={{ width: '120px', fontSize: '0.85rem', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}
                                        >
                                            <option value="Auto">Auto Sequence</option>
                                            <option value="1st Match">1st Match</option>
                                            <option value="2nd Match">2nd Match</option>
                                            <option value="3rd Match">3rd Match</option>
                                            <option value="4th Match">4th Match</option>
                                            <option value="Last Match">Last Match</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    <button onClick={() => addDay(rIdx)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>+ Add Day</button>
                </div>
            ))}

            <button onClick={addRound} className="btn-secondary" style={{ width: '100%', marginBottom: '15px' }}>+ Add New Round</button>
            <button onClick={onUpdate} className="btn-primary" style={{ width: '100%' }}>Save Schedule</button>
        </div>
    );
};

export default ScheduleManager;
