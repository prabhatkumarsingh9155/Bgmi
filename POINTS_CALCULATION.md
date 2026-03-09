# BGMI Points Calculation Rules

## Automatic Calculation System

The system now automatically calculates total points based on BGMI tournament rules.

### Points Breakdown

#### Placement Points (Based on Match Rank)
- **1st Place**: 10 points + WWCD (Winner Winner Chicken Dinner)
- **2nd Place**: 6 points
- **3rd Place**: 5 points
- **4th Place**: 4 points
- **5th Place**: 3 points
- **6th Place**: 2 points
- **7th Place**: 1 point
- **8th Place**: 1 point
- **9th+ Place**: 0 points

#### Kill Points (Finishes)
- **1 point per kill**

#### Total Points Formula
```
Total Points = Placement Points + Kill Points
```

## How It Works

### In Admin Dashboard

1. **Match Rank Helper**: 
   - Select the team's match rank from dropdown
   - System automatically adds placement points
   - Increments matches played
   - Adds WWCD if rank is 1st

2. **Kill Points (Finishes)**:
   - Enter the number of kills
   - Each kill = 1 point

3. **Auto-Calculation**:
   - Total points are calculated automatically
   - No manual entry needed for total
   - Updates in real-time

### In Seasons Manager

- When adding teams to day-wise results
- Total Points field is auto-calculated and read-only
- Shows: Place Points + Kill Points = Total

### In Points Table Maker

- Rank Helper dropdown applies placement points automatically
- Quick add finishes with Enter key
- Total recalculates on any change

## Example Calculation

**Team XYZ Match Result:**
- Match Rank: 2nd Place → 6 placement points
- Kills: 8 → 8 kill points
- **Total: 6 + 8 = 14 points**

**Team ABC Match Result:**
- Match Rank: 1st Place → 10 placement points + WWCD
- Kills: 12 → 12 kill points
- **Total: 10 + 12 = 22 points**

## Benefits

✅ No manual calculation errors
✅ Consistent point distribution
✅ Real-time updates
✅ Follows official BGMI rules
✅ Transparent and fair scoring
