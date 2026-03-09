import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { FaDownload, FaImage } from 'react-icons/fa';
import './SlotPoster.css';

const SlotPoster = ({ teams = [], tournamentInfo = {} }) => {
    const posterRef = useRef(null);

    const downloadPoster = async () => {
        if (!posterRef.current) return;

        try {
            await document.fonts.ready;
            const originalStyle = posterRef.current.style.transform;
            posterRef.current.style.transform = 'none';

            const canvas = await html2canvas(posterRef.current, {
                scale: 3, // Ultra high quality
                backgroundColor: '#000000',
                useCORS: true,
                width: 1200,
                height: 950
            });

            posterRef.current.style.transform = originalStyle;

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.download = `slot-poster-${tournamentInfo.tournamentName || 'bgmi'}.png`;
            link.href = image;
            link.click();
        } catch (err) {
            console.error("Poster download error:", err);
        }
    };

    // Prepare 24 slots
    const totalSlots = 24;
    const slotList = Array.from({ length: totalSlots }, (_, i) => {
        const slotNum = i + 1;
        const assignedTeam = teams.find(t => parseInt(t.slotNumber) === slotNum && t.status === 'Approved');
        return {
            number: slotNum,
            team: assignedTeam ? assignedTeam.teamName : 'AVAILABLE',
            isAvailable: !assignedTeam
        };
    });

    return (
        <div className="slot-poster-manager">
            <div className="poster-controls">
                <p className="poster-hint">Generated based on 'Approved' teams with assigned slots (1-24).</p>
                <button onClick={downloadPoster} className="btn-download-poster">
                    <FaDownload /> Download Poster Image
                </button>
            </div>

            <div className="graphic-preview-wrap">
                <div ref={posterRef} className="slot-poster-container">
                    <div className="poster-overlay-glow"></div>

                    <header className="poster-header">
                        <h1 className="poster-main-title">BGMI TOURNEY</h1>
                        <div className="poster-sub-badge">
                            <span className="badge-text">{tournamentInfo.tournamentName || 'SESSION 1'} LIVE</span>
                        </div>
                    </header>

                    <div className="slots-grid">
                        {slotList.map((slot) => (
                            <div key={slot.number} className={`slot-box ${slot.isAvailable ? 'available' : 'occupied'}`}>
                                <div className="slot-num-tag">
                                    <span className="label">SLOT</span>
                                    <span className="value">{slot.number}</span>
                                </div>
                                <div className="slot-team-name">
                                    {slot.team}
                                </div>
                            </div>
                        ))}
                    </div>

                    <footer className="poster-footer">
                        <p>WWW.BGMI-TOURNEY.COM</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default SlotPoster;
