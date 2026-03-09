// BGMI Points Calculation Rules
export const PLACEMENT_POINTS = {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1
};

export const KILL_POINTS_PER_KILL = 1;

// Calculate placement points based on rank
export const calculatePlacementPoints = (rank) => {
    return PLACEMENT_POINTS[rank] || 0;
};

// Calculate kill points
export const calculateKillPoints = (kills) => {
    return (kills || 0) * KILL_POINTS_PER_KILL;
};

// Calculate total points for a team
export const calculateTotalPoints = (placePoints, killPoints) => {
    return (parseInt(placePoints) || 0) + (parseInt(killPoints) || 0);
};

// Auto-calculate all points for a team entry
export const autoCalculateTeamPoints = (team) => {
    const placePoints = parseInt(team.placementPoints || team.placePoints || 0);
    const killPoints = parseInt(team.finishes || team.killPoints || 0);
    const totalPoints = calculateTotalPoints(placePoints, killPoints);
    
    return {
        ...team,
        placementPoints: placePoints,
        killPoints: killPoints,
        finishes: killPoints,
        totalPoints: totalPoints
    };
};

// Calculate points from match rank
export const calculateFromRank = (rank, currentData = {}) => {
    const placePoints = calculatePlacementPoints(rank);
    const isWWCD = rank === 1;
    
    return {
        placementPoints: (currentData.placementPoints || 0) + placePoints,
        wwcd: (currentData.wwcd || 0) + (isWWCD ? 1 : 0),
        played: (currentData.played || 0) + 1
    };
};
