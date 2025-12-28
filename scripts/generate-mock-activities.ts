/**
 * Script to generate comprehensive mock Strava activities for 2024
 * Run with: npx tsx scripts/generate-mock-activities.ts
 */

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  kudos_count: number;
  workout_type?: number;
  map: { summary_polyline: string };
}

// Helper to create ISO date
const makeDate = (date: Date): string => date.toISOString();

// Activity templates for different workout types
// workout_type: 0=default, 1=race, 2=long run, 3=workout (tempo/intervals)
const createRun = (
  id: number,
  name: string,
  date: Date,
  distance: number,
  pace: number,
  elevation: number,
  kudos: number,
  workoutType?: number
): Activity => ({
  id,
  name,
  type: 'Run',
  distance,
  moving_time: Math.round(distance / pace),
  elapsed_time: Math.round((distance / pace) * 1.04),
  total_elevation_gain: elevation,
  start_date: makeDate(date),
  start_date_local: makeDate(date),
  average_speed: pace,
  max_speed: pace * 1.3,
  kudos_count: kudos,
  ...(workoutType !== undefined && { workout_type: workoutType }),
  map: { summary_polyline: 'run_data' },
});

const createBike = (
  id: number,
  name: string,
  date: Date,
  distance: number,
  speed: number,
  elevation: number,
  kudos: number,
  isIndoor = false
): Activity => ({
  id,
  name,
  type: isIndoor ? 'VirtualRide' : 'Ride',
  distance,
  moving_time: Math.round(distance / speed),
  elapsed_time: Math.round((distance / speed) * 1.04),
  total_elevation_gain: elevation,
  start_date: makeDate(date),
  start_date_local: makeDate(date),
  average_speed: speed,
  max_speed: speed * 1.7,
  kudos_count: kudos,
  map: { summary_polyline: isIndoor ? '' : 'ride_data' },
});

const createSwim = (
  id: number,
  name: string,
  date: Date,
  distance: number,
  pace: number,
  kudos: number
): Activity => ({
  id,
  name,
  type: 'Swim',
  distance,
  moving_time: Math.round(distance / pace),
  elapsed_time: Math.round((distance / pace) * 1.05),
  total_elevation_gain: 0,
  start_date: makeDate(date),
  start_date_local: makeDate(date),
  average_speed: pace,
  max_speed: pace * 1.2,
  kudos_count: kudos,
  map: { summary_polyline: '' },
});

