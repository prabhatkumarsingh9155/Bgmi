import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './SeasonSelection.css';
import './PointTable.css';

const SeasonSelection = () => {
    const [seasons, setSeasons] = useState([]);

    useEffect(() => {
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.pointsTable) {
                    try {
                        setSeasons(JSON.parse(data.pointsTable));
                    } catch (e) {}
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <div className="season-selection-page">
            <div className="container">
                <Link to="/" className="modern-back-btn">
                    <FaArrowLeft />
                    <span>BACK</span>
                </Link>
                
                <h1 className="page-title">🏆 TOURNAMENT SEASONS</h1>
                <p className="page-subtitle">Select a season to view points table</p>

                <div className="seasons-grid">
                    {seasons.map((season) => (
                        <Link 
                            key={season.id}
                            to={`/season/${season.id}`}
                            className="season-card"
                        >
                            <div className="season-icon">🏆</div>
                            <h3 className="season-name">{season.name}</h3>
                            <span className={`season-status ${season.status.toLowerCase()}`}>
                                {season.status}
                            </span>
                        </Link>
                    ))}
                </div>

                {seasons.length === 0 && (
                    <div className="no-data">
                        <p>No seasons available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonSelection;
