import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';

const ProofsManager = () => {
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProofs();
    }, []);

    const fetchProofs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "proofs"), orderBy("uploadedAt", "desc"));
            const snap = await getDocs(q);
            setProofs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching proofs", error);
        }
        setLoading(false);
    };

    const handleStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, "proofs", id), { status });
            fetchProofs(); // Refresh
        } catch (error) {
            alert("Error updating status");
        }
    };

    if (loading) return <p>Loading proofs...</p>;

    return (
        <div className="card">
            <h3>Manage Proofs</h3>
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '10px' }}>Team</th>
                            <th style={{ padding: '10px' }}>Type</th>
                            <th style={{ padding: '10px' }}>Proof</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proofs.map(proof => (
                            <tr key={proof.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px' }}>{proof.teamName}</td>
                                <td style={{ padding: '10px' }}>{proof.fileType?.includes('video') ? 'Video' : 'Image'}</td>
                                <td style={{ padding: '10px' }}>
                                    <a href={proof.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>
                                        View Proof
                                    </a>
                                </td>
                                <td style={{ padding: '10px', color: proof.status === 'approved' ? 'var(--success)' : 'var(--text-muted)' }}>
                                    {proof.status.toUpperCase()}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {proof.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleStatus(proof.id, 'approved')} style={{ color: 'var(--success)', background: 'transparent', fontWeight: 'bold' }}>Approve</button>
                                            <button onClick={() => handleStatus(proof.id, 'rejected')} style={{ color: 'var(--danger)', background: 'transparent', fontWeight: 'bold' }}>Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {proofs.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>No proofs found.</p>}
        </div>
    );
};

export default ProofsManager;
