# TODO: Add Group A/B Structure

## Current Structure
Day → Match → Teams

## Required Structure  
Day → Group (A/B) → Match → Teams

## Changes Needed

1. Add `selectedGroup` state (already done)
2. Add Group A/B buttons after Day selection
3. Update data structure: `days[day][group][match]`
4. Update all functions to use group layer

## Files to modify
- AdminDashboardModern.js (main file)

Abhi sirf Day → Match structure hai. Group layer add karna baaki hai.
