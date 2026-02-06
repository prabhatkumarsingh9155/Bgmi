import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Sign in with email and password
            await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');
            alert('Login successful!');
            navigate('/profile');
        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                alert('Invalid email or password. Please check your credentials or register first.');
            } else if (error.code === 'auth/wrong-password') {
                alert('Incorrect password.');
            } else if (error.code === 'auth/invalid-email') {
                alert('Invalid email format.');
            } else {
                alert(`Login failed: ${error.message}`);
            }
        }

        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '50px 0', maxWidth: '500px' }}>
            <div className="card">
                <h2 className="heading-glitch" style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                    User Login
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '15px', marginTop: '20px' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
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