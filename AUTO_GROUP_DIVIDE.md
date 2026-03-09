# Auto Group Divide Feature

## Overview
Yeh feature automatically naye register hone wale teams ko Group A aur Group B me divide karta hai alternate way me. Saath hi, Points Table aur Leaderboard me Group-wise filtering bhi available hai.

## Kaise Kaam Karta Hai

### Admin Dashboard Toggle
Admin Dashboard me ek naya toggle hai **"Auto Group Divide"**:
- **ON**: Naye teams automatically Group A/B me assign honge
- **OFF**: Teams ko manually group assign karna padega

### Group Assignment Logic
Jab toggle ON hai:
- **Pehli team** → Group A
- **Dusri team** → Group B
- **Teesri team** → Group A
- **Chauthi team** → Group B
- ... aur aise hi alternate way me

Formula: `existingTeams.length % 2 === 0 ? 'A' : 'B'`

## Implementation Details

### Files Modified

1. **AdminDashboard.js**
   - Naya toggle added for Auto Group Divide
   - Toggle state Firebase me save hota hai

2. **Registration.js**
   - Registration time pe group automatically assign hota hai
   - Agar image upload disabled hai to direct registration me group assign hota hai

3. **ProofUpload.js**
   - Proof upload complete hone ke baad group assign hota hai
   - Agar image upload enabled hai to yahan group assign hota hai

4. **Teams.js**
   - Public teams page me Group column display hota hai
   - Group A → Blue color (#0096ff)
   - Group B → Orange color (#ff6400)

5. **TeamsTable.js** (Admin Component)
   - Admin dashboard me bhi Group column display hota hai
   - Same color coding as public page

6. **PointsTable.js**
   - Group filter tabs added (All / Group A / Group B)
   - Group badge display when "All" selected
   - Filtered rankings by group

7. **Leaderboard.js**
   - Group filter tabs added
   - All-time leaderboard me group-wise filtering
   - Group badges display

8. **Seasons.js**
   - Day-wise points table me group filtering
   - Group badges in team names
   - Filter works for all days and overall rankings

## Usage

### Admin Steps:
1. Admin Dashboard me jao
2. Header me "Auto Group Divide" toggle ON karo
3. Ab jitne bhi naye teams register honge, automatically Group A/B me divide ho jayenge

### User Experience:
- Users ko kuch karna nahi padega
- Registration ke baad unka group automatically assign ho jayega
- Teams page pe apna group dekh sakte hain
- Points Table me group-wise filter kar sakte hain
- Leaderboard me group-wise rankings dekh sakte hain
- Seasons page me day-wise group filtering available hai

## Database Structure

Team object me naya field:
```javascript
{
  teamName: "Soul Esports",
  // ... other fields
  group: "A" // or "B" or null
}
```

## Visual Design

### Group Badges:
- **Group A**: Blue badge with light blue background (#0096ff)
- **Group B**: Orange badge with light orange background (#ff6400)
- **No Group**: Gray dash (-)

### Filter Tabs:
- **All Teams**: Yellow/Accent color when active
- **Group A**: Blue theme
- **Group B**: Orange theme

## Features Summary

✅ Auto group assignment on registration
✅ Group display in Teams page
✅ Group display in Admin Dashboard
✅ Group filtering in Points Table (Overall Standings)
✅ Group filtering in Leaderboard (All-time)
✅ Group filtering in Seasons (Day-wise)
✅ Color-coded badges for easy identification
✅ Responsive design for mobile devices

## Benefits

1. **Automatic**: Manual work nahi karna padta
2. **Fair**: Alternate way me divide hota hai
3. **Flexible**: Toggle se ON/OFF kar sakte hain
4. **Visual**: Clear color coding se easily identify kar sakte hain
5. **Filterable**: Users apne group ka performance easily track kar sakte hain
6. **Comprehensive**: Sabhi pages pe group support hai

## Future Enhancements

Possible improvements:
- Manual group change option for admin
- Group-wise prize distribution
- Group-wise match scheduling
- Group statistics and analytics
- Inter-group comparison charts