// Generate full year of training
const generateActivities = (): Activity[] => {
  const activities: Activity[] = [];
  let id = 10001;

  // Training blocks per month (hours/week)
  const monthlyVolume = [
    { month: 0, name: 'Jan', hours: 11, runKm: 28, bikeKm: 220, swimKm: 2.5 },
    { month: 1, name: 'Feb', hours: 12, runKm: 30, bikeKm: 240, swimKm: 2.8 },
    { month: 2, name: 'Mar', hours: 13, runKm: 32, bikeKm: 260, swimKm: 3.0 },
    { month: 3, name: 'Apr', hours: 15, runKm: 35, bikeKm: 280, swimKm: 3.2 },
    { month: 4, name: 'May', hours: 14, runKm: 32, bikeKm: 270, swimKm: 3.0 }, // Race taper
    { month: 5, name: 'Jun', hours: 13, runKm: 30, bikeKm: 250, swimKm: 2.8 },
    { month: 6, name: 'Jul', hours: 16, runKm: 37, bikeKm: 300, swimKm: 3.5 },
    { month: 7, name: 'Aug', hours: 14, runKm: 32, bikeKm: 270, swimKm: 3.0 },
    { month: 8, name: 'Sep', hours: 17, runKm: 38, bikeKm: 320, swimKm: 3.8 }, // Peak
    { month: 9, name: 'Oct', hours: 8, runKm: 18, bikeKm: 150, swimKm: 1.5 }, // Recovery
    { month: 10, name: 'Nov', hours: 11, runKm: 30, bikeKm: 240, swimKm: 2.8 },
    { month: 11, name: 'Dec', hours: 11, runKm: 28, bikeKm: 220, swimKm: 2.5 },
  ];

  // Races
  const races = [
    { date: new Date(2024, 0, 7, 9), name: '5K Race 🏁', distance: 5000, pace: 4.17 },
    { date: new Date(2024, 1, 11, 9), name: '10K Race 🏁', distance: 10000, pace: 4.17 },
    { date: new Date(2024, 2, 17, 9), name: 'Half Marathon 🏁', distance: 21097, pace: 3.97 },
    {
      date: new Date(2024, 4, 19, 7),
      name: 'T100 Triathlon 🏆',
      distance: 120000,
      pace: 8.33,
      type: 'tri',
      runPace: 4.17,
    },
    {
      date: new Date(2024, 5, 9, 8),
      name: '1/8 Triathlon 🏁',
      distance: 13000,
      pace: 5.1,
      type: 'tri',
      runPace: 4.17,
    },
    {
      date: new Date(2024, 5, 23, 8),
      name: '1/4 Triathlon 🏁',
      distance: 26000,
      pace: 5.42,
      type: 'tri',
      runPace: 4.17,
    },
    {
      date: new Date(2024, 6, 21, 7),
      name: 'Half Ironman 70.3 🏆',
      distance: 113000,
      pace: 6.28,
      type: 'tri',
      runPace: 3.7,
    },
    {
      date: new Date(2024, 8, 22, 7),
      name: 'IRONMAN 140.6 🏆🏆🏆',
      distance: 226195,
      pace: 5.71,
      type: 'tri',
      runPace: 2.9,
    },
    { date: new Date(2024, 10, 17, 9), name: '15K Race 🏁', distance: 15000, pace: 4.17 },
    { date: new Date(2024, 11, 21, 9), name: 'Holiday 5K 🏁', distance: 5000, pace: 4.24 },
  ];

  for (const block of monthlyVolume) {
    const weeksInMonth = 4;

    for (let week = 0; week < weeksInMonth; week++) {
      const weekStart = new Date(2024, block.month, week * 7 + 1);

      // Runs: 3 per week (easy, tempo, long)
      activities.push(
        createRun(
          id++,
          'Easy Run',
          new Date(weekStart.getTime() + 1 * 86400000),
          6500 + Math.random() * 2000,
          3.13,
          30 + Math.random() * 20,
          4 + Math.floor(Math.random() * 3)
        )
      );
      activities.push(
        createRun(
          id++,
          week % 2 === 0 ? 'Tempo Run' : 'Intervals',
          new Date(weekStart.getTime() + 3 * 86400000),
          10000 + Math.random() * 2000,
          3.7 + Math.random() * 0.2,
          50 + Math.random() * 30,
          7 + Math.floor(Math.random() * 4),
          3
        )
      ); // workout_type: 3 for tempo/intervals
      activities.push(
        createRun(
          id++,
          'Long Run',
          new Date(weekStart.getTime() + 6 * 86400000),
          17000 + Math.random() * 6000,
          3.13,
          100 + Math.random() * 50,
          12 + Math.floor(Math.random() * 8),
          2
        )
      ); // workout_type: 2 for long run

      // Bikes: 2-3 per week (indoor + outdoor, sometimes add brick)
      activities.push(
        createBike(
          id++,
          week % 2 === 0 ? 'Indoor Trainer' : 'Zwift Session',
          new Date(weekStart.getTime() + 2 * 86400000 + 64800000),
          50000 + Math.random() * 10000,
          8.33,
          180 + Math.random() * 70,
          5 + Math.floor(Math.random() * 3),
          true
        )
      );
      activities.push(
        createBike(
          id++,
          'Weekend Ride',
          new Date(weekStart.getTime() + 5 * 86400000),
          110000 + Math.random() * 60000,
          8.33,
          550 + Math.random() * 400,
          14 + Math.floor(Math.random() * 10),
          false
        )
      );

      // Add third bike session for most weeks
      if (block.hours >= 12) {
        activities.push(
          createBike(
            id++,
            'Mid-Week Ride',
            new Date(weekStart.getTime() + 4 * 86400000 + 64800000),
            55000 + Math.random() * 15000,
            8.33,
            180 + Math.random() * 80,
            5 + Math.floor(Math.random() * 3),
            false
          )
        );
      }

      // Swims: 1-2 per week
      if (week % 2 === 0 || block.hours >= 13) {
        activities.push(
          createSwim(
            id++,
            week % 3 === 0 ? 'Swim Drills' : 'Swim Endurance',
            new Date(weekStart.getTime() + 20700),
            2000 + Math.random() * 1200,
            0.83,
            3 + Math.floor(Math.random() * 3)
          )
        );
      }
      if (block.hours >= 14) {
        activities.push(
          createSwim(
            id++,
            'Swim Technique',
            new Date(weekStart.getTime() + 4 * 86400000 + 23400),
            2200 + Math.random() * 800,
            0.83,
            3 + Math.floor(Math.random() * 2)
          )
        );
      }
    }
  }

  // Add races
  for (const race of races) {
    if (race.type === 'tri') {
      // Triathlons are 3 separate activities in Strava
      const baseName = race.name.replace(' 🏆', '').replace(' 🏁', '');
      const kudos = race.distance > 200000 ? 100 : race.distance > 100000 ? 50 : 15;

      // Determine distances based on race type (in meters)
      let swimDist: number, bikeDist: number, runDist: number;
      if (race.distance > 200000) {
        // Full Ironman 140.6
        swimDist = 3800;
        bikeDist = 180000;
        runDist = 42195;
      } else if (race.distance > 100000) {
        // Half Ironman 70.3
        swimDist = 1900;
        bikeDist = 90000;
        runDist = 21097;
      } else if (race.distance > 40000) {
        // T100 or Olympic
        swimDist = 1500;
        bikeDist = 40000;
        runDist = 10000;
      } else if (race.distance > 20000) {
        // 1/4 Triathlon (Sprint)
        swimDist = 750;
        bikeDist = 20000;
        runDist = 5000;
      } else {
        // 1/8 Triathlon (Super Sprint)
        swimDist = 400;
        bikeDist = 10000;
        runDist = 2500;
      }

      // Swim leg (starts at race time)
      const swimTime = Math.round(swimDist / 0.83);
      activities.push(createSwim(id++, `${baseName} - Swim 🏊`, race.date, swimDist, 0.83, kudos));

      // Bike leg (starts after swim + transition ~5min)
      const bikeStart = new Date(race.date.getTime() + (swimTime + 300) * 1000);
      const bikeTime = Math.round(bikeDist / 8.33);
      activities.push(
        createBike(
          id++,
          `${baseName} - Bike 🚴`,
          bikeStart,
          bikeDist,
          8.33,
          race.distance > 100000 ? 800 + Math.random() * 500 : 100 + Math.random() * 100,
          kudos + 5,
          false
        )
      );

      // Run leg (starts after bike + transition ~5min)
      const runStart = new Date(bikeStart.getTime() + (bikeTime + 300) * 1000);
      // Use specific runPace for triathlons if provided, otherwise use overall pace
      const runPace = 'runPace' in race && race.runPace ? race.runPace : race.pace;
      activities.push(
        createRun(
          id++,
          `${baseName} - Run 🏃 ${race.name.includes('🏆') ? race.name.match(/🏆+/)?.[0] || '🏁' : '🏁'}`,
          runStart,
          runDist,
          runPace,
          50 + Math.random() * 100,
          kudos + 10,
          1
        )
      ); // workout_type: 1 for race
    } else {
      activities.push(
        createRun(
          id++,
          race.name,
          race.date,
          race.distance,
          race.pace,
          20 + Math.random() * 70,
          race.distance >= 15000 ? 48 : 30,
          1
        )
      ); // workout_type: 1 for race
    }
  }

  // Sort by date
  return activities.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
};

