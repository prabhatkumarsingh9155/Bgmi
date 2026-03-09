import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrophy, FaChevronLeft, FaUser, FaUsers, FaUserSecret, FaGamepad } from 'react-icons/fa';
import { useTournamentData } from '../hooks/useTournamentData';
import './TDMSelection.css';

const TDMSelection = () => {
    const { tournamentInfo, loading } = useTournamentData();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loading) {
        return <div className="admin-loading"><div className="spinner"></div></div>;
    }

    const tdmSettings = tournamentInfo?.tdmSettings || {
        solo: { status: 'Live' },
        duo: { status: 'Live' },
        squad: { status: 'Live' }
    };

    const modes = [
        {
            id: 'solo',
            name: 'TDM SOLO',
            icon: <FaUser />,
            tag: '1v1 Skills',
            desc: 'One vs All. Prove you are the king of skills.',
            status: tdmSettings.solo?.status || 'Live',
            prize: tdmSettings.solo?.prize || 'TBA'
        },
        {
            id: 'duo',
            name: 'TDM DUO',
            icon: <FaUsers />,
            tag: '2v2 Synergy',
            desc: 'Team up with your best partner and dominate.',
            status: tdmSettings.duo?.status || 'Live',
            prize: tdmSettings.duo?.prize || 'TBA'
        },
        {
            id: 'squad',
            name: 'TDM SQUAD',
            icon: <FaUserSecret />,
            tag: '4v4 Combat',
            desc: 'Pure coordinated chaos. The ultimate team test.',
            status: tdmSettings.squad?.status || 'Live',
            prize: tdmSettings.squad?.prize || 'TBA'
        }
    ];

    // Filter out hidden modes
    const visibleModes = modes.filter(mode => mode.status !== 'Hidden');

    return (
        <div className="tdm-selection-page">
            <div className="tdm-bg-overlay"></div>

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <button onClick={() => navigate('/')} className="btn-back">
                    <FaChevronLeft /> Back to Home
                </button>

                <div className="tdm-header">
                    <div className="tdm-badge"><FaGamepad size={14} style={{ marginBottom: '-2px', marginRight: '5px' }} /> TDM MODE</div>
                    <h1 className="tdm-title">Choose Your <span className="text-accent">Battle</span></h1>
                    <p className="tdm-subtitle">Select the competition type and register your team for the ultimate TDM showdown.</p>
                </div>

                <div className="tdm-selection-grid">
                    {visibleModes.map(mode => {
                        const isComingSoon = mode.status === 'Coming Soon';
                        const CardComponent = isComingSoon ? 'div' : Link;
                        const cardProps = isComingSoon ? {} : { to: `/register?mode=tdm&type=${mode.id}` };

                        return (
                            <CardComponent
                                key={mode.id}
                                {...cardProps}
                                className={`tdm-selection-card ${mode.id} ${isComingSoon ? 'coming-soon' : ''}`}
                            >
                                <div className="card-glare"></div>
                                <div className={`status-indicator ${isComingSoon ? 'soon' : 'live'}`}>
                                    {isComingSoon ? 'SOON' : 'LIVE'}
                                </div>
                                <div className="tdm-icon-wrap">
                                    <span className="tdm-icon">{mode.icon}</span>
                                </div>
                                <div className="tdm-card-content">
                                    <div className="tdm-card-top-row">
                                        <h3>{mode.name}</h3>
                                        <div className="tdm-card-prize">
                                            <span className="prize-label">Winner Prize</span>
                                            <span className="prize-value">{mode.prize}</span>
                                        </div>
                                    </div>
                                    <p>{mode.desc}</p>
                                    <div className="tdm-card-footer">
                                        <span className="mode-tag">{mode.tag}</span>
                                        <span className="btn-register-tdm">
                                            {isComingSoon ? 'Coming Soon' : 'Register Now'}
                                        </span>
                                    </div>
                                </div>
                            </CardComponent>
                        );
                    })}
                </div>

                {visibleModes.length === 0 && (
                    <div className="tdm-info-box" style={{ justifyContent: 'center' }}>
                        <p>No TDM modes are currently active. Please check back later!</p>
                    </div>
                )}

                <div className="tdm-info-box">
                    <FaTrophy className="info-icon" />
                    <p>Winners of TDM matches get special rewards and exclusive profile badges!</p>
                </div>
            </div>
        </div>
    );
};

export default TDMSelection;
