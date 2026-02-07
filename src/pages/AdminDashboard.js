import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('teams'); // teams, notifications, tournament, schedule, roomdetails

    // Notification Form
    const [notifData, setNotifData] = useState({ title: '', message: '' });
    const [notifications, setNotifications] = useState([]);

    // Room Details
    const [roomData, setRoomData] = useState({ matchName: '', roomId: '', password: '', delayMinutes: '0' });
    const [roomDetails, setRoomDetails] = useState([]);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);

    // Custom Modals
    const [modal, setModal] = useState({ show: false, type: '', message: '', onConfirm: null, data: null });

    // Slot Assignment
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [slotData, setSlotData] = useState({ teamIndex: null, slotNumber: '' });

    // Tournament Info
    const [tournamentInfo, setTournamentInfo] = useState({
        firstPrize: '',
        secondPrize: '',
        thirdPrize: '',
        mvpPrize: '',
        totalMatches: '',
        registrationFee: '',
        feeDescription: '',
        rules: [],
        rounds: []
    });

    // Stats
    const [stats, setStats] = useState({
        totalTeams: 0,
        slotsFilled: 0,
        slotsRemaining: 100
    });

    useEffect(() => {
        // Check admin authentication
        const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
        const adminEmail = localStorage.getItem('adminEmail');
        
        if (!isAdminLoggedIn || !adminEmail) {
            navigate('/admin/login');
            return;
        }
        
        // Real-time listener for all data
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Update teams
                if (data.bgmi) {
                    try {
                        const teams = JSON.parse(data.bgmi);
                        teams.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
                        setTeams(teams);
                        setStats({
                            totalTeams: teams.length,
                            slotsFilled: teams.length,
                            slotsRemaining: 100 - teams.length
                        });
                    } catch (e) {}
                }
                
                // Update notifications
                if (data.notifications) {
                    try {
                        setNotifications(JSON.parse(data.notifications));
                    } catch (e) {}
                }
                
                // Update room details
                if (data.roomDetails) {
                    try {
                        setRoomDetails(JSON.parse(data.roomDetails));
                    } catch (e) {}
                }
                
                // Update tournament info
                if (data.tournamentInfo) {
                    try {
                        setTournamentInfo(JSON.parse(data.tournamentInfo));
                    } catch (e) {}
                }
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [navigate]);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let teams = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    try {
                        teams = JSON.parse(currentData);
                    } catch (e) {
                        teams = [];
                    }
                }
            }
            
            // Sort by slot number
            teams.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
            
            setTeams(teams);
            setStats({
                totalTeams: teams.length,
                slotsFilled: teams.length,
                slotsRemaining: 100 - teams.length
            });
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
        setLoading(false);
    };

    const handleDelete = (index) => {
        const teamToDelete = teams[index];
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to delete this team? This will also delete their account.',
            onConfirm: async () => {
                try {
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    const docSnap = await getDoc(docRef);
                    
                    let allTeams = [];
                    if (docSnap.exists()) {
                        const currentData = docSnap.data().bgmi;
                        if (currentData && currentData !== "") {
                            allTeams = JSON.parse(currentData);
                        }
                    }
                    
                    const actualIndex = allTeams.findIndex(t => t.captainEmail === teamToDelete.captainEmail);
                    if (actualIndex !== -1) {
                        const teamEmail = allTeams[actualIndex].captainEmail;
                        allTeams.splice(actualIndex, 1);
                        
                        await updateDoc(docRef, {
                            bgmi: JSON.stringify(allTeams)
                        });
                        
                        setModal({ show: true, type: 'success', message: `Team deleted successfully! Note: Firebase Auth user (${teamEmail}) should be manually deleted from Firebase Console.`, onConfirm: null });
                    }
                } catch (err) {
                    setModal({ show: true, type: 'error', message: 'Error deleting team', onConfirm: null });
                }
            }
        });
    };

    const handleApproveTeam = async (teamIndex, newStatus) => {
        try {
            const teamToUpdate = teams[teamIndex];
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let allTeams = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    allTeams = JSON.parse(currentData);
                }
            }
            
            const actualIndex = allTeams.findIndex(t => t.captainEmail === teamToUpdate.captainEmail);
            if (actualIndex !== -1) {
                allTeams[actualIndex].status = newStatus;
                
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(allTeams)
                });
                
                setModal({ show: true, type: 'success', message: `Team status updated to ${newStatus}!`, onConfirm: null });
            }
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error updating team status', onConfirm: null });
        }
    };

    const handleAssignSlot = async () => {
        if (!slotData.slotNumber || slotData.teamIndex === null) return;

        const slotNum = parseInt(slotData.slotNumber);
        if (isNaN(slotNum) || slotNum < 1 || slotNum > 100) {
            setModal({ show: true, type: 'error', message: 'Please enter a valid slot number (1-100)', onConfirm: null });
            return;
        }

        // Check if slot is already taken
        const slotTaken = teams.some((t, idx) => t.slotNumber === slotNum && idx !== slotData.teamIndex);
        if (slotTaken) {
            setModal({ show: true, type: 'error', message: `Slot #${slotNum} is already assigned to another team!`, onConfirm: null });
            return;
        }

        try {
            const teamToUpdate = teams[slotData.teamIndex];
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let allTeams = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().bgmi;
                if (currentData && currentData !== "") {
                    allTeams = JSON.parse(currentData);
                }
            }
            
            const actualIndex = allTeams.findIndex(t => t.captainEmail === teamToUpdate.captainEmail);
            if (actualIndex !== -1) {
                allTeams[actualIndex].slotNumber = slotNum;
                
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(allTeams)
                });
                
                setShowSlotModal(false);
                setSlotData({ teamIndex: null, slotNumber: '' });
                setModal({ show: true, type: 'success', message: `Slot #${slotNum} assigned successfully!`, onConfirm: null });
            }
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error assigning slot', onConfirm: null });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('isAdminLoggedIn');
        navigate('/admin/login');
    };

    const fetchNotifications = async () => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let notifs = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().notifications;
                if (currentData && currentData !== "") {
                    try {
                        notifs = JSON.parse(currentData);
                    } catch (e) {
                        notifs = [];
                    }
                }
            }
            setNotifications(notifs);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!notifData.title || !notifData.message) return;

        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let existingNotifications = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().notifications;
                if (currentData && currentData !== "") {
                    try {
                        existingNotifications = JSON.parse(currentData);
                    } catch (e) {
                        existingNotifications = [];
                    }
                }
            }
            
            const newNotification = {
                ...notifData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            existingNotifications.unshift(newNotification);
            
            await updateDoc(docRef, {
                notifications: JSON.stringify(existingNotifications)
            });
            
            setModal({ show: true, type: 'success', message: 'Notification Sent!', onConfirm: null });
            setNotifData({ title: '', message: '' });
            fetchNotifications();
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error sending notification', onConfirm: null });
        }
    };

    const handleDeleteNotification = (notifId) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to delete this notification?',
            onConfirm: async () => {
                try {
                    const updatedNotifications = notifications.filter(n => n.id !== notifId);
                    
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        notifications: JSON.stringify(updatedNotifications)
                    });
                    
                    setModal({ show: true, type: 'success', message: 'Notification deleted!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error deleting notification', onConfirm: null });
                }
            }
        });
    };

    const fetchRoomDetails = async () => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let rooms = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().roomDetails;
                if (currentData && currentData !== "") {
                    try {
                        rooms = JSON.parse(currentData);
                    } catch (e) {
                        rooms = [];
                    }
                }
            }
            setRoomDetails(rooms);
        } catch (error) {
            console.error("Error fetching room details:", error);
        }
    };

    const handleSendRoomDetails = async (e) => {
        e.preventDefault();
        if (!roomData.matchName || !roomData.roomId || !roomData.password) return;

        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            let existingRooms = [];
            if (docSnap.exists()) {
                const currentData = docSnap.data().roomDetails;
                if (currentData && currentData !== "") {
                    try {
                        existingRooms = JSON.parse(currentData);
                    } catch (e) {
                        existingRooms = [];
                    }
                }
            }
            
            const newRoom = {
                ...roomData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            existingRooms.unshift(newRoom);
            
            await updateDoc(docRef, {
                roomDetails: JSON.stringify(existingRooms)
            });
            
            setModal({ show: true, type: 'success', message: 'Room Details Sent!', onConfirm: null });
            setRoomData({ matchName: '', roomId: '', password: '' });
            fetchRoomDetails();
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error sending room details', onConfirm: null });
        }
    };

    const handleDeleteRoomDetails = (roomId) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to delete this room detail?',
            onConfirm: async () => {
                try {
                    const updatedRooms = roomDetails.filter(r => r.id !== roomId);
                    
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        roomDetails: JSON.stringify(updatedRooms)
                    });
                    
                    setModal({ show: true, type: 'success', message: 'Room details deleted!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error deleting room details', onConfirm: null });
                }
            }
        });
    };

    const handleSendRoomDetailsFromSchedule = async () => {
        if (!roomData.roomId || !roomData.password) {
            setModal({ show: true, type: 'error', message: 'Please enter both Room ID and Password', onConfirm: null });
            return;
        }

        // Check if match has a time set
        const match = tournamentInfo.rounds[selectedMatch.rIdx].days[selectedMatch.dIdx].matchTimes[selectedMatch.mIdx];
        if (!match.time || match.time.trim() === '') {
            setModal({ 
                show: true, 
                type: 'error', 
                message: 'Please add a match time first! Go to Match Schedule and set a time (e.g., "6:00 PM IST") for this match, then try again.', 
                onConfirm: null 
            });
            return;
        }

        const delayMinutes = parseInt(roomData.delayMinutes) || 0;
        if (delayMinutes === 0) {
            setModal({ 
                show: true, 
                type: 'error', 
                message: 'Please set a delay time (e.g., 10 minutes). Delay cannot be 0 - room details must be revealed with a timer.', 
                onConfirm: null 
            });
            return;
        }

        try {
            const updated = [...tournamentInfo.rounds];
            updated[selectedMatch.rIdx].days[selectedMatch.dIdx].matchTimes[selectedMatch.mIdx].roomId = roomData.roomId;
            updated[selectedMatch.rIdx].days[selectedMatch.dIdx].matchTimes[selectedMatch.mIdx].password = roomData.password;
            updated[selectedMatch.rIdx].days[selectedMatch.dIdx].matchTimes[selectedMatch.mIdx].revealBeforeMinutes = delayMinutes;
            
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            await updateDoc(docRef, {
                tournamentInfo: JSON.stringify({ ...tournamentInfo, rounds: updated })
            });
            
            setTournamentInfo({ ...tournamentInfo, rounds: updated });
            setShowRoomModal(false);
            setRoomData({ matchName: '', roomId: '', password: '', delayMinutes: '0' });
            setModal({ show: true, type: 'success', message: `Room details will be revealed ${delayMinutes} minutes before match time!`, onConfirm: null });
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error sending room details', onConfirm: null });
        }
    };

    const handleDeleteRoomDetailsFromSchedule = (rIdx, dIdx, mIdx) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to delete room details for this match?',
            onConfirm: async () => {
                try {
                    const updated = [...tournamentInfo.rounds];
                    updated[rIdx].days[dIdx].matchTimes[mIdx].roomId = '';
                    updated[rIdx].days[dIdx].matchTimes[mIdx].password = '';
                    updated[rIdx].days[dIdx].matchTimes[mIdx].revealBeforeMinutes = 0;
                    
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        tournamentInfo: JSON.stringify({ ...tournamentInfo, rounds: updated })
                    });
                    
                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                    setModal({ show: true, type: 'success', message: 'Room details deleted successfully!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error deleting room details', onConfirm: null });
                }
            }
        });
    };

    const fetchTournamentInfo = async () => {
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data().tournamentInfo;
                if (data && data !== "") {
                    try {
                        setTournamentInfo(JSON.parse(data));
                    } catch (e) {
                        console.error('Error parsing tournament info:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching tournament info:', error);
        }
    };

    const handleUpdateTournamentInfo = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            await updateDoc(docRef, {
                tournamentInfo: JSON.stringify(tournamentInfo)
            });
            setModal({ show: true, type: 'success', message: 'Tournament information updated successfully!', onConfirm: null });
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error updating tournament information', onConfirm: null });
        }
    };

    const fillDummyTournamentData = () => {
        setTournamentInfo({
            firstPrize: '₹30,000',
            secondPrize: '₹15,000',
            thirdPrize: '₹5,000',
            mvpPrize: '₹3,000',
            totalMatches: '8',
            registrationFee: 'FREE',
            feeDescription: 'No entry fee required! Just register and play.',
            rules: [
                '✅ Squad format (4 players + 1 substitute)',
                '✅ No emulator players allowed',
                '✅ Screen recording mandatory during matches',
                '✅ Fair play policy - no cheating/hacking',
                '✅ Room ID and password will be shared 30 minutes before match',
                '✅ Late entries will be disqualified'
            ],
            rounds: [
                {
                    roundTitle: '🎯 Qualifier Round',
                    days: [
                        { 
                            date: 'February 10, 2026', 
                            format: 'Classic Mode', 
                            map: 'Erangel',
                            matchTimes: [
                                { time: '6:00 PM IST', matchNumber: 'Match 1' },
                                { time: '7:00 PM IST', matchNumber: 'Match 2' },
                                { time: '8:00 PM IST', matchNumber: 'Match 3' }
                            ]
                        },
                        { 
                            date: 'February 11, 2026', 
                            format: 'Classic Mode', 
                            map: 'Miramar',
                            matchTimes: [
                                { time: '6:00 PM IST', matchNumber: 'Match 4' },
                                { time: '7:00 PM IST', matchNumber: 'Match 5' }
                            ]
                        }
                    ]
                },
                {
                    roundTitle: '🔥 Semi Finals',
                    days: [
                        { 
                            date: 'February 15, 2026', 
                            format: 'Classic Mode', 
                            map: 'Sanhok',
                            matchTimes: [
                                { time: '6:00 PM IST', matchNumber: 'Match 1' },
                                { time: '7:00 PM IST', matchNumber: 'Match 2' }
                            ]
                        }
                    ]
                },
                {
                    roundTitle: '👑 Grand Finals',
                    days: [
                        { 
                            date: 'February 20, 2026', 
                            format: 'Classic Mode', 
                            map: 'Erangel',
                            matchTimes: [
                                { time: '8:00 PM IST', matchNumber: 'Final Match' }
                            ]
                        }
                    ]
                }
            ]
        });
    };

    // Download CSV
    const downloadCSV = () => {
        const headers = ["Slot,Team Name,Captain WhatsApp,Email,Player 1,ID 1,Player 2,ID 2,Player 3,ID 3,Player 4,ID 4,Status"];
        const rows = teams.map(team => [
            team.slotNumber,
            team.teamName,
            team.captainWhatsapp,
            team.email,
            team.player1Name, team.player1Id,
            team.player2Name, team.player2Id,
            team.player3Name, team.player3Id,
            team.player4Name, team.player4Id,
            team.status
        ].join(","));

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tournament_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTeams = teams.filter(t =>
        t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.captainWhatsapp.includes(searchTerm)
    );

    if (loading) return <div className="container" style={{ padding: '50px' }}>Loading dashboard...</div>;

    return (
        <div className="container" style={{ padding: '50px 10px' }}>
            {/* Custom Modal */}
            {modal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '15px', padding: '30px', maxWidth: '450px', width: '100%', border: `2px solid ${modal.type === 'error' ? 'var(--danger)' : 'var(--accent-color)'}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                            {modal.type === 'success' && '✅'}
                            {modal.type === 'error' && '❌'}
                            {modal.type === 'confirm' && '⚠️'}
                        </div>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '25px', lineHeight: '1.6' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {modal.type === 'confirm' ? (
                                <>
                                    <button
                                        onClick={() => {
                                            modal.onConfirm();
                                            setModal({ show: false, type: '', message: '', onConfirm: null });
                                        }}
                                        style={{ padding: '12px 30px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setModal({ show: false, type: '', message: '', onConfirm: null })}
                                        style={{ padding: '12px 30px', background: 'transparent', color: 'var(--text-primary)', border: '2px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setModal({ show: false, type: '', message: '', onConfirm: null })}
                                    style={{ padding: '12px 40px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Slot Assignment Modal */}
            {showSlotModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '100%', border: '2px solid var(--accent-color)' }}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Assign Slot Number</h3>
                        <div className="input-group">
                            <label className="input-label">Slot Number (1-100)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={slotData.slotNumber}
                                onChange={e => setSlotData({ ...slotData, slotNumber: e.target.value })}
                                placeholder="Enter slot number"
                                min="1"
                                max="100"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={handleAssignSlot}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                Assign
                            </button>
                            <button
                                onClick={() => {
                                    setShowSlotModal(false);
                                    setSlotData({ teamIndex: null, slotNumber: '' });
                                }}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Details Modal */}
            {showRoomModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '30px', maxWidth: '500px', width: '100%', border: '2px solid var(--accent-color)' }}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Send Room Details</h3>
                        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>{roomData.matchName}</p>
                        <div className="input-group">
                            <label className="input-label">Room ID</label>
                            <input
                                type="text"
                                className="input-field"
                                value={roomData.roomId}
                                onChange={e => setRoomData({ ...roomData, roomId: e.target.value })}
                                placeholder="Enter Room ID"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="text"
                                className="input-field"
                                value={roomData.password}
                                onChange={e => setRoomData({ ...roomData, password: e.target.value })}
                                placeholder="Enter Password"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Reveal Before Match (Minutes) *Required</label>
                            <input
                                type="number"
                                className="input-field"
                                value={roomData.delayMinutes}
                                onChange={e => setRoomData({ ...roomData, delayMinutes: e.target.value })}
                                placeholder="Enter minutes (e.g., 10)"
                                min="1"
                                required
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter minutes before match time to reveal details (minimum 1 minute)</small>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={handleSendRoomDetailsFromSchedule}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                Send
                            </button>
                            <button
                                onClick={() => {
                                    setShowRoomModal(false);
                                    setRoomData({ matchName: '', roomId: '', password: '', delayMinutes: '0' });
                                }}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 className="heading-glitch" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Admin Dashboard</h2>
                
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Total Teams</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stats.totalTeams}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Slots Filled</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.slotsFilled} / 100</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3>Status</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>Registration Open</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', overflowX: 'auto' }}>
                <button
                    className={`btn-secondary ${activeTab === 'teams' ? 'active-tab' : ''}`}
                    style={activeTab === 'teams' ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' } : { fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' }}
                    onClick={() => setActiveTab('teams')}
                >
                    Manage Teams
                </button>
                <button
                    className={`btn-secondary ${activeTab === 'notifications' ? 'active-tab' : ''}`}
                    style={activeTab === 'notifications' ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' } : { fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' }}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications
                </button>
                <button
                    className={`btn-secondary ${activeTab === 'roomdetails' ? 'active-tab' : ''}`}
                    style={activeTab === 'roomdetails' ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' } : { fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' }}
                    onClick={() => setActiveTab('roomdetails')}
                >
                    Room ID & Pass
                </button>
                <button
                    className={`btn-secondary ${activeTab === 'tournament' ? 'active-tab' : ''}`}
                    style={activeTab === 'tournament' ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' } : { fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' }}
                    onClick={() => setActiveTab('tournament')}
                >
                    Tournament Info
                </button>
                <button
                    className={`btn-secondary ${activeTab === 'schedule' ? 'active-tab' : ''}`}
                    style={activeTab === 'schedule' ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' } : { fontSize: 'clamp(0.8rem, 2vw, 1rem)', padding: '8px 12px' }}
                    onClick={() => setActiveTab('schedule')}
                >
                    Match Schedule
                </button>
            </div>

            {activeTab === 'teams' && (
                <>
                    {/* Controls */}
                    <div className="card" style={{ marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search Team or Mobile..."
                            className="input-field"
                            style={{ width: 'auto', flexGrow: 1 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={downloadCSV} className="btn-primary">Download Data (CSV)</button>
                    </div>

                    {/* Team List Table */}
                    {/* Team List Table */}
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>Slot</th>
                                        <th style={{ padding: '15px' }}>Team Name</th>
                                        <th style={{ padding: '15px' }}>Captain</th>
                                        <th style={{ padding: '15px' }}>Email</th>
                                        <th style={{ padding: '15px' }}>Players</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeams.map((team, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '15px' }}>#{team.slotNumber}</td>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{team.teamName}</td>
                                            <td style={{ padding: '15px' }}>{team.captainWhatsapp}</td>
                                            <td style={{ padding: '15px' }}>{team.email}</td>
                                            <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {team.player1Name}, {team.player2Name}...
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    background: team.status === 'Approved' ? 'rgba(0, 255, 0, 0.1)' : team.status === 'Rejected' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                                                    color: team.status === 'Approved' ? 'var(--success)' : team.status === 'Rejected' ? 'var(--danger)' : 'orange'
                                                }}>
                                                    {team.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={() => {
                                                            setSlotData({ teamIndex: index, slotNumber: team.slotNumber || '' });
                                                            setShowSlotModal(true);
                                                        }}
                                                        style={{ color: 'var(--accent-color)', background: 'transparent', border: '1px solid var(--accent-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        ASSIGN SLOT
                                                    </button>
                                                    {team.status !== 'Approved' && (
                                                        <button
                                                            onClick={() => handleApproveTeam(index, 'Approved')}
                                                            style={{ color: 'var(--success)', background: 'transparent', border: '1px solid var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        >
                                                            APPROVE
                                                        </button>
                                                    )}
                                                    {team.status !== 'Rejected' && (
                                                        <button
                                                            onClick={() => handleApproveTeam(index, 'Rejected')}
                                                            style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                        >
                                                            REJECT
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(index)}
                                                        style={{ color: 'var(--danger)', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        DELETE
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredTeams.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>No teams found.</p>}
                    </div>
                </>
            )}


            {activeTab === 'notifications' && (
                <>
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Send Announcement</h3>
                        <form onSubmit={handleSendNotification}>
                            <div className="input-group">
                                <label className="input-label">Title</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={notifData.title}
                                    onChange={e => setNotifData({ ...notifData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Message</label>
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    value={notifData.message}
                                    onChange={e => setNotifData({ ...notifData, message: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Notification</button>
                        </form>
                    </div>

                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>Sent Notifications</h3>
                        {notifications.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notifications sent yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {notifications.map((notif) => (
                                    <div key={notif.id} style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: '8px', color: 'var(--accent-color)' }}>{notif.title}</h4>
                                            <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{notif.message}</p>
                                            <small style={{ color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleString()}</small>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNotification(notif.id)}
                                            style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px' }}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'roomdetails' && (
                <>
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Send Room ID & Password</h3>
                        <form onSubmit={handleSendRoomDetails}>
                            <div className="input-group">
                                <label className="input-label">Match Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={roomData.matchName}
                                    onChange={e => setRoomData({ ...roomData, matchName: e.target.value })}
                                    placeholder="e.g. Qualifier Round - Match 1"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Room ID</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={roomData.roomId}
                                    onChange={e => setRoomData({ ...roomData, roomId: e.target.value })}
                                    placeholder="e.g. 123456789"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={roomData.password}
                                    onChange={e => setRoomData({ ...roomData, password: e.target.value })}
                                    placeholder="e.g. bgmi2024"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Room Details</button>
                        </form>
                    </div>

                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>Sent Room Details</h3>
                        {roomDetails.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No room details sent yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {roomDetails.map((room) => (
                                    <div key={room.id} style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: '8px', color: 'var(--accent-color)' }}>{room.matchName}</h4>
                                            <p style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>🎮 Room ID: <strong>{room.roomId}</strong></p>
                                            <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>🔑 Password: <strong>{room.password}</strong></p>
                                            <small style={{ color: 'var(--text-muted)' }}>{new Date(room.createdAt).toLocaleString()}</small>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteRoomDetails(room.id)}
                                            style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px' }}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'tournament' && (
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0 }}>Edit Tournament Information</h3>
                        <button 
                            type="button" 
                            onClick={fillDummyTournamentData}
                            className="btn-secondary"
                        >
                            Fill Dummy Data
                        </button>
                    </div>
                    <form onSubmit={handleUpdateTournamentInfo}>
                        <div className="input-group">
                            <label className="input-label">1st Prize 🥇</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.firstPrize}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, firstPrize: e.target.value })}
                                placeholder="e.g. ₹30,000"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">2nd Prize 🥈</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.secondPrize}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, secondPrize: e.target.value })}
                                placeholder="e.g. ₹15,000"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">3rd Prize 🥉</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.thirdPrize}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, thirdPrize: e.target.value })}
                                placeholder="e.g. ₹5,000"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">MVP Prize 🏆</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.mvpPrize}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, mvpPrize: e.target.value })}
                                placeholder="e.g. ₹3,000"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Total Matches 🎮</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.totalMatches}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, totalMatches: e.target.value })}
                                placeholder="e.g. 5"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Registration Fee</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.registrationFee}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, registrationFee: e.target.value })}
                                placeholder="e.g. FREE or ₹100"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fee Description</label>
                            <input
                                type="text"
                                className="input-field"
                                value={tournamentInfo.feeDescription}
                                onChange={e => setTournamentInfo({ ...tournamentInfo, feeDescription: e.target.value })}
                                placeholder="e.g. No entry fee required!"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Rules (JSON Array)</label>
                            <textarea
                                className="input-field"
                                rows="6"
                                value={JSON.stringify(tournamentInfo.rules, null, 2)}
                                onChange={e => {
                                    try {
                                        setTournamentInfo({ ...tournamentInfo, rules: JSON.parse(e.target.value) });
                                    } catch (err) {}
                                }}
                                placeholder='["✅ Rule 1", "✅ Rule 2"]'
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Tournament Info</button>
                    </form>
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0 }}>Manage Match Schedule</h3>
                        <button 
                            type="button" 
                            onClick={fillDummyTournamentData}
                            className="btn-secondary"
                        >
                            Fill Dummy Data
                        </button>
                    </div>
                    
                    {(tournamentInfo.rounds || []).map((round, roundIndex) => (
                        <div key={roundIndex} style={{ marginBottom: '40px', padding: '25px', border: '3px solid var(--accent-color)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label className="input-label">Round Title</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={round.roundTitle}
                                    onChange={e => {
                                        const updated = [...tournamentInfo.rounds];
                                        updated[roundIndex].roundTitle = e.target.value;
                                        setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                    }}
                                    placeholder="e.g. 🎯 Qualifier Round"
                                    style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                                />
                            </div>

                            <h5 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Days ({(round.days || []).length})</h5>
                            
                            {(round.days || []).map((day, dayIndex) => (
                                <div key={dayIndex} style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                                    <h6 style={{ marginBottom: '10px', color: 'var(--accent-color)' }}>Day {dayIndex + 1}</h6>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                                        <div className="input-group">
                                            <label className="input-label">Date</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={day.date}
                                                onChange={e => {
                                                    const updated = [...tournamentInfo.rounds];
                                                    updated[roundIndex].days[dayIndex].date = e.target.value;
                                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                }}
                                                placeholder="Feb 10, 2026"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Format</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={day.format}
                                                onChange={e => {
                                                    const updated = [...tournamentInfo.rounds];
                                                    updated[roundIndex].days[dayIndex].format = e.target.value;
                                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                }}
                                                placeholder="Classic Mode"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Map</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={day.map}
                                                onChange={e => {
                                                    const updated = [...tournamentInfo.rounds];
                                                    updated[roundIndex].days[dayIndex].map = e.target.value;
                                                    setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                }}
                                                placeholder="Erangel"
                                            />
                                        </div>
                                    </div>

                                    {(day.matchTimes || []).map((matchTime, matchIndex) => {
                                        // Convert stored time back to 24h format for input
                                        const getTimeValue = (timeStr) => {
                                            if (!timeStr) return '';
                                            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                            if (!match) return '';
                                            let hours = parseInt(match[1]);
                                            const minutes = match[2];
                                            const period = match[3].toUpperCase();
                                            if (period === 'PM' && hours !== 12) hours += 12;
                                            if (period === 'AM' && hours === 12) hours = 0;
                                            return `${hours.toString().padStart(2, '0')}:${minutes}`;
                                        };
                                        
                                        return (
                                            <div key={matchIndex} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'end' }}>
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label className="input-label">Match</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        value={matchTime.matchNumber || ''}
                                                        onChange={e => {
                                                            const updated = [...tournamentInfo.rounds];
                                                            updated[roundIndex].days[dayIndex].matchTimes[matchIndex].matchNumber = e.target.value;
                                                            setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                        }}
                                                        placeholder="Match 1"
                                                    />
                                                </div>
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label className="input-label">Time</label>
                                                    <input
                                                        type="time"
                                                        className="input-field"
                                                        value={getTimeValue(matchTime.time)}
                                                        onChange={e => {
                                                            const updated = [...tournamentInfo.rounds];
                                                            const timeValue = e.target.value;
                                                            if (timeValue) {
                                                                const [hours, minutes] = timeValue.split(':');
                                                                const hour = parseInt(hours);
                                                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                                                const hour12 = hour % 12 || 12;
                                                                updated[roundIndex].days[dayIndex].matchTimes[matchIndex].time = `${hour12}:${minutes} ${ampm} IST`;
                                                            } else {
                                                                updated[roundIndex].days[dayIndex].matchTimes[matchIndex].time = '';
                                                            }
                                                            setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                        }}
                                                    />
                                                    {matchTime.time && (
                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                                            Display: {matchTime.time}
                                                        </small>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const updated = [...tournamentInfo.rounds];
                                                        updated[roundIndex].days[dayIndex].matchTimes = updated[roundIndex].days[dayIndex].matchTimes.filter((_, i) => i !== matchIndex);
                                                        setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                                    }}
                                                    style={{ padding: '8px 12px', color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            onClick={() => {
                                                const updated = [...tournamentInfo.rounds];
                                                if (!updated[roundIndex].days[dayIndex].matchTimes) updated[roundIndex].days[dayIndex].matchTimes = [];
                                                updated[roundIndex].days[dayIndex].matchTimes.push({ time: '', matchNumber: 'Match ' + (updated[roundIndex].days[dayIndex].matchTimes.length + 1) });
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            className="btn-secondary"
                                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                                        >
                                            + Add Match
                                        </button>
                                        <button
                                            onClick={() => {
                                                const updated = [...tournamentInfo.rounds];
                                                updated[roundIndex].days = updated[roundIndex].days.filter((_, i) => i !== dayIndex);
                                                setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                            }}
                                            style={{ fontSize: '0.85rem', padding: '6px 12px', color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Remove Day
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button
                                    onClick={() => {
                                        const updated = [...tournamentInfo.rounds];
                                        if (!updated[roundIndex].days) updated[roundIndex].days = [];
                                        updated[roundIndex].days.push({ date: '', format: '', map: '', matchTimes: [{ time: '', matchNumber: 'Match 1' }] });
                                        setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                    }}
                                    className="btn-secondary"
                                >
                                    + Add Day to this Round
                                </button>
                                <button
                                    onClick={() => {
                                        const updated = tournamentInfo.rounds.filter((_, i) => i !== roundIndex);
                                        setTournamentInfo({ ...tournamentInfo, rounds: updated });
                                    }}
                                    style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Remove Round
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        onClick={() => {
                            const newRound = { roundTitle: '', days: [{ date: '', format: '', map: '', matchTimes: [{ time: '', matchNumber: 'Match 1' }] }] };
                            setTournamentInfo({ ...tournamentInfo, rounds: [...(tournamentInfo.rounds || []), newRound] });
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', marginBottom: '20px' }}
                    >
                        + Add New Round
                    </button>
                    
                    <button
                        onClick={handleUpdateTournamentInfo}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        Save Match Schedule
                    </button>

                    {/* All Scheduled Matches List */}
                    {(tournamentInfo.rounds || []).length > 0 && (
                        <div style={{ marginTop: '40px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '2px solid var(--accent-color)' }}>
                            <h3 style={{ marginBottom: '20px', color: 'var(--accent-color)' }}>All Scheduled Matches</h3>
                            {(tournamentInfo.rounds || []).map((round, rIdx) => (
                                <div key={rIdx} style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>{round.roundTitle}</h4>
                                    {(round.days || []).map((day, dIdx) => (
                                        <div key={dIdx}>
                                            {(day.matchTimes || []).map((match, mIdx) => (
                                                <div key={mIdx} style={{ marginBottom: '10px', padding: '15px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>{round.roundTitle} - Day {dIdx + 1} - {match.matchNumber}</p>
                                                        <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-secondary)' }}>🕒 {match.time} | 🗺️ {day.map} | 📅 {day.date}</p>
                                                        {match.roomId && match.password && (
                                                            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 255, 0, 0.1)', borderRadius: '4px' }}>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '4px' }}>✅ Room ID: <strong>{match.roomId}</strong></p>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--success)' }}>🔑 Password: <strong>{match.password}</strong></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button
                                                            onClick={() => {
                                                                const matchName = `${round.roundTitle} - Day ${dIdx + 1} - ${match.matchNumber}`;
                                                                setRoomData({
                                                                    matchName: matchName,
                                                                    roomId: match.roomId || '',
                                                                    password: match.password || ''
                                                                });
                                                                setSelectedMatch({ rIdx, dIdx, mIdx });
                                                                setShowRoomModal(true);
                                                            }}
                                                            className="btn-primary"
                                                            style={{ padding: '8px 16px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', flex: '1 1 auto' }}
                                                        >
                                                            {match.roomId && match.password ? 'Update' : 'Send ID & Pass'}
                                                        </button>
                                                        {match.roomId && match.password && (
                                                            <button
                                                                onClick={() => handleDeleteRoomDetailsFromSchedule(rIdx, dIdx, mIdx)}
                                                                style={{ padding: '8px 16px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer', flex: '1 1 auto' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};

export default AdminDashboard;