// Generate and output
const activities = generateActivities();

console.log(`Generated ${activities.length} activities`);

// Calculate totals
const runTotal =
  activities.filter((a) => a.type === 'Run').reduce((sum, a) => sum + a.distance, 0) / 1000;
const bikeTotal =
  activities
    .filter((a) => a.type === 'Ride' || a.type === 'VirtualRide')
    .reduce((sum, a) => sum + a.distance, 0) / 1000;
const swimTotal =
  activities.filter((a) => a.type === 'Swim').reduce((sum, a) => sum + a.distance, 0) / 1000;

console.log(`\nAnnual totals:`);
console.log(`- Running: ${runTotal.toFixed(0)} km`);
console.log(`- Cycling: ${bikeTotal.toFixed(0)} km`);
console.log(`- Swimming: ${swimTotal.toFixed(1)} km`);

// Output TypeScript file
const output = `export const mockStravaAthlete = {
  id: 12345678,
  username: 'mock_triathlete',
  firstname: 'Alex',
  lastname: 'Morgan',
  profile: 'https://example.com/profile.jpg',
  city: 'San Francisco',
  state: 'California',
  country: 'United States',
  sex: 'M',
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Comprehensive triathlete training data for 2024
 * Generated: ${new Date().toISOString()}
 *
 * ANNUAL TOTALS:
 * - Running: ${runTotal.toFixed(0)} km (${activities.filter((a) => a.type === 'Run').length} sessions)
 * - Cycling: ${bikeTotal.toFixed(0)} km (${activities.filter((a) => a.type === 'Ride' || a.type === 'VirtualRide').length} sessions)
 * - Swimming: ${swimTotal.toFixed(1)} km (${activities.filter((a) => a.type === 'Swim').length} sessions)
 *
 * TRAINING STRUCTURE:
 * - Swim: 1-2 sessions/week (1200-3800m, pace 1:55-2:20/100m)
 * - Run: 3 sessions/week (easy 8-10km, tempo/intervals 10-13km, long 20-26km)
 * - Bike: 2-3 sessions/week (indoor 40-48km, outdoor 85-120km)
 *
 * RACES (10 total):
 * - Jan: 5K, Feb: 10K, Mar: Half Marathon
 * - May: T100 Triathlon, Jun: 1/8 + 1/4 Triathlon
 * - Jul: 70.3 Ironman, Sep: Full Ironman 140.6
 * - Nov: 15K, Dec: 5K
 */
export const mockStravaActivities = ${JSON.stringify(activities, null, 2)};
`;

console.log('\nWriting to src/mocks/stravaActivities.ts...');
await import('fs').then((fs) => fs.writeFileSync('src/mocks/stravaActivities.ts', output));
console.log('Done!');
