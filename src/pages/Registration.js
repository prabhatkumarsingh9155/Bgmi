import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Registration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        // Team Details
        teamName: '',
        captainName: '',
        captainWhatsapp: '',
        captainEmail: '',
        captainPassword: '',
        alternateContact: '',
        
        // Player Details
        player1Name: '', player1Id: '',
        player2Name: '', player2Id: '',
        player3Name: '', player3Id: '',
        player4Name: '', player4Id: '',
        
        // Substitute Player
        substituteName: '', substituteId: '',
        
        // Agreements
        agreeToRules: false,
        agreeToProof: false
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEmailChange = (e) => {
        setFormData({ ...formData, captainEmail: e.target.value });
    };

    const fillSampleData = () => {
        setFormData({
            // Team Details
            teamName: 'Soul Esports',
            captainName: 'Naman Mathur',
            captainWhatsapp: '9876543210',
            captainEmail: 'mortal@soulesports.com',
            captainPassword: 'bgmi2024',
            alternateContact: '9876543211',
            
            // Player Details
            player1Name: 'Mortal', player1Id: '512345678',
            player2Name: 'Viper', player2Id: '512345679',
            player3Name: 'Clutchgod', player3Id: '512345680',
            player4Name: 'Owais', player4Id: '512345681',
            
            // Substitute Player
            substituteName: 'Regaltos', substituteId: '512345682',
            
            // Agreements
            agreeToRules: true,
            agreeToProof: true
        });
    };

    const validateForm = () => {
        // Required field validation
        const required = ['teamName', 'captainName', 'captainWhatsapp', 'captainEmail',
                         'player1Name', 'player1Id', 'player2Name', 'player2Id',
                         'player3Name', 'player3Id', 'player4Name', 'player4Id'];
        
        for (let field of required) {
            if (!formData[field].trim()) {
                alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        
        // Agreement validation
        if (!formData.agreeToRules) {
            alert("Please agree to tournament rules and regulations");
            return false;
        }
        
        if (!formData.agreeToProof) {
            alert("Please agree to provide proof if suspicious activity is found");
            return false;
        }
        
        // WhatsApp validation
        if (formData.captainWhatsapp.length < 10) {
            alert("Please enter a valid WhatsApp number (10+ digits)");
            return false;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.captainEmail)) {
            alert("Please enter a valid email address");
            return false;
        }
        
        // BGMI ID validation (should be numeric)
        const bgmiIds = [formData.player1Id, formData.player2Id, formData.player3Id, formData.player4Id];
        for (let id of bgmiIds) {
            if (!/^\d+$/.test(id)) {
                alert("BGMI IDs should contain only numbers");
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            // Create Firebase Auth user
            await createUserWithEmailAndPassword(auth, formData.captainEmail, formData.captainPassword);
            
            // Store user email for session
            localStorage.setItem('userEmail', formData.captainEmail);
            localStorage.setItem('isLoggedIn', 'true');

            // Get current data from Firebase
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let existingTeams = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        existingTeams = JSON.parse(currentData);
                    } catch (e) {
                        existingTeams = [];
                    }
                }
            }
            
            // Check if team name exists
            const teamExists = existingTeams.some(team => 
                team.teamName.toLowerCase() === formData.teamName.toLowerCase()
            );
            if (teamExists) {
                alert("Team Name already taken! Please choose another.");
                setLoading(false);
                return;
            }
            
            // Check if any BGMI ID is already registered
            const newIds = [formData.player1Id, formData.player2Id, formData.player3Id, formData.player4Id];
            const existingIds = existingTeams.flatMap(team => [
                team.player1Id, team.player2Id, team.player3Id, team.player4Id
            ]);
            
            const duplicateId = newIds.find(id => existingIds.includes(id));
            if (duplicateId) {
                alert(`BGMI ID ${duplicateId} is already registered with another team!`);
                setLoading(false);
                return;
            }
            
            // Generate new slot number
            let newSlot = 1;
            if (existingTeams.length > 0) {
                const maxSlot = Math.max(...existingTeams.map(team => team.slotNumber || 0));
                newSlot = maxSlot + 1;
            }

            // Create team data
            const teamData = {
                ...formData,
                slotNumber: newSlot,
                registrationDate: new Date().toISOString(),
                status: 'pending',
                paymentStatus: 'pending'
            };

            existingTeams.push(teamData);
            
            await updateDoc(docRef, {
                bgmi: JSON.stringify(existingTeams)
            });

            alert(`🎉 Registration Successful!\n\nTeam: ${formData.teamName}\nSlot Number: #${newSlot}\n\nPlease save your slot number for future reference.`);
            navigate('/profile');

        } catch (error) {
            console.error("Registration error:", error);
            alert(`Registration failed: ${error.message}`);
        }

        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '20px 0', maxWidth: '900px' }}>
            <div className="card">
                <h2 className="heading-glitch" style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                    BGMI Tournament Registration
                </h2>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <button 
                        type="button" 
                        onClick={fillSampleData}
                        className="btn-secondary"
                        style={{ marginBottom: '20px' }}
                    >
                        Fill Sample Data
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Team Information */}
                    <div className="input-group">
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Team Information</h3>
                        
                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label className="input-label">Team Name *</label>
                                <input
                                    type="text"
                                    name="teamName"
                                    className="input-field"
                                    placeholder="e.g. Soul Esports"
                                    value={formData.teamName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Captain Name *</label>
                                <input
                                    type="text"
                                    name="captainName"
                                    className="input-field"
                                    placeholder="Captain's full name"
                                    value={formData.captainName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label className="input-label">Captain WhatsApp *</label>
                                <input
                                    type="tel"
                                    name="captainWhatsapp"
                                    className="input-field"
                                    placeholder="e.g. 9876543210"
                                    value={formData.captainWhatsapp}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Captain Email *</label>
                                <input
                                    type="email"
                                    name="captainEmail"
                                    className="input-field"
                                    placeholder="captain@example.com"
                                    value={formData.captainEmail}
                                    onChange={handleEmailChange}
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label className="input-label">Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="captainPassword"
                                        className="input-field"
                                        placeholder="Enter password"
                                        value={formData.captainPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            fontSize: '1.2rem'
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Alternate Contact (Optional)</label>
                                <input
                                    type="tel"
                                    name="alternateContact"
                                    className="input-field"
                                    placeholder="Backup contact number"
                                    value={formData.alternateContact}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Player Information */}
                    <h3 style={{ color: 'var(--accent-color)', margin: '30px 0 20px' }}>Squad Details</h3>
                    
                    {[1, 2, 3, 4].map(num => (
                        <div key={num} className="player-card" style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Player {num} *</h4>
                            <div className="grid-2">
                                <div>
                                    <label className="input-label">In-Game Name</label>
                                    <input
                                        type="text"
                                        name={`player${num}Name`}
                                        className="input-field"
                                        placeholder="Player's IGN"
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
                                        placeholder="e.g. 512345678"
                                        value={formData[`player${num}Id`]}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Substitute Player */}
                    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Substitute Player (Optional)</h4>
                        <div className="grid-2">
                            <div>
                                <label className="input-label">In-Game Name</label>
                                <input
                                    type="text"
                                    name="substituteName"
                                    className="input-field"
                                    placeholder="Substitute's IGN"
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
                                    placeholder="e.g. 512345678"
                                    value={formData.substituteId}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Agreement Section */}
                    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Tournament Agreement</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="agreeToRules"
                                    checked={formData.agreeToRules}
                                    onChange={handleChange}
                                    style={{ marginTop: '3px' }}
                                    required
                                />
                                <span style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    I agree to follow all tournament rules and regulations. Any violation may result in disqualification.
                                </span>
                            </label>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="agreeToProof"
                                    checked={formData.agreeToProof}
                                    onChange={handleChange}
                                    style={{ marginTop: '3px' }}
                                    required
                                />
                                <span style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    I understand that if suspicious activity is detected, I must provide proof (screenshots, recordings) when requested by organizers.
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="note-section" style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>Note:</strong> Please ensure all information is accurate. 
                            BGMI IDs will be verified before matches. 
                            Registration fee and payment details will be shared after approval.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Registering Team...' : 'Submit Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Registration;