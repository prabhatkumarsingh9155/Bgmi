import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const EditTeam = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        teamName: '',
        captainName: '',
        captainWhatsapp: '',
        captainEmail: '',
        alternateContact: '',
        player1Name: '', player1Id: '',
        player2Name: '', player2Id: '',
        player3Name: '', player3Id: '',
        player4Name: '', player4Id: '',
        substituteName: '', substituteId: ''
    });

    useEffect(() => {
        const userEmail = localStorage.getItem('userEmail');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn || !userEmail) {
            navigate('/login');
            return;
        }
        
        fetchTeamData(userEmail);
    }, [navigate]);

    const fetchTeamData = async (userEmail) => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        const teams = JSON.parse(currentData);
                        const userTeam = teams.find(team => team.captainEmail === userEmail);
                        if (userTeam) {
                            setFormData(userTeam);
                        }
                    } catch (e) {
                        console.error('Error parsing team data:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const userEmail = localStorage.getItem('userEmail');
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        const teams = JSON.parse(currentData);
                        const teamIndex = teams.findIndex(team => team.captainEmail === userEmail);
                        
                        if (teamIndex !== -1) {
                            // Update team data while preserving original fields
                            teams[teamIndex] = {
                                ...teams[teamIndex],
                                ...formData,
                                lastUpdated: new Date().toISOString()
                            };
                            
                            await updateDoc(docRef, {
                                bgmi: JSON.stringify(teams)
                            });
                            
                            alert('Team information updated successfully!');
                            navigate('/profile');
                        }
                    } catch (e) {
                        console.error('Error updating team data:', e);
                        alert('Failed to update team information');
                    }
                }
            }
        } catch (error) {
            console.error('Error saving team data:', error);
            alert('Failed to save changes');
        }

        setSaving(false);
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div className="container" style={{ padding: '20px 0', maxWidth: '900px' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className="heading-glitch" style={{ fontSize: '2rem' }}>
                        Edit Team Information
                    </h2>
                    <button 
                        onClick={() => navigate('/profile')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Team Information */}
                    <div className="input-group">
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Team Information</h3>
                        
                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label className="input-label">Team Name</label>
                                <input
                                    type="text"
                                    name="teamName"
                                    className="input-field"
                                    value={formData.teamName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Captain Name</label>
                                <input
                                    type="text"
                                    name="captainName"
                                    className="input-field"
                                    value={formData.captainName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label className="input-label">Captain WhatsApp</label>
                                <input
                                    type="tel"
                                    name="captainWhatsapp"
                                    className="input-field"
                                    value={formData.captainWhatsapp}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Alternate Contact</label>
                                <input
                                    type="tel"
                                    name="alternateContact"
                                    className="input-field"
                                    value={formData.alternateContact}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Player Information */}
                    <h3 style={{ color: 'var(--accent-color)', margin: '30px 0 20px' }}>Squad Details</h3>
                    
                    {[1, 2, 3, 4].map(num => (
                        <div key={num} style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Player {num}</h4>
                            <div className="grid-2">
                                <div>
                                    <label className="input-label">In-Game Name</label>
                                    <input
                                        type="text"
                                        name={`player${num}Name`}
                                        className="input-field"
                                        value={formData[`player${num}Name`]}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">BGMI ID</label>
                                    <input
                                        type="text"
                                        name={`player${num}Id`}
                                        className="input-field"
                                        value={formData[`player${num}Id`]}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Substitute Player */}
                    <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Substitute Player (Optional)</h4>
                        <div className="grid-2">
                            <div>
                                <label className="input-label">In-Game Name</label>
                                <input
                                    type="text"
                                    name="substituteName"
                                    className="input-field"
                                    value={formData.substituteName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="input-label">BGMI ID</label>
                                <input
                                    type="text"
                                    name="substituteId"
                                    className="input-field"
                                    value={formData.substituteId}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ padding: '15px 30px' }}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="btn-secondary"
                            style={{ padding: '15px 30px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTeam;