import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { TOURNAMENT_DOC_ID, TOURNAMENT_COLLECTION } from '../../utils/dataHelpers';
import {
    FaFistRaised, FaShieldAlt, FaTrophy, FaArrowRight, FaCheckCircle,
    FaPlayCircle, FaChevronRight, FaPlus, FaTrash, FaSignal,
    FaPowerOff, FaUsers, FaGamepad
} from 'react-icons/fa';

const TYPE_LABELS = { solo: 'TDM Solo', duo: 'TDM Duo', squad: 'TDM Squad' };
const TYPE_COLORS = { solo: '#0096ff', duo: '#00c3ff', squad: '#00fff2' };

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const TDMMatchManager = ({ teams, tournamentInfo, matches, onSaveMatches, onUpdateInfo, showDevTools }) => {
    const [activeType, setActiveType] = useState('solo');
    const [selectedRound, setSelectedRound] = useState(1);
    const [manualPair, setManualPair] = useState({ team1: '', team2: '' });

    const allTeams = teams || [];
    const allMatches = matches || [];

    const tdmTeams = (type) => allTeams.filter(t => t.regMode === 'tdm' && t.regType === type);
    const typeMatches = (type) => allMatches.filter(m => m.type === type);
    const roundMatches = (type, r) => typeMatches(type).filter(m => m.round === r);
    const getRounds = (type) => {
        const r = [...new Set(typeMatches(type).map(m => m.round))].sort((a, b) => a - b);
        return r.length > 0 ? r : [1];
    };

    const isRoundDone = (type, r) => {
        const ms = roundMatches(type, r);
        return ms.length > 0 && ms.every(m => !!m.winner);
    };

    const roundWinners = (type, r) => roundMatches(type, r).filter(m => !!m.winner).map(m => m.winner);

    const getDisplayName = (team) => {
        if (!team) return 'BYE';
        if (activeType === 'solo') return team.player1Name || team.captainName || team.teamName;
        if (activeType === 'duo') return team.teamName && team.teamName !== 'TDM Duo' ? team.teamName : `${team.player1Name || ''} & ${team.player2Name || ''}`.trim() || 'Duo Team';
        return team.teamName || 'Squad Team';
    };

    const isTeamAvailable = (displayName) => {
        const team = allTeams.find(t => getDisplayName(t) === displayName);
        return team?.isAvailable || false;
    };

    const updateMatches = (newMatches) => {
        onSaveMatches(newMatches);
    };

    const handleManualAssign = (round) => {
        if (!manualPair.team1 || !manualPair.team2) return;
        const newMatch = {
            id: `${activeType}-R${round}-${Date.now()}`,
            type: activeType, round,
            team1: manualPair.team1, team2: manualPair.team2,
            winner: null, status: 'Scheduled', bye: false
        };
        updateMatches([...allMatches, newMatch]);
        setManualPair({ team1: '', team2: '' });
    };

    const handleAutoPair = (r) => {
        let pool = [];
        if (r === 1) {
            pool = tdmTeams(activeType).map(t => getDisplayName(t));
        } else {
            pool = roundWinners(activeType, r - 1);
        }

        const shuffled = shuffle(pool);
        const newMatches = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                newMatches.push({
                    id: `${activeType}-R${r}-${Date.now()}-${i}`,
                    type: activeType, round: r,
                    team1: shuffled[i], team2: shuffled[i + 1],
                    winner: null, status: 'Scheduled', bye: false
                });
            } else {
                newMatches.push({
                    id: `${activeType}-R${r}-BYE-${Date.now()}`,
                    type: activeType, round: r,
                    team1: shuffled[i], team2: null,
                    winner: shuffled[i], status: 'Completed', bye: true
                });
            }
        }
        updateMatches([...allMatches.filter(m => m.round !== r || m.type !== activeType), ...newMatches]);
    };

    const setMatchStatus = (matchId, status) => {
        updateMatches(allMatches.map(m => m.id === matchId ? { ...m, status } : m));
    };

    const declareWinner = (matchId, winner) => {
        updateMatches(allMatches.map(m => m.id === matchId ? { ...m, winner, status: 'Completed' } : m));
    };

    const deleteMatch = (matchId) => {
        updateMatches(allMatches.filter(m => m.id !== matchId));
    };

    const fastForwardRound = () => {
        if (!window.confirm(`THIS IS A TEST TOOL: Randomly declare winners for ALL matches in Round ${selectedRound}?`)) return;
        const ms = roundMatches(activeType, selectedRound);
        const updatedMs = allMatches.map(m => {
            if (m.round === selectedRound && m.type === activeType && !m.winner && !m.bye) {
                const winner = Math.random() > 0.5 ? m.team1 : m.team2;
                return { ...m, winner, status: 'Completed' };
            }
            return m;
        });
        updateMatches(updatedMs);
    };

    const markAllAsNext = () => {
        const updatedMs = allMatches.map(m => {
            if (m.round === selectedRound && m.type === activeType && m.status === 'Scheduled' && !m.bye) {
                return { ...m, status: 'Next' };
            }
            return m;
        });
        updateMatches(updatedMs);
    };

    const color = TYPE_COLORS[activeType];
    const rounds = getRounds(activeType);
    const lastR = rounds[rounds.length - 1];
    const canAdvance = isRoundDone(activeType, lastR) && roundWinners(activeType, lastR).length >= 2;

    const labelPlural = activeType === 'solo' ? 'Players' : 'Teams';
    const labelSingle = activeType === 'solo' ? 'Player' : 'Team';

    const toggleGlobalMatchMode = () => {
        const currentStatus = !!tournamentInfo?.isTDMMatchMode;
        const newStatus = !currentStatus;

        const updateObj = { ...tournamentInfo, isTDMMatchMode: newStatus };

        // If turning ON TDM Match Mode, close Squad Registration
        if (newStatus) {
            updateObj.isSquadRegistrationOpen = false;
        }

        onUpdateInfo(updateObj);
    };

    const toggleSquadRegistration = () => {
        const currentStatus = tournamentInfo?.isSquadRegistrationOpen !== false;
        const newStatus = !currentStatus;

        const updateObj = { ...tournamentInfo, isSquadRegistrationOpen: newStatus };

        // If opening squad registration, close all TDM parts
        if (newStatus) {
            updateObj.isTDMRegistrationOpen = false;
            updateObj.isTDMMatchMode = false;
            // Also set tdm settings to hidden for extra safety if they exist
            if (updateObj.tdmSettings) {
                Object.keys(updateObj.tdmSettings).forEach(mode => {
                    updateObj.tdmSettings[mode].status = 'Hidden';
                });
            }
        }

        onUpdateInfo(updateObj);
    };

    const toggleTDMRegistration = () => {
        const currentStatus = tournamentInfo?.isTDMRegistrationOpen !== false;
        const newStatus = !currentStatus;

        const updateObj = { ...tournamentInfo, isTDMRegistrationOpen: newStatus };

        // If opening TDM registration, close Squad Registration
        if (newStatus) {
            updateObj.isSquadRegistrationOpen = false;
        }

        onUpdateInfo(updateObj);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Global Control Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                {/* TDM Match Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,165,0,0.05)', borderRadius: '15px', border: '1px solid rgba(255,165,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--accent-color)', color: '#000', borderRadius: '8px' }}><FaShieldAlt /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>TDM Match Mode</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Mark Availability</div>
                        </div>
                    </div>
                    <button onClick={toggleGlobalMatchMode} style={{
                        padding: '8px 15px', borderRadius: '30px', border: 'none',
                        background: tournamentInfo?.isTDMMatchMode ? '#00dc50' : 'rgba(255,255,255,0.05)',
                        color: tournamentInfo?.isTDMMatchMode ? '#000' : '#888', cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: tournamentInfo?.isTDMMatchMode ? '0 0 15px rgba(0, 220, 80, 0.4)' : 'none', transition: '0.2s',
                        transform: tournamentInfo?.isTDMMatchMode ? 'scale(1.05)' : 'scale(1)'
                    }}>
                        {tournamentInfo?.isTDMMatchMode ? <FaSignal /> : <FaPowerOff />}
                        {tournamentInfo?.isTDMMatchMode ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Screenshot Verification Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,180,255,0.05)', borderRadius: '15px', border: '1px solid rgba(0,180,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: '#00b4ff', color: '#000', borderRadius: '8px' }}><FaSignal /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Image Proofs</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Require WhatsApp/YT</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const currentStatus = tournamentInfo?.isImageUploadEnabled !== false;
                            onUpdateInfo({ ...tournamentInfo, isImageUploadEnabled: !currentStatus });
                        }}
                        style={{
                            padding: '8px 15px', borderRadius: '30px', border: 'none',
                            background: tournamentInfo?.isImageUploadEnabled !== false ? '#00dc50' : 'rgba(255,255,255,0.05)',
                            color: tournamentInfo?.isImageUploadEnabled !== false ? '#000' : '#888', cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: '0.3s'
                        }}
                    >
                        {tournamentInfo?.isImageUploadEnabled !== false ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Squad Registration */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0, 255, 100, 0.05)', borderRadius: '15px', border: '1px solid rgba(0, 255, 100, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--success)', color: '#000', borderRadius: '8px' }}><FaUsers /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Squad Reg.</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Open/Close Registration</div>
                        </div>
                    </div>
                    <button onClick={toggleSquadRegistration} style={{
                        padding: '8px 15px', borderRadius: '30px', border: 'none',
                        background: tournamentInfo?.isSquadRegistrationOpen ? 'var(--success)' : 'rgba(255,255,255,0.05)',
                        color: tournamentInfo?.isSquadRegistrationOpen ? '#000' : '#888', cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: tournamentInfo?.isSquadRegistrationOpen ? '0 0 15px rgba(0, 255, 100, 0.4)' : 'none', transition: '0.3s'
                    }}>
                        {tournamentInfo?.isSquadRegistrationOpen ? <FaCheckCircle /> : <FaPowerOff />} {tournamentInfo?.isSquadRegistrationOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                </div>

                {/* TDM Registration */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0, 150, 255, 0.05)', borderRadius: '15px', border: '1px solid rgba(0, 150, 255, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: '#0096ff', color: '#000', borderRadius: '8px' }}><FaGamepad /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>TDM Reg.</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Open/Close Registration</div>
                        </div>
                    </div>
                    <button onClick={toggleTDMRegistration} style={{
                        padding: '8px 15px', borderRadius: '30px', border: 'none',
                        background: tournamentInfo?.isTDMRegistrationOpen ? '#0096ff' : 'rgba(255,255,255,0.05)',
                        color: tournamentInfo?.isTDMRegistrationOpen ? '#000' : '#888', cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: tournamentInfo?.isTDMRegistrationOpen ? '0 0 15px rgba(0, 150, 255, 0.4)' : 'none', transition: '0.3s'
                    }}>
                        {tournamentInfo?.isTDMRegistrationOpen ? <FaCheckCircle /> : <FaPowerOff />} {tournamentInfo?.isTDMRegistrationOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                </div>
            </div>

            {/* 1. TDM TYPE SELECTOR */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                {Object.keys(TYPE_LABELS).map(type => (
                    <button key={type} onClick={() => { setActiveType(type); setSelectedRound(1); }} style={{
                        flex: 1, padding: '18px', borderRadius: '15px', cursor: 'pointer', transition: '0.3s',
                        background: activeType === type ? `${TYPE_COLORS[type]}22` : 'var(--bg-secondary)',
                        border: `2px solid ${activeType === type ? TYPE_COLORS[type] : 'var(--border-color)'}`,
                        color: activeType === type ? TYPE_COLORS[type] : 'var(--text-secondary)',
                        fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                    }}>
                        <FaShieldAlt /> {TYPE_LABELS[type].toUpperCase()}
                    </button>
                ))}
            </div>

            {/* 2. ROUND STEPPER (Visualizing the Progression) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', overflowX: 'auto', padding: '10px 0' }}>
                {rounds.map(r => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => setSelectedRound(r)}
                            style={{
                                padding: '12px 25px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                background: selectedRound === r ? color : 'var(--bg-secondary)',
                                color: selectedRound === r ? '#000' : '#fff',
                                boxShadow: selectedRound === r ? `0 0 20px ${color}44` : 'none',
                                minWidth: '120px'
                            }}
                        >
                            ROUND {r} {isRoundDone(activeType, r) && '✓'}
                        </button>
                        {r < rounds.length && <FaChevronRight style={{ opacity: 0.3 }} />}
                    </div>
                ))}

                {/* Enable Round 2 Button once Round 1 is Done */}
                {canAdvance && (
                    <button
                        onClick={() => {
                            const nextR = lastR + 1;
                            handleAutoPair(nextR);
                            setSelectedRound(nextR);
                        }}
                        style={{
                            padding: '12px 25px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer',
                            background: 'none', border: `2px dashed ${color}`, color: color, minWidth: '150px'
                        }}
                    >
                        + START ROUND {lastR + 1}
                    </button>
                )}
            </div>

            {/* 3. MATCH AREA FOR SELECTED ROUND */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ margin: 0, color, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        Matches for Round {selectedRound}
                    </h2>
                    {roundMatches(activeType, selectedRound).length === 0 ? (
                        <button
                            onClick={() => handleAutoPair(selectedRound)}
                            style={{ background: color, color: '#000', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            AUTO-ASSIGN ALL
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                                value={manualPair.team1}
                                onChange={(e) => setManualPair(p => ({ ...p, team1: e.target.value }))}
                                style={{ padding: '8px', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }}
                            >
                                <option value="">Select {labelSingle} 1</option>
                                {(selectedRound === 1 ? tdmTeams(activeType) : roundWinners(activeType, selectedRound - 1).map(name => allTeams.find(t => getDisplayName(t) === name) || { teamName: name }))
                                    .filter(t => t && !roundMatches(activeType, selectedRound).flatMap(m => [m.team1, m.team2]).includes(getDisplayName(t)))
                                    .map(t => (
                                        <option key={getDisplayName(t)} value={getDisplayName(t)}>
                                            {tournamentInfo?.isTDMMatchMode && t.isAvailable ? '● ' : ''}{getDisplayName(t)}
                                        </option>
                                    ))}
                            </select>
                            <span style={{ opacity: 0.3, fontWeight: 'bold' }}>VS</span>
                            <select
                                value={manualPair.team2}
                                onChange={(e) => setManualPair(p => ({ ...p, team2: e.target.value }))}
                                style={{ padding: '8px', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }}
                            >
                                <option value="">Select {labelSingle} 2</option>
                                {(selectedRound === 1 ? tdmTeams(activeType) : roundWinners(activeType, selectedRound - 1).map(name => allTeams.find(t => getDisplayName(t) === name) || { teamName: name }))
                                    .filter(t => t && !roundMatches(activeType, selectedRound).flatMap(m => [m.team1, m.team2]).includes(getDisplayName(t)) && getDisplayName(t) !== manualPair.team1)
                                    .map(t => (
                                        <option key={getDisplayName(t)} value={getDisplayName(t)}>
                                            {tournamentInfo?.isTDMMatchMode && t.isAvailable ? '● ' : ''}{getDisplayName(t)}
                                        </option>
                                    ))}
                            </select>
                            <button onClick={() => handleManualAssign(selectedRound)} style={{ background: color, color: '#000', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>Add</button>

                            <div style={{ marginLeft: '20px', display: 'flex', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '15px' }}>
                                {showDevTools && (
                                    <>
                                        <button
                                            onClick={markAllAsNext}
                                            style={{ background: 'rgba(255,136,0,0.1)', color: '#ff8800', border: '1px solid #ff880055', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
                                            title="Mark all matches as Upcoming"
                                        >
                                            MARK ALL NEXT
                                        </button>
                                        <button
                                            onClick={fastForwardRound}
                                            style={{ background: 'rgba(0,220,80,0.1)', color: '#00dc50', border: '1px solid #00dc5055', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
                                            title="Randomly finish all matches"
                                        >
                                            AUTO-FINISH ROUND
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        if (window.confirm('This will delete current matches in this round and shuffle everybody again. Continue?')) {
                                            handleAutoPair(selectedRound);
                                        }
                                    }}
                                    style={{ background: 'transparent', color: color, border: `1px solid ${color}`, padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    AUTO-ASSIGN ALL
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Availability Bar */}
                {activeType === 'solo' && (
                    <div style={{ marginBottom: '20px', padding: '12px 20px', background: 'rgba(0, 220, 80, 0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(0, 220, 80, 0.1)' }}>
                        <div style={{ color: '#00dc50', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#00dc50', borderRadius: '50%', display: 'inline-block' }}></span>
                            OPEN FOR MATCH ({tdmTeams(activeType).filter(t => t.isAvailable).length}):
                        </div>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', flex: 1 }}>
                            {tdmTeams(activeType).filter(t => t.isAvailable).map(t => (
                                <span key={t.teamName} style={{
                                    padding: '4px 10px', background: 'rgba(0, 220, 80, 0.1)', color: '#00dc50',
                                    borderRadius: '5px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap'
                                }}>
                                    {getDisplayName(t)}
                                </span>
                            ))}
                            {tdmTeams(activeType).filter(t => t.isAvailable).length === 0 && (
                                <span style={{ opacity: 0.3, fontSize: '0.75rem' }}>No players available right now...</span>
                            )}
                        </div>
                    </div>
                )}

                {roundMatches(activeType, selectedRound).length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed var(--border-color)' }}>
                        <FaFistRaised style={{ fontSize: '4rem', opacity: 0.1, marginBottom: '20px' }} />
                        <h3 style={{ opacity: 0.5 }}>Round {selectedRound} is empty.</h3>
                        <p style={{ opacity: 0.3, marginBottom: '25px' }}>Click "Auto-Assign" or use the selectors above to start with {tdmTeams(activeType).length} {labelPlural.toLowerCase()}.</p>

                        {showDevTools && tdmTeams(activeType).length === 0 && (
                            <button
                                onClick={() => {
                                    const dummyTeams = Array.from({ length: 20 }, (_, i) => ({
                                        teamName: `Solo Player ${i + 1}`,
                                        player1Name: `Pro_Gamer_${i + 1}`,
                                        regMode: 'tdm', regType: 'solo', status: 'Approved', isAvailable: true, registrationDate: new Date().toISOString()
                                    }));
                                    const allExceptTdm = teams.filter(t => t.regMode !== 'tdm');
                                    onUpdateInfo({ ...tournamentInfo, bgmi: JSON.stringify([...allExceptTdm, ...dummyTeams]) });
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', color: color, border: `1px solid ${color}`, padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                QUICK SEED 20 SOLO PLAYERS
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {roundMatches(activeType, selectedRound).map((m, idx) => (
                            <div key={m.id} className="card" style={{
                                padding: '0', overflow: 'hidden', transition: '0.3s',
                                borderLeft: `6px solid ${m.winner ? 'var(--success)' : m.status === 'Live' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                opacity: m.winner && selectedRound !== rounds[rounds.length - 1] ? 0.7 : 1
                            }}>
                                <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5 }}>MATCH {idx + 1}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {m.status === 'Live' && <span style={{ color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '900' }}>● LIVE NOW</span>}
                                        {m.status === 'Next' && <span style={{ color: '#ff8800', fontSize: '0.7rem', fontWeight: '900' }}>● UPCOMING</span>}
                                        {m.winner && <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: '900' }}>COMPLETED</span>}
                                    </div>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    {/* Team 1 Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.winner === m.team1 ? 'var(--success)' : '#fff' }}>{m.team1}</span>
                                            {tournamentInfo?.isTDMMatchMode && isTeamAvailable(m.team1) && (
                                                <span style={{ color: '#00dc50', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 220, 80, 0.15)', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(0, 220, 80, 0.2)' }}>
                                                    <span style={{ width: '7px', height: '7px', background: '#00dc50', borderRadius: '50%', boxShadow: '0 0 8px #00dc50' }}></span> ONLINE
                                                </span>
                                            )}
                                            {m.winner === m.team1 && <FaTrophy style={{ color: 'var(--success)' }} />}
                                        </div>
                                        {!m.winner && (
                                            <button onClick={() => declareWinner(m.id, m.team1)} style={{ background: 'var(--success)', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '5px', fontWeight: '900', fontSize: '0.7rem', cursor: 'pointer' }}>WIN</button>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'center', margin: '5px 0', fontSize: '0.65rem', fontWeight: '900', opacity: 0.1 }}>VS</div>

                                    {/* Team 2 Row */}
                                    {m.team2 ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.winner === m.team2 ? 'var(--success)' : '#fff' }}>{m.team2}</span>
                                                {tournamentInfo?.isTDMMatchMode && isTeamAvailable(m.team2) && (
                                                    <span style={{ color: '#00dc50', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 220, 80, 0.15)', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(0, 220, 80, 0.2)' }}>
                                                        <span style={{ width: '7px', height: '7px', background: '#00dc50', borderRadius: '50%', boxShadow: '0 0 8px #00dc50' }}></span> ONLINE
                                                    </span>
                                                )}
                                                {m.winner === m.team2 && <FaTrophy style={{ color: 'var(--success)' }} />}
                                            </div>
                                            {!m.winner && (
                                                <button onClick={() => declareWinner(m.id, m.team2)} style={{ background: 'var(--success)', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '5px', fontWeight: '900', fontSize: '0.7rem', cursor: 'pointer' }}>WIN</button>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px', color: 'var(--success)', fontWeight: 'bold', border: '1px dashed var(--success)22', borderRadius: '8px' }}>BYE - ADVANCES</div>
                                    )}

                                    {/* Live/Next/Cancel Actions */}
                                    {!m.winner && !m.bye && (
                                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {m.status !== 'Live' && (
                                                <button onClick={() => setMatchStatus(m.id, 'Live')} style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,165,0,0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)44', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                    <FaPlayCircle /> START LIVE
                                                </button>
                                            )}
                                            {m.status !== 'Next' && m.status !== 'Live' && (
                                                <button onClick={() => setMatchStatus(m.id, 'Next')} style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,136,0,0.1)', color: '#ff8800', border: '1px solid #ff880044', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                    <FaPlus /> MARK NEXT
                                                </button>
                                            )}
                                            {(m.status === 'Next' || m.status === 'Live') && (
                                                <button onClick={() => setMatchStatus(m.id, 'Scheduled')} style={{ flex: 1, minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                    UNMARK
                                                </button>
                                            )}
                                            <button onClick={() => deleteMatch(m.id)} style={{ padding: '8px', background: 'rgba(255,0,0,0.05)', color: 'var(--danger)', border: '1px solid var(--danger)22', borderRadius: '6px', cursor: 'pointer' }} title="Delete Match"><FaTrash /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FINAL CHAMPION SECTION */}
            {(() => {
                const finalRound = Math.max(...rounds);
                const finalMatch = roundMatches(activeType, finalRound).find(m => !m.bye);
                if (finalMatch && finalMatch.winner && roundMatches(activeType, finalRound).length === 1) {
                    return (
                        <div style={{ marginTop: '60px', padding: '60px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(241,196,15,0.1) 0%, transparent 100%)', border: '4px solid #f1c40f', borderRadius: '30px', boxShadow: '0 0 40px rgba(241,196,15,0.1)' }}>
                            <FaTrophy style={{ fontSize: '5rem', color: '#f1c40f', marginBottom: '20px' }} />
                            <h4 style={{ color: '#f1c40f', letterSpacing: '8px', margin: '0 0 10px 0' }}>TOURNAMENT CHAMPION</h4>
                            <h1 style={{ fontSize: '4rem', margin: 0, textTransform: 'uppercase' }}>{finalMatch.winner}</h1>
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
};

export default TDMMatchManager;
