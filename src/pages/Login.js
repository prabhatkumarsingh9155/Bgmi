import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaPhone, FaLock } from 'react-icons/fa';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedPhone = phone.trim();

        if (!/^\d{10}$/.test(trimmedPhone)) {
            setError('Please enter a valid 10-digit phone number.');
            setLoading(false);
            return;
        }

        // Get device token stored on this device
        const localDeviceToken = localStorage.getItem('deviceToken');

        if (!localDeviceToken) {
            setError('This device was not used for registration. You can only login from the device you registered on.');
            setLoading(false);
            return;
        }

        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    const teams = JSON.parse(currentData);
                    const team = teams.find(t =>
                        t.captainWhatsapp === trimmedPhone && !t.deleted
                    );

                    if (!team) {
                        setError('No registered team found with this phone number.');
                        setLoading(false);
                        return;
                    }

                    // Check device token matches
                    if (team.deviceToken !== localDeviceToken) {
                        setError('Login failed! You can only login from the device you registered on.');
                        setLoading(false);
                        return;
                    }

                    // All checks passed
                    localStorage.setItem('userEmail', trimmedPhone);
                    localStorage.setItem('isLoggedIn', 'true');
                    navigate('/profile');
                    return;
                }
            }

            setError('No registered team found with this phone number.');
        } catch (err) {
            console.error('Login error:', err);
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '40px 16px', maxWidth: '460px' }}>
            <div className="card" style={{ padding: '36px 28px' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '1.4rem', color: '#fff',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                    }}>
                        <FaPhone />
                    </div>
                    <h2 className="heading-glitch" style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
                        Team Login
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Login using your registered WhatsApp number
                    </p>
                </div>

                {/* Device Security Notice */}
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                }}>
                    <FaLock style={{ color: '#8b5cf6', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>
                        <strong style={{ color: '#a78bfa' }}>Device Locked:</strong> You can only login from the same device you used to register.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Captain's WhatsApp Number</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', left: '14px', top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)', fontSize: '0.95rem',
                                fontWeight: '600', userSelect: 'none'
                            }}>+91</span>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => {
                                    setError('');
                                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                }}
                                style={{ paddingLeft: '52px' }}
                                required
                                maxLength={10}
                                autoComplete="tel"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            marginTop: '12px',
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            color: '#f87171',
                            fontSize: '0.85rem',
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px', marginTop: '20px' }}
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : '🔓 Login'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Don't have an account?{' '}
                            <span
                                onClick={() => navigate('/register')}
                                style={{ color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Register here
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;