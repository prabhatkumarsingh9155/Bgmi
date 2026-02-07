import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [blocked, setBlocked] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Real-time listener for Firebase block status
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // If Firebase says unblocked, clear local blocks
                if (data.adminBlocked === false) {
                    localStorage.removeItem('adminBlockTime');
                    localStorage.removeItem('adminAttempts');
                    setBlocked(false);
                    setError('');
                    setAttempts(0);
                    return;
                }
                
                // If Firebase says blocked
                if (data.adminBlocked === true) {
                    setBlocked(true);
                    setError('Admin account is blocked. Contact system administrator.');
                    return;
                }
            }
        });
        
        // Check local block time on mount
        const blockTime = localStorage.getItem('adminBlockTime');
        if (blockTime) {
            const now = Date.now();
            const diff = now - parseInt(blockTime);
            if (diff < 3600000) { // 1 hour block
                setBlocked(true);
                setError(`Too many failed attempts. Try again after ${Math.ceil((3600000 - diff) / 60000)} minutes.`);
            } else {
                localStorage.removeItem('adminBlockTime');
                localStorage.removeItem('adminAttempts');
            }
        }

        // Check existing session
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        const sessionToken = localStorage.getItem('adminSessionToken');
        if (isLoggedIn && sessionToken) {
            navigate('/admin');
        }
        
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (blocked) {
            setError('Account temporarily blocked. Please try later.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // Check admin credentials from Firebase
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Check if admin is blocked in Firebase
                if (data.adminBlocked === true) {
                    setError('Admin account is blocked by system administrator.');
                    setLoading(false);
                    return;
                }
                
                // Verify secret key from Firebase
                if (secretKey !== data.adminSecretKey) {
                    throw new Error('Invalid secret key');
                }
                
                // Hash password for comparison
                const hashedPassword = CryptoJS.SHA256(password).toString();
                const storedHash = data.adminPasswordHash || CryptoJS.SHA256(data.password || 'admin123').toString();
                
                if (email === data.email && hashedPassword === storedHash) {
                    // Generate secure session token
                    const sessionToken = CryptoJS.SHA256(email + Date.now() + Math.random()).toString();
                    const encryptedToken = CryptoJS.AES.encrypt(sessionToken, data.adminSecretKey).toString();
                    
                    // Store global session ID in Firebase
                    const globalSessionId = Date.now().toString();
                    await updateDoc(docRef, {
                        adminGlobalSessionId: globalSessionId
                    });
                    
                    localStorage.setItem('adminEmail', email);
                    localStorage.setItem('isAdminLoggedIn', 'true');
                    localStorage.setItem('adminSessionToken', encryptedToken);
                    localStorage.setItem('adminLoginTime', Date.now().toString());
                    localStorage.setItem('adminGlobalSessionId', globalSessionId);
                    localStorage.removeItem('adminAttempts');
                    localStorage.removeItem('adminBlockTime');
                    
                    navigate('/admin');
                } else {
                    throw new Error('Invalid credentials');
                }
            } else {
                throw new Error('Admin data not found');
            }
        } catch (error) {
            const currentAttempts = attempts + 1;
            setAttempts(currentAttempts);
            localStorage.setItem('adminAttempts', currentAttempts.toString());
            
            if (currentAttempts >= 3) {
                setBlocked(true);
                localStorage.setItem('adminBlockTime', Date.now().toString());
                
                // Set block in Firebase
                try {
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        adminBlocked: true
                    });
                } catch (e) {}
                
                setError('Too many failed attempts! Account blocked. Contact administrator.');
            } else {
                setError(`Invalid credentials. ${3 - currentAttempts} attempts remaining.`);
            }
        }
        
        setLoading(false);
    };

    return (
        <div className="container" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-color)' }}>🔒 Admin Login</h2>
                {error && <p style={{ color: 'var(--danger)', marginBottom: '15px', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '5px' }}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Admin Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={blocked}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={blocked}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Secret Key 🔑</label>
                        <input
                            type="password"
                            className="input-field"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="Enter master secret key"
                            disabled={blocked}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || blocked}>
                        {loading ? 'Verifying...' : blocked ? 'Blocked' : 'Login'}
                    </button>
                </form>
                <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ⚠️ Unauthorized access is prohibited
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
