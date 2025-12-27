#!/usr/bin/env node
/**
 * Script to inspect raw Strava API data
 *
 * This helps understand what fields Strava returns, including:
 * - workout_type (0=default, 1=race, 2=long run, 3=workout)
 * - All available fields on activities
 *
 * Note: You need to have authenticated and have data in localStorage
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 STRAVA DATA INSPECTOR                         ║
╚═══════════════════════════════════════════════════════════════╝

This script shows what data Strava API returns for activities.

KEY FIELDS TO LOOK FOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 workout_type - Race indicator for runs:
   • 0 = Default/Normal run
   • 1 = Race (🏆 This is what Strava uses to mark races!)
   • 2 = Long Run
   • 3 = Workout

🔖 Other potentially useful fields:
   • type - Activity type (Run, Ride, Swim, etc.)
   • sport_type - More specific sport classification
   • name - Activity title
   • distance - Distance in meters
   • moving_time - Active time in seconds
   • average_speed - Speed in m/s
   • total_elevation_gain - Elevation in meters
   • kudos_count - Social engagement
   • achievement_count - Strava achievements/PRs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TO USE THIS SCRIPT:
1. Open your app in browser (http://localhost:5173)
2. Login and load your activities
3. Open browser DevTools Console (F12)
4. Run this code:

   // Get sample activities
   const data = JSON.parse(localStorage.getItem('activities-2024') || '{}');
   const activities = data.activities || [];
   
   // Find activities with workout_type
   const raceActivities = activities.filter(a => a.workout_type === 1);
   const workoutActivities = activities.filter(a => a.workout_type === 3);
   
   console.log('🏆 Race Activities (workout_type=1):', raceActivities.length);
   console.table(raceActivities.map(a => ({
     name: a.name,
     type: a.type,
     distance: (a.distanceKm).toFixed(2) + 'km',
     date: a.date,
     workout_type: a.workoutType
   })));
   
   console.log('💪 Workout Activities (workout_type=3):', workoutActivities.length);
   
   // Show first activity structure
   console.log('\\n📦 Sample Activity Structure:');
   console.log(JSON.stringify(activities[0], null, 2));

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT IMPLEMENTATION:
• workout_type is fetched from Strava ✅
• Stored in Activity.workoutType ✅
• Used in race detection (line 820 in raceDetection.ts) ✅

RACE DETECTION LOGIC:
1. Custom filters apply first (user-defined distance/title filters)
2. Triathlon detection
3. Half marathon detection (20-22km runs)
   → Checks workout_type === 1 to show "🏆 Race" badge
4. Other distance-based detection (15K, long runs, century rides)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

export {};
