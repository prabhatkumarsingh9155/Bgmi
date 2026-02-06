import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProofUpload = () => {
    const [step, setStep] = useState(1); // 1: Verify, 2: Upload
    const [teamInfo, setTeamInfo] = useState(null);
    const [verifyData, setVerifyData] = useState({ slotNumber: '', captainWhatsapp: '' });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const teamsRef = collection(db, "teams");
            // Query by Slot Number (convert to number)
            const q = query(teamsRef, where("slotNumber", "==", Number(verifyData.slotNumber)));
            const snap = await getDocs(q);

            if (snap.empty) {
                alert("Team not found with this Slot Number.");
                setLoading(false);
                return;
            }

            const team = snap.docs[0].data();
            if (team.captainWhatsapp !== verifyData.captainWhatsapp) {
                alert("Details do not match! Check Slot Number and Registered Mobile.");
                setLoading(false);
                return;
            }

            setTeamInfo({ id: snap.docs[0].id, ...team });
            setStep(2);
        } catch (error) {
            console.error("Error verifying:", error);
            alert("Verification failed.");
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file.");
            return;
        }
        // Validation: 30 secs video or image (client side check only here)
        if (file.type.includes('video') && file.size > 50 * 1024 * 1024) { // 50MB limit approx
            alert("Video too large! Please keep it under 30-50MB.");
            return;
        }

        setLoading(true);
        try {
            const fileRef = ref(storage, `proofs/${teamInfo.teamName}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const fileUrl = await getDownloadURL(fileRef);

            await addDoc(collection(db, "proofs"), {
                teamId: teamInfo.id,
                teamName: teamInfo.teamName,
                uploadedAt: serverTimestamp(),
                fileUrl: fileUrl,
                fileType: file.type,
                status: 'pending' // pending review
            });

            setMessage("Proof Uploaded Successfully! Admin will review it.");
            setFile(null);
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error("Error uploading proof:", error);
            alert("Upload failed.");
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '50px 0', maxWidth: '600px' }}>
            <div className="card">
                <h2 className="heading-glitch" style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                    Upload Proof
                </h2>

                {step === 1 && (
                    <form onSubmit={handleVerify}>
                        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                            Verify your team identity to upload payment/match proofs.
                        </p>
                        <div className="input-group">
                            <label className="input-label">Slot Number</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="e.g. 12"
                                value={verifyData.slotNumber}
                                onChange={(e) => setVerifyData({ ...verifyData, slotNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Registered Captain Mobile</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. 9876543210"
                                value={verifyData.captainWhatsapp}
                                onChange={(e) => setVerifyData({ ...verifyData, captainWhatsapp: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Team'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleUpload}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '15px' }}>
                            Team: {teamInfo.teamName} (Slot #{teamInfo.slotNumber})
                        </h3>

                        {message && <div style={{ padding: '15px', background: 'rgba(0, 255, 100, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px' }}>
                            {message}
                        </div>}

                        <div className="input-group">
                            <label className="input-label">Select Screenshot or Video</label>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                className="input-field"
                                onChange={(e) => setFile(e.target.files[0])}
                                required
                                style={{ paddingTop: '8px' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                Supported: JPG, PNG, MP4 (Max 30s)
                            </p>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload Proof'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            style={{ width: '100%', marginTop: '10px' }}
                            onClick={() => setStep(1)}
                        >
                            Back to Verify
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProofUpload;
