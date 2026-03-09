# BGMI Point Table - Admin Guide

## ✅ What's New

### 1. Professional BGMI-Style Point Table
- **Columns**: RANK | TEAM | M1 | M2 | M3 | M4 | M5 | M6 | KILLS | WWCD | TOTAL
- **Color-coded**: 
  - Kills = Red
  - WWCD = Gold
  - Total Points = Pink (highlighted)
- **Top 3 teams** get gold gradient background
- **Responsive design** for mobile and desktop

### 2. Admin Dashboard - Season Management

#### How to Add Match Points:

1. **Go to Admin Dashboard** → Click "Seasons" in sidebar

2. **Create a Season** (if not exists):
   - Enter Season Name (e.g., "Season 1")
   - Enter Date (optional)
   - Select Status (Live/Upcoming/Completed)
   - Click "+ Add Season"

3. **Manage Season**:
   - Click "👁️ Manage" button on any season
   - You'll see buttons: **Overall | Match 1 | Match 2 | Match 3 | Match 4 | Match 5 | Match 6**

4. **Add Team Points for a Match**:
   - Click on any Match button (e.g., "Match 1")
   - Fill the form:
     - **Select Team**: Choose from dropdown
     - **Place Rank**: Select position (1st-10th+)
     - **Place Points**: Auto-filled based on rank (read-only)
     - **WWCD**: Enter 0 or 1 (1 = Winner Winner Chicken Dinner)
     - **Kill Points**: Enter number of kills
     - **Total**: Auto-calculated
   - Click "+ Add Team"

5. **View Overall Standings**:
   - Click "Overall" button
   - See combined points from all matches
   - Automatically sorted by total points

## 📊 Points System

### Place Points:
- 1st Place: 10 points
- 2nd Place: 6 points
- 3rd Place: 5 points
- 4th Place: 4 points
- 5th Place: 3 points
- 6th Place: 2 points
- 7th-9th Place: 1 point
- 10th+ Place: 0 points

### WWCD (Winner Winner Chicken Dinner):
- Winner: 10 points (automatically added)
- Others: 0 points

### Kill Points:
- 1 point per kill

### Total Points Formula:
```
Total = Place Points + WWCD Points + Kill Points
```

## 🎯 Features

### Admin Dashboard:
- ✅ Easy team selection from dropdown
- ✅ Place rank dropdown with points preview
- ✅ Read-only place points display
- ✅ Auto-calculation of total points
- ✅ Match 1-6 structure (6 matches per season)
- ✅ Overall standings auto-calculated
- ✅ Delete teams from matches
- ✅ Real-time updates

### Public Point Table:
- ✅ Professional BGMI-style layout
- ✅ Shows all 6 matches + totals
- ✅ Color-coded columns
- ✅ Top 3 teams highlighted
- ✅ Responsive design
- ✅ Real-time data sync

## 🔥 Quick Tips

1. **Always select "Live" status** for the active season
2. **Add teams in order** for better organization
3. **Double-check WWCD** - only 1 team should have WWCD=1 per match
4. **Kill points** should match actual kills in the match
5. **Overall tab** shows combined results automatically

## 📱 Mobile Friendly

Both admin dashboard and public point table are fully responsive and work perfectly on mobile devices!

## 🎮 Example Workflow

1. Create "Season 1" with status "Live"
2. Click "Manage" on Season 1
3. Click "Match 1"
4. Add Team A: 1st place (10pts) + WWCD (1) + 5 kills = 25 points
5. Add Team B: 2nd place (6pts) + 0 WWCD + 8 kills = 14 points
6. Repeat for Match 2-6
7. Click "Overall" to see final standings
8. Users can view on `/point-table` page

## 🚀 That's It!

Your professional BGMI tournament point table is ready! 🎯
