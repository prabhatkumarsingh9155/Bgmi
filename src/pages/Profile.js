import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);

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
                        setTeamData(userTeam);
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

    if (loading) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div className="container" style={{ padding: '20px 10px' }}>
            <div className="profile-header" style={{ marginBottom: '20px' }}>
                <h2 className="heading-glitch" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: 0 }}>My Profile</h2>
            </div>

            {teamData ? (
                <div className="card">
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Team Information</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>Basic Details</h4>
                            <p style={{ wordBreak: 'break-word' }}><strong>Team Name:</strong> {teamData.teamName}</p>
                            <p><strong>Slot Number:</strong> #{teamData.slotNumber}</p>
                            <p style={{ wordBreak: 'break-word' }}><strong>Captain:</strong> {teamData.captainName}</p>
                            <p style={{ wordBreak: 'break-word' }}><strong>WhatsApp:</strong> {teamData.captainWhatsapp}</p>
                            <p style={{ wordBreak: 'break-all' }}><strong>Email:</strong> {teamData.captainEmail}</p>
                            <p><strong>Status:</strong> 
                                <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    background: teamData.status === 'Approved' ? 'rgba(0, 255, 0, 0.1)' : teamData.status === 'Rejected' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                                    color: teamData.status === 'Approved' ? 'var(--success)' : teamData.status === 'Rejected' ? 'var(--danger)' : 'orange',
                                    marginLeft: '5px',
                                    display: 'inline-block'
                                }}>
                                    {teamData.status || 'Pending'}
                                </span>
                            </p>
                        </div>

                        <div>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>Squad Details</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ wordBreak: 'break-word' }}><strong>Player 1:</strong> {teamData.player1Name} (ID: {teamData.player1Id})</p>
                                <p style={{ wordBreak: 'break-word' }}><strong>Player 2:</strong> {teamData.player2Name} (ID: {teamData.player2Id})</p>
                                <p style={{ wordBreak: 'break-word' }}><strong>Player 3:</strong> {teamData.player3Name} (ID: {teamData.player3Id})</p>
                                <p style={{ wordBreak: 'break-word' }}><strong>Player 4:</strong> {teamData.player4Name} (ID: {teamData.player4Id})</p>
                                {teamData.substituteName && (
                                    <p style={{ wordBreak: 'break-word' }}><strong>Substitute:</strong> {teamData.substituteName} (ID: {teamData.substituteId})</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '15px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, wordBreak: 'break-word' }}>
                            <strong>Registration Date:</strong> {new Date(teamData.registrationDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => navigate('/edit-team')}
                            className="btn-primary"
                            style={{ padding: '10px 20px', fontSize: '0.9rem', flex: '1 1 auto', minWidth: '140px' }}
                        >
                            Edit Team Info
                        </button>
                        <button 
                            onClick={() => navigate('/tournament-info')}
                            className="btn-secondary"
                            style={{ padding: '10px 20px', fontSize: '0.9rem', flex: '1 1 auto', minWidth: '140px' }}
                        >
                            Tournament Info
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'var(--text-secondary)' }}>
                        No team registration found for your account.
                    </p>
                    <button 
                        onClick={() => navigate('/register')}
                        className="btn-primary"
                        style={{ marginTop: '20px', width: '100%', maxWidth: '300px' }}
                    >
                        Register Your Team
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;