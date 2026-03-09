import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const RulesInfoEditor = () => {
    const [tournamentInfo, setTournamentInfo] = useState({
        tournamentName: '',
        tournamentStatus: 'Live',
        currentDay: '',
        subTitle: '',
        firstPrize: '',
        secondPrize: '',
        thirdPrize: '',
        mvpPrize: '',
        totalMatches: '',
        dailyMatches: '',
        todayMatches: '',
        registrationFee: '',
        feeDescription: '',
        rules: []
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ show: false, type: '', text: '' });

    useEffect(() => {
        loadTournamentInfo();
    }, []);

    const loadTournamentInfo = async () => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data && data !== "") {
                    const parsedData = JSON.parse(data);
                    setTournamentInfo({
                        tournamentName: parsedData.tournamentName || '',
                        tournamentStatus: parsedData.tournamentStatus || 'Live',
                        currentDay: parsedData.currentDay || '',
                        subTitle: parsedData.subTitle || '',
                        firstPrize: parsedData.firstPrize || '',
                        secondPrize: parsedData.secondPrize || '',
                        thirdPrize: parsedData.thirdPrize || '',
                        mvpPrize: parsedData.mvpPrize || '',
                        totalMatches: parsedData.totalMatches || '',
                        dailyMatches: parsedData.dailyMatches || '',
                        todayMatches: parsedData.todayMatches || '',
                        registrationFee: parsedData.registrationFee || '',
                        feeDescription: parsedData.feeDescription || '',
                        rules: parsedData.rules || []
                    });
                }
            }
        } catch (error) {
            console.error('Error loading tournament info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setTournamentInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleFillDummy = () => {
        setTournamentInfo({
            tournamentName: 'SEASON 4',
            tournamentStatus: 'Live',
            currentDay: 'DAY 4',
            subTitle: 'OVERALL STANDINGS',
            firstPrize: '400',
            secondPrize: '200',
            thirdPrize: '₹100',
            mvpPrize: '50',
            totalMatches: '8',
            dailyMatches: '2',
            todayMatches: '2',
            registrationFee: 'FREE',
            feeDescription: 'No entry fee required! Just register and play.',
            rules: [
                '✅ Squad format (4 players + 1 substitute)',
                '✅ No emulator players allowed',
                '✅ Screen recording mandatory during matches',
                '✅ Fair play policy - no cheating/hacking',
                '✅ Room ID and password will be shared 30 minutes before match',
                '✅ Late entries will be disqualified'
            ]
        });
        showMessage('success', 'Dummy data filled!');
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let fullData = {};
            if (docSnap.exists()) {
                const existingData = docSnap.data().tournamentInfo;
                if (existingData && existingData !== "") {
                    fullData = JSON.parse(existingData);
                }
            }

            // Merge with existing data (preserve rounds and other fields)
            const updatedData = {
                ...fullData,
                ...tournamentInfo
            };

            await updateDoc(docRef, {
                tournamentInfo: JSON.stringify(updatedData)
            });

            showMessage('success', 'Tournament info updated successfully!');
        } catch (error) {
            console.error('Error updating tournament info:', error);
            showMessage('error', 'Failed to update tournament info');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ show: true, type, text });
        setTimeout(() => setMessage({ show: false, type: '', text: '' }), 3000);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ padding: '30px', background: '#141b2d', border: '2px solid #3b82f6', borderRadius: '12px' }}>
            {message.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '15px 25px',
                    background: message.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    zIndex: 10000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    fontWeight: '600'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
                    📋 Edit Tournament Information
                </h2>
                <button 
                    type="button" 
                    onClick={handleFillDummy}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #8b5cf6',
                        color: '#8b5cf6',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Fill Dummy Data
                </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                {/* Tournament Identity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            🏆 Tournament Name
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.tournamentName}
                            onChange={e => handleChange('tournamentName', e.target.value)}
                            placeholder="SEASON 4"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            📡 Tournament Status
                        </label>
                        <select
                            value={tournamentInfo.tournamentStatus}
                            onChange={e => handleChange('tournamentStatus', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="Upcoming">🟡 Upcoming</option>
                            <option value="Live">🟢 Live</option>
                            <option value="Closed">🔴 Closed</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            📅 Current Day Tag (e.g. DAY 4)
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.currentDay}
                            onChange={e => handleChange('currentDay', e.target.value)}
                            placeholder="e.g. DAY 4"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            🔖 Top Headline (e.g. OVERALL STANDINGS)
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.subTitle}
                            onChange={e => handleChange('subTitle', e.target.value)}
                            placeholder="e.g. OVERALL STANDINGS"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Prizes & Matches */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            1st Prize 🥇
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.firstPrize}
                            onChange={e => handleChange('firstPrize', e.target.value)}
                            placeholder="400"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            2nd Prize 🥈
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.secondPrize}
                            onChange={e => handleChange('secondPrize', e.target.value)}
                            placeholder="200"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            3rd Prize 🥉
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.thirdPrize}
                            onChange={e => handleChange('thirdPrize', e.target.value)}
                            placeholder="₹100"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            MVP Prize 🏆
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.mvpPrize}
                            onChange={e => handleChange('mvpPrize', e.target.value)}
                            placeholder="50"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            Total Matches 🎮
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.totalMatches}
                            onChange={e => handleChange('totalMatches', e.target.value)}
                            placeholder="8"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            Daily Matches 📅
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.dailyMatches}
                            onChange={e => handleChange('dailyMatches', e.target.value)}
                            placeholder="2"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            Today's Match 🔥
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.todayMatches}
                            onChange={e => handleChange('todayMatches', e.target.value)}
                            placeholder="2"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                            Registration Fee
                        </label>
                        <input
                            type="text"
                            value={tournamentInfo.registrationFee}
                            onChange={e => handleChange('registrationFee', e.target.value)}
                            placeholder="FREE"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e27',
                                border: '1px solid #2d3548',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                        Fee Description
                    </label>
                    <input
                        type="text"
                        value={tournamentInfo.feeDescription}
                        onChange={e => handleChange('feeDescription', e.target.value)}
                        placeholder="No entry fee required! Just register and play."
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0a0e27',
                            border: '1px solid #2d3548',
                            borderRadius: '8px',
                            color: '#f3f4f6',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Rules Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                        Rules (JSON Array)
                    </label>
                    <textarea
                        rows="8"
                        value={JSON.stringify(tournamentInfo.rules, null, 2)}
                        onChange={e => {
                            try {
                                handleChange('rules', JSON.parse(e.target.value));
                            } catch (err) {
                                // Keep typing, don't update until valid JSON
                            }
                        }}
                        placeholder='["✅ Rule 1", "✅ Rule 2"]'
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0a0e27',
                            border: '1px solid #2d3548',
                            borderRadius: '8px',
                            color: '#f3f4f6',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            resize: 'vertical'
                        }}
                    />
                    <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px' }}>
                        Format: ["Rule 1", "Rule 2", "Rule 3"]
                    </p>
                </div>

                <button 
                    type="submit" 
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: saving ? '#6b7280' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {saving ? 'Updating...' : 'Update Tournament Info'}
                </button>
            </form>
        </div>
    );
};

export default RulesInfoEditor;
