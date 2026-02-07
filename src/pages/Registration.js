import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUsers, FaGamepad } from 'react-icons/fa';
import './Registration.css';

const Registration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState({ teamName: '', slotNumber: 0 });
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });
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
                setErrorModal({ show: true, message: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return false;
            }
        }
        
        if (!formData.agreeToRules) {
            setErrorModal({ show: true, message: 'Please agree to tournament rules and regulations' });
            return false;
        }
        
        if (!formData.agreeToProof) {
            setErrorModal({ show: true, message: 'Please agree to provide proof if suspicious activity is found' });
            return false;
        }
        
        if (formData.captainWhatsapp.length < 10) {
            setErrorModal({ show: true, message: 'Please enter a valid WhatsApp number (10+ digits)' });
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.captainEmail)) {
            setErrorModal({ show: true, message: 'Please enter a valid email address' });
            return false;
        }
        
        const bgmiIds = [formData.player1Id, formData.player2Id, formData.player3Id, formData.player4Id];
        for (let id of bgmiIds) {
            if (!/^\d+$/.test(id)) {
                setErrorModal({ show: true, message: 'BGMI IDs should contain only numbers' });
                return false;
            }
        }
        
        // Check for duplicate player names within the team
        const playerNames = [formData.player1Name, formData.player2Name, formData.player3Name, formData.player4Name];
        const duplicateName = playerNames.find((name, index) => playerNames.indexOf(name) !== index);
        if (duplicateName) {
            setErrorModal({ show: true, message: `Player name "${duplicateName}" is used more than once in your team!` });
            return false;
        }
        
        // Check for duplicate BGMI IDs within the team
        const duplicateTeamId = bgmiIds.find((id, index) => bgmiIds.indexOf(id) !== index);
        if (duplicateTeamId) {
            setErrorModal({ show: true, message: `BGMI ID "${duplicateTeamId}" is used more than once in your team!` });
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            // Get current data from Firebase FIRST
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
            
            // Check if email exists in Firestore teams
            const emailExists = existingTeams.some(team => 
                team.captainEmail.toLowerCase() === formData.captainEmail.toLowerCase()
            );
            if (emailExists) {
                setErrorModal({ show: true, message: 'Email already registered! Please use a different email.' });
                setLoading(false);
                return;
            }
            
            const teamExists = existingTeams.some(team => 
                team.teamName.toLowerCase() === formData.teamName.toLowerCase()
            );
            if (teamExists) {
                setErrorModal({ show: true, message: 'Team Name already taken! Please choose another.' });
                setLoading(false);
                return;
            }
            
            const newIds = [formData.player1Id, formData.player2Id, formData.player3Id, formData.player4Id];
            const existingIds = existingTeams.flatMap(team => [
                team.player1Id, team.player2Id, team.player3Id, team.player4Id
            ]);
            
            const duplicateId = newIds.find(id => existingIds.includes(id));
            if (duplicateId) {
                setErrorModal({ show: true, message: `BGMI ID ${duplicateId} is already registered with another team!` });
                setLoading(false);
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, formData.captainEmail, formData.captainPassword);
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    setErrorModal({ show: true, message: 'Email already registered! Please use a different email or contact admin.' });
                } else {
                    setErrorModal({ show: true, message: `Registration failed: ${authError.message}` });
                }
                setLoading(false);
                return;
            }
            
            // Store user email for session
            localStorage.setItem('userEmail', formData.captainEmail);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Create team data without slot number (admin will assign)
            const teamData = {
                ...formData,
                slotNumber: null,
                registrationDate: new Date().toISOString(),
                status: 'pending',
                paymentStatus: 'pending'
            };

            existingTeams.push(teamData);
            
            await updateDoc(docRef, {
                bgmi: JSON.stringify(existingTeams)
            });

            setSuccessData({ teamName: formData.teamName, slotNumber: 'Pending' });
            setShowSuccessModal(true);

        } catch (error) {
            console.error("Registration error:", error);
            setErrorModal({ show: true, message: `Registration failed: ${error.message}` });
        }

        setLoading(false);
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-header">
                    <h1 className="registration-title">BGMI Tournament Registration</h1>
                    <p className="registration-subtitle">Join the ultimate battleground competition</p>
                </div>

                <div className="registration-form-card">
                    <div className="sample-btn-container">
                        <button 
                            type="button" 
                            onClick={fillSampleData}
                            className="btn-sample"
                        >
                            Fill Sample Data
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Team Information */}
                        <h3 className="section-header">
                            <FaUsers /> Team Information
                        </h3>
                        
                        <div className="input-grid">
                            <div className="input-group">
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
                            <div className="input-group">
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

                        <div className="input-grid">
                            <div className="input-group">
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
                            <div className="input-group">
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

                        <div className="input-grid">
                            <div className="input-group">
                                <label className="input-label">Password *</label>
                                <div className="password-field">
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
                                        className="password-toggle"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
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

                        {/* Player Information */}
                        <h3 className="section-header">
                            <FaGamepad /> Squad Details
                        </h3>
                        
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="player-card">
                                <h4 className="player-card-header">
                                    <div className="player-number">{num}</div>
                                    Player {num} *
                                </h4>
                                <div className="input-grid">
                                    <div className="input-group">
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
                                    <div className="input-group">
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
                        <div className="substitute-card">
                            <h4 className="player-card-header">
                                <div className="player-number">S</div>
                                Substitute Player (Optional)
                            </h4>
                            <div className="input-grid">
                                <div className="input-group">
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
                                <div className="input-group">
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
                        <div className="agreement-section">
                            <h3 className="section-header">Tournament Agreement</h3>
                            
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeToRules"
                                    checked={formData.agreeToRules}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="checkbox-text">
                                    I agree to follow all tournament rules and regulations. Any violation may result in disqualification.
                                </span>
                            </label>
                            
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeToProof"
                                    checked={formData.agreeToProof}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="checkbox-text">
                                    I understand that if suspicious activity is detected, I must provide proof (screenshots, recordings) when requested by organizers.
                                </span>
                            </label>
                        </div>

                        <div className="note-section">
                            <p>
                                <strong>Note:</strong> Please ensure all information is accurate. 
                                BGMI IDs will be verified before matches. 
                                Registration fee and payment details will be shared after approval.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Registering Team...' : 'Submit Registration'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-icon">🎉</div>
                        <h2>Registration Successful!</h2>
                        <div className="success-details">
                            <p><strong>Team:</strong> {successData.teamName}</p>
                            <p><strong>Slot:</strong> Pending</p>
                            <p><strong>Status:</strong> Pending</p>
                        </div>
                        <p className="success-note">Your slot number will be assigned by admin after approval.</p>
                        <button 
                            className="btn-success-ok"
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate('/');
                                window.scrollTo(0, 0);
                            }}
                        >
                            Continue to Home
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {errorModal.show && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-icon" style={{ fontSize: '3rem' }}>❌</div>
                        <h2 style={{ color: 'var(--danger)' }}>Error</h2>
                        <p style={{ fontSize: '1.1rem', margin: '20px 0' }}>{errorModal.message}</p>
                        <button 
                            className="btn-success-ok"
                            onClick={() => setErrorModal({ show: false, message: '' })}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registration;