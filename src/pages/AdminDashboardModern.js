import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard-modern.css';

const AdminDashboardModern = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [teams, setTeams] = useState([]);
    const [deletedTeams, setDeletedTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [slotData, setSlotData] = useState({ teamIndex: null, slotNumber: '' });
    const [modal, setModal] = useState({ show: false, type: '', message: '', onConfirm: null });
    
    // Toggle states
    const [registrationFillMode, setRegistrationFillMode] = useState(false);
    const [developerMode, setDeveloperMode] = useState(false);
    const [squadRegistration, setSquadRegistration] = useState(true);
    const [screenshotProof, setScreenshotProof] = useState(false);
    const [groupActive, setGroupActive] = useState(true);
    const [showAllTeams, setShowAllTeams] = useState(true);
    const [showFinalTeams, setShowFinalTeams] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalRegistered: 0,
        standardSquad: 0,
        tdmSolo: 0,
        tdmDuo: 0,
        tdmSquad: 0,
        totalApproved: 0,
        pendingReview: 0,
        rejectedTeams: 0
    });

    // Seasons state
    const [seasons, setSeasons] = useState([]);
    const [seasonForm, setSeasonForm] = useState({ name: '', date: '', status: 'Upcoming' });
    const [selectedSeasonForEdit, setSelectedSeasonForEdit] = useState(null);
    const [selectedDay, setSelectedDay] = useState('overall');
    const [selectedGroup, setSelectedGroup] = useState('groupA');
    const [selectedMatch, setSelectedMatch] = useState('match1');
    const [selectedMatchReal, setSelectedMatchReal] = useState('match1'); // for UI sync
    const [finalTeams, setFinalTeams] = useState([]);
    const [visibleMatchCount, setVisibleMatchCount] = useState(1);
    const [customDays, setCustomDays] = useState(['Day 1', 'Day 2']);
    const [showAddDayModal, setShowAddDayModal] = useState(false);
    const [newDayName, setNewDayName] = useState('');
    const [teamPointsForm, setTeamPointsForm] = useState({ teamName: '', wwcd: '', placePoints: '', killPoints: '', totalPoints: 0, remarks: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    
    // Tournament Info state
    const [tournamentInfo, setTournamentInfo] = useState({
        tournamentName: '',
        tournamentStatus: 'Live',
        currentDay: '',
        subTitle: '',
        firstPrize: '',
        secondPrize: '',
        thirdPrize: '',
        mvpPrize: '',
        totalMatches: '',
        dailyMatches: '',
        todayMatches: '',
        registrationFee: '',
        feeDescription: '',
        rules: [],
        heroDescription: '',
        teamsCount: '',
        prizePool: '',
        statusLabel: ''
    });

    // Calculate total points automatically
    const calculateTotal = (wwcd, placePoints, killPoints) => {
        const place = parseInt(placePoints) || 0;
        const kills = parseInt(killPoints) || 0;
        return place + kills;
    };

    useEffect(() => {
        const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
        const adminEmail = localStorage.getItem('adminEmail');
        
        if (!isAdminLoggedIn || !adminEmail) {
            navigate('/admin/login');
            return;
        }
        
        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                if (data.bgmi) {
                    try {
                        let teamsData = JSON.parse(data.bgmi);
                        // Separate active and deleted teams
                        const activeTeams = teamsData.filter(team => !team.deleted);
                        const removedTeams = teamsData.filter(team => team.deleted);
                        
                        console.log('Raw teams from Firebase:', teamsData.length);
                        console.log('Active teams:', activeTeams.length);
                        console.log('Deleted teams:', removedTeams.length);
                        
                        setTeams(activeTeams);
                        setDeletedTeams(removedTeams);
                        
                        // Calculate stats
                        const approved = activeTeams.filter(t => t.status === 'Approved').length;
                        const pending = activeTeams.filter(t => t.status === 'Pending' || !t.status).length;
                        const rejected = activeTeams.filter(t => t.status === 'Rejected').length;
                        
                        setStats({
                            totalRegistered: activeTeams.length,
                            standardSquad: activeTeams.length,
                            tdmSolo: 0,
                            tdmDuo: 0,
                            tdmSquad: 0,
                            totalApproved: approved,
                            pendingReview: pending,
                            rejectedTeams: rejected
                        });
                    } catch (e) {
                        console.error('Error parsing teams:', e);
                    }
                }
                
                // Load seasons
                if (data.pointsTable) {
                    try {
                        const seasonsData = JSON.parse(data.pointsTable);
                        setSeasons(seasonsData);
                        
                        // Keep selectedSeasonForEdit in sync with current data
                        if (selectedSeasonForEdit) {
                            const updatedSelected = seasonsData.find(s => s.id === selectedSeasonForEdit.id);
                            if (updatedSelected) {
                                setSelectedSeasonForEdit(updatedSelected);
                            }
                        }
                    } catch (e) {}
                }
                
                // Load toggle states
                if (data.squadRegistrationEnabled !== undefined) {
                    setSquadRegistration(data.squadRegistrationEnabled);
                }
                if (data.registrationFillMode !== undefined) {
                    setRegistrationFillMode(data.registrationFillMode);
                }
                if (data.screenshotProofEnabled !== undefined) {
                    setScreenshotProof(data.screenshotProofEnabled);
                }
                if (data.finalTeamsData) {
                    try {
                        setFinalTeams(JSON.parse(data.finalTeamsData));
                    } catch (e) {}
                }
                if (data.groupActiveEnabled !== undefined) {
                    setGroupActive(data.groupActiveEnabled);
                }
                if (data.showAllTeamsEnabled !== undefined) {
                    setShowAllTeams(data.showAllTeamsEnabled);
                }
                if (data.showFinalTeamsEnabled !== undefined) {
                    setShowFinalTeams(data.showFinalTeamsEnabled);
                }
                
                // Load tournament info
                if (data.tournamentInfo) {
                    try {
                        const tInfo = JSON.parse(data.tournamentInfo);
                        setTournamentInfo({
                            tournamentName: tInfo.tournamentName || '',
                            tournamentStatus: tInfo.tournamentStatus || 'Live',
                            currentDay: tInfo.currentDay || '',
                            subTitle: tInfo.subTitle || '',
                            firstPrize: tInfo.firstPrize || '',
                            secondPrize: tInfo.secondPrize || '',
                            thirdPrize: tInfo.thirdPrize || '',
                            mvpPrize: tInfo.mvpPrize || '',
                            totalMatches: tInfo.totalMatches || '',
                            dailyMatches: tInfo.dailyMatches || '',
                            todayMatches: tInfo.todayMatches || '',
                            registrationFee: tInfo.registrationFee || '',
                            feeDescription: tInfo.feeDescription || '',
                            rules: tInfo.rules || [],
                            heroDescription: tInfo.heroDescription || '',
                            teamsCount: tInfo.teamsCount || '',
                            prizePool: tInfo.prizePool || '',
                            statusLabel: tInfo.statusLabel || ''
                        });
                    } catch (e) {}
                }
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [navigate]);

    // Sync visible match count with season data
    useEffect(() => {
        if (!selectedSeasonForEdit) return;
        setVisibleMatchCount(selectedSeasonForEdit.visibleMatches || 1);
    }, [selectedSeasonForEdit?.id, selectedSeasonForEdit?.visibleMatches]);

    const handleLogout = () => {
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('isAdminLoggedIn');
        navigate('/admin/login');
    };

    const handleApproveTeam = async (teamIndex) => {
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
            
            const actualIndex = allTeams.findIndex(t => 
                t.teamName === teamToUpdate.teamName && 
                t.captainWhatsapp === teamToUpdate.captainWhatsapp
            );
            
            if (actualIndex !== -1) {
                allTeams[actualIndex].status = 'Approved';
                
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(allTeams)
                });
                
                setModal({ show: true, type: 'success', message: 'Team approved successfully!', onConfirm: null });
            }
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error approving team', onConfirm: null });
        }
    };

    const handleRejectTeam = async (teamIndex) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to reject this team?',
            onConfirm: async () => {
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
                    
                    const actualIndex = allTeams.findIndex(t => 
                        t.teamName === teamToUpdate.teamName && 
                        t.captainWhatsapp === teamToUpdate.captainWhatsapp
                    );
                    
                    if (actualIndex !== -1) {
                        allTeams[actualIndex].status = 'Rejected';
                        
                        await updateDoc(docRef, {
                            bgmi: JSON.stringify(allTeams)
                        });
                        
                        setModal({ show: true, type: 'success', message: 'Team rejected!', onConfirm: null });
                    }
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error rejecting team', onConfirm: null });
                }
            }
        });
    };

    const handleDeleteTeam = (teamIndex) => {
        const teamToDelete = teams[teamIndex];
        setModal({
            show: true,
            type: 'confirm',
            message: `Are you sure you want to delete ${teamToDelete.teamName}?`,
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
                    
                    const actualIndex = allTeams.findIndex(t => 
                        t.teamName === teamToDelete.teamName && 
                        t.captainWhatsapp === teamToDelete.captainWhatsapp
                    );
                    
                    if (actualIndex !== -1) {
                        // Soft delete - mark as deleted instead of removing
                        allTeams[actualIndex].deleted = true;
                        allTeams[actualIndex].deletedAt = new Date().toISOString();
                        
                        await updateDoc(docRef, {
                            bgmi: JSON.stringify(allTeams)
                        });
                        
                        setModal({ show: true, type: 'success', message: 'Team deleted successfully!', onConfirm: null });
                    } else {
                        setModal({ show: true, type: 'error', message: 'Team not found!', onConfirm: null });
                    }
                } catch (err) {
                    console.error('Delete error:', err);
                    setModal({ show: true, type: 'error', message: 'Error deleting team', onConfirm: null });
                }
            }
        });
    };

    const handleRestoreTeam = async (teamName, captainWhatsapp) => {
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
            
            const actualIndex = allTeams.findIndex(t => 
                t.teamName === teamName && 
                t.captainWhatsapp === captainWhatsapp
            );
            
            if (actualIndex !== -1) {
                delete allTeams[actualIndex].deleted;
                delete allTeams[actualIndex].deletedAt;
                
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(allTeams)
                });
                
                setModal({ show: true, type: 'success', message: 'Team restored successfully!', onConfirm: null });
            }
        } catch (error) {
            console.error('Restore error:', error);
            setModal({ show: true, type: 'error', message: 'Error restoring team', onConfirm: null });
        }
    };

    const handleAssignSlot = async () => {
        if (!slotData.slotNumber || slotData.teamIndex === null) return;

        const slotNum = parseInt(slotData.slotNumber);
        if (isNaN(slotNum) || slotNum < 1 || slotNum > 100) {
            setModal({ show: true, type: 'error', message: 'Please enter a valid slot number (1-100)', onConfirm: null });
            return;
        }

        const slotTaken = teams.some((t, idx) => t.slotNumber === slotNum && idx !== slotData.teamIndex);
        if (slotTaken) {
            setModal({ show: true, type: 'error', message: `Slot #${slotNum} is already assigned!`, onConfirm: null });
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
            
            const actualIndex = allTeams.findIndex(t => 
                t.teamName === teamToUpdate.teamName && 
                t.captainWhatsapp === teamToUpdate.captainWhatsapp
            );
            
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

    const handleRemoveSlot = async (teamIndex) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Set slot to Pending for this team?',
            onConfirm: async () => {
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
                    
                    const actualIndex = allTeams.findIndex(t => 
                        t.teamName === teamToUpdate.teamName && 
                        t.captainWhatsapp === teamToUpdate.captainWhatsapp
                    );
                    
                    if (actualIndex !== -1) {
                        allTeams[actualIndex].slotNumber = null;
                        
                        await updateDoc(docRef, {
                            bgmi: JSON.stringify(allTeams)
                        });
                        
                        setModal({ show: true, type: 'success', message: 'Slot set to Pending!', onConfirm: null });
                    }
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error removing slot', onConfirm: null });
                }
            }
        });
    };

    const handleNavigation = (section) => {
        setActiveSection(section);
    };

    const handleAutoAssignGroups = async () => {
        if (teams.length === 0) {
            setModal({ show: true, type: 'error', message: 'No teams available!', onConfirm: null });
            return;
        }

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
            
            const activeTeams = allTeams.filter(t => !t.deleted);
            
            // Check if teams already have slots
            const hasExistingSlots = activeTeams.some(t => t.slotNumber);
            
            if (hasExistingSlots) {
                // Keep existing slots, just assign groups
                activeTeams.forEach((team, idx) => {
                    team.assignedGroup = idx % 2 === 0 ? 'A' : 'B';
                });
            } else {
                // No slots exist, assign fresh slots per group
                let groupASlot = 1;
                let groupBSlot = 1;
                
                activeTeams.forEach((team, idx) => {
                    if (idx % 2 === 0) {
                        team.assignedGroup = 'A';
                        team.slotNumber = groupASlot++;
                    } else {
                        team.assignedGroup = 'B';
                        team.slotNumber = groupBSlot++;
                    }
                });
            }
            
            allTeams = allTeams.map(team => {
                if (!team.deleted) {
                    const updatedTeam = activeTeams.find(t => 
                        t.teamName === team.teamName && 
                        t.captainWhatsapp === team.captainWhatsapp
                    );
                    return updatedTeam || team;
                }
                return team;
            });
            
            await updateDoc(docRef, {
                bgmi: JSON.stringify(allTeams)
            });
            
            setModal({ show: true, type: 'success', message: `${activeTeams.length} teams assigned to groups!`, onConfirm: null });
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error assigning groups', onConfirm: null });
        }
    };

    const handleRemoveAllGroups = async () => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Remove all group assignments?',
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
                    
                    // Just remove groups - DON'T touch slots
                    allTeams.forEach(team => {
                        if (!team.deleted) {
                            delete team.assignedGroup;
                        }
                    });
                    
                    await updateDoc(docRef, {
                        bgmi: JSON.stringify(allTeams)
                    });
                    
                    setModal({ show: true, type: 'success', message: 'All groups removed!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error removing groups', onConfirm: null });
                }
            }
        });
    };

    const handleAddSeason = async () => {
        if (!seasonForm.name) {
            setModal({ show: true, type: 'error', message: 'Please fill season name', onConfirm: null });
            return;
        }
        
        try {
            const seasonId = `season_${Date.now()}`;
            const newSeason = {
                id: seasonId,
                name: seasonForm.name,
                date: seasonForm.date,
                status: seasonForm.status,
                teams: teams.length,
                teamsFieldName: `teams_${seasonId}`
            };
            
            const updatedSeasons = [...seasons, newSeason];
            
            // Save current teams to season-specific field
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            const docSnap = await getDoc(docRef);
            const currentTeams = docSnap.exists() ? docSnap.data().bgmi : '[]';
            
            await updateDoc(docRef, {
                pointsTable: JSON.stringify(updatedSeasons),
                [`teams_${seasonId}`]: currentTeams
            });
            
            setSeasonForm({ name: '', date: '', status: 'Upcoming' });
            setModal({ show: true, type: 'success', message: 'Season added! Teams data saved separately.', onConfirm: null });
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error adding season', onConfirm: null });
        }
    };

    const handleQualifyTeamsForFinals = async (seasonId) => {
        const season = seasons.find(s => s.id === seasonId);
        
        // Validation: Ensure Day 1 and Day 2 have at least some data
        const checkDayHasData = (dayKey) => {
            const dayData = season?.days?.[dayKey];
            if (!dayData) return false;
            const groups = ['groupA', 'groupB'];
            for (const gk of groups) {
                const groupData = dayData[gk];
                if (groupData) {
                    for (const mKey of Object.keys(groupData)) {
                        if (Array.isArray(groupData[mKey]) && groupData[mKey].length > 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        const hasDay1 = checkDayHasData('day1');
        const hasDay2 = checkDayHasData('day2');

        if (!hasDay1 || !hasDay2) {
            setModal({ 
                show: true, 
                type: 'error', 
                message: `Please wait! First complete the Point Table for all days, then you can qualify for finals.`, 
                onConfirm: null 
            });
            return;
        }

        setModal({
            show: true,
            type: 'confirm',
            message: 'Calculate Day 1-2 points and qualify top 10 teams from each group for finals with auto slot assignment?',
            onConfirm: async () => {
                try {
                    const groupAPoints = {};
                    const groupBPoints = {};
                    const matchKeys = ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'];

                    // Scan ALL days for group data
                    Object.keys(season.days || {}).forEach(dayKey => {
                        const dayData = season.days[dayKey];
                        // Process Group A
                        if (dayData.groupA) {
                            matchKeys.forEach(mKey => {
                                if (Array.isArray(dayData.groupA[mKey])) {
                                    dayData.groupA[mKey].forEach(team => {
                                        groupAPoints[team.teamName] = (groupAPoints[team.teamName] || 0) + (parseInt(team.totalPoints) || 0);
                                    });
                                }
                            });
                        }
                        // Process Group B
                        if (dayData.groupB) {
                            matchKeys.forEach(mKey => {
                                if (Array.isArray(dayData.groupB[mKey])) {
                                    dayData.groupB[mKey].forEach(team => {
                                        groupBPoints[team.teamName] = (groupBPoints[team.teamName] || 0) + (parseInt(team.totalPoints) || 0);
                                    });
                                }
                            });
                        }
                    });

                    const groupATop10 = Object.entries(groupAPoints)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([teamName]) => teamName);

                    const groupBTop10 = Object.entries(groupBPoints)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([teamName]) => teamName);

                    const allQualified = [...groupATop10, ...groupBTop10];
                    const qualifiedTeamsWithSlots = allQualified.map((teamName, idx) => ({ 
                        teamName, 
                        slot: idx + 1 
                    }));

                    const updatedSeasons = seasons.map(s => {
                        if (s.id === seasonId) {
                            return { ...s, qualifiedTeams: allQualified, finalsActive: true };
                        }
                        return s;
                    });

                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        pointsTable: JSON.stringify(updatedSeasons),
                        finalTeamsData: JSON.stringify(qualifiedTeamsWithSlots)
                    });

                    setSeasons(updatedSeasons);
                    setModal({ show: true, type: 'success', message: `${qualifiedTeamsWithSlots.length} teams qualified with slots 1-20 assigned!`, onConfirm: null });
                } catch (error) {
                    console.error('Error qualifying teams:', error);
                    setModal({ show: true, type: 'error', message: 'Error qualifying teams', onConfirm: null });
                }
            }
        });
    };

    const handleDeleteSeason = (seasonId) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Are you sure you want to delete this season?',
            onConfirm: async () => {
                try {
                    const updatedSeasons = seasons.filter(s => s.id !== seasonId);
                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        pointsTable: JSON.stringify(updatedSeasons)
                    });
                    setModal({ show: true, type: 'success', message: 'Season deleted!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error deleting season', onConfirm: null });
                }
            }
        });
    };

    const handleToggleOverall = async (seasonId, currentState) => {
        try {
            const updatedSeasons = seasons.map(s => 
                s.id === seasonId ? { ...s, showOverall: !currentState } : s
            );
            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            await updateDoc(docRef, {
                pointsTable: JSON.stringify(updatedSeasons)
            });
            setModal({ show: true, type: 'success', message: `Overall ${!currentState ? 'enabled' : 'disabled'}!`, onConfirm: null });
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error updating season', onConfirm: null });
        }
    };

    const handleEditSeasonPoints = (season) => {
        setSelectedSeasonForEdit(season);
        // Load custom days from season if exists
        if (season.customDays && Array.isArray(season.customDays)) {
            setCustomDays(season.customDays);
        } else {
            setCustomDays(['Day 1', 'Day 2']);
        }
        setActiveSection('editSeasonPoints');
    };

    const handleAddTeamPoints = async () => {
        if (!teamPointsForm.teamName) {
            setModal({ show: true, type: 'error', message: 'Please select a team', onConfirm: null });
            return;
        }

        try {
            const updatedSeasons = seasons.map(s => {
                if (s.id === selectedSeasonForEdit.id) {
                    const days = JSON.parse(JSON.stringify(s.days || {}));
                    
                    if (!days[selectedDay]) days[selectedDay] = {};
                    if (!days[selectedDay][selectedGroup]) days[selectedDay][selectedGroup] = {};
                    if (!Array.isArray(days[selectedDay][selectedGroup][selectedMatch])) {
                        days[selectedDay][selectedGroup][selectedMatch] = [];
                    }
                    
                    const totalPoints = parseInt(teamPointsForm.placePoints || 0) + parseInt(teamPointsForm.killPoints || 0);
                    
                    const newEntry = { 
                        teamName: teamPointsForm.teamName,
                        wwcd: teamPointsForm.wwcd,
                        placePoints: teamPointsForm.placePoints,
                        killPoints: teamPointsForm.killPoints,
                        totalPoints,
                        remarks: teamPointsForm.remarks || `Total: ${totalPoints}`
                    };

                    if (isEditing && editingIndex !== null) {
                        days[selectedDay][selectedGroup][selectedMatch][editingIndex] = newEntry;
                    } else {
                        days[selectedDay][selectedGroup][selectedMatch].push(newEntry);
                    }
                    
                    return { ...s, days };
                }
                return s;
            });

            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
            await updateDoc(docRef, {
                pointsTable: JSON.stringify(updatedSeasons)
            });

            setSeasons(updatedSeasons);
            setSelectedSeasonForEdit(updatedSeasons.find(s => s.id === selectedSeasonForEdit.id));
            
            setTeamPointsForm({ teamName: '', wwcd: '', placePoints: '', killPoints: '', totalPoints: 0, remarks: '' });
            setIsEditing(false);
            setEditingIndex(null);
            setModal({ show: true, type: 'success', message: isEditing ? 'Team updated successfully!' : 'Team added successfully!', onConfirm: null });
        } catch (error) {
            console.error('Error adding team:', error);
            setModal({ show: true, type: 'error', message: `Error: ${error.message}`, onConfirm: null });
        }
    };

    const handleEditTeamInMatch = (team, index) => {
        setTeamPointsForm({
            teamName: team.teamName,
            wwcd: team.wwcd,
            placePoints: team.placePoints,
            killPoints: team.killPoints,
            totalPoints: team.totalPoints,
            remarks: team.remarks
        });
        setIsEditing(true);
        setEditingIndex(index);
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const handleDeleteTeamFromOverall = async (teamName) => {
        setModal({
            show: true,
            type: 'confirm',
            message: `Delete ALL points for ${teamName} from ${selectedGroup === 'finals' ? 'Finals' : (selectedGroup === 'groupA' ? 'Group A' : 'Group B')}? This will remove records from all matches!`,
            onConfirm: async () => {
                try {
                    const updatedSeasons = seasons.map(s => {
                        if (s.id === selectedSeasonForEdit.id) {
                            const days = JSON.parse(JSON.stringify(s.days || {}));
                            // Iterate through all days and matches in the current selection
                            Object.keys(days).forEach(dayKey => {
                                const dayData = days[dayKey];
                                if (!dayData) return;
                                
                                const targetCategoryData = dayData[selectedGroup];
                                if (targetCategoryData) {
                                    Object.keys(targetCategoryData).forEach(matchKey => {
                                        if (Array.isArray(targetCategoryData[matchKey])) {
                                            targetCategoryData[matchKey] = targetCategoryData[matchKey].filter(t => t.teamName !== teamName);
                                        }
                                    });
                                }
                            });
                            // If deleting from finals, also remove from the season's qualified list
                            if (selectedGroup === 'finals' && Array.isArray(s.qualifiedTeams)) {
                                s.qualifiedTeams = s.qualifiedTeams.filter(t => t !== teamName);
                            }
                            return { ...s, days };
                        }
                        return s;
                    });

                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    const updatePayload = {
                        pointsTable: JSON.stringify(updatedSeasons)
                    };

                    // If deleting from finals, also remove from official qualified list
                    if (selectedGroup === 'finals') {
                        const updatedFinalTeams = finalTeams.filter(t => t.teamName !== teamName);
                        updatePayload.finalTeamsData = JSON.stringify(updatedFinalTeams);
                        setFinalTeams(updatedFinalTeams);
                    }

                    await updateDoc(docRef, updatePayload);

                    setSeasons(updatedSeasons);
                    setSelectedSeasonForEdit(updatedSeasons.find(s => s.id === selectedSeasonForEdit.id));
                    setModal({ show: true, type: 'success', message: 'Team points deleted across all matches in this group!', onConfirm: null });
                } catch (error) {
                    console.error('Error deleting overall team:', error);
                    setModal({ show: true, type: 'error', message: 'Error deleting team', onConfirm: null });
                }
            }
        });
    };

    const handleDeleteTeamFromMatch = async (teamIndex) => {
        setModal({
            show: true,
            type: 'confirm',
            message: 'Delete this team from match?',
            onConfirm: async () => {
                try {
                    const updatedSeasons = seasons.map(s => {
                        if (s.id === selectedSeasonForEdit.id) {
                            const days = JSON.parse(JSON.stringify(s.days));
                            days[selectedDay][selectedGroup][selectedMatch].splice(teamIndex, 1);
                            return { ...s, days };
                        }
                        return s;
                    });

                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                    await updateDoc(docRef, {
                        pointsTable: JSON.stringify(updatedSeasons)
                    });

                    setSeasons(updatedSeasons);
                    setSelectedSeasonForEdit(updatedSeasons.find(s => s.id === selectedSeasonForEdit.id));
                    setModal({ show: true, type: 'success', message: 'Team deleted!', onConfirm: null });
                } catch (error) {
                    setModal({ show: true, type: 'error', message: 'Error deleting team', onConfirm: null });
                }
            }
        });
    };

    const handleQuickEditFromOverall = (teamName) => {
        const days = selectedSeasonForEdit.days || {};
        let found = false;
        const dayKeys = Object.keys(days).sort();
        
        for (const dKey of dayKeys) {
            const dayData = days[dKey];
            const groupData = dayData?.[selectedGroup];
            if (groupData) {
                const mKeys = Object.keys(groupData).sort();
                for (const mKey of mKeys) {
                    const matchArray = groupData[mKey];
                    if (Array.isArray(matchArray)) {
                        const tIdx = matchArray.findIndex(t => t.teamName === teamName);
                        if (tIdx !== -1) {
                            const tData = matchArray[tIdx];
                            setSelectedDay(dKey);
                            setSelectedMatch(mKey);
                            if (selectedGroup === 'finals') {
                                if (dKey === 'day3') setSelectedMatchReal(mKey);
                                else if (dKey === 'day4') setSelectedMatchReal(mKey === 'match1' ? 'match3' : 'match4');
                            }
                            handleEditTeamInMatch(tData, tIdx);
                            found = true;
                            break;
                        }
                    }
                }
            }
            if (found) break;
        }
        if (!found) {
            setModal({ show: true, type: 'error', message: 'No match data found for this team to edit!', onConfirm: null });
        }
    };

    const handleChangeTeamGroup = async (teamIndex, newGroup) => {
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
            
            const actualIndex = allTeams.findIndex(t => 
                t.teamName === teamToUpdate.teamName && 
                t.captainWhatsapp === teamToUpdate.captainWhatsapp
            );
            
            if (actualIndex !== -1) {
                allTeams[actualIndex].assignedGroup = newGroup;
                
                await updateDoc(docRef, {
                    bgmi: JSON.stringify(allTeams)
                });
                
                setModal({ show: true, type: 'success', message: `Team moved to Group ${newGroup}!`, onConfirm: null });
            }
        } catch (error) {
            setModal({ show: true, type: 'error', message: 'Error updating group', onConfirm: null });
        }
    };

    const recentRegistrations = teams.slice(0, 2);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e27', color: '#fff' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-modern">
            {/* Modals */}
            {modal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1a1f37', padding: '30px', borderRadius: '12px', maxWidth: '400px', border: '1px solid #2d3548' }}>
                        <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '20px' }}>
                            {modal.type === 'success' && '✅'}
                            {modal.type === 'error' && '❌'}
                            {modal.type === 'confirm' && '⚠️'}
                        </div>
                        <p style={{ color: '#f3f4f6', textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {modal.type === 'confirm' ? (
                                <>
                                    <button onClick={() => { modal.onConfirm(); setModal({ show: false, type: '', message: '', onConfirm: null }); }} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirm</button>
                                    <button onClick={() => setModal({ show: false, type: '', message: '', onConfirm: null })} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => setModal({ show: false, type: '', message: '', onConfirm: null })} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>OK</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddDayModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1a1f37', padding: '30px', borderRadius: '12px', maxWidth: '400px', border: '1px solid #2d3548' }}>
                        <h3 style={{ color: '#60a5fa', marginBottom: '20px' }}>Add New Day</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Day Name</label>
                            <input 
                                type="text" 
                                value={newDayName} 
                                onChange={e => setNewDayName(e.target.value)} 
                                placeholder="e.g., Day 4, Finals, Semi-Finals" 
                                style={{ width: '100%', padding: '10px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '6px', color: '#f3f4f6' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => {
                                    if (newDayName.trim()) {
                                        const updatedDays = [...customDays, newDayName.trim()];
                                        setCustomDays(updatedDays);
                                        // Save to season
                                        const updatedSeasons = seasons.map(s => 
                                            s.id === selectedSeasonForEdit.id ? { ...s, customDays: updatedDays } : s
                                        );
                                        setSeasons(updatedSeasons);
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        updateDoc(docRef, { pointsTable: JSON.stringify(updatedSeasons) });
                                        setNewDayName('');
                                        setShowAddDayModal(false);
                                    }
                                }} 
                                style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Add
                            </button>
                            <button 
                                onClick={() => { setShowAddDayModal(false); setNewDayName(''); }} 
                                style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSlotModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1a1f37', padding: '30px', borderRadius: '12px', maxWidth: '400px', border: '1px solid #2d3548' }}>
                        <h3 style={{ color: '#60a5fa', marginBottom: '20px' }}>Assign Slot Number</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Slot Number (1-100)</label>
                            <input 
                                type="number" 
                                value={slotData.slotNumber} 
                                onChange={e => setSlotData({ ...slotData, slotNumber: e.target.value })} 
                                placeholder="Enter slot number" 
                                min="1" 
                                max="100"
                                style={{ width: '100%', padding: '10px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '6px', color: '#f3f4f6' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleAssignSlot} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Assign</button>
                            <button onClick={() => { setShowSlotModal(false); setSlotData({ teamIndex: null, slotNumber: '' }); }} style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className="admin-sidebar">
                <div className="admin-logo">
                    <h2>🎮 BGMI ADMIN</h2>
                </div>
                
                <nav className="admin-nav">
                    <div 
                        className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => handleNavigation('overview')}
                    >
                        <span className="nav-item-icon">📊</span>
                        <span>Overview</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'teams' ? 'active' : ''}`}
                        onClick={() => handleNavigation('teams')}
                    >
                        <span className="nav-item-icon">👥</span>
                        <span>Teams</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'homeData' ? 'active' : ''}`}
                        onClick={() => handleNavigation('homeData')}
                    >
                        <span className="nav-item-icon">🏠</span>
                        <span>Home Data</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'matchSetup' ? 'active' : ''}`}
                        onClick={() => handleNavigation('matchSetup')}
                    >
                        <span className="nav-item-icon">⚙️</span>
                        <span>Match Setup</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'seasons' ? 'active' : ''}`}
                        onClick={() => handleNavigation('seasons')}
                    >
                        <span className="nav-item-icon">🏆</span>
                        <span>Seasons</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'rulesInfo' ? 'active' : ''}`}
                        onClick={() => handleNavigation('rulesInfo')}
                    >
                        <span className="nav-item-icon">📋</span>
                        <span>Rules & Info</span>
                    </div>
                    <div 
                        className={`nav-item ${activeSection === 'deletedTeams' ? 'active' : ''}`}
                        onClick={() => handleNavigation('deletedTeams')}
                    >
                        <span className="nav-item-icon">🗑️</span>
                        <span>Deleted Teams</span>
                    </div>
                </nav>
                
                <div className="admin-logout">
                    <button className="logout-button" onClick={handleLogout}>
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main">
                <div className="admin-header-bar">
                    <div>
                        <h1>{activeSection === 'overview' ? 'Overview' : activeSection === 'teams' ? 'Teams' : activeSection === 'homeData' ? 'Home' : 'Dashboard'}</h1>
                        <p>Welcome back, Admin.</p>
                    </div>
                    <div className="admin-toggles">
                        <div className="toggle-item">
                            <span className="toggle-label">Registration Fill Mode:</span>
                            <div 
                                className={`toggle-switch ${registrationFillMode ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !registrationFillMode;
                                    setRegistrationFillMode(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            registrationFillMode: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating registration fill mode:', error);
                                        setRegistrationFillMode(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Developer Mode:</span>
                            <div 
                                className={`toggle-switch ${developerMode ? 'active' : ''}`}
                                onClick={() => setDeveloperMode(!developerMode)}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Squad Registration:</span>
                            <div 
                                className={`toggle-switch ${squadRegistration ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !squadRegistration;
                                    setSquadRegistration(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            squadRegistrationEnabled: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating squad registration:', error);
                                        setSquadRegistration(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Screenshot Proof:</span>
                            <div 
                                className={`toggle-switch ${screenshotProof ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !screenshotProof;
                                    setScreenshotProof(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            screenshotProofEnabled: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating screenshot proof:', error);
                                        setScreenshotProof(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Group Active:</span>
                            <div 
                                className={`toggle-switch ${groupActive ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !groupActive;
                                    setGroupActive(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            groupActiveEnabled: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating group active:', error);
                                        setGroupActive(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Show All Teams:</span>
                            <div 
                                className={`toggle-switch ${showAllTeams ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !showAllTeams;
                                    setShowAllTeams(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            showAllTeamsEnabled: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating show all teams:', error);
                                        setShowAllTeams(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                        <div className="toggle-item">
                            <span className="toggle-label">Show Final Teams:</span>
                            <div 
                                className={`toggle-switch ${showFinalTeams ? 'active' : ''}`}
                                onClick={async () => {
                                    const newValue = !showFinalTeams;
                                    setShowFinalTeams(newValue);
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        await updateDoc(docRef, {
                                            showFinalTeamsEnabled: newValue
                                        });
                                    } catch (error) {
                                        console.error('Error updating show final teams:', error);
                                        setShowFinalTeams(!newValue);
                                    }
                                }}
                            >
                                <div className="toggle-slider"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-content">
                    {activeSection === 'overview' && (
                        <>
                            <div className="stats-grid-modern">
                                <div className="stat-card-modern cyan">
                                    <div className="stat-number">{stats.totalRegistered}</div>
                                    <div className="stat-label-modern">Total Registered</div>
                                </div>
                                <div className="stat-card-modern green">
                                    <div className="stat-number">{stats.standardSquad}</div>
                                    <div className="stat-label-modern">Standard Squad</div>
                                </div>
                                <div className="stat-card-modern blue">
                                    <div className="stat-number">{stats.tdmSolo}</div>
                                    <div className="stat-label-modern">TDM Solo</div>
                                </div>
                                <div className="stat-card-modern purple">
                                    <div className="stat-number">{stats.tdmDuo}</div>
                                    <div className="stat-label-modern">TDM Duo</div>
                                </div>
                                <div className="stat-card-modern blue">
                                    <div className="stat-number">{stats.tdmSquad}</div>
                                    <div className="stat-label-modern">TDM Squad</div>
                                </div>
                                <div className="stat-card-modern green">
                                    <div className="stat-number">{stats.totalApproved}</div>
                                    <div className="stat-label-modern">Total Approved</div>
                                </div>
                                <div className="stat-card-modern orange">
                                    <div className="stat-number">{stats.pendingReview}</div>
                                    <div className="stat-label-modern">Pending Review</div>
                                </div>
                                <div className="stat-card-modern red">
                                    <div className="stat-number">{stats.rejectedTeams}</div>
                                    <div className="stat-label-modern">Rejected Teams</div>
                                </div>
                            </div>

                            <div className="quick-actions-section">
                                <h2 className="section-title">Quick Actions</h2>
                                <div className="quick-actions-grid">
                                    <button className="quick-action-btn" onClick={() => handleNavigation('teams')}>
                                        <span className="quick-action-icon">👥</span>
                                        <span>Manage Teams</span>
                                    </button>
                                    <button className="quick-action-btn" onClick={() => navigate('/admin/old')}>
                                        <span className="quick-action-icon">🎯</span>
                                        <span>Manage TDM Modes</span>
                                    </button>
                                    <button className="quick-action-btn" onClick={() => navigate('/admin/old')}>
                                        <span className="quick-action-icon">🎮</span>
                                        <span>Setup Room ID</span>
                                    </button>
                                    <button className="quick-action-btn" onClick={() => navigate('/admin/old')}>
                                        <span className="quick-action-icon">📅</span>
                                        <span>Update Schedule</span>
                                    </button>
                                    <button className="quick-action-btn table-image-maker">
                                        <span className="quick-action-icon">📊</span>
                                        <span>Table Image Maker</span>
                                    </button>
                                    <button className="quick-action-btn" onClick={() => navigate('/seasons')}>
                                        <span className="quick-action-icon">📈</span>
                                        <span>View Public Standings</span>
                                    </button>
                                </div>
                            </div>

                            <div className="recent-section">
                                <div className="section-header">
                                    <h2 className="section-title" style={{ margin: 0 }}>Recent Registrations</h2>
                                    <button className="view-all-btn" onClick={() => handleNavigation('teams')}>View All</button>
                                </div>
                                <table className="registrations-table">
                                    <thead>
                                        <tr>
                                            <th>Team Name</th>
                                            <th>Mode</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentRegistrations.length > 0 ? (
                                            recentRegistrations.map((team, idx) => (
                                                <tr key={idx}>
                                                    <td>{team.teamName}</td>
                                                    <td>Squad</td>
                                                    <td>{team.registrationDate || '3/6/2026'}</td>
                                                    <td>
                                                        <span className={`status-badge-modern ${(team.status || 'pending').toLowerCase()}`}>
                                                            {team.status || 'Approved'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>
                                                    No registrations yet
                                                </td>
                                            </tr>
                                        )}
                                                                        </tbody>
                                </table>
                            </div>

                        </>
                    )}

                    {activeSection === 'teams' && (
                        <>
                            <div className="stats-grid-modern" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                <div className="stat-card-modern cyan" style={{ borderLeft: '4px solid #06b6d4' }}>
                                    <div className="stat-number">{teams.length}</div>
                                    <div className="stat-label-modern">All Teams</div>
                                </div>
                                <div className="stat-card-modern green" style={{ borderLeft: '4px solid #10b981' }}>
                                    <div className="stat-number">{teams.length}</div>
                                    <div className="stat-label-modern">Squad</div>
                                </div>
                                <div className="stat-card-modern blue" style={{ borderLeft: '4px solid #3b82f6' }}>
                                    <div className="stat-number">0</div>
                                    <div className="stat-label-modern">TDM Solo</div>
                                </div>
                                <div className="stat-card-modern purple" style={{ borderLeft: '4px solid #8b5cf6' }}>
                                    <div className="stat-number">0</div>
                                    <div className="stat-label-modern">TDM Duo</div>
                                </div>
                                <div className="stat-card-modern blue" style={{ borderLeft: '4px solid #3b82f6' }}>
                                    <div className="stat-number">0</div>
                                    <div className="stat-label-modern">TDM Squad</div>
                                </div>
                            </div>

                            <div className="recent-section" style={{ marginTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search within this category..."
                                        style={{
                                            flex: 1,
                                            minWidth: '250px',
                                            padding: '12px 16px',
                                            background: '#1a1f37',
                                            border: '1px solid #2d3548',
                                            borderRadius: '8px',
                                            color: '#f3f4f6',
                                            fontSize: '14px'
                                        }}
                                    />
                                    {groupActive && (
                                        <>
                                            <button 
                                                className="view-all-btn"
                                                style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
                                                onClick={handleAutoAssignGroups}
                                            >
                                                🎲 Auto Assign Groups
                                            </button>
                                            <button 
                                                className="view-all-btn"
                                                style={{ padding: '12px 20px', whiteSpace: 'nowrap', background: '#ef4444', borderColor: '#ef4444' }}
                                                onClick={handleRemoveAllGroups}
                                            >
                                                ❌ Remove All Groups
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        className="view-all-btn"
                                        style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
                                    >
                                        Download CSV
                                    </button>
                                </div>

                                {groupActive ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
                                        {/* Group A Box */}
                                        <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '2px solid #8b5cf6', borderRadius: '12px', padding: '20px' }}>
                                            <h3 style={{ color: '#8b5cf6', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                🟣 GROUP A ({teams.filter(t => t.assignedGroup === 'A').length} teams)
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {teams.filter(t => t.assignedGroup === 'A').sort((a, b) => (a.slotNumber || 999) - (b.slotNumber || 999)).map((team, idx) => (
                                                    <div key={idx} style={{ background: '#1a1f37', border: '1px solid #2d3548', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <div>
                                                                <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '14px' }}>#{team.slotNumber || 'Pending'}</span>
                                                                <span style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '16px', marginLeft: '10px' }}>{team.teamName}</span>
                                                            </div>
                                                            <span className={`status-badge-modern ${(team.status || 'pending').toLowerCase()}`} style={{ fontSize: '11px' }}>
                                                                {team.status || 'Pending'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                                                            📱 {team.captainPhone || team.captainWhatsapp || '-'}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '10px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                                                            <div><strong>P1:</strong> {team.player1Name}</div>
                                                            <div><strong>P2:</strong> {team.player2Name}</div>
                                                            <div><strong>P3:</strong> {team.player3Name}</div>
                                                            <div><strong>P4:</strong> {team.player4Name}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {team.status !== 'Approved' && (
                                                                <button className="view-all-btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#10b981', borderColor: '#10b981' }} onClick={() => handleApproveTeam(teams.indexOf(team))}>
                                                                    APPROVE
                                                                </button>
                                                            )}
                                                            {team.slotNumber ? (
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleRemoveSlot(teams.indexOf(team))}>
                                                                    REMOVE SLOT
                                                                </button>
                                                            ) : (
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer' }} onClick={() => { setSlotData({ teamIndex: teams.indexOf(team), slotNumber: '' }); setShowSlotModal(true); }}>
                                                                    ASSIGN SLOT
                                                                </button>
                                                            )}
                                                            <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleChangeTeamGroup(teams.indexOf(team), 'B')}>
                                                                MOVE TO B
                                                            </button>
                                                            <button style={{ padding: '4px 10px', fontSize: '11px', background: '#ef4444', border: '1px solid #ef4444', color: 'white', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDeleteTeam(teams.indexOf(team))}>
                                                                DELETE
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {teams.filter(t => t.assignedGroup === 'A').length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No teams in Group A</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Group B Box */}
                                        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '2px solid #10b981', borderRadius: '12px', padding: '20px' }}>
                                            <h3 style={{ color: '#10b981', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                🟢 GROUP B ({teams.filter(t => t.assignedGroup === 'B').length} teams)
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {teams.filter(t => t.assignedGroup === 'B').sort((a, b) => (a.slotNumber || 999) - (b.slotNumber || 999)).map((team, idx) => (
                                                    <div key={idx} style={{ background: '#1a1f37', border: '1px solid #2d3548', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <div>
                                                                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>#{team.slotNumber || 'Pending'}</span>
                                                                <span style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '16px', marginLeft: '10px' }}>{team.teamName}</span>
                                                            </div>
                                                            <span className={`status-badge-modern ${(team.status || 'pending').toLowerCase()}`} style={{ fontSize: '11px' }}>
                                                                {team.status || 'Pending'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                                                            📱 {team.captainPhone || team.captainWhatsapp || '-'}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '10px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                                                            <div><strong>P1:</strong> {team.player1Name}</div>
                                                            <div><strong>P2:</strong> {team.player2Name}</div>
                                                            <div><strong>P3:</strong> {team.player3Name}</div>
                                                            <div><strong>P4:</strong> {team.player4Name}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {team.status !== 'Approved' && (
                                                                <button className="view-all-btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#10b981', borderColor: '#10b981' }} onClick={() => handleApproveTeam(teams.indexOf(team))}>
                                                                    APPROVE
                                                                </button>
                                                            )}
                                                            {team.slotNumber ? (
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleRemoveSlot(teams.indexOf(team))}>
                                                                    REMOVE SLOT
                                                                </button>
                                                            ) : (
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer' }} onClick={() => { setSlotData({ teamIndex: teams.indexOf(team), slotNumber: '' }); setShowSlotModal(true); }}>
                                                                    ASSIGN SLOT
                                                                </button>
                                                            )}
                                                            <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleChangeTeamGroup(teams.indexOf(team), 'A')}>
                                                                MOVE TO A
                                                            </button>
                                                            <button style={{ padding: '4px 10px', fontSize: '11px', background: '#ef4444', border: '1px solid #ef4444', color: 'white', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDeleteTeam(teams.indexOf(team))}>
                                                                DELETE
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {teams.filter(t => t.assignedGroup === 'B').length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No teams in Group B</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unassigned Teams */}
                                        {teams.filter(t => !t.assignedGroup).length > 0 && (
                                            <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)', border: '2px solid #6b7280', borderRadius: '12px', padding: '20px' }}>
                                                <h3 style={{ color: '#9ca3af', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    📋 UNASSIGNED TEAMS ({teams.filter(t => !t.assignedGroup).length} teams)
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                                                    {teams.filter(t => !t.assignedGroup).sort((a, b) => (a.slotNumber || 999) - (b.slotNumber || 999)).map((team, idx) => (
                                                        <div key={idx} style={{ background: '#1a1f37', border: '1px solid #2d3548', borderRadius: '8px', padding: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                <div>
                                                                    <span style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '14px' }}>#{team.slotNumber || 'Pending'}</span>
                                                                    <span style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '16px', marginLeft: '10px' }}>{team.teamName}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                {team.status !== 'Approved' && (
                                                                    <button className="view-all-btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#10b981', borderColor: '#10b981' }} onClick={() => handleApproveTeam(teams.indexOf(team))}>
                                                                        APPROVE
                                                                    </button>
                                                                )}
                                                                {team.slotNumber ? (
                                                                    <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleRemoveSlot(teams.indexOf(team))}>
                                                                        REMOVE SLOT
                                                                    </button>
                                                                ) : (
                                                                    <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer' }} onClick={() => { setSlotData({ teamIndex: teams.indexOf(team), slotNumber: '' }); setShowSlotModal(true); }}>
                                                                        ASSIGN SLOT
                                                                    </button>
                                                                )}
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleChangeTeamGroup(teams.indexOf(team), 'A')}>
                                                                    SET G-A
                                                                </button>
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleChangeTeamGroup(teams.indexOf(team), 'B')}>
                                                                    SET G-B
                                                                </button>
                                                                <button style={{ padding: '4px 10px', fontSize: '11px', background: '#ef4444', border: '1px solid #ef4444', color: 'white', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDeleteTeam(teams.indexOf(team))}>
                                                                    DELETE
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <table className="registrations-table">
                                        <thead>
                                            <tr>
                                                {groupActive && <th>Group</th>}
                                                <th>Slot</th>
                                                <th>Team Name</th>
                                                <th>Phone</th>
                                                <th>Email</th>
                                                <th>Players</th>
                                                <th>TDM Status</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                    <tbody>
                                        {teams.length > 0 ? (
                                            [...teams].sort((a, b) => {
                                                if (a.assignedGroup === 'A' && b.assignedGroup !== 'A') return -1;
                                                if (a.assignedGroup !== 'A' && b.assignedGroup === 'A') return 1;
                                                if (a.assignedGroup === 'B' && !b.assignedGroup) return -1;
                                                if (!a.assignedGroup && b.assignedGroup === 'B') return 1;
                                                return (a.slotNumber || 999) - (b.slotNumber || 999);
                                            }).map((team, idx) => (
                                                <tr key={idx}>
                                                    {groupActive && (
                                                        <td>
                                                            {team.assignedGroup ? (
                                                                <span style={{ padding: '4px 8px', background: team.assignedGroup === 'A' ? '#8b5cf6' : '#10b981', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                                    Group {team.assignedGroup}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#6b7280' }}>-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td><strong>#{team.slotNumber || 'Pending'}</strong></td>
                                                    <td><strong>{team.teamName}</strong></td>
                                                    <td>{team.captainPhone || team.captainWhatsapp || '-'}</td>
                                                    <td style={{ fontSize: '12px' }}>{team.captainEmail || team.email}</td>
                                                    <td>
                                                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                            <div><strong>P1:</strong> {team.player1Name}{team.player1Id ? ` - ${team.player1Id}` : ''}</div>
                                                            <div><strong>P2:</strong> {team.player2Name}{team.player2Id ? ` - ${team.player2Id}` : ''}</div>
                                                            <div><strong>P3:</strong> {team.player3Name}{team.player3Id ? ` - ${team.player3Id}` : ''}</div>
                                                            <div><strong>P4:</strong> {team.player4Name}{team.player4Id ? ` - ${team.player4Id}` : ''}</div>
                                                        </div>
                                                    </td>
                                                    <td>-</td>
                                                    <td>
                                                        <span className={`status-badge-modern ${(team.status || 'pending').toLowerCase()}`}>
                                                            {team.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {team.status === 'Approved' ? (
                                                                <span style={{ padding: '6px 12px', fontSize: '12px', color: '#10b981', whiteSpace: 'nowrap' }}>✓ Approved</span>
                                                            ) : (
                                                                <button 
                                                                    className="view-all-btn"
                                                                    style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', background: '#10b981', borderColor: '#10b981' }}
                                                                    onClick={() => handleApproveTeam(idx)}
                                                                >
                                                                    APPROVE
                                                                </button>
                                                            )}
                                                            {team.slotNumber ? (
                                                                <button 
                                                                    style={{ 
                                                                        padding: '6px 12px', 
                                                                        fontSize: '12px', 
                                                                        background: 'transparent',
                                                                        border: '1px solid #f59e0b',
                                                                        color: '#f59e0b',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                    onClick={() => handleRemoveSlot(idx)}
                                                                >
                                                                    REMOVE SLOT
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    style={{ 
                                                                        padding: '6px 12px', 
                                                                        fontSize: '12px', 
                                                                        background: 'transparent',
                                                                        border: '1px solid #3b82f6',
                                                                        color: '#3b82f6',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                    onClick={() => { setSlotData({ teamIndex: idx, slotNumber: team.slotNumber || '' }); setShowSlotModal(true); }}
                                                                >
                                                                    ASSIGN SLOT
                                                                </button>
                                                            )}
                                                            <button 
                                                                style={{ 
                                                                    padding: '6px 12px', 
                                                                    fontSize: '12px', 
                                                                    background: 'transparent',
                                                                    border: '1px solid #ef4444',
                                                                    color: '#ef4444',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                onClick={() => handleRejectTeam(idx)}
                                                            >
                                                                REJECT
                                                            </button>
                                                            <button 
                                                                style={{ 
                                                                    padding: '6px 12px', 
                                                                    fontSize: '12px', 
                                                                    background: '#ef4444',
                                                                    border: '1px solid #ef4444',
                                                                    color: 'white',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                onClick={() => handleDeleteTeam(idx)}
                                                            >
                                                                DELETE
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                                                    No teams registered yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody></table>)}</div>
                        </>
                    )}

                    {activeSection === 'homeData' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ padding: '30px', background: '#141b2d', border: '2px solid #3b82f6', borderRadius: '12px' }}>
                                <h2 style={{ color: '#60a5fa', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
                                    <span>🌐</span> HOME PAGE LIVE DATA
                                </h2>
                                <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '14px' }}>Update the main content of your home page in real-time.</p>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>📝 Hero Description Text</label>
                                    <textarea
                                        placeholder="e.g. Join the ultimate BGMI showdown. Register your squad and dominate..."
                                        style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', minHeight: '100px', fontSize: '14px', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>👥 Teams Count (Stat)</label>
                                        <input type="text" placeholder="89+" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>💰 Prize Highlight</label>
                                        <input type="text" placeholder="1000" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>🔴 Status Label</label>
                                        <input type="text" placeholder="Live" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>📱 WhatsApp Group Link</label>
                                        <input type="text" placeholder="https://chat.whatsapp.com/ExlXganl585DQwM" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>📷 Instagram Profile Link</label>
                                        <input type="text" placeholder="https://www.instagram.com/6swesports?igsh=" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }} />
                                    </div>
                                </div>

                                <button style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.target.style.background = '#2563eb'}
                                    onMouseLeave={e => e.target.style.background = '#3b82f6'}
                                >
                                    Save Home Updates
                                </button>
                            </div>
                        </div>
                    )}

                    {activeSection === 'seasons' && (
                        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{ padding: '30px', background: '#141b2d', border: '2px solid #3b82f6', borderRadius: '12px', marginBottom: '30px' }}>
                                <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>Manage Seasons</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                    <input
                                        type="text"
                                        placeholder="Season Name (e.g., Season 1)"
                                        value={seasonForm.name}
                                        onChange={e => setSeasonForm({ ...seasonForm, name: e.target.value })}
                                        style={{ padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Date (e.g., Jan 2024) - Optional"
                                        value={seasonForm.date}
                                        onChange={e => setSeasonForm({ ...seasonForm, date: e.target.value })}
                                        style={{ padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }}
                                    />
                                    <select
                                        value={seasonForm.status}
                                        onChange={e => setSeasonForm({ ...seasonForm, status: e.target.value })}
                                        style={{ padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px' }}
                                    >
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Live">Live</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <button
                                        onClick={handleAddSeason}
                                        style={{ padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        + Add Season
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                {Array.isArray(seasons) && seasons.map((season) => (
                                    <div key={season.id} style={{ 
                                        padding: '20px', 
                                        background: '#141b2d', 
                                        border: '2px solid #2d3548', 
                                        borderRadius: '12px',
                                        transition: 'all 0.3s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <h3 style={{ color: '#60a5fa', margin: '0 0 5px 0', fontSize: '1.3rem' }}>{season.name}</h3>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>📅 {season.date || 'No date'}</span>
                                                    <span className={`status-badge-modern ${season.status.toLowerCase()}`}>
                                                        {season.status}
                                                    </span>
                                                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>👥 {season.teams || teams.length} Teams</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleEditSeasonPoints(season)}
                                                style={{ padding: '8px 16px', fontSize: '13px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                                            >
                                                👁️ Manage
                                            </button>
                                            {season.finalsActive && showFinalTeams && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSeasonForEdit(season);
                                                        setActiveSection('finalTeamsTable');
                                                    }}
                                                    style={{ padding: '8px 16px', fontSize: '13px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                                                >
                                                    📊 Final Teams Table
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggleOverall(season.id, season.showOverall)}
                                                style={{ padding: '8px 16px', fontSize: '13px', background: season.showOverall ? '#10b981' : 'transparent', border: `1px solid ${season.showOverall ? '#10b981' : '#3b82f6'}`, color: season.showOverall ? 'white' : '#3b82f6', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                                            >
                                                OVERALL {season.showOverall ? 'ON' : 'OFF'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSeason(season.id)}
                                                style={{ padding: '8px 16px', fontSize: '13px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {Array.isArray(seasons) && seasons.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                    No seasons created yet
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'rulesInfo' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ padding: '30px', background: '#141b2d', border: '2px solid #3b82f6', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                    <h2 style={{ color: '#60a5fa', margin: 0 }}>📋 Edit Tournament Information</h2>
                                    <button onClick={() => {
                                        setTournamentInfo({
                                            tournamentName: 'SEASON 4',
                                            tournamentStatus: 'Live',
                                            currentDay: 'DAY 4',
                                            subTitle: 'OVERALL STANDINGS',
                                            firstPrize: '400',
                                            secondPrize: '200',
                                            thirdPrize: '₹100',
                                            mvpPrize: '50',
                                            totalMatches: '8',
                                            dailyMatches: '2',
                                            todayMatches: '2',
                                            registrationFee: 'FREE',
                                            feeDescription: 'No entry fee required! Just register and play.',
                                            rules: ['✅ Squad format (4 players + 1 substitute)', '✅ No emulator players allowed', '✅ Screen recording mandatory'],
                                            heroDescription: 'Join the ultimate BGMI showdown. Register your squad and dominate the leaderboard.',
                                            teamsCount: '100+',
                                            prizePool: '₹50K',
                                            statusLabel: 'Live'
                                        });
                                    }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', borderRadius: '8px', cursor: 'pointer' }}>Fill Dummy Data</button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                        const docSnap = await getDoc(docRef);
                                        let fullData = {};
                                        if (docSnap.exists() && docSnap.data().tournamentInfo) {
                                            fullData = JSON.parse(docSnap.data().tournamentInfo);
                                        }
                                        await updateDoc(docRef, { tournamentInfo: JSON.stringify({ ...fullData, ...tournamentInfo }) });
                                        setModal({ show: true, type: 'success', message: 'Tournament info updated!', onConfirm: null });
                                    } catch (error) {
                                        setModal({ show: true, type: 'error', message: 'Failed to update', onConfirm: null });
                                    }
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>🏆 Tournament Name</label>
                                            <input type="text" value={tournamentInfo.tournamentName} onChange={e => setTournamentInfo({...tournamentInfo, tournamentName: e.target.value})} placeholder="SEASON 4" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>📡 Tournament Status</label>
                                            <select value={tournamentInfo.tournamentStatus} onChange={e => setTournamentInfo({...tournamentInfo, tournamentStatus: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', cursor: 'pointer', boxSizing: 'border-box' }}>
                                                <option value="Upcoming">🟡 Upcoming</option>
                                                <option value="Live">🟢 Live</option>
                                                <option value="Closed">🔴 Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>📅 Current Day Tag</label>
                                            <input type="text" value={tournamentInfo.currentDay} onChange={e => setTournamentInfo({...tournamentInfo, currentDay: e.target.value})} placeholder="DAY 4" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>🔖 Top Headline</label>
                                            <input type="text" value={tournamentInfo.subTitle} onChange={e => setTournamentInfo({...tournamentInfo, subTitle: e.target.value})} placeholder="OVERALL STANDINGS" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>1st Prize 🥇</label>
                                            <input type="text" value={tournamentInfo.firstPrize} onChange={e => setTournamentInfo({...tournamentInfo, firstPrize: e.target.value})} placeholder="400" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>2nd Prize 🥈</label>
                                            <input type="text" value={tournamentInfo.secondPrize} onChange={e => setTournamentInfo({...tournamentInfo, secondPrize: e.target.value})} placeholder="200" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>3rd Prize 🥉</label>
                                            <input type="text" value={tournamentInfo.thirdPrize} onChange={e => setTournamentInfo({...tournamentInfo, thirdPrize: e.target.value})} placeholder="₹100" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>MVP Prize 🏆</label>
                                            <input type="text" value={tournamentInfo.mvpPrize} onChange={e => setTournamentInfo({...tournamentInfo, mvpPrize: e.target.value})} placeholder="50" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Total Matches 🎮</label>
                                            <input type="text" value={tournamentInfo.totalMatches} onChange={e => setTournamentInfo({...tournamentInfo, totalMatches: e.target.value})} placeholder="8" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Daily Matches 📅</label>
                                            <input type="text" value={tournamentInfo.dailyMatches} onChange={e => setTournamentInfo({...tournamentInfo, dailyMatches: e.target.value})} placeholder="2" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Today's Match 🔥</label>
                                            <input type="text" value={tournamentInfo.todayMatches} onChange={e => setTournamentInfo({...tournamentInfo, todayMatches: e.target.value})} placeholder="2" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Registration Fee</label>
                                            <input type="text" value={tournamentInfo.registrationFee} onChange={e => setTournamentInfo({...tournamentInfo, registrationFee: e.target.value})} placeholder="FREE" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Hero Description</label>
                                        <textarea rows="3" value={tournamentInfo.heroDescription} onChange={e => setTournamentInfo({...tournamentInfo, heroDescription: e.target.value})} placeholder="Join the ultimate BGMI showdown..." style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box', resize: 'vertical' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Teams Count</label>
                                            <input type="text" value={tournamentInfo.teamsCount} onChange={e => setTournamentInfo({...tournamentInfo, teamsCount: e.target.value})} placeholder="100+" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Prize Pool</label>
                                            <input type="text" value={tournamentInfo.prizePool} onChange={e => setTournamentInfo({...tournamentInfo, prizePool: e.target.value})} placeholder="₹50K" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Status Label</label>
                                            <input type="text" value={tournamentInfo.statusLabel} onChange={e => setTournamentInfo({...tournamentInfo, statusLabel: e.target.value})} placeholder="Live" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>WhatsApp Group Link</label>
                                            <input type="text" value={tournamentInfo.whatsappLink || ''} onChange={e => setTournamentInfo({...tournamentInfo, whatsappLink: e.target.value})} placeholder="https://chat.whatsapp.com/..." style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Instagram Link</label>
                                            <input type="text" value={tournamentInfo.instagramLink || ''} onChange={e => setTournamentInfo({...tournamentInfo, instagramLink: e.target.value})} placeholder="https://instagram.com/..." style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Fee Description</label>
                                        <input type="text" value={tournamentInfo.feeDescription} onChange={e => setTournamentInfo({...tournamentInfo, feeDescription: e.target.value})} placeholder="No entry fee required!" style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' }}>Rules (JSON Array)</label>
                                        <textarea rows="8" value={JSON.stringify(tournamentInfo.rules, null, 2)} onChange={e => { try { setTournamentInfo({...tournamentInfo, rules: JSON.parse(e.target.value)}); } catch(err){} }} placeholder='["✅ Rule 1", "✅ Rule 2"]' style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }} />
                                    </div>
                                    <button type="submit" style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Update Tournament Info</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeSection === 'deletedTeams' && (
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>🗑️ Deleted Teams ({deletedTeams.length})</h2>
                            
                            {deletedTeams.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', background: '#141b2d', borderRadius: '12px' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>No deleted teams</p>
                                </div>
                            ) : (
                                <table className="registrations-table">
                                    <thead>
                                        <tr>
                                            <th>Team Name</th>
                                            <th>Phone</th>
                                            <th>Players</th>
                                            <th>Deleted At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(deletedTeams) && deletedTeams.map((team, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{team.teamName}</strong></td>
                                                <td>{team.captainWhatsapp}</td>
                                                <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    {team.player1Name}, {team.player2Name}, {team.player3Name}, {team.player4Name}
                                                </td>
                                                <td style={{ fontSize: '12px' }}>
                                                    {team.deletedAt ? new Date(team.deletedAt).toLocaleString() : '-'}
                                                </td>
                                                <td>
                                                    <button 
                                                        style={{ 
                                                            padding: '6px 12px', 
                                                            fontSize: '12px', 
                                                            background: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleRestoreTeam(team.teamName, team.captainWhatsapp)}
                                                    >
                                                        ↺ RESTORE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeSection === 'finalTeamsTable' && selectedSeasonForEdit && (
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <button onClick={() => { setActiveSection('seasons'); setSelectedSeasonForEdit(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>← Back to Seasons</button>
                            
                            <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>🏆 Final Teams Point Table - {selectedSeasonForEdit.name}</h2>
                            
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1f37', borderRadius: '8px', border: '1px solid #2d3548' }}>
                                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                    <strong style={{ color: '#60a5fa' }}>Add points for Day 3 & Day 4 finals matches</strong> - Only qualified teams (20 teams) will appear in the dropdown
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {['Day 3', 'Day 4'].map((day, idx) => (
                                    <button 
                                        key={day} 
                                        onClick={() => {
                                            setSelectedDay(`day${idx + 3}`);
                                            setSelectedMatch('match1');
                                        }} 
                                        style={{ 
                                            padding: '10px 20px', 
                                            background: selectedDay === `day${idx + 3}` ? '#3b82f6' : 'transparent', 
                                            border: '1px solid #3b82f6', 
                                            color: selectedDay === `day${idx + 3}` ? 'white' : '#3b82f6', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {['Match 1', 'Match 2'].map((match, idx) => (
                                    <button 
                                        key={match} 
                                        onClick={() => setSelectedMatch(`match${idx + 1}`)} 
                                        style={{ 
                                            padding: '8px 16px', 
                                            background: selectedMatch === `match${idx + 1}` ? '#10b981' : 'transparent', 
                                            border: '1px solid #10b981', 
                                            color: selectedMatch === `match${idx + 1}` ? 'white' : '#10b981', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {match}
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '25px', background: 'linear-gradient(135deg, #1a1f37 0%, #141b2d 100%)', borderRadius: '15px', marginBottom: '25px', border: '2px solid #3b82f6', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)' }}>
                                <h3 style={{ color: '#60a5fa', marginBottom: '20px', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>➕</span> Add Team Points
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Team Name</label>
                                        <select value={teamPointsForm.teamName} onChange={e => setTeamPointsForm({ ...teamPointsForm, teamName: e.target.value })} style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', cursor: 'pointer', height: '48px' }}>
                                            <option value="">Select Team</option>
                                            {selectedSeasonForEdit.qualifiedTeams && selectedSeasonForEdit.qualifiedTeams.map(teamName => (
                                                <option key={teamName} value={teamName}>{teamName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Place Rank</label>
                                        <select 
                                            value={teamPointsForm.placePoints} 
                                            onChange={e => {
                                                const points = e.target.value;
                                                const rank = e.target.selectedOptions[0].text.split('(')[0].trim();
                                                const wwcd = rank === '1st' ? '1' : '0';
                                                const total = calculateTotal(wwcd, points, teamPointsForm.killPoints);
                                                setTeamPointsForm({ 
                                                    ...teamPointsForm, 
                                                    placePoints: points,
                                                    wwcd: wwcd,
                                                    totalPoints: total, 
                                                    remarks: `Total: ${total}` 
                                                });
                                            }} 
                                            style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', cursor: 'pointer', height: '48px' }}
                                        >
                                            <option value="">Select Rank</option>
                                            <option value="10">1st (10pts)</option>
                                            <option value="6">2nd (6pts)</option>
                                            <option value="5">3rd (5pts)</option>
                                            <option value="4">4th (4pts)</option>
                                            <option value="3">5th (3pts)</option>
                                            <option value="2">6th (2pts)</option>
                                            <option value="1">7th (1pts)</option>
                                            <option value="1">8th (1pts)</option>
                                            <option value="1">9th (1pts)</option>
                                            <option value="0">10th+ (0pts)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Place Points</label>
                                        <input 
                                            type="text" 
                                            placeholder="Auto" 
                                            value={teamPointsForm.placePoints || ''} 
                                            readOnly
                                            style={{ width: '100%', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', borderRadius: '8px', color: '#3b82f6', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', cursor: 'not-allowed', height: '48px', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>WWCD (Auto)</label>
                                        <input 
                                            type="text" 
                                            placeholder="0" 
                                            value={teamPointsForm.wwcd || '0'} 
                                            readOnly
                                            style={{ width: '100%', padding: '12px', background: 'rgba(255, 215, 0, 0.1)', border: '2px solid #ffd700', borderRadius: '8px', color: '#ffd700', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', cursor: 'not-allowed', height: '48px', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Kill Points</label>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={teamPointsForm.killPoints} 
                                            onChange={e => {
                                                const kills = e.target.value;
                                                const total = calculateTotal(teamPointsForm.wwcd, teamPointsForm.placePoints, kills);
                                                setTeamPointsForm({ ...teamPointsForm, killPoints: kills, totalPoints: total, remarks: `Total: ${total}` });
                                            }} 
                                            style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', height: '48px', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Total Points</label>
                                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', boxSizing: 'border-box' }}>
                                            {teamPointsForm.totalPoints || 0}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={async () => {
                                        if (!teamPointsForm.teamName) {
                                            setModal({ show: true, type: 'error', message: 'Please select a team', onConfirm: null });
                                            return;
                                        }

                                        try {
                                            const updatedSeasons = seasons.map(s => {
                                                if (s.id === selectedSeasonForEdit.id) {
                                                    const days = JSON.parse(JSON.stringify(s.days || {}));
                                                    
                                                    if (!days[selectedDay]) days[selectedDay] = {};
                                                    if (!days[selectedDay].finals) days[selectedDay].finals = {};
                                                    if (!Array.isArray(days[selectedDay].finals[selectedMatch])) {
                                                        days[selectedDay].finals[selectedMatch] = [];
                                                    }
                                                    
                                                    const totalPoints = parseInt(teamPointsForm.placePoints || 0) + parseInt(teamPointsForm.killPoints || 0);
                                                    
                                                    days[selectedDay].finals[selectedMatch].push({ 
                                                        teamName: teamPointsForm.teamName,
                                                        wwcd: teamPointsForm.wwcd,
                                                        placePoints: teamPointsForm.placePoints,
                                                        killPoints: teamPointsForm.killPoints,
                                                        totalPoints,
                                                        remarks: `Total: ${totalPoints}`
                                                    });
                                                    
                                                    return { ...s, days };
                                                }
                                                return s;
                                            });

                                            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                            await updateDoc(docRef, {
                                                pointsTable: JSON.stringify(updatedSeasons)
                                            });

                                            setSeasons(updatedSeasons);
                                            setSelectedSeasonForEdit(updatedSeasons.find(s => s.id === selectedSeasonForEdit.id));
                                            
                                            setTeamPointsForm({ teamName: '', wwcd: '', placePoints: '', killPoints: '', totalPoints: 0, remarks: '' });
                                            setModal({ show: true, type: 'success', message: 'Team added successfully!', onConfirm: null });
                                        } catch (error) {
                                            console.error('Error adding team:', error);
                                            setModal({ show: true, type: 'error', message: `Error: ${error.message}`, onConfirm: null });
                                        }
                                    }} 
                                    style={{ 
                                        width: '100%', 
                                        marginTop: '20px', 
                                        padding: '14px 20px', 
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '10px', 
                                        cursor: 'pointer', 
                                        fontWeight: 'bold', 
                                        fontSize: '15px',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                >
                                    ➕ Add Team
                                </button>
                            </div>

                            <table className="registrations-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team Name</th>
                                        <th>WWCD</th>
                                        <th>Place Pts</th>
                                        <th>Kill Pts</th>
                                        <th>Total</th>
                                        <th>Remarks</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(selectedSeasonForEdit.days?.[selectedDay]?.finals?.[selectedMatch]) && selectedSeasonForEdit.days[selectedDay].finals[selectedMatch].length > 0 ? (
                                        selectedSeasonForEdit.days[selectedDay].finals[selectedMatch].map((team, idx) => (
                                            <tr key={idx}>
                                                <td>#{idx + 1}</td>
                                                <td><strong>{team.teamName}</strong></td>
                                                <td>{team.wwcd || 0}</td>
                                                <td>{team.placePoints || 0}</td>
                                                <td>{team.killPoints || 0}</td>
                                                <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{team.totalPoints || 0}</td>
                                                <td>{team.remarks || '-'}</td>
                                                <td>
                                                    <button onClick={async () => {
                                                        try {
                                                            const updatedSeasons = seasons.map(s => {
                                                                if (s.id === selectedSeasonForEdit.id) {
                                                                    const days = { ...s.days };
                                                                    days[selectedDay].finals[selectedMatch].splice(idx, 1);
                                                                    return { ...s, days };
                                                                }
                                                                return s;
                                                            });

                                                            const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                                            await updateDoc(docRef, {
                                                                pointsTable: JSON.stringify(updatedSeasons)
                                                            });

                                                            setSeasons(updatedSeasons);
                                                            setSelectedSeasonForEdit(updatedSeasons.find(s => s.id === selectedSeasonForEdit.id));
                                                            setModal({ show: true, type: 'success', message: 'Team deleted!', onConfirm: null });
                                                        } catch (error) {
                                                            setModal({ show: true, type: 'error', message: 'Error deleting team', onConfirm: null });
                                                        }
                                                    }} style={{ padding: '6px 12px', fontSize: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No teams added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeSection === 'editSeasonPoints' && selectedSeasonForEdit && (
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <button onClick={() => { setActiveSection('seasons'); setSelectedSeasonForEdit(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>← Back to Seasons</button>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                                <h2 style={{ color: '#60a5fa', margin: 0 }}>Manage Teams - {selectedSeasonForEdit.name}</h2>
                            </div>
                            
                            {/* Level 1: Categories */}
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
                                <button 
                                    onClick={() => { setSelectedGroup('groupA'); setSelectedDay('overall'); }}
                                    style={{ padding: '12px 24px', background: (selectedGroup === 'groupA' || selectedGroup === 'groupB') ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)', color: (selectedGroup === 'groupA' || selectedGroup === 'groupB') ? '#fff' : '#8b5cf6', border: '2px solid #8b5cf6', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    🏟️ Qualifiers (Group A/B)
                                </button>
                                <button 
                                    onClick={() => { setSelectedGroup('finals'); setSelectedDay('overall'); }}
                                    style={{ padding: '12px 24px', background: selectedGroup === 'finals' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)', color: selectedGroup === 'finals' ? '#fff' : '#f59e0b', border: '2px solid #f59e0b', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    🏆 Finals
                                </button>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }}></div>

                            {/* Level 2: Days selection */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                <button 
                                    onClick={() => setSelectedDay('overall')} 
                                    style={{ padding: '10px 20px', background: selectedDay === 'overall' ? '#3b82f6' : 'transparent', border: '1px solid #3b82f6', color: selectedDay === 'overall' ? 'white' : '#3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Overall Standings
                                </button>

                                {selectedGroup !== 'finals' ? (
                                    <>
                                        {['day1', 'day2'].map((day, idx) => (
                                            <button 
                                                key={day} 
                                                onClick={() => { setSelectedDay(day); setSelectedMatch('match1'); setSelectedGroup(day === 'day1' ? 'groupA' : 'groupB'); }}
                                                style={{ padding: '10px 20px', background: selectedDay === day ? '#3b82f6' : 'transparent', border: '1px solid #3b82f6', color: selectedDay === day ? 'white' : '#3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Day {idx + 1}
                                            </button>
                                        ))}
                                        {/* Qualify Button - Moved here for logic flow */}
                                        <button 
                                            onClick={() => handleQualifyTeamsForFinals(selectedSeasonForEdit.id)}
                                            style={{ padding: '10px 20px', background: '#f59e0b', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            🏆 Qualify Finals
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {Array.from({ length: visibleMatchCount }, (_, i) => i + 1).map((num) => (
                                            <button 
                                                key={num} 
                                                onClick={() => {
                                                    if (num <= 2) setSelectedDay('day3');
                                                    else if (num <= 4) setSelectedDay('day4');
                                                    else setSelectedDay('day5');
                                                    
                                                    const matchKey = `match${num <= 2 ? num : (num <= 4 ? num - 2 : num - 4)}`;
                                                    setSelectedMatch(matchKey);
                                                    setSelectedMatchReal(`match${num}`); 
                                                }}
                                                style={{ padding: '10px 20px', background: selectedMatchReal === `match${num}` ? '#3b82f6' : 'transparent', border: '1px solid #3b82f6', color: selectedMatchReal === `match${num}` ? 'white' : '#3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Match {num}
                                            </button>
                                        ))}
                                        {visibleMatchCount < 6 && (
                                            <button 
                                                onClick={async () => {
                                                    const newCount = Math.min(visibleMatchCount + 1, 6);
                                                    setVisibleMatchCount(newCount);
                                                    try {
                                                        const updatedSeasons = seasons.map(s => 
                                                            s.id === selectedSeasonForEdit.id ? { ...s, visibleMatches: newCount } : s
                                                        );
                                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                                        await updateDoc(docRef, { pointsTable: JSON.stringify(updatedSeasons) });
                                                    } catch (e) {}
                                                }}
                                                style={{ padding: '10px 20px', background: '#10b981', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                + Add Match
                                            </button>
                                        )}
                                        {visibleMatchCount > 1 && (
                                            <button 
                                                onClick={async () => {
                                                    const newCount = Math.max(visibleMatchCount - 1, 1);
                                                    setVisibleMatchCount(newCount);
                                                    try {
                                                        const updatedSeasons = seasons.map(s => 
                                                            s.id === selectedSeasonForEdit.id ? { ...s, visibleMatches: newCount } : s
                                                        );
                                                        const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                                        await updateDoc(docRef, { pointsTable: JSON.stringify(updatedSeasons) });
                                                    } catch (e) {}
                                                }}
                                                style={{ padding: '10px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                - Remove Match
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Level 3: Match Selection with Auto-Group Logic for Qualifiers */}
                            {selectedGroup !== 'finals' && selectedDay !== 'overall' && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                    {Array.from({ length: visibleMatchCount }, (_, i) => i + 1).map(num => {
                                        // User Rule Implementation:
                                        // Day 1: 1=A, 2=B, 3=A, 4=B...
                                        // Day 2: 1=B, 2=A, 3=B, 4=A...
                                        let matchGroup = 'A';
                                        if (selectedDay === 'day1') {
                                            matchGroup = num % 2 === 0 ? 'B' : 'A';
                                        } else {
                                            matchGroup = num % 2 === 0 ? 'A' : 'B';
                                        }

                                        return (
                                            <button 
                                                key={num} 
                                                onClick={() => {
                                                    setSelectedMatch(`match${num}`);
                                                    setSelectedGroup(matchGroup === 'A' ? 'groupA' : 'groupB');
                                                }} 
                                                style={{ 
                                                    padding: '10px 20px', 
                                                    background: selectedMatch === `match${num}` ? (matchGroup === 'A' ? '#8b5cf6' : '#10b981') : 'transparent', 
                                                    border: `1px solid ${matchGroup === 'A' ? '#8b5cf6' : '#10b981'}`, 
                                                    color: selectedMatch === `match${num}` ? 'white' : (matchGroup === 'A' ? '#8b5cf6' : '#10b981'), 
                                                    borderRadius: '6px', 
                                                    cursor: 'pointer', 
                                                    fontWeight: '700',
                                                    fontSize: '13px' 
                                                }}
                                            >
                                                Match {num} (G-{matchGroup})
                                            </button>
                                        );
                                    })}
                                    {visibleMatchCount < 6 && (
                                        <button 
                                            onClick={async () => {
                                                const newCount = Math.min(visibleMatchCount + 1, 6);
                                                setVisibleMatchCount(newCount);
                                                try {
                                                    const updatedSeasons = seasons.map(s => 
                                                        s.id === selectedSeasonForEdit.id ? { ...s, visibleMatches: newCount } : s
                                                    );
                                                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                                    await updateDoc(docRef, { pointsTable: JSON.stringify(updatedSeasons) });
                                                } catch (e) {}
                                            }}
                                            style={{ padding: '8px 15px', background: '#10b981', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                        >
                                            + Add Match
                                        </button>
                                    )}
                                    {visibleMatchCount > 1 && (
                                        <button 
                                            onClick={async () => {
                                                const newCount = Math.max(visibleMatchCount - 1, 1);
                                                setVisibleMatchCount(newCount);
                                                try {
                                                    const updatedSeasons = seasons.map(s => 
                                                        s.id === selectedSeasonForEdit.id ? { ...s, visibleMatches: newCount } : s
                                                    );
                                                    const docRef = doc(db, "DATA", "tgAL1VaR1AnqAEk6A4oc");
                                                    await updateDoc(docRef, { pointsTable: JSON.stringify(updatedSeasons) });
                                                } catch (e) {}
                                            }}
                                            style={{ padding: '8px 15px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                        >
                                            - Remove Match
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Overall Standing View: Group A vs Group B selection */}
                            {selectedGroup !== 'finals' && selectedDay === 'overall' && (
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
                                    <button 
                                        onClick={() => setSelectedGroup('groupA')}
                                        style={{ padding: '8px 16px', background: selectedGroup === 'groupA' ? '#8b5cf6' : 'transparent', border: '1px solid #8b5cf6', color: selectedGroup === 'groupA' ? 'white' : '#8b5cf6', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        View Group A Standing
                                    </button>
                                    <button 
                                        onClick={() => setSelectedGroup('groupB')}
                                        style={{ padding: '8px 16px', background: selectedGroup === 'groupB' ? '#10b981' : 'transparent', border: '1px solid #10b981', color: selectedGroup === 'groupB' ? 'white' : '#10b981', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        View Group B Standing
                                    </button>
                                </div>
                            )}

                            {selectedDay !== 'overall' && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1f37', borderRadius: '8px', border: '1px solid #2d3548' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                        <strong style={{ color: '#60a5fa' }}>
                                            {selectedGroup.toUpperCase()} - {selectedDay.toUpperCase()} - {selectedMatch.toUpperCase()}:
                                        </strong> Manage points for this specific match
                                    </p>
                                </div>
                            )}

                            {selectedDay !== 'overall' && (
                                <div style={{ padding: '25px', background: 'linear-gradient(135deg, #1a1f37 0%, #141b2d 100%)', borderRadius: '15px', marginBottom: '25px', border: '2px solid #3b82f6', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)' }}>
                                    <h3 style={{ color: '#60a5fa', marginBottom: '20px', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '24px' }}>➕</span> Add Team Points
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Team Name</label>
                                            <select value={teamPointsForm.teamName} onChange={e => setTeamPointsForm({ ...teamPointsForm, teamName: e.target.value })} style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', cursor: 'pointer', height: '48px' }}>
                                                <option value="">Select Team</option>
                                                {(() => {
                                                    let teamsToDisplay = Array.isArray(teams) ? teams : [];
                                                    
                                                    if (selectedGroup === 'finals') {
                                                        const qualifiedTeams = selectedSeasonForEdit.qualifiedTeams || [];
                                                        teamsToDisplay = teamsToDisplay.filter(t => qualifiedTeams.includes(t.teamName));
                                                    } else if (selectedGroup === 'groupA') {
                                                        teamsToDisplay = teamsToDisplay.filter(t => t.assignedGroup === 'A');
                                                    } else if (selectedGroup === 'groupB') {
                                                        teamsToDisplay = teamsToDisplay.filter(t => t.assignedGroup === 'B');
                                                    }

                                                    return teamsToDisplay
                                                        .sort((a, b) => (a.slotNumber || 999) - (b.slotNumber || 999))
                                                        .map(t => (
                                                            <option key={t.teamName} value={t.teamName}>
                                                                {t.teamName} {t.slotNumber ? `(#${t.slotNumber})` : '(Pending)'}
                                                            </option>
                                                        ));
                                                })()}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Place Rank</label>
                                            <select 
                                                value={teamPointsForm.placePoints} 
                                                onChange={e => {
                                                    const points = e.target.value;
                                                    const rank = e.target.selectedOptions[0].text.split('(')[0].trim();
                                                    const wwcd = rank === '1st' ? '1' : '0';
                                                    const total = calculateTotal(wwcd, points, teamPointsForm.killPoints);
                                                    setTeamPointsForm({ 
                                                        ...teamPointsForm, 
                                                        placePoints: points,
                                                        wwcd: wwcd,
                                                        totalPoints: total, 
                                                        remarks: `Total: ${total}` 
                                                    });
                                                }} 
                                                style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', cursor: 'pointer', height: '48px' }}
                                            >
                                                <option value="">Select Rank</option>
                                                <option value="10">1st (10pts)</option>
                                                <option value="6">2nd (6pts)</option>
                                                <option value="5">3rd (5pts)</option>
                                                <option value="4">4th (4pts)</option>
                                                <option value="3">5th (3pts)</option>
                                                <option value="2">6th (2pts)</option>
                                                <option value="1">7th (1pts)</option>
                                                <option value="1">8th (1pts)</option>
                                                <option value="1">9th (1pts)</option>
                                                <option value="0">10th+ (0pts)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Place Points</label>
                                            <input 
                                                type="number" 
                                                placeholder="Points" 
                                                value={teamPointsForm.placePoints || ''} 
                                                onChange={e => {
                                                    const points = e.target.value;
                                                    const total = calculateTotal(teamPointsForm.wwcd, points, teamPointsForm.killPoints);
                                                    setTeamPointsForm({ ...teamPointsForm, placePoints: points, totalPoints: total, remarks: `Total: ${total}` });
                                                }}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', borderRadius: '8px', color: '#3b82f6', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', height: '48px', boxSizing: 'border-box' }} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>WWCD</label>
                                            <select 
                                                value={teamPointsForm.wwcd || '0'} 
                                                onChange={e => {
                                                    const wwcd = e.target.value;
                                                    const total = calculateTotal(wwcd, teamPointsForm.placePoints, teamPointsForm.killPoints);
                                                    setTeamPointsForm({ ...teamPointsForm, wwcd: wwcd, totalPoints: total, remarks: `Total: ${total}` });
                                                }}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(255, 215, 0, 0.1)', border: '2px solid #ffd700', borderRadius: '8px', color: '#ffd700', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', height: '48px', boxSizing: 'border-box', cursor: 'pointer' }}
                                            >
                                                <option value="0">❌ No</option>
                                                <option value="1">🏆 Yes</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Kill Points</label>
                                            <input 
                                                type="number" 
                                                placeholder="0" 
                                                value={teamPointsForm.killPoints} 
                                                onChange={e => {
                                                    const kills = e.target.value;
                                                    const total = calculateTotal(teamPointsForm.wwcd, teamPointsForm.placePoints, kills);
                                                    setTeamPointsForm({ ...teamPointsForm, killPoints: kills, totalPoints: total, remarks: `Total: ${total}` });
                                                }} 
                                                style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', height: '48px', boxSizing: 'border-box' }} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Total Points</label>
                                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', boxSizing: 'border-box' }}>
                                                {teamPointsForm.totalPoints || 0}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Remarks / Custom Notes</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Penalty -2pts, or Nice match!" 
                                                value={teamPointsForm.remarks || ''} 
                                                onChange={e => setTeamPointsForm({ ...teamPointsForm, remarks: e.target.value })} 
                                                style={{ width: '100%', padding: '12px', background: '#0a0e27', border: '1px solid #2d3548', borderRadius: '8px', color: '#f3f4f6', fontSize: '14px', height: '48px', boxSizing: 'border-box' }} 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddTeamPoints} 
                                        style={{ 
                                            width: '100%', 
                                            marginTop: '20px', 
                                            padding: '14px 20px', 
                                            background: isEditing ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '10px', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '15px',
                                            boxShadow: isEditing ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                    >
                                        {isEditing ? '💾 Update Team' : '➕ Add Team'}
                                    </button>
                                    {isEditing && (
                                        <button 
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditingIndex(null);
                                                setTeamPointsForm({ teamName: '', wwcd: '', placePoints: '', killPoints: '', totalPoints: 0, remarks: '' });
                                            }} 
                                            style={{ 
                                                width: '100%', 
                                                marginTop: '10px', 
                                                padding: '10px', 
                                                background: 'transparent', 
                                                color: '#ef4444', 
                                                border: '1px solid #ef4444', 
                                                borderRadius: '10px', 
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            )}

                            {selectedDay === 'overall' && (
                                <div style={{ padding: '20px', background: '#141b2d', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                                    <p style={{ color: '#9ca3af' }}>Overall standings are automatically calculated from all matches. Add teams in Match 1-6 to see overall results.</p>
                                </div>
                            )}

                            <table className="registrations-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team Name</th>
                                        <th>WWCD</th>
                                        <th>Place Pts</th>
                                        <th>Kill Pts</th>
                                        <th>Total</th>
                                        <th>Remarks</th>
                                        {selectedDay !== 'overall' && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDay === 'overall' ? (
                                        (() => {
                                            const teamTotals = {};
                                            const groupFilter = selectedGroup === 'groupA' ? 'A' : (selectedGroup === 'groupB' ? 'B' : null);
                                            const isFinalsView = selectedGroup === 'finals';
                                            
                                            Object.values(selectedSeasonForEdit.days || {}).forEach(dayData => {
                                                const processMatchData = (matchData, fromGroup) => {
                                                    if (Array.isArray(matchData)) {
                                                        matchData.forEach(team => {
                                                            // Filter logic
                                                            let belongs = true;
                                                            
                                                            // Match category strict filtering
                                                            if (isFinalsView) {
                                                                // In Finals view, ONLY show data from finals matches
                                                                if (fromGroup !== 'finals') belongs = false;
                                                            } else {
                                                                // In Group A/B view, NEVER show finals data
                                                                if (fromGroup === 'finals') belongs = false;
                                                                
                                                                // Also check if team belongs to the selected group (A or B)
                                                                if (belongs && groupFilter) {
                                                                    const masterTeam = teams.find(t => t.teamName === team.teamName);
                                                                    belongs = masterTeam && masterTeam.assignedGroup === groupFilter;
                                                                }
                                                            }
                                                            
                                                            if (belongs) {
                                                                if (!teamTotals[team.teamName]) {
                                                                    teamTotals[team.teamName] = { teamName: team.teamName, wwcd: 0, placePoints: 0, killPoints: 0, totalPoints: 0 };
                                                                }
                                                                teamTotals[team.teamName].wwcd += (parseInt(team.wwcd) || 0);
                                                                teamTotals[team.teamName].placePoints += (parseInt(team.placePoints) || 0);
                                                                teamTotals[team.teamName].killPoints += (parseInt(team.killPoints) || 0);
                                                                teamTotals[team.teamName].totalPoints += (parseInt(team.totalPoints) || 0);
                                                            }
                                                        });
                                                    }
                                                };
                                                
                                                const mKeys = ['match1', 'match2', 'match3', 'match4', 'match5', 'match6'];
                                                let dayHasStructuredData = false;

                                                if (dayData.groupA) {
                                                    mKeys.forEach(m => processMatchData(dayData.groupA[m], 'groupA'));
                                                    dayHasStructuredData = true;
                                                }
                                                if (dayData.groupB) {
                                                    mKeys.forEach(m => processMatchData(dayData.groupB[m], 'groupB'));
                                                    dayHasStructuredData = true;
                                                }
                                                if (dayData.finals) {
                                                    mKeys.forEach(m => processMatchData(dayData.finals[m], 'finals'));
                                                    dayHasStructuredData = true;
                                                }

                                                // Only process standard path if no structured group data was found for this day
                                                // This prevents "zombie" data from old entries showing up in overall
                                                if (!dayHasStructuredData) {
                                                    mKeys.forEach(m => processMatchData(dayData[m], 'standard'));
                                                }
                                            });

                                            const sortedTeams = Object.values(teamTotals).sort((a, b) => b.totalPoints - a.totalPoints);
                                            return sortedTeams.length > 0 ? sortedTeams.map((team, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'inherit', fontWeight: 'bold' }}>#{idx + 1}</td>
                                                    <td><strong>{team.teamName}</strong></td>
                                                    <td>{team.wwcd}</td>
                                                    <td>{team.placePoints}</td>
                                                    <td>{team.killPoints}</td>
                                                    <td style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '16px' }}>{team.totalPoints}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button 
                                                                onClick={() => handleQuickEditFromOverall(team.teamName)} 
                                                                style={{ padding: '6px 12px', fontSize: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                            >
                                                                Edit Points
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteTeamFromOverall(team.teamName)} 
                                                                style={{ padding: '6px 12px', fontSize: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No data available for this selection.</td>
                                                </tr>
                                            );
                                        })()
                                    ) : (
                                        (() => {
                                            const matchData = selectedSeasonForEdit.days?.[selectedDay]?.[selectedGroup]?.[selectedMatch] || [];
                                            if (matchData.length > 0) {
                                                return matchData
                                                    .sort((a, b) => (parseInt(b.totalPoints) || 0) - (parseInt(a.totalPoints) || 0))
                                                    .map((team, idx) => (
                                                        <tr key={idx}>
                                                            <td>#{idx + 1}</td>
                                                            <td><strong>{team.teamName}</strong></td>
                                                            <td>{team.wwcd || 0}</td>
                                                            <td>{team.placePoints || 0}</td>
                                                            <td>{team.killPoints || 0}</td>
                                                            <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{team.totalPoints || 0}</td>
                                                            <td>{team.remarks || '-'}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button onClick={() => handleEditTeamInMatch(team, idx)} style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                                                                    <button onClick={() => handleDeleteTeamFromMatch(idx)} style={{ padding: '6px 12px', fontSize: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ));
                                            } else {
                                                return (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                                            No teams added for {selectedGroup.toUpperCase()} - {selectedDay.toUpperCase()} - {selectedMatch.toUpperCase()} yet
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardModern;


