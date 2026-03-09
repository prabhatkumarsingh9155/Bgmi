import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { TOURNAMENT_DOC_ID, TOURNAMENT_COLLECTION, safeJSONParse } from '../utils/dataHelpers';
import { useAuth } from '../context/AuthContext';

export const useTournamentData = () => {
    const { user } = useAuth();
    const [data, setData] = useState({
        teams: [],
        notifications: [],
        roomDetails: [],
        tournamentInfo: {},
        pointsTable: [],
        tdmMatches: [],
        userTeam: null,
        isApproved: false,
        loading: true,
        error: null
    });

    useEffect(() => {
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const rawData = docSnap.data();
                const teams = safeJSONParse(rawData.bgmi);

                // Find current user's team
                const allUserTeams = user ? teams.filter(t => t.captainEmail?.toLowerCase() === user.email?.toLowerCase()) : [];
                const userSquadTeam = allUserTeams.find(t => t.regMode !== 'tdm');
                const userTdmTeam = allUserTeams.find(t => t.regMode === 'tdm');
                const userTeam = allUserTeams[0] || null;
                const isApproved = userTeam?.status === 'Approved' || userTeam?.status === 'approved';

                setData({
                    teams: teams,
                    notifications: safeJSONParse(rawData.notifications),
                    roomDetails: safeJSONParse(rawData.roomDetails),
                    tournamentInfo: safeJSONParse(rawData.tournamentInfo, {}),
                    pointsTable: safeJSONParse(rawData.pointsTable, []),
                    tdmMatches: safeJSONParse(rawData.tdmMatches, []),
                    userTeam: userTeam,
                    userSquadTeam: userSquadTeam,
                    userTdmTeam: userTdmTeam,
                    isApproved: isApproved,
                    loading: false,
                    error: null
                });
            } else {
                setData(prev => ({ ...prev, loading: false, error: "Document not found" }));
            }
        }, (err) => {
            console.error("Firestore Listen Error:", err);
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        });

        return () => unsubscribe();
    }, [user]);

    return data;
};
