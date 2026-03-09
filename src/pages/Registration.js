import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaGamepad } from 'react-icons/fa';
import './Registration.css';

const Registration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState({ teamName: '', slotNumber: 0 });
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });
    const [showFillButton, setShowFillButton] = useState(false);
    const [screenshotRequired, setScreenshotRequired] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState({ type: null, index: null });
    const [formData, setFormData] = useState({
        teamName: '',
        captainWhatsapp: '',
        player1Name: '',
        player2Name: '',
        player3Name: '',
        player4Name: '',
        whatsappScreenshots: [null, null, null, null],
        youtubeScreenshots: [null, null, null, null]
    });

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.registrationFillMode !== undefined) {
                    setShowFillButton(data.registrationFillMode);
                }
                if (data.screenshotProofEnabled !== undefined) {
                    setScreenshotRequired(data.screenshotProofEnabled);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fillSampleData = () => {
        setFormData({
            teamName: 'Soul Esports',
            captainWhatsapp: '9876543210',
            player1Name: 'Mortal',
            player2Name: 'Viper',
            player3Name: 'Clutchgod',
            player4Name: 'Owais',
            whatsappScreenshots: [null, null, null, null],
            youtubeScreenshots: [null, null, null, null]
        });
    };

    const handleFileUpload = async (type, index, file) => {
        if (file && file.type.startsWith('image/')) {
            setUploadingIndex({ type, index });
            
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('image', file);
                
                const response = await fetch('https://api.imgbb.com/1/upload?key=8d44fe54ab424f9f79d4b8afab42a871', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const imageUrl = data.data.url;
                    
                    setFormData(prev => {
                        if (type === 'whatsapp') {
                            const newScreenshots = [...prev.whatsappScreenshots];
                            newScreenshots[index] = imageUrl;
                            return { ...prev, whatsappScreenshots: newScreenshots };
                        } else {
                            const newScreenshots = [...prev.youtubeScreenshots];
                            newScreenshots[index] = imageUrl;
                            return { ...prev, youtubeScreenshots: newScreenshots };
                        }
                    });
                } else {
                    setErrorModal({ show: true, message: `Upload failed: ${data.error?.message || 'Unknown error'}` });
                }
            } catch (error) {
                setErrorModal({ show: true, message: `Upload failed: ${error.message}` });
            } finally {
                setUploadingIndex({ type: null, index: null });
            }
        } else {
            setErrorModal({ show: true, message: 'Please select a valid image file' });
        }
    };

    const selectAllSlots = (type) => {
        document.getElementById(`${type}-file-input`).click();
    };

    const handleMultipleFiles = async (type, files) => {
        const fileArray = Array.from(files).slice(0, 4);
        for (let i = 0; i < fileArray.length; i++) {
            await handleFileUpload(type, i, fileArray[i]);
        }
    };

    const validateForm = () => {
        const required = ['teamName', 'captainWhatsapp',
                         'player1Name', 'player2Name', 'player3Name', 'player4Name'];
        
        for (let field of required) {
            if (!formData[field].trim()) {
                setErrorModal({ show: true, message: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return false;
            }
        }
        
        if (formData.captainWhatsapp.length < 10) {
            setErrorModal({ show: true, message: 'Please enter a valid phone number (10+ digits)' });
            return false;
        }
        
        const playerNames = [formData.player1Name, formData.player2Name, formData.player3Name, formData.player4Name];
        const duplicateName = playerNames.find((name, index) => playerNames.indexOf(name) !== index);
        if (duplicateName) {
            setErrorModal({ show: true, message: `Player name "${duplicateName}" is used more than once in your team!` });
            return false;
        }
        
        return true;
    };

    const validateScreenshots = () => {
        if (!screenshotRequired) return true;
        
        const allWhatsappFilled = formData.whatsappScreenshots.every(img => img !== null);
        const allYoutubeFilled = formData.youtubeScreenshots.every(img => img !== null);
        
        if (!allWhatsappFilled) {
            setErrorModal({ show: true, message: 'Please upload all 4 WhatsApp screenshots' });
            return false;
        }
        if (!allYoutubeFilled) {
            setErrorModal({ show: true, message: 'Please upload all 4 YouTube screenshots' });
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (currentStep === 1 && validateForm()) {
            if (screenshotRequired) {
                setCurrentStep(2);
            } else {
                handleSubmit();
            }
        } else if (currentStep === 2 && validateScreenshots()) {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
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
            
            const teamExists = existingTeams.some(team => 
                team.teamName.toLowerCase() === formData.teamName.toLowerCase()
            );
            if (teamExists) {
                setErrorModal({ show: true, message: 'Team Name already taken! Please choose another.' });
                setLoading(false);
                return;
            }
            
            const phoneExists = existingTeams.some(team => 
                team.captainWhatsapp === formData.captainWhatsapp
            );
            if (phoneExists) {
                setErrorModal({ show: true, message: 'Phone number already registered!' });
                setLoading(false);
                return;
            }
            
            const deviceToken = crypto.randomUUID();

            const teamData = {
                ...formData,
                slotNumber: null,
                registrationDate: new Date().toISOString(),
                status: 'Pending',
                deviceToken: deviceToken
            };

            existingTeams.push(teamData);
            
            try {
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(existingTeams)
                });
            } catch (saveError) {
                console.error('Firebase save error:', saveError);
                throw saveError;
            }

            // Set login status with device token
            localStorage.setItem('userEmail', formData.captainWhatsapp);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('deviceToken', deviceToken);

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
                    {showFillButton && (
                        <div className="sample-btn-container">
                            <button 
                                type="button" 
                                onClick={fillSampleData}
                                className="btn-sample"
                            >
                                Fill Sample Data
                            </button>
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                        {currentStep === 1 && (
                        <>
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
                                <label className="input-label">Captain Phone Number *</label>
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
                                <div className="input-group">
                                    <label className="input-label">In-Game Name *</label>
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
                            </div>
                        ))}
                        </>
                        )}

                        {/* Step 2: Screenshot Upload */}
                        {currentStep === 2 && screenshotRequired && (
                            <>
                                {/* WhatsApp Group */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 className="section-header" style={{ margin: 0 }}>
                                            <span style={{ color: '#25D366' }}>📱 WhatsApp Group</span>
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => selectAllSlots('whatsapp')}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#25D366',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            📤 Select 4 at once
                                        </button>
                                        <input
                                            id="whatsapp-file-input"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                handleMultipleFiles('whatsapp', e.target.files);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                        {[0, 1, 2, 3].map(idx => (
                                            <div
                                                key={`wa-${idx}`}
                                                onClick={() => !uploadingIndex.type && document.getElementById(`wa-${idx}`).click()}
                                                style={{
                                                    position: 'relative',
                                                    aspectRatio: '1',
                                                    backgroundImage: formData.whatsappScreenshots[idx] ? `url(${formData.whatsappScreenshots[idx]})` : 'none',
                                                    backgroundColor: '#1a2332',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    border: '2px dashed #25D366',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: uploadingIndex.type ? 'wait' : 'pointer',
                                                    transition: 'all 0.3s',
                                                    opacity: uploadingIndex.type === 'whatsapp' && uploadingIndex.index === idx ? 0.5 : 1
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#20b358'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#25D366'}
                                            >
                                                {uploadingIndex.type === 'whatsapp' && uploadingIndex.index === idx ? (
                                                    <div style={{ color: '#25D366', fontSize: '14px' }}>Uploading...</div>
                                                ) : !formData.whatsappScreenshots[idx] ? (
                                                    <>
                                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☁️</div>
                                                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>Slot {idx + 1}</div>
                                                    </>
                                                ) : null}
                                                <input
                                                    id={`wa-${idx}`}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload('whatsapp', idx, e.target.files[0])}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* YouTube Channel */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 className="section-header" style={{ margin: 0 }}>
                                            <span style={{ color: '#FF0000' }}>🎥 YouTube Channel</span>
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => selectAllSlots('youtube')}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#FF0000',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            📤 Select 4 at once
                                        </button>
                                        <input
                                            id="youtube-file-input"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                handleMultipleFiles('youtube', e.target.files);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                        {[0, 1, 2, 3].map(idx => (
                                            <div
                                                key={`yt-${idx}`}
                                                onClick={() => !uploadingIndex.type && document.getElementById(`yt-${idx}`).click()}
                                                style={{
                                                    position: 'relative',
                                                    aspectRatio: '1',
                                                    backgroundImage: formData.youtubeScreenshots[idx] ? `url(${formData.youtubeScreenshots[idx]})` : 'none',
                                                    backgroundColor: '#1a2332',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    border: '2px dashed #FF0000',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: uploadingIndex.type ? 'wait' : 'pointer',
                                                    transition: 'all 0.3s',
                                                    opacity: uploadingIndex.type === 'youtube' && uploadingIndex.index === idx ? 0.5 : 1
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#cc0000'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FF0000'}
                                            >
                                                {uploadingIndex.type === 'youtube' && uploadingIndex.index === idx ? (
                                                    <div style={{ color: '#FF0000', fontSize: '14px' }}>Uploading...</div>
                                                ) : !formData.youtubeScreenshots[idx] ? (
                                                    <>
                                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☁️</div>
                                                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>Slot {idx + 1}</div>
                                                    </>
                                                ) : null}
                                                <input
                                                    id={`yt-${idx}`}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileUpload('youtube', idx, e.target.files[0])}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Complete Button */}
                                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '1rem' }}>
                                        {formData.whatsappScreenshots.filter(s => s).length + formData.youtubeScreenshots.filter(s => s).length} screenshots remaining.
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                            {currentStep === 2 && (
                                <button
                                    type="button"
                                    className="btn-submit"
                                    onClick={() => setCurrentStep(1)}
                                    style={{ background: '#666' }}
                                >
                                    ← Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Processing...' : currentStep === 1 && screenshotRequired ? 'Next: Upload Screenshots →' : 'Complete Registration'}
                            </button>
                        </div>
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
                                window.location.reload();
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